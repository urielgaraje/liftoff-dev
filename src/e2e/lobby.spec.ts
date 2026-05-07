import { test, expect, type Browser, type Page } from "@playwright/test";

const PASSPHRASE = process.env.HOST_PASSPHRASE;

async function fresh(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  return ctx.newPage();
}

async function hostCreatesRoom(host: Page): Promise<string> {
  await host.goto("/");
  await host.getByTestId("host-open").click();
  await host.getByTestId("host-passphrase").fill(PASSPHRASE!);
  await host.getByTestId("host-create").click();
  await expect(host).toHaveURL(/\/host$/);
  const codeEl = host.getByTestId("host-code");
  await expect(codeEl).toBeVisible();
  const code = (await codeEl.textContent())?.trim();
  expect(code, "host code should be visible").toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
  return code!;
}

async function playerJoins(
  page: Page,
  code: string,
  nickname: string,
  skin: string,
): Promise<void> {
  await page.goto("/");
  await page.getByTestId("join-code").fill(code);
  await page.getByTestId("join-submit").click();
  await expect(page).toHaveURL(new RegExp(`/play\\?code=${code}`));
  await page.getByTestId("nickname-input").fill(nickname);
  await page.getByTestId(`skin-${skin}`).click();
  await page.getByTestId("join-rocket").click();
  await expect(page.getByTestId("lobby")).toBeVisible();
}

test.describe("vertical slice — lobby sync", () => {
  test.skip(!PASSPHRASE, "HOST_PASSPHRASE missing in env");

  test("3 contextos: host crea, 2 players entran, todos ven a todos", async ({
    browser,
  }) => {
    const host = await fresh(browser);
    const playerB = await fresh(browser);
    const playerC = await fresh(browser);

    const code = await hostCreatesRoom(host);

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
