"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Pastikan `QueryClient` hanya dibuat sekali setiap instance React dirender
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0, // Selalu refetch saat komponen mount — mencegah data lama terbawa antar session
        retry: 1,
        refetchOnWindowFocus: false, // Jangan refetch saat pindah tab agar tidak menganggu UX
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
