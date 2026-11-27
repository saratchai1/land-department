import { mkdir, cp, rm, readFile } from 'node:fs/promises';
const pkg=JSON.parse(await readFile('package.json','utf8'));
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of ['index.html','src','public']) await cp(file,`dist/${file}`,{recursive:true});
console.log(`Built ${pkg.name} ${pkg.version} → dist/ (no external runtime dependencies)`);
