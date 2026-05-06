import { test, expect, type Browser, type Page } from "@playwright/test";

const PASSPHRASE = process.env.HOST_PASSPHRASE;
const STAGE_MS = Number(process.env.STAGE_DURATION_OVERRIDE_MS ?? "3000");

async function fresh(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  return ctx.newPage();
}

async function hostCreate(host: Page): Promise<string> {
  await host.goto("/");
  await host.getByTestId("host-passphrase").fill(PASSPHRASE!);
  await host.getByTestId("host-create").click();
  await expect(host).toHaveURL(/\/host$/);
  const code = (await host.getByTestId("host-code").textContent())?.trim() ?? "";
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
  return code;
}

async function playerJoin(page: Page, code: string, nickname: string, skin: string) {
  await page.goto("/");
  await page.getByTestId("join-code").fill(code);
  await page.getByTestId("join-submit").click();
  await page.getByTestId("nickname-input").fill(nickname);
  await page.getByTestId(`skin-${skin}`).click();
  await page.getByTestId("join-rocket").click();
  await expect(page.getByTestId("lobby")).toBeVisible();
}

async function typeChars(page: Page, count: number) {
  await page.evaluate(async (n: number) => {
    const w = window as unknown as { __sentChars?: number };
    w.__sentChars = 0;
    const stage = document.querySelector('[data-testid="typing-stage"]');
    if (!stage) throw new Error("stage not mounted");
    const para = stage
      .querySelector("p")
      ?.textContent?.replace(/ /g, "")
      .trim();
    if (!para) throw new Error("paragraph not found");
    const chars = Array.from(para);
    for (let i = 0; i < n && i < chars.length; i++) {
      const ch = chars[i];
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: ch, bubbles: true, cancelable: true }),
      );
      await new Promise((r) => setTimeout(r, 4));
    }
  }, count);
}

test.describe("stage 1 — typing", () => {
  test.skip(!PASSPHRASE, "HOST_PASSPHRASE missing in env");

  test("flow completo: host inicia, players teclean, stage cierra, leaderboard correcto", async ({
    browser,
  }) => {
    const host = await fresh(browser);
    const alice = await fresh(browser);
    const bob = await fresh(browser);

    const code = await hostCreate(host);
    await Promise.all([
      playerJoin(alice, code, "alice", "magenta"),
      playerJoin(bob, code, "bob", "yellow"),
    ]);

    await expect(host.getByTestId("host-player-alice")).toBeVisible();
    await expect(host.getByTestId("host-player-bob")).toBeVisible();

    await host.getByTestId("host-start").click();

    await expect(alice.getByTestId("typing-stage")).toBeVisible({ timeout: 5000 });
    await expect(bob.getByTestId("typing-stage")).toBeVisible({ timeout: 5000 });
    await expect(host.getByTestId("broadcast-rockets")).toBeVisible({ timeout: 5000 });

    await typeChars(alice, 30);
    await typeChars(bob, 10);

    await expect(host.getByTestId("leaderboard-alice")).toBeVisible({ timeout: 3000 });
    await expect(host.getByTestId("leaderboard-bob")).toBeVisible({ timeout: 3000 });

    const aliceRow = host.getByTestId("leaderboard-alice");
    const bobRow = host.getByTestId("leaderboard-bob");
    const aliceBox = await aliceRow.boundingBox();
    const bobBox = await bobRow.boundingBox();
    expect(aliceBox).not.toBeNull();
    expect(bobBox).not.toBeNull();
    expect(aliceBox!.y).toBeLessThan(bobBox!.y);

    await expect(host.getByTestId("broadcast-header")).toContainText(
      "CARRERA COMPLETADA",
      { timeout: STAGE_MS + 8000 },
    );

    await expect(alice.getByTestId("play-ended")).toBeVisible({ timeout: 5000 });
    await expect(bob.getByTestId("play-ended")).toBeVisible({ timeout: 5000 });
  });
});
