import test from 'node:test';
import assert from 'node:assert/strict';
import {rankTasks,validTask,makePlan} from './planner.ts';
const task=(id,changes={})=>({id,title:id,course:'',due:'2026-09-10',priority:2,minutes:30,done:false,...changes});
test('ranking considers deadlines, priority, difficulty, and time in order',()=>{const tasks=[task('short'),task('long',{minutes:90}),task('hard',{difficulty:3}),task('priority',{priority:3}),task('overdue',{due:'2026-09-09',priority:1}),task('done',{done:true})];assert.deepEqual(rankTasks(tasks).map(t=>t.id),['overdue','priority','hard','long','short']);assert.equal(makePlan(tasks,25,undefined,'2026-09-10').blocks[0].task.id,'overdue');});
test('legacy tasks remain valid and invalid difficulty is rejected',()=>{assert.ok(validTask(task('legacy')));assert.ok(validTask(task('hard',{difficulty:3})));assert.equal(validTask(task('invalid',{difficulty:4})),false);});
