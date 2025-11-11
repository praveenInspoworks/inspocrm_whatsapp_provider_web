import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';
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
}

interface MessageCenterProps {
  messages: Message[];
  onMarkAsRead: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onClearAll: () => void;
}

const MessageCenter: React.FC<MessageCenterProps> = ({
  messages,
  onMarkAsRead,
  onDeleteMessage,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'success' | 'error' | 'warning' | 'info'>('all');

  const getFilteredMessages = () => {
    if (filter === 'all') return messages;
    if (filter === 'unread') return messages.filter(msg => !msg.read);
    return messages.filter(msg => msg.type === filter);
  };

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
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
    }
  };

  const unreadCount = messages.filter(msg => !msg.read).length;
  const filteredMessages = getFilteredMessages();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Message Center
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              disabled={messages.length === 0}
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: `Unread (${unreadCount})` },
              { key: 'success', label: 'Success' },
              { key: 'error', label: 'Error' },
              { key: 'warning', label: 'Warning' },
              { key: 'info', label: 'Info' },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(key as any)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Messages List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages found
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    message.read ? 'bg-muted/50' : 'bg-background'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getMessageIcon(message.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${!message.read ? 'font-semibold' : ''}`}>
                          {message.title}
                        </h4>
                        {message.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {message.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(message.timestamp, 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant={getMessageBadgeVariant(message.type)}>
                          {message.type}
                        </Badge>

                        {!message.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkAsRead(message.id)}
                          >
                            Mark Read
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageCenter;
