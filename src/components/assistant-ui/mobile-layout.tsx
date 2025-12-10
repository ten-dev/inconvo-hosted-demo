"use client";

import type { ReactNode } from "react";

type MobileLayoutProps = {
  chatContent: ReactNode;
};

export function MobileLayout({ chatContent }: MobileLayoutProps) {
  return (
    <div className="aui-mobile-layout flex min-h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-hidden">{chatContent}</div>
    </div>
  );
}
