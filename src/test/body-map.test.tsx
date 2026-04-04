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

  it("first click on unselected region creates a selection with severity 3", () => {
    render(<BodyMap selections={selections} onChange={onChange} />);
    clickFirst("front-chest");

    expect(onChange).toHaveBeenCalledTimes(1);
    const created = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      regionKey: "chest",
      severity: 3,
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
    const { rerender } = render(
      <BodyMap selections={selections} onChange={onChange} />,
    );

    // Click left_shoulder from front
    clickFirst("front-left_shoulder");
    expect(onChange).toHaveBeenCalledTimes(1);
    const afterFront = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(afterFront).toHaveLength(1);
    expect(afterFront[0].regionKey).toBe("left_shoulder");

    // Rerender with that selection, then click from back view
    onChange.mockClear();
    rerender(<BodyMap selections={afterFront} onChange={onChange} />);

    // Switch to back tab
    const backTab = screen.getAllByRole("button", { name: /back/i })[0];
    fireEvent.click(backTab);

    clickFirst("back-left_shoulder");
    // Same canonical key already selected — no onChange
    expect(onChange).not.toHaveBeenCalled();
  });

  it("front and back calf clicks both target left_calf canonical key", () => {
    const { rerender } = render(
      <BodyMap selections={selections} onChange={onChange} />,
    );

    clickFirst("front-left_calf");
    const afterFront = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(afterFront[0].regionKey).toBe("left_calf");

    onChange.mockClear();
    rerender(<BodyMap selections={afterFront} onChange={onChange} />);

    const backTab = screen.getAllByRole("button", { name: /back/i })[0];
    fireEvent.click(backTab);

    clickFirst("back-left_calf");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("BodyMap severity behavior", () => {
  it("severity picker updates the selection", () => {
    const initial: BodyMapSelection[] = [
      { regionKey: "chest", label: "Chest", view: "front", side: "center", severity: 3 },
    ];
    const onChange = vi.fn();

    render(<BodyMap selections={initial} onChange={onChange} />);

    // Click the region to open editor
    clickFirst("front-chest");

    // Severity picker shows numbered buttons — click severity 7
    const sev7 = screen.getByRole("button", { name: "7" });
    fireEvent.click(sev7);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0] as BodyMapSelection[];
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ regionKey: "chest", severity: 7 });
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

    // Within the list, find the region label elements
    const labels = within(listContainer).getAllByText(
      /^(L\. Quadriceps|Chest|L\. Shoulder)$/,
    );

    // severity 8, then 5+C, then 5+L
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

    // Picker buttons 1-10 should not be present
    expect(screen.queryByRole("button", { name: "1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "10" })).not.toBeInTheDocument();
  });

  it("shows selected areas but without remove controls", () => {
    const sels: BodyMapSelection[] = [
      { regionKey: "chest", label: "Chest", view: "front", side: "center", severity: 5 },
    ];

    render(<BodyMap selections={sels} readOnly />);

    expect(screen.getAllByText("Chest").length).toBeGreaterThan(0);
    // Remove buttons use hover:text-danger class
    const removeButtons = document.querySelectorAll('[class*="hover:text-danger"]');
    expect(removeButtons).toHaveLength(0);
  });
});
