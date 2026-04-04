import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskLevelBadge, TrendBadge, AcwrValue } from "@/components/risk-badge";

describe("RiskLevelBadge", () => {
  it.each([
    ["low", "Low"],
    ["moderate", "Moderate"],
    ["high", "High"],
    ["critical", "Critical"],
  ] as const)("renders %s as %s", (level, label) => {
    render(<RiskLevelBadge level={level} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("TrendBadge", () => {
  it.each([
    ["improving", /improving/],
    ["stable", /stable/],
    ["declining", /declining/],
  ] as const)("renders %s trend", (trend, pattern) => {
    render(<TrendBadge trend={trend} />);
    expect(screen.getByText(pattern)).toBeInTheDocument();
  });
});

describe("AcwrValue", () => {
  it("renders null as N/A", () => {
    render(<AcwrValue acwr={null} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders numeric value with 2 decimals", () => {
    render(<AcwrValue acwr={1.23} />);
    expect(screen.getByText("1.23")).toBeInTheDocument();
  });
});
