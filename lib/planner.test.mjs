import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlan,validTask,offsetDay} from '../lib/planner.ts';
const task=(id,due,minutes,priority=2)=>({id,title:id,course:'Test',due,minutes,priority,done:false});
test('budget includes breaks and never overschedules',()=>{const p=makePlan([task('A','2026-09-07',120)],60,undefined,'2026-09-07');assert.equal(p.used,55);assert.equal(p.work,50);assert.equal(p.urgentGap,70);assert.ok(p.blocks.every(b=>b.minutes>0&&b.minutes<=25));});
test('high stress lowers capacity without moving deadlines',()=>{const tasks=[task('A','2026-09-07',120)];const p=makePlan(tasks,100,{stress:4,energy:5},'2026-09-07');assert.equal(p.budget,65);assert.ok(p.used<=65);assert.equal(tasks[0].due,'2026-09-07');});
test('deadline precedes priority; completed tasks excluded',()=>{const a=task('urgent','2026-09-06',25,1),b=task('later','2026-09-09',25,3);assert.equal(makePlan([b,a,{...a,id:'done',done:true}],25,undefined,'2026-09-07').blocks[0].task.id,'urgent');});
test('empty plan and month rollover',()=>{assert.equal(makePlan([],60,undefined,'2026-09-07').used,0);assert.equal(offsetDay('2026-09-30',1),'2026-10-01');});
test('invalid estimates rejected',()=>{assert.equal(validTask(task('a','2026-09-07',0)),false);assert.equal(validTask(task('a','2026-09-07',30)),true);});

