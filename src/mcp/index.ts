import {randomUUID} from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {z} from 'zod';
import * as core from '../core/index.js';
import * as session from '../session/index.js';
import {getFacts} from '../memory/index.js';
import type {Database} from '../storage/index.js';
const names=['list_rooms','select_room','get_facts','add_fact','update_fact','delete_fact'];
export function createMcpHandler({db}:{db:Database}) {
 const sessions=new Map<string,{server:McpServer;transport:StreamableHTTPServerTransport}>(); let closing=false;
 return {async handle(req:IncomingMessage,res:ServerResponse){
 if(closing){res.writeHead(503).end();return;}
 const id=req.headers['mcp-session-id'];
 if(id){const entry=typeof id==='string'?sessions.get(id):undefined;if(!entry){res.writeHead(404).end();return;}await entry.transport.handleRequest(req,res);return;}
 if(req.method!=='POST'){res.writeHead(400).end();return;}
 const binding=session.createBinding();const server=new McpServer({name:'agent-room-mcp',version:'1.0.0'});
 const room=()=>session.requireBoundRoom(db,binding).roomId;
 const positive=z.number().int().positive().max(Number.MAX_SAFE_INTEGER); const content=z.string().trim().min(1);
 const register=(name:string,description:string,schema:z.ZodRawShape,fn:(a:any)=>unknown)=>server.registerTool(name,{description,inputSchema:z.object(schema).strict()},async args=>{try{return {content:[{type:'text' as const,text:JSON.stringify(fn(args))}]};}catch(e){const known=e instanceof core.CoreError||e instanceof session.SessionError;if(!known)console.error(e);return {isError:true,content:[{type:'text' as const,text:known?(e as Error).message:'internal error'}]};}});
 register('list_rooms','List rooms and task descriptions to choose the room matching your task.',{},()=>({rooms:core.listRooms(db)}));
 register('select_room','Bind this MCP session to one room matching your task. You cannot switch rooms; reuse this session for your task.',{roomId:positive},a=>({room:session.selectRoom(db,binding,a.roomId)}));
 register('get_facts','Read all current facts in the selected room, with full content and timestamps.',{},()=>({facts:getFacts(db,room())}));
 register('add_fact','Share a breakthrough or task constraint in the selected room. Include useful evidence. Exclude irrelevant, trivial or routine progress notes. Read existing facts to avoid duplicates.',{content},a=>({fact:core.addFact(db,room(),a.content)}));
 register('update_fact','Correct or improve any fact in the selected room with complete replacement content. Preserve evidence; include only breakthroughs or task constraints.',{factId:positive,content},a=>({fact:core.updateFact(db,room(),a.factId,a.content)}));
 register('delete_fact','Permanently delete any incorrect, obsolete, irrelevant or trivial fact in the selected room.',{factId:positive},a=>{core.deleteFact(db,room(),a.factId);return {ok:true};});
 const transport=new StreamableHTTPServerTransport({sessionIdGenerator:randomUUID,onsessioninitialized:id=>{sessions.set(id,{server,transport});}});
 transport.onclose=()=>{if(transport.sessionId)sessions.delete(transport.sessionId);};
 try{await server.connect(transport);await transport.handleRequest(req,res);if(!transport.sessionId)await server.close();}catch(e){if(transport.sessionId)sessions.delete(transport.sessionId);await server.close();throw e;}
 },async close(){closing=true;await Promise.allSettled([...sessions.values()].map(x=>x.server.close()));sessions.clear();}};
}
export async function verifyMcpServer(url:string,timeoutMs=5000){const client=new Client({name:'startup-check',version:'1.0.0'});const transport=new StreamableHTTPClientTransport(new URL(url));try{await Promise.race([(async()=>{await client.connect(transport);const result=await client.listTools();if(result.tools.length!==names.length||names.some(n=>!result.tools.some(t=>t.name===n)))throw new Error('unexpected tool list');})(),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('timeout')),timeoutMs);timer.unref();})]);}catch(e){throw new Error(`MCP self-check failed at ${url}: ${String(e)}`);}finally{await Promise.race([(async()=>{try{await transport.terminateSession();}finally{await client.close();}})(),new Promise<void>(resolve=>{const t=setTimeout(resolve,1000);t.unref();})]);}}
