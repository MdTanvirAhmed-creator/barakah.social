"use client";

import { ReactNode } from "react";
import { QueryClientProvider, ReactQueryDevtools } from "@/lib/cache";
import { queryClient } from "@/lib/cache";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
