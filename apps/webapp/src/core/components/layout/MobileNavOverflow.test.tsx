import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MobileNavOverflow } from "./MobileNavOverflow";
import type { NavItemConfig } from "@/core/config/navigation";
import { Settings, Users, UserCircle } from "lucide-react";

const mockItems: NavItemConfig[] = [
  {
    title: "Settings",
    url: "/test/dashboard/settings",
    icon: Settings,
    allowedRoles: ["OWNER", "ADMIN"],
    order: 7,
    mobileVisible: false,
  },
  {
    title: "Students",
    url: "/test/dashboard/students",
    icon: Users,
    allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
    order: 6,
    mobileVisible: false,
  },
  {
    title: "My Profile",
    url: "/test/dashboard/profile",
    icon: UserCircle,
    allowedRoles: ["OWNER", "ADMIN", "TEACHER", "STUDENT"],
    order: 8,
    mobileVisible: false,
  },
];

describe("MobileNavOverflow", () => {
  const renderWithRouter = (
    items: NavItemConfig[],
    initialPath = "/test/dashboard"
  ) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <MobileNavOverflow items={items} />
      </MemoryRouter>
    );
  };

  it("returns null when items array is empty", () => {
    const { container } = renderWithRouter([]);
    expect(container.firstChild).toBeNull();
  });

  it("renders More button trigger", () => {
    renderWithRouter(mockItems);

    expect(screen.getByLabelText("More navigation options")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("shows sheet with nav items when trigger is clicked", async () => {
    renderWithRouter(mockItems);

    const trigger = screen.getByLabelText("More navigation options");
    fireEvent.click(trigger);

    // Sheet content should appear
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
  });

  it("highlights active nav item", async () => {
    renderWithRouter(mockItems, "/test/dashboard/settings");

    const trigger = screen.getByLabelText("More navigation options");
    fireEvent.click(trigger);

    await screen.findByRole("dialog");

    const settingsLink = screen.getByRole("link", { name: /settings/i });
    expect(settingsLink).toHaveAttribute("aria-current", "page");
  });

  it("does not highlight inactive nav items", async () => {
    renderWithRouter(mockItems, "/test/dashboard/settings");

    const trigger = screen.getByLabelText("More navigation options");
    fireEvent.click(trigger);

    await screen.findByRole("dialog");

    const studentsLink = screen.getByRole("link", { name: /students/i });
    expect(studentsLink).not.toHaveAttribute("aria-current");
  });
});
