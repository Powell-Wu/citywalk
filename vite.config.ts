import {defineConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {brand} from './src/lib/config/brand.ts';
export default defineConfig({
 base:'/citywalk/',
 plugins:[svelte(),{name:'citywalk-brand',transformIndexHtml(html){return html.replaceAll('__BRAND_TITLE__',brand.title).replaceAll('__BRAND_SHORT__',brand.shortName).replaceAll('__BRAND_DESCRIPTION__',brand.description);}}],
 build:{outDir:process.env.CITYWALK_BUILD_DIR||'dist',emptyOutDir:true,sourcemap:false},
});
