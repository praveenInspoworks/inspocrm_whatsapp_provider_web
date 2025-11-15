import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Key, Copy, CheckCircle, MessageSquare, Webhook, Code,
  Play, Send, Eye, User, Globe, Zap, Smartphone, Database,
  AlertTriangle, Code2, Terminal, Settings, TestTube, Clock, XCircle
} from 'lucide-react';
import { post, get } from '@/services/apiService';

interface ApiToken {
  token: string;
  expiresInHours: number;
  generatedAt: string;
}

interface ApiResponse {
  token: string;
  expiresInHours: number;
  generatedAt: string;
}

interface MessageRequest {
  token: string;
  phoneNumber: string;
  message: string;
}

interface MessageResponse {
  messageId: string;
  timestamp: string;
  status: string;
}

interface WebhookConfig {
  url: string;
  platform: string;
  isConfigured: boolean;
  lastTested?: string;
  testStatus?: 'success' | 'failed' | null;
}

export function WhatsAppApiGuide() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('get-token');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<ApiToken | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  // Test message states
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello, World!');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageResult, setMessageResult] = useState<MessageResponse | null>(null);

  // Webhook configuration states
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookPlatform, setWebhookPlatform] = useState('custom');
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);

  // Copy functionality
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // Will be set by business setup process when account credentials are validated

  const copyToClipboard = async (text: string, itemKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemKey]));
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the text",
        variant: "destructive",
      });
    }
  };

  const generateApiToken = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setTokenLoading(true);
    try {
      const response = await post('/api/inspo-crm/whatsapp/token', { email: email.trim() });
      if (response && response.data) {
        setToken(response.data);
        toast({
          title: "Token generated!",
          description: "Your API token is ready to use",
        });
      } else {
        throw new Error('Token generation failed');
      }
    } catch (error: any) {
      console.error('Token generation error:', error);
      toast({
        title: "Token generation failed",
        description: error.response?.data?.message || error.message || "Please check your email and try again",
        variant: "destructive",
      });
    } finally {
      setTokenLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!token) {
      toast({
        title: "Token required",
        description: "Please generate an API token first",
        variant: "destructive",
      });
      return;
    }

    if (!testPhone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    if (!testMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const requestPayload = {
        token: token.token,
        phoneNumber: testPhone.trim(),
        message: testMessage.trim()
      };

      const response = await post('/api/inspo-crm/whatsapp/send', requestPayload);

      if (response && response.data) {
        setMessageResult(response.data);
        setShowWebhookConfig(true);
        toast({
          title: "Message sent!",
          description: "Your test message has been sent successfully. Now configure your webhook!",
        });
      } else {
        throw new Error('Message sending failed');
      }
    } catch (error: any) {
      console.error('Message send error:', error);
      toast({
        title: "Message failed",
        description: error.response?.data?.message || error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const configureWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Webhook URL required",
        description: "Please enter your webhook URL",
        variant: "destructive",
      });
      return;
    }

    if (!webhookUrl.startsWith('http')) {
      toast({
        title: "Invalid URL format",
        description: "Webhook URL must start with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setWebhookConfig({
      url: webhookUrl.trim(),
      platform: webhookPlatform,
      isConfigured: false,
      testStatus: null
    });

    toast({
      title: "Webhook URL saved",
      description: "Now test your webhook configuration",
    });
    setShowWebhookConfig(true);
  };

  const testWebhook = async () => {
    if (!webhookConfig || !webhookConfig.url || !messageResult) {
      toast({
        title: "Configuration required",
        description: "Please configure your webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setTestingWebhook(true);
    try {
      // Test the webhook by calling the status API and sending data to the webhook URL
      const statusResponse = await get(`/api/inspo-crm/whatsapp/status/${messageResult.messageId}?token=${token.token}`);

      if (statusResponse && statusResponse.data) {
        // Send status data to the configured webhook
        const webhookPayload = {
          eventType: 'MESSAGE_STATUS_UPDATE',
          messageId: messageResult.messageId,
          status: statusResponse.data.status,
          timestamp: new Date().toISOString(),
          platform: webhookConfig.platform
        };

        try {
          const webhookResponse = await fetch(webhookConfig.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
          });

          if (webhookResponse.ok) {
            setWebhookConfig(prev => prev ? {
              ...prev,
              isConfigured: true,
              testStatus: 'success',
              lastTested: new Date().toISOString()
            } : null);

            toast({
              title: "Webhook test successful!",
              description: "Your webhook received the status update",
            });
          } else {
            throw new Error(`Webhook responded with ${webhookResponse.status}`);
          }
        } catch (webhookError) {
          setWebhookConfig(prev => prev ? {
            ...prev,
            testStatus: 'failed',
            lastTested: new Date().toISOString()
          } : null);
          throw webhookError;
        }
      } else {
        throw new Error('Failed to retrieve message status');
      }
    } catch (error: any) {
      console.error('Webhook test error:', error);
      setWebhookConfig(prev => prev ? {
        ...prev,
        testStatus: 'failed',
        lastTested: new Date().toISOString()
      } : null);
      toast({
        title: "Webhook test failed",
        description: error.message || "Failed to test webhook configuration",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const renderTokenSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Key className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generate Your API Token
        </h2>
        <p className="text-gray-600">
          Get your secure API token to start using the WhatsApp Provider API
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Your Business Email Address
              </label>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={generateApiToken}
                  disabled={tokenLoading || !email.trim()}
                  className="px-6"
                >
                  {tokenLoading ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Generate Token
                    </>
                  )}
                </Button>
              </div>
            </div>

            {token && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong className="text-green-800">Token Generated Successfully!</strong>
                  <div className="mt-3 space-y-2">
                    <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                      {token.token}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Expires: {token.expiresInHours} hours</span>
                      <span>Generated: {new Date(token.generatedAt).toLocaleString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(token.token, 'token')}
                      className="mt-2"
                    >
                      {copiedItems.has('token') ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copiedItems.has('token') ? 'Copied!' : 'Copy Token'}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>How it works:</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                  <li>Enter your business email associated with your WhatsApp account</li>
                  <li>Click "Generate Token" to get your secure API key</li>
                  <li>Use this token in all API requests for authentication</li>
                  <li>Token expires in 7 days for security reasons</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderApiExamples = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Code className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          API Usage Examples
        </h2>
        <p className="text-gray-600">
          Ready-to-use code examples for different programming languages
        </p>
      </div>

      <Tabs defaultValue="send-message" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send-message">Send Message</TabsTrigger>
          <TabsTrigger value="bulk-message">Bulk Messages</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="status">Check Status</TabsTrigger>
        </TabsList>

        <TabsContent value="send-message" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Single Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="java">Java</TabsTrigger>
                </TabsList>

                <TabsContent value="javascript" className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400">JavaScript Example</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`const response = await fetch('/api/inspo-crm/whatsapp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: "${token?.token || 'YOUR_API_TOKEN'}",
    phoneNumber: "+1234567890",
    message: "Hello, World!"
  })
});

const result = await response.json();
console.log(result);`, 'js-send')}
                        className="h-6 w-6 p-0 text-white"
                      >
                        {copiedItems.has('js-send') ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <pre>{`const response = await fetch('${window.location.origin}/api/inspo-crm/whatsapp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: "${token?.token || 'YOUR_API_TOKEN'}",
    phoneNumber: "+1234567890",
    message: "Hello, World!"
  })
});

const result = await response.json();
console.log(result);`}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="python" className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400">Python Example</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`import requests

url = '${window.location.origin}/api/inspo-crm/whatsapp/send'
payload = {
    "token": "${token?.token || 'YOUR_API_TOKEN'}",
    "phoneNumber": "+1234567890",
    "message": "Hello, World!"
}

response = requests.post(url, json=payload)
result = response.json()
print(result)`, 'python-send')}
                        className="h-6 w-6 p-0 text-white"
                      >
                        {copiedItems.has('python-send') ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <pre>{`import requests

url = '${window.location.origin}/api/inspo-crm/whatsapp/send'
payload = {
    "token": "${token?.token || 'YOUR_API_TOKEN'}",
    "phoneNumber": "+1234567890",
    "message": "Hello, World!"
}

response = requests.post(url, json=payload)
result = response.json()
print(result)`}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="curl" className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400">cURL Example</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`curl -X POST '${window.location.origin}/api/inspo-crm/whatsapp/send' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "token": "${token?.token || 'YOUR_API_TOKEN'}",
    "phoneNumber": "+1234567890",
    "message": "Hello, World!"
  }'`, 'curl-send')}
                        className="h-6 w-6 p-0 text-white"
                      >
                        {copiedItems.has('curl-send') ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <pre>{`curl -X POST '${window.location.origin}/api/inspo-crm/whatsapp/send' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "token": "${token?.token || 'YOUR_API_TOKEN'}",
    "phoneNumber": "+1234567890",
    "message": "Hello, World!"
  }'`}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="java" className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400">Java Example</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class WhatsAppSender {
    public static void main(String[] args) {
        try {
            URL url = new URL("${window.location.origin}/api/inspo-crm/whatsapp/send");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String payload = "{" +
                "\\"token\\":\\"${token?.token || 'YOUR_API_TOKEN'}\\" +
                ",\\"phoneNumber\\":\\"+1234567890\\"" +
                ",\\"message\\":\\"Hello, World!\\"" +
                "}";

            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload.getBytes());
            }

            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    System.out.println(line);
                }
            }

            conn.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`, 'java-send')}
                        className="h-6 w-6 p-0 text-white"
                      >
                        {copiedItems.has('java-send') ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <pre>{`import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class WhatsAppSender {
    public static void main(String[] args) {
        try {
            URL url = new URL("${window.location.origin}/api/inspo-crm/whatsapp/send");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String payload = "{" +
                "\\"token\\":\\"${token?.token || 'YOUR_API_TOKEN'}\\" +
                ",\\"phoneNumber\\":\\"+1234567890\\"" +
                ",\\"message\\":\\"Hello, World!\\"" +
                "}";

            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload.getBytes());
            }

            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    System.out.println(line);
                }
            }

            conn.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-message" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Send Bulk Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400">Bulk Messages Example</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`{
  "token": "${token?.token || 'YOUR_API_TOKEN'}",
  "phoneNumbers": ["+1234567890", "+1234567891", "+1234567892"],
  "message": "Hello, valued customer! 🌟"
}`, 'bulk-json')}
                    className="h-6 w-6 p-0 text-white"
                  >
                    {copiedItems.has('bulk-json') ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre>{`POST ${window.location.origin}/api/inspo-crm/whatsapp/send-bulk
Content-Type: application/json

{
  "token": "${token?.token || 'YOUR_API_TOKEN'}",
  "phoneNumbers": ["+1234567890", "+1234567891", "+1234567892"],
  "message": "Hello, valued customer! 🌟"
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400">Schedule Message Example</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`{
  "token": "${token?.token || 'YOUR_API_TOKEN'}",
  "phoneNumber": "+1234567890",
  "message": "Happy Birthday! 🎉",
  "scheduledTime": "2025-11-16T10:00:00",
  "timezone": "UTC"
}`, 'schedule-json')}
                    className="h-6 w-6 p-0 text-white"
                  >
                    {copiedItems.has('schedule-json') ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre>{`POST ${window.location.origin}/api/inspo-crm/whatsapp/schedule
Content-Type: application/json

{
  "token": "${token?.token || 'YOUR_API_TOKEN'}",
  "phoneNumber": "+1234567890",
  "message": "Happy Birthday! 🎉",
  "scheduledTime": "2025-11-16T10:00:00",
  "timezone": "UTC"
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Check Message Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400">Check Status Example</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`GET ${window.location.origin}/api/inspo-crm/whatsapp/status/YOUR_MESSAGE_ID?token=${token?.token || 'YOUR_API_TOKEN'}`, 'status-get')}
                    className="h-6 w-6 p-0 text-white"
                  >
                    {copiedItems.has('status-get') ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre>{`GET ${window.location.origin}/api/inspo-crm/whatsapp/status/YOUR_MESSAGE_ID?token=${token?.token || 'YOUR_API_TOKEN'}`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderTestInterface = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <TestTube className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Test Your Integration
        </h2>
        <p className="text-gray-600">
          Send a test message to verify your API integration works correctly
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1234567890"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Message
              </label>
              <Textarea
                placeholder="Enter your test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={sendTestMessage}
              disabled={sendingMessage || !token || !testPhone.trim() || !testMessage.trim()}
              className="w-full"
            >
              {sendingMessage ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {messageResult && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Message Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Message ID:</strong>
                  <div className="font-mono bg-gray-100 p-2 rounded mt-1 text-xs break-all">
                    {messageResult.messageId}
                  </div>
                </div>
                <div>
                  <strong>Status:</strong>
                  <Badge className="mt-1" variant={messageResult.status === 'SENT' ? 'default' : 'secondary'}>
                    {messageResult.status}
                  </Badge>
                </div>
              </div>
              <div>
                <strong>Timestamp:</strong>
                <div className="text-sm text-gray-600 mt-1">
                  {new Date(messageResult.timestamp).toLocaleString()}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(messageResult.messageId, 'messageId')}
              >
                {copiedItems.has('messageId') ? (
                  <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 mr-2" />
                )}
                Copy Message ID
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Webhook Configuration Section */}
      {showWebhookConfig && messageResult && (
        <div className="space-y-6 mt-8 border-t pt-8">
          <Alert className="border-blue-200 bg-blue-50">
            <Webhook className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong className="text-blue-800">Multi-Tenant Webhook Registration:</strong> In this multi-tenant application, when your account credentials are successfully verified, you'll automatically register with the INSP Works webhook URL.
              All external platform users from other applications will register with this webhook API at <code>https://api.inspoworks.com/inspocrm/api/v1/whatsapp/webhook</code> to receive real-time status updates about their messages.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Platform
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={webhookPlatform}
                    onChange={(e) => setWebhookPlatform(e.target.value)}
                  >
                    <option value="custom">Custom Platform</option>
                    <option value="meta">Meta/Facebook</option>
                    <option value="twilio">Twilio</option>
                    <option value="360dialog">360Dialog</option>
                    <option value="gupshup">GupShup</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Webhook URL (Your Platform)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://api.inspoworks.com/inspocrm/api/v1/whatsapp/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the URL where users will receive status updates from your platform
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={configureWebhook}
                    className="flex-1"
                    disabled={!webhookUrl.trim()}
                  >
                    Configure Webhook
                  </Button>

                  <Button
                    onClick={() => copyToClipboard('https://api.inspoworks.com/inspocrm/api/v1/whatsapp/webhook', 'inspocrm-webhook-url')}
                    variant="outline"
                  >
                    {copiedItems.has('inspocrm-webhook-url') ? (
                      <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 mr-2" />
                    )}
                    Copy Suggested URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {webhookConfig && (
              <Card className={webhookConfig.testStatus === 'success' ? "border-green-200" : webhookConfig.testStatus === 'failed' ? "border-red-200" : "border-yellow-200"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {webhookConfig.testStatus === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : webhookConfig.testStatus === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Webhook className="h-5 w-5" />
                    )}
                    Webhook Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Webhook URL:</strong>
                      <div className="font-mono bg-gray-100 p-2 rounded mt-1 text-xs break-all">
                        {webhookConfig.url}
                      </div>
                    </div>

                    <div className="text-sm">
                      <strong>Platform:</strong>
                      <Badge variant="outline" className="ml-2">
                        {webhookConfig.platform}
                      </Badge>
                    </div>

                    {webhookConfig.lastTested && (
                      <div className="text-sm">
                        <strong>Last Tested:</strong> {new Date(webhookConfig.lastTested).toLocaleString()}
                      </div>
                    )}

                    {webhookConfig.testStatus && (
                      <div className="flex items-center gap-2">
                        <Badge variant={webhookConfig.testStatus === 'success' ? 'default' : 'destructive'}>
                          {webhookConfig.testStatus === 'success' ? 'Test Successful' : 'Test Failed'}
                        </Badge>
                        {webhookConfig.testStatus === 'success' && (
                          <span className="text-green-600 text-sm">✓ Webhook is working correctly</span>
                        )}
                        {webhookConfig.testStatus === 'failed' && (
                          <span className="text-red-600 text-sm">✗ Webhook test failed</span>
                        )}
                      </div>
                    )}

                    {!webhookConfig.isConfigured && (
                      <Button
                        onClick={testWebhook}
                        disabled={!webhookConfig.url || testingWebhook}
                        className="w-full"
                      >
                        {testingWebhook ? (
                          <>Testing Webhook...</>
                        ) : (
                          <>Test Webhook</>
                        )}
                      </Button>
                    )}

                    {webhookConfig.isConfigured && webhookConfig.testStatus === 'success' && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <strong>✅ Webhook Successfully Configured!</strong>
                          <br />
                          Your users can now receive real-time message status updates at the configured webhook URL.
                          Status updates will be sent via POST method whenever message statuses change.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {(!showWebhookConfig || !messageResult) && (
        <Alert>
          <Webhook className="h-4 w-4" />
          <AlertDescription>
            <strong>Webhook Integration:</strong> After sending your first successful message, configure your webhook URL to receive real-time status updates.
            Messages typically change status from SENT → DELIVERED → READ.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderWalkthrough = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Play className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step-by-Step Walkthrough
        </h2>
        <p className="text-gray-600">
          Follow these simple steps to integrate WhatsApp messaging into your application
        </p>
      </div>

      <div className="space-y-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Get Your API Token
                </h3>
                <p className="text-gray-600 mb-3">
                  Generate a secure API token using your business email. This token authenticates your API requests.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <code className="text-sm text-blue-800">
                    POST /api/inspo-crm/whatsapp/token
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Send Your First Message
                </h3>
                <p className="text-gray-600 mb-3">
                  Use the token to send WhatsApp messages. Include the recipient's phone number and your message content.
                </p>
                <div className="bg-green-50 p-3 rounded-lg">
                  <code className="text-sm text-green-800">
                    POST /api/inspo-crm/whatsapp/send
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Monitor Message Status
                </h3>
                <p className="text-gray-600 mb-3">
                  Check delivery status using message IDs. Get real-time updates via webhooks for production apps.
                </p>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <code className="text-sm text-purple-800">
                    GET /api/inspo-crm/whatsapp/status/&#60;messageId&#62;
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Scale with Bulk Messages
                </h3>
                <p className="text-gray-600 mb-3">
                  Send messages to multiple recipients simultaneously. Perfect for marketing campaigns and notifications.
                </p>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <code className="text-sm text-orange-800">
                    POST /api/inspo-crm/whatsapp/send-bulk
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-bold">5</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Schedule Messages
                </h3>
                <p className="text-gray-600 mb-3">
                  Send messages at specific times. Great for birthday wishes, reminders, or timed campaigns.
                </p>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <code className="text-sm text-indigo-800">
                    POST /api/inspo-crm/whatsapp/schedule
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <MessageSquare className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            WhatsApp Provider API Guide
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete guide to integrate WhatsApp messaging into your application using our powerful API
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 max-w-md mx-auto">
            <Badge variant={token ? "default" : "secondary"}>
              {token ? "✓ Token Generated" : "Get API Token"}
            </Badge>
            <Badge variant="outline">API Examples</Badge>
            <Badge variant="outline">Test Integration</Badge>
          </div>
          <Progress value={token ? 75 : 25} className="max-w-md mx-auto" />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="get-token" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Get Token
            </TabsTrigger>
            <TabsTrigger value="api-examples" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              API Examples
            </TabsTrigger>
            <TabsTrigger value="walkthrough" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Walkthrough
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="get-token" className="space-y-6">
            {renderTokenSection()}
          </TabsContent>

          <TabsContent value="api-examples" className="space-y-6">
            {renderApiExamples()}
          </TabsContent>

          <TabsContent value="walkthrough" className="space-y-6">
            {renderWalkthrough()}
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            {renderTestInterface()}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center border-t pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">API Base URL</h4>
              <code className="bg-gray-100 px-2 py-1 rounded break-all">
                {window.location.origin}/api/inspo-crm/whatsapp
              </code>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Authentication</h4>
              <p>API token required in request body</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Rate Limits</h4>
              <p>1000 messages per hour per token</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
