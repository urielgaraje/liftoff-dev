import { test, expect } from "@playwright/test";
import { fresh, hostCreatesRoom, playerJoins, typeChars } from "./helpers";

const PASSPHRASE = process.env.HOST_PASSPHRASE;
const STAGE_MS = Number(process.env.STAGE_DURATION_OVERRIDE_MS ?? "5000");

test.describe("stage 1 — typing", () => {
  test.skip(!PASSPHRASE, "HOST_PASSPHRASE missing in env");

  test("flow completo: host inicia, players teclean, stage cierra, leaderboard correcto", async ({
    browser,
  }) => {
    const host = await fresh(browser);
    const alice = await fresh(browser);
    const bob = await fresh(browser);

    const code = await hostCreatesRoom(host, PASSPHRASE!);
    await Promise.all([
      playerJoins(alice, code, "alice", "magenta"),
      playerJoins(bob, code, "bob", "yellow"),
    ]);

    await expect(host.getByTestId("host-player-alice")).toBeVisible();
    await expect(host.getByTestId("host-player-bob")).toBeVisible();

    await host.getByTestId("host-start").click();

    await expect(alice.getByTestId("typing-stage")).toBeVisible({ timeout: 10000 });
    await expect(bob.getByTestId("typing-stage")).toBeVisible({ timeout: 10000 });
    await expect(host.getByTestId("broadcast-rockets")).toBeVisible({ timeout: 10000 });

    await typeChars(alice, 30);
    await typeChars(bob, 10);

    await expect(host.getByTestId("leaderboard-alice")).toBeVisible({ timeout: 8000 });
    await expect(host.getByTestId("leaderboard-bob")).toBeVisible({ timeout: 8000 });

    const aliceRow = host.getByTestId("leaderboard-alice");
    const bobRow = host.getByTestId("leaderboard-bob");
    const aliceBox = await aliceRow.boundingBox();
    const bobBox = await bobRow.boundingBox();
    expect(aliceBox).not.toBeNull();
    expect(bobBox).not.toBeNull();
    expect(aliceBox!.y).toBeLessThan(bobBox!.y);

    await expect(host.getByTestId("broadcast-header")).toContainText(
      "CARRERA COMPLETADA",
      { timeout: STAGE_MS + 15000 },
    );

    await expect(alice.getByTestId("play-ended")).toBeVisible({ timeout: 10000 });
    await expect(bob.getByTestId("play-ended")).toBeVisible({ timeout: 10000 });
  });
});
