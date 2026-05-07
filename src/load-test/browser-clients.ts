import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { hostCreatesRoom, playerJoins } from "@/e2e/helpers";

export type BrowserHost = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  code: string;
  startStage: () => Promise<void>;
  close: () => Promise<void>;
};

export type BrowserPlayer = {
  context: BrowserContext;
  page: Page;
  nickname: string;
  close: () => Promise<void>;
};

export async function launchHost(args: {
  baseUrl: string;
  passphrase: string;
  headless: boolean;
}): Promise<BrowserHost> {
  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({ baseURL: args.baseUrl });
  const page = await context.newPage();
  const code = await hostCreatesRoom(page, args.passphrase);
  return {
    browser,
    context,
    page,
    code,
    startStage: async () => {
      await page.getByTestId("host-start").click();
    },
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

const SKINS = ["magenta", "yellow", "cyan", "green", "purple", "orange", "red", "blue"] as const;

export async function launchBrowserPlayer(args: {
  hostBrowser: Browser;
  baseUrl: string;
  code: string;
  nickname: string;
  skinIndex: number;
}): Promise<BrowserPlayer> {
  const context = await args.hostBrowser.newContext({ baseURL: args.baseUrl });
  const page = await context.newPage();
  const skin = SKINS[args.skinIndex % SKINS.length];
  await playerJoins(page, args.code, args.nickname, skin);
  return {
    context,
    page,
    nickname: args.nickname,
    close: async () => {
      await context.close();
    },
  };
}
