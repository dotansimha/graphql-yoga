import { expect, test } from '@playwright/test';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('index page is showing h1', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('h1')).toBe('Welcome to SvelteKit - GraphQL Yoga');
});

test('go to GraphiQL page', async ({ page }) => {
	// Go the the right route
	await page.goto('/api/graphql');

	// 1/ Wait for the introspection query result getting our type "hello"
	let res = await page.waitForResponse('/api/graphql', { timeout: 1999 }); // It's the response... It can take a bit of time in the CI... (Magic number to find it easily)
	let json = await res.json();
	let str = JSON.stringify(json, null, 0);
	expect(str).toContain(`\"name\":\"hello\"`);

	// I don't know why, but I think there is 2 time the introspection query!
	// Maybe this needs to be fixed? And we should do expect no query at this stage
	res = await page.waitForResponse('/api/graphql', { timeout: 1999 });

	// 2/ Tigger the default request and wait for the response
	const buttonExecute = page.locator(`button[class="execute-button"]`);
	buttonExecute.click();
	res = await page.waitForResponse('/api/graphql', { timeout: 1999 }); // It's the response... It can take a bit of time in the CI... (Magic number to find it easily)
	json = await res.json();
	str = JSON.stringify(json, null, 0);
	expect(str).toContain(`{\"data\":{\"hello\":\"SvelteKit - GraphQL Yoga\"}}`);
});
