import test from 'node:test';
import assert from 'node:assert/strict';
import {queueProjection,officeTotals} from '../src/dashboard-model.js';
import {createStore} from '../src/store.js';
test('national scenario totals equal constituent synthetic offices',()=>assert.deepEqual(officeTotals(),{backlog:120,demand:30,capacity:36}));
test('additional capacity recalculates clearing time, never negative',()=>{assert.equal(queueProjection({backlog:120,demand:30,capacity:36}).clearDays,20);const p=queueProjection({backlog:120,demand:30,capacity:42});assert.equal(p.clearDays,10);assert.equal(p.points[20],0);});
test('non-clearing queues are explicit and zero backlog is already clear',()=>{assert.equal(queueProjection({backlog:120,demand:36,capacity:36}).clearDays,null);assert.equal(queueProjection({backlog:120,demand:40,capacity:36}).points[1],124);assert.equal(queueProjection({backlog:0,demand:0,capacity:0}).clearDays,0);assert.throws(()=>queueProjection({backlog:-1,demand:2,capacity:3}),RangeError);});
test('demo state survives disabled storage and resets all modules',()=>{const store=createStore({getItem(){throw Error();},setItem(){throw Error();}});store.update({registrationDecisions:{x:{outcome:'reviewed'}}});store.record('test','test','synthetic');assert.equal(store.get().activities.length,1);store.reset();assert.deepEqual(store.get().registrationDecisions,{});assert.equal(store.get().activities.length,0);});
