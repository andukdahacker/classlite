# UX Design Specification: Epic 2 - Logistics & Scheduling

**Author:** Sally (UX Designer)
**Project:** ClassLite
**Date:** 2026-01-25

---

## 1. Vision & User Stories

The goal for Epic 2 is to transform the administrative burden of scheduling into a visual, intuitive experience. We want to move away from spreadsheets and into a dynamic, "what you see is what you get" interface.

### User Story 1: The New Course Launch (Center Admin)

- "As a Center Admin, I want to create a new course and schedule its classes in one sitting, so I can start enrolling students immediately."
- **The 'Aha' Moment:** Seeing the course automatically appear on the calendar, knowing that the teacher and room are secured.

### User Story 2: The Sunday Night Shuffle (Center Owner)

- "As a Center Owner, I need to adjust next week's schedule because a teacher is sick, so I can see who is affected and find a replacement room or time."
- **The 'Aha' Moment:** Dragging a class to a new slot and seeing an instant green checkmark (No Conflicts) or a red warning (Conflict).

### User Story 3: The Busy Teacher (Teacher)

- "As a Teacher, I want to see exactly where I need to be and who I'm teaching today, so I can focus on my lesson and quickly mark attendance."
- **The 'Aha' Moment:** Tapping 'All Present' on the attendance sheet and getting back to teaching in under 10 seconds.

---

## 2. Interaction Design

### 2.1 Course & Class Management (Story 2-1)

- **Modal vs. Page:** We will use a **Sliding Drawer (Sheet)** for Course creation to keep the user in context of the list view.
- **Progressive Disclosure:** Start with basic course details. Only show scheduling options once the course is defined.
- **Color Selection:** Admins can pick a "Brand Color" for the course which will be used for all its class blocks on the calendar.

### 2.2 Visual Weekly Scheduler (Story 2-2)

- **Navigation:** Standard "Next/Prev" week buttons. A "Today" button to jump back.
- **Drag-and-Drop:**
  - **Moving:** Drag a block to change time/day.
  - **Resizing:** Drag the bottom edge of a block to change duration (increments of 15 mins).
- **Slot Selection:** Hovering over an empty slot highlights it. Clicking opens the "Quick Add Class" popover.
- **Mobile:** On mobile, the grid collapses to a single-day view with a date picker at the top.

### 2.3 Conflict Detection (Story 2-3)

- **Visual Feedback:**
  - **Conflict Icon:** A small warning ⚠️ icon on the top right of a class block.
  - **Overlay:** When dragging, potential conflict slots glow subtle red; safe slots glow subtle green.
- **The Conflict Drawer:** Clicking a warning icon opens a side drawer detailing:
  - Room double-booking.
  - Teacher double-booking.
  - Student overlap (optional for later).
- **Resolution:** Buttons to "Auto-suggest next slot" or "Force Save" (overriding conflicts requires Admin role).

### 2.4 Attendance Tracking (Story 2-4)

- **Teacher Dashboard:** A "Live Now" card showing the current/next class.
- **Interaction:** Large tap targets for "Present" (Green) and "Absent" (Red).
- **Sticky Header:** The student list header (Name, Status) stays visible while scrolling.

---

## 3. UI Patterns & Consistency

- **RBAC:**
  - Admins/Owners see the "Edit" and "Drag" handles on the calendar.
  - Teachers see a read-only calendar but can interact with the Attendance Sheet.
  - Students (future) see a read-only calendar.
- **The Shell:** Fits perfectly into the "Unified Dashboard Shell" from Epic 1, under the "Logistics" sidebar item.

---

## 4. Wireframe Descriptions

### 4.1 Weekly Scheduler View

- **Header:** Title "Logistics & Scheduling", View Toggles (Week/Day), Filters (Teacher, Room).
- **Main:** 7-column grid. Time labels on the left.
- **Blocks:** Rounded rectangles with:
  - Title: "Piano 101"
  - Subtitle: "Room A | Mr. Smith"
  - Time: "4:00 PM - 5:00 PM"

### 4.2 Attendance Sheet

- **Header:** "Attendance: Piano 101 (Jan 25)"
- **List Item:**
  - Avatar | Student Name
  - Status Toggle Group: [P] [A] [L] [E]
  - Note Icon (opens small text field)
- **Footer:** [Mark All Present] [Save Attendance]
