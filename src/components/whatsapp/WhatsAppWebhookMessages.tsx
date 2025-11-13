import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MessageSquare, Phone, User, Filter, RefreshCw, Eye, AlertCircle, CheckCircle, XCircle, Reply, Send, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import apiService from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppWebhookMessage {
  id: number;
  webhookId: string;
  provider: string;
  businessAccountId: number;
  eventType: string;
  webhookUrl: string;
  messageId?: string;
  messageType?: string;
  messageContent?: string;
  messageStatus?: string;
  senderPhone?: string;
  recipientPhone?: string;
  mediaUrl?: string;
  mediaType?: string;
  signature?: string;
  processingStatus: string;
  errorMessage?: string;
  retryCount?: number;
  rawPayload?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

interface WhatsAppWebhookMessagesProps {
  businessAccountId?: number;
}

export const WhatsAppWebhookMessages: React.FC<WhatsAppWebhookMessagesProps> = ({
  businessAccountId
}) => {
  const [messages, setMessages] = useState<WhatsAppWebhookMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppWebhookMessage | null>(null);
  const [replyMessage, setReplyMessage] = useState<WhatsAppWebhookMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProvider, setFilterProvider] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let url = '/api/v1/whatsapp/webhook/messages';

      if (businessAccountId) {
        url += `?businessAccountId=${businessAccountId}`;
      }

      const response = await apiService.get(url);
      setMessages(response || []);
    } catch (error) {
      console.error('Failed to fetch webhook messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhook messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [businessAccountId]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      RECEIVED: { variant: 'secondary' as const, icon: Clock, label: 'Received' },
      PROCESSING: { variant: 'default' as const, icon: RefreshCw, label: 'Processing' },
      PROCESSED: { variant: 'default' as const, icon: CheckCircle, label: 'Processed' },
      FAILED: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' },
      RETRY: { variant: 'outline' as const, icon: AlertCircle, label: 'Retry' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.RECEIVED;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getProviderBadge = (provider: string) => {
    const providerColors = {
      META: 'bg-blue-100 text-blue-800',
      TWILIO: 'bg-red-100 text-red-800',
      '360DIALOG': 'bg-green-100 text-green-800',
      GUPSHUP: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={providerColors[provider as keyof typeof providerColors] || 'bg-gray-100 text-gray-800'}>
        {provider}
      </Badge>
    );
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'status':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesStatus = filterStatus === 'ALL' || message.processingStatus === filterStatus;
    const matchesProvider = filterProvider === 'ALL' || message.provider === filterProvider;
    const matchesSearch = searchTerm === '' ||
      message.messageContent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.senderPhone?.includes(searchTerm) ||
      message.recipientPhone?.includes(searchTerm) ||
      message.messageId?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesProvider && matchesSearch;
  });

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };

  const handleReply = (message: WhatsAppWebhookMessage) => {
    setReplyMessage(message);
    setReplyContent('');
  };

  const sendReply = async () => {
    if (!replyMessage || !replyContent.trim()) return;

    setSendingReply(true);
    try {
      // Find the business account ID for this message
      const accountId = replyMessage.businessAccountId || businessAccountId;

      if (!accountId) {
        toast({
          title: 'Error',
          description: 'Business account not found for reply',
          variant: 'destructive',
        });
        return;
      }

      // Send reply via API
      await apiService.post('/api/v1/whatsapp/send-reply', {
        businessAccountId: accountId,
        recipientPhone: replyMessage.senderPhone,
        message: replyContent.trim(),
        originalMessageId: replyMessage.messageId
      });

      toast({
        title: 'Success',
        description: 'Reply sent successfully',
      });

      setReplyMessage(null);
      setReplyContent('');
      fetchMessages(); // Refresh messages

    } catch (error) {
      console.error('Failed to send reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setSendingReply(false);
    }
  };

  const getMessageReadStatus = (message: WhatsAppWebhookMessage) => {
    // Check if this is an outgoing message (has recipientPhone but no senderPhone)
    if (message.recipientPhone && !message.senderPhone) {
      // Look for status updates for this message
      const statusUpdates = messages.filter(m =>
        m.eventType === 'status' &&
        m.messageId === message.messageId
      );

      if (statusUpdates.length > 0) {
        const latestStatus = statusUpdates.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        switch (latestStatus.messageStatus?.toLowerCase()) {
          case 'read':
            return { status: 'read', icon: CheckCircle, color: 'text-green-600', label: 'Read' };
          case 'delivered':
            return { status: 'delivered', icon: CheckCircle, color: 'text-blue-600', label: 'Delivered' };
          case 'sent':
            return { status: 'sent', icon: CheckCircle, color: 'text-gray-600', label: 'Sent' };
          default:
            return { status: 'unknown', icon: Clock, color: 'text-gray-400', label: 'Sending' };
        }
      }

      return { status: 'sending', icon: Clock, color: 'text-gray-400', label: 'Sending' };
    }

    return null; // Not an outgoing message
  };

  const isIncomingMessage = (message: WhatsAppWebhookMessage) => {
    return message.eventType === 'message' && message.senderPhone && message.messageContent;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            WhatsApp Webhook Messages
          </CardTitle>
          <CardDescription>
            Monitor and track all webhook messages received from WhatsApp providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search messages, phone numbers, or message IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PROCESSED">Processed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="RETRY">Retry</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Providers</SelectItem>
                <SelectItem value="META">Meta</SelectItem>
                <SelectItem value="TWILIO">Twilio</SelectItem>
                <SelectItem value="360DIALOG">360Dialog</SelectItem>
                <SelectItem value="GUPSHUP">GupShup</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchMessages} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Messages Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading webhook messages...
                    </TableCell>
                  </TableRow>
                ) : filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No webhook messages found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDateTime(message.createdAt)}
                      </TableCell>
                      <TableCell>
                        {getProviderBadge(message.provider)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(message.eventType)}
                          <span className="capitalize">{message.eventType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {message.senderPhone || message.recipientPhone || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-2">
                          <div className="truncate flex-1" title={message.messageContent}>
                            {truncateContent(message.messageContent || 'No content')}
                          </div>
                          {/* Message Read Status */}
                          {(() => {
                            const readStatus = getMessageReadStatus(message);
                            if (readStatus) {
                              const StatusIcon = readStatus.icon;
                              return (
                                <div className={`flex items-center gap-1 text-xs ${readStatus.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  <span className="hidden sm:inline">{readStatus.label}</span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(message.processingStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedMessage(message)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                          {/* Reply Button for Incoming Messages */}
                          {isIncomingMessage(message) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReply(message)}
                              title="Reply to message"
                            >
                              <Reply className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Message Details Dialog */}
          <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedMessage && getEventTypeIcon(selectedMessage.eventType)}
                  Webhook Message Details
                </DialogTitle>
                <DialogDescription>
                  Message ID: {selectedMessage?.webhookId}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                {selectedMessage && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Provider</label>
                        <div className="mt-1">{getProviderBadge(selectedMessage.provider)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Event Type</label>
                        <div className="mt-1 capitalize">{selectedMessage.eventType}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedMessage.processingStatus)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Created</label>
                        <div className="mt-1">{formatDateTime(selectedMessage.createdAt)}</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Message Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Message Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedMessage.messageId && (
                          <div>
                            <label className="text-sm font-medium">Message ID</label>
                            <div className="mt-1 font-mono text-sm">{selectedMessage.messageId}</div>
                          </div>
                        )}
                        {selectedMessage.messageType && (
                          <div>
                            <label className="text-sm font-medium">Message Type</label>
                            <div className="mt-1">{selectedMessage.messageType}</div>
                          </div>
                        )}
                        {selectedMessage.senderPhone && (
                          <div>
                            <label className="text-sm font-medium">Sender Phone</label>
                            <div className="mt-1 font-mono">{selectedMessage.senderPhone}</div>
                          </div>
                        )}
                        {selectedMessage.recipientPhone && (
                          <div>
                            <label className="text-sm font-medium">Recipient Phone</label>
                            <div className="mt-1 font-mono">{selectedMessage.recipientPhone}</div>
                          </div>
                        )}
                        {selectedMessage.messageStatus && (
                          <div>
                            <label className="text-sm font-medium">Message Status</label>
                            <div className="mt-1">{selectedMessage.messageStatus}</div>
                          </div>
                        )}
                        {selectedMessage.retryCount && selectedMessage.retryCount > 0 && (
                          <div>
                            <label className="text-sm font-medium">Retry Count</label>
                            <div className="mt-1">{selectedMessage.retryCount}</div>
                          </div>
                        )}
                      </div>

                      {selectedMessage.messageContent && (
                        <div>
                          <label className="text-sm font-medium">Content</label>
                          <div className="mt-2 p-3 bg-muted rounded-md whitespace-pre-wrap">
                            {selectedMessage.messageContent}
                          </div>
                        </div>
                      )}

                      {selectedMessage.mediaUrl && (
                        <div>
                          <label className="text-sm font-medium">Media</label>
                          <div className="mt-2">
                            <div className="text-sm text-muted-foreground">
                              Type: {selectedMessage.mediaType}
                            </div>
                            <a
                              href={selectedMessage.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Media
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedMessage.errorMessage && (
                        <div>
                          <label className="text-sm font-medium text-red-600">Error Message</label>
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                            {selectedMessage.errorMessage}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Raw Payload */}
                    {selectedMessage.rawPayload && (
                      <div>
                        <h4 className="font-medium mb-2">Raw Payload</h4>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                          {JSON.stringify(JSON.parse(selectedMessage.rawPayload), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{messages.length}</div>
                <div className="text-sm text-muted-foreground">Total Messages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {messages.filter(m => m.processingStatus === 'PROCESSED').length}
                </div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  {messages.filter(m => m.processingStatus === 'FAILED').length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {messages.filter(m => m.processingStatus === 'RECEIVED').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
          </div>

          {/* Reply Dialog */}
          <Dialog open={!!replyMessage} onOpenChange={() => setReplyMessage(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Reply className="w-5 h-5" />
                  Reply to Message
                </DialogTitle>
                <DialogDescription>
                  Replying to: {replyMessage?.senderPhone}
                </DialogDescription>
              </DialogHeader>

              {replyMessage && (
                <div className="space-y-4">
                  {/* Original Message Preview */}
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">Original message:</div>
                    <div className="text-sm">{replyMessage.messageContent}</div>
                  </div>

                  {/* Reply Input */}
                  <div>
                    <label className="text-sm font-medium">Your Reply</label>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply message..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setReplyMessage(null)}
                      disabled={sendingReply}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={sendReply}
                      disabled={!replyContent.trim() || sendingReply}
                    >
                      {sendingReply ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppWebhookMessages;
