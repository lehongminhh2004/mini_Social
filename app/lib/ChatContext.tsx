'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  activeChatUser: string | null;
  setActiveChatUser: (username: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ activeChatUser, setActiveChatUser }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useGlobalChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useGlobalChat must be used within a ChatProvider');
  }
  return context;
}