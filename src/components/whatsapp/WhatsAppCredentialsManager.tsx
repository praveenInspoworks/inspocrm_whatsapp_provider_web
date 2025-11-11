import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestTube, Plus, Edit, Trash2, CheckCircle, XCircle, MessageSquare, Phone, Settings, Webhook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { get, post, del } from "@/services/apiService";
import { useNavigate } from "react-router-dom";

interface WhatsAppAccount {
  id: number;
  tenantId?: number;
  accountName: string;
  accountId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  businessProfileName?: string;
  status: 'PENDING' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED';
  webhookUrl?: string;
  accessToken?: string;
  accountSid?: string;
  apiKey?: string;
  appId?: string;
  lastSyncedAt?: string;
  createdAt?: string;
  isActive: boolean;
}

export function WhatsAppCredentialsManager() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testingAccount, setTestingAccount] = useState<WhatsAppAccount | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await get('/api/v1/whatsapp/accounts');
      if (Array.isArray(response)) {
        setAccounts(response);
      }
    } catch (error: any) {
      console.error('Error loading WhatsApp accounts:', error);
      // If 404 or no accounts, that's fine - just show empty state
      if (error?.response?.status !== 404) {
        toast({ title: "Failed to load WhatsApp accounts", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (id: number) => {
    try {
      setTestingConnection(id);
      const response = await post(`/api/v1/whatsapp/accounts/${id}/test-connection`);

      if (response && response.success !== false) {
        toast({ title: "Connection test successful", description: "WhatsApp account is working correctly" });
      } else {
        toast({ title: "Connection test failed", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({ title: "Connection test failed", variant: "destructive" });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleTestMessage = async () => {
    if (!testingAccount || !testMessage.trim()) {
      toast({ title: "Test message is required", variant: "destructive" });
      return;
    }

    if (!testRecipient.trim()) {
      toast({ title: "Recipient phone number is required", variant: "destructive" });
      return;
    }

    try {
      setTestingConnection(testingAccount.id);

      const response = await post('/api/v1/whatsapp/messages/test', {
        accountId: testingAccount.id,
        message: testMessage,
        recipient: testRecipient
      });

      if (response) {
        toast({ title: "Test message sent successfully", description: `Message sent to ${testRecipient}` });
        setShowTestDialog(false);
        setTestMessage('');
        setTestRecipient('');
        setTestingAccount(null);
      } else {
        toast({ title: "Failed to send test message", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({ title: "Failed to send test message", variant: "destructive" });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this WhatsApp account? This action cannot be undone.')) return;

    try {
      const response = await del(`/api/v1/whatsapp/accounts/${id}`);
      if (response) {
        await loadAccounts();
        toast({ title: "WhatsApp account deleted successfully" });
      } else {
        toast({ title: "Failed to delete WhatsApp account", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting WhatsApp account:', error);
      toast({ title: "Failed to delete WhatsApp account", variant: "destructive" });
    }
  };

  const openTestDialog = (account: WhatsAppAccount) => {
    setTestingAccount(account);
    setShowTestDialog(true);
  };

  const handleEditAccount = (account: WhatsAppAccount) => {
    // Navigate to setup page with account ID for editing
    navigate(`/whatsapp/setup?accountId=${account.id}`);
  };

  const handleAddNewAccount = () => {
    // Navigate to setup page for new account
    navigate('/whatsapp/setup');
  };

  const handleSaveCredentials = async (accountData: any) => {
    try {
      setIsLoading(true);

      // Single payload with all business account details and provider credentials
      const payload = {
        businessName: accountData.businessName || '',
        phoneNumber: accountData.phoneNumber || '',
        // Provider credentials
        accessToken: accountData.accessToken || '',
        accountSid: accountData.accountSid || '',
        apiKey: accountData.apiKey || '',
        appId: accountData.appId || '',
        phoneNumberId: accountData.phoneNumberId || '',
        accountId: accountData.accountId || ''
      };

      console.log('Creating WhatsApp account with payload:', payload);

      // Check if required fields are provided
      if (!payload.businessName.trim()) {
        throw new Error('Business name is required');
      }
      if (!payload.phoneNumber.trim()) {
        throw new Error('Phone number is required');
      }

      const response = await post('/api/v1/whatsapp/accounts/setup', payload);

      if (response && response.id) {
        toast({ title: "WhatsApp account created successfully" });
        await loadAccounts(); // Refresh the list
        return response;
      } else if (response && response.error) {
        throw new Error(response.error);
      } else {
        throw new Error('Failed to create WhatsApp account');
      }
    } catch (error: any) {
      console.error('Error saving WhatsApp credentials:', error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to save WhatsApp credentials";
      toast({ title: errorMessage, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'VERIFIED': return 'secondary';
      case 'PENDING': return 'outline';
      case 'SUSPENDED': return 'destructive';
      default: return 'outline';
    }
  };

  const getProviderName = (account: WhatsAppAccount) => {
    if (account.accountSid) return 'Twilio';
    if (account.apiKey && account.appId) return 'GupShup';
    if (account.apiKey && account.phoneNumberId) return '360Dialog';
    if (account.accessToken && account.phoneNumberId) return 'Meta';
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">WhatsApp Account Management</h1>
                <p className="text-gray-600 mt-1">Configure and manage WhatsApp Business accounts for messaging campaigns</p>
              </div>
            </div>
            <Button
              onClick={handleAddNewAccount}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 text-base font-medium shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add WhatsApp Account
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading WhatsApp accounts...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {account.accountName}
                        {account.isActive && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{account.displayPhoneNumber}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(account.status)}>
                      {account.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm space-y-1">
                      <p><strong>Provider:</strong> {getProviderName(account)}</p>
                      <p><strong>Phone:</strong> {account.displayPhoneNumber}</p>
                      {account.businessProfileName && (
                        <p><strong>Profile:</strong> {account.businessProfileName}</p>
                      )}
                      {account.createdAt && (
                        <p><strong>Created:</strong> {new Date(account.createdAt).toLocaleDateString()}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {account.isActive ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                      {account.webhookUrl && (
                        <Badge variant="secondary" className="text-xs">
                          <Webhook className="mr-1 h-3 w-3" />
                          Webhook
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTestDialog(account)}
                        disabled={testingConnection === account.id || account.status !== 'ACTIVE'}
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        {testingConnection === account.id ? "Testing..." : "Test Message"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(account.id)}
                        disabled={testingConnection === account.id}
                      >
                        <TestTube className="mr-1 h-3 w-3" />
                        {testingConnection === account.id ? "Testing..." : "Test Connection"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAccount(account)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {accounts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No WhatsApp accounts configured</h3>
            <p className="text-muted-foreground mb-6">Add your WhatsApp Business accounts to start sending campaigns</p>
            <Button onClick={handleAddNewAccount} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add Your First WhatsApp Account
            </Button>
          </div>
        )}

        {/* Test Message Dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Test WhatsApp Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Testing:</strong> {testingAccount?.accountName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  This will send a test message via WhatsApp
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Recipient Phone Number *
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="+1234567890"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code (e.g., +1 for US, +91 for India)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Test Message *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter your test message..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleTestMessage}
                  className="flex-1"
                  disabled={testingConnection !== null || !testMessage.trim() || !testRecipient.trim()}
                >
                  {testingConnection ? "Sending..." : "Send Test Message"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTestDialog(false);
                    setTestMessage('');
                    setTestRecipient('');
                    setTestingAccount(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
