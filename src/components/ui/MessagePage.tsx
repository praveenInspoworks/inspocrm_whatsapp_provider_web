import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Info, X, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

export interface Message {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
}

interface MessagePageProps {
  messages?: Message[];
  onMarkAsRead?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onClearAll?: () => void;
}

const MessagePage: React.FC<MessagePageProps> = ({
  messages: propMessages,
  onMarkAsRead,
  onDeleteMessage,
  onClearAll,
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(propMessages || []);

  // Load messages from localStorage if not provided via props
  useEffect(() => {
    if (!propMessages) {
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
    }
  }, [propMessages]);

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMessageBadgeVariant = (type: Message['type']) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleMarkAsRead = (messageId: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(messageId);
    } else {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      // Update localStorage
      const updatedMessages = messages.map(msg =>
        msg.id === messageId ? { ...msg, read: true } : msg
      );
      localStorage.setItem('app-messages', JSON.stringify(updatedMessages));
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      // Update localStorage
      const filteredMessages = messages.filter(msg => msg.id !== messageId);
      localStorage.setItem('app-messages', JSON.stringify(filteredMessages));
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      setMessages([]);
      localStorage.removeItem('app-messages');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  const unreadCount = messages.filter(msg => !msg.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">
                  {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
                <p className="text-gray-500">You don't have any messages yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`transition-all duration-200 ${
                  !message.read ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getMessageIcon(message.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`font-medium ${!message.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {message.title}
                            </h3>
                            <Badge variant={getMessageBadgeVariant(message.type)} className="text-xs">
                              {message.type}
                            </Badge>
                            {!message.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>

                          {message.description && (
                            <p className={`text-sm mb-3 ${!message.read ? 'text-gray-700' : 'text-gray-600'}`}>
                              {message.description}
                            </p>
                          )}

                          <p className="text-xs text-gray-500">
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!message.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(message.id)}
                              className="text-xs"
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagePage;
