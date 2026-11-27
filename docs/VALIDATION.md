# Demo validation

วันที่ตรวจ: 27 พฤศจิกายน 2569

## Automated checks

- `npm test`: 31 tests passed across queue projection, optional storage, registration validation, transparent risk scores, geometry and scheduling invariants.
- `npm run check`: JavaScript syntax and entry-point asset checks passed.
- `npm run build`: static output generated successfully.

## Review

- Reviewed all six modules for synthetic-data labeling and human decision boundaries.
- Fixed office-specific negative-capacity bounds, reset-dialog cancellation, navigation accessibility and malformed review select options.
- Public hosted application opened without a login prompt.
- Registration initial sample: 2 findings / 5 of 7 checks passed. Corrected sample: 7 of 7 passed.
- Return-for-correction selection and note survive highlighting a finding; saving creates a review and activity.
- Survey overlap sample: 8,400 m² surveyed area / 300 m² intersection; clean sample: 8,000 m² / 0 intersection.
- 3D layer visibility, selection, view angle, exploded view, 2D plan and reset controls exercised.
- Scheduling with 2 crews recalculates completion to D6 and saves a 10-job plan.
- Anomaly escalation with rationale moves a case out of pending; pending count decreases from 3 to 2.
- All saved module actions appear in Command Center; review counts and activity persist after refresh.
- Confirmed reset clears state. Reopening the reset dialog and pressing Escape preserves a new +1 staffing scenario (10-day queue clearance).
- Guide opens and advances between demonstration steps.
- Shared local preview was replaced by an unrelated concurrent workspace; remaining UI checks were performed against the public hosted demo.
- Responsive verification pending on the hosted 390px and 768px harness.

## Limits

This is an interactive concept prototype. It has no DOL connection, live OCR/LLM, identity verification, legal-rights certification or operational accuracy validation. Tests verify demo behavior and formulas, not fitness for public-sector production deployment.
