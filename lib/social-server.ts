import {database} from './database';
import {adminClient} from './supabase/admin';
import {currentUser} from './auth';
export function storage(){return {DB:database,BUCKET:{
 async get(key:string){const {data,error}=await adminClient().storage.from('activity-photos').download(key);if(error||!data)return null;return {body:data,httpMetadata:{contentType:data.type}};},
 async put(key:string,data:Uint8Array,options:{httpMetadata:{contentType:string}}){const {error}=await adminClient().storage.from('activity-photos').upload(key,data,{contentType:options.httpMetadata.contentType,upsert:false});if(error)throw error;},
 async delete(key:string|string[]){const {error}=await adminClient().storage.from('activity-photos').remove(Array.isArray(key)?key:[key]);if(error)throw error;},
}};}
export async function identity(_request:Request){const user=await currentUser();if(!user)throw new Response('Sign in to continue',{status:401});return user.id;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function boundedBody(request:Request,limit:number){const reader=request.body?.getReader();if(!reader)throw new Response('Missing request body',{status:400});const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new Response('Upload is too large',{status:413});}chunks.push(value);}const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;}
export function fail(error:unknown){if(error instanceof Response)return error;console.error('Social request failed',error);return json({error:'Unable to connect. Your draft is safe; please try again.'},503);}
