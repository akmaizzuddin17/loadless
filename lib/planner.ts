export const CATEGORIES = ['Academic', 'Fitness', 'Social', 'Work', 'Personal', 'Health & Wellbeing', 'Home & Errands', 'Other'] as const;
export type Category = typeof CATEGORIES[number];
export type Task = {id:string; title:string; course:string; category?:Category; due:string; minutes:number; priority:number; done:boolean};
export function categoryFor(task:Task):Category {
 if(task.category && CATEGORIES.includes(task.category))return task.category;
 const match=CATEGORIES.find(c=>c.toLowerCase()===task.course.trim().toLowerCase());
 if(match)return match;
 if(['Research methods','Data structures','Group project','Psychology'].includes(task.course))return 'Academic';
 return 'Other';
}
export function groupTasks(tasks:Task[]){return CATEGORIES.map(category=>({category,tasks:tasks.filter(t=>categoryFor(t)===category).sort((a,b)=>Number(a.done)-Number(b.done)||a.due.localeCompare(b.due)||b.priority-a.priority)})).filter(group=>group.tasks.length>0);}
export type CheckIn = {date:string; stress:number; energy:number; note:string};
export function dayKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function offsetDay(key:string,offset:number){const d=new Date(key+'T12:00:00');d.setDate(d.getDate()+offset);return dayKey(d);}
export function validTask(t:unknown):t is Task {if(!t || typeof t!=='object')return false;const v=t as Task;return (v.category===undefined||CATEGORIES.includes(v.category))&&typeof v.id==='string'&&typeof v.title==='string'&&v.title.trim().length>0&&v.title.length<=120&&typeof v.course==='string'&&v.course.length<=60&&typeof v.due==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.due)&&!Number.isNaN(Date.parse(v.due+'T12:00:00'))&&Number.isInteger(v.minutes)&&v.minutes>=5&&v.minutes<=10080&&[1,2,3].includes(v.priority)&&typeof v.done==='boolean';}
export function validCheckIn(c:unknown):c is CheckIn {if(!c||typeof c!=='object')return false;const v=c as CheckIn;return typeof v.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&Number.isInteger(v.stress)&&v.stress>=1&&v.stress<=5&&Number.isInteger(v.energy)&&v.energy>=1&&v.energy<=5&&typeof v.note==='string'&&v.note.length<=500;}
export function makePlan(tasks:Task[],available:number,check:CheckIn|undefined,today:string){
 const factor=check ? Math.min(check.stress>=4?.65:1,check.energy<=2?.65:check.energy===3?.85:1):1;
 const budget=Math.max(0,Math.floor(available*factor));
 const sorted=tasks.filter(t=>!t.done).sort((a,b)=>a.due.localeCompare(b.due)||b.priority-a.priority||a.minutes-b.minutes);
 const blocks:{task:Task;minutes:number;breakBefore:number}[]=[];let used=0;
 for(const task of sorted){let remaining=task.minutes;while(remaining>0){const pause=blocks.length?5:0;const minutes=Math.min(25,remaining,budget-used-pause);if(minutes<=0)break;blocks.push({task,minutes,breakBefore:pause});used+=minutes+pause;remaining-=minutes;}}
 const work=blocks.reduce((sum,b)=>sum+b.minutes,0);const total=sorted.reduce((sum,t)=>sum+t.minutes,0);
 const due=sorted.filter(t=>t.due<=today).reduce((sum,t)=>sum+t.minutes,0);
 const plannedDue=blocks.filter(b=>b.task.due<=today).reduce((sum,b)=>sum+b.minutes,0);
 return {blocks,budget,used,work,total,unplanned:total-work,urgentGap:Math.max(0,due-plannedDue),factor};
}
