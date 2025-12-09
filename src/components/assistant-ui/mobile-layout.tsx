"use client";

import type { ReactNode } from "react";

type MobileLayoutProps = {
  chatContent: ReactNode;
};

export function MobileLayout({ chatContent }: MobileLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">{chatContent}</div>
    </div>
  );
}
