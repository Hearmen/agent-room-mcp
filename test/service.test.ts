import {describe,it,expect} from 'vitest';
import {startApp} from '../src/app.js';
import {createTestDb,runInTransaction,listRooms} from '../src/storage/index.js';
import * as core from '../src/core/index.js';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
describe('storage and core',()=>{it('rolls back, isolates room facts and cascades deletion',()=>{const db=createTestDb();try{expect(()=>runInTransaction(db,()=>{core.createRoom(db,{name:'x',task:'x'});throw new Error('rollback');})).toThrow();expect(listRooms(db)).toEqual([]);const a=core.createRoom(db,{name:'a',task:'a'}),b=core.createRoom(db,{name:'b',task:'b'});const f=core.addFact(db,a.roomId,' evidence ');expect(f.content).toBe('evidence');expect(()=>core.updateFact(db,b.roomId,f.factId,'bad')).toThrow('fact not found');expect(()=>core.deleteFact(db,b.roomId,f.factId)).toThrow();expect(core.updateFact(db,a.roomId,f.factId,'new').createdAt).toBe(f.createdAt);core.deleteRoom(db,a.roomId);expect(db.prepare('SELECT * FROM facts').all()).toEqual([]);expect(()=>core.addFact(db,b.roomId,' ')).toThrow();}finally{db.close();}});});
it('serves the frontend, user API and isolated stateful MCP sessions',async()=>{const app=await startApp({host:'127.0.0.1',port:0,dbPath:':memory:'});const clients:Client[]=[];const transports:StreamableHTTPClientTransport[]=[];try{
const request=async(path:string,method='GET',body?:unknown)=>{const r=await fetch(app.url+'/api/rooms'+path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
const a=(await request('','POST',{name:'a',task:'task a'})).data.room;const b=(await request('','POST',{name:'b',task:'task b'})).data.room;
expect((await fetch(app.url)).status).toBe(200);expect((await request('','POST',{bad:true})).status).toBe(400);expect((await request('/01/facts')).status).toBe(400);
for(let i=0;i<2;i++){const c=new Client({name:'test',version:'1'});const t=new StreamableHTTPClientTransport(new URL(app.url+'/mcp'));await c.connect(t);clients.push(c);transports.push(t);}
const call=(i:number,name:string,args={})=>clients[i].callTool({name,arguments:args});
expect((await call(0,'get_facts')).isError).toBe(true);await call(0,'select_room',{roomId:a.roomId});await call(1,'select_room',{roomId:b.roomId});expect((await call(0,'select_room',{roomId:b.roomId})).isError).toBe(true);
const result=await call(0,'add_fact',{content:'Constraint: only one task per room'});const fact=JSON.parse((result.content as any)[0].text).fact;
expect((await call(1,'update_fact',{factId:fact.factId,content:'bad'})).isError).toBe(true);
expect((await request(`/${a.roomId}/facts`)).data.facts).toHaveLength(1);
expect((await request(`/${a.roomId}/facts/${fact.factId}`,'PATCH',{content:'updated'})).status).toBe(200);
expect(JSON.parse(((await call(0,'get_facts')).content as any)[0].text).facts[0].content).toBe('updated');
await request('/'+a.roomId,'DELETE');expect((await call(0,'get_facts')).isError).toBe(true);expect((await call(0,'select_room',{roomId:b.roomId})).isError).toBe(true);
expect((await fetch(app.url+'/api/rooms',{method:'POST',headers:{Origin:'http://foreign','Content-Type':'application/json'},body:'{}'})).status).toBe(403);
}finally{for(const t of transports)await t.terminateSession();for(const c of clients)await c.close();await app.close();await app.close();}},15000);
