import {currentUser} from '@/lib/auth';
import {storage} from '@/lib/social-server';
import Workspace from '@/components/workspace';
import {ProfileSetup} from '@/components/profile-setup';
export async function ProtectedWorkspace({returnTo}:{returnTo:string}){
 const user=await currentUser();
 if(!user)return <Workspace userId="guest" guest/>;
 try{const {DB}=storage();
 const profile=await DB.prepare('SELECT username FROM profiles WHERE id=?').bind(user.id).first();
 return profile?<Workspace userId={user.id}/>:<ProfileSetup/>;
 }catch(e){console.error('Profile storage unavailable',e);return <main><h1>We could not load your profile.</h1><p>Please try again in a moment.</p><a href={returnTo}>Retry</a></main>;}
}
