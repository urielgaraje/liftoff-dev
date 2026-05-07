import { test, expect } from "@playwright/test";
import { fresh, hostCreatesRoom, playerJoins } from "./helpers";

const PASSPHRASE = process.env.HOST_PASSPHRASE;

test.describe("vertical slice — lobby sync", () => {
  test.skip(!PASSPHRASE, "HOST_PASSPHRASE missing in env");

  test("3 contextos: host crea, 2 players entran, todos ven a todos", async ({
    browser,
  }) => {
    const host = await fresh(browser);
    const playerB = await fresh(browser);
    const playerC = await fresh(browser);

    const code = await hostCreatesRoom(host, PASSPHRASE!);

    await Promise.all([
      playerJoins(playerB, code, "alice", "magenta"),
      playerJoins(playerC, code, "bob", "yellow"),
    ]);

    await expect(host.getByTestId("host-player-alice")).toBeVisible({ timeout: 5000 });
    await expect(host.getByTestId("host-player-bob")).toBeVisible({ timeout: 5000 });
    await expect(host.getByTestId("host-count")).toHaveText("2/50");

    await expect(playerB.getByTestId("player-bob")).toBeVisible({ timeout: 5000 });
    await expect(playerC.getByTestId("player-alice")).toBeVisible({ timeout: 5000 });
  });
});
