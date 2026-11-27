export const riskCases = [
  { id: 'DEMO-A071', parcel: 'DEMO-P021', registration: 'DEMO-R0142', title: 'ตรวจความสอดคล้องของข้อมูลและลำดับรายการ', office: 'สำนักงานสาธิต A',
    signals: [
      { id: 'identity', label: 'รหัสผู้โอนไม่ตรงกับผู้ถือสิทธิตัวอย่าง', weight: 35, active: true, detail: 'คำขอแสดง DEMO-B ขณะที่ทะเบียนตัวอย่างแสดง DEMO-A ต้องตรวจที่มาของความต่าง' },
      { id: 'frequency', label: 'มีการเปลี่ยนรายการหลายครั้งในช่วงสั้น', weight: 25, active: true, detail: 'ชุดเหตุการณ์ตัวอย่างมีการเปลี่ยนผู้ถือสิทธิ 3 รายการใน 14 วัน อาจมีคำอธิบายที่ชอบด้วยเหตุผล' },
      { id: 'time', label: 'บันทึกแก้ไขนอกช่วงเวลาสาธิต', weight: 20, active: true, detail: 'รายการหนึ่งบันทึกเวลา 21:14 อาจเกิดจากการทำงานล่วงเวลาหรือการนำเข้าข้อมูล' },
      { id: 'link', label: 'เอกสารอ้างอิงขาดความเชื่อมโยง', weight: 20, active: false, detail: 'เอกสารอ้างอิงครบในชุดข้อมูลนี้' },
    ],
    timeline: [ ['12 พ.ย.', '09:10', 'สร้างรายการแปลง DEMO-P021'], ['17 พ.ย.', '14:35', 'บันทึกการเปลี่ยนผู้ถือสิทธิตัวอย่าง'], ['22 พ.ย.', '10:25', 'บันทึกการเปลี่ยนผู้ถือสิทธิตัวอย่าง'], ['25 พ.ย.', '13:20', 'บันทึกการเปลี่ยนผู้ถือสิทธิตัวอย่าง'], ['25 พ.ย.', '21:14', 'ปรับปรุงข้อมูลทะเบียนตัวอย่าง'], ['26 พ.ย.', '11:40', 'รับคำขอ DEMO-R0142 สำหรับทบทวน'] ],
  },
  { id: 'DEMO-A072', parcel: 'DEMO-P038', registration: 'DEMO-R0156', title: 'ทบทวนหลักฐานประกอบรายการ', office: 'สำนักงานสาธิต B',
    signals: [
      { id: 'identity', label: 'รหัสผู้โอนไม่ตรงกับผู้ถือสิทธิตัวอย่าง', weight: 35, active: true, detail: 'รหัสคู่กรณีต่างกัน อาจเป็นการบันทึกผิดหรือรายการที่ต้องแก้ไข' },
      { id: 'frequency', label: 'มีการเปลี่ยนรายการหลายครั้งในช่วงสั้น', weight: 25, active: false, detail: 'ไม่พบสัญญาณนี้ในชุดข้อมูลตัวอย่าง' },
      { id: 'time', label: 'บันทึกแก้ไขนอกช่วงเวลาสาธิต', weight: 20, active: false, detail: 'รายการทั้งหมดอยู่ในช่วงเวลาสาธิต' },
      { id: 'link', label: 'เอกสารอ้างอิงขาดความเชื่อมโยง', weight: 20, active: true, detail: 'หนึ่งรายการยังไม่มีรหัสเอกสารอ้างอิงที่ตรวจสอบย้อนกลับได้' },
    ],
    timeline: [ ['08 พ.ย.', '10:20', 'รับชุดข้อมูล DEMO-P038'], ['21 พ.ย.', '13:45', 'แก้ไขรหัสผู้ถือสิทธิตัวอย่าง'], ['26 พ.ย.', '09:20', 'พบรายการที่ยังไม่มีรหัสอ้างอิง'] ],
  },
  { id: 'DEMO-A073', parcel: 'DEMO-P046', registration: 'DEMO-R0162', title: 'ตรวจบริบทการบันทึกนอกเวลา', office: 'สำนักงานสาธิต C',
    signals: [
      { id: 'identity', label: 'รหัสผู้โอนไม่ตรงกับผู้ถือสิทธิตัวอย่าง', weight: 35, active: false, detail: 'รหัสผู้ถือสิทธิตรงกันในชุดข้อมูลตัวอย่าง' },
      { id: 'frequency', label: 'มีการเปลี่ยนรายการหลายครั้งในช่วงสั้น', weight: 25, active: false, detail: 'ไม่พบสัญญาณนี้ในชุดข้อมูลตัวอย่าง' },
      { id: 'time', label: 'บันทึกแก้ไขนอกช่วงเวลาสาธิต', weight: 20, active: true, detail: 'บันทึกเวลา 20:05 และมีหมายเหตุการนำเข้ารายการย้อนหลังในตัวอย่าง' },
      { id: 'link', label: 'เอกสารอ้างอิงขาดความเชื่อมโยง', weight: 20, active: false, detail: 'มีรหัสอ้างอิงครบในชุดข้อมูลตัวอย่าง' },
    ],
    timeline: [ ['15 พ.ย.', '09:30', 'รับคำขอตัวอย่าง DEMO-R0162'], ['25 พ.ย.', '20:05', 'นำเข้ารายการย้อนหลังตามหมายเหตุสาธิต'], ['26 พ.ย.', '08:45', 'ส่งสัญญาณให้เจ้าหน้าที่ตรวจบริบท'] ],
  },
];

export function scoreRisk(sample) {
  const score = sample.signals.reduce((sum, signal) => sum + (signal.active ? signal.weight : 0), 0);
  return { score, active: sample.signals.filter(signal => signal.active), level: score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low' };
}

export function filterRiskCases(cases, { threshold = 0, status = 'all', decisions = {} } = {}) {
  return cases.filter(sample => scoreRisk(sample).score >= threshold)
    .filter(sample => status === 'all' || (status === 'pending' ? !decisions[sample.id] : !!decisions[sample.id]))
    .sort((a, b) => scoreRisk(b).score - scoreRisk(a).score);
}

export function validateRiskDecision(disposition, note) {
  if (!['escalated', 'closed'].includes(disposition)) return 'กรุณาเลือกผลการทบทวน';
  if (String(note || '').trim().length < 8) return 'กรุณาระบุเหตุผลหรือหลักฐานประกอบอย่างน้อย 8 ตัวอักษร';
  return '';
}
