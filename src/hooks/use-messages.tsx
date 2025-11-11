import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Message } from '@/components/ui/MessagePage';

interface MessageContextType {
  messages: Message[];
  addMessage: (type: Message['type'], title: string, description?: string, persistent?: boolean) => string;
  markAsRead: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages from localStorage on mount
  React.useEffect(() => {
    const storedMessages = localStorage.getItem('app-messages');
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Failed to parse stored messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  React.useEffect(() => {
    localStorage.setItem('app-messages', JSON.stringify(messages));
  }, [messages]);

  const addMessage = useCallback((
    type: Message['type'],
    title: string,
    description?: string,
    persistent: boolean = false
  ): string => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: Message = {
      id,
      type,
      title,
      description,
      timestamp: new Date(),
      read: false,
      persistent,
    };

    setMessages(prev => [newMessage, ...prev]);
    return id;
  }, []);

  const markAsRead = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  const unreadCount = messages.filter(msg => !msg.read).length;

  const value: MessageContextType = {
    messages,
    addMessage,
    markAsRead,
    deleteMessage,
    clearAll,
    unreadCount,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

// Utility functions that match the toast API for easy replacement
export const addSuccessMessage = (title: string, description?: string, persistent?: boolean) => {
  const { addMessage } = useMessages();
  return addMessage('success', title, description, persistent);
};

export const addErrorMessage = (title: string, description?: string, persistent?: boolean) => {
  const { addMessage } = useMessages();
  return addMessage('error', title, description, persistent);
};

export const addWarningMessage = (title: string, description?: string, persistent?: boolean) => {
  const { addMessage } = useMessages();
  return addMessage('warning', title, description, persistent);
};

export const addInfoMessage = (title: string, description?: string, persistent?: boolean) => {
  const { addMessage } = useMessages();
  return addMessage('info', title, description, persistent);
};
