import type {IncomingMessage,ServerResponse} from 'node:http';
import {z} from 'zod';
import * as core from '../core/index.js';
import {getFacts} from '../memory/index.js';
import type {Database} from '../storage/index.js';
export function createWebApiHandler({db}:{db:Database}){return async(req:IncomingMessage,res:ServerResponse)=>{
 const send=(status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify(data));};
 try {const path=new URL(req.url!,'http://local').pathname;const match=/^\/api\/rooms(?:\/([^/]+)(?:\/facts(?:\/([^/]+))?)?)?$/.exec(path);if(!match){send(404,{error:{code:'NOT_FOUND',message:'route not found'}});return;}
 const isFacts=path.includes('/facts');const allowed=!match[1]?['GET','POST']:!isFacts?['DELETE']:!match[2]?['GET','POST']:['PATCH','DELETE'];
 if(!allowed.includes(req.method!)){res.setHeader('Allow',allowed.join(', '));send(405,{error:{code:'METHOD_NOT_ALLOWED',message:'method not allowed'}});return;}
 const parse=(v:string)=>{if(!/^[1-9][0-9]*$/.test(v))throw new core.CoreError('INVALID_INPUT','invalid id');return core.validId(Number(v));};const room=match[1]?parse(match[1]):0;const fact=match[2]?parse(match[2]):0;
 let input:any;
 if(req.method==='POST'||req.method==='PATCH'){if(req.headers['content-type']?.split(';')[0].trim().toLowerCase()!=='application/json'){send(415,{error:{code:'UNSUPPORTED_MEDIA_TYPE',message:'application/json required'}});return;}let size=0;const chunks:Buffer[]=[];for await(const chunk of req){size+=chunk.length;if(size>1024*1024){send(413,{error:{code:'PAYLOAD_TOO_LARGE',message:'request body exceeds 1 MiB'}});return;}chunks.push(Buffer.from(chunk));}try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new core.CoreError('INVALID_INPUT','invalid JSON');}const schema=!room?z.object({name:z.string(),task:z.string()}).strict():z.object({content:z.string()}).strict();const result=schema.safeParse(input);if(!result.success)throw new core.CoreError('INVALID_INPUT','invalid request fields');input=result.data;}
 if(!room){send(req.method==='GET'?200:201,req.method==='GET'?{rooms:core.listRooms(db)}:{room:core.createRoom(db,input)});return;}
 if(!isFacts){core.deleteRoom(db,room);send(200,{ok:true});return;}
 if(req.method==='GET'){core.requireRoom(db,room);send(200,{facts:getFacts(db,room)});}else if(req.method==='POST')send(201,{fact:core.addFact(db,room,input.content)});else if(req.method==='PATCH')send(200,{fact:core.updateFact(db,room,fact,input.content)});else{core.deleteFact(db,room,fact);send(200,{ok:true});}
 }catch(e){if(e instanceof core.CoreError)send(e.code==='INVALID_INPUT'?400:404,{error:{code:e.code,message:e.message}});else{console.error(e);send(500,{error:{code:'INTERNAL_ERROR',message:'internal error'}});}}
};}
