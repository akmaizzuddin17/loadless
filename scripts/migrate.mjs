import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
for (const key of ['DATABASE_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const sql=postgres(process.env.DATABASE_URL,{prepare:false,max:1,ssl:'require'});
try {
  await sql.unsafe(await readFile(new URL('../supabase/migrations/001_loadless.sql',import.meta.url),'utf8'));
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  const options={public:false,fileSizeLimit:3*1024*1024,allowedMimeTypes:['image/jpeg','image/png','image/webp']};
  const {data,error:listError}=await client.storage.listBuckets();
  if(listError)throw listError;
  const {error}=data.some(b=>b.id==='activity-photos')?await client.storage.updateBucket('activity-photos',options):await client.storage.createBucket('activity-photos',options);
  if(error)throw error;
  console.log('LoadLess database and private photo bucket are ready.');
} finally { await sql.end(); }
