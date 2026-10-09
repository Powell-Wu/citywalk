import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {staticFiles} from './files.mjs';
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
export async function resourcesFrom(directory){return new Map(await Promise.all((await staticFiles(directory)).map(async name=>[name,await fs.readFile(path.join(directory,name))])));}
export async function serveResources(getResources){
 const requests=[];
 const server=createServer((request,response)=>{
  const url=new URL(request.url,'http://localhost');
  if(!url.pathname.startsWith('/citywalk/')){response.writeHead(404);response.end();return;}
  const name=decodeURIComponent(url.pathname.slice('/citywalk/'.length))||'index.html';
  const bytes=getResources().get(name);requests.push({name,status:bytes?200:404});if(!bytes){response.writeHead(404);response.end('Missing resource');return;}
  response.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store'});response.end(bytes);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {base:`http://127.0.0.1:${server.address().port}/citywalk/`,requests,async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
