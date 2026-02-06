"use client"

import type React from "react"

import { Providers as QueryProviders } from "@/lib/providers"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProviders>
      {children}
      <Toaster />
    </QueryProviders>
  )
}
