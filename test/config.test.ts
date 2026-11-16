import {it,expect} from 'vitest';
import {loadConfig} from '../src/config.js';
it('validates config and gives flags precedence',()=>{expect(loadConfig(['--port','0'],{AGENT_ROOM_PORT:'5000'}).port).toBe(0);for(const args of [['--port','-1'],['--port','65536'],['--port','1.2'],['--db'],['--unknown','x']])expect(()=>loadConfig(args,{})).toThrow();});
