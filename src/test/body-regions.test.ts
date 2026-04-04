import { describe, it, expect } from "vitest";
import {
  MUSCLE_REGIONS,
  getRegionMeta,
  getRegionViews,
  getPrimaryView,
} from "@/lib/body-regions";

describe("body-regions canonical model", () => {
  it("has no duplicate canonical keys", () => {
    const keys = MUSCLE_REGIONS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every region has a non-empty label, side, and group", () => {
    for (const r of MUSCLE_REGIONS) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(["left", "right", "center"]).toContain(r.side);
      expect(r.group.length).toBeGreaterThan(0);
    }
  });

  describe("canonical key unification", () => {
    const sharedKeys = [
      "left_shoulder",
      "right_shoulder",
      "left_forearm",
      "right_forearm",
      "left_calf",
      "right_calf",
      "traps",
    ];

    it.each(sharedKeys)(
      "%s appears in both front and back views",
      (key) => {
        const views = getRegionViews(key);
        expect(views).toContain("front");
        expect(views).toContain("back");
      },
    );

    it("no _back suffixed keys exist (except lower_back which is a unique region)", () => {
      const backSuffixed = MUSCLE_REGIONS.filter(
        (r) => r.key.endsWith("_back") && r.key !== "lower_back",
      );
      expect(backSuffixed).toHaveLength(0);
    });
  });

  describe("getPrimaryView", () => {
    it("returns front for front-only regions", () => {
      expect(getPrimaryView("chest")).toBe("front");
      expect(getPrimaryView("left_quadriceps")).toBe("front");
      expect(getPrimaryView("abdominals")).toBe("front");
    });

    it("returns back for back-only regions", () => {
      expect(getPrimaryView("left_hamstring")).toBe("back");
      expect(getPrimaryView("lower_back")).toBe("back");
      expect(getPrimaryView("left_glute")).toBe("back");
    });

    it("returns front for shared regions (front is listed first)", () => {
      expect(getPrimaryView("left_shoulder")).toBe("front");
      expect(getPrimaryView("left_calf")).toBe("front");
      expect(getPrimaryView("traps")).toBe("front");
    });
  });

  describe("getRegionMeta", () => {
    it("returns metadata for known keys", () => {
      const meta = getRegionMeta("left_quadriceps");
      expect(meta).toBeDefined();
      expect(meta!.label).toBe("L. Quadriceps");
      expect(meta!.side).toBe("left");
    });

    it("returns undefined for unknown keys", () => {
      expect(getRegionMeta("nonexistent")).toBeUndefined();
    });
  });

  describe("laterality", () => {
    it("left and right variants exist for bilateral muscles", () => {
      const bilateral = [
        "shoulder", "biceps", "forearm", "oblique", "adductor",
        "quadriceps", "calf", "triceps", "latissimus", "glute", "hamstring",
      ];
      for (const muscle of bilateral) {
        const left = getRegionMeta(`left_${muscle}`);
        const right = getRegionMeta(`right_${muscle}`);
        expect(left).toBeDefined();
        expect(right).toBeDefined();
        expect(left!.side).toBe("left");
        expect(right!.side).toBe("right");
      }
    });

    it("center regions have no left/right pair", () => {
      const centers = MUSCLE_REGIONS.filter((r) => r.side === "center");
      for (const c of centers) {
        expect(getRegionMeta(`left_${c.key}`)).toBeUndefined();
        expect(getRegionMeta(`right_${c.key}`)).toBeUndefined();
      }
    });
  });
});
