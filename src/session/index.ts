import { requireRoom } from '../core/index.js';
import type { Database } from '../storage/index.js';
export interface SessionBinding {roomId:number|null}
export class SessionError extends Error {}
export const createBinding=():SessionBinding=>({roomId:null});
export function selectRoom(db:Database,b:SessionBinding,id:number){if(b.roomId!==null&&b.roomId!==id)throw new SessionError(`session is already bound to room ${b.roomId}`);const room=requireRoom(db,id);b.roomId=id;return room;}
export function requireBoundRoom(db:Database,b:SessionBinding){if(b.roomId===null)throw new SessionError('select a room first');return requireRoom(db,b.roomId);}
