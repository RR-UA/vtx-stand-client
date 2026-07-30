import tailwindcss from '@tailwindcss/vite';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

import * as crypto from 'crypto';
import * as path from 'path';

const define = {
	__RELEASES_URL__: `https://github.com/**/v${process.env.npm_package_version}`,
	__APP_DESC__: ``,
	__APP_VERSION__: process.env.npm_package_version || '',
	__APP_NAME__: process.env.npm_package_name || '',
	__BASE_PATH__: process.env.BASE_PATH || ''
};

// https://vite.dev/config/
export default defineConfig({
	base: define.__BASE_PATH__,

	define: Object.fromEntries(
		Object.entries(define).map(([key, value]) => [key, JSON.stringify(value)])
	),

	server: {
		host: '0.0.0.0',
		port: 3000
	},

	html: {
		cspNonce: crypto.randomBytes(6).toString('hex')
	},

	plugins: [
		svelte(),
		tailwindcss(),
		{
			name: 'html-transform',
			transformIndexHtml(html) {
				return html
					.replace(/__APP_NAME__/g, define.__APP_NAME__)
					.replace(/__APP_DESC__/g, define.__APP_DESC__);
			}
		}
	],

	resolve: {
		alias: {
			$: path.resolve(__dirname, 'src')
		}
	}
});
