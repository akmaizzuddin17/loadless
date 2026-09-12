import {CATEGORIES,categoryFor,offsetDay,type Task,type CheckIn,type Category} from './planner';
import {clockMinutes,routinePlan,type Routine} from './routine';
import {type TimeLog} from './progress';
export function routineCategory(r:Routine):Category{if(r.category&&CATEGORIES.includes(r.category))return r.category;const n=r.name.toLowerCase();return /sleep|meal|breakfast|lunch|dinner|rest|medicine/.test(n)?'Health & Wellbeing':/class|lecture|study/.test(n)?'Academic':/gym|run|sport|exercise/.test(n)?'Fitness':/friend|movie|hangout/.test(n)?'Social':/work|shift/.test(n)?'Work':/clean|errand|travel/.test(n)?'Home & Errands':'Personal';}
export function scheduledTime(routine:Routine[],tasks:Task[],check:CheckIn|undefined,today:string,start:string,end:string):TimeLog[]{
 const entries:TimeLog[]=[];
 const active=(r:Routine,d:string)=>r.date?r.date===d:!r.days||r.days.includes(new Date(d+'T12:00:00').getDay());
 for(let date=start,i=0;date<=end&&i<32;date=offsetDay(date,1),i++){
  const occupied=new Set<number>();for(const r of routine){const a=clockMinutes(r.start),b=clockMinutes(r.end),parts=b>a?(active(r,date)?[[a,b]]:[]):[...(active(r,offsetDay(date,-1))?[[0,b]]:[]),...(active(r,date)?[[a,1440]]:[])];let minutes=0;for(const [from,to] of parts)for(let m=from;m<to;m++)if(!occupied.has(m)){occupied.add(m);minutes++;}if(minutes)entries.push({id:'routine:'+r.id+date,category:routineCategory(r),date,minutes,title:r.name});}
 }
 let remaining=tasks.filter(t=>!t.done).map(t=>({...t}));const now=new Date(),from=now.getHours()*60+now.getMinutes();
 for(let date=today,i=0;date<=end&&i<62&&remaining.length;date=offsetDay(date,1),i++){
  const plan=routinePlan(remaining,routine,date===today?check:undefined,date,date===today?from:0);
  if(date>=start)for(const b of plan.blocks)entries.push({id:'planned:'+b.task.id+date+':'+b.start,category:categoryFor(b.task),date,minutes:b.minutes,title:b.task.title});
  remaining=remaining.map(t=>({...t,minutes:t.minutes-plan.blocks.filter(b=>b.task.id===t.id).reduce((s,b)=>s+b.minutes,0)})).filter(t=>t.minutes>0);
 }
 return entries;
}
