import {requireUser} from '@/lib/auth';
import {storage} from '@/lib/social-server';
import Workspace from '@/components/workspace';
import {ProfileSetup} from '@/components/profile-setup';
export async function ProtectedWorkspace({returnTo}:{returnTo:string}){
 const user=await requireUser(returnTo);
 try{const {DB}=storage();const profile=await DB.prepare('SELECT username FROM profiles WHERE id=?').bind(user.userId).first();
 return profile?<Workspace userId={user.userId}/>:<ProfileSetup/>;
 }catch(e){console.error('Profile storage unavailable',e);return <main><h1>We could not load your profile.</h1><p>Please try again in a moment.</p><a href={returnTo}>Retry</a></main>;}
}
