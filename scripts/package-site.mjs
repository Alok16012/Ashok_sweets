import {mkdir,copyFile,rename,writeFile,cp,rm} from 'node:fs/promises';
await rm('dist-client',{recursive:true,force:true});
await rename('dist','dist-client');
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await cp('dist-client','dist/client',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/server/index.js',`export default {async fetch(request,env){if(env.ASSETS)return env.ASSETS.fetch(request);return new Response('SWEATSHOP', {headers:{'content-type':'text/plain'}})}};`);
