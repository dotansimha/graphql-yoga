import { execSync, spawn } from 'child_process';
import puppeteer, { Browser, Page } from 'puppeteer';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

let browser: Browser;
let page: Page;
let sveltekitProcess: ReturnType<typeof spawn>;

const timings = {
	setup: {
		waitAfterPreview: 5000,
		total: 20000 // build + preview + {waitAfterPreview} is expected to be less than 20sec
	},
	waitForSelector: 999,
	waitForResponse: 1999
};
let toSkip = false;

// const tslibAdd = `
// 	export default {
// 		__assign: __assign,
// 		__rest: __rest,
// 		__decorate: __decorate,
// 		__param: __param,
// 		__metadata: __metadata,
// 		__awaiter: __awaiter,
// 		__generator: __generator,
// 		__exportStar: __exportStar,
// 		__values: __values,
// 		__read: __read,
// 		__spread: __spread,
// 		__spreadArrays: __spreadArrays,
// 		__spreadArray: __spreadArray,
// 		__await: __await,
// 		__asyncGenerator: __asyncGenerator,
// 		__asyncDelegator: __asyncDelegator,
// 		__asyncValues: __asyncValues,
// 		__makeTemplateObject: __makeTemplateObject,
// 		__importStar: __importStar,
// 		__importDefault: __importDefault,
// 		__classPrivateFieldGet: __classPrivateFieldGet,
// 		__classPrivateFieldSet: __classPrivateFieldSet,
// 		__classPrivateFieldIn: __classPrivateFieldIn
// 	}
// `;

describe('SvelteKit integration', () => {
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
		const nodeVersion = execSync('node -v').toString();
		if (nodeVersion.includes('v12')) {
			toSkip = true;
		}

		if (!toSkip) {
			// Kill the port if it's used!
			try {
				execSync('fuser -k 3007/tcp');
				// eslint-disable-next-line no-empty
			} catch (error) {}

			// Build svelteKit
			console.log('run "pnpm --filter example-sveltekit build" (output is piped into process)');
			execSync('pnpm --filter example-sveltekit build', { stdio: 'inherit' });

			// Start sveltekit
			sveltekitProcess = spawn('pnpm', ['--filter', 'example-sveltekit', 'preview']);

			// Wait for sveltekit to start
			await new Promise((resolve) => setTimeout(resolve, timings.setup.waitAfterPreview));

			// Launch puppeteer
			browser = await puppeteer.launch({
				// If you wanna run tests with open browser
				// set your PUPPETEER_HEADLESS env to "false"
				headless: process.env.PUPPETEER_HEADLESS !== 'false',
				args: ['--incognito']
			});
		}

		// How long it took?
	}, timings.setup.total);

	beforeEach(async () => {
		if (!toSkip) {
			if (page !== undefined) {
				await page.close();
			}
			const context = await browser.createIncognitoBrowserContext();
			page = await context.newPage();
		}
	});

	afterAll(async () => {
		if (!toSkip) {
			await browser.close();
			sveltekitProcess.kill();
		}
	});

	it('index page is showing h1', async () => {
		if (!toSkip) {
			await page.goto('http://localhost:3007/');
			const element = await page.waitForSelector('h1', { timeout: timings.waitForSelector });
			expect(await element?.evaluate((el) => el.textContent)).toBe(
				'Welcome to SvelteKit - GraphQL Yoga'
			);
		}
	});

	it('go to GraphiQL page', async () => {
		if (!toSkip) {
			// Go the right route
			const body = await page.goto(
				'http://localhost:3007/api/graphql?query=query+Hello+%7B%0A%09hello%0A%7D'
			);

			const bodyContent = await body?.text();
			// B/ Check that GraphiQL is showing
			expect(bodyContent).toContain(`Yoga GraphiQL`);

			// C/ Tigger the default request and wait for the response
			const [res] = await Promise.all([
				page.waitForResponse((res) => res.url().endsWith('/api/graphql'), {
					timeout: timings.waitForResponse
				}),
				page.click(`.graphiql-execute-button`)
			]);

			const json = await res.json();
			const str = JSON.stringify(json, null, 0);
			expect(str).toContain(`{"data":`);
			expect(str).not.toContain('"errors"');
		}
	});
});
