"use client";

import { useState } from "react";
import { StoryBar } from "@/components/stories/story-bar";
import { ProductGrid } from "@/components/products/product-grid";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";

const CATEGORIES = ["Tout", "Tech", "Mode", "Maison", "Jeux", "Sport"];

export default function HomePage() {
  const [category, setCategory] = useState("Tout");
  const { userId } = useCurrentUser();

  return (
    <div className="space-y-6">
      <StoryBar />

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              category === cat ? "bg-white text-ink" : "glass text-white/70",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <ProductGrid category={category === "Tout" ? undefined : category} currentUserId={userId ?? undefined} />
    </div>
  );
}
