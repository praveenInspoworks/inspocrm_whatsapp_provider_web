import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Copy, CheckCircle, XCircle, Send, Clock, Eye, RefreshCw, Key, MessageSquare, Users, Calendar, Info } from 'lucide-react';
import { post, get } from '@/services/apiService';

interface ApiToken {
  token: string;
  expiresInHours: number;
  generatedAt: string;
}

interface MessageResponse {
  messageId: string;
  timestamp: string;
  status: string;
}

interface BulkMessageResponse {
  results: Record<string, string>;
  timestamp: string;
  successCount: number;
  failureCount: number;
  invalidNumbers: string[];
}

interface AccountInfo {
  accountInfo: any;
  timestamp: string;
}

interface MessageStatus {
  messageId: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
}

const WhatsAppTokenManager: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('token');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState<ApiToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Send Message states
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [sendResponse, setSendResponse] = useState<MessageResponse | null>(null);

  // Bulk Message states
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkTemplateId, setBulkTemplateId] = useState('');
  const [bulkResponse, setBulkResponse] = useState<BulkMessageResponse | null>(null);

  // Schedule Message states
  const [schedulePhone, setSchedulePhone] = useState('');
  const [scheduleMessageContent, setScheduleMessageContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [scheduleResponse, setScheduleResponse] = useState<any>(null);

  // Status Check states
  const [messageId, setMessageId] = useState('');
  const [statusResponse, setStatusResponse] = useState<MessageStatus | null>(null);

  // Account Info states
  const [accountResponse, setAccountResponse] = useState<AccountInfo | null>(null);

  // Test History
  const [testHistory, setTestHistory] = useState<Array<{
    id: string;
    type: string;
    timestamp: string;
    status: 'success' | 'error';
    details: any;
  }>>([]);

  // API Base URL
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.inspoworks.com';

  // Generate API Token
  const generateToken = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const data = await post('/api/public/whatsapp/token', { email: email.trim() });

      if (data.success) {
        setApiToken(data.data);
        toast.success('API Token generated successfully!');
        addToHistory('token_generation', 'success', data.data);
      } else {
        toast.error(data.message || 'Failed to generate token');
        addToHistory('token_generation', 'error', data.message);
      }
    } catch (error: any) {
      console.error('Token generation error:', error);
      toast.error(error.message || 'Network error occurred');
      addToHistory('token_generation', 'error', error.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Send Single Message
  const sendMessage = async () => {
    if (!apiToken) {
      toast.error('Please generate an API token first');
      return;
    }

    if (!recipientPhone.trim()) {
      toast.error('Please enter recipient phone number');
      return;
    }

    if (!message.trim() && !templateId.trim() && !templateContent.trim()) {
      toast.error('Please enter a message, template ID, or template content');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody: any = {
        token: apiToken.token,
        phoneNumber: recipientPhone.trim(),
      };

      if (message.trim()) requestBody.message = message.trim();
      if (templateId.trim()) requestBody.templateId = templateId.trim();
      if (templateContent.trim()) requestBody.templateContent = templateContent.trim();
      if (Object.keys(templateVariables).length > 0) requestBody.templateVariables = templateVariables;

      const data = await post('/api/public/whatsapp/send', requestBody);

      if (data.success) {
        setSendResponse(data.data);
        toast.success('Message sent successfully!');
        addToHistory('send_message', 'success', data.data);
      } else {
        toast.error(data.message || 'Failed to send message');
        addToHistory('send_message', 'error', data.message);
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(error.message || 'Network error occurred');
      addToHistory('send_message', 'error', error.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Send Bulk Messages
  const sendBulkMessages = async () => {
    if (!apiToken) {
      toast.error('Please generate an API token first');
      return;
    }

    const phones = bulkPhones.split('\n').map(p => p.trim()).filter(p => p);
    if (phones.length === 0) {
      toast.error('Please enter at least one phone number');
      return;
    }

    if (!bulkMessage.trim() && !bulkTemplateId.trim()) {
      toast.error('Please enter a message or template ID');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody: any = {
        token: apiToken.token,
        phoneNumbers: phones,
      };

      if (bulkMessage.trim()) requestBody.message = bulkMessage.trim();
      if (bulkTemplateId.trim()) requestBody.templateId = bulkTemplateId.trim();

      const data = await post('/api/public/whatsapp/send-bulk', requestBody);

      if (data.success) {
        setBulkResponse(data.data);
        toast.success(`Bulk messages sent! ${data.data.successCount} success, ${data.data.failureCount} failed`);
        addToHistory('bulk_message', 'success', data.data);
      } else {
        toast.error(data.message || 'Failed to send bulk messages');
        addToHistory('bulk_message', 'error', data.message);
      }
    } catch (error: any) {
      console.error('Bulk send error:', error);
      toast.error(error.message || 'Network error occurred');
      addToHistory('bulk_message', 'error', error.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule Message
  const scheduleMessage = async () => {
    if (!apiToken) {
      toast.error('Please generate an API token first');
      return;
    }

    if (!schedulePhone.trim()) {
      toast.error('Please enter recipient phone number');
      return;
    }

    if (!scheduleMessageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!scheduledTime) {
      toast.error('Please select a scheduled time');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        token: apiToken.token,
        phoneNumber: schedulePhone.trim(),
        message: scheduleMessageContent.trim(),
        scheduledTime: new Date(scheduledTime).toISOString(),
        timezone: timezone,
      };

      const data = await post('/api/public/whatsapp/schedule', requestBody);

      if (data.success) {
        setScheduleResponse(data.data);
        toast.success('Message scheduled successfully!');
        addToHistory('schedule_message', 'success', data.data);
      } else {
        toast.error(data.message || 'Failed to schedule message');
        addToHistory('schedule_message', 'error', data.message);
      }
    } catch (error: any) {
      console.error('Schedule message error:', error);
      toast.error(error.message || 'Network error occurred');
      addToHistory('schedule_message', 'error', error.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Check Message Status
  const checkMessageStatus = async () => {
    if (!apiToken) {
      toast.error('Please generate an API token first');
      return;
    }

    if (!messageId.trim()) {
      toast.error('Please enter a message ID');
      return;
    }

    setIsLoading(true);
    try {
      const data = await get(`/api/public/whatsapp/status/${messageId.trim()}?token=${apiToken.token}`);

      if (data.success) {
        setStatusResponse(data.data);
        toast.success('Message status retrieved!');
        addToHistory('check_status', 'success', data.data);
      } else {
        toast.error(data.message || 'Failed to get message status');
        addToHistory('check_status', 'error', data.message);
      }
    } catch (error: any) {
      console.error('Status check error:', error);
      toast.error(error.message || 'Network error occurred');
      addToHistory('check_status', 'error', error.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get Account Info
  const getAccountInfo = async () => {
    if (!apiToken) {
      toast.error('Please generate an API token first');
      return;
    }

    setIsLoading(true);
    try {
      const data = await get(`/api/public/whatsapp/account?token=${apiToken.token}`);

      if (data.success) {
        setAccountResponse(data.data);
        toast.success('Account info retrieved!');
        addToHistory('account_info', 'success', data.data);
      } else {
        toast.error(data.message || 'Failed to get account info');
        addToHistory('account_info', 'error', data.message);
      }
    } catch (error: any) {
      console.error('Account info error:', error);
      toast.error(error.message || 'Network error occurred');
      addToHistory('account_info', 'error', error.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Add to test history
  const addToHistory = (type: string, status: 'success' | 'error', details: any) => {
    const historyItem = {
      id: Date.now().toString(),
      type,
      timestamp: new Date().toISOString(),
      status,
      details,
    };
    setTestHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10 items
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp API Token Manager</h1>
          <p className="text-muted-foreground mt-2">
            Generate and test WhatsApp API tokens for your business account
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Key className="w-4 h-4 mr-1" />
          API Manager
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="token">Token</TabsTrigger>
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="bulk">Bulk</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Token Generation Tab */}
        <TabsContent value="token" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Generate API Token
              </CardTitle>
              <CardDescription>
                Generate a new API token using your admin email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={generateToken}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Generate Token
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {apiToken && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Token Generated Successfully!</p>
                      <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">
                        {apiToken.token}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Expires in: {apiToken.expiresInHours} hours</span>
                        <span>Generated: {formatTimestamp(apiToken.generatedAt)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(apiToken.token)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Message Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Send WhatsApp Message
              </CardTitle>
              <CardDescription>
                Send a single WhatsApp message using your API token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Phone</Label>
                  <Input
                    id="recipient"
                    placeholder="+1234567890"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateId">Template ID (Optional)</Label>
                  <Input
                    id="templateId"
                    placeholder="template_123"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateContent">Template Content (Optional)</Label>
                <Textarea
                  id="templateContent"
                  placeholder="Hello {{name}}, your order {{order_id}} is ready!"
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={sendMessage}
                disabled={isLoading || !apiToken}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>

              {sendResponse && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Message Sent Successfully!</p>
                      <p className="text-sm">Message ID: {sendResponse.messageId}</p>
                      <p className="text-sm">Status: {sendResponse.status}</p>
                      <p className="text-sm text-muted-foreground">
                        Sent at: {formatTimestamp(sendResponse.timestamp)}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Messages Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Send Bulk WhatsApp Messages
              </CardTitle>
              <CardDescription>
                Send messages to multiple recipients at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkPhones">Phone Numbers (one per line)</Label>
                  <Textarea
                    id="bulkPhones"
                    placeholder="+1234567890&#10;+0987654321&#10;+1122334455"
                    value={bulkPhones}
                    onChange={(e) => setBulkPhones(e.target.value)}
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkTemplateId">Template ID (Optional)</Label>
                  <Input
                    id="bulkTemplateId"
                    placeholder="template_123"
                    value={bulkTemplateId}
                    onChange={(e) => setBulkTemplateId(e.target.value)}
                  />
                  <Label htmlFor="bulkMessage" className="mt-4 block">Message Content</Label>
                  <Textarea
                    id="bulkMessage"
                    placeholder="Enter your bulk message here..."
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    rows={8}
                  />
                </div>
              </div>

              <Button
                onClick={sendBulkMessages}
                disabled={isLoading || !apiToken}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending Bulk Messages...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Send Bulk Messages
                  </>
                )}
              </Button>

              {bulkResponse && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Bulk Messages Sent!</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>Success: {bulkResponse.successCount}</p>
                          <p>Failed: {bulkResponse.failureCount}</p>
                        </div>
                        <div>
                          <p>Invalid Numbers: {bulkResponse.invalidNumbers.length}</p>
                          <p className="text-muted-foreground">
                            Sent at: {formatTimestamp(bulkResponse.timestamp)}
                          </p>
                        </div>
                      </div>
                      {bulkResponse.invalidNumbers.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Invalid Numbers:</p>
                          <p className="text-sm text-muted-foreground">
                            {bulkResponse.invalidNumbers.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Message Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule WhatsApp Message
              </CardTitle>
              <CardDescription>
                Schedule a message to be sent at a specific time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedulePhone">Recipient Phone</Label>
                  <Input
                    id="schedulePhone"
                    placeholder="+1234567890"
                    value={schedulePhone}
                    onChange={(e) => setSchedulePhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleMessage">Message Content</Label>
                <Textarea
                  id="scheduleMessage"
                  placeholder="Enter your scheduled message here..."
                  value={scheduleMessageContent}
                  onChange={(e) => setScheduleMessageContent(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={scheduleMessage}
                disabled={isLoading || !apiToken}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Message
                  </>
                )}
              </Button>

              {scheduleResponse && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Message Scheduled Successfully!</p>
                      <p className="text-sm">Job ID: {scheduleResponse.jobId}</p>
                      <p className="text-sm">Scheduled for: {formatTimestamp(scheduleResponse.scheduledTime)}</p>
                      <p className="text-sm">Timezone: {scheduleResponse.timezone}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Check Message Status
              </CardTitle>
              <CardDescription>
                Check the delivery status of a sent message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="messageId">Message ID</Label>
                  <Input
                    id="messageId"
                    placeholder="Enter message ID"
                    value={messageId}
                    onChange={(e) => setMessageId(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={checkMessageStatus}
                    disabled={isLoading || !apiToken}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Check Status
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {statusResponse && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Message Status</p>
                      <p className="text-sm">Message ID: {statusResponse.messageId}</p>
                      <p className="text-sm">Status: <Badge variant={statusResponse.status === 'DELIVERED' ? 'default' : 'secondary'}>{statusResponse.status}</Badge></p>
                      {statusResponse.sentAt && (
                        <p className="text-sm">Sent at: {formatTimestamp(statusResponse.sentAt)}</p>
                      )}
                      {statusResponse.deliveredAt && (
                        <p className="text-sm">Delivered at: {formatTimestamp(statusResponse.deliveredAt)}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Info Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Account Information
              </CardTitle>
              <CardDescription>
                Get detailed information about your WhatsApp business account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={getAccountInfo}
                disabled={isLoading || !apiToken}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading Account Info...
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4 mr-2" />
                    Get Account Information
                  </>
                )}
              </Button>

              {accountResponse && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Account Information Retrieved</p>
                      <div className="bg-muted p-4 rounded-md">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(accountResponse.accountInfo, null, 2)}
                        </pre>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Retrieved at: {formatTimestamp(accountResponse.timestamp)}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Test History
              </CardTitle>
              <CardDescription>
                View your recent API test activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium capitalize">
                          {item.type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
                            {item.status === 'success' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTimestamp(item.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Test Details</DialogTitle>
                                <DialogDescription>
                                  {item.type.replace('_', ' ')} - {item.status}
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-96">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {JSON.stringify(item.details, null, 2)}
                                </pre>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {testHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No test history yet</p>
                    <p className="text-sm">Start testing your WhatsApp API to see history here</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Complete guide for using the WhatsApp Public API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Base URL</h4>
              <code className="bg-muted px-2 py-1 rounded text-sm">
                {API_BASE}/api/public/whatsapp
              </code>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Authentication</h4>
                <ul className="text-sm space-y-1">
                  <li>• All endpoints require an API token</li>
                  <li>• Token generated using admin email</li>
                  <li>• Token expires in 7 days (168 hours)</li>
                  <li>• Include token in request body or query params</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Rate Limits</h4>
                <ul className="text-sm space-y-1">
                  <li>• 1000 messages per hour per account</li>
                  <li>• 100 bulk operations per hour</li>
                  <li>• Token generation: 5 per hour per email</li>
                  <li>• Status checks: Unlimited</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Available Endpoints</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">POST /token</p>
                  <p className="text-muted-foreground">Generate API token</p>
                </div>
                <div>
                  <p className="font-medium">POST /send</p>
                  <p className="text-muted-foreground">Send single message</p>
                </div>
                <div>
                  <p className="font-medium">POST /send-bulk</p>
                  <p className="text-muted-foreground">Send bulk messages</p>
                </div>
                <div>
                  <p className="font-medium">POST /schedule</p>
                  <p className="text-muted-foreground">Schedule message</p>
                </div>
                <div>
                  <p className="font-medium">GET /status/{'{messageId}'}</p>
                  <p className="text-muted-foreground">Check message status</p>
                </div>
                <div>
                  <p className="font-medium">GET /account</p>
                  <p className="text-muted-foreground">Get account info</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Phone Number Format</h4>
              <ul className="text-sm space-y-1">
                <li>• Must start with + (plus sign)</li>
                <li>• Include country code (e.g., +1 for US, +91 for India)</li>
                <li>• No spaces, dashes, or parentheses</li>
                <li>• Example: +1234567890</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTokenManager;
