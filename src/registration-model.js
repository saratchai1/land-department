export const registrationCases = [
  {
    id: 'DEMO-R0142', parcel: 'DEMO-P021', title: 'DEMO-01024', label: 'โอนกรรมสิทธิ์ · มีผู้รับมอบอำนาจ', office: 'สำนักงานสาธิต A',
    registry: { owner: 'DEMO-A', parcel: 'DEMO-P021', area: 8000 },
    form: { owner: 'DEMO-B', parcel: 'DEMO-P021', area: 8000, representative: true, titleDeed: true, identity: true, saleContract: true, powerOfAttorney: false },
    summary: 'ลองหาความต่างของผู้ถือสิทธิ และเอกสารมอบอำนาจที่ยังไม่ครบ',
  },
  {
    id: 'DEMO-R0143', parcel: 'DEMO-P022', title: 'DEMO-01025', label: 'โอนกรรมสิทธิ์ · ผู้ถือสิทธิดำเนินการเอง', office: 'สำนักงานสาธิต B',
    registry: { owner: 'DEMO-C', parcel: 'DEMO-P022', area: 4800 },
    form: { owner: 'DEMO-C', parcel: 'DEMO-P022', area: 4800, representative: false, titleDeed: true, identity: true, saleContract: true, powerOfAttorney: false },
    summary: 'ชุดข้อมูลตรงกัน ใช้เปรียบเทียบขั้นตอนของเคสที่ไม่มีข้อสังเกต',
  },
  {
    id: 'DEMO-R0144', parcel: 'DEMO-P023', title: 'DEMO-01026', label: 'โอนกรรมสิทธิ์ · ต้องทบทวนเนื้อที่', office: 'สำนักงานสาธิต A',
    registry: { owner: 'DEMO-D', parcel: 'DEMO-P023', area: 6400 },
    form: { owner: 'DEMO-D', parcel: 'DEMO-P023', area: 6640, representative: false, titleDeed: true, identity: true, saleContract: false, powerOfAttorney: false },
    summary: 'เนื้อที่ไม่ตรงทะเบียนตัวอย่าง และยังไม่มีสัญญาในชุดเอกสาร',
  },
];

const normalized = value => String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toUpperCase();

export function analyzeRegistration(sample, form) {
  const area = Number(form.area);
  const validArea = Number.isFinite(area) && area > 0;
  const fields = [
    { id: 'owner', label: 'ผู้ถือสิทธิกับผู้โอน', pass: !!normalized(form.owner) && normalized(form.owner) === normalized(sample.registry.owner), actual: String(form.owner || 'ไม่ระบุ'), expected: sample.registry.owner, explanation: 'เปรียบเทียบรหัสผู้โอนในคำขอกับผู้ถือสิทธิในทะเบียนตัวอย่าง' },
    { id: 'parcel', label: 'รหัสแปลง', pass: normalized(form.parcel) === normalized(sample.registry.parcel), actual: String(form.parcel || 'ไม่ระบุ'), expected: sample.registry.parcel, explanation: 'รหัสแปลงต้องตรงกันทั้งชุดคำขอและทะเบียนตัวอย่าง' },
    { id: 'area', label: 'เนื้อที่', pass: validArea && Math.abs(area - sample.registry.area) < 0.01, actual: validArea ? `${area.toLocaleString('th-TH')} ตร.ม.` : 'ข้อมูลไม่ถูกต้อง', expected: `${sample.registry.area.toLocaleString('th-TH')} ตร.ม.`, explanation: validArea ? 'ตรวจค่าตัวเลขจากข้อมูลที่สกัดไว้แล้ว ไม่ใช่การรับรองผลรังวัด' : 'กรอกเนื้อที่เป็นจำนวนบวกที่ถูกต้อง' },
  ];
  const required = [
    ['titleDeed', 'เอกสารสิทธิตัวอย่าง'], ['identity', 'หลักฐานยืนยันตัวบุคคลตัวอย่าง'], ['saleContract', 'สัญญาตัวอย่าง'],
  ];
  if (form.representative) required.push(['powerOfAttorney', 'หนังสือมอบอำนาจตัวอย่าง']);
  const documents = required.map(([id, label]) => ({ id, label, pass: form[id] === true, actual: form[id] === true ? 'มีในชุดเอกสาร' : 'ยังไม่มี', expected: 'ต้องมี', explanation: id === 'powerOfAttorney' ? 'ตัวเลือก “มีผู้รับมอบอำนาจ” ทำให้เอกสารนี้เป็นรายการที่ต้องตรวจ' : 'ตรวจว่ามีรายการเอกสารในชุดข้อมูลสาธิต' }));
  const checks = [...fields, ...documents];
  return { caseId: sample.id, checks, findings: checks.filter(check => !check.pass), passed: checks.filter(check => check.pass).length, total: checks.length };
}

export function validateRegistrationDecision(result, decision, note) {
  if (!result) return 'กรุณาตรวจข้อมูลตัวอย่างก่อนบันทึกผล';
  if (!['reviewed', 'return', 'escalate'].includes(decision)) return 'กรุณาเลือกผลการทบทวน';
  if (result.findings.length > 0 && String(note || '').trim().length < 8) return 'กรุณาระบุเหตุผลอย่างน้อย 8 ตัวอักษร เพื่อให้ตรวจสอบการตัดสินใจย้อนหลังได้';
  return '';
}
