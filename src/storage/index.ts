import SQLite from 'better-sqlite3';
export type Database = SQLite.Database;
export interface Room { roomId:number; name:string; task:string; createdAt:string }
export interface Fact { factId:number; roomId:number; type:'fact'; content:string; createdAt:string; updatedAt:string }
export function createDb(path:string):Database { const db=new SQLite(path); try { db.pragma('foreign_keys = ON'); db.pragma('journal_mode = WAL'); db.exec(`CREATE TABLE IF NOT EXISTS rooms(room_id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,task TEXT NOT NULL,created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS facts(fact_id INTEGER PRIMARY KEY AUTOINCREMENT,room_id INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,content TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS room_credentials(token_hash TEXT PRIMARY KEY,room_id INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE); CREATE INDEX IF NOT EXISTS facts_room_id ON facts(room_id,fact_id);`); return db; } catch(e){db.close();throw e;} }
export const createTestDb=()=>createDb(':memory:');
export function runInTransaction<T>(db:Database,fn:()=>T):T{return db.transaction(fn)();}
const roomColumns='room_id AS roomId,name,task,created_at AS createdAt';
const factColumns="fact_id AS factId,room_id AS roomId,'fact' AS type,content,created_at AS createdAt,updated_at AS updatedAt";
export function getRoom(db:Database,id:number){return db.prepare(`SELECT ${roomColumns} FROM rooms WHERE room_id=?`).get(id) as Room|undefined ?? null;}
export function listRooms(db:Database){return db.prepare(`SELECT ${roomColumns} FROM rooms ORDER BY room_id`).all() as Room[];}
export function insertRoom(db:Database,name:string,task:string){const r=db.prepare('INSERT INTO rooms(name,task,created_at) VALUES(?,?,?)').run(name,task,new Date().toISOString());return getRoom(db,Number(r.lastInsertRowid))!;}
export function deleteRoom(db:Database,id:number){return db.prepare('DELETE FROM rooms WHERE room_id=?').run(id).changes>0;}
export function getFact(db:Database,room:number,id:number){return db.prepare(`SELECT ${factColumns} FROM facts WHERE room_id=? AND fact_id=?`).get(room,id) as Fact|undefined ?? null;}
export function listFacts(db:Database,room:number){return db.prepare(`SELECT ${factColumns} FROM facts WHERE room_id=? ORDER BY fact_id`).all(room) as Fact[];}
export function insertFact(db:Database,room:number,content:string){const now=new Date().toISOString();const r=db.prepare('INSERT INTO facts(room_id,content,created_at,updated_at) VALUES(?,?,?,?)').run(room,content,now,now);return getFact(db,room,Number(r.lastInsertRowid))!;}
export function updateFact(db:Database,room:number,id:number,content:string){db.prepare('UPDATE facts SET content=?,updated_at=? WHERE room_id=? AND fact_id=?').run(content,new Date().toISOString(),room,id);return getFact(db,room,id);}
export function deleteFact(db:Database,room:number,id:number){return db.prepare('DELETE FROM facts WHERE room_id=? AND fact_id=?').run(room,id).changes>0;}
