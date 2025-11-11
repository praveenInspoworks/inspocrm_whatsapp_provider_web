import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare, Phone, Key, Webhook, CheckCircle, Check,
  AlertTriangle, RefreshCw, TestTube, Settings,
  Smartphone, Globe, Shield, Zap, Facebook, Hash, Database
} from 'lucide-react';
import { get, post, put } from '@/services/apiService';

interface WhatsAppAccount {
  id: number;
  tenantId?: number;
  accountName: string;
  accountId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  businessProfileName?: string;
  businessProfileAbout?: string;
  businessProfileWebsite?: string;
  businessProfileEmail?: string;
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

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

interface ProviderConfig {
  id: 'META' | 'TWILIO' | 'GUPSHUP' | '360DIALOG';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'select';
    required: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    helpText?: string;
  }>;
  environments?: Array<{ value: 'SANDBOX' | 'PRODUCTION'; label: string }>;
  docsUrl?: string;
}

const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'META',
    name: 'Meta (Facebook) WhatsApp Business API',
    description: 'Official WhatsApp Business API by Meta. Best for enterprise solutions.',
    icon: Facebook,
    color: 'blue',
    fields: [
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        placeholder: 'EAA...',
        helpText: 'Permanent access token from Meta Developer Console'
      },
      {
        key: 'phoneNumberId',
        label: 'Phone Number ID',
        type: 'text',
        required: true,
        placeholder: '123456789012345',
        helpText: 'WhatsApp Business Phone Number ID'
      },
      {
        key: 'accountId',
        label: 'WhatsApp Business Account ID',
        type: 'text',
        required: true,
        placeholder: '123456789012345',
        helpText: 'WABA ID from Meta Business Manager'
      }
    ],
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/'
  },
  {
    id: 'TWILIO',
    name: 'Twilio WhatsApp API',
    description: 'Twilio-powered WhatsApp messaging with global reach.',
    icon: MessageSquare,
    color: 'red',
    fields: [
      {
        key: 'accountSid',
        label: 'Account SID',
        type: 'text',
        required: true,
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'Twilio Account SID starting with AC'
      },
      {
        key: 'accessToken',
        label: 'Auth Token',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'Twilio Auth Token'
      },
      {
        key: 'phoneNumber',
        label: 'Twilio WhatsApp Number',
        type: 'text',
        required: true,
        placeholder: '+1234567890',
        helpText: 'Your Twilio WhatsApp-enabled phone number'
      }
    ],
    environments: [
      { value: 'SANDBOX', label: 'Sandbox (Testing)' },
      { value: 'PRODUCTION', label: 'Production (Live)' }
    ],
    docsUrl: 'https://www.twilio.com/docs/whatsapp'
  },
  {
    id: 'GUPSHUP',
    name: 'GupShup WhatsApp API',
    description: 'GupShup Business Messaging Platform for WhatsApp.',
    icon: Hash,
    color: 'purple',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'GupShup API Key from dashboard'
      },
      {
        key: 'appId',
        label: 'App ID',
        type: 'text',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'GupShup App ID'
      },
      {
        key: 'phoneNumber',
        label: 'WhatsApp Number',
        type: 'text',
        required: true,
        placeholder: '+91xxxxxxxxxx',
        helpText: 'Your GupShup-enabled WhatsApp number'
      }
    ],
    environments: [
      { value: 'SANDBOX', label: 'Sandbox (Testing)' },
      { value: 'PRODUCTION', label: 'Production (Live)' }
    ],
    docsUrl: 'https://docs.gupshup.io/docs/whatsapp-api'
  },
  {
    id: '360DIALOG',
    name: '360Dialog WhatsApp API',
    description: '360Dialog Business Solutions for WhatsApp messaging.',
    icon: Database,
    color: 'green',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: '360Dialog API Key'
      },
      {
        key: 'phoneNumberId',
        label: 'Phone Number ID',
        type: 'text',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: '360Dialog Phone Number ID'
      }
    ],
    docsUrl: 'https://docs.360dialog.com/'
  }
];

export function WhatsAppBusinessSetup() {
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [setupData, setSetupData] = useState({
    businessName: '',
    businessDescription: '',
    businessCategory: '',
    businessWebsite: '',
    phoneNumber: '',
    businessAddress: '',
    contactEmail: '',
    contactName: '',
    // Provider-specific fields
    accessToken: '',
    accountSid: '',
    apiKey: '',
    appId: '',
    phoneNumberId: '',
    accountId: '',
    environment: 'SANDBOX' as 'SANDBOX' | 'PRODUCTION'
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [testResults, setTestResults] = useState<any>(null);

  const SETUP_STEPS: SetupStep[] = [
    {
      id: 'business-info',
      title: 'Business Information',
      description: 'Provide your business details for WhatsApp Business API',
      icon: Settings,
      completed: !!setupData.businessName && !!setupData.businessCategory,
      required: true
    },
    {
      id: 'provider-selection',
      title: 'Choose Provider',
      description: 'Select your WhatsApp Business API provider',
      icon: MessageSquare,
      completed: !!selectedProvider,
      required: true
    },
    {
      id: 'provider-credentials',
      title: 'API Credentials',
      description: 'Enter your provider credentials',
      icon: Key,
      completed: selectedProvider ? selectedProvider.fields.every(field =>
        !field.required || setupData[field.key as keyof typeof setupData]
      ) : false,
      required: true
    },
    {
      id: 'phone-verification',
      title: 'Phone Verification',
      description: 'Verify your business phone number',
      icon: Phone,
      completed: account?.status === 'VERIFIED' || account?.status === 'ACTIVE',
      required: true
    },
    {
      id: 'api-setup',
      title: 'API Configuration',
      description: 'Configure API credentials and webhooks',
      icon: Key,
      completed: account?.status === 'ACTIVE',
      required: false
    },
    {
      id: 'webhook-setup',
      title: 'Webhook Setup',
      description: 'Set up message and status webhooks',
      icon: Webhook,
      completed: !!account?.webhookUrl,
      required: false
    },
    {
      id: 'testing',
      title: 'Testing & Verification',
      description: 'Test your WhatsApp Business setup',
      icon: TestTube,
      completed: false,
      required: false
    }
  ];

  useEffect(() => {
    loadWhatsAppAccount();
  }, []);

  const loadWhatsAppAccount = async () => {
    try {
      // Check if we're editing an existing account from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const accountId = urlParams.get('accountId');

      if (accountId) {
        // Load specific account for editing
        const response = await get(`/api/v1/whatsapp/accounts/${accountId}`);
        if (response) {
          setAccount(response);

          // Pre-fill form data from existing account
          setSetupData(prev => ({
            ...prev,
            businessName: response.accountName || '',
            phoneNumber: response.displayPhoneNumber || '',
            // Map other fields if they exist
            accountSid: response.accountSid || '',
            accessToken: response.accessToken || '',
            apiKey: response.apiKey || '',
            appId: response.appId || '',
            phoneNumberId: response.phoneNumberId || '',
            accountId: response.accountId || ''
          }));

          // Detect and set provider based on account data
          let detectedProvider: ProviderConfig | null = null;
          if (response.accountSid) {
            detectedProvider = PROVIDER_CONFIGS.find(p => p.id === 'TWILIO') || null;
          } else if (response.apiKey && response.appId) {
            detectedProvider = PROVIDER_CONFIGS.find(p => p.id === 'GUPSHUP') || null;
          } else if (response.apiKey && response.phoneNumberId) {
            detectedProvider = PROVIDER_CONFIGS.find(p => p.id === '360DIALOG') || null;
          } else if (response.accessToken && response.phoneNumberId) {
            detectedProvider = PROVIDER_CONFIGS.find(p => p.id === 'META') || null;
          }

          if (detectedProvider) {
            setSelectedProvider(detectedProvider);
          }

          // Set environment based on account data (for Twilio)
          if (response.accountSid === 'YOUR_TWILIO_SANDBOX_ACCOUNT_SID') {
            setSetupData(prev => ({
              ...prev,
              environment: 'SANDBOX',
              // Force correct sandbox credentials
              accountSid: 'YOUR_TWILIO_SANDBOX_ACCOUNT_SID',
              accessToken: 'YOUR_TWILIO_SANDBOX_AUTH_TOKEN',
              phoneNumber: '+14155238886'
            }));
          }

          // For editing, allow users to navigate through all steps
          // They can modify any step and re-verify
        }
      } else {
        // Try to load current account for new setup
        const response = await get('/api/v1/whatsapp/accounts/current');
        if (response) {
          setAccount(response);

          // Pre-fill form data from existing account
          setSetupData(prev => ({
            ...prev,
            businessName: response.accountName || '',
            phoneNumber: response.displayPhoneNumber || '',
            // Map other fields if they exist
            accountSid: response.accountSid || '',
            accessToken: response.accessToken || '',
            apiKey: response.apiKey || '',
            appId: response.appId || '',
            phoneNumberId: response.phoneNumberId || '',
            accountId: response.accountId || ''
          }));

          // Detect and set provider based on account data
          let detectedProvider: ProviderConfig | null = null;
          if (response.accountSid) {
            detectedProvider = PROVIDER_CONFIGS.find(p => p.id === 'TWILIO') || null;
          } else if (response.apiKey && response.appId) {
            detectedProvider = PROVIDER_CONFIGS.find(p => p.id === 'GUPSHUP') || null;
          } else if (response.apiKey && response.phoneNumberId) {
            detectedProvider = PROVIDER_CONFIGS.find(p => p.id === '360DIALOG') || null;
          } else if (response.accessToken && response.phoneNumberId) {
            detectedProvider = PROVIDER_CONFIGS.find(p => p.id === 'META') || null;
          }

          if (detectedProvider) {
            setSelectedProvider(detectedProvider);
          }

          // Set environment based on account data (for Twilio)
          if (response.accountSid === 'YOUR_TWILIO_SANDBOX_ACCOUNT_SID') {
            setSetupData(prev => ({ ...prev, environment: 'SANDBOX' }));
          }
        }
      }
    } catch (error: any) {
      // Account doesn't exist yet (404), or other error - that's fine for new setup
      if (error?.response?.status === 404) {
        // No account exists yet, start fresh
        setAccount(null);
      } else {
        // Log other errors but don't break the setup flow
        console.warn('Error loading WhatsApp account:', error);
      }
    }
  };

  const handleBusinessInfoSubmit = async () => {
    if (!setupData.businessName || !setupData.businessCategory) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required business information.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await post('/api/v1/whatsapp/accounts/setup', {
        ...setupData,
        setupStep: 'business-info'
      });

      setAccount(response);
      setCurrentStep(1);

      toast({
        title: "Business Information Saved",
        description: "Your business information has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save business information.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderCredentialsSubmit = async () => {
    if (!selectedProvider) {
      toast({
        title: "Validation Error",
        description: "Please select a provider first.",
        variant: "destructive"
      });
      return;
    }

    // Validate all required fields have values
    const missingFields = selectedProvider.fields
      .filter(field => field.required)
      .filter(field => !setupData[field.key as keyof typeof setupData] ||
                      setupData[field.key as keyof typeof setupData] === '');

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    if (!account?.id) {
      toast({
        title: "Error",
        description: "No account found. Please complete business information first.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update existing account with provider credentials
      const response = await put(`/api/v1/whatsapp/accounts/${account.id}`, {
        ...setupData,
        provider: selectedProvider.id
      });

      setAccount(response);
      setCurrentStep(3); // Go to phone verification step after updating credentials

      toast({
        title: "Provider Credentials Updated",
        description: "Your provider credentials have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update provider credentials.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneVerification = async () => {
    if (!setupData.phoneNumber) {
      toast({
        title: "Validation Error",
        description: "Please enter a phone number.",
        variant: "destructive"
      });
      return;
    }

    // Special handling for Twilio sandbox
    if (selectedProvider?.id === 'TWILIO' && setupData.environment === 'SANDBOX' && setupData.phoneNumber === '+14155238886') {
      // Skip verification for Twilio sandbox - directly verify the code
      await handleVerificationSubmit('123456');
      return;
    }

    setIsVerifying(true);
    try {
      await post('/api/v1/whatsapp/accounts/verify-phone', {
        phoneNumber: setupData.phoneNumber
      });

      toast({
        title: "Verification Code Sent",
        description: "A verification code has been sent to your phone number.",
      });

      // Show code input dialog for manual verification
      setVerificationCode(''); // Reset code input
      // In a real implementation, show a modal for code input

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerificationSubmit = async (code: string) => {
    try {
      const response = await post('/api/v1/whatsapp/accounts/verify-code', {
        phoneNumber: setupData.phoneNumber,
        verificationCode: code
      });

      setAccount(response);
      setCurrentStep(4); // Go to API Configuration step after successful verification

      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAPISetup = async () => {
    setIsSubmitting(true);
    try {
      const response = await post('/api/v1/whatsapp/accounts/setup-api', {
        accountId: account?.id
      });

      setAccount(response);
      setCurrentStep(5); // Go to Webhook Setup step after successful API setup

      toast({
        title: "API Setup Complete",
        description: "Your WhatsApp Business API has been configured.",
      });
    } catch (error) {
      toast({
        title: "API Setup Failed",
        description: "Failed to configure WhatsApp Business API.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWebhookSetup = async () => {
    setIsSubmitting(true);
    try {
      const response = await post('/api/v1/whatsapp/accounts/setup-webhook', {
        accountId: account?.id,
        webhookUrl: `${window.location.origin}/api/v1/whatsapp/webhook`
      });

      setAccount(response);
      setCurrentStep(6); // Go to Testing & Verification step after successful webhook setup

      toast({
        title: "Webhook Configured",
        description: "Your webhook has been configured successfully.",
      });
    } catch (error) {
      toast({
        title: "Webhook Setup Failed",
        description: "Failed to configure webhook.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a test message.",
        variant: "destructive"
      });
      return;
    }

    if (!testRecipient.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a recipient phone number.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await post('/api/v1/whatsapp/messages/test', {
        accountId: account?.id,
        message: testMessage,
        recipient: testRecipient // Use custom recipient from dialog
      });

      setTestResults(response);
      setShowTestDialog(false);
      setTestMessage(''); // Reset for next use
      setTestRecipient(''); // Reset for next use

      toast({
        title: "Test Message Sent",
        description: `Your test message has been sent to ${testRecipient}.`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test message.",
        variant: "destructive"
      });
    }
  };

  const renderProviderSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose Your WhatsApp Provider
        </h3>
        <p className="text-gray-600 mb-6">
          Select the WhatsApp Business API provider you want to use
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROVIDER_CONFIGS.map((provider) => {
          const ProviderIcon = provider.icon;
          const isSelected = selectedProvider?.id === provider.id;

          return (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedProvider(provider)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    provider.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    provider.color === 'red' ? 'bg-red-100 text-red-600' :
                    provider.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <ProviderIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {provider.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {provider.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {provider.fields.length} credentials needed
                      </Badge>
                      {provider.environments && (
                        <Badge variant="secondary" className="text-xs">
                          Sandbox & Production
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-6 w-6 text-blue-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedProvider && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>{selectedProvider.name}</strong> selected. You'll need to provide the required credentials in the next step.
            {selectedProvider.docsUrl && (
              <a
                href={selectedProvider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                View documentation →
              </a>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderProviderCredentials = () => {
    if (!selectedProvider) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            selectedProvider.color === 'blue' ? 'bg-blue-100' :
            selectedProvider.color === 'red' ? 'bg-red-100' :
            selectedProvider.color === 'purple' ? 'bg-purple-100' :
            'bg-green-100'
          }`}>
            <selectedProvider.icon className={`h-8 w-8 ${
              selectedProvider.color === 'blue' ? 'text-blue-600' :
              selectedProvider.color === 'red' ? 'text-red-600' :
              selectedProvider.color === 'purple' ? 'text-purple-600' :
              'text-green-600'
            }`} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedProvider.name} Credentials
          </h3>
          <p className="text-gray-600 mb-6">
            Enter your {selectedProvider.name} API credentials
          </p>
        </div>

        {/* Environment Selection for providers that support it */}
        {selectedProvider.environments && (
          <Card>
            <CardContent className="p-6">
              <Label className="text-sm font-medium mb-3 block">Environment</Label>
              <RadioGroup
                value={setupData.environment}
                onValueChange={(value: 'SANDBOX' | 'PRODUCTION') => {
                  setSetupData(prev => ({
                    ...prev,
                    environment: value,
                    // Auto-fill Twilio sandbox credentials
                    ...(selectedProvider?.id === 'TWILIO' && value === 'SANDBOX' && {
                      accountSid: 'YOUR_TWILIO_SANDBOX_ACCOUNT_SID',
                      accessToken: 'YOUR_TWILIO_SANDBOX_AUTH_TOKEN',
                      phoneNumber: '+14155238886'
                    })
                  }));
                }}
                className="flex gap-6"
              >
                {selectedProvider.environments.map((env) => (
                  <div key={env.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={env.value} id={env.value} />
                    <Label htmlFor={env.value} className="cursor-pointer">
                      {env.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-gray-500 mt-2">
                {setupData.environment === 'SANDBOX'
                  ? 'Use sandbox for testing. Messages may be limited.'
                  : 'Use production for live messaging with full capabilities.'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Credential Fields */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {selectedProvider.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-medium">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.type === 'select' ? (
                    <Select
                      value={setupData[field.key as keyof typeof setupData] as string}
                      onValueChange={(value) =>
                        setSetupData(prev => ({ ...prev, [field.key]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={setupData[field.key as keyof typeof setupData] as string}
                      onChange={(e) =>
                        setSetupData(prev => ({ ...prev, [field.key]: e.target.value }))
                      }
                    />
                  )}
                  {field.helpText && (
                    <p className="text-xs text-gray-500">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sample Credentials for Demo */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sample Credentials:</strong> For testing purposes, you can use these sample credentials:
            <div className="mt-2 space-y-1 text-xs">
              {selectedProvider.id === 'TWILIO' && (
                <>
                  <div>Account SID: YOUR_TWILIO_ACCOUNT_SID</div>
                  <div>Auth Token: YOUR_TWILIO_AUTH_TOKEN</div>
                  <div>Phone Number: {
                    setupData.environment === 'SANDBOX'
                      ? '+14155238886 (Sandbox - for testing)'
                      : 'YOUR_TWILIO_PHONE_NUMBER (Production - for live messaging)'
                  }</div>
                  <div className="mt-2 text-blue-600 font-medium">
                    ✅ Replace with your actual Twilio credentials!
                    <br />
                    💡 {setupData.environment === 'SANDBOX'
                      ? 'Sandbox mode: Limited recipients, use +14155238886'
                      : 'Production mode: Use your verified WhatsApp number'
                    }
                  </div>
                </>
              )}
              {selectedProvider.id === 'GUPSHUP' && (
                <>
                  <div>API Key: w9ketldu4v7avrvbcxfucaimyrnnzqln</div>
                  <div>App ID: sample-app-id</div>
                  <div>Phone Number: +917022003887</div>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Business Name *
                </label>
                <Input
                  placeholder="e.g., Acme Corporation"
                  value={setupData.businessName}
                  onChange={(e) => setSetupData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Business Category *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={setupData.businessCategory}
                  onChange={(e) => setSetupData(prev => ({ ...prev, businessCategory: e.target.value }))}
                >
                  <option value="">Select Category</option>
                  <option value="RETAIL">Retail</option>
                  <option value="FOOD">Food & Beverage</option>
                  <option value="HEALTH">Health & Wellness</option>
                  <option value="FINANCE">Finance</option>
                  <option value="TECHNOLOGY">Technology</option>
                  <option value="EDUCATION">Education</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Business Description
              </label>
              <Textarea
                placeholder="Describe your business..."
                value={setupData.businessDescription}
                onChange={(e) => setSetupData(prev => ({ ...prev, businessDescription: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Business Website
                </label>
                <Input
                  placeholder="https://www.yourbusiness.com"
                  value={setupData.businessWebsite}
                  onChange={(e) => setSetupData(prev => ({ ...prev, businessWebsite: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Business Address
                </label>
                <Input
                  placeholder="123 Business St, City, State"
                  value={setupData.businessAddress}
                  onChange={(e) => setSetupData(prev => ({ ...prev, businessAddress: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Contact Name
                </label>
                <Input
                  placeholder="John Doe"
                  value={setupData.contactName}
                  onChange={(e) => setSetupData(prev => ({ ...prev, contactName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <Input
                  type="email"
                  placeholder="john@yourbusiness.com"
                  value={setupData.contactEmail}
                  onChange={(e) => setSetupData(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your business information will be used to create your WhatsApp Business profile.
                Make sure all information is accurate and up-to-date.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 1:
        return renderProviderSelection();

      case 2:
        return renderProviderCredentials();

      case 3:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-4">
              <div className="text-center">
                <Phone className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Phone Number Verification
                </h3>
                <p className="text-gray-600 mb-6">
                  Verify your business phone number to activate WhatsApp Business.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Business Phone Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={setupData.phoneNumber}
                    onChange={(e) => setSetupData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    Include country code (e.g., +1 for US, +91 for India)
                  </p>
                </div>

                <Button
                  onClick={handlePhoneVerification}
                  disabled={isVerifying || !setupData.phoneNumber}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Twilio Phone Number Requirements:</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    {selectedProvider?.id === 'TWILIO' && setupData.environment === 'SANDBOX' && (
                      <>
                        <div>✅ <strong>Sandbox Mode:</strong> Uses Twilio's pre-verified number (+14155238886)</div>
                        <div>✅ <strong>No verification needed</strong> - ready to send test messages</div>
                        <div>⚠️ <strong>Limited recipients:</strong> Only approved test numbers can receive messages</div>
                      </>
                    )}
                    {selectedProvider?.id === 'TWILIO' && setupData.environment === 'PRODUCTION' && (
                      <>
                        <div>✅ <strong>Production Mode:</strong> Uses your verified Twilio WhatsApp number</div>
                        <div>⚠️ <strong>Verification Required:</strong> Phone number must be WhatsApp-enabled in Twilio Console</div>
                        <div>📋 <strong>Steps:</strong> Purchase number → Enable WhatsApp → Submit business info</div>
                      </>
                    )}
                    {selectedProvider?.id !== 'TWILIO' && (
                      <>
                        <div>✅ This phone number will be used for WhatsApp Business messaging</div>
                        <div>✅ Verification code will be sent to complete setup</div>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-4">
              <div className="text-center">
                <Key className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  API Configuration
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure your WhatsApp Business API credentials.
                </p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">API Status</h4>
                        <p className="text-sm text-gray-600">Configure WhatsApp Business API</p>
                      </div>
                      <Badge variant={account?.apiKey ? "default" : "secondary"}>
                        {account?.apiKey ? "Configured" : "Pending"}
                      </Badge>
                    </div>

                    {account?.apiKey && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-gray-700 mb-2">API Key:</div>
                          <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {account.apiKey.substring(0, 20)}...
                          </code>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleAPISetup}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Configuring API...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Configure API
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-4">
              <div className="text-center">
                <Webhook className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Webhook Configuration
                </h3>
                <p className="text-gray-600 mb-6">
                  Set up webhooks to receive messages and status updates.
                </p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Webhook URL
                      </label>
                      <Input
                        value={`${window.location.origin}/api/v1/whatsapp/webhook`}
                        readOnly
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        This URL will receive all WhatsApp messages and status updates.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <MessageSquare className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-sm font-medium text-blue-900">Message Webhook</div>
                        <div className="text-xs text-blue-700">Incoming messages</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="text-sm font-medium text-green-900">Status Webhook</div>
                        <div className="text-xs text-green-700">Delivery status</div>
                      </div>
                    </div>

                    <Button
                      onClick={handleWebhookSetup}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Configuring Webhook...
                        </>
                      ) : (
                        <>
                          <Webhook className="h-4 w-4 mr-2" />
                          Configure Webhook
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-4">
              <div className="text-center">
                <TestTube className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Testing & Verification
                </h3>
                <p className="text-gray-600 mb-6">
                  Test your WhatsApp Business setup to ensure everything is working correctly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <MessageSquare className="h-6 w-6 text-blue-500" />
                      <h4 className="font-medium text-gray-900">Send Test Message</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Send a test message to verify your setup is working.
                    </p>
                    <Button
                      onClick={() => setShowTestDialog(true)}
                      className="w-full"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Test Message
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe className="h-6 w-6 text-green-500" />
                      <h4 className="font-medium text-gray-900">Webhook Test</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Test webhook connectivity and message delivery.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      <Webhook className="h-4 w-4 mr-2" />
                      Test Webhook
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {account?.status === 'ACTIVE' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your WhatsApp Business setup is complete and active!
                    You can now start creating campaigns and sending messages.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    const progress = ((currentStep + 1) / SETUP_STEPS.length) * 100;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">
            Setup Progress
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2 mb-6" />

        <div className="grid grid-cols-7 gap-2">
          {SETUP_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = step.completed;
            const isCurrent = index === currentStep;
            const isClickable = isCompleted || index <= currentStep;

            return (
              <div key={step.id} className="text-center">
                <button
                  onClick={() => isClickable && setCurrentStep(index)}
                  disabled={!isClickable}
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white shadow-lg'
                      : isCurrent
                      ? 'bg-blue-500 text-white shadow-lg animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                  } ${isClickable ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </button>
                <div className="text-xs font-medium text-gray-900 mb-1">
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">
                  {step.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <MessageSquare className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Business Setup
          </h1>
          <p className="text-gray-600">
            Configure your WhatsApp Business account to start sending messages
          </p>
        </div>

        {/* Account Overview - Show when account exists */}
        {account && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">
                  WhatsApp Account Overview
                </h3>
                <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {account.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Account Name</div>
                  <div className="font-medium text-gray-900">{account.accountName}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Phone Number</div>
                  <div className="font-medium text-gray-900">{account.displayPhoneNumber}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Provider</div>
                  <div className="font-medium text-gray-900">
                    {selectedProvider?.name || 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => setCurrentStep(6)}
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Go to Testing
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Progress */}
        {renderStepIndicator()}

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep === 0 && (
              <Button
                onClick={handleBusinessInfoSubmit}
                disabled={isSubmitting || !setupData.businessName || !setupData.businessCategory}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving Business Info...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save & Continue to Provider Selection
                  </>
                )}
              </Button>
            )}

            {currentStep === 1 && (
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedProvider}
              >
                <Check className="h-4 w-4 mr-2" />
                Continue to Credentials
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                onClick={handleProviderCredentialsSubmit}
                disabled={isSubmitting || !selectedProvider}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving Credentials...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Credentials & Continue
                  </>
                )}
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                onClick={handlePhoneVerification}
                disabled={isVerifying || !setupData.phoneNumber}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Verify Phone
                  </>
                )}
              </Button>
            )}

            {currentStep === 4 && (
              <div className="flex gap-3">
                <Button
                  onClick={handleAPISetup}
                  disabled={isSubmitting || account?.status === 'ACTIVE'}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Configuring...
                    </>
                  ) : account?.status === 'ACTIVE' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      API Configured
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Setup API
                    </>
                  )}
                </Button>
                {account?.status === 'ACTIVE' && (
                  <Button
                    onClick={() => setCurrentStep(5)}
                    variant="outline"
                  >
                    Continue to Webhook Setup
                  </Button>
                )}
                <Button
                  onClick={() => setCurrentStep(6)}
                  variant="secondary"
                >
                  Skip to Testing
                </Button>
              </div>
            )}

            {currentStep === 5 && (
              <div className="flex gap-3">
                <Button
                  onClick={handleWebhookSetup}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Configuring...
                    </>
                  ) : (
                    <>
                      <Webhook className="h-4 w-4 mr-2" />
                      Setup Webhook
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setCurrentStep(6)}
                  variant="secondary"
                >
                  Skip to Testing
                </Button>
              </div>
            )}

            {currentStep === 6 && (
              <Button
                onClick={() => window.location.href = '/whatsapp/campaigns'}
                className="bg-green-600 hover:bg-green-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Creating Campaigns
              </Button>
            )}
          </div>
        </div>

        {/* Test Message Dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogHeader>
            <DialogTitle>Send Test Message</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Recipient Phone Number *
                </label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Enter the phone number to send the test message to (include country code)
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Test Message
                </label>
                <Textarea
                  placeholder="Enter a test message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleTestMessage} className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Test Message
                </Button>
                <Button variant="outline" onClick={() => setShowTestDialog(false)}>
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
