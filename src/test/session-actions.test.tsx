import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), refresh: mockRefresh }),
}));

import SessionActions from "@/components/session-actions";

describe("SessionActions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders edit link and delete button", () => {
    render(<SessionActions sessionId="s1" editHref="/workload/edit/s1" />);

    const editLink = screen.getByRole("link");
    expect(editLink).toHaveAttribute("href", "/workload/edit/s1");

    // Delete button (trash icon) is present
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
  });

  it("shows confirm/cancel on delete click", () => {
    render(<SessionActions sessionId="s1" editHref="/workload/edit/s1" />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    // Edit link should be gone in confirm state
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("cancel returns to default state", () => {
    render(<SessionActions sessionId="s1" editHref="/workload/edit/s1" />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Back to default: edit link and single delete button
    expect(screen.getByRole("link")).toHaveAttribute("href", "/workload/edit/s1");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("confirm calls DELETE API and refreshes", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

    render(<SessionActions sessionId="s1" editHref="/workload/edit/s1" />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/sessions",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({ sessionId: "s1" }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
