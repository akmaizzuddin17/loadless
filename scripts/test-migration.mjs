import { PGlite } from '@electric-sql/pglite';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';

const modules=new Map();
function load(file){
 const path=resolve(file.endsWith('.ts')?file:file+'.ts');
 if(modules.has(path))return modules.get(path);
 const mod={exports:{}}; modules.set(path,mod.exports);
 const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)(name=>name==='@/lib/social-server'?server:load(name.startsWith('@/')?name.slice(2):resolve(dirname(path),name)),mod,mod.exports);
 return mod.exports;
}
const {prepareQuery,normalizeRow}=load('lib/sql-compat.ts');
const db=new PGlite();
await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
await db.exec(readFileSync('supabase/migrations/001_loadless.sql','utf8'));
function statement(sql,params=[]){return {
 bind(...values){return statement(sql,values);},
 async all(){const r=await db.query(prepareQuery(sql),params);return {results:r.rows.map(normalizeRow)};},
 async first(){return (await this.all()).results[0]??null;},
 async run(){const r=await db.query(prepareQuery(sql),params);return {meta:{changes:r.affectedRows}};},
};}
let viewer=null;
const files=new Map();
const DB={prepare:statement,async batch(statements){for(const s of statements)await s.run();}};
const server={
 storage:()=>({DB,BUCKET:{async put(key,bytes,opts){files.set(key,{body:new Blob([bytes]),httpMetadata:opts.httpMetadata});},async get(key){return files.get(key);},async delete(key){for(const k of Array.isArray(key)?key:[key])files.delete(k);}}}),
 identity:async()=>{if(!viewer)throw new Response('Sign in',{status:401});return viewer;},
 json:(data,status=200)=>Response.json(data,{status}),
 boundedBody:async(req,limit)=>{const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length>limit)throw new Response('Too large',{status:413});return bytes;},
 fail:e=>{if(e instanceof Response)return e;throw e;},
};
const social=load('app/api/social/route.ts'),planner=load('app/api/planner/route.ts'),together=load('app/api/together/route.ts');
async function request(route,method='GET',data,query='',status=200,origin='https://loadless.test'){
 const multipart=data instanceof FormData;
 const response=await route[method](new Request('https://loadless.test/api/test'+query,{method,headers:{origin,...(data&&!multipart?{'content-type':'application/json'}:{})},body:data?(multipart?data:JSON.stringify(data)):undefined}));
 assert.equal(response.status,status,await response.clone().text());
 return response.headers.get('content-type')?.includes('application/json')?response.json():response;
}
try {
 for(const route of [social,planner,together])await request(route,'GET',undefined,'',401);
 viewer='alice';await request(social,'POST',{action:'profile',name:'Alice Student',username:'alice'});
 viewer='bob';await request(social,'POST',{action:'profile',name:'Bob Student',username:'alice'},'',409);
 await request(social,'POST',{action:'profile',name:'Bob Student',username:'bob'});
 viewer='alice';
 assert.equal((await request(social,'GET',undefined,'?action=search&q=bob')).people[0].username,'bob');
 await request(social,'POST',{action:'friend',target:'bob'});
 viewer='bob';assert.equal((await request(social)).requests.length,1);
 await request(social,'POST',{action:'friend',target:'alice',mode:'accept'});
 const photo=new FormData();photo.set('body','A good walk');photo.set('category','Social');photo.set('photo',new File([new Uint8Array([137,80,78,71,13,10,26,10])],'walk.png',{type:'image/png'}));
 await request(social,'POST',photo);
 const post=(await request(social)).posts[0];assert.equal(typeof post.cursor,'number');
 viewer='alice';await request(social,'POST',{action:'like',post:post.id,value:true});await request(social,'POST',{action:'like',post:post.id,value:true});
 await request(social,'POST',{action:'comment',post:post.id,body:'Nice!'});
 const feed=await request(social,'GET',undefined,'?following=1');assert.equal(feed.posts[0].likes,1);assert.equal(feed.posts[0].comments,1);
 assert.equal((await request(social,'GET',undefined,`?action=comments&id=${post.id}`)).comments[0].body,'Nice!');
 await request(social,'GET',undefined,`?action=photo&id=${post.id}`);
 await request(social,'POST',{action:'delete',post:post.id},'',403);
 await request(social,'POST',{action:'like',post:post.id,value:false},'',403,'https://evil.test');
 const data={tasks:[],checks:[],routine:[],logs:[],available:240};
 await request(planner,'POST',{data,revision:0});await request(planner,'POST',{data,revision:0},'',409);
 await request(planner,'POST',{data,revision:1});assert.equal((await request(planner)).revision,2);
 viewer='bob';assert.equal((await request(planner)).data,null);
 const start=Date.now()+3600000,end=start+1800000;
 await request(together,'POST',{id:'window',start,end});
 viewer='alice';assert.equal((await request(together)).friends.length,1);
 await request(together,'POST',{action:'invite',slot:'window',activity:'Walk'});
 await request(together,'POST',{action:'invite',slot:'window',activity:'Walk'},'',409);
 viewer='bob';const invite=(await request(together)).invites[0];assert.equal(invite.senderName,'Alice Student');
 await request(together,'POST',{action:'respond',id:invite.id,status:'accepted'});
 await request(together,'POST',{action:'remove',id:'window'});assert.equal((await request(together)).mine.length,0);
 await request(social,'POST',{action:'delete',post:post.id});assert.equal(files.size,0);
 assert.equal((await DB.prepare('SELECT count(*) AS n FROM likes').first()).n,0);
 // Direct browser roles cannot bypass server authorization.
 await db.exec('SET ROLE anon;');
 await assert.rejects(()=>db.query('SELECT * FROM planner_state'),/permission denied/);
 await db.exec('RESET ROLE;');
 console.log('PASS: PostgreSQL routes, two-user isolation, profiles, friends, posts/photos, reactions, invitations, optimistic saves, origin checks, and database access restrictions.');
}finally{await db.close();}
