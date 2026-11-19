import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

/** Keep the deployment credential separate from room-scoped credentials. */
export function loadToken(dbPath:string):string {
 if(dbPath===':memory:')return randomBytes(32).toString('hex');
 const path=`${dbPath}.token`;
 try{writeFileSync(path,randomBytes(32).toString('hex')+'\n',{flag:'wx',mode:0o600});}
 catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}
 const token=readFileSync(path,'utf8').trim();
 if(!/^[a-f0-9]{64}$/.test(token))throw new Error(`Invalid token file: ${path}`);
 return token;
}
export function authorized(header:string|undefined,token:string):boolean {
 if(!header?.startsWith('Bearer '))return false;
 const digest=(value:string)=>createHash('sha256').update(value).digest();
 return timingSafeEqual(digest(header.slice(7)),digest(token));
}
