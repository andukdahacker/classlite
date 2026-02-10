import { describe, it, expect } from "vitest";
import {
  getNavigationConfig,
  getMobileNavItems,
  getOverflowNavItems,
} from "./navigation";

describe("navigation config", () => {
  describe("getNavigationConfig", () => {
    it("returns all nav items with correct structure", () => {
      const config = getNavigationConfig("test-center");

      expect(config).toHaveLength(10);
      expect(config[0]).toMatchObject({
        title: "Dashboard",
        url: "/test-center/dashboard",
        order: 1,
        mobileVisible: true,
      });
    });

    it("includes all required nav items per AC table", () => {
      const config = getNavigationConfig("test-center");
      const titles = config.map((item) => item.title);

      expect(titles).toContain("Dashboard");
      expect(titles).toContain("Schedule");
      expect(titles).toContain("Classes");
      expect(titles).toContain("Exercises");
      expect(titles).toContain("Assignments");
      expect(titles).toContain("Mock Tests");
      expect(titles).toContain("Grading");
      expect(titles).toContain("Students");
      expect(titles).toContain("Settings");
      expect(titles).toContain("My Profile");
    });

    it("does not include removed nav items (Users, Courses)", () => {
      const config = getNavigationConfig("test-center");
      const titles = config.map((item) => item.title);

      expect(titles).not.toContain("Users");
      expect(titles).not.toContain("Courses");
    });
  });

  describe("role-based filtering", () => {
    const config = getNavigationConfig("test-center");

    it("OWNER sees all nav items", () => {
      const ownerItems = config.filter((item) =>
        item.allowedRoles.includes("OWNER")
      );
      expect(ownerItems).toHaveLength(10);
    });

    it("ADMIN sees all nav items", () => {
      const adminItems = config.filter((item) =>
        item.allowedRoles.includes("ADMIN")
      );
      expect(adminItems).toHaveLength(10);
    });

    it("TEACHER sees correct nav items (no Settings)", () => {
      const teacherItems = config.filter((item) =>
        item.allowedRoles.includes("TEACHER")
      );
      const titles = teacherItems.map((item) => item.title);

      expect(titles).toContain("Dashboard");
      expect(titles).toContain("Schedule");
      expect(titles).toContain("Classes");
      expect(titles).toContain("Exercises");
      expect(titles).toContain("Assignments");
      expect(titles).toContain("Mock Tests");
      expect(titles).toContain("Grading");
      expect(titles).toContain("Students");
      expect(titles).toContain("My Profile");
      expect(titles).not.toContain("Settings");
      expect(teacherItems).toHaveLength(9);
    });

    it("STUDENT sees only Dashboard, Schedule, and My Profile", () => {
      const studentItems = config.filter((item) =>
        item.allowedRoles.includes("STUDENT")
      );
      const titles = studentItems.map((item) => item.title);

      expect(titles).toContain("Dashboard");
      expect(titles).toContain("Schedule");
      expect(titles).toContain("My Profile");
      expect(titles).not.toContain("Classes");
      expect(titles).not.toContain("Exercises");
      expect(titles).not.toContain("Grading");
      expect(titles).not.toContain("Students");
      expect(titles).not.toContain("Settings");
      expect(studentItems).toHaveLength(3);
    });
  });

  describe("getMobileNavItems", () => {
    it("returns max 4 items with mobileVisible: true", () => {
      const config = getNavigationConfig("test-center");
      const mobileItems = getMobileNavItems(config);

      expect(mobileItems.length).toBeLessThanOrEqual(4);
      expect(mobileItems.every((item) => item.mobileVisible)).toBe(true);
    });

    it("returns items sorted by order", () => {
      const config = getNavigationConfig("test-center");
      const mobileItems = getMobileNavItems(config);

      for (let i = 1; i < mobileItems.length; i++) {
        expect(mobileItems[i].order).toBeGreaterThan(mobileItems[i - 1].order);
      }
    });

    it("returns Dashboard, Schedule, Classes, Exercises for full config", () => {
      const config = getNavigationConfig("test-center");
      const mobileItems = getMobileNavItems(config);
      const titles = mobileItems.map((item) => item.title);

      expect(titles).toEqual(["Dashboard", "Schedule", "Classes", "Exercises"]);
    });
  });

  describe("getOverflowNavItems", () => {
    it("returns items not in mobile bottom bar", () => {
      const config = getNavigationConfig("test-center");
      const mobileItems = getMobileNavItems(config);
      const overflowItems = getOverflowNavItems(config);

      // No overlap between mobile and overflow
      const mobileUrls = new Set(mobileItems.map((i) => i.url));
      expect(overflowItems.every((item) => !mobileUrls.has(item.url))).toBe(
        true
      );
    });

    it("returns Grading, Students, Settings, My Profile for full config", () => {
      const config = getNavigationConfig("test-center");
      const overflowItems = getOverflowNavItems(config);
      const titles = overflowItems.map((item) => item.title);

      expect(titles).toEqual(["Assignments", "Mock Tests", "Grading", "Students", "Settings", "My Profile"]);
    });

    it("returns items sorted by order", () => {
      const config = getNavigationConfig("test-center");
      const overflowItems = getOverflowNavItems(config);

      for (let i = 1; i < overflowItems.length; i++) {
        expect(overflowItems[i].order).toBeGreaterThan(
          overflowItems[i - 1].order
        );
      }
    });
  });
});
