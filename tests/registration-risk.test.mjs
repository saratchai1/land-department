import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationCases, analyzeRegistration, validateRegistrationDecision } from '../src/registration-model.js';
import { riskCases, scoreRisk, filterRiskCases, validateRiskDecision } from '../src/risk-model.js';

test('shared parcel sample exposes exactly the identity and authorization findings', () => {
  const sample = registrationCases[0];
  const result = analyzeRegistration(sample, sample.form);
  assert.deepEqual(result.findings.map(check => check.id), ['owner', 'powerOfAttorney']);
  assert.equal(result.total, 7);
  assert.equal(result.passed, 5);
  assert.equal(sample.registry.area, 8000);
});

test('corrected representative sample clears findings without changing the reference', () => {
  const sample = registrationCases[0];
  const result = analyzeRegistration(sample, { ...sample.form, owner: 'DEMO-A', powerOfAttorney: true });
  assert.equal(result.findings.length, 0);
  assert.equal(sample.form.owner, 'DEMO-B');
  assert.equal(sample.form.powerOfAttorney, false);
});

test('owner whitespace and case normalization does not create a spurious finding', () => {
  const sample = registrationCases[1];
  assert.equal(analyzeRegistration(sample, { ...sample.form, owner: '  demo-c  ', parcel: ' demo-p022 ' }).findings.length, 0);
});

test('authorization is required only for a representative', () => {
  const sample = registrationCases[1];
  assert.equal(analyzeRegistration(sample, sample.form).total, 6);
  assert.deepEqual(analyzeRegistration(sample, { ...sample.form, representative: true }).findings.map(check => check.id), ['powerOfAttorney']);
});

test('invalid, empty and negative areas are flagged', () => {
  const sample = registrationCases[1];
  for (const area of ['', NaN, Infinity, -1, 'bad']) {
    const check = analyzeRegistration(sample, { ...sample.form, area }).checks.find(item => item.id === 'area');
    assert.equal(check.pass, false);
    assert.equal(check.actual, 'ข้อมูลไม่ถูกต้อง');
  }
});

test('area mismatch and missing contract are independently explained', () => {
  const sample = registrationCases[2];
  assert.deepEqual(analyzeRegistration(sample, sample.form).findings.map(check => check.id), ['area', 'saleContract']);
});

test('officer decisions require an assessment and a reason for outstanding findings', () => {
  const flagged = analyzeRegistration(registrationCases[0], registrationCases[0].form);
  const clean = analyzeRegistration(registrationCases[1], registrationCases[1].form);
  assert.notEqual(validateRegistrationDecision(null, 'reviewed', 'มีเหตุผลแล้ว'), '');
  assert.notEqual(validateRegistrationDecision(flagged, 'approved', 'มีเหตุผลแล้ว'), '');
  assert.notEqual(validateRegistrationDecision(flagged, 'reviewed', ''), '');
  assert.notEqual(validateRegistrationDecision(flagged, 'return', '   short   '), '');
  assert.equal(validateRegistrationDecision(flagged, 'return', 'ขอเอกสารตัวอย่างเพิ่มเติม'), '');
  assert.equal(validateRegistrationDecision(clean, 'reviewed', ''), '');
});

test('risk scores sum only active transparent rule weights', () => {
  assert.deepEqual(riskCases.map(sample => scoreRisk(sample).score), [80, 55, 20]);
  assert.deepEqual(riskCases.map(sample => scoreRisk(sample).level), ['high', 'medium', 'low']);
  assert.equal(scoreRisk(riskCases[0]).active.length, 3);
});

test('threshold filtering is inclusive and ordered by score', () => {
  assert.deepEqual(filterRiskCases(riskCases, { threshold: 55 }).map(item => item.id), ['DEMO-A071', 'DEMO-A072']);
  assert.deepEqual(filterRiskCases(riskCases, { threshold: 80 }).map(item => item.id), ['DEMO-A071']);
  assert.equal(filterRiskCases(riskCases, { threshold: 85 }).length, 0);
  assert.equal(filterRiskCases(riskCases).length, 3);
});

test('human review moves a case out of pending but does not alter its score', () => {
  const decisions = { 'DEMO-A071': { disposition: 'closed', note: 'ตรวจสอบข้อมูลตัวอย่างแล้ว' } };
  assert.deepEqual(filterRiskCases(riskCases, { status: 'pending', decisions }).map(item => item.id), ['DEMO-A072', 'DEMO-A073']);
  assert.deepEqual(filterRiskCases(riskCases, { status: 'reviewed', decisions }).map(item => item.id), ['DEMO-A071']);
  assert.equal(scoreRisk(riskCases[0]).score, 80);
});

test('both risk dispositions need a nontrivial recorded reason', () => {
  assert.notEqual(validateRiskDecision('escalated', ''), '');
  assert.notEqual(validateRiskDecision('closed', '   '), '');
  assert.notEqual(validateRiskDecision('guilty', 'มีเหตุผลอย่างชัดเจน'), '');
  assert.equal(validateRiskDecision('closed', 'มีบันทึกการนำเข้าย้อนหลังรองรับ'), '');
  assert.equal(validateRiskDecision('escalated', 'ขอตรวจเอกสารอ้างอิงเพิ่มเติม'), '');
});
