import React, { createContext, useState, useEffect, useRef, ReactNode, useContext } from 'react';
import { logger } from '../utils/logger';

interface WebSocketContextValue {
  socket: WebSocket | null;
  connectionState: string;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }): JSX.Element {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [subscribedRooms, setSubscribedRooms] = useState<Set<string>>(new Set());
  const [pendingRooms, setPendingRooms] = useState<Set<string>>(new Set());
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const joinRoom = (roomId: string): void => {
    try {
      if (socket && connectionState === 'connected') {
        socket.send(JSON.stringify({ type: 'join', roomId }));
        setSubscribedRooms(prev => new Set(prev).add(roomId));
        logger.info(`Joined room ${roomId} at ${new Date().toISOString()}`);
      } else {
        setPendingRooms(prev => new Set(prev).add(roomId));
      }
    } catch (error: any) {
      logger.error(`Failed to join room ${roomId}: ${error.message}`);
      setPendingRooms(prev => new Set(prev).add(roomId));
    }
  };

  const leaveRoom = (roomId: string): void => {
    if (!subscribedRooms.has(roomId)) {
      logger.warn(`Attempted to leave room ${roomId} but not subscribed`);
      return;
    }
    try {
      if (socket && connectionState === 'connected') {
        socket.send(JSON.stringify({ type: 'leave', roomId }));
      }
    } catch (error: any) {
      logger.error(`Failed to leave room ${roomId}: ${error.message}`);
    }
    setSubscribedRooms(prev => {
      const newSet = new Set(prev);
      newSet.delete(roomId);
      return newSet;
    });
    setPendingRooms(prev => {
      const newSet = new Set(prev);
      newSet.delete(roomId);
      return newSet;
    });
    logger.info(`Left room ${roomId} at ${new Date().toISOString()}`);
  };

  useEffect(() => {
    const connectSocket = () => {
      const ws = new WebSocket(process.env.REACT_APP_WS_URL || '');
      
      ws.onopen = () => {
        setConnectionState('connected');
        reconnectAttempts.current = 0;
        pendingRooms.forEach(roomId => {
          try {
            ws.send(JSON.stringify({ type: 'join', roomId }));
            setSubscribedRooms(prev => new Set(prev).add(roomId));
          } catch (error: any) {
            logger.error(`Failed to resubscribe to room ${roomId}: ${error.message}`);
          }
        });
        setPendingRooms(new Set());
      };

      ws.onclose = () => {
        setConnectionState('disconnected');
        setPendingRooms(subscribedRooms);
        if (reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectSocket();
          }, delay);
        }
      };

      ws.onerror = (error: Event) => {
        setConnectionState('error');
        logger.error(`WebSocket error at ${new Date().toISOString()}: ${error.type}`);
        setTimeout(() => {
          if (reconnectAttempts.current < 5) {
            reconnectAttempts.current++;
            connectSocket();
          }
        }, 5000);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          window.dispatchEvent(new CustomEvent('ws-message', { detail: payload }));
        } catch (error: any) {
          logger.error(`Failed to parse WebSocket message: ${error.message}`);
        }
      };

      setSocket(ws);
    };

    connectSocket();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (socket) {
        socket.close();
      }
      setSubscribedRooms(new Set());
    };
  }, []);

  const contextValue: WebSocketContextValue = {
    socket,
    connectionState,
    joinRoom,
    leaveRoom
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}