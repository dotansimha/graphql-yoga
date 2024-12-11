import { execSync, spawn } from 'node:child_process';
import { Browser, chromium, ElementHandle, Page } from 'playwright';
import { promises as fsPromises } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as setTimeout$ } from 'node:timers/promises';
import { fetch } from '@whatwg-node/fetch';

let browser: Browser;
let page: Page;
let sveltekitProcess: ReturnType<typeof spawn>;

const timings = {
	setup: {
		waitAfterPreview: 5000,
		total: 20_000 // build + preview + {waitAfterPreview} is expected to be less than 20sec
	},
	waitForSelector: 999,
	waitForResponse: 1999
};

describe('SvelteKit integration', () => {
	if (process.env.LEAKS_TEST) {
		it('dummy', () => {
			return;
		});
		return;
	}
	beforeAll(async () => {
		const tslibDirPath = join(__dirname, '../node_modules/tslib');
		const tslibFilePath = join(tslibDirPath, 'tslib.js');
		const tslibFile = await fsPromises.readFile(tslibFilePath, 'utf8');
		const tslibPackageJsonPath = join(tslibDirPath, 'package.json');
		const tslibPackageJson = await fsPromises.readFile(tslibPackageJsonPath, 'utf8');
		const tslibPackageJsonParsed = JSON.parse(tslibPackageJson);
		tslibPackageJsonParsed.type = 'module';
		tslibPackageJsonParsed.main = 'tslib.cjs';
		if (tslibPackageJsonParsed.exports?.['.']?.default) {
			tslibPackageJsonParsed.exports['.'].default = './tslib.cjs';
		}
		await fsPromises.writeFile(
			tslibPackageJsonPath,
			JSON.stringify(tslibPackageJsonParsed, null, 2)
		);
		await fsPromises.writeFile(tslibFilePath.replace('.js', '.cjs'), tslibFile);

		// Kill the port if it's used!
		try {
			execSync('fuser -k 3007/tcp');
			// eslint-disable-next-line no-empty
		} catch (error) {}

		// Build svelteKit
		execSync('pnpm --filter example-sveltekit build');

		// Start sveltekit
		sveltekitProcess = spawn('pnpm', ['--filter', 'example-sveltekit', 'preview']);

		// Wait for sveltekit to start
		await setTimeout$(timings.setup.waitAfterPreview);

		// Launch puppeteer
		browser = await chromium.launch({
			// If you wanna run tests with open browser
			// set your PLAYWRIGHT_HEADLESS env to "false"
			headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
			args: ['--incognito', '--no-sandbox', '--disable-setuid-sandbox']
		});

		// How long it took?
	}, timings.setup.total);

	beforeEach(async () => {
		if (page !== undefined) {
			await page.close();
		}
		const context = await browser.newContext();
		page = await context.newPage();
	});

	afterAll(async () => {
		await browser.close();
		sveltekitProcess.kill();
	});

	it('index page is showing h1', async () => {
		await page.goto('http://localhost:3007/');
		return expect(
			page
				.waitForSelector('h1', { timeout: timings.waitForSelector })
				.then((el) => el?.evaluate((el) => el.textContent))
		).resolves.toBe('Welcome to SvelteKit - GraphQL Yoga');
	});

	it('GraphQL request', () => {
		return expect(
			fetch('http://localhost:3007/api/graphql?query=query+Hello+%7B%0A%09hello%0A%7D').then(
				(res) => res.json()
			)
		).resolves.toEqual({ data: { hello: 'SvelteKit - GraphQL Yoga' } });
	});
});
