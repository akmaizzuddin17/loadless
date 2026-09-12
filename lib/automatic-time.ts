import {dayKey,offsetDay} from './planner';
import {clockMinutes,type Routine} from './routine';
import {routineCategory} from './scheduled-time';
import {type TimeLog} from './progress';
export function routineSegments(routine:Routine[],date:string){
 const active=(r:Routine,d:string)=>r.date?r.date===d:!r.days||r.days.includes(new Date(d+'T12:00:00').getDay());
 const occupied=new Set<number>();const result:{routine:Routine;start:number;end:number}[]=[];
 for(const r of routine){const a=clockMinutes(r.start),b=clockMinutes(r.end),parts=b>a?(active(r,date)?[[a,b]]:[]):[...(active(r,offsetDay(date,-1))?[[0,b]]:[]),...(active(r,date)?[[a,1440]]:[])];for(const [start,end] of parts){let segment=-1;for(let m=start;m<=end;m++){const free=m<end&&!occupied.has(m);if(free){occupied.add(m);if(segment<0)segment=m;}else if(segment>=0){result.push({routine:r,start:segment,end:m});segment=-1;}}}}
 return result.sort((a,b)=>a.start-b.start);
}
export function recordElapsedRoutines(logs:TimeLog[],routine:Routine[],now:Date):TimeLog[]{
 const today=dayKey(now),known=new Set(logs.map(l=>l.id));const added:TimeLog[]=[];
 const first=dayKey(new Date(Math.max(new Date(offsetDay(today,-365)+'T00:00:00').getTime(),Math.min(now.getTime(),...routine.map(r=>r.trackingFrom??now.getTime())))));
 for(let date=first,i=0;date<=today&&i<366;date=offsetDay(date,1),i++)for(const s of routineSegments(routine,date)){
  const start=new Date(date+'T00:00:00');start.setMinutes(s.start);const end=new Date(date+'T00:00:00');end.setMinutes(s.end);
  const id=`auto-routine:${s.routine.id}:${date}:${s.start}`;
  if(!known.has(id)&&end.getTime()<=now.getTime()&&start.getTime()>=(s.routine.trackingFrom??now.getTime()))added.push({id,date,category:routineCategory(s.routine),minutes:s.end-s.start,title:s.routine.name,source:'routine'});
 }
 return added.length?[...logs,...added]:logs;
}
