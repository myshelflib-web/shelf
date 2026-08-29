"use client";

import { normalizeTelegramBotUsername } from "@/lib/telegramLoginWidget";
import { createContext, ReactNode, useContext } from "react";

const TelegramBotUsernameContext = createContext("");

export function useTelegramBotUsername(): string {
  return useContext(TelegramBotUsernameContext);
}

export function TelegramAuthProvider({
  botUsername,
  children,
}: {
  botUsername: string;
  children: ReactNode;
}) {
  const value = normalizeTelegramBotUsername(botUsername) ?? "";
  return (
    <TelegramBotUsernameContext.Provider value={value}>
      {children}
    </TelegramBotUsernameContext.Provider>
  );
}
