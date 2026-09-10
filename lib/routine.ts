import {rankTasks, offsetDay, type Task, type CheckIn} from './planner';
export type Routine = {id:string; name:string; start:string; end:string};
export const clockMinutes=(value:string)=>Number(value.slice(0,2))*60+Number(value.slice(3));
export const clockLabel=(minutes:number)=>`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
export const loadColor=(percent:number)=>`hsl(${Math.round(120*(1-Math.min(100,Math.max(0,percent))/100))} 68% 38%)`;
export function validRoutine(value:unknown):value is Routine[]{return Array.isArray(value)&&value.length>0&&value.every(r=>r&&typeof r.id==='string'&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=60&&typeof r.start==='string'&&typeof r.end==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(r.start)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(r.end)&&r.start!==r.end);}
export function freeWindows(routine:Routine[],from=0){
 const busy=routine.flatMap(r=>{const start=clockMinutes(r.start),end=clockMinutes(r.end);return end>start?[{start,end}]:[{start:0,end},{start,end:1440}];}).sort((a,b)=>a.start-b.start);
 const free:{start:number;end:number}[]=[];let cursor=from;
 for(const b of busy){if(b.start>cursor)free.push({start:cursor,end:b.start});cursor=Math.max(cursor,b.end);}
 if(cursor<1440)free.push({start:cursor,end:1440});return free;
}
export function routinePlan(tasks:Task[],routine:Routine[],check:CheckIn|undefined,today:string,from:number){
 const windows=routine.length?freeWindows(routine,from):[];
 const available=windows.reduce((s,w)=>s+w.end-w.start,0);
 const factor=check?(check.stress>=4||check.energy<=2?.65:check.energy===3||check.stress===3?.85:1):1;
 const budget=Math.floor(available*factor),sorted=rankTasks(tasks);
 const blocks:{task:Task;minutes:number;breakBefore:number;start:number;end:number}[]=[];
 let used=0,index=0,cursor=windows[0]?.start??1440;
 for(const task of sorted){let remaining=task.minutes;
  while(remaining>0&&index<windows.length&&used<budget){const previous=blocks[blocks.length-1];const pause=previous?Math.max(0,5-(cursor-previous.end)):0;const start=cursor+pause;const minutes=Math.min(25,remaining,windows[index].end-start,budget-used-pause);
   if(minutes<Math.min(5,remaining)){index++;cursor=windows[index]?.start??1440;continue;}
   blocks.push({task,minutes,breakBefore:pause,start,end:start+minutes});cursor=start+minutes;used+=pause+minutes;remaining-=minutes;
  }
 }
 const work=blocks.reduce((s,b)=>s+b.minutes,0),total=sorted.reduce((s,t)=>s+t.minutes,0);
 const urgentGap=sorted.filter(t=>t.due<=today).reduce((s,t)=>s+t.minutes,0)-blocks.filter(b=>b.task.due<=today).reduce((s,b)=>s+b.minutes,0);
 return {blocks,available,budget,used,work,total,unplanned:total-work,urgentGap,factor};
}
// Carry unfinished effort forward without scheduling it twice or moving deadlines.
export function upcomingStarts(tasks:Task[],routine:Routine[],check:CheckIn|undefined,today:string,from:number){
 const starts:Record<string,{date:string;start:number;end:number;late:boolean}>={};
 let remaining=rankTasks(tasks).map(t=>({...t}));
 for(let day=0;day<7&&remaining.length;day++){
  const date=offsetDay(today,day),plan=routinePlan(remaining,routine,day===0?check:undefined,date,day===0?from:0);
  for(const block of plan.blocks){if(!starts[block.task.id])starts[block.task.id]={date,start:block.start,end:block.end,late:date>block.task.due};}
  remaining=remaining.map(t=>({...t,minutes:t.minutes-plan.blocks.filter(b=>b.task.id===t.id).reduce((s,b)=>s+b.minutes,0)})).filter(t=>t.minutes>0);
 }
 return starts;
}
