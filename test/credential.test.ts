import {it,expect} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDb} from '../src/storage/index.js';
import {createRoom,deleteRoom} from '../src/core/index.js';
import {selectRoom,requireTokenRoom} from '../src/session/index.js';
it('persists credential digests across reopening and invalidates them on deletion',()=>{const dir=mkdtempSync(join(tmpdir(),'room-token-'));let db=createDb(join(dir,'test.db'));try{const room=createRoom(db,{name:'task',task:'test'});const {roomToken}=selectRoom(db,room.roomId);expect(JSON.stringify(db.prepare('SELECT * FROM room_credentials').all())).not.toContain(roomToken);db.close();db=createDb(join(dir,'test.db'));expect(requireTokenRoom(db,roomToken).roomId).toBe(room.roomId);deleteRoom(db,room.roomId);expect(()=>requireTokenRoom(db,roomToken)).toThrow('invalid room token');}finally{db.close();rmSync(dir,{recursive:true,force:true});}});
