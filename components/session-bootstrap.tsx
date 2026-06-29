"use client";

import { useEffect } from "react";
import { useStore } from "jotai";
import { ensurePlayerSession } from "@/lib/atoms/session-init";
import { migrateLegacyStorage } from "@/lib/storage/migrate";

export function SessionBootstrap() {
  const store = useStore();

  useEffect(() => {
    migrateLegacyStorage();
    void ensurePlayerSession(store);
  }, [store]);

  return null;
}
