'use client';
import {SocialHome} from './social-home';
export function ProfileSetup(){return <main><h1>Welcome to LoadLess</h1><SocialHome onProfileSaved={()=>window.location.assign('/')}/></main>;}
