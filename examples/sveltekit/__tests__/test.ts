import { expect, test } from '@playwright/test';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('index page has 6 responses', async ({ page }) => {
	let nbOfResponse = 0;

	// page.on('request', (request) => console.log('>>', request.method(), request.url()));
	page.on('response', (response) => {
		nbOfResponse++;
		// console.log('<<', response.status(), response.url());
	});

	await page.goto('/');

	expect(nbOfResponse).toBe(6);
	// expect(await page.textContent('h1')).toBe('Welcome to SvelteKit');
});

test('graphiql is rendered and 2 introspections query are done', async ({ page }) => {
	const requestList = [];
	const responseList = [];

	page.on('request', async (request) => {
		const item = ['>>', request.method(), request.url()];
		requestList.push(item);
		console.log(item);
	});
	page.on('response', async (response) => {
		const item = ['<<', response.status(), response.url(), response.statusText()];
		responseList.push(item);
		console.log(item);
	});

	await page.goto('/api/graphql');
	await delay(1000);
	expect(requestList.length).toBe(3);
	expect(responseList.length).toBe(3);
});
