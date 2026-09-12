'use client';
import {useState} from 'react';
import {Download} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';
import {type Routine,routinePlan} from '@/lib/routine';
import {categoryFor,CATEGORIES,type Task,type CheckIn} from '@/lib/planner';
import {routineSegments} from '@/lib/automatic-time';
import {routineCategory} from '@/lib/scheduled-time';
import {palette,scheduleCanvas} from '@/lib/visual-cards';
export function ScheduleDownload({routine,tasks,check,today,from}:{routine:Routine[];tasks:Task[];check?:CheckIn;today:string;from:number}){
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 function preview(){try{const plan=routinePlan(tasks,routine,check,today,from);const rows=[...routineSegments(routine,today).map(s=>({start:s.start,end:s.end,title:s.routine.name,category:routineCategory(s.routine),kind:'Routine',color:palette[CATEGORIES.indexOf(routineCategory(s.routine))]})),...plan.blocks.flatMap(b=>[...(b.breakBefore?[{start:b.start-b.breakBefore,end:b.start,title:'Recharge',category:'Break',kind:'Recovery',color:'#86c98c'}]:[]),{start:b.start,end:b.end,title:b.task.title,category:categoryFor(b.task),kind:'Focus',color:palette[CATEGORIES.indexOf(categoryFor(b.task))]}])].sort((a,b)=>a.start-b.start);setUrl(scheduleCanvas(today,rows,plan.unplanned).toDataURL('image/png'));setError('');}catch{setError('Could not create your schedule. Try again.');}}
 return <><button className="icon-button" title="Download today's schedule" aria-label="Download today's schedule" onClick={preview}><Download size={20}/></button>{error&&<span role="alert">{error}</span>}<Dialog open={!!url} onOpenChange={v=>{if(!v)setUrl('');}}><DialogContent className="routine-dialog"><DialogTitle>Your day, at a glance</DialogTitle><DialogDescription>Save this schedule as an image.</DialogDescription><img className="download-preview" src={url} alt="Daily schedule with colour-coded routine, focus and break blocks"/><a className="primary" href={url} download={'loadless-'+today+'.png'}><Download size={17}/> Download PNG</a></DialogContent></Dialog></>;
}
