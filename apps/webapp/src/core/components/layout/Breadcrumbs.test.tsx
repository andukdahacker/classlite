import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Breadcrumbs } from "./Breadcrumbs";

// Mock the breadcrumb config
vi.mock("@/core/config/breadcrumb-config", () => ({
  breadcrumbConfig: {
    dashboard: "Dashboard",
    settings: "Settings",
    users: "Users",
    profile: "My Profile",
  },
}));

describe("Breadcrumbs", () => {
  const renderWithRouter = (initialPath: string) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Breadcrumbs />
      </MemoryRouter>
    );
  };

  it("returns null for dashboard root (2 segments)", () => {
    const { container } = renderWithRouter("/test-center/dashboard");
    expect(container.firstChild).toBeNull();
  });

  it("returns null for single segment paths", () => {
    const { container } = renderWithRouter("/test-center");
    expect(container.firstChild).toBeNull();
  });

  it("renders breadcrumb for settings page (3 segments)", () => {
    renderWithRouter("/test-center/dashboard/settings");

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders multiple breadcrumb items for nested routes", () => {
    renderWithRouter("/test-center/dashboard/settings/users");

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("last item is not a link (BreadcrumbPage)", () => {
    renderWithRouter("/test-center/dashboard/settings/users");

    // Users should be the current page (not a link)
    const usersElement = screen.getByText("Users");
    expect(usersElement.tagName.toLowerCase()).toBe("span");
    expect(usersElement).toHaveAttribute("aria-current", "page");
  });

  it("non-last items are links", () => {
    renderWithRouter("/test-center/dashboard/settings/users");

    // Settings should be a link
    const settingsLink = screen.getByRole("link", { name: "Settings" });
    expect(settingsLink).toBeInTheDocument();
  });

  it("uses custom labels when provided", () => {
    render(
      <MemoryRouter initialEntries={["/test-center/dashboard/profile/user-123"]}>
        <Breadcrumbs customLabels={{ "user-123": "John Doe" }} />
      </MemoryRouter>
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("formats unknown segments as Title Case", () => {
    render(
      <MemoryRouter initialEntries={["/test-center/dashboard/some-unknown-page"]}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText("Some Unknown Page")).toBeInTheDocument();
  });
});
