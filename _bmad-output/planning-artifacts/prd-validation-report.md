## Measurability Validation

### Functional Requirements

**Total FRs Analyzed:** 31

**Format Violations:** 7

- FR4: "System must restrict..." (Line 155)
- FR5: "System must enforce..." (Line 156)
- FR10: "System must detect..." (Line 164)
- FR12: "System must notify..." (Line 166)
- FR19: "System must auto-save..." (Line 179)
- FR20: "System must trigger..." (Line 180)
- FR31: "System must prioritize..." (Line 197)

**Implementation Leakage:** 6

- FR1: "Google OAuth" (Line 152)
- FR2: "`center_id`" (Line 153)
- FR5: "`center_id`" (Line 156)
- FR14: "PDF/Word" (Line 171)
- FR28: "Zalo" (Line 194)
- FR29: "Zalo" (Line 195)

**FR Violations Total:** 13

### Non-Functional Requirements

**Total NFRs Analyzed:** 9

**Incomplete Template (Missing Measurement Method/Context):** 9

- NFR1: Missing measurement method/context (Line 235)
- NFR2: Missing context (Line 236)
- NFR3: Missing measurement method (Line 237)
- NFR4: Missing measurement method (Line 238)
- NFR5: Missing context (Line 239)
- NFR6: Boolean state/implementation specific (Line 243)
- NFR7: Boolean state/missing standard (Line 244)
- NFR8: Missing context (Line 248)
- NFR9: Functional requirement masquerading as NFR (Line 249)

**NFR Violations Total:** 9

### Overall Assessment

**Total Requirements:** 40
**Total Violations:** 22

**Severity:** Critical

**Recommendation:**
"Many requirements are not measurable or testable. Requirements must be revised to be testable for downstream work. Specifically:

1. Refactor 'System must...' FRs to '[Actor] can...' format.
2. Remove tech stack specifics (Zalo, Google, center_id) from FRs.
3. Rewrite NFRs to include 'Measurement Method' and 'Context'."
