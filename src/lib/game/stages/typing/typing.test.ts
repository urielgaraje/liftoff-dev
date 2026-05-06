import { describe, expect, it } from "vitest";
import { typingStage } from "./typing";

describe("typingStage.validateProgress", () => {
  it("acepta progresion normal", () => {
    expect(
      typingStage.validateProgress({ prev: 10, next: 15, elapsedMs: 1000 }),
    ).toBe(true);
  });

  it("rechaza retroceso", () => {
    expect(
      typingStage.validateProgress({ prev: 20, next: 15, elapsedMs: 1000 }),
    ).toBe(false);
  });

  it("rechaza chars/s imposibles", () => {
    expect(
      typingStage.validateProgress({ prev: 0, next: 100, elapsedMs: 1000 }),
    ).toBe(false);
  });

  it("acepta chars/s en el techo", () => {
    expect(
      typingStage.validateProgress({ prev: 0, next: 25, elapsedMs: 1000 }),
    ).toBe(true);
  });

  it("rechaza valores negativos", () => {
    expect(
      typingStage.validateProgress({ prev: 0, next: -1, elapsedMs: 100 }),
    ).toBe(false);
  });
});

describe("typingStage.buildInit", () => {
  it("devuelve un parrafo no vacio", () => {
    const init = typingStage.buildInit();
    expect(init.paragraph.length).toBeGreaterThan(50);
  });
});
