import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./routine.ts',import.meta.url),'utf8').replace("'./planner'",JSON.stringify(new URL('./planner.ts',import.meta.url).href));
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {freeWindows,routinePlan,validRoutine,upcomingStarts}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const rows=[{id:'sleep',name:'Sleep',start:'23:00',end:'07:00'},{id:'meal',name:'Lunch',start:'12:00',end:'13:00'},{id:'class',name:'Class',start:'12:30',end:'14:00'}];
const tasks=[{id:'a',title:'A',course:'',due:'2026-09-10',minutes:10080,priority:3,done:false}];
test('overnight sleep and overlapping routines are merged',()=>assert.deepEqual(freeWindows(rows),[{start:420,end:720},{start:840,end:1380}]));
test('schedule never uses past time or protected activities and respects capacity',()=>{const plan=routinePlan(tasks,rows,{stress:4,energy:1},'2026-09-10',710);assert.ok(plan.used<=plan.budget);assert.ok(plan.blocks.length);for(const b of plan.blocks){assert.ok(b.start>=710);assert.ok(freeWindows(rows,710).some(w=>b.start-b.breakBefore>=w.start&&b.end<=w.end));}assert.equal(plan.work+plan.unplanned,10080);});
test('no routine means no generated plan; full day leaves no space',()=>{assert.equal(routinePlan(tasks,[],undefined,'2026-09-10',0).blocks.length,0);assert.deepEqual(freeWindows([{id:'a',name:'A',start:'00:00',end:'12:00'},{id:'b',name:'B',start:'12:00',end:'00:00'}]),[]);});
test('routine times and names are validated',()=>{assert.ok(validRoutine(rows));assert.equal(validRoutine([{...rows[0],end:'23:00'}]),false);assert.equal(validRoutine([{...rows[0],start:'25:00'}]),false);});

test('starts at the next free routine gap without an extra break after lunch',()=>{const plan=routinePlan(tasks,rows,undefined,'2026-09-10',710);assert.equal(plan.blocks[0].start,710);assert.equal(plan.blocks[1].start,840);assert.equal(plan.blocks[1].breakBefore,0);});
test('future suggestions carry remaining work forward and flag missed deadlines',()=>{const work=[{...tasks[0],minutes:60},{...tasks[0],id:'b',minutes:30}];const starts=upcomingStarts(work,rows,undefined,'2026-09-30',1380);assert.equal(starts.a.date,'2026-10-01');assert.equal(starts.a.start,420);assert.ok(starts.b.start>starts.a.end);assert.equal(starts.a.late,true);});
test('current commitments push the suggested start to their end',()=>{const starts=upcomingStarts([{...tasks[0],minutes:30}],rows,undefined,'2026-09-10',750);assert.equal(starts.a.start,840);assert.equal(starts.a.date,'2026-09-10');assert.equal(starts.a.late,false);});
test('tiny gaps do not create one-minute focus sessions',()=>{const plan=routinePlan(tasks,rows,undefined,'2026-09-10',719);assert.equal(plan.blocks[0].start,840);});
