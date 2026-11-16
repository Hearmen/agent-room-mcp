import {fileURLToPath} from 'node:url';
import type {Server} from 'node:http';
import type {Config} from './config.js';
import {createDb} from './storage/index.js';
import {createMcpHandler,verifyMcpServer} from './mcp/index.js';
import {createWebApiHandler} from './web-api/index.js';
import {startHttpServer} from './server.js';
export async function startApp(config:Config){const db=createDb(config.dbPath);const mcp=createMcpHandler({db});let server:Server|undefined;let closing:Promise<void>|undefined;const close=()=>closing??=(async()=>{const stopped=server?new Promise<void>(resolve=>server!.close(()=>resolve())):Promise.resolve();try{await mcp.close();}finally{server?.closeAllConnections();await stopped;db.close();}})();try{server=await startHttpServer({...config,publicDir:fileURLToPath(new URL('../public/',import.meta.url)),mcp,webApi:{handle:createWebApiHandler({db})}});const port=(server.address() as {port:number}).port;let host=config.host==='0.0.0.0'?'127.0.0.1':config.host==='::'?'::1':config.host;if(host.includes(':'))host=`[${host}]`;const url=`http://${host}:${port}`;await verifyMcpServer(`${url}/mcp`);return {url,close};}catch(e){await close();throw e;}}
