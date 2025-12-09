"use client";

import { useState, type ReactNode } from "react";
import { MessageSquare, Database } from "lucide-react";
import { cn } from "~/lib/utils";

type MobileTab = "chat" | "data";

type MobileLayoutProps = {
  chatContent: ReactNode;
  dataContent: ReactNode;
};

export function MobileLayout({ chatContent, dataContent }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("chat");

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? chatContent : dataContent}
      </div>

      <nav className="flex border-t bg-background safe-area-pb">
        <TabButton
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
          icon={<MessageSquare className="size-4" />}
          label="Chat"
        />
        <TabButton
          active={activeTab === "data"}
          onClick={() => setActiveTab("data")}
          icon={<Database className="size-4" />}
          label="Data"
        />
      </nav>
    </div>
  );
}

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
};

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
