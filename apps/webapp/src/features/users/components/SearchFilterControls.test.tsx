import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SearchFilterControls } from "./SearchFilterControls";
import type { UserListQuery } from "@workspace/types";

// Mock scrollIntoView for Radix Select
Element.prototype.scrollIntoView = vi.fn();

describe("SearchFilterControls", () => {
  const defaultFilters: UserListQuery = {
    page: 1,
    limit: 10,
    search: undefined,
    role: undefined,
    status: undefined,
  };

  let onFiltersChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onFiltersChange = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Search Input", () => {
    it("renders search input with placeholder", () => {
      render(
        <SearchFilterControls
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
        />
      );

      expect(
        screen.getByPlaceholderText("Search by name or email...")
      ).toBeInTheDocument();
    });

    it("debounces search input by 300ms", async () => {
      render(
        <SearchFilterControls
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search by name or email...");
      fireEvent.change(searchInput, { target: { value: "test" } });

      // Should not call immediately
      expect(onFiltersChange).not.toHaveBeenCalled();

      // Fast-forward 299ms - still shouldn't be called
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(onFiltersChange).not.toHaveBeenCalled();

      // Fast-forward to 300ms - now it should be called
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onFiltersChange).toHaveBeenCalledWith({
        search: "test",
        page: 1,
      });
    });

    it("resets page to 1 when search changes", async () => {
      render(
        <SearchFilterControls
          filters={{ ...defaultFilters, page: 3 }}
          onFiltersChange={onFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search by name or email...");
      fireEvent.change(searchInput, { target: { value: "search" } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      );
    });

    it("clears search when input is emptied", async () => {
      render(
        <SearchFilterControls
          filters={{ ...defaultFilters, search: "existing" }}
          onFiltersChange={onFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search by name or email...");
      fireEvent.change(searchInput, { target: { value: "" } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(onFiltersChange).toHaveBeenCalledWith({
        search: undefined,
        page: 1,
      });
    });

    it("displays current search value from filters prop", () => {
      render(
        <SearchFilterControls
          filters={{ ...defaultFilters, search: "john" }}
          onFiltersChange={onFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search by name or email..."
      ) as HTMLInputElement;
      expect(searchInput.value).toBe("john");
    });

    it("does not trigger search if value unchanged", async () => {
      render(
        <SearchFilterControls
          filters={{ ...defaultFilters, search: "existing" }}
          onFiltersChange={onFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search by name or email...");
      // Type the same value
      fireEvent.change(searchInput, { target: { value: "existing" } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not call onFiltersChange since value is same as filters.search
      expect(onFiltersChange).not.toHaveBeenCalled();
    });
  });

  describe("Filter Dropdowns", () => {
    it("renders both role and status filter dropdowns", () => {
      render(
        <SearchFilterControls
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
        />
      );

      const selects = screen.getAllByRole("combobox");
      expect(selects).toHaveLength(2); // Role and Status dropdowns
    });

    it("displays 'All Roles' when no role filter is set", () => {
      render(
        <SearchFilterControls
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
        />
      );

      expect(screen.getByText("All Roles")).toBeInTheDocument();
    });

    it("displays 'All Status' when no status filter is set", () => {
      render(
        <SearchFilterControls
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
        />
      );

      expect(screen.getByText("All Status")).toBeInTheDocument();
    });

    it("displays selected role when role filter is set", () => {
      render(
        <SearchFilterControls
          filters={{ ...defaultFilters, role: "TEACHER" }}
          onFiltersChange={onFiltersChange}
        />
      );

      // The select should show "Teacher" (capitalized display)
      expect(screen.getByText("Teacher")).toBeInTheDocument();
    });

    it("displays selected status when status filter is set", () => {
      render(
        <SearchFilterControls
          filters={{ ...defaultFilters, status: "ACTIVE" }}
          onFiltersChange={onFiltersChange}
        />
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("has search icon in input", () => {
      const { container } = render(
        <SearchFilterControls
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
        />
      );

      // Check for the search icon SVG
      const searchIcon = container.querySelector(".lucide-search");
      expect(searchIcon).toBeInTheDocument();
    });

    it("renders with responsive layout classes", () => {
      const { container } = render(
        <SearchFilterControls
          filters={defaultFilters}
          onFiltersChange={onFiltersChange}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex", "flex-col", "sm:flex-row", "gap-4");
    });
  });
});
