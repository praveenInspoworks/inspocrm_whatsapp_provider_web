import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, Search, Phone, Bot, User, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { get } from '@/services/apiService';

interface WhatsAppConversation {
  id: number;
  tenantId: string;
  accountId: number;
  contactPhone: string;
  whatsappMessageId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'LOCATION' | 'CONTACT';
  content: string;
  replyToMessageId?: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  isAutoReply: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConversationSummary {
  contactPhone: string;
  contactName?: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  autoReplyCount: number;
  humanReplyCount: number;
  unreadCount: number;
}

const WhatsAppConversations: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'auto_reply'>('all');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await get('/api/v1/whatsapp/conversations/summary');
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (phoneNumber: string) => {
    try {
      setMessagesLoading(true);
      const data = await get(`/api/whatsapp/auto-reply/conversations/${phoneNumber}`);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error loading conversation messages');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contactPhone.includes(searchTerm) ||
                         (conv.contactName && conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()));

    switch (filter) {
      case 'unread':
        return matchesSearch && conv.unreadCount > 0;
      case 'auto_reply':
        return matchesSearch && conv.autoReplyCount > 0;
      default:
        return matchesSearch;
    }
  });

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return '🖼️';
      case 'DOCUMENT': return '📄';
      case 'AUDIO': return '🎵';
      case 'VIDEO': return '🎥';
      case 'LOCATION': return '📍';
      case 'CONTACT': return '👤';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-600';
      case 'READ': return 'text-blue-600';
      case 'SENT': return 'text-yellow-600';
      case 'FAILED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Conversations</h1>
          <p className="text-muted-foreground">
            View and manage customer conversations with AI auto-replies
          </p>
        </div>
        <Button onClick={loadConversations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="auto_reply">AI Replies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-1">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.contactPhone}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                        selectedConversation === conv.contactPhone
                          ? 'border-l-blue-500 bg-blue-50'
                          : 'border-l-transparent'
                      }`}
                      onClick={() => setSelectedConversation(conv.contactPhone)}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            <Phone className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {conv.contactName || conv.contactPhone}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conv.lastMessage}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {conv.messageCount} msgs
                            </Badge>
                            {conv.autoReplyCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                {conv.autoReplyCount}
                              </Badge>
                            )}
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conv.unreadCount} new
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                {selectedConversation ? (
                  <>
                    Conversation with {selectedConversation}
                    {conversations.find(c => c.contactPhone === selectedConversation)?.contactName && (
                      <span className="text-muted-foreground ml-2">
                        ({conversations.find(c => c.contactPhone === selectedConversation)?.contactName})
                      </span>
                    )}
                  </>
                ) : (
                  'Select a conversation'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedConversation ? (
                messagesLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.direction === 'OUTBOUND'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {message.direction === 'OUTBOUND' ? (
                                <Send className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              {message.isAutoReply && (
                                <Bot className="h-3 w-3 text-yellow-500" />
                              )}
                              <span className="text-xs opacity-75">
                                {formatMessageTime(message.createdAt)}
                              </span>
                              <span className={`text-xs ${getStatusColor(message.status)}`}>
                                {message.status.toLowerCase()}
                              </span>
                            </div>
                            <div className="text-sm">
                              {getMessageIcon(message.messageType)}
                              {message.content || `[${message.messageType.toLowerCase()}]`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Conversation Selected</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conversation Stats */}
      {selectedConversation && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(() => {
            const conv = conversations.find(c => c.contactPhone === selectedConversation);
            if (!conv) return null;

            return (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{conv.messageCount}</p>
                        <p className="text-xs text-muted-foreground">Total Messages</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{conv.autoReplyCount}</p>
                        <p className="text-xs text-muted-foreground">AI Replies</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{conv.humanReplyCount}</p>
                        <p className="text-xs text-muted-foreground">Human Replies</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${conv.unreadCount > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                      <div>
                        <p className="text-2xl font-bold">{conv.unreadCount}</p>
                        <p className="text-xs text-muted-foreground">Unread</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default WhatsAppConversations;
