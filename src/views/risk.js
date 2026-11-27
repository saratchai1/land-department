import { icon, escapeHtml as esc } from '../ui.js';
import { riskCases, scoreRisk, filterRiskCases, validateRiskDecision } from '../risk-model.js';

const levelLabels = { high: 'ควรทบทวนก่อน', medium: 'ควรตรวจบริบท', low: 'สัญญาณระดับต่ำ' };
const dispositionLabels = { escalated: 'ส่งตรวจเพิ่มเติม', closed: 'ปิดการแจ้งเตือนพร้อมเหตุผล' };

export function renderRisk(container, ctx) {
  let selectedId = riskCases[0].id;
  let status = 'all';
  let threshold = 0;

  const decisions = () => ctx.getState().riskDecisions || {};
  const filtered = () => filterRiskCases(riskCases, { threshold, status, decisions: decisions() });

  function detailMarkup(sample) {
    const risk = scoreRisk(sample);
    const saved = decisions()[sample.id];
    return `<div class="risk-detail-header"><div><span class="eyebrow">EXPLAINABLE REVIEW</span><h2>${esc(sample.title)}</h2><p>${esc(sample.id)} · ${esc(sample.parcel)} · ${esc(sample.office)}</p></div><div class="risk-score ${risk.level}"><strong>${risk.score}</strong><span>/ 100</span></div></div>
      <div class="risk-score-caption"><span class="badge ${risk.level === 'high' ? 'warning' : 'neutral'}">${levelLabels[risk.level]}</span><span>คะแนนจัดลำดับจากกติกาตัวอย่าง ไม่ใช่โอกาสเกิดการทุจริต</span></div>
      <div class="risk-detail-columns"><div><div class="risk-block-heading"><h3>เหตุผลที่ระบบยกขึ้นมาให้ตรวจ</h3><span>${risk.active.length} สัญญาณ</span></div><div class="risk-signals">${sample.signals.map(signal => `<div class="risk-signal ${signal.active ? 'active' : ''}"><span class="risk-signal-symbol">${icon(signal.active ? 'alert' : 'check', 18)}</span><div><strong>${esc(signal.label)}</strong><p>${esc(signal.detail)}</p></div><span class="risk-weight">${signal.active ? '+' : ''}${signal.active ? signal.weight : 0}<small>/${signal.weight}</small></span></div>`).join('')}</div><div class="risk-formula"><strong>วิธีคิดคะแนน</strong><span>รวมเฉพาะน้ำหนักสัญญาณที่พบ: ${risk.active.map(signal => signal.weight).join(' + ')} = <b>${risk.score}</b></span><small>น้ำหนักเป็นค่าที่กำหนดเพื่อสาธิต ยังไม่ผ่านการสอบเทียบกับข้อมูลจริง</small></div></div>
      <div class="risk-timeline-block"><div class="risk-block-heading"><h3>ลำดับเหตุการณ์ตัวอย่าง</h3>${icon('clock', 18)}</div><ol class="risk-timeline">${sample.timeline.map(([date, time, description]) => `<li><div><time>${esc(date)} <span>${esc(time)}</span></time><p>${esc(description)}</p></div></li>`).join('')}</ol><div class="risk-context-note">${icon('file', 20)}<p>สัญญาณเดียวกันอาจเกิดจากการแก้ข้อมูล การนำเข้าย้อนหลัง หรือเหตุผลที่ถูกต้อง ต้องตรวจหลักฐานและบริบทก่อนสรุป</p></div>${sample.registration === 'DEMO-R0142' ? `<button class="button secondary risk-full" type="button" id="risk-open-registration">เปิดคำขอ ${esc(sample.registration)}</button>` : ''}</div></div>
      <form id="risk-review-form" class="risk-review"><div class="risk-review-intro"><span class="risk-review-icon">${icon('shield', 23)}</span><div><h3>การทบทวนโดยเจ้าหน้าที่</h3><p>ระบบช่วยจัดลำดับงาน การตัดสินใจและเหตุผลอยู่กับผู้ตรวจ</p></div></div><div class="risk-review-fields"><label class="field" for="risk-disposition">ผลการทบทวน<select id="risk-disposition" name="disposition"><option value="">เลือกผลการทบทวน</option><option value="escalated">ส่งตรวจสอบเพิ่มเติม</option><option value="closed">ปิดการแจ้งเตือน — มีคำอธิบายรองรับ</option></select></label><label class="field" for="risk-note">เหตุผล / หลักฐานอ้างอิงตัวอย่าง<textarea id="risk-note" name="note" rows="2" maxlength="600" placeholder="เช่น ตรวจพบการนำเข้าข้อมูลย้อนหลังตามบันทึกตัวอย่าง DEMO-LOG-01"></textarea></label></div><p id="risk-error" class="reg-form-error" role="alert"></p><div class="risk-review-bottom"><span>บันทึกเฉพาะในเบราว์เซอร์นี้</span><button class="button primary" type="submit">${icon('check', 18)} บันทึกผลทบทวน</button></div></form>
      ${saved ? `<div class="risk-saved"><div><span class="badge success">ทบทวนแล้ว</span><strong>${esc(dispositionLabels[saved.disposition] || saved.disposition)}</strong></div><p>${esc(saved.note)}</p><small>คะแนนเดิม ${saved.score}/100 · สถานะเปลี่ยนจากการทบทวนของเจ้าหน้าที่ ไม่ได้ลบประวัติสัญญาณ</small></div>` : ''}`;
  }

  function drawDetail() {
    const list = filtered();
    if (!list.some(sample => sample.id === selectedId)) selectedId = list[0]?.id || '';
    const sample = list.find(item => item.id === selectedId);
    const panel = container.querySelector('#risk-detail');
    panel.innerHTML = sample ? detailMarkup(sample) : `<div class="risk-empty">${icon('shield', 46)}<h2>ไม่มีรายการตามตัวกรองนี้</h2><p>ลดคะแนนขั้นต่ำ หรือเลือกสถานะ “ทั้งหมด”<br>เพื่อดูเคสตัวอย่างอื่น</p><button id="risk-clear-filter" class="button secondary" type="button">ล้างตัวกรอง</button></div>`;
    panel.querySelector('#risk-clear-filter')?.addEventListener('click', () => { threshold = 0; status = 'all'; draw(); });
    panel.querySelector('#risk-open-registration')?.addEventListener('click', () => ctx.navigate('registration'));
    panel.querySelector('#risk-review-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const disposition = String(form.get('disposition') || '');
      const note = String(form.get('note') || '').trim();
      const error = validateRiskDecision(disposition, note);
      if (error) { panel.querySelector('#risk-error').textContent = error; return; }
      const score = scoreRisk(sample).score;
      ctx.update({ riskDecisions: { ...decisions(), [sample.id]: { disposition, note, score, at: new Date().toISOString() } } });
      ctx.record('risk', `ทบทวนการแจ้งเตือน ${sample.id}`, `${dispositionLabels[disposition]} · ${sample.parcel} (ข้อมูลสาธิต)`);
      ctx.toast('บันทึกผลทบทวนแล้ว พร้อมตรวจสอบย้อนหลัง');
      draw();
    });
  }

  function drawList() {
    const list = filtered();
    if (!list.some(sample => sample.id === selectedId)) selectedId = list[0]?.id || '';
    container.querySelector('#risk-list-count').textContent = `${list.length} รายการ`;
    container.querySelector('#risk-cases').innerHTML = list.length ? list.map(sample => {
      const risk = scoreRisk(sample), saved = decisions()[sample.id];
      return `<button type="button" class="risk-case ${sample.id === selectedId ? 'selected' : ''}" data-risk-case="${sample.id}" aria-pressed="${sample.id === selectedId}"><span class="risk-case-top"><strong>${esc(sample.parcel)}</strong><span class="risk-mini-score ${risk.level}">${risk.score}</span></span><span class="risk-case-title">${esc(sample.title)}</span><span class="risk-case-bottom"><small>${esc(sample.id)}</small><span class="${saved ? 'risk-done' : ''}">${saved ? 'ทบทวนแล้ว' : 'รอทบทวน'}</span></span></button>`;
    }).join('') : `<p class="risk-list-empty">ไม่พบรายการตามเงื่อนไข</p>`;
    container.querySelectorAll('[data-risk-case]').forEach(button => button.addEventListener('click', () => { selectedId = button.dataset.riskCase; drawList(); drawDetail(); }));
  }

  function draw() {
    const reviewed = riskCases.filter(sample => decisions()[sample.id]).length;
    container.innerHTML = `<section class="risk-module"><div class="risk-module-heading"><div><span class="eyebrow">ANOMALY REVIEW</span><h1>เห็นสัญญาณเร็ว ตรวจสอบได้ทุกเหตุผล</h1><p class="muted">เปลี่ยนจากการตรวจสอบหลังเกิดปัญหา เป็นการยกประเด็นให้เจ้าหน้าที่พิจารณาได้เร็วขึ้น</p></div><span class="badge neutral">ข้อมูลสังเคราะห์</span></div>
      <div class="risk-principle">${icon('shield', 21)}<div><strong>แจ้งเตือนเพื่อทบทวน ไม่ใช่คำกล่าวหาว่าทุจริต</strong><span>คะแนนคำนวณจากกติกาสาธิต ทุกเคสต้องตรวจหลักฐานและให้เจ้าหน้าที่สรุปผล</span></div></div>
      <div class="risk-kpis"><div><span>ชุดเคสตัวอย่าง</span><strong>${riskCases.length}<small>รายการ</small></strong></div><div><span>รอเจ้าหน้าที่ทบทวน</span><strong>${riskCases.length - reviewed}<small>รายการ</small></strong></div><div><span>มีผลทบทวนแล้ว</span><strong>${reviewed}<small>รายการ</small></strong></div><div class="risk-kpi-note"><span>การตัดสินใจที่ตรวจสอบได้</span><strong>Human <i>in the loop</i></strong></div></div>
      <div class="risk-layout"><aside class="panel risk-queue"><div class="panel-head"><h2>คิวตรวจสอบ</h2><span class="badge neutral" id="risk-list-count"></span></div><div class="risk-filters"><label class="field" for="risk-status">สถานะ<select id="risk-status"><option value="all" ${status === 'all' ? 'selected' : ''}>ทั้งหมด</option><option value="pending" ${status === 'pending' ? 'selected' : ''}>รอทบทวน</option><option value="reviewed" ${status === 'reviewed' ? 'selected' : ''}>ทบทวนแล้ว</option></select></label><label class="risk-threshold-label" for="risk-threshold"><span>คะแนนขั้นต่ำ</span><strong id="risk-threshold-value">${threshold}</strong></label><input id="risk-threshold" class="risk-threshold" type="range" min="0" max="100" step="5" value="${threshold}" aria-valuetext="${threshold} คะแนน"><div class="risk-range-labels"><span>เห็นทุกเคส</span><span>คัดเฉพาะคะแนนสูง</span></div></div><div id="risk-cases" class="risk-cases"></div><div class="risk-queue-footnote">ปรับเกณฑ์เพื่อเห็นผลต่อจำนวนงานที่เจ้าหน้าที่ต้องทบทวน</div></aside><article id="risk-detail" class="panel risk-detail" aria-live="polite"></article></div></section>`;
    drawList(); drawDetail();
    container.querySelector('#risk-status').addEventListener('change', event => { status = event.target.value; drawList(); drawDetail(); });
    container.querySelector('#risk-threshold').addEventListener('input', event => {
      threshold = Number(event.target.value);
      event.target.setAttribute('aria-valuetext', `${threshold} คะแนน`);
      container.querySelector('#risk-threshold-value').textContent = threshold;
      drawList(); drawDetail();
    });
  }
  draw();
}
