import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "./OfflineBanner";

describe("OfflineBanner", () => {
  it("renders when offline and submission is active (not submitted)", () => {
    render(<OfflineBanner isOnline={false} isSubmitted={false} />);
    const banner = screen.getByTestId("offline-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent("Offline Mode Active");
    expect(banner).toHaveTextContent("Do not close this tab");
  });

  it("hides when online", () => {
    render(<OfflineBanner isOnline={true} isSubmitted={false} />);
    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
  });

  it("does not render after submission is complete", () => {
    render(<OfflineBanner isOnline={false} isSubmitted={true} />);
    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
  });

  it("uses amber styling per UX spec", () => {
    render(<OfflineBanner isOnline={false} isSubmitted={false} />);
    const banner = screen.getByTestId("offline-banner");
    expect(banner.className).toContain("border-amber-400");
    expect(banner.className).toContain("bg-amber-50");
    expect(banner.className).toContain("text-amber-800");
  });
});
