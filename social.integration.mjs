import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787';
const suffix=Date.now().toString().slice(-8),a='test-a-'+suffix,b='test-b-'+suffix;
async function req(path='',user,body,expected=200,origin=base){const headers={};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test';}if(body){headers.Origin=origin;if(!(body instanceof FormData))headers['Content-Type']='application/json';}const r=await fetch(base+'/api/social'+path,{headers,method:body?'POST':'GET',body:body?(body instanceof FormData?body:JSON.stringify(body)):undefined});const text=await r.text();assert.equal(r.status,expected,text);try{return JSON.parse(text);}catch{return text;}}
await req('',undefined,undefined,401);
const anon=await fetch(base+'/',{redirect:'manual'});assert.ok([302,303,307].includes(anon.status));assert.match(anon.headers.get('location'),/signin-with-chatgpt/);
await req('',a,{action:'profile',name:'Local Alice',username:'alice_'+suffix});
await req('',b,{action:'profile',name:'Local Bob',username:'alice_'+suffix},409);
await req('',b,{action:'profile',name:'Local Bob',username:'bob_'+suffix});
const search=await req('?action=search&q=alice_'+suffix,b);assert.equal(search.people[0].id,a);
await req('',a,{action:'friend',target:b,mode:'request'});
assert.equal((await req('',b)).requests[0].id,a);
await req('',b,{action:'friend',target:a,mode:'accept'});
assert.equal((await req('?action=search&q=bob_'+suffix,a)).people[0].relation,'friends');
const form=new FormData();form.set('body','Local test activity');form.set('category','Fitness');form.set('photo',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'test.png');await req('',a,form);
const feed=await req('?following=1',b);const post=feed.posts.find(p=>p.author===a);assert.ok(post);
const img=await fetch(base+'/api/social?action=photo&id='+post.id,{headers:{'oai-authenticated-user-id':b}});assert.equal(img.status,200);await img.arrayBuffer();assert.equal(img.headers.get('content-type'),'image/png');
await req('',b,{action:'like',post:post.id,value:true});await req('',b,{action:'like',post:post.id,value:true});assert.equal((await req('',b)).posts.find(p=>p.id===post.id).likes,1);
await req('',b,{action:'comment',post:post.id,body:'Well done, local test!'});assert.equal((await req('?action=comments&id='+post.id,a)).comments.length,1);
await req('',b,{action:'delete',post:post.id},403);
await req('',b,{action:'like',post:post.id,value:false},403,'https://untrusted.example');
await req('',a,{action:'delete',post:post.id});await req('?action=photo&id='+post.id,a,undefined,404);assert.equal((await req('?action=comments&id='+post.id,a)).comments.length,0);
for(const path of ['/','/dashboard','/tasks','/plan','/routine','/wellbeing']){const r=await fetch(base+path,{headers:{'oai-authenticated-user-id':a,'oai-authenticated-user-email':'local@example.test'}});assert.equal(r.status,200,path);}
console.log('PASS: sign-in gate, profiles, unique usernames, friend request/accept, friend feed, photo storage, idempotent likes, comments, ownership, origin checks, deletion and all six pages.');

async function other(endpoint,user,body,status=200){const r=await fetch(base+'/api/'+endpoint,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':user,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
const privateData={tasks:[],checks:[],routine:[],logs:[],available:180};assert.equal((await other('planner',a)).revision,0);assert.equal((await other('planner',a,{data:privateData,revision:0})).revision,1);await other('planner',a,{data:privateData,revision:0},409);assert.equal((await other('planner',b)).data,null);assert.equal((await other('planner',a)).revision,1);
const slot={id:'slot-'+suffix,start:Date.now()+3600000,end:Date.now()+7200000};await other('together',a,slot);assert.equal((await other('together',b)).friends.length,1);await other('together',b,{action:'remove',id:slot.id});assert.equal((await other('together',a)).mine.length,1);await req('',a,{action:'friend',target:b,mode:'remove'});assert.equal((await other('together',b)).friends.length,0);await other('together',a,{action:'remove',id:slot.id});assert.equal((await other('together',a)).mine.length,0);await other('together',a,{...slot,start:Date.now()-3600000},400);
console.log('PASS: planner account isolation, optimistic save conflict, friend-only availability, owner-only removal, friendship revocation, invalid window rejection.');
