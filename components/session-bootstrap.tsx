"use client";

import { useEffect } from "react";
import { ensurePlayerSession } from "@/lib/atoms/session-init";
import { migrateLegacyStorage } from "@/lib/storage/migrate";

export function SessionBootstrap() {
  useEffect(() => {
    migrateLegacyStorage();
    void ensurePlayerSession();
  }, []);

  return null;
}
