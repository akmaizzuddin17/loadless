'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Layers, Mail, LockKeyhole, ArrowRight } from 'lucide-react';

export function LoginForm() {
  const [signup,setSignup]=useState(false), [busy,setBusy]=useState(false), [message,setMessage]=useState('');
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const values=new FormData(event.currentTarget);
    try {
      const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if(!url||!key)throw new Error('Sign-in is being configured. Please try again shortly.');
      const client=createBrowserClient(url,key);
      const credentials={email:String(values.get('email')).trim(),password:String(values.get('password'))};
      const result=signup?await client.auth.signUp({...credentials,options:{emailRedirectTo:`${window.location.origin}/auth/callback`}}):await client.auth.signInWithPassword(credentials);
      if(result.error)throw result.error;
      if(!result.data.session){setMessage('Check your email to confirm your account, then sign in.');return;}
      const next=new URLSearchParams(window.location.search).get('next')||'/';
      const destination=new URL(next,window.location.origin);
      window.location.assign(destination.origin===window.location.origin?destination.pathname+destination.search:'/');
    }catch(error){setMessage(error instanceof Error?error.message:'Unable to sign in. Please try again.');}
    finally{setBusy(false);}
  }
  return <main className="auth-screen"><section className="card auth-card">
    <a className="brand" href="/"><Layers/>LoadLess</a>
    <h1>{signup?'Make room for you.':'Welcome back.'}</h1>
    <p>{signup?'Create your account, then choose your username.':'Your plans, progress, and people.'}</p>
    <form onSubmit={submit}>
      <label><span><Mail size={16}/> Email</span><input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
      <label><span><LockKeyhole size={16}/> Password</span><input name="password" type="password" autoComplete={signup?'new-password':'current-password'} minLength={8} maxLength={128} required/></label>
      {message&&<p role="status">{message}</p>}
      <button className="primary" disabled={busy}>{busy?'One moment…':signup?'Create account':'Sign in'}<ArrowRight size={18}/></button>
    </form>
    <button className="auth-switch" onClick={()=>{setSignup(!signup);setMessage('');}}>{signup?'Already have an account? Sign in':'New here? Create an account'}</button>
  </section></main>;
}
