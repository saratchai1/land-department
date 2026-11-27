export const SAMPLE_JOBS = [
  { id: 'SV-001', parcel: 'DEMO-P021', name: 'ตรวจสอบแนวเขต', zone: 'เหนือ', duration: 1, due: 2 },
  { id: 'SV-002', parcel: 'DEMO-P032', name: 'แบ่งแยกแปลง', zone: 'ใต้', duration: 1.5, due: 4 },
  { id: 'SV-003', parcel: 'DEMO-P043', name: 'สอบเขตที่ดิน', zone: 'ตะวันออก', duration: 1, due: 3 },
  { id: 'SV-004', parcel: 'DEMO-P054', name: 'ตรวจหมุดหลักเขต', zone: 'เหนือ', duration: 0.5, due: 2 },
  { id: 'SV-005', parcel: 'DEMO-P065', name: 'แบ่งแยกแปลง', zone: 'ตะวันตก', duration: 1.5, due: 5 },
  { id: 'SV-006', parcel: 'DEMO-P076', name: 'ตรวจหมุดหลักเขต', zone: 'ใต้', duration: 0.5, due: 3 },
  { id: 'SV-007', parcel: 'DEMO-P087', name: 'รวมแปลงที่ดิน', zone: 'ตะวันออก', duration: 1.5, due: 4 },
  { id: 'SV-008', parcel: 'DEMO-P098', name: 'สอบเขตที่ดิน', zone: 'ตะวันตก', duration: 1, due: 4 },
  { id: 'SV-009', parcel: 'DEMO-P109', name: 'ตรวจสอบแนวเขต', zone: 'เหนือ', duration: 1, due: 5 },
  { id: 'SV-010', parcel: 'DEMO-P120', name: 'สอบเขตที่ดิน', zone: 'ใต้', duration: 1, due: 4 },
];

export const TRANSFER_DAYS = 0.25;

export function buildSchedule(jobs = SAMPLE_JOBS, crewCount = 3, { mode = 'proposed', priorityIds = [] } = {}) {
  if (!Number.isInteger(crewCount) || crewCount < 1 || crewCount > 10) throw new RangeError('crewCount must be 1–10');
  if (jobs.some(j => !Number.isFinite(j.duration) || j.duration <= 0 || !Number.isFinite(j.due))) throw new TypeError('Jobs require positive durations and finite due days');
  if (new Set(jobs.map(j => j.id)).size !== jobs.length) throw new TypeError('Job IDs must be unique');
  const teams = Array.from({ length: crewCount }, (_, i) => ({ id: `T${i + 1}`, name: `ทีม ${String.fromCharCode(65 + i)}`, jobs: [], end: 0, travel: 0, lastZone: null }));
  const priorities = new Set(priorityIds);
  const queue = jobs.map(j => ({ ...j, priority: priorities.has(j.id) }));
  if (mode === 'proposed') queue.sort((a, b) => Number(b.priority) - Number(a.priority) || a.due - b.due || a.id.localeCompare(b.id));
  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    const transferFor = team => team.lastZone && team.lastZone !== job.zone ? TRANSFER_DAYS : 0;
    let team;
    if (mode === 'baseline') team = teams[i % crewCount];
    else {
      team = [...teams].sort((a, b) => {
        const score = t => {
          const transfer = transferFor(t), finish = t.end + transfer + job.duration;
          return finish + Math.max(0, finish - job.due) * 3 + transfer * 2;
        };
        return score(a) - score(b) || a.jobs.length - b.jobs.length || a.id.localeCompare(b.id);
      })[0];
    }
    const travel = transferFor(team);
    const assigned = { ...job, teamId: team.id, teamName: team.name, start: team.end + travel, end: team.end + travel + job.duration, travelBefore: travel };
    assigned.late = assigned.end > assigned.due + 1e-9;
    team.jobs.push(assigned);
    team.end = assigned.end;
    team.travel += travel;
    team.lastZone = job.zone;
  }
  const assignments = teams.flatMap(t => t.jobs);
  return {
    mode, crewCount, teams, assignments,
    makespan: Math.max(0, ...teams.map(t => t.end)),
    travel: teams.reduce((s, t) => s + t.travel, 0),
    work: assignments.reduce((s, j) => s + j.duration, 0),
    lateCount: assignments.filter(j => j.late).length,
    priorityIds: [...priorityIds],
  };
}

export function compareSchedules(jobs = SAMPLE_JOBS, crewCount = 3, priorityIds = []) {
  const baseline = buildSchedule(jobs, crewCount, { mode: 'baseline', priorityIds });
  const proposed = buildSchedule(jobs, crewCount, { mode: 'proposed', priorityIds });
  return { baseline, proposed, daysSaved: baseline.makespan - proposed.makespan, transferSaved: baseline.travel - proposed.travel };
}
