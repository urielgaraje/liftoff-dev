export const ROCKET_SKINS = [
  "cyan",
  "magenta",
  "yellow",
  "orange",
  "green",
  "purple",
  "red",
  "blue",
] as const;

export type RocketSkin = (typeof ROCKET_SKINS)[number];

export function isRocketSkin(value: unknown): value is RocketSkin {
  return typeof value === "string" && (ROCKET_SKINS as readonly string[]).includes(value);
}

export const SKIN_TEXT_CLASS: Record<RocketSkin, string> = {
  cyan: "text-rocket-cyan",
  magenta: "text-rocket-magenta",
  yellow: "text-rocket-yellow",
  orange: "text-rocket-orange",
  green: "text-rocket-green",
  purple: "text-rocket-purple",
  red: "text-rocket-red",
  blue: "text-rocket-blue",
};

export const SKIN_BG_CLASS: Record<RocketSkin, string> = {
  cyan: "bg-rocket-cyan",
  magenta: "bg-rocket-magenta",
  yellow: "bg-rocket-yellow",
  orange: "bg-rocket-orange",
  green: "bg-rocket-green",
  purple: "bg-rocket-purple",
  red: "bg-rocket-red",
  blue: "bg-rocket-blue",
};
