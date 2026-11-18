// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// TODO: change to the real domain once it's bought. Used for canonical URLs and the sitemap.
	site: 'https://pixelweb.digital',
	integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
});
