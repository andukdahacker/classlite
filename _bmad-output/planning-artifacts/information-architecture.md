# Information Architecture - ClassLite

This document outlines the high-granularity Information Architecture (IA) for ClassLite, organized by user role and reflecting technical constraints such as multi-tenancy, offline-first capabilities, and mobile responsiveness.

---

## 1. Global Context & Infrastructure

### 1.1 Tenant Context (`centerId`)

- All data fetching and navigation are scoped by `centerId`.
- Users belonging to multiple centers will have a **Center Switcher** in the global profile menu.

### 1.2 Global Navigation (Top/Side Bar)

- **Role-Based Access Control (RBAC):** Navigation items are dynamically rendered based on the authenticated user's role.
- **Offline/Sync Status (Mobile-First):** Persistent icon/banner indicating connectivity and local storage sync status.
- **Notifications:** Bell icon for class reminders, submission alerts, and system updates.

---

## 2. Role: Owner / Admin

_Focus: "Glanceable Intelligence" and operational oversight._

### 2.1 Home / Dashboard (Center Analytics)

- **KPI Cards:** Total Active Students, Revenue (MTD), Enrollment Rate, Average Teacher Grading Time.
- **Student Health (Traffic Light):** Aggregated view of "At-Risk" (Red), "Warning" (Yellow), and "On Track" (Green) students.
- **Teacher Performance:** Quick view of grading queue lengths and feedback quality scores.
- **Recent Activity:** Audit log of center-wide changes (e.g., new class created, billing update).

### 2.2 User Management (Staff & Access)

- **Staff Directory:** List of Teachers and Admins with role toggle and status (Active/Invited).
- **Invitation System:** Bulk upload via CSV or single email invitation with auto-expiring links.

### 2.3 Classes View (Center-Wide)

- **Class Management:** Center-wide management of all classes, including creation, teacher assignment, and room allocation.
- **Teacher Assignment:** Interface for assigning/reassigning primary teachers and assistants to specific classes.
- **Room Allocation:** Allocation of physical rooms or virtual meeting links to class sessions.

### 2.4 Schedule View (Master Calendar)

- **Master Calendar:** Master calendar for the entire center, showing all classes, teacher availability, and room utilization.
- **Teacher Availability:** Tracking teacher working hours, availability, and current class loads.
- **Room Utilization:** Visual tracking of room occupancy to optimize space and prevent scheduling conflicts.

### 2.5 Assignments View (Center-Wide)

- **Assignment Repository:** Center-wide repository of assignment templates, global distribution settings, and aggregate completion analytics.
- **Global Distribution:** Settings for how assignments are pushed to classes (automated vs. manual).
- **Completion Analytics:** Center-wide aggregate data on submission rates and grade distributions.

### 2.6 Students View (Master Directory)

- **Master Student Directory:** Master student directory with enrollment history, billing status, and "Student Health" drill-downs.
- **Billing & Enrollment:** Visibility into tuition status and enrollment history across the center.
- **Student Health Drill-Downs:** Detailed view of "At-Risk" factors (attendance, low grades, inactivity).

### 2.7 Operations & Billing

- **Billing & Subscription:** Current plan details, seat usage, payment history, and upgrade triggers.
- **Audit Logs:** Security and operational history for the tenant.

---

## 3. Role: Teacher

_Focus: "High-Velocity Pedagogy" and class management._

### 3.1 Home View

- **Upcoming Classes (Next 24h):** Chronological list of sessions with one-click access to Class Detail.
- **Grading Queue Summary:**
  - `Count`: Number of pending submissions.
  - `Urgency`: Highlight submissions approaching the "24h feedback SLA".
- **Analytical Insights:**
  - `Submission Rate`: Trend line of student engagement over the last 30 days.
  - `Average Grade`: Performance distribution for assigned classes.

### 3.2 Classes View

- **Class List:** Table view with Search/Filter (By Level, Day, or Status).
- **Class Detail (Drill-Down):**
  - **Student Roster:** Individual student progress within the class.
  - **Attendance:** Present/Absent log with historical toggle.
  - **Class Materials:** Library of exercises/handouts specific to this class.

### 3.3 Schedule View

- **Calendar Interface:** Weekly/Monthly view of teaching sessions.
- **Session Overlay:** Click a session to view location (Room/Link), Student count, and Topic.

### 3.4 Assignments View

- **Assignment Templates:** Repository of exercise templates (Reading, Writing, etc.).
- **Distribution Management:** Assign to specific classes or individuals with custom deadlines.
- **Deadline Tracking:** Status dashboard (Active, Due Today, Closed) with completion percentages.

### 3.5 Grading Workbench (Specialized View)

- _Accessible via "Grade Now" buttons in Home or Assignments._
- **Split-Screen Interface:** Student submission (Left) vs AI Feedback Panel (Right).
- **Evidence Anchors:** Visual connection between AI comments and student text.
- **Approval Flow:** "Approve & Next" button for rapid-fire grading loops.

---

## 4. Role: Student

_Focus: "Safe & Seen" experience and frictionless submission._

### 4.1 Home (Overview)

- **Next Class:** Countdown to the next session with room/link details.
- **My Tasks:** Aggregated "Due Soon" and "Overdue" assignments.
- **Quick Actions:** Large "Resume Last Exercise" or "New Submission" buttons.

### 4.2 My Assignments

- **Active Tab:** List of pending work with priority labels.
- **Feedback History:** Portfolio of graded assignments with AI + Teacher comments.
- **Progress Tracking:** Visual charts for skill improvement (IELTS Band Score trends).

### 4.3 Class Schedule

- **Personal Calendar:** View of their specific class times and holiday closures.

---

## 5. Global User Views (All Roles)

### 5.1 Profile View

- **Personal Information:** Name, avatar, contact details, and role-specific credentials.
- **Activity History:** Recent activity history and audit log for personal actions.

### 5.2 Settings View

- **General:** Language, timezone, and notification preferences (Email, Push).
- **Security:** Password management, session history, and 2FA configuration.
- **Role-Specific Preferences:**
  - **Owner/Admin:** Center-level branding, default grading SLAs, and methodology configurations.
  - **Teacher:** Grading preferences, default feedback templates, and workspace layout.
  - **Student:** UI theme, accessibility settings, and offline sync priorities.

---

## 6. Technical & UX Constraints Mapping

| Feature               | IA Implementation                                                                       | Technical Constraint                              |
| :-------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **Multi-tenancy**     | Tenant-switching UI and `centerId` data scoping in all API hooks.                       | `getTenantedClient(centerId)` enforcement.        |
| **Offline-First**     | LocalStorage/IndexedDB caching for Student Exercises and Sync Status Bar.               | `networkMode: 'offlineFirst'` via TanStack Query. |
| **Mobile-Responsive** | Bottom Tab Bar for Student/Teacher mobile views; collapsible Sidebar for Admin desktop. | Shadcn/UI responsive primitives.                  |
| **Low Latency**       | Pre-fetching next submission in Grading Workbench.                                      | NFR1 (< 500ms load time).                         |
| **Billing (Polar.sh)** | Subscription management in Settings > Billing. Webhook-driven status sync.              | FR43-FR48 integration hooks.                      |
| **Offline/Sync**      | Dedicated Sync Status indicator and priority settings in Global Settings.               | NFR10 (Offline accessibility).                    |
