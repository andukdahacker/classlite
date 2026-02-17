import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AIFeedbackPane } from "../components/AIFeedbackPane";

// --- Mock UI primitives ---
vi.mock("@workspace/ui/components/badge", () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <span data-testid="badge" {...props}>{children}</span>
  ),
}));

vi.mock("@workspace/ui/components/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>{children}</button>
  ),
}));

vi.mock("@workspace/ui/components/card", () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card-content" {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card-title" {...props}>{children}</div>
  ),
}));

vi.mock("@workspace/ui/components/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
}));

vi.mock("@workspace/ui/components/separator", () => ({
  Separator: (props: Record<string, unknown>) => <hr data-testid="separator" {...props} />,
}));

vi.mock("@workspace/ui/components/skeleton", () => ({
  Skeleton: (props: Record<string, unknown>) => <div data-testid="skeleton" {...props} />,
}));

vi.mock("@workspace/ui/components/textarea", () => ({
  Textarea: ({ onChange, onKeyDown, value, ...props }: { onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; onKeyDown?: (e: React.KeyboardEvent) => void; value?: string; [key: string]: unknown }) => (
    <textarea data-testid="textarea" onChange={onChange} onKeyDown={onKeyDown} value={value} {...props} />
  ),
}));

vi.mock("@workspace/ui/components/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <button data-testid="dropdown-item" onClick={onClick} {...props}>{children}</button>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div data-testid="dropdown-trigger">{children}</div>,
}));

vi.mock("@workspace/ui/components/alert-dialog", () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open?: boolean; onOpenChange?: (v: boolean) => void }) => (
    open ? <div data-testid="alert-dialog">{children}</div> : null
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <button data-testid="alert-action" onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props: Record<string, unknown>) => <span data-testid="icon-alert" {...props} />,
  BookOpen: (props: Record<string, unknown>) => <span data-testid="icon-bookopen" {...props} />,
  Eye: (props: Record<string, unknown>) => <span data-testid="icon-eye" {...props} />,
  EyeOff: (props: Record<string, unknown>) => <span data-testid="icon-eyeoff" {...props} />,
  Link: (props: Record<string, unknown>) => <span data-testid="icon-link" {...props} />,
  MessageCircle: (props: Record<string, unknown>) => <span data-testid="icon-messagecircle" {...props} />,
  MessageSquare: (props: Record<string, unknown>) => <span data-testid="icon-message" {...props} />,
  MoreHorizontal: (props: Record<string, unknown>) => <span data-testid="icon-more" {...props} />,
  Pencil: (props: Record<string, unknown>) => <span data-testid="icon-pencil" {...props} />,
  RefreshCw: (props: Record<string, unknown>) => <span data-testid="icon-refresh" {...props} />,
  SpellCheck: (props: Record<string, unknown>) => <span data-testid="icon-spellcheck" {...props} />,
  Star: (props: Record<string, unknown>) => <span data-testid="icon-star" {...props} />,
  Trash2: (props: Record<string, unknown>) => <span data-testid="icon-trash" {...props} />,
  Unlink: (props: Record<string, unknown>) => <span data-testid="icon-unlink" {...props} />,
  User: (props: Record<string, unknown>) => <span data-testid="icon-user" {...props} />,
}));

vi.mock("date-fns", () => ({
  formatDistanceToNow: () => "1 hour ago",
}));

// --- Fixtures ---
const aiFeedbackItem = {
  id: "ai-1",
  type: "grammar" as const,
  content: "Consider using past tense here",
  suggestedFix: "were engaged",
  severity: "error" as const,
  confidence: 0.9,
  originalContextSnippet: "the students was engaged",
  startOffset: 5,
  endOffset: 28,
};

const teacherComment = {
  id: "tc-1",
  centerId: "center-1",
  submissionId: "sub-1",
  authorId: "teacher-1",
  authorName: "Ms. Johnson",
  authorAvatarUrl: null,
  content: "Great vocabulary choice!",
  startOffset: 50,
  endOffset: 70,
  originalContextSnippet: "eloquent expression of",
  visibility: "student_facing" as const,
  createdAt: "2026-02-17T10:00:00.000Z",
  updatedAt: "2026-02-17T10:00:00.000Z",
};

const generalTeacherComment = {
  id: "tc-2",
  centerId: "center-1",
  submissionId: "sub-1",
  authorId: "teacher-1",
  authorName: "Ms. Johnson",
  authorAvatarUrl: null,
  content: "Overall a strong essay. Keep it up!",
  startOffset: null,
  endOffset: null,
  originalContextSnippet: null,
  visibility: "student_facing" as const,
  createdAt: "2026-02-17T11:00:00.000Z",
  updatedAt: "2026-02-17T11:00:00.000Z",
};

const baseFeedback = {
  id: "fb-1",
  overallScore: 6.5,
  criteriaScores: { taskAchievement: 6.0, coherence: 7.0 },
  generalFeedback: "Solid essay with room for improvement.",
  items: [aiFeedbackItem],
};

const defaultProps = {
  analysisStatus: "ready" as const,
  feedback: baseFeedback,
  skill: "WRITING" as const,
  onRetrigger: vi.fn(),
  isRetriggering: false,
};

describe("Teacher Commenting Integration", () => {
  it("renders teacher comments alongside AI feedback in the mixed feed", () => {
    render(
      <AIFeedbackPane
        {...defaultProps}
        teacherComments={[teacherComment, generalTeacherComment]}
        currentUserId="teacher-1"
        onCreateComment={vi.fn()}
      />,
    );

    // AI feedback item is visible
    expect(screen.getByText("Consider using past tense here")).toBeInTheDocument();

    // Teacher Comments section divider is visible
    expect(screen.getByText("Teacher Comments")).toBeInTheDocument();

    // Both teacher comments are visible
    expect(screen.getByText("Great vocabulary choice!")).toBeInTheDocument();
    expect(screen.getByText("Overall a strong essay. Keep it up!")).toBeInTheDocument();

    // Author name is shown
    expect(screen.getAllByText("Ms. Johnson")).toHaveLength(2);
  });

  it("renders general (un-anchored) comment in the feed without context snippet", () => {
    render(
      <AIFeedbackPane
        {...defaultProps}
        teacherComments={[generalTeacherComment]}
        currentUserId="teacher-1"
        onCreateComment={vi.fn()}
      />,
    );

    expect(screen.getByText("Overall a strong essay. Keep it up!")).toBeInTheDocument();

    // General comment should NOT have the anchored snippet
    expect(screen.queryByText("eloquent expression of")).not.toBeInTheDocument();
  });

  it("teacher comments appear after AI feedback groups in the feed", () => {
    const { container } = render(
      <AIFeedbackPane
        {...defaultProps}
        teacherComments={[teacherComment]}
        currentUserId="teacher-1"
        onCreateComment={vi.fn()}
      />,
    );

    // Get all card elements — AI feedback items come first, then teacher comment cards
    const cards = container.querySelectorAll("[data-testid='card']");
    expect(cards.length).toBeGreaterThanOrEqual(2);

    // The AI feedback card should appear before the teacher comment card
    const aiFeedbackCard = Array.from(cards).find((card) =>
      card.textContent?.includes("Consider using past tense here"),
    );
    const teacherCard = Array.from(cards).find((card) =>
      card.textContent?.includes("Great vocabulary choice!"),
    );

    expect(aiFeedbackCard).toBeTruthy();
    expect(teacherCard).toBeTruthy();

    // Teacher card should come after AI card in DOM order
    const allNodes = Array.from(cards);
    expect(allNodes.indexOf(teacherCard!)).toBeGreaterThan(
      allNodes.indexOf(aiFeedbackCard!),
    );
  });

  it("calls onCreateComment when submitting via AddCommentInput", async () => {
    const onCreateComment = vi.fn();
    render(
      <AIFeedbackPane
        {...defaultProps}
        teacherComments={[]}
        currentUserId="teacher-1"
        onCreateComment={onCreateComment}
        isCreatingComment={false}
      />,
    );

    // Click "Add a comment..." to expand the input
    await userEvent.click(screen.getByText("Add a comment..."));

    // Type in the textarea
    const textarea = screen.getByTestId("textarea");
    fireEvent.change(textarea, { target: { value: "A new general comment" } });

    // Submit
    await userEvent.click(screen.getByText("Submit"));

    expect(onCreateComment).toHaveBeenCalledWith({
      content: "A new general comment",
      startOffset: null,
      endOffset: null,
      visibility: "student_facing",
    });
  });

  it("renders AddCommentInput even when analysis is still in progress", () => {
    render(
      <AIFeedbackPane
        {...defaultProps}
        analysisStatus="analyzing"
        feedback={null}
        teacherComments={[]}
        currentUserId="teacher-1"
        onCreateComment={vi.fn()}
      />,
    );

    // The add comment input should be present even while analyzing
    expect(screen.getByText("Add a comment...")).toBeInTheDocument();
  });
});
