import {randomBytes,createHash} from 'node:crypto';
import {requireRoom} from '../core/index.js';
import type {Database} from '../storage/index.js';
export class SessionError extends Error {}
const digest=(token:string)=>createHash('sha256').update(token).digest('hex');
export function selectRoom(db:Database,roomId:number){const room=requireRoom(db,roomId);const roomToken=randomBytes(32).toString('base64url');db.prepare('INSERT INTO room_credentials(token_hash,room_id) VALUES(?,?)').run(digest(roomToken),roomId);return {room,roomToken};}
export function requireTokenRoom(db:Database,token:string){const row=db.prepare('SELECT room_id FROM room_credentials WHERE token_hash=?').get(digest(token)) as {room_id:number}|undefined;if(!row)throw new SessionError('invalid room token');return requireRoom(db,row.room_id);}
