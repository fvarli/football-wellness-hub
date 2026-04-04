import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { BodyMapSelection } from "@/lib/types";

// Mock the heavy SVG components with simple clickable elements.
// Both mobile and desktop containers render in jsdom (no CSS media),
// so each mock appears twice. Tests use getAllByTestId and take [0].
vi.mock("@/components/male-front-svg", () => ({
  default: ({ onRegionClick, selections, getLabel }: {
    onRegionClick: (key: string) => void;
    selections: Map<string, number>;
    getLabel: (key: string) => string;
    [k: string]: unknown;
  }) => (
    <div data-testid="front-svg">
      {["left_shoulder", "chest", "left_quadriceps", "left_calf"].map((k) => (
        <button
          key={k}
          data-testid={`front-${k}`}
          onClick={() => onRegionClick(k)}
          data-selected={selections.has(k) ? "true" : "false"}
          data-severity={selections.get(k) ?? ""}
        >
          {getLabel(k)}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/components/male-back-svg", () => ({
  default: ({ onRegionClick, selections, getLabel }: {
    onRegionClick: (key: string) => void;
    selections: Map<string, number>;
    getLabel: (key: string) => string;
    [k: string]: unknown;
  }) => (
    <div data-testid="back-svg">
      {["left_shoulder", "traps", "left_hamstring", "left_calf"].map((k) => (
        <button
          key={k}
          data-testid={`back-${k}`}
          onClick={() => onRegionClick(k)}
          data-selected={selections.has(k) ? "true" : "false"}
          data-severity={selections.get(k) ?? ""}
        >
          {getLabel(k)}
        </button>
      ))}
    </div>
  ),
}));

import BodyMap from "@/components/body-map";

/** Click the first element matching a testid (avoids mobile/desktop duplicate issues). */
function clickFirst(testId: string) {
  fireEvent.click(screen.getAllByTestId(testId)[0]);
}

describe("BodyMap selection behavior", () => {
  let selections: BodyMapSelection[];
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    selections = [];
    onChange = vi.fn((next: BodyMapSelection[]) => {
      selections = next;
    });
  });

  it("first click on unselected region opens the picker but does NOT persist a selection", () => {
    render(<BodyMap selections={selections} onChange={onChange} />);
    clickFirst("front-chest");

    // No onChange call — click only focuses the region in the editor
    expect(onChange).not.toHaveBeenCalled();

    // The severity picker should be visible (the label "Chest" appears in the picker header)
    // and no severity button is pre-selected, so the Remove button is hidden
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it("choosing a severity on a focused-but-unselected region creates the selection", () => {
    render(<BodyMap selections={selections} onChange={onChange} />);

    // Focus the region
    clickFirst("front-chest");
    expect(onChange).not.toHaveBeenCalled();

    // Pick severity 5
    fireEvent.click(screen.getByRole("button", { name: "5" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const created = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      regionKey: "chest",
      severity: 5,
      label: "Chest",
      view: "front",
      side: "center",
    });
  });

  it("clicking an already selected region does not duplicate it", () => {
    const existing: BodyMapSelection[] = [
      { regionKey: "chest", label: "Chest", view: "front", side: "center", severity: 5 },
    ];

    render(<BodyMap selections={existing} onChange={onChange} />);
    clickFirst("front-chest");

    // Should NOT call onChange — just toggles editor focus
    expect(onChange).not.toHaveBeenCalled();
  });

  it("front and back clicks for the same canonical key do not duplicate", () => {
    // Create a selection for left_shoulder via severity picker
    const { rerender } = render(
      <BodyMap selections={selections} onChange={onChange} />,
    );
    clickFirst("front-left_shoulder");
    fireEvent.click(screen.getByRole("button", { name: "4" }));

    const afterCreate = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(afterCreate).toHaveLength(1);
    expect(afterCreate[0].regionKey).toBe("left_shoulder");

    // Rerender with that selection, switch to back, click same muscle
    onChange.mockClear();
    rerender(<BodyMap selections={afterCreate} onChange={onChange} />);

    const backTab = screen.getAllByRole("button", { name: /back/i })[0];
    fireEvent.click(backTab);

    clickFirst("back-left_shoulder");
    // Same canonical key already selected — no onChange, just opens editor
    expect(onChange).not.toHaveBeenCalled();
  });

  it("front and back calf clicks both target left_calf canonical key", () => {
    // Create via front view severity picker
    const { rerender } = render(
      <BodyMap selections={selections} onChange={onChange} />,
    );
    clickFirst("front-left_calf");
    fireEvent.click(screen.getByRole("button", { name: "6" }));

    const afterCreate = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(afterCreate[0].regionKey).toBe("left_calf");

    // Click same muscle from back view — should not duplicate
    onChange.mockClear();
    rerender(<BodyMap selections={afterCreate} onChange={onChange} />);

    const backTab = screen.getAllByRole("button", { name: /back/i })[0];
    fireEvent.click(backTab);

    clickFirst("back-left_calf");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("BodyMap severity behavior", () => {
  it("severity picker updates an existing selection", () => {
    const initial: BodyMapSelection[] = [
      { regionKey: "chest", label: "Chest", view: "front", side: "center", severity: 3 },
    ];
    const onChange = vi.fn();

    render(<BodyMap selections={initial} onChange={onChange} />);

    // Click the region to open editor
    clickFirst("front-chest");

    // Change severity to 7
    const sev7 = screen.getByRole("button", { name: "7" });
    fireEvent.click(sev7);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ regionKey: "chest", severity: 7 });
  });

  it("severity picker creates a new selection from focused state", () => {
    const onChange = vi.fn();
    render(<BodyMap selections={[]} onChange={onChange} />);

    // Focus an unselected region
    clickFirst("front-left_quadriceps");
    expect(onChange).not.toHaveBeenCalled();

    // Pick severity 9
    fireEvent.click(screen.getByRole("button", { name: "9" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const created = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      regionKey: "left_quadriceps",
      severity: 9,
    });
  });
});

describe("BodyMap sorting behavior", () => {
  it("renders selected areas sorted by severity DESC, then label ASC", () => {
    const sels: BodyMapSelection[] = [
      { regionKey: "chest", label: "Chest", view: "front", side: "center", severity: 5 },
      { regionKey: "left_quadriceps", label: "L. Quadriceps", view: "front", side: "left", severity: 8 },
      { regionKey: "left_shoulder", label: "L. Shoulder", view: "front", side: "left", severity: 5 },
    ];

    render(<BodyMap selections={sels} onChange={vi.fn()} />);

    const heading = screen.getByText(/Selected Areas/i);
    const listContainer = heading.parentElement as HTMLElement;

    const labels = within(listContainer).getAllByText(
      /^(L\. Quadriceps|Chest|L\. Shoulder)$/,
    );

    expect(labels.map((el) => el.textContent)).toEqual([
      "L. Quadriceps",
      "Chest",
      "L. Shoulder",
    ]);
  });
});

describe("BodyMap read-only mode", () => {
  it("does not call onChange when clicked in readOnly mode", () => {
    const onChange = vi.fn();
    render(<BodyMap selections={[]} onChange={onChange} readOnly />);

    clickFirst("front-chest");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not show severity picker in readOnly mode even with selections", () => {
    const sels: BodyMapSelection[] = [
      { regionKey: "chest", label: "Chest", view: "front", side: "center", severity: 5 },
    ];

    render(<BodyMap selections={sels} readOnly />);

    expect(screen.queryByRole("button", { name: "1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "10" })).not.toBeInTheDocument();
  });

  it("shows selected areas but without remove controls", () => {
    const sels: BodyMapSelection[] = [
      { regionKey: "chest", label: "Chest", view: "front", side: "center", severity: 5 },
    ];

    render(<BodyMap selections={sels} readOnly />);

    expect(screen.getAllByText("Chest").length).toBeGreaterThan(0);
    const removeButtons = document.querySelectorAll('[class*="hover:text-danger"]');
    expect(removeButtons).toHaveLength(0);
  });
});
