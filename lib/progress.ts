import {CATEGORIES,categoryFor,type Category,type Task} from './planner';
export type TimeLog={id:string;category:Category;date:string;minutes:number;title:string;taskId?:string;source?:'estimate'|'actual'|'recovery'|'routine'|'skipped'};
export const validLog=(v:TimeLog)=>v&&typeof v.id==='string'&&CATEGORIES.includes(v.category)&&typeof v.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&!Number.isNaN(Date.parse(v.date))&&typeof v.title==='string'&&v.title.length<=120&&Number.isInteger(v.minutes)&&v.minutes>0&&v.minutes<=10080&&(v.taskId===undefined||typeof v.taskId==='string')&&(v.source===undefined||['estimate','actual','recovery','routine','skipped'].includes(v.source));
export function completionLogs(logs:TimeLog[],task:Task,done:boolean,date:string,id:string):TimeLog[]{
 const retained=logs.filter(l=>l.taskId!==task.id);
 if(!done)return retained;
 const previous=logs.find(l=>l.taskId===task.id);
 return [...retained,previous??{id,taskId:task.id,category:categoryFor(task),date,minutes:task.minutes,title:task.title,source:'estimate'}];
}
