import type { UserConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

const config: UserConfig = {
	plugins: [sveltekit()],
	resolve: {
		alias: {
			tslib: 'tslib/tslib.es6.js'
		}
	}
};

export default config;
