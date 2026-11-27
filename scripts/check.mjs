import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function files(dir){let list=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${e.name}`;if(e.isDirectory())list.push(...await files(p));else list.push(p);}return list;}
const sources=(await files('src')).filter(f=>f.endsWith('.js'));
for(const file of sources){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exit(r.status);}}
const html=await readFile('index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))await readFile(match[1]);
console.log(`Checked syntax in ${sources.length} JavaScript modules and HTML entry assets.`);
