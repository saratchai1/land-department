import { SAMPLE_JOBS, compareSchedules, TRANSFER_DAYS } from '../scheduling-model.js';

const fmt = n => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n);
const colors = { 'เหนือ': 'north', 'ใต้': 'south', 'ตะวันออก': 'east', 'ตะวันตก': 'west' };

function timeline(plan) {
  const max = Math.max(4, Math.ceil(plan.makespan));
  return `<div class="sched-timeline" style="--sched-days:${max}"><div class="sched-ruler"><span>ทีมรังวัด</span><div>${Array.from({ length: max + 1 }, (_, i) => `<span style="left:${i / max * 100}%">${i}</span>`).join('')}</div></div>${plan.teams.map(team => `<div class="sched-team-row"><div class="sched-team-label"><span class="sched-avatar">${team.name.slice(-1)}</span><div><strong>${team.name}</strong><small>${team.jobs.length} งาน · ${fmt(team.end)} วัน</small></div></div><div class="sched-track">${team.jobs.map(job => `${job.travelBefore ? `<div class="sched-travel" style="left:${(job.start-job.travelBefore)/max*100}%;width:${job.travelBefore/max*100}%" title="ย้ายโซน ${TRANSFER_DAYS} วัน"></div>` : ''}<button type="button" class="sched-block ${colors[job.zone]}" data-job="${job.id}" style="left:${job.start/max*100}%;width:${job.duration/max*100}%" aria-label="${job.id} ${job.name} โซน${job.zone} ทีม${team.name.slice(-1)} เริ่มวันที่ ${fmt(job.start)} เสร็จวันที่ ${fmt(job.end)}"><strong>${job.id.replace('SV-', '')}${job.priority ? ' ★' : ''}</strong><span>${job.zone}</span></button>`).join('')}</div></div>`).join('')}</div>`;
}

export function renderScheduling(container, ctx) {
  const previous = ctx.getState().scheduling;
  let crewCount = [2, 3, 4].includes(previous?.crewCount) ? previous.crewCount : 3;
  let priorityIds = Array.isArray(previous?.priorityIds) ? previous.priorityIds.filter(id => SAMPLE_JOBS.some(job => job.id === id)) : ['SV-004'];
  let sort = 'due', planMode = 'proposed', selectedJob = null;
  let planned = false;
  function draw() {
    const comparison = compareSchedules(SAMPLE_JOBS, crewCount, priorityIds);
    const plan = comparison[planMode];
    let rows = [...plan.assignments];
    rows.sort((a, b) => sort === 'zone' ? a.zone.localeCompare(b.zone, 'th') || a.start-b.start : sort === 'finish' ? a.end-b.end : a.due-b.due || a.id.localeCompare(b.id));
    const selection = selectedJob ? plan.assignments.find(j => j.id === selectedJob) : null;
    container.innerHTML = `<div class="sv-intro"><div><span class="eyebrow">SMART SURVEY 2.0</span><h1>จัดคิวให้เหมาะกับทีม</h1><p class="muted">“จากการบริหารคิว สู่การคาดการณ์วันแล้วเสร็จ”</p></div><span class="badge neutral">10 งานจำลอง · 4 โซน</span></div>
      <section class="panel sched-config"><div class="sched-config-text"><h2>ลองเปลี่ยนทรัพยากร แล้วดูผล</h2><p class="muted">เวลาเริ่มต้น D0 · นับเป็นวันทำงานจำลอง</p></div><label class="field" for="sched-crews"><span>ทีมที่พร้อมลงพื้นที่</span><select id="sched-crews">${[2,3,4].map(n=>`<option value="${n}" ${crewCount===n?'selected':''}>${n} ทีม</option>`).join('')}</select></label><button type="button" class="button primary" id="sched-calculate">คำนวณแผนจัดคิว</button></section>
      <div class="sched-metrics"><div class="panel sched-metric"><span>งานทั้งหมดเสร็จใน</span><div><strong>${fmt(comparison.proposed.makespan)}</strong><small>วันทำงานจำลอง</small></div><p>แผนตามลำดับรับงาน ${fmt(comparison.baseline.makespan)} วัน</p></div><div class="panel sched-metric"><span>เวลาเดินทางเปลี่ยนโซนรวม</span><div><strong>${fmt(comparison.proposed.travel)}</strong><small>ทีม-วัน</small></div><p>จากแผนเดิม ${fmt(comparison.baseline.travel)} ทีม-วัน</p></div><div class="panel sched-metric"><span>งานเสร็จหลังวันเป้าหมาย</span><div><strong class="${comparison.proposed.lateCount ? 'sched-warn' : ''}">${comparison.proposed.lateCount}</strong><small>จาก ${SAMPLE_JOBS.length} งาน</small></div><p>แผนตามลำดับรับงาน ${comparison.baseline.lateCount} งาน</p></div></div>
      <section class="panel sched-plan"><div class="panel-head"><div><h2>แผนลงพื้นที่แต่ละทีม</h2><p class="muted">${planned ? 'คำนวณแผนแล้ว' : 'แผนตัวอย่างคำนวณจากเงื่อนไขด้านบน'} · เลือกงานบนแถบเพื่อดูรายละเอียด</p></div><div class="sched-switch" role="group" aria-label="เลือกแผนเปรียบเทียบ"><button class="${planMode==='baseline'?'active':''}" type="button" data-plan="baseline" aria-pressed="${planMode==='baseline'}">ลำดับรับงาน</button><button class="${planMode==='proposed'?'active':''}" type="button" data-plan="proposed" aria-pressed="${planMode==='proposed'}">แผนที่เสนอ</button></div></div>
        <div class="sched-timeline-scroll">${timeline(plan)}</div>
        <div class="sched-legend">${Object.entries(colors).map(([zone,c])=>`<span><i class="${c}"></i>${zone}</span>`).join('')}<span><i class="transfer"></i>ย้ายโซน</span><span>★ งานเร่งด่วน</span></div>
        ${selection ? `<div class="sched-selection" role="status"><div><strong>${selection.id} · ${selection.name}</strong><p>${selection.parcel} · โซน${selection.zone} · ${selection.teamName}</p></div><div><span>เริ่ม D${fmt(selection.start)} · เสร็จ D${fmt(selection.end)}</span><span class="badge ${selection.late?'warning':'success'}">${selection.late?'หลังเป้าหมาย':'ภายในเป้าหมาย'} D${selection.due}</span></div></div>` : '<p class="sched-hint">เวลาเดินทางเพิ่ม 0.25 วันเมื่อทีมเปลี่ยนโซน; เริ่มงานแรกไม่มีเวลาเดินทางในแบบจำลองนี้</p>'}
      </section>
      <section class="panel sched-jobs"><div class="panel-head"><div><h2>รายการงานและความเร่งด่วน</h2><p class="muted">ติ๊กงานเร่งด่วนเพื่อคำนวณลำดับใหม่ แล้วเปรียบเทียบผล</p></div><label class="sched-sort" for="sched-sort">เรียงตาม<select id="sched-sort"><option value="due" ${sort==='due'?'selected':''}>วันเป้าหมาย</option><option value="zone" ${sort==='zone'?'selected':''}>โซนพื้นที่</option><option value="finish" ${sort==='finish'?'selected':''}>วันเสร็จ</option></select></label></div>
        <div class="table-wrap"><table class="sched-table"><thead><tr><th>เร่งด่วน</th><th>รหัส / งาน</th><th>โซน</th><th>ระยะเวลา</th><th>ทีม</th><th>เสร็จ / เป้าหมาย</th></tr></thead><tbody>${rows.map(job=>`<tr><td><input type="checkbox" data-priority="${job.id}" ${priorityIds.includes(job.id)?'checked':''} aria-label="กำหนด ${job.id} เป็นงานเร่งด่วน"></td><td><strong>${job.id}</strong><small>${job.name} · ${job.parcel}</small></td><td><span class="sched-zone ${colors[job.zone]}">${job.zone}</span></td><td>${fmt(job.duration)} วัน</td><td>${job.teamName}</td><td><span class="${job.late?'sched-warn':''}">D${fmt(job.end)} / D${job.due}</span>${job.late?'<small>หลังเป้าหมาย</small>':''}</td></tr>`).join('')}</tbody></table></div>
        <div class="sched-save"><p>บันทึกแผนที่เสนอ ${crewCount} ทีม สำหรับการสาธิตครั้งนี้</p><button id="sched-save" type="button" class="button primary">ใช้แผนนี้ในเดโม่</button></div></section>
      <div class="sched-method"><strong>กติกาคำนวณที่เปิดเผย</strong><p>แผนเดิมกระจายงานวนทีมตามลำดับรับงาน แผนที่เสนอเรียงงานเร่งด่วนและวันเป้าหมายก่อน แล้วเลือกทีมจากเวลาว่าง เวลาเปลี่ยนโซน และความล่าช้า ตัวเลขมาจากระยะเวลาสมมุติ ไม่รวมสภาพจราจร วันหยุด สภาพอากาศ หรือทักษะเฉพาะทีม และไม่รับประกันว่าเป็นแผนที่ดีที่สุด</p></div>`;
    container.querySelector('#sched-crews').addEventListener('change', event => { crewCount = Number(event.target.value); planned = false; selectedJob = null; draw(); container.querySelector('#sched-crews').focus(); });
    container.querySelector('#sched-sort').addEventListener('change', event => { sort = event.target.value; draw(); container.querySelector('#sched-sort').focus(); });
    container.querySelector('#sched-calculate').addEventListener('click', () => { planned = true; planMode='proposed'; draw(); ctx.toast(`คำนวณแล้ว ${crewCount} ทีม คาดว่าเสร็จ D${fmt(comparison.proposed.makespan)} ในแบบจำลอง`); });
    container.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>{planMode=button.dataset.plan;selectedJob=null;draw();container.querySelector(`[data-plan="${planMode}"]`).focus();}));
    container.querySelectorAll('[data-job]').forEach(button=>button.addEventListener('click',()=>{selectedJob=button.dataset.job;draw();container.querySelector('.sched-selection')?.scrollIntoView({block:'nearest',behavior:'smooth'});}));
    container.querySelectorAll('[data-priority]').forEach(input=>input.addEventListener('change',()=>{priorityIds=input.checked?[...new Set([...priorityIds,input.dataset.priority])]:priorityIds.filter(id=>id!==input.dataset.priority);planned=false;const id=input.dataset.priority;draw();container.querySelector(`[data-priority="${id}"]`).focus();}));
    container.querySelector('#sched-save').addEventListener('click',()=>{
      const schedule = { crewCount, priorityIds, makespan: comparison.proposed.makespan, travel: comparison.proposed.travel, lateCount: comparison.proposed.lateCount, assignments: comparison.proposed.assignments, savedAt:new Date().toISOString(),demoOnly:true };
      ctx.update({scheduling:schedule});ctx.record('scheduling','บันทึกแผนรังวัดจำลอง',`${SAMPLE_JOBS.length} งาน · ${crewCount} ทีม · เสร็จ D${fmt(schedule.makespan)}`);ctx.toast('บันทึกแผนจำลองแล้ว ดูผลได้ที่ศูนย์บัญชาการ');
    });
  }
  draw();
}
