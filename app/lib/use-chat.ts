'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatMessage } from '@/app/lib/types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8080';

interface UseChatOptions {
  currentUsername: string;
  onMessage?: (msg: ChatMessage) => void;
}

export function useChat({ currentUsername, onMessage }: UseChatOptions) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!currentUsername) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        // Lắng nghe tin nhắn gửi đến mình
        client.subscribe(
          `/user/${currentUsername}/queue/messages`,
          (frame) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body);
              onMessage?.(msg);
            } catch {}
          }
        );
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [currentUsername]);

  const sendMessage = useCallback(
    (receiverUsername: string, content: string) => {
      if (!clientRef.current?.connected) return;
      clientRef.current.publish({
        destination: '/app/chat',
        body: JSON.stringify({
          senderUsername: currentUsername,
          receiverUsername,
          content,
        }),
      });
    },
    [currentUsername]
  );

  return { connected, sendMessage };
}
