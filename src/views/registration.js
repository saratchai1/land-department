import { icon, escapeHtml as esc } from '../ui.js';
import { registrationCases, analyzeRegistration, validateRegistrationDecision } from '../registration-model.js';

const decisionLabels = { reviewed: 'ตรวจทานแล้ว', return: 'ส่งคืนแก้ไข', escalate: 'ส่งตรวจเพิ่ม' };
const documentLabels = { titleDeed: 'เอกสารสิทธิ', identity: 'หลักฐานตัวบุคคล', saleContract: 'สัญญา', powerOfAttorney: 'หนังสือมอบอำนาจ' };

export function renderRegistration(container, ctx) {
  let selected = registrationCases[0];
  let draft = { ...selected.form };
  let result = null;
  let focusedCheck = '';
  let reviewDraft = { decision: '', note: '' };

  function downloadReport() {
    if (!result) return;
    const report = { demo: true, disclaimer: 'ข้อมูลสังเคราะห์และกติกาสาธิต ไม่ใช่ผลตรวจรับรองจากกรมที่ดินหรือ OCR จริง', caseId: selected.id, title: selected.title, input: draft, registry: selected.registry, result, officerReview: (ctx.getState().registrationDecisions || {})[selected.id] || null };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `${selected.id}-demo-review.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.toast('ดาวน์โหลดผลตรวจข้อมูลสาธิตแล้ว');
  }

  function documentMarkup() {
    const flagged = new Set(result?.findings.map(item => item.id) || []);
    return `<div class="reg-document-watermark" aria-hidden="true">DEMO</div>
      <div class="reg-document-top"><span class="reg-paper-emblem" aria-hidden="true">${icon('file', 26)}</span><span>แบบแสดงข้อมูลสาธิต<br><small>ใช้ประกอบการนำเสนอเท่านั้น</small></span></div>
      <div class="reg-paper-rule"></div>
      <div class="reg-document-title">คำขอจดทะเบียนสิทธิและนิติกรรม</div>
      <div class="reg-paper-meta"><span>เลขคำขอ <strong>${esc(selected.id)}</strong></span><span>เลขอ้างอิง <strong>${esc(selected.title)}</strong></span></div>
      <dl class="reg-document-fields">
        <div data-document-field="owner" class="${flagged.has('owner') ? 'reg-highlight' : ''} ${focusedCheck === 'owner' ? 'reg-focused' : ''}"><dt>ผู้โอน / ผู้ยื่นคำขอ</dt><dd>${esc(draft.owner || '—')}</dd></div>
        <div data-document-field="parcel" class="${flagged.has('parcel') ? 'reg-highlight' : ''} ${focusedCheck === 'parcel' ? 'reg-focused' : ''}"><dt>รหัสแปลงที่ดิน</dt><dd>${esc(draft.parcel || '—')}</dd></div>
        <div data-document-field="area" class="${flagged.has('area') ? 'reg-highlight' : ''} ${focusedCheck === 'area' ? 'reg-focused' : ''}"><dt>เนื้อที่ตามคำขอ</dt><dd>${Number(draft.area).toLocaleString('th-TH')} <small>ตารางเมตร</small></dd></div>
      </dl>
      <div class="reg-paper-doclist">${Object.entries(documentLabels).map(([id, label]) => `<div data-document-field="${id}" class="${flagged.has(id) ? 'reg-highlight' : ''} ${focusedCheck === id ? 'reg-focused' : ''}"><span class="reg-paper-checkbox ${draft[id] ? 'checked' : ''}">${draft[id] ? '✓' : ''}</span>${label}${id === 'powerOfAttorney' && !draft.representative ? ' (ไม่ใช้ในเคสนี้)' : ''}</div>`).join('')}</div>
      <div class="reg-paper-signature"><span>ผู้ยื่นคำขอตัวอย่าง</span><span>เจ้าหน้าที่ผู้รับตัวอย่าง</span></div>
      <div class="reg-paper-footer">ไม่มีผลทางกฎหมาย · ไม่มีข้อมูลบุคคลจริง</div>`;
  }

  function refreshDocument() {
    container.querySelector('#reg-document').innerHTML = documentMarkup();
  }

  function resultsMarkup() {
    const saved = (ctx.getState().registrationDecisions || {})[selected.id];
    return `<div class="panel-head"><div><span class="eyebrow">REVIEW ASSISTANT</span><h2>ผลตรวจข้อมูลตัวอย่าง</h2></div>${result ? `<span class="badge ${result.findings.length ? 'warning' : 'success'}">${result.findings.length ? `${result.findings.length} ข้อสังเกต` : 'ข้อมูลตรงกัน'}</span>` : `<span class="badge neutral">พร้อมตรวจ</span>`}</div>
      ${!result ? `<div class="reg-await"><span class="reg-await-icon">${icon('search', 32)}</span><h3>ให้ระบบช่วยตรวจรอบแรก</h3><p>กด “ตรวจข้อมูลตัวอย่าง” เพื่อเปรียบเทียบข้อมูลคำขอ<br>กับทะเบียนและรายการเอกสาร</p><span class="reg-method">ใช้ฟิลด์ที่สกัดไว้แล้ว · ตรวจด้วยกติกาสาธิต</span></div>` : `
      <div class="reg-result-summary ${result.findings.length ? 'has-findings' : ''}"><strong>${result.passed}<span> / ${result.total}</span></strong><div>รายการที่ตรงตามเงื่อนไข<small>${result.findings.length ? 'เลือกข้อสังเกตเพื่อดูตำแหน่งในเอกสาร' : 'พร้อมให้เจ้าหน้าที่ทบทวนต่อ'}</small></div></div>
      <div class="reg-check-list">${result.checks.map(check => `<button type="button" class="reg-check ${check.pass ? 'is-pass' : 'is-flag'} ${focusedCheck === check.id ? 'is-selected' : ''}" data-check="${check.id}" aria-pressed="${focusedCheck === check.id}"><span class="reg-check-icon">${icon(check.pass ? 'check' : 'alert', 17)}</span><span><strong>${esc(check.label)}</strong><small>${check.pass ? 'ตรงตามเงื่อนไข' : `${esc(check.actual)} · ควรเป็น ${esc(check.expected)}`}</small><span class="reg-check-explanation">${esc(check.explanation)}</span></span></button>`).join('')}</div>
      <form id="reg-review-form" class="reg-officer-review"><div class="reg-officer-title">${icon('shield', 18)} <strong>เจ้าหน้าที่เป็นผู้ตัดสินใจ</strong></div><label class="field" for="reg-decision">ผลการทบทวนสาธิต<select id="reg-decision" name="decision"><option value="">เลือกผลการทบทวน</option><option value="return" ${reviewDraft.decision === 'return' ? 'selected' : ''}>ส่งคืนแก้ไขข้อมูล / เอกสาร</option><option value="escalate" ${reviewDraft.decision === 'escalate' ? 'selected' : ''}>ส่งให้ผู้เชี่ยวชาญตรวจเพิ่มเติม</option><option value="reviewed" ${reviewDraft.decision === 'reviewed' ? 'selected' : ''}>ยืนยันว่าทบทวนแล้ว (ไม่ใช่อนุมัติจดทะเบียน)</option></select></label><label class="field" for="reg-note">บันทึกเหตุผล${result.findings.length ? ' (จำเป็นเมื่อมีข้อสังเกต)' : ''}<textarea id="reg-note" name="note" rows="2" placeholder="เช่น ขอให้ตรวจสอบรหัสผู้โอนและแนบหนังสือมอบอำนาจ" maxlength="600">${esc(reviewDraft.note)}</textarea></label><p id="reg-review-error" class="reg-form-error" role="alert"></p><button class="button primary reg-full" type="submit">${icon('check', 18)} บันทึกผลทบทวนสาธิต</button></form>`}
      ${saved ? `<div class="reg-saved-review"><span class="badge success">ผลที่บันทึกล่าสุด</span><strong>${esc(decisionLabels[saved.decision] || saved.decision)}</strong><p>${esc(saved.note || 'เจ้าหน้าที่ได้ตรวจทานข้อมูลตัวอย่างแล้ว')}</p><small>${esc(selected.id)} · บันทึกในเบราว์เซอร์นี้</small></div>` : ''}`;
  }

  function refreshResults() {
    container.querySelector('#reg-results').innerHTML = resultsMarkup();
    container.querySelector('#reg-export').disabled = !result;
    container.querySelectorAll('[data-check]').forEach(button => button.addEventListener('click', () => {
      focusedCheck = button.dataset.check;
      refreshDocument(); refreshResults();
      container.querySelector(`[data-check="${focusedCheck}"]`)?.focus({ preventScroll: true });
    }));
    container.querySelector('#reg-review-form')?.addEventListener('input', event => {
      if (event.target.name) reviewDraft[event.target.name] = event.target.value;
    });
    container.querySelector('#reg-review-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const decision = String(form.get('decision') || '');
      const note = String(form.get('note') || '').trim();
      const error = validateRegistrationDecision(result, decision, note);
      if (error) { container.querySelector('#reg-review-error').textContent = error; return; }
      const saved = { decision, note, findings: result.findings.length, at: new Date().toISOString(), input: { ...draft } };
      ctx.update({ registrationDecisions: { ...(ctx.getState().registrationDecisions || {}), [selected.id]: saved } });
      ctx.record('registration', `ทบทวนคำขอ ${selected.id}`, `${decisionLabels[decision]} · ${result.findings.length} ข้อสังเกต (ข้อมูลสาธิต)`);
      ctx.toast('บันทึกผลทบทวนสาธิตแล้ว');
      refreshResults();
      container.querySelector(`[data-case="${selected.id}"] .reg-case-status`).textContent = decisionLabels[decision];
    });
  }

  function draw() {
    const decisions = ctx.getState().registrationDecisions || {};
    container.innerHTML = `<section class="reg-module">
      <div class="reg-module-heading"><div><span class="eyebrow">SMART REGISTRATION</span><h1>ตรวจเอกสารให้พร้อม ก่อนถึงมือเจ้าหน้าที่</h1><p class="muted">จากเจ้าหน้าที่อ่านเอกสารทุกหน้า สู่ระบบช่วยตรวจรอบแรก และเจ้าหน้าที่ตัดสินใจ</p></div><button id="reg-export" class="button secondary" type="button" disabled>${icon('download', 18)} ผลตรวจ JSON</button></div>
      <div class="reg-demo-strip">${icon('file', 17)} <span>ข้อมูลที่สกัดไว้ล่วงหน้าเพื่อสาธิต · กติกาเปรียบเทียบข้อมูล ไม่ใช่ OCR หรือ AI ที่เชื่อมระบบจริง</span></div>
      <div class="reg-layout"><aside class="reg-case-column"><div class="reg-list-label"><strong>คำขอตัวอย่าง</strong><span class="badge neutral">${registrationCases.length} เคส</span></div><div class="reg-cases">${registrationCases.map(sample => `<button type="button" class="reg-case ${sample.id === selected.id ? 'active' : ''}" data-case="${sample.id}" aria-pressed="${sample.id === selected.id}"><span class="reg-case-code">${esc(sample.id)}<span class="reg-case-dot"></span></span><strong>${esc(sample.label)}</strong><span class="reg-case-parcel">${esc(sample.parcel)} · ${sample.registry.area.toLocaleString('th-TH')} ตร.ม.</span><span class="reg-case-status">${decisions[sample.id] ? esc(decisionLabels[decisions[sample.id].decision]) : 'พร้อมทดลอง'}</span></button>`).join('')}</div><div class="reg-registry-card"><span class="eyebrow">REFERENCE DATA</span><h3>ทะเบียนอ้างอิงตัวอย่าง</h3><dl><div><dt>ผู้ถือสิทธิ</dt><dd>${esc(selected.registry.owner)}</dd></div><div><dt>รหัสแปลง</dt><dd>${esc(selected.registry.parcel)}</dd></div><div><dt>เนื้อที่</dt><dd>${selected.registry.area.toLocaleString('th-TH')} ตร.ม.</dd></div></dl><p>ค่าชุดนี้คงที่ ใช้เป็นฐานเปรียบเทียบกับคำขอที่คุณทดลองแก้ไข</p></div></aside>
      <div class="reg-work-column"><div class="panel reg-document-panel"><div class="panel-head"><div><span class="eyebrow">DOCUMENT PREVIEW</span><h2>ชุดคำขอ ${esc(selected.id)}</h2></div><span class="badge neutral">ข้อมูลสังเคราะห์</span></div><div class="reg-document-stage"><div id="reg-document" class="reg-document">${documentMarkup()}</div></div></div>
      <form id="reg-input-form" class="panel reg-input-panel"><div class="reg-input-heading"><div><h2>ทดลองเปลี่ยนข้อมูล</h2><p class="muted">${esc(selected.summary)}</p></div><button class="button ghost" id="reg-correct" type="button">ใช้ข้อมูลที่ครบและตรงกัน</button></div><div class="reg-input-grid"><label class="field" for="reg-owner">รหัสผู้โอน<input id="reg-owner" name="owner" value="${esc(draft.owner)}" maxlength="40" autocomplete="off"></label><label class="field" for="reg-parcel">รหัสแปลง<input id="reg-parcel" name="parcel" value="${esc(draft.parcel)}" maxlength="40" autocomplete="off"></label><label class="field" for="reg-area">เนื้อที่ (ตร.ม.)<input id="reg-area" name="area" type="number" min="0.01" step="0.01" value="${draft.area}" required></label></div><div class="reg-doc-toggles"><label class="reg-toggle"><input type="checkbox" name="representative" ${draft.representative ? 'checked' : ''}> มีผู้รับมอบอำนาจ</label>${Object.entries(documentLabels).map(([id, label]) => `<label class="reg-toggle"><input type="checkbox" name="${id}" ${draft[id] ? 'checked' : ''}> ${label}</label>`).join('')}</div><div class="reg-run-row"><button class="button primary" id="reg-analyze" type="submit">${icon('search', 18)} ตรวจข้อมูลตัวอย่าง</button><button class="button ghost" id="reg-restore" type="button">คืนค่าเคสนี้</button><span>แก้ข้อมูลแล้วลองตรวจซ้ำได้</span></div></form></div>
      <aside id="reg-results" class="panel reg-results" aria-live="polite">${resultsMarkup()}</aside></div>
      <div class="reg-footnote">การตรวจตัวอย่างนี้ไม่ยืนยันตัวบุคคล ความแท้ของเอกสาร หรือสิทธิตามกฎหมาย ผลที่บันทึกเป็นการจำลองการทบทวนในเบราว์เซอร์ของคุณ</div></section>`;
    container.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
      selected = registrationCases.find(sample => sample.id === button.dataset.case);
      draft = { ...selected.form }; result = null; focusedCheck = ''; reviewDraft = { decision: '', note: '' }; draw();
    }));
    container.querySelector('#reg-input-form').addEventListener('input', event => {
      const input = event.target;
      if (!input.name) return;
      draft[input.name] = input.type === 'checkbox' ? input.checked : input.value;
      result = null; focusedCheck = ''; reviewDraft = { decision: '', note: '' }; refreshDocument(); refreshResults();
    });
    container.querySelector('#reg-input-form').addEventListener('submit', event => {
      event.preventDefault(); result = analyzeRegistration(selected, draft); focusedCheck = result.findings[0]?.id || '';
      refreshDocument(); refreshResults();
      ctx.toast(result.findings.length ? `พบ ${result.findings.length} ประเด็นให้เจ้าหน้าที่ทบทวน` : 'ข้อมูลตัวอย่างตรงตามเงื่อนไขทั้งหมด');
    });
    container.querySelector('#reg-correct').addEventListener('click', () => {
      draft = { ...selected.form, ...selected.registry, titleDeed: true, identity: true, saleContract: true, powerOfAttorney: selected.form.representative };
      result = null; focusedCheck = ''; reviewDraft = { decision: '', note: '' }; draw(); ctx.toast('เติมชุดข้อมูลที่ครบแล้ว กดตรวจเพื่อเปรียบเทียบผล');
    });
    container.querySelector('#reg-restore').addEventListener('click', () => { draft = { ...selected.form }; result = null; focusedCheck = ''; reviewDraft = { decision: '', note: '' }; draw(); });
    container.querySelector('#reg-export').addEventListener('click', downloadReport);
    refreshResults();
  }
  draw();
}
