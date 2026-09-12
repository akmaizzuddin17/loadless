'use client';
import {useEffect,useState} from 'react';
import {Settings,Sun,Moon,Monitor,LogOut} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';
import {RadioGroup,RadioGroupItem} from './ui/radio-group';
export function AppSettings(){
 const [open,setOpen]=useState(false),[theme,setTheme]=useState('system');
 useEffect(()=>{try{const saved=localStorage.getItem('loadless-theme');if(saved&&['light','dark','system'].includes(saved))setTheme(saved);}catch{}},[]);
 useEffect(()=>{const media=window.matchMedia('(prefers-color-scheme: dark)');const apply=()=>{const dark=theme==='dark'||theme==='system'&&media.matches;document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.classList.toggle('dark',dark);};apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);},[theme]);
 function choose(value:string){setTheme(value);try{localStorage.setItem('loadless-theme',value);}catch{}}
 return <><button className="icon-button" title="Settings" aria-label="Settings" onClick={()=>setOpen(true)}><Settings size={21}/></button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="task-dialog"><DialogTitle>Settings</DialogTitle><DialogDescription>Make yourself at home.</DialogDescription><h3>Appearance</h3><RadioGroup className="theme-choices" value={theme} onValueChange={v=>choose(String(v))}>{[{value:'light',label:'Light',Icon:Sun},{value:'dark',label:'Dark',Icon:Moon},{value:'system',label:'Device',Icon:Monitor}].map(({value,label,Icon})=><label key={value}><Icon size={26}/><span>{label}</span><RadioGroupItem value={value} aria-label={label+' appearance'}/></label>)}</RadioGroup><a className="settings-signout" href="/signout-with-chatgpt?return_to=%2F"><LogOut size={18}/> Sign out</a></DialogContent></Dialog></>;
}
