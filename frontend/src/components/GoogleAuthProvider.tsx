"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { createContext, ReactNode, useContext } from "react";

const GoogleClientIdContext = createContext("");

export function useGoogleClientId(): string {
  return useContext(GoogleClientIdContext);
}

export function GoogleAuthProvider({
  clientId,
  children,
}: {
  clientId: string;
  children: ReactNode;
}) {
  const value = clientId.trim();

  if (!value || value.includes("your-google-client-id")) {
    return (
      <GoogleClientIdContext.Provider value="">
        {children}
      </GoogleClientIdContext.Provider>
    );
  }

  return (
    <GoogleClientIdContext.Provider value={value}>
      <GoogleOAuthProvider clientId={value}>{children}</GoogleOAuthProvider>
    </GoogleClientIdContext.Provider>
  );
}
