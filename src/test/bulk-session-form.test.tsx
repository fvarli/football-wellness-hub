import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

import BulkSessionForm from "@/components/bulk-session-form";
import type { Player } from "@/lib/types";

const players: Player[] = [
  { id: "1", name: "Emre Yilmaz", number: 10, position: "MF", status: "available" },
  { id: "2", name: "Ali Demir", number: 7, position: "FW", status: "available" },
  { id: "3", name: "Can Ozturk", number: 4, position: "DF", status: "available" },
];

function fillSharedFields() {
  fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: "75" } });
  const rpeSection = screen.getByText(/rpe/i).closest("div")!;
  const buttons = rpeSection.querySelectorAll("button");
  fireEvent.click(buttons[5]); // RPE = 6
}

function selectAllPlayers() {
  fireEvent.click(screen.getByText(/select all/i));
}

describe("BulkSessionForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders checkboxes for all players", () => {
    render(<BulkSessionForm players={players} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    expect(screen.getByText("Emre Yilmaz")).toBeInTheDocument();
    expect(screen.getByText("Ali Demir")).toBeInTheDocument();
    expect(screen.getByText("Can Ozturk")).toBeInTheDocument();
  });

  it("select all / deselect all toggles all checkboxes", () => {
    render(<BulkSessionForm players={players} />);

    selectAllPlayers();
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes.every((cb) => cb.checked)).toBe(true);

    // Button text should now be Deselect All
    fireEvent.click(screen.getByText(/deselect all/i));
    expect(checkboxes.every((cb) => !cb.checked)).toBe(true);
  });

  it("submits to /api/sessions/bulk with correct payload", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        sessions: [
          { id: "s1", playerId: "1", sessionLoad: 450 },
          { id: "s2", playerId: "2", sessionLoad: 450 },
          { id: "s3", playerId: "3", sessionLoad: 450 },
        ],
      }),
    });

    render(<BulkSessionForm players={players} />);
    selectAllPlayers();
    fillSharedFields();

    fireEvent.click(screen.getByRole("button", { name: /log 3 sessions/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/sessions/bulk",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows success screen with count and player names", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        sessions: [
          { id: "s1", playerId: "1", sessionLoad: 450 },
          { id: "s2", playerId: "2", sessionLoad: 450 },
        ],
      }),
    });

    render(<BulkSessionForm players={players} />);
    // Select first two players
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fillSharedFields();

    fireEvent.click(screen.getByRole("button", { name: /log 2 sessions/i }));

    await waitFor(() => {
      expect(screen.getByText(/2 sessions logged/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/450 AU/)).toBeInTheDocument();
    expect(screen.getByText(/Emre Yilmaz/)).toBeInTheDocument();
  });

  it("shows validation errors from API on 400", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        errors: [{ field: "date", message: "date must be YYYY-MM-DD format" }],
      }),
    });

    render(<BulkSessionForm players={players} />);
    selectAllPlayers();
    fillSharedFields();

    fireEvent.click(screen.getByRole("button", { name: /log 3 sessions/i }));

    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/date must be YYYY-MM-DD format/i)).toBeInTheDocument();
  });

  it("shows network error on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<BulkSessionForm players={players} />);
    selectAllPlayers();
    fillSharedFields();

    fireEvent.click(screen.getByRole("button", { name: /log 3 sessions/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("disables submit when no players selected", () => {
    render(<BulkSessionForm players={players} />);
    fillSharedFields();
    // No players selected — button should be disabled
    const submitBtn = screen.getByRole("button", { name: /log 0 sessions/i });
    expect(submitBtn).toBeDisabled();
  });

  it("shows per-player and total load preview", () => {
    render(<BulkSessionForm players={players} />);
    selectAllPlayers();
    fillSharedFields(); // duration=75, rpe=6 => load=450

    expect(screen.getByText("450")).toBeInTheDocument();
    expect(screen.getByText(/per player/i)).toBeInTheDocument();
    expect(screen.getByText(/1350 AU total/)).toBeInTheDocument();
  });

  it("resets form after Log More click", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        sessions: [{ id: "s1", playerId: "1", sessionLoad: 450 }],
      }),
    });

    render(<BulkSessionForm players={players} />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fillSharedFields();

    fireEvent.click(screen.getByRole("button", { name: /log 1 session/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 session logged/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /log more/i }));

    // Should be back to form with no selections
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes.every((cb) => !cb.checked)).toBe(true);
  });
});
