import test from 'node:test';
import assert from 'node:assert/strict';
import { polygonArea, intersectConvex, hasSelfIntersection, inspectSurvey, makeSurvey, NEIGHBOR_PARCEL } from '../src/survey-model.js';
import { SAMPLE_JOBS, buildSchedule, compareSchedules, TRANSFER_DAYS } from '../src/scheduling-model.js';

test('closed clean parcel is 8,000 m² and touching its neighbor has zero overlap', () => {
  const result = inspectSurvey(makeSurvey('clean'));
  assert.equal(result.area, 8000);
  assert.equal(result.overlapArea, 0);
  assert.equal(result.closureGap, 0);
  assert.equal(result.passed, true);
});

test('east shift computes independent 400 m² area difference and 300 m² intersection', () => {
  const result = inspectSurvey(makeSurvey('overlap', 5));
  assert.equal(result.area, 8400);
  assert.equal(result.areaDifference, 400);
  assert.equal(result.areaDifferencePercent, 5);
  assert.equal(result.overlapArea, 300);
  assert.equal(result.checks.filter(c => !c.ok).length, 2);
});

test('moving east boundary west eliminates overlap but detects smaller registered area', () => {
  const result = inspectSurvey(makeSurvey('overlap', -5));
  assert.equal(result.area, 7600);
  assert.equal(result.overlapArea, 0);
  assert.equal(result.checks.find(c => c.id === 'area').ok, false);
});

test('clockwise and counterclockwise neighbor clipping produce the same area', () => {
  const subject = makeSurvey('overlap', 5);
  assert.equal(polygonArea(intersectConvex(subject, NEIGHBOR_PARCEL)), 300);
  assert.equal(polygonArea(intersectConvex(subject, [...NEIGHBOR_PARCEL].reverse())), 300);
});

test('closure gap changes pass status only at the configured tolerance', () => {
  const strict = inspectSurvey(makeSurvey('open'), { closureTolerance: 0.05 });
  const relaxed = inspectSurvey(makeSurvey('open'), { closureTolerance: 2 });
  assert.equal(strict.closureGap, 2);
  assert.equal(strict.checks.find(c => c.id === 'closure').ok, false);
  assert.equal(relaxed.checks.find(c => c.id === 'closure').ok, true);
  assert.equal(strict.area, 8000);
});

test('self-crossing ring blocks misleading area and overlap conclusions', () => {
  assert.equal(hasSelfIntersection(makeSurvey('crossed')), true);
  const result = inspectSurvey(makeSurvey('crossed'));
  assert.equal(result.valid, false);
  assert.equal(result.area, null);
  assert.equal(result.overlapArea, null);
  assert.equal(result.checks.find(c => c.id === 'overlap').skipped, true);
});

test('malformed coordinates fail explicitly', () => {
  assert.equal(inspectSurvey([[0,0],[1,1],[2,Number.NaN],[0,0]]).valid, false);
  assert.equal(inspectSurvey([]).valid, false);
});

for (const crewCount of [2,3,4]) {
  for (const mode of ['baseline', 'proposed']) {
    test(`${mode}, ${crewCount} crews: every job occurs once, teams never overlap, durations preserved`, () => {
      const plan = buildSchedule(SAMPLE_JOBS, crewCount, { mode, priorityIds: ['SV-004'] });
      assert.equal(plan.assignments.length, SAMPLE_JOBS.length);
      assert.equal(new Set(plan.assignments.map(j => j.id)).size, SAMPLE_JOBS.length);
      assert.equal(plan.work, SAMPLE_JOBS.reduce((s,j) => s+j.duration,0));
      for (const team of plan.teams) {
        let last = null;
        for (const job of team.jobs) {
          assert.equal(job.end-job.start, job.duration);
          assert.ok(job.start >= (last?.end || 0));
          assert.equal(job.travelBefore, last && last.zone !== job.zone ? TRANSFER_DAYS : 0);
          assert.equal(job.late, job.end > job.due);
          last = job;
        }
      }
    });
  }
}

test('crew and urgency inputs actually change the proposed plan', () => {
  const two = buildSchedule(SAMPLE_JOBS, 2);
  const four = buildSchedule(SAMPLE_JOBS, 4);
  assert.ok(two.makespan > four.makespan);
  const urgent = buildSchedule(SAMPLE_JOBS, 3, { priorityIds: ['SV-010'] });
  const standard = buildSchedule(SAMPLE_JOBS, 3);
  assert.equal(urgent.assignments.find(j => j.id === 'SV-010').start, 0);
  assert.ok(standard.assignments.find(j => j.id === 'SV-010').start > 0);
  assert.deepEqual(urgent, buildSchedule(SAMPLE_JOBS, 3, { priorityIds: ['SV-010'] }));
});

test('summary comparison is derived from the same plan data', () => {
  const comparison = compareSchedules(SAMPLE_JOBS, 3, ['SV-004']);
  assert.equal(comparison.daysSaved, comparison.baseline.makespan - comparison.proposed.makespan);
  assert.equal(comparison.transferSaved, comparison.baseline.travel - comparison.proposed.travel);
  assert.equal(comparison.proposed.lateCount, comparison.proposed.assignments.filter(j => j.late).length);
});

test('empty work is schedulable; invalid resources and duplicate IDs are rejected', () => {
  assert.equal(buildSchedule([], 2).makespan, 0);
  assert.throws(() => buildSchedule(SAMPLE_JOBS, 0), RangeError);
  assert.throws(() => buildSchedule(SAMPLE_JOBS, 2.5), RangeError);
  assert.throws(() => buildSchedule([SAMPLE_JOBS[0], SAMPLE_JOBS[0]], 2), TypeError);
});
