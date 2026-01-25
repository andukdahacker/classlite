# Retrospective: Epic 1 - Tenant & User Management

**Date:** 2026-01-25
**Status:** COMPLETE
**Participants:** Bob (SM), John (PM), Winston (Architect), Amelia (Dev), Murat (TEA), Sally (UX), Ducdo (Project Lead)

---

## 1. Executive Summary

Epic 1 has been successfully delivered. We have established the foundation for the ClassLite platform, including multi-tenant onboarding, center branding, user invitations with RBAC, and a unified dashboard shell. The technical highlight was the transition from basic route protection to a universal `RBACWrapper`.

---

## 2. Team Perspectives

### Bob (Scrum Master) 🏃

"Velocity was exceptionally high this epic. We moved through the onboarding and shell stories quickly. The adversarial review on Story 1.4 was a critical moment—it caught several UX and technical edge cases (like Fragment support) that would have haunted us later. Quality didn't suffer for speed."

### Winston (Architect) 🏗️

"The architectural pivot from simple `ProtectedRoute` logic to the `RBACWrapper` is a major win. We now have a scalable, declarative pattern for enforcing access control at the component level. This reduces the cognitive load for developers and ensures our multi-tenancy rules are consistently applied."

### Amelia (Developer) 💻

"Implementing the deep recursion logic for `RBACWrapper` to handle nested interactive elements and React Fragments was a significant challenge. However, it allowed me to refactor the `DashboardPage` to be much more declarative and easier to reason about. The code is much cleaner now."

### Murat (Test Architect) 🧪

"Quality is in a great spot. We delivered 18 unit tests for the RBAC system alone, covering 'hide' and 'disable' modes extensively. My concern for Epic 2 is the inherent complexity of scheduling logic and conflict detection. We must maintain this level of test rigor to avoid regressions in core business logic."

### John (Product Manager) 📋

"From a product standpoint, the multi-tenant foundation is rock solid. The onboarding flow and invitation loops are ready for production use. We've successfully checked off FR1 through FR6, and the platform feels like a real product now."

### Sally (UX Designer) 🎨

"I'm very happy we fixed the auth-loading flicker on the dashboard. It was a small technical detail that had a huge impact on the 'premium' feel of the application. The dynamic branding is working seamlessly across the shell."

---

## 3. What Went Well (Wins)

- **Universal RBAC:** The `RBACWrapper` provides a clean API for developers to manage complex visibility rules.
- **Dynamic Branding:** Successful injection of CSS variables ensures every center feels unique.
- **High Test Coverage:** 100% pass rate on core auth and tenant services.
- **Collaboration:** The adversarial review process on 1.4 improved the robustness of the system.

---

## 4. Challenges & Lessons Learned

- **Auth Flicker:** Initial implementation of the dashboard had a jarring role-check flicker; moving to a more robust loading state in the `RBACWrapper` solved this.
- **Recursion Complexity:** Deep-disabling children in React requires careful handling of Fragments and non-element children.
- **Requirement Refinement:** We discovered that "Owner" and "Admin" roles often overlap, leading to the decision to support arrays of roles in the wrapper.

---

## 5. Potholes for Epic 2 (Logistics & Scheduling)

1. **Scheduling Complexity vs. Rigor:** Epic 2 involves visual calendars and multi-factor conflict detection (Room + Teacher + Time). We must not skimp on integration tests for the `ConflictDetection` service, as it's the most fragile part of the logistics engine.
2. **Permission Fatigue:** As we introduce CRUD for Courses and Classes, we need to ensure the `RBACWrapper` doesn't make the code too verbose. We should monitor if we need role-group aliases (e.g., `STAFF_ROLES`) to simplify component props.
3. **Multi-Tenant Data Leaks:** With more complex relational queries in Epic 2 (Schedules -> Classes -> Rooms), we must strictly audit all new services to ensure they use `getTenantedClient(centerId)` without exception.

---

## 6. Action Items

- [ ] **Technical:** Create a `STAFF_ROLES` constant to simplify `RBACWrapper` usage in Epic 2. (Owner: Winston)
- [ ] **Quality:** Define a 'Conflict Matrix' for testing Story 2.3. (Owner: Murat)
- [ ] **UX:** Verify mobile responsiveness of the weekly calendar view early in the sprint. (Owner: Sally)

---

**Bob (Scrum Master):** "Epic 1 is in the books! Great work team. Let's carry this momentum into Logistics & Scheduling."
