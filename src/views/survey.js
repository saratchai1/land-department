import { inspectSurvey, makeSurvey, NEIGHBOR_PARCEL, REFERENCE_PARCEL, REGISTERED_AREA } from '../survey-model.js';

const fmt = n => n === null ? '—' : new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n);
const point = ([x, y]) => `${64 + x * 3.45},${385 - y * 3.45}`;
const pts = ring => ring.map(point).join(' ');
const presets = [ ['overlap', 'แนวเขตซ้อนทับ'], ['clean', 'ข้อมูลสอดคล้อง'], ['open', 'วงรอบไม่ปิด'], ['crossed', 'เส้นขอบตัดกัน'] ];

function mapSvg(coordinates, result) {
  return `<svg class="sv-map" viewBox="0 0 660 450" role="img" aria-labelledby="sv-map-title sv-map-desc">
    <title id="sv-map-title">พิกัดแปลง DEMO-P021 และแปลงข้างเคียง</title><desc id="sv-map-desc">พิกัดฉากจำลอง หน่วยเมตร เส้นประคือแนวทะเบียนตัวอย่าง สีเขียวคือแนวรังวัด และสีส้มคือพื้นที่ซ้อนทับที่คำนวณได้</desc>
    <defs><pattern id="sv-grid" width="34.5" height="34.5" patternUnits="userSpaceOnUse" x="64" y="40"><path d="M34.5 0H0V34.5" fill="none" stroke="#d9e4e4" stroke-width=".7"/></pattern><pattern id="sv-overlap" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="7" height="7" fill="#edba68" fill-opacity=".55"/><path d="M0 0V7" stroke="#bd711b" stroke-width="2"/></pattern></defs>
    <rect x="0" y="0" width="660" height="450" fill="#f0f6f4"/><rect x="30" y="28" width="600" height="390" fill="url(#sv-grid)"/>
    <path d="M40 397H620M52 410V27" stroke="#9bb4b0" stroke-width="1.3"/>
    ${[0, 25, 50, 75, 100, 125, 150].map(x => `<text x="${64 + x * 3.45}" y="416" text-anchor="middle" class="sv-axis">${x}</text>`).join('')}
    ${[0, 20, 40, 60, 80, 100].map(y => `<text x="41" y="${389 - y * 3.45}" text-anchor="end" class="sv-axis">${y}</text>`).join('')}
    <text x="608" y="438" class="sv-axis">X (เมตร)</text><text x="14" y="20" class="sv-axis">Y (เมตร)</text>
    <polygon points="${pts(NEIGHBOR_PARCEL)}" fill="#dce5de" stroke="#9bb39e" stroke-width="2"/>
    <text x="${64 + 125 * 3.45}" y="235" text-anchor="middle" class="sv-plot-label">แปลงข้างเคียง</text><text x="${64 + 125 * 3.45}" y="257" text-anchor="middle" class="sv-axis">DEMO-P022</text>
    <polygon points="${pts(REFERENCE_PARCEL)}" fill="none" stroke="#405f66" stroke-width="2" stroke-dasharray="7 6"/>
    <polyline points="${pts(coordinates)}" fill="${result.valid ? '#1b9382' : '#dc9240'}" fill-opacity=".15" stroke="${result.valid ? '#0f8074' : '#bd711b'}" stroke-width="3.2" stroke-linejoin="round"/>
    ${result.overlapPolygon.length ? `<polygon points="${pts(result.overlapPolygon)}" fill="url(#sv-overlap)" stroke="#bf7722" stroke-width="2"/>` : ''}
    <rect x="143" y="215" width="171" height="63" rx="8" fill="#fff" fill-opacity=".94"/><text x="228" y="239" text-anchor="middle" class="sv-plot-label">DEMO-P021</text><text x="228" y="260" text-anchor="middle" class="sv-axis">${fmt(result.area)} ตร.ม. ที่คำนวณได้</text>
    ${coordinates.map((p, i) => `<circle cx="${64+p[0]*3.45}" cy="${385-p[1]*3.45}" r="4.7" fill="#fff" stroke="#0e756b" stroke-width="2"/><text x="${64+p[0]*3.45+9}" y="${385-p[1]*3.45-9}" class="sv-axis">${i === coordinates.length - 1 ? 'P1′' : `P${i+1}`}</text>`).join('')}
    <g transform="translate(591 47)"><path d="M0 24V-2M-5 5L0-4L5 5" stroke="#183e3f" stroke-width="1.6" fill="none"/><text x="0" y="-12" text-anchor="middle" class="sv-axis">N*</text></g>
    <g transform="translate(85 50)"><path d="M0 0H69M0-4V4M69-4V4" stroke="#416962" stroke-width="2"/><text x="34" y="19" text-anchor="middle" class="sv-axis">20 เมตร</text></g>
  </svg>`;
}

export function renderSurveyQA(container, ctx) {
  let preset = 'overlap', eastShift = 5, closureTolerance = 0.05, areaTolerancePercent = 1;
  let inspected = false;
  function draw() {
    const coordinates = makeSurvey(preset, eastShift);
    const result = inspectSurvey(coordinates, { closureTolerance, areaTolerancePercent });
    const flags = result.checks.filter(c => !c.ok && !c.skipped).length;
    container.innerHTML = `<div class="sv-intro"><div><span class="eyebrow">INTELLIGENT SURVEY QA</span><h1>ตรวจคุณภาพงานรังวัด</h1><p class="muted">“ตรวจความผิดปกติทุกแปลง ก่อนส่งต่อให้เจ้าหน้าที่”</p></div><span class="badge neutral">พิกัดและเกณฑ์สาธิต</span></div>
      <div class="sv-presets" role="group" aria-label="เลือกสถานการณ์รังวัด">${presets.map(([id, label]) => `<button type="button" class="sv-preset ${preset === id ? 'is-active' : ''}" data-preset="${id}" aria-pressed="${preset === id}">${label}</button>`).join('')}</div>
      <div class="sv-layout"><section class="panel sv-map-panel"><div class="panel-head"><div><h2>มองเห็นจุดที่ต้องตรวจ</h2><p class="muted">DEMO-P021 · ระบบพิกัดฉากจำลอง</p></div><span class="badge ${flags ? 'warning' : 'success'}">${flags ? `${flags} ประเด็นตรวจทาน` : 'ผ่านกติกาสาธิต'}</span></div>
        <div class="sv-map-wrap">${mapSvg(coordinates, result)}</div>
        <div class="sv-legend"><span><i class="sv-key boundary"></i>แนวทะเบียนตัวอย่าง</span><span><i class="sv-key surveyed"></i>แนวรังวัด</span><span><i class="sv-key overlap"></i>พื้นที่ซ้อนทับ</span></div>
        <div class="sv-map-foot"><span>* ทิศและพิกัดสมมุติ ไม่ใช่แผนที่อ้างอิงจริง</span><span>ทะเบียนตัวอย่าง ${fmt(REGISTERED_AREA)} ตร.ม.</span></div>
      </section>
      <aside class="sv-side"><section class="panel sv-controls"><h2>ปรับเงื่อนไขตรวจสอบ</h2>
        <label class="field" for="sv-shift"><span>เลื่อนแนวตะวันออก <strong id="sv-shift-value">${eastShift > 0 ? '+' : ''}${eastShift} ม.</strong></span><input id="sv-shift" type="range" min="-5" max="10" step="1" value="${eastShift}" ${preset !== 'overlap' ? 'disabled' : ''}><small class="muted">ใช้กับสถานการณ์แนวเขตซ้อนทับ</small></label>
        <div class="sv-control-row"><label class="field" for="sv-closure"><span>ค่าปิดวงรอบ (ม.)</span><select id="sv-closure"><option value="0.05" ${closureTolerance===0.05?'selected':''}>0.05</option><option value="0.5" ${closureTolerance===0.5?'selected':''}>0.50</option><option value="2" ${closureTolerance===2?'selected':''}>2.00</option></select></label><label class="field" for="sv-area"><span>พื้นที่คลาดเคลื่อน</span><select id="sv-area"><option value="1" ${areaTolerancePercent===1?'selected':''}>±1%</option><option value="3" ${areaTolerancePercent===3?'selected':''}>±3%</option><option value="5" ${areaTolerancePercent===5?'selected':''}>±5%</option></select></label></div>
        <button class="button primary sv-full" id="sv-inspect" type="button">ตรวจสอบรูปแปลง</button><p class="sv-rule-note">เกณฑ์ที่ปรับนี้ใช้สาธิตเท่านั้น ไม่ใช่ค่ามาตรฐานรังวัดของกรมที่ดิน</p></section>
        <section class="panel sv-summary"><div class="sv-result-title"><h2>${inspected ? 'ผลตรวจล่าสุด' : 'ผลคำนวณตัวอย่าง'}</h2><span class="sv-small-dot ${flags?'warning':''}"></span></div><div class="sv-metrics"><div><small>พื้นที่รังวัด</small><strong>${fmt(result.area)}</strong><span>ตร.ม.</span></div><div><small>ซ้อนทับ</small><strong class="${result.overlapArea > 0 ? 'sv-amber' : ''}">${fmt(result.overlapArea)}</strong><span>ตร.ม.</span></div></div><p class="muted sv-result-note">${result.valid ? `เทียบทะเบียน ${result.areaDifference >= 0 ? '+' : ''}${fmt(result.areaDifference)} ตร.ม. (${fmt(result.areaDifferencePercent)}%)` : 'รูปแปลงไม่สมบูรณ์ กรุณาแก้ไขพิกัดก่อน'}${result.closureGap > closureTolerance ? ' · พื้นที่เป็นค่าเบื้องต้นจากการเชื่อมจุดปลายกลับจุดต้น' : ''}</p></section>
      </aside></div>
      <section class="panel sv-review"><div class="panel-head"><div><h2>รายการตรวจทาน</h2><p class="muted">คำนวณจากพิกัดด้วยกติกาเรขาคณิต เจ้าหน้าที่เป็นผู้พิจารณาขั้นสุดท้าย</p></div><button class="button secondary" id="sv-save" type="button">บันทึกผลตรวจจำลอง</button></div><div class="sv-checks">${result.checks.map(c => `<div class="sv-check"><span class="sv-check-icon ${c.skipped?'skip':c.ok?'pass':'fail'}" aria-hidden="true">${c.skipped?'—':c.ok?'✓':'!'}</span><div><h3>${c.label}</h3><p>${c.detail}</p></div><span class="badge ${c.skipped?'neutral':c.ok?'success':'warning'}">${c.skipped?'รอข้อมูล':c.ok?'ผ่าน':'ทบทวน'}</span></div>`).join('')}</div><div class="sv-disclaimer">ผลนี้เป็นตัวช่วยตรวจข้อมูลจำลอง ไม่ยืนยันแนวเขต กรรมสิทธิ์ หรือผลทางกฎหมาย</div></section>`;
    container.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => { preset = button.dataset.preset; inspected = false; if (preset === 'overlap') eastShift = 5; draw(); container.querySelector(`[data-preset="${preset}"]`).focus(); }));
    container.querySelector('#sv-shift').addEventListener('input', event => { eastShift = Number(event.target.value); container.querySelector('#sv-shift-value').textContent = `${eastShift > 0 ? '+' : ''}${eastShift} ม.`; });
    container.querySelector('#sv-shift').addEventListener('change', () => { inspected = false; draw(); container.querySelector('#sv-shift').focus(); });
    container.querySelector('#sv-closure').addEventListener('change', event => { closureTolerance = Number(event.target.value); inspected = false; draw(); container.querySelector('#sv-closure').focus(); });
    container.querySelector('#sv-area').addEventListener('change', event => { areaTolerancePercent = Number(event.target.value); inspected = false; draw(); container.querySelector('#sv-area').focus(); });
    container.querySelector('#sv-inspect').addEventListener('click', () => { inspected = true; draw(); ctx.toast(flags ? `ตรวจแล้ว พบ ${flags} ประเด็นให้เจ้าหน้าที่ทบทวน` : 'ผ่านกติกาสาธิตครบ 4 รายการ'); });
    container.querySelector('#sv-save').addEventListener('click', () => {
      const checks = ctx.getState().surveyChecks || [];
      const record = { id: `QA-${Date.now()}`, parcel: 'DEMO-P021', preset, area: result.area, overlapArea: result.overlapArea, flags, closureTolerance, areaTolerancePercent, valid: result.valid, createdAt: new Date().toISOString(), demoOnly: true };
      ctx.update({ surveyChecks: [record, ...checks].slice(0, 20) });
      ctx.record('survey', 'บันทึกตรวจคุณภาพ DEMO-P021', `${flags} ประเด็นทบทวน · พื้นที่ซ้อนทับ ${fmt(result.overlapArea)} ตร.ม.`);
      ctx.toast('บันทึกผลตรวจจำลองแล้ว ดูกิจกรรมได้ที่ศูนย์บัญชาการ');
    });
  }
  draw();
}
