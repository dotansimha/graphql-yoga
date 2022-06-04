import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	reporter: true ? [['list'], ['html', { open: 'never' }], ['github']] : [['list']],
	use: {
		screenshot: 'only-on-failure'
	},
	webServer: {
		command: 'npm run build && npm run preview',
		port: 3000
	}
};

export default config;
