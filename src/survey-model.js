const EPS = 1e-8;

export const REGISTERED_AREA = 8000;
export const REFERENCE_PARCEL = [[0, 0], [100, 0], [100, 80], [0, 80], [0, 0]];
export const NEIGHBOR_PARCEL = [[100, 10], [150, 10], [150, 70], [100, 70], [100, 10]];

export function openRing(points) {
  const ring = points.map(([x, y]) => [x, y]);
  if (ring.length > 1 && Math.hypot(ring[0][0] - ring.at(-1)[0], ring[0][1] - ring.at(-1)[1]) < EPS) ring.pop();
  return ring;
}

export function signedArea(points) {
  const ring = openRing(points);
  return ring.reduce((sum, p, i) => {
    const q = ring[(i + 1) % ring.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;
}

export const polygonArea = points => Math.abs(signedArea(points));
const cross = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
  if (((abC > EPS && abD < -EPS) || (abC < -EPS && abD > EPS)) && ((cdA > EPS && cdB < -EPS) || (cdA < -EPS && cdB > EPS))) return true;
  const on = (p, q, r) => Math.abs(cross(p, q, r)) <= EPS && r[0] >= Math.min(p[0], q[0]) - EPS && r[0] <= Math.max(p[0], q[0]) + EPS && r[1] >= Math.min(p[1], q[1]) - EPS && r[1] <= Math.max(p[1], q[1]) + EPS;
  return on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b);
}

export function hasSelfIntersection(points) {
  const ring = openRing(points);
  for (let i = 0; i < ring.length; i++) {
    for (let j = i + 1; j < ring.length; j++) {
      if (j === i + 1 || (i === 0 && j === ring.length - 1)) continue;
      if (segmentsIntersect(ring[i], ring[(i + 1) % ring.length], ring[j], ring[(j + 1) % ring.length])) return true;
    }
  }
  return false;
}

/** Sutherland–Hodgman clipping. clipPolygon must be convex; both demo neighbors are rectangles. */
export function intersectConvex(subjectPolygon, clipPolygon) {
  let output = openRing(subjectPolygon);
  const clip = openRing(clipPolygon);
  const orientation = signedArea(clip) >= 0 ? 1 : -1;
  for (let i = 0; i < clip.length && output.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length], input = output;
    output = [];
    let s = input.at(-1);
    const inside = p => orientation * cross(a, b, p) >= -EPS;
    const intersection = (p, q) => {
      const edge = [b[0] - a[0], b[1] - a[1]];
      const segment = [q[0] - p[0], q[1] - p[1]];
      const den = segment[0] * edge[1] - segment[1] * edge[0];
      if (Math.abs(den) < EPS) return q;
      const t = ((a[0] - p[0]) * edge[1] - (a[1] - p[1]) * edge[0]) / den;
      return [p[0] + t * segment[0], p[1] + t * segment[1]];
    };
    for (const e of input) {
      if (inside(e)) {
        if (!inside(s)) output.push(intersection(s, e));
        output.push(e);
      } else if (inside(s)) output.push(intersection(s, e));
      s = e;
    }
  }
  return output;
}

export function makeSurvey(preset = 'overlap', eastShift = 5) {
  if (preset === 'crossed') return [[0, 0], [100, 80], [100, 0], [0, 80], [0, 0]];
  if (preset === 'open') return [[0, 0], [100, 0], [100, 80], [0, 80], [0, 2]];
  const x = preset === 'clean' ? 100 : 100 + Number(eastShift);
  return [[0, 0], [x, 0], [x, 80], [0, 80], [0, 0]];
}

export function inspectSurvey(points, { closureTolerance = 0.05, areaTolerancePercent = 1, registeredArea = REGISTERED_AREA, neighbor = NEIGHBOR_PARCEL } = {}) {
  if (!Array.isArray(points) || points.length < 4 || points.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite))) return { valid: false, error: 'พิกัดไม่ครบหรือไม่ใช่ตัวเลข', checks: [], area: null, overlapArea: null, overlapPolygon: [] };
  const closureGap = Math.hypot(points[0][0] - points.at(-1)[0], points[0][1] - points.at(-1)[1]);
  const crossed = hasSelfIntersection(points);
  const area = crossed ? null : polygonArea(points);
  const degenerate = area !== null && area < EPS;
  const valid = !crossed && !degenerate;
  const overlapPolygon = valid ? intersectConvex(points, neighbor) : [];
  const overlapArea = valid ? polygonArea(overlapPolygon) : null;
  const areaDifference = valid ? area - registeredArea : null;
  const areaDifferencePercent = valid ? 100 * areaDifference / registeredArea : null;
  const checks = [
    { id: 'geometry', label: 'ความสมบูรณ์ของรูปแปลง', ok: valid, detail: crossed ? 'เส้นขอบตัดกันเอง — หยุดการคำนวณพื้นที่' : degenerate ? 'พื้นที่เป็นศูนย์ — ตรวจสอบพิกัด' : 'ไม่พบเส้นขอบตัดกันเอง' },
    { id: 'closure', label: 'การปิดวงรอบ', ok: closureGap <= closureTolerance + EPS, detail: `จุดต้น–ปลายห่าง ${closureGap.toFixed(2)} ม. / เกณฑ์สาธิต ${Number(closureTolerance).toFixed(2)} ม.` },
    { id: 'overlap', label: 'การซ้อนทับแปลงข้างเคียง', ok: valid && overlapArea < EPS, skipped: !valid, detail: valid ? (overlapArea < EPS ? 'ไม่พบพื้นที่ซ้อนทับ (ขอบสัมผัสกันนับเป็น 0)' : `พบพื้นที่ซ้อนทับ ${overlapArea.toFixed(2)} ตร.ม.`) : 'ยังไม่ประเมิน เพราะรูปแปลงไม่สมบูรณ์' },
    { id: 'area', label: 'พื้นที่เทียบทะเบียนตัวอย่าง', ok: valid && Math.abs(areaDifferencePercent) <= areaTolerancePercent + EPS, skipped: !valid, detail: valid ? `ต่าง ${areaDifference >= 0 ? '+' : ''}${areaDifference.toFixed(2)} ตร.ม. (${areaDifferencePercent.toFixed(2)}%) / เกณฑ์ ±${areaTolerancePercent}%` : 'ยังไม่ประเมิน เพราะรูปแปลงไม่สมบูรณ์' },
  ];
  return { valid, error: crossed ? 'เส้นขอบตัดกันเอง' : degenerate ? 'รูปแปลงไม่มีพื้นที่' : null, area, areaDifference, areaDifferencePercent, closureGap, overlapPolygon, overlapArea, checks, passed: checks.every(c => c.ok) };
}
