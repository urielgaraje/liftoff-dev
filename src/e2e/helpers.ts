import { expect, type Browser, type Page } from "@playwright/test";

export async function fresh(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  return ctx.newPage();
}

export async function hostCreatesRoom(
  host: Page,
  passphrase: string,
  opts?: { stageDurationMs?: number; maxPlayers?: number },
): Promise<string> {
  await host.goto("/");
  await host.getByTestId("host-open").click();
  await host.getByTestId("host-passphrase").fill(passphrase);
  if (opts?.stageDurationMs !== undefined) {
    const seconds = Math.max(5, Math.round(opts.stageDurationMs / 1000));
    await host.getByTestId("host-duration").fill(String(seconds));
  }
  if (opts?.maxPlayers !== undefined) {
    await host.getByTestId("host-max-players").fill(String(opts.maxPlayers));
  }
  await host.getByTestId("host-create").click();
  await expect(host).toHaveURL(/\/host$/, { timeout: 30_000 });
  const codeEl = host.getByTestId("host-code");
  await expect(codeEl).toBeVisible({ timeout: 15_000 });
  const code = (await codeEl.textContent())?.trim();
  expect(code, "host code should be visible").toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
  return code!;
}

export async function playerJoins(
  page: Page,
  code: string,
  nickname: string,
  skin: string,
): Promise<void> {
  await page.goto("/");
  await page.getByTestId("join-code").fill(code);
  await page.getByTestId("join-submit").click();
  await expect(page).toHaveURL(new RegExp(`/play\\?code=${code}`), { timeout: 30_000 });
  await page.getByTestId("nickname-input").fill(nickname);
  await page.getByTestId(`skin-${skin}`).click();
  await page.getByTestId("join-rocket").click();
  await expect(page.getByTestId("lobby")).toBeVisible({ timeout: 60_000 });
}

export async function typeChars(page: Page, count: number): Promise<void> {
  await page.evaluate(async (n: number) => {
    const stage = document.querySelector('[data-testid="typing-stage"]');
    if (!stage) throw new Error("stage not mounted");
    const para = stage
      .querySelector("p")
      ?.textContent?.replace(/ /g, "")
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
