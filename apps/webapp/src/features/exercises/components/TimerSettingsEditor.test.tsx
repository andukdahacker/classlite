import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import { TimerSettingsEditor } from "./TimerSettingsEditor";

describe("TimerSettingsEditor", () => {
  const defaultProps = {
    timeLimit: null as number | null,
    timerPosition: null as "top-bar" | "floating" | null,
    warningAlerts: null as number[] | null,
    autoSubmitOnExpiry: true,
    gracePeriodSeconds: null as number | null,
    enablePause: false,
    onTimeLimitChange: vi.fn(),
    onTimerPositionChange: vi.fn(),
    onWarningAlertsChange: vi.fn(),
    onAutoSubmitOnExpiryChange: vi.fn(),
    onGracePeriodSecondsChange: vi.fn(),
    onEnablePauseChange: vi.fn(),
  };

  it("renders with time limit disabled", () => {
    render(<TimerSettingsEditor {...defaultProps} />);
    expect(screen.getByText("Timer & Test Conditions")).toBeInTheDocument();
    expect(screen.getByText("Enable Time Limit")).toBeInTheDocument();
    // Sub-sections should NOT be visible
    expect(screen.queryByText("Timer Display Position")).not.toBeInTheDocument();
    expect(screen.queryByText("Warning Alerts")).not.toBeInTheDocument();
    expect(screen.queryByText("Auto-submit when time expires")).not.toBeInTheDocument();
    expect(screen.queryByText("Allow students to pause timer")).not.toBeInTheDocument();
  });

  it("shows all sub-sections when time limit is enabled", () => {
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        warningAlerts={[600, 300]}
      />,
    );
    expect(screen.getByText("Timer Display Position")).toBeInTheDocument();
    expect(screen.getByText("Warning Alerts")).toBeInTheDocument();
    expect(screen.getByText("Auto-submit when time expires")).toBeInTheDocument();
    expect(screen.getByText("Allow students to pause timer")).toBeInTheDocument();
  });

  it("enables time limit with defaults when toggled on", () => {
    const onTimeLimitChange = vi.fn();
    const onTimerPositionChange = vi.fn();
    const onWarningAlertsChange = vi.fn();
    render(
      <TimerSettingsEditor
        {...defaultProps}
        onTimeLimitChange={onTimeLimitChange}
        onTimerPositionChange={onTimerPositionChange}
        onWarningAlertsChange={onWarningAlertsChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Enable Time Limit"));
    expect(onTimeLimitChange).toHaveBeenCalledWith(3600); // 60 minutes in seconds
    expect(onTimerPositionChange).toHaveBeenCalledWith("top-bar");
    expect(onWarningAlertsChange).toHaveBeenCalledWith([600, 300]);
  });

  it("clears all timer fields when time limit is toggled off", () => {
    const onTimeLimitChange = vi.fn();
    const onTimerPositionChange = vi.fn();
    const onWarningAlertsChange = vi.fn();
    const onAutoSubmitOnExpiryChange = vi.fn();
    const onGracePeriodSecondsChange = vi.fn();
    const onEnablePauseChange = vi.fn();
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        warningAlerts={[600, 300]}
        onTimeLimitChange={onTimeLimitChange}
        onTimerPositionChange={onTimerPositionChange}
        onWarningAlertsChange={onWarningAlertsChange}
        onAutoSubmitOnExpiryChange={onAutoSubmitOnExpiryChange}
        onGracePeriodSecondsChange={onGracePeriodSecondsChange}
        onEnablePauseChange={onEnablePauseChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Enable Time Limit"));
    expect(onTimeLimitChange).toHaveBeenCalledWith(null);
    expect(onTimerPositionChange).toHaveBeenCalledWith(null);
    expect(onWarningAlertsChange).toHaveBeenCalledWith(null);
    expect(onAutoSubmitOnExpiryChange).toHaveBeenCalledWith(true);
    expect(onGracePeriodSecondsChange).toHaveBeenCalledWith(null);
    expect(onEnablePauseChange).toHaveBeenCalledWith(false);
  });

  it("converts minutes to seconds for time limit change", () => {
    const onTimeLimitChange = vi.fn();
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        onTimeLimitChange={onTimeLimitChange}
      />,
    );
    const input = screen.getByLabelText("Time Limit (minutes)");
    fireEvent.change(input, { target: { value: "90" } });
    expect(onTimeLimitChange).toHaveBeenCalledWith(5400); // 90 * 60
  });

  it("adds and removes warning alerts", () => {
    const onWarningAlertsChange = vi.fn();
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        warningAlerts={[600, 300]}
        onWarningAlertsChange={onWarningAlertsChange}
      />,
    );

    // Remove first warning — trash buttons are icon buttons in warning rows
    const removeButtons = screen.getAllByRole("button", { name: "" });
    const trashButtons = removeButtons.filter((btn) =>
      btn.querySelector("svg"),
    );
    expect(trashButtons.length).toBeGreaterThan(0);
    fireEvent.click(trashButtons[0]);
    expect(onWarningAlertsChange).toHaveBeenCalled();
  });

  it("shows grace period when auto-submit is on", () => {
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        autoSubmitOnExpiry={true}
      />,
    );
    expect(screen.getByLabelText("Grace Period (minutes, optional)")).toBeInTheDocument();
  });

  it("hides grace period when auto-submit is off", () => {
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        autoSubmitOnExpiry={false}
      />,
    );
    expect(screen.queryByLabelText("Grace Period (minutes, optional)")).not.toBeInTheDocument();
  });

  it("auto-clears grace period when auto-submit is toggled off", () => {
    const onAutoSubmitOnExpiryChange = vi.fn();
    const onGracePeriodSecondsChange = vi.fn();
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        autoSubmitOnExpiry={true}
        gracePeriodSeconds={60}
        onAutoSubmitOnExpiryChange={onAutoSubmitOnExpiryChange}
        onGracePeriodSecondsChange={onGracePeriodSecondsChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Auto-submit when time expires"));
    expect(onAutoSubmitOnExpiryChange).toHaveBeenCalledWith(false);
    expect(onGracePeriodSecondsChange).toHaveBeenCalledWith(null);
  });

  it("toggles pause option", () => {
    const onEnablePauseChange = vi.fn();
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        onEnablePauseChange={onEnablePauseChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Allow students to pause timer"));
    expect(onEnablePauseChange).toHaveBeenCalledWith(true);
  });

  it("converts grace period minutes to seconds", () => {
    const onGracePeriodSecondsChange = vi.fn();
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        autoSubmitOnExpiry={true}
        onGracePeriodSecondsChange={onGracePeriodSecondsChange}
      />,
    );
    const input = screen.getByLabelText("Grace Period (minutes, optional)");
    fireEvent.change(input, { target: { value: "2" } });
    expect(onGracePeriodSecondsChange).toHaveBeenCalledWith(120); // 2 * 60
  });

  it("converts warning alert minutes to seconds", () => {
    const onWarningAlertsChange = vi.fn();
    render(
      <TimerSettingsEditor
        {...defaultProps}
        timeLimit={3600}
        timerPosition="top-bar"
        warningAlerts={[600]}
        onWarningAlertsChange={onWarningAlertsChange}
      />,
    );
    // Change the warning value — find the number input displaying "10" (600/60)
    const numberInputs = screen.getAllByRole("spinbutton");
    const warningInput = numberInputs.find(
      (input) => (input as HTMLInputElement).value === "10",
    );
    expect(warningInput).toBeDefined();
    fireEvent.change(warningInput!, { target: { value: "5" } });
    expect(onWarningAlertsChange).toHaveBeenCalledWith([300]); // 5 * 60
  });
});
