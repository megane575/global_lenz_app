import type { HTMLAttributes, ReactNode } from "react";

export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** ○ / あり（薄い青＋濃いブランド青） */
  variant: "positive" | "negative";
  /** symbol: ○・×　word: あり・なし */
  display?: "symbol" | "word";
  children?: ReactNode;
};

/**
 * アイボリー背景上で浮かないよう、パステル調のトーンに寄せた配色。
 */
const variantClass: Record<"positive" | "negative", string> = {
  positive:
    "border border-brand-accent-secondary/25 bg-brand-accent-softer text-brand-accent-secondary-deep",
  negative:
    "border border-brand-border bg-brand-accent-softer/60 text-brand-muted",
};

function defaultContent(
  variant: BadgeProps["variant"],
  display: NonNullable<BadgeProps["display"]>,
): ReactNode {
  if (display === "word") {
    return variant === "positive" ? "あり" : "なし";
  }
  return variant === "positive" ? "○" : "×";
}

/**
 * カプセル型の汎用バッジ。ネタ帳の保存状態などに利用。
 */
export function Badge({
  variant,
  display = "symbol",
  children,
  className = "",
  "aria-label": ariaLabel,
  ...props
}: BadgeProps) {
  const content = children ?? defaultContent(variant, display);
  const implicitAriaLabel =
    display === "symbol" && ariaLabel === undefined
      ? variant === "positive"
        ? "あり"
        : "なし"
      : undefined;

  return (
    <span
      {...props}
      aria-label={ariaLabel ?? implicitAriaLabel}
      className={`inline-flex min-h-[1.5rem] shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium leading-none tracking-tight ${variantClass[variant]} ${className}`}
    >
      {content}
    </span>
  );
}
