import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SessionForm from "@/components/session-form";

function fillForm() {
  // Date is pre-filled. Select duration and RPE.
  const durationInput = screen.getByLabelText(/duration/i);
  fireEvent.change(durationInput, { target: { value: "75" } });

  // RPE — click button "6" in the RPE rating input section
  const rpeSection = screen.getByText(/rpe/i).closest("div")!;
  const buttons = rpeSection.querySelectorAll("button");
  // Button at index 5 = value "6"
  fireEvent.click(buttons[5]);
}

describe("SessionForm submit flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits to the API and shows success with session load", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "ts99", sessionLoad: 450 }),
    });

    render(<SessionForm defaultPlayerId="1" />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: /log session/i }));

    await waitFor(() => {
      expect(screen.getByText(/session logged/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/450 AU/)).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/sessions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows validation errors from the API on 400", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        errors: [
          { field: "durationMinutes", message: "durationMinutes must be an integer 1-600" },
        ],
      }),
    });

    render(<SessionForm defaultPlayerId="1" />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: /log session/i }));

    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/durationMinutes must be an integer 1-600/i)).toBeInTheDocument();

    // Form should still be visible (not in success state)
    expect(screen.getByRole("button", { name: /log session/i })).toBeInTheDocument();
  });

  it("shows network error on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<SessionForm defaultPlayerId="1" />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: /log session/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("disables submit button while submitting", async () => {
    let resolvePromise: (value: unknown) => void;
    const pending = new Promise((resolve) => { resolvePromise = resolve; });

    global.fetch = vi.fn().mockReturnValueOnce(pending);

    render(<SessionForm defaultPlayerId="1" />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: /log session/i }));

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /submitting/i });
      expect(btn).toBeDisabled();
    });

    resolvePromise!({ ok: true, json: () => Promise.resolve({ id: "ts99", sessionLoad: 450 }) });
  });

  it("resets form when Log Another is clicked", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "ts99", sessionLoad: 450 }),
    });

    render(<SessionForm defaultPlayerId="1" />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: /log session/i }));

    await waitFor(() => {
      expect(screen.getByText(/session logged/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /log another/i }));

    // Should be back to form with empty duration and no RPE selected
    expect(screen.getByRole("button", { name: /log session/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log session/i })).toBeDisabled();
  });

  it("shows estimated load preview when RPE and duration are filled", () => {
    render(<SessionForm defaultPlayerId="1" />);
    fillForm(); // duration=75, rpe=6

    expect(screen.getByText("450")).toBeInTheDocument();
    expect(screen.getByText("AU")).toBeInTheDocument();
  });
});
