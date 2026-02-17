import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock shadcn components
vi.mock("@workspace/ui/components/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@workspace/ui/components/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div data-testid="select">
      {/* Render a hidden native select so we can trigger changes in tests */}
      <select
        data-testid="native-select"
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        <option value="">--</option>
      </select>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  X: (props: Record<string, unknown>) => (
    <span data-testid="icon-x" {...props} />
  ),
}));

import { QueueFilters } from "../components/QueueFilters";
import type { GradingQueueFilters } from "../hooks/use-grading-queue";

const defaultFilters: GradingQueueFilters = {
  page: 1,
  limit: 20,
  sortBy: "submittedAt",
  sortOrder: "asc",
};

const defaultProps = {
  filters: defaultFilters,
  onFiltersChange: vi.fn(),
  classOptions: [
    { id: "cls-1", name: "Advanced Writing" },
    { id: "cls-2", name: "Basic Grammar" },
  ],
  assignmentOptions: [
    { id: "asg-1", title: "IELTS Task 2" },
    { id: "asg-2", title: "Essay Practice" },
  ],
};

describe("QueueFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filter dropdowns with correct placeholders", () => {
    render(<QueueFilters {...defaultProps} />);

    const placeholders = screen.getAllByTestId("select-value");
    const placeholderTexts = placeholders.map((el) => el.textContent);

    expect(placeholderTexts).toContain("All Classes");
    expect(placeholderTexts).toContain("All Assignments");
    expect(placeholderTexts).toContain("All Statuses");
  });

  it("triggers onFiltersChange with correct params when a filter selection changes", () => {
    const onFiltersChange = vi.fn();
    render(
      <QueueFilters {...defaultProps} onFiltersChange={onFiltersChange} />,
    );

    // Get all native selects (one for each filter dropdown)
    const nativeSelects = screen.getAllByTestId("native-select");

    // Simulate changing the first select (classId filter)
    nativeSelects[0].dispatchEvent(
      new Event("change", { bubbles: true }),
    );

    // Use fireEvent to change the class filter select
    const classSelect = nativeSelects[0] as HTMLSelectElement;
    Object.defineProperty(classSelect, "value", {
      writable: true,
      value: "cls-1",
    });
    classSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        classId: "cls-1",
        page: 1,
      }),
    );
  });

  it("clear button resets all filters", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const activeFilters: GradingQueueFilters = {
      ...defaultFilters,
      classId: "cls-1",
      assignmentId: "asg-1",
      gradingStatus: "ready",
    };

    render(
      <QueueFilters
        {...defaultProps}
        filters={activeFilters}
        onFiltersChange={onFiltersChange}
      />,
    );

    const clearButton = screen.getByText("Clear");
    await user.click(clearButton);

    expect(onFiltersChange).toHaveBeenCalledWith({
      page: 1,
      limit: defaultFilters.limit,
      sortBy: defaultFilters.sortBy,
      sortOrder: defaultFilters.sortOrder,
    });
  });

  it("clear button is only visible when filters are active", () => {
    // No active filters — clear button should not be visible
    const { rerender } = render(<QueueFilters {...defaultProps} />);
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();

    // With active filters — clear button should be visible
    rerender(
      <QueueFilters
        {...defaultProps}
        filters={{ ...defaultFilters, classId: "cls-1" }}
      />,
    );
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });
});
