import puppeteer from 'puppeteer';

let browser: puppeteer.Browser;
let page: puppeteer.Page;

describe('SvelteKit integration', () => {
	beforeAll(async () => {
		browser = await puppeteer.launch({
			// If you wanna run tests with open browser
			// set your PUPPETEER_HEADLESS env to "false"
			headless: process.env.PUPPETEER_HEADLESS !== 'false',
			args: ['--incognito']
		});
	});
	beforeEach(async () => {
		if (page !== undefined) {
			await page.close();
		}
		const context = await browser.createIncognitoBrowserContext();
		page = await context.newPage();
	});
	afterAll(async () => {
		await browser.close();
	});
	it('index page is showing h1', async () => {
		await page.goto('http://localhost:3007/');
		const element = await page.waitForSelector('h1');
		expect(await element?.evaluate((el) => el.textContent)).toBe(
			'Welcome to SvelteKit - GraphQL Yoga'
		);
	});

	it('go to GraphiQL page', async () => {
		// Go the the right route
		await page.goto('http://localhost:3007/api/graphql?query=query+Hello+%7B%0A%09hello%0A%7D');

		// 1/ Wait for the introspection query result getting our type "hello"
		let res = await page.waitForResponse((res) => res.url().endsWith('/api/graphql'), {
			timeout: 0
		}); // It's the response... It can take a bit of time in the CI... (Magic number to find it easily)
		let json = await res.json();
		let str = JSON.stringify(json, null, 0);
		expect(str).toContain(`"name":"hello"`);

		// 2/ Tigger the default request and wait for the response
		const buttonExecute = await page.waitForSelector(`button[class="execute-button"]`);
		buttonExecute?.click();
		res = await page.waitForResponse((res) => res.url().endsWith('/api/graphql'), {
			timeout: 0
		}); // It's the response... It can take a bit of time in the CI... (Magic number to find it easily)
		json = await res.json();
		str = JSON.stringify(json, null, 0);
		expect(str).toContain(`{"data":{"hello":"SvelteKit - GraphQL Yoga"}}`);
	});
});
