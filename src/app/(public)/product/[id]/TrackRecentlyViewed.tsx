"use client";

import { useEffect } from "react";
import { trackRecentlyViewed, RecentlyViewedItem } from "@/lib/recently-viewed";

export default function TrackRecentlyViewed({ item }: { item: RecentlyViewedItem }) {
  useEffect(() => {
    trackRecentlyViewed(item);
  }, [item]);

  return null;
}
