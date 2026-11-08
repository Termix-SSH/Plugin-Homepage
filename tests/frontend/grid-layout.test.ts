import { describe, expect, it } from "vitest";
import {
  FOLDER_HEIGHT,
  columnsFor,
  gridFromCanvas,
  layoutFromSlots,
  slotsForItems,
} from "../../src/frontend/grid-layout";

const none = () => false;
const size = () => ({ w: 300, h: 150 });

describe("columnsFor", () => {
  it("keeps widgets between 2 and 12 columns", () => {
    expect(columnsFor(10)).toBe(2);
    expect(columnsFor(300)).toBe(3);
    expect(columnsFor(5000)).toBe(12);
  });
});

describe("gridFromCanvas", () => {
  it("moves canvas pixels to columns from the top left widget", () => {
    const slots = gridFromCanvas(
      [
        { itemId: 2, x: 50400, y: 50000, w: 600, h: 200 },
        { itemId: 1, x: 50000, y: 50000, w: 300, h: 200 },
      ],
      none,
    );
    expect(slots).toEqual([
      { id: "1", x: 0, y: 0, w: 3, h: 200 },
      { id: "2", x: 4, y: 0, w: 6, h: 200 },
    ]);
  });

  it("scales a wide layout down to fit 12 columns", () => {
    const slots = gridFromCanvas(
      [
        { itemId: 1, x: 0, y: 0, w: 1200, h: 100 },
        { itemId: 2, x: 1200, y: 0, w: 1200, h: 100 },
      ],
      none,
    );
    expect(slots.map((slot) => [slot.x, slot.w])).toEqual([
      [0, 6],
      [6, 6],
    ]);
  });

  it("turns folders into headings", () => {
    const [slot] = gridFromCanvas(
      [{ itemId: 7, x: 0, y: 0, w: 900, h: 600 }],
      (id) => id === 7,
    );
    expect(slot.h).toBe(FOLDER_HEIGHT);
  });
});

describe("slotsForItems", () => {
  it("converts a layout saved by the old canvas", () => {
    const slots = slotsForItems(
      {
        entries: [{ itemId: 1, x: 900, y: 900, w: 600, h: 300 }],
      },
      [1],
      size,
      none,
    );
    expect(slots).toEqual([{ id: "1", x: 0, y: 0, w: 6, h: 300 }]);
  });

  it("reads a grid layout as it was saved", () => {
    const layout = layoutFromSlots([{ id: "1", x: 4, y: 20, w: 6, h: null }]);
    const slots = slotsForItems(layout, [1], size, none);
    expect(slots[0]).toMatchObject({ id: "1", x: 4, w: 6 });
  });

  it("adds items with no saved place and drops ones that are gone", () => {
    const layout = layoutFromSlots([{ id: "9", x: 0, y: 0, w: 4, h: 100 }]);
    const slots = slotsForItems(layout, [1], size, none);
    expect(slots.map((slot) => slot.id)).toEqual(["1"]);
    expect(slots[0].w).toBe(3);
  });
});
