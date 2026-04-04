import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock SVG components (same as body-map tests)
vi.mock("@/components/male-front-svg", () => ({
  default: () => <div data-testid="front-svg" />,
}));
vi.mock("@/components/male-back-svg", () => ({
  default: () => <div data-testid="back-svg" />,
}));

import WellnessForm from "@/components/wellness-form";

function fillAllMetrics() {
  // The RatingInput renders 10 buttons per metric. Labels are the metric names.
  // Click button "7" for each metric — they appear as numbered buttons.
  // Each metric renders its label as text, followed by 10 buttons.
  const metricLabels = ["Fatigue", "Muscle Soreness", "Sleep Quality", "Recovery", "Stress", "Mood"];
  for (const label of metricLabels) {
    const section = screen.getByText(label).closest("div")!;
    const buttons = section.querySelectorAll("button");
    // Button at index 6 = value "7"
    fireEvent.click(buttons[6]);
  }
}

describe("WellnessForm submit flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits to the API and shows success on 201", async () => {
    const mockResponse = {
      id: "w99",
      playerId: "1",
      date: "2026-04-05",
      fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
      overallScore: 7,
      bodyMap: [],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<WellnessForm playerId="1" />);
    fillAllMetrics();

    const submitBtn = screen.getByRole("button", { name: /submit check-in/i });
    fireEvent.click(submitBtn);

    // Should show success after API resolves
    await waitFor(() => {
      expect(screen.getByText(/check-in complete/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/wellness/check-in",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows validation errors from the API on 400", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ errors: [
        { field: "fatigue", message: "fatigue must be an integer 1-10" },
        { field: "date", message: "date must be YYYY-MM-DD format" },
      ] }),
    });

    render(<WellnessForm playerId="1" />);
    fillAllMetrics();

    fireEvent.click(screen.getByRole("button", { name: /submit check-in/i }));

    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/fatigue must be an integer 1-10/i)).toBeInTheDocument();
    expect(screen.getByText(/date must be YYYY-MM-DD format/i)).toBeInTheDocument();

    // Form values should still be present — the 6 metrics are still filled
    // (we verify the submit button is still visible, meaning we're not in success state)
    expect(screen.getByRole("button", { name: /submit check-in/i })).toBeInTheDocument();
  });

  it("shows network error on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<WellnessForm playerId="1" />);
    fillAllMetrics();

    fireEvent.click(screen.getByRole("button", { name: /submit check-in/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("resets form when Submit Another is clicked after success", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "w99", bodyMap: [{ regionKey: "chest" }] }),
    });

    render(<WellnessForm playerId="1" />);
    fillAllMetrics();

    fireEvent.click(screen.getByRole("button", { name: /submit check-in/i }));

    await waitFor(() => {
      expect(screen.getByText(/check-in complete/i)).toBeInTheDocument();
    });

    // Should show body area count from response
    expect(screen.getByText(/1 body area marked/i)).toBeInTheDocument();

    // Click Submit Another
    fireEvent.click(screen.getByRole("button", { name: /submit another/i }));

    // Should be back to the form
    expect(screen.getByRole("button", { name: /submit check-in/i })).toBeInTheDocument();
    // Submit should be disabled (no metrics filled)
    expect(screen.getByRole("button", { name: /submit check-in/i })).toBeDisabled();
  });

  it("disables submit button while submitting", async () => {
    let resolvePromise: (value: unknown) => void;
    const pending = new Promise((resolve) => { resolvePromise = resolve; });

    global.fetch = vi.fn().mockReturnValueOnce(pending);

    render(<WellnessForm playerId="1" />);
    fillAllMetrics();

    const submitBtn = screen.getByRole("button", { name: /submit check-in/i });
    fireEvent.click(submitBtn);

    // Submit button should be disabled during fetch
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /submitting/i });
      expect(btn).toBeDisabled();
    });

    // Resolve to clean up
    resolvePromise!({ ok: true, json: () => Promise.resolve({ id: "w99", bodyMap: [] }) });
  });
});
