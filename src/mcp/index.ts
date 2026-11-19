import type {IncomingMessage,ServerResponse} from 'node:http';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {z} from 'zod';
import * as core from '../core/index.js';
import * as session from '../session/index.js';
import {getFacts} from '../memory/index.js';
import type {Fact,Database} from '../storage/index.js';
const agentFact=({createdAt,updatedAt,...fact}:Fact)=>fact;
const names=['list_rooms','select_room','get_facts','add_fact','update_fact','delete_fact'];
export function createMcpHandler({db}:{db:Database}) {
 const active=new Set<McpServer>();let closing=false;
 return {async handle(req:IncomingMessage,res:ServerResponse){
 if(closing){res.writeHead(503).end();return;}
 if(req.method!=='POST'){res.writeHead(405,{Allow:'POST'}).end();return;}
 const server=new McpServer({name:'agent-room-mcp',version:'1.0.0'});
 const room=(token:string)=>session.requireTokenRoom(db,token).roomId;
 const positive=z.number().int().positive().max(Number.MAX_SAFE_INTEGER); const content=z.string().trim().min(1); const roomToken=z.string().trim().min(1);
 const register=(name:string,description:string,schema:z.ZodRawShape,fn:(a:any)=>unknown)=>server.registerTool(name,{description,inputSchema:z.object(schema).strict()},async args=>{try{return {content:[{type:'text' as const,text:JSON.stringify(fn(args))}]};}catch(e){const known=e instanceof core.CoreError||e instanceof session.SessionError;if(!known)console.error(e);return {isError:true,content:[{type:'text' as const,text:known?(e as Error).message:'internal error'}]};}});
 register('list_rooms','List rooms and task descriptions to choose the room matching your task.',{},()=>({rooms:core.listRooms(db)}));
 register('select_room','Choose the room matching your task and retain the returned roomToken. Use one roomToken throughout your agent work session, including after reconnects.',{roomId:positive},a=>session.selectRoom(db,a.roomId));
 register('get_facts','Read all current facts in the selected room. Each fact contains factId, roomId, type and full content. Supply the roomToken returned by select_room.',{roomToken},a=>({facts:getFacts(db,room(a.roomToken)).map(agentFact)}));
 register('add_fact','Share a breakthrough or task constraint in the selected room. Include useful evidence. Exclude irrelevant, trivial or routine progress notes. Read existing facts to avoid duplicates.',{roomToken,content},a=>({fact:agentFact(core.addFact(db,room(a.roomToken),a.content))}));
 register('update_fact','Correct or improve any fact in the selected room with complete replacement content. Preserve evidence; include only breakthroughs or task constraints.',{roomToken,factId:positive,content},a=>({fact:agentFact(core.updateFact(db,room(a.roomToken),a.factId,a.content))}));
 register('delete_fact','Permanently delete any incorrect, obsolete, irrelevant or trivial fact in the selected room.',{roomToken,factId:positive},a=>{core.deleteFact(db,room(a.roomToken),a.factId);return {ok:true};});
 const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
 active.add(server);let cleaned=false;const cleanup=async()=>{if(cleaned)return;cleaned=true;active.delete(server);await server.close();};
 res.once('close',()=>{void cleanup().catch(console.error);});
 try{await server.connect(transport);await transport.handleRequest(req,res);}catch(e){await cleanup();throw e;}
 },async close(){closing=true;await Promise.allSettled([...active].map(s=>s.close()));active.clear();}};
}

export async function verifyMcpServer(url:string,token:string,timeoutMs=5000){const client=new Client({name:'startup-check',version:'1.0.0'});const transport=new StreamableHTTPClientTransport(new URL(url),{requestInit:{headers:{Authorization:`Bearer ${token}`}}});try{await Promise.race([(async()=>{await client.connect(transport);const result=await client.listTools();if(result.tools.length!==names.length||names.some(n=>!result.tools.some(t=>t.name===n)))throw new Error('unexpected tool list');})(),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('timeout')),timeoutMs);timer.unref();})]);}catch(e){throw new Error(`MCP self-check failed at ${url}: ${String(e)}`);}finally{await Promise.race([(async()=>{await client.close();})(),new Promise<void>(resolve=>{const t=setTimeout(resolve,1000);t.unref();})]);}}
