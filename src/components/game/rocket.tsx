import { Rocket as RocketIcon } from "lucide-react";
import { SKIN_TEXT_CLASS, type RocketSkin } from "@/lib/game/skins";
import { cn } from "@/lib/utils";

type Props = {
  skin: RocketSkin;
  size?: number;
  className?: string;
};

export function Rocket({ skin, size = 48, className }: Props) {
  return (
    <RocketIcon
      size={size}
      strokeWidth={1.5}
      className={cn(SKIN_TEXT_CLASS[skin], className)}
      aria-label={`cohete ${skin}`}
    />
  );
}
