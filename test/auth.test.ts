import {it,expect} from 'vitest';
import {mkdtempSync,readFileSync,statSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadToken,authorized} from '../src/auth.js';

it('generates a private deployment token, persists it and fails closed on corruption',()=>{
 const dir=mkdtempSync(join(tmpdir(),'deployment-auth-'));
 try{
  const db=join(dir,'app.db'),token=loadToken(db);
  expect(token).toMatch(/^[a-f0-9]{64}$/);
  expect(readFileSync(db+'.token','utf8').trim()).toBe(token);
  expect(statSync(db+'.token').mode&0o777).toBe(0o600);
  expect(loadToken(db)).toBe(token);
  expect(loadToken(join(dir,'other.db'))).not.toBe(token);
  expect(authorized(`Bearer ${token}`,token)).toBe(true);
  for(const header of [undefined,'',token,'Bearer wrong',`Bearer ${token}extra`])expect(authorized(header,token)).toBe(false);
  writeFileSync(db+'.token','');
  expect(()=>loadToken(db)).toThrow('Invalid token file');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
