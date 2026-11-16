import * as s from '../storage/index.js';
export class CoreError extends Error {constructor(public code:'INVALID_INPUT'|'ROOM_NOT_FOUND'|'FACT_NOT_FOUND',message:string){super(message);}}
export function validId(id:number){if(!Number.isSafeInteger(id)||id<=0)throw new CoreError('INVALID_INPUT','id must be a positive safe integer');return id;}
function text(v:string){if(typeof v!=='string'||!v.trim())throw new CoreError('INVALID_INPUT','text must not be empty');return v.trim();}
export function requireRoom(db:s.Database,id:number){const r=s.getRoom(db,validId(id));if(!r)throw new CoreError('ROOM_NOT_FOUND',`room not found: ${id}`);return r;}
export const listRooms=s.listRooms;
export function createRoom(db:s.Database,input:{name:string;task:string}){return s.insertRoom(db,text(input.name),text(input.task));}
export function deleteRoom(db:s.Database,id:number){s.runInTransaction(db,()=>{requireRoom(db,id);s.deleteRoom(db,id);});}
export function addFact(db:s.Database,room:number,content:string){return s.runInTransaction(db,()=>{requireRoom(db,room);return s.insertFact(db,room,text(content));});}
function requireFact(db:s.Database,room:number,id:number){requireRoom(db,room);if(!s.getFact(db,room,validId(id)))throw new CoreError('FACT_NOT_FOUND',`fact not found: ${id}`);}
export function updateFact(db:s.Database,room:number,id:number,content:string){return s.runInTransaction(db,()=>{requireFact(db,room,id);return s.updateFact(db,room,id,text(content))!;});}
export function deleteFact(db:s.Database,room:number,id:number){s.runInTransaction(db,()=>{requireFact(db,room,id);s.deleteFact(db,room,id);});}
