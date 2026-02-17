import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock react-router
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ centerId: "center-1" }),
  useSearchParams: () => [mockSearchParams],
}));

// Mock shadcn components
vi.mock("@workspace/ui/components/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled ?? false} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@workspace/ui/components/badge", () => ({
  Badge: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

vi.mock("@workspace/ui/components/skeleton", () => ({
  Skeleton: (props: { className?: string }) => (
    <div data-testid="skeleton" {...props} />
  ),
}));

vi.mock("@workspace/ui/components/table", () => ({
  Table: ({ children, ...props }: { children: React.ReactNode }) => (
    <table {...props}>{children}</table>
  ),
  TableHeader: ({ children, ...props }: { children: React.ReactNode }) => (
    <thead {...props}>{children}</thead>
  ),
  TableBody: ({ children, ...props }: { children: React.ReactNode }) => (
    <tbody {...props}>{children}</tbody>
  ),
  TableHead: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => <th {...props}>{children}</th>,
  TableRow: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <tr {...props}>{children}</tr>,
  TableCell: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => <td {...props}>{children}</td>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ArrowDown: (props: Record<string, unknown>) => (
    <span data-testid="icon-arrow-down" {...props} />
  ),
  ArrowRight: (props: Record<string, unknown>) => (
    <span data-testid="icon-arrow-right" {...props} />
  ),
  ArrowUp: (props: Record<string, unknown>) => (
    <span data-testid="icon-arrow-up" {...props} />
  ),
  CheckCircle2: (props: Record<string, unknown>) => (
    <span data-testid="icon-check-circle" {...props} />
  ),
  CircleCheck: (props: Record<string, unknown>) => (
    <span data-testid="icon-circle-check" {...props} />
  ),
  Clock: (props: Record<string, unknown>) => (
    <span data-testid="icon-clock" {...props} />
  ),
  Loader2: (props: Record<string, unknown>) => (
    <span data-testid="icon-loader" {...props} />
  ),
  Star: (props: Record<string, unknown>) => (
    <span data-testid="icon-star" {...props} />
  ),
}));

import { GradingQueueListView } from "../components/GradingQueueListView";

const makeItem = (
  overrides: Partial<{
    submissionId: string;
    studentName: string | null;
    assignmentTitle: string | null;
    className: string | null;
    submittedAt: string | null;
    dueDate: string | null;
    isPriority: boolean;
    gradingStatus: "pending_ai" | "ready" | "in_progress" | "graded";
  }> = {},
) => ({
  submissionId: "sub-1",
  studentName: "Alice Nguyen",
  assignmentTitle: "IELTS Task 2",
  className: "Advanced Writing",
  submittedAt: new Date().toISOString(),
  dueDate: null,
  isPriority: false,
  gradingStatus: "ready" as const,
  ...overrides,
});

const defaultProps = {
  items: [makeItem()],
  isLoading: false,
  filters: {} as Record<string, unknown>,
  onFiltersChange: vi.fn(),
  onTogglePriority: vi.fn(),
  onStartGrading: vi.fn(),
};

describe("GradingQueueListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with correct column headers", () => {
    render(<GradingQueueListView {...defaultProps} />);

    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Assignment")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("displays correct status badge labels for each status type", () => {
    const items = [
      makeItem({ submissionId: "s1", gradingStatus: "pending_ai" }),
      makeItem({ submissionId: "s2", gradingStatus: "ready" }),
      makeItem({ submissionId: "s3", gradingStatus: "in_progress" }),
      makeItem({ submissionId: "s4", gradingStatus: "graded" }),
    ];

    render(<GradingQueueListView {...defaultProps} items={items} />);

    expect(screen.getByText("Pending AI")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Graded")).toBeInTheDocument();
  });

  it("calls onTogglePriority with correct args when star is clicked", async () => {
    const user = userEvent.setup();
    const onTogglePriority = vi.fn();
    const items = [
      makeItem({ submissionId: "sub-1", isPriority: false }),
    ];

    render(
      <GradingQueueListView
        {...defaultProps}
        items={items}
        onTogglePriority={onTogglePriority}
      />,
    );

    // The star button is the first button inside the row (the icon button)
    const starButtons = screen.getAllByTestId("icon-star");
    // Click the button wrapping the star icon
    const starButton = starButtons[0].closest("button")!;
    await user.click(starButton);

    expect(onTogglePriority).toHaveBeenCalledWith("sub-1", true);
  });

  it("navigates to workbench URL on row click", async () => {
    const user = userEvent.setup();
    render(<GradingQueueListView {...defaultProps} />);

    // Click the student name cell to simulate row click
    await user.click(screen.getByText("Alice Nguyen"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/center-1/dashboard/grading/sub-1",
    );
  });

  it("renders 'All caught up!' empty state when no items and no active filters", () => {
    render(
      <GradingQueueListView
        {...defaultProps}
        items={[]}
        filters={{}}
      />,
    );

    expect(
      screen.getByText("All caught up! No submissions to grade."),
    ).toBeInTheDocument();
  });

  it("renders 'No submissions match your filters' when no items with active filters", () => {
    render(
      <GradingQueueListView
        {...defaultProps}
        items={[]}
        filters={{ classId: "cls-1" }}
      />,
    );

    expect(
      screen.getByText("No submissions match your filters"),
    ).toBeInTheDocument();
  });

  it("renders loading skeletons when isLoading is true", () => {
    render(
      <GradingQueueListView {...defaultProps} isLoading={true} items={[]} />,
    );

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBe(5);
  });

  it("Start Grading button calls onStartGrading and shows 'Continue Grading' when in_progress items exist", async () => {
    const user = userEvent.setup();
    const onStartGrading = vi.fn();

    // First: "Start Grading" when items are ready but none in_progress
    const { rerender } = render(
      <GradingQueueListView
        {...defaultProps}
        items={[makeItem({ gradingStatus: "ready" })]}
        onStartGrading={onStartGrading}
      />,
    );

    const startButton = screen.getByText("Start Grading");
    expect(startButton).toBeInTheDocument();
    await user.click(startButton);
    expect(onStartGrading).toHaveBeenCalledOnce();

    // Rerender with in_progress item to show "Continue Grading"
    onStartGrading.mockClear();
    rerender(
      <GradingQueueListView
        {...defaultProps}
        items={[makeItem({ gradingStatus: "in_progress" })]}
        onStartGrading={onStartGrading}
      />,
    );

    const continueButton = screen.getByText("Continue Grading");
    expect(continueButton).toBeInTheDocument();
    await user.click(continueButton);
    expect(onStartGrading).toHaveBeenCalledOnce();
  });
});
