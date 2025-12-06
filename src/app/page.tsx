import Image from "next/image";

import { Assistant } from "./assistant";

export default function HomePage() {
  return (
    <Assistant>
      <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center transition-colors">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
          todo.
        </div>
      </main>
    </Assistant>
  );
}
