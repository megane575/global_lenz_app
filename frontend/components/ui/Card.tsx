import type { ElementType, ReactNode } from "react";

export type CardProps = {
  children: ReactNode;
  className?: string;
  /** セマンティクス用。既定は div */
  as?: ElementType;
};

/**
 * 共通のカード容器。背景は白（brand-surface）、角丸 2xl、薄い影と枠線。
 */
export function Card({ children, className = "", as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={`rounded-3xl border border-brand-border bg-brand-surface shadow-soft ${className}`}
    >
      {children}
    </Tag>
  );
}
