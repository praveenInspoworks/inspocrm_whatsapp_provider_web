import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Upload, Image, Video, FileText, Plus, Minus, Eye, Send,
  CheckCircle, AlertCircle, Settings, Users, MessageSquare,
  Smartphone, Monitor, ZoomIn, ZoomOut, RotateCcw,
  Phone, Building, User, Save, Play, ArrowLeft, ArrowRight,
  Link, Copy, Sparkles, Bold, Italic, Underline, Palette,
  Type, AlignLeft, AlignCenter, AlignRight, X
} from 'lucide-react';
import { ContactSelector } from '../crm/ContactSelector';
import { WhatsAppBusinessSetup } from './WhatsAppBusinessSetup';
import { useToast } from '@/hooks/use-toast';
import { get, post, uploadFile } from '@/services/apiService';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyId?: number | null;
  position?: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isActive: boolean;
  companyName?: string;
  industry?: string;
  priority?: string;
  notes?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

interface WhatsAppBusinessAccount {
  id: number;
  accountName: string;
  accountId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  status: string;
  isActive: boolean;
}

interface TemplateFormData {
  businessAccountId: number | null;
  templateName: string;
  templateType: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  languageCode: string;
  headerType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE';
  headerText: string;
  headerMediaUrl: string;
  headerMediaFile: File | null;
  messageBody: string;
  footerText: string;
  buttons: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

export default function WhatsAppTemplateCreator() {
  const { toast } = useToast();
  const [businessAccounts, setBusinessAccounts] = useState<WhatsAppBusinessAccount[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState('14');
  const [selectedFontFamily, setSelectedFontFamily] = useState('normal');
  const messageBodyRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    businessAccountId: null,
    templateName: '',
    templateType: 'MARKETING',
    languageCode: 'en',
    headerType: 'NONE',
    headerText: '',
    headerMediaUrl: '',
    headerMediaFile: null,
    messageBody: '',
    footerText: '',
    buttons: []
  });

  useEffect(() => {
    loadBusinessAccounts(false);
  }, []);

  const applyTextFormatting = (formatType: string, value?: string) => {
    const textarea = messageBodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) return;

    let formattedText = '';
    switch (formatType) {
      case 'bold':
        formattedText = `*${selectedText}*`;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      default:
        formattedText = selectedText;
    }

    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    handleInputChange('messageBody', newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const loadBusinessAccounts = async (showPopupOnNoAccounts = true) => {
    try {
      const accounts = await get<WhatsAppBusinessAccount[]>('/api/v1/whatsapp/accounts');
      setBusinessAccounts(accounts);
      if (accounts.length === 0 && showPopupOnNoAccounts) {
        setShowBusinessSetup(true);
      } else {
        const activeAccount = accounts.find((acc: WhatsAppBusinessAccount) =>
          acc.status === 'ACTIVE' || acc.status === 'VERIFIED'
        );
        if (activeAccount) {
          setFormData(prev => ({ ...prev, businessAccountId: activeAccount.id }));
        }
      }
    } catch (error) {
      console.error('Failed to load business accounts:', error);
    }
  };

  const handleInputChange = (field: keyof TemplateFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMediaUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    const maxSize = 16 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image, video, or document file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 16MB.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await uploadFile('/api/v1/whatsapp/upload/whatsapp-media', file);
      handleInputChange('headerMediaUrl', result.url);
      handleInputChange('headerMediaFile', file);
      toast({
        title: "Media uploaded successfully",
        description: "Your media file has been uploaded and is ready for preview."
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload media file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addButton = () => {
    if (formData.buttons.length >= 3) {
      toast({
        title: "Maximum buttons reached",
        description: "WhatsApp allows maximum 3 buttons per template.",
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      buttons: [...prev.buttons, { type: 'QUICK_REPLY', text: '', url: '', phoneNumber: '' }]
    }));
  };

  const removeButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const updateButton = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons.map((button, i) =>
        i === index ? { ...button, [field]: value } : button
      )
    }));
  };

  const validateTemplate = (): string[] => {
    const errors: string[] = [];

    if (!formData.businessAccountId) {
      errors.push("Please select a WhatsApp business account");
    }

    if (!formData.templateName.trim()) {
      errors.push("Template name is required");
    }

    if (!formData.messageBody.trim()) {
      errors.push("Message body is required");
    }

    if (formData.headerType !== 'NONE' && formData.headerType !== 'TEXT' && !formData.headerMediaUrl) {
      errors.push("Media file is required for selected header type");
    }

    if (formData.headerType === 'TEXT' && !formData.headerText.trim()) {
      errors.push("Header text is required");
    }

    formData.buttons.forEach((button, index) => {
      if (!button.text.trim()) {
        errors.push(`Button ${index + 1} text is required`);
      }
      if (button.type === 'URL' && !button.url) {
        errors.push(`Button ${index + 1} URL is required`);
      }
      if (button.type === 'PHONE_NUMBER' && !button.phoneNumber) {
        errors.push(`Button ${index + 1} phone number is required`);
      }
    });

    return errors;
  };

  const checkSubscriptionAndAccount = async () => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        if (businessAccounts.length === 0) {
          return {
            allowed: false,
            title: "WhatsApp Account Required",
            message: "No WhatsApp Business accounts found. Please connect your account first.",
            showAccountSetup: true
          };
        }
        if (!formData.businessAccountId) {
          return {
            allowed: false,
            title: "Select WhatsApp Account",
            message: "Please select a WhatsApp Business account to create templates."
          };
        }
        return { allowed: true };
      }

      const subscriptionResponse = await get('/api/v1/subscription/status');

      if (!subscriptionResponse.active) {
        return {
          allowed: false,
          title: "Subscription Required",
          message: "Please upgrade your subscription to create templates."
        };
      }

      if (businessAccounts.length === 0) {
        return {
          allowed: false,
          title: "WhatsApp Account Required",
          message: "No WhatsApp Business accounts found. Please connect your account first.",
          showAccountSetup: true
        };
      }

      if (!formData.businessAccountId) {
        return {
          allowed: false,
          title: "Select WhatsApp Account",
          message: "Please select a WhatsApp Business account to create templates."
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Subscription check failed:', error);
      const isDevelopment = process.env.NODE_ENV === 'development';
      return {
        allowed: isDevelopment,
        title: isDevelopment ? "" : "Service Unavailable",
        message: isDevelopment ? "" : "Unable to verify subscription. Please try again later."
      };
    }
  };

  const createTemplate = async () => {
    const errors = validateTemplate();
    if (errors.length > 0) {
      toast({
        title: "Validation failed",
        description: errors.join('. '),
        variant: "destructive"
      });
      return;
    }

    const subscriptionCheck = await checkSubscriptionAndAccount();
    if (!subscriptionCheck.allowed) {
      toast({
        title: subscriptionCheck.title,
        description: subscriptionCheck.message,
        variant: "destructive"
      });
      if (subscriptionCheck.showAccountSetup) {
        setShowBusinessSetup(true);
      }
      return;
    }

    setIsLoading(true);
    try {
      const components = [];

      if (formData.headerType !== 'NONE') {
        if (formData.headerType === 'TEXT' && formData.headerText) {
          components.push({
            type: 'HEADER',
            text: formData.headerText
          });
        } else if (formData.headerMediaUrl) {
          components.push({
            type: 'HEADER',
            format: formData.headerType.toUpperCase(),
            example: {
              header_handle: [formData.headerMediaUrl]
            }
          });
        }
      }

      components.push({
        type: 'BODY',
        text: formData.messageBody
      });

      if (formData.footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: formData.footerText
        });
      }

      formData.buttons.forEach((button) => {
        const buttonComponent: any = {
          type: 'BUTTONS',
          text: button.text
        };

        if (button.type === 'URL' && button.url) {
          buttonComponent.url = button.url;
        } else if (button.type === 'PHONE_NUMBER' && button.phoneNumber) {
          buttonComponent.phoneNumber = button.phoneNumber;
        }

        components.push(buttonComponent);
      });

      const templateData = {
        businessAccountId: formData.businessAccountId,
        templateName: formData.templateName,
        templateType: formData.templateType,
        languageCode: formData.languageCode,
        components: components
      };

      await post('/api/v1/whatsapp/templates', templateData);
      toast({
        title: "Template created successfully",
        description: "Your template has been submitted for approval."
      });
    } catch (error: any) {
      console.error('Create template error:', error);
      toast({
        title: "Failed to create template",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessages = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact to send messages to.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.businessAccountId) {
      toast({
        title: "Business account required",
        description: "Please select a WhatsApp business account first.",
        variant: "destructive"
      });
      return;
    }

    const subscriptionCheck = await checkSubscriptionAndAccount();
    if (!subscriptionCheck.allowed) {
      toast({
        title: subscriptionCheck.title,
        description: subscriptionCheck.message,
        variant: "destructive"
      });
      if (subscriptionCheck.showAccountSetup) {
        setShowBusinessSetup(true);
      }
      return;
    }

    setIsLoading(true);
    try {
      // Create template variables for personalization including template data
      const templateVariables: { [key: string]: any } = {};

      selectedContacts.forEach((contact, index) => {
        templateVariables[contact.phone || ''] = {
          // Contact personalization data
          name: contact.firstName + ' ' + contact.lastName,
          company: contact.companyName || 'Your Company',
          position: contact.position || '',
          department: contact.department || '',

          // Template data
          templateName: formData.templateName,
          headerType: formData.headerType,
          headerText: formData.headerText || '',
          headerMediaUrl: formData.headerMediaUrl || '',
          messageBody: formData.messageBody,
          footerText: formData.footerText || '',
          buttons: formData.buttons.map(button => ({
            type: button.type,
            text: button.text,
            ...(button.url && { url: button.url }),
            ...(button.phoneNumber && { phoneNumber: button.phoneNumber })
          })),

          // Template metadata
          templateType: formData.templateType,
          languageCode: formData.languageCode
        };
      });

      const campaignData = {
        businessAccountId: formData.businessAccountId,
        campaignName: `${formData.templateName} Campaign`,
        templateId: 'template_id', // This should be the actual template ID from created template
        recipientPhoneNumbers: selectedContacts.map(c => c.phone),
        templateVariables: templateVariables
      };

      await post('/api/v1/whatsapp/campaigns', campaignData);
      toast({
        title: "Messages sent successfully",
        description: `Messages sent to ${selectedContacts.length} contacts.`
      });
      setShowContactSelector(false);
      setSelectedContacts([]);
    } catch (error: any) {
      console.error('Send messages error:', error);
      toast({
        title: "Failed to send messages",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAccount = businessAccounts.find(acc => acc.id === formData.businessAccountId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  WhatsApp Studio
                </h1>
                <p className="text-sm text-gray-600 font-medium">Professional Message Templates</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {businessAccounts.length === 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBusinessSetup(true)}
                  className="bg-white/80 hover:bg-white border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <Link className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium">Link Account</span>
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  {selectedAccount && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-green-50/80 rounded-full border border-green-200/50 backdrop-blur-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                      <span className="text-sm font-semibold text-green-800">{selectedAccount.accountName}</span>
                    </div>
                  )}
                  <Select
                    value={formData.businessAccountId?.toString() || ""}
                    onValueChange={(value) => handleInputChange('businessAccountId', parseInt(value))}
                  >
                    <SelectTrigger className="w-48 bg-white/80 hover:bg-white border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${account.status === 'ACTIVE' || account.status === 'VERIFIED' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span>{account.accountName}</span>
                            <span className="text-xs text-gray-500">({account.displayPhoneNumber})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBusinessSetup(true)}
                    className="bg-white/80 hover:bg-white border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-2 text-green-600" />
                    <span className="font-medium">Add Account</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 min-h-[calc(100vh-8rem)]">

          {/* Left Column - Template Editor */}
          <div className="xl:col-span-3 space-y-6 overflow-y-auto">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent font-bold">
                    Message Template Builder
                  </span>
                </CardTitle>
                <p className="text-sm text-gray-600 ml-13">Create professional WhatsApp message templates with personalization</p>
              </CardHeader>
              <CardContent className="p-8 space-y-8">

                {/* Template Name */}
                <div className="space-y-3">
                  <Label htmlFor="templateName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Save className="w-4 h-4 text-blue-500" />
                    Template Name
                  </Label>
                  <Input
                    id="templateName"
                    value={formData.templateName}
                    onChange={(e) => handleInputChange('templateName', e.target.value)}
                    placeholder="e.g., Welcome Message, Product Update, Customer Support"
                    className="h-12 text-base border-2 border-gray-200 focus:border-blue-400 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 bg-gray-50/50"
                  />
                </div>

                {/* Header Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Image className="w-4 h-4 text-white" />
                      </div>
                      Message Header
                    </Label>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                        Use {'{{name}}'}, {'{{company}}'}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                        Optional
                      </Badge>
                    </div>
                  </div>

                  <RadioGroup
                    value={formData.headerType}
                    onValueChange={(value: any) => handleInputChange('headerType', value)}
                    className="grid grid-cols-2 md:grid-cols-5 gap-4"
                  >
                    {[
                      { value: 'NONE', label: 'None', icon: Minus },
                      { value: 'TEXT', label: 'Text', icon: FileText },
                      { value: 'IMAGE', label: 'Image', icon: Image },
                      { value: 'VIDEO', label: 'Video', icon: Video },
                      { value: 'DOCUMENT', label: 'Document', icon: FileText }
                    ].map(({ value, label, icon: Icon }) => (
                      <div key={value} className="relative">
                        <div className={`flex flex-col items-center space-y-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                          formData.headerType === value
                            ? 'border-blue-400 bg-blue-50 shadow-lg'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                          <RadioGroupItem value={value} id={value.toLowerCase()} className="sr-only" />
                          <Icon className={`w-6 h-6 ${formData.headerType === value ? 'text-blue-600' : 'text-gray-500'}`} />
                          <Label htmlFor={value.toLowerCase()} className={`text-sm font-medium cursor-pointer ${
                            formData.headerType === value ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {label}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  {formData.headerType === 'TEXT' && (
                    <div className="space-y-3 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <Label className="text-sm font-semibold text-purple-800">Header Text</Label>
                      <Input
                        value={formData.headerText}
                        onChange={(e) => handleInputChange('headerText', e.target.value)}
                        placeholder="🎉 Welcome back, {{name}}!"
                        className="h-12 text-base border-2 border-purple-200 focus:border-purple-400 rounded-xl bg-white"
                      />
                      <p className="text-xs text-purple-600 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        This text appears at the very top of your message
                      </p>
                    </div>
                  )}

                  {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.headerType) && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-all duration-500 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg">
                        <input
                          type="file"
                          accept={
                            formData.headerType === 'IMAGE' ? 'image/*' :
                            formData.headerType === 'VIDEO' ? 'video/*' : '.pdf,.doc,.docx'
                          }
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleMediaUpload(file);
                          }}
                          className="hidden"
                          id="media-upload"
                        />
                        <label htmlFor="media-upload" className="cursor-pointer block">
                          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                            <Upload className="w-10 h-10 text-blue-600" />
                          </div>
                          <p className="text-xl font-bold text-gray-800 mb-3">
                            Upload {formData.headerType.toLowerCase()}
                          </p>
                          <p className="text-gray-600 mb-4 text-sm">
                            Drag & drop or click to browse your files
                          </p>
                          <div className="flex justify-center gap-4 text-xs text-gray-500">
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                              Max 16MB
                            </span>
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                              {formData.headerType === 'IMAGE' ? 'JPG, PNG, GIF' :
                               formData.headerType === 'VIDEO' ? 'MP4' : 'PDF, DOC, DOCX'}
                            </span>
                          </div>
                        </label>
                      </div>

                      {formData.headerMediaUrl && (
                        <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-green-900">Media uploaded successfully</p>
                            <p className="text-sm text-green-700">Ready for preview and sending</p>
                          </div>
                          <Badge className="bg-green-500 hover:bg-green-600">✓ Ready</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="space-y-4">
                  <Label className="text-lg font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    Message Body <span className="text-red-500">*</span>
                  </Label>

                  {/* Text Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Bold"
                        onClick={() => applyTextFormatting('bold')}
                      >
                        <Bold className="w-4 h-4 text-green-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Italic"
                        onClick={() => applyTextFormatting('italic')}
                      >
                        <Italic className="w-4 h-4 text-green-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Underline"
                        onClick={() => applyTextFormatting('underline')}
                      >
                        <Underline className="w-4 h-4 text-green-700" />
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      ref={messageBodyRef}
                      id="messageBody"
                      value={formData.messageBody}
                      onChange={(e) => handleInputChange('messageBody', e.target.value)}
                      placeholder="Hi {{name}},

Thank you for choosing {{company}}! We're excited to have you as part of our community.

Your account is now active and ready to use. Feel free to explore all the features we offer.

Best regards,
The {{company}} Team"
                      rows={8}
                      className="text-base border-2 border-gray-200 focus:border-green-400 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-green-100 bg-gray-50/50 resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-lg border">
                      {formData.messageBody.length} characters
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      Use {'{{name}}'} for personalization
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                      Use {'{{company}}'} for branding
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Preview shows example values
                    </Badge>
                  </div>
                </div>

                {/* Footer */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">i</span>
                    </div>
                    Footer Text
                  </Label>
                  <Input
                    id="footerText"
                    value={formData.footerText}
                    onChange={(e) => handleInputChange('footerText', e.target.value)}
                    placeholder="Reply STOP to unsubscribe • Privacy Policy"
                    className="h-12 text-base border-2 border-gray-200 focus:border-gray-400 rounded-xl bg-gray-50/50"
                  />
                  <p className="text-xs text-gray-500">Optional footer text appears at the bottom of your message</p>
                </div>

                {/* Call-to-Action Buttons */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      Action Buttons
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addButton}
                      disabled={formData.buttons.length >= 3}
                      className="bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2 text-orange-600" />
                      <span className="font-medium text-orange-700">Add Button</span>
                    </Button>
                  </div>

                  {formData.buttons.map((button, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-xl p-6 space-y-4 bg-gradient-to-r from-orange-50/30 to-red-50/30 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-800 flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-orange-700">{index + 1}</span>
                          </div>
                          Action Button {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeButton(index)}
                          className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Button Type</Label>
                          <Select
                            value={button.type}
                            onValueChange={(value: any) => updateButton(index, 'type', value)}
                          >
                            <SelectTrigger className="h-12 bg-white border-2 border-gray-200 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="QUICK_REPLY">💬 Quick Reply</SelectItem>
                              <SelectItem value="URL">🌐 Visit Website</SelectItem>
                              <SelectItem value="PHONE_NUMBER">📞 Call Phone</SelectItem>
                              <SelectItem value="COPY_CODE">📋 Copy Code</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Button Text</Label>
                          <Input
                            value={button.text}
                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                            placeholder="e.g., Learn More, Contact Us"
                            className="h-12 bg-white border-2 border-gray-200 rounded-xl"
                          />
                        </div>

                        {button.type === 'URL' && (
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Website URL</Label>
                            <Input
                              value={button.url || ''}
                              onChange={(e) => updateButton(index, 'url', e.target.value)}
                              placeholder="https://yourwebsite.com"
                              className="h-12 bg-white border-2 border-gray-200 rounded-xl"
                            />
                          </div>
                        )}

                        {button.type === 'PHONE_NUMBER' && (
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                            <Input
                              value={button.phoneNumber || ''}
                              onChange={(e) => updateButton(index, 'phoneNumber', e.target.value)}
                              placeholder="+1234567890"
                              className="h-12 bg-white border-2 border-gray-200 rounded-xl"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {formData.buttons.length === 0 && (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                      <p className="text-lg font-medium text-gray-600 mb-2">No action buttons yet</p>
                      <p className="text-sm text-gray-500">Add buttons to make your message interactive</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={createTemplate}
                disabled={isLoading || !formData.templateName || !formData.messageBody}
                className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Creating Template...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-3" />
                    Create Template
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowContactSelector(true)}
                disabled={!formData.templateName || !formData.messageBody}
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 hover:border-green-300 text-green-700 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Send className="w-5 h-5 mr-3" />
                Send Campaign
              </Button>
            </div>
          </div>

          {/* Right Column - WhatsApp Preview */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm h-full rounded-3xl overflow-hidden">
              <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent font-bold">
                    WhatsApp Preview
                  </span>
                </CardTitle>
                <p className="text-sm text-gray-600 ml-13">Real-time mobile preview of your message</p>
              </CardHeader>
              <CardContent className="p-8 flex-1 flex items-center justify-center">
                {/* Mobile Phone Mockup */}
                <div className="relative">
                  {/* Phone Frame */}
                  <div className="w-80 h-[600px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl relative overflow-hidden">
                    {/* Screen */}
                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                      {/* Status Bar */}
                      <div className="h-6 bg-gray-900 flex items-center justify-between px-6 text-white text-xs">
                        <span>9:41</span>
                        <div className="flex gap-1">
                          <div className="w-4 h-2 bg-white rounded-sm"></div>
                          <div className="w-4 h-2 bg-white rounded-sm"></div>
                          <div className="w-3 h-2 bg-white rounded-sm"></div>
                        </div>
                      </div>

                      {/* WhatsApp Interface */}
                      <div className="h-[calc(100%-1.5rem)] bg-gray-50 p-4 flex flex-col">
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">Your Business</p>
                            <p className="text-xs text-green-600">Online</p>
                          </div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 space-y-4 overflow-y-auto px-2">
                          {/* Incoming Message */}
                          <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 max-w-[280px] shadow-sm border border-gray-100">
                              {/* Header Display */}
                              {formData.headerType !== 'NONE' && (
                                <div className="mb-3 pb-2 border-b border-gray-200">
                                  {formData.headerType === 'TEXT' && formData.headerText && (
                                    <p className="text-sm font-bold text-gray-900 mb-2">
                                      {formData.headerText.replace(/\{\{name\}\}/g, 'John').replace(/\{\{company\}\}/g, 'Your Company')}
                                    </p>
                                  )}
                                  {formData.headerMediaUrl && (
                                    <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center mb-2 overflow-hidden">
                                      {formData.headerType === 'IMAGE' ? (
                                        <Image className="w-8 h-8 text-gray-400" />
                                      ) : formData.headerType === 'VIDEO' ? (
                                        <Video className="w-8 h-8 text-gray-400" />
                                      ) : (
                                        <FileText className="w-8 h-8 text-gray-400" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Message Body */}
                              <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                {formData.messageBody
                                  .replace(/\{\{name\}\}/g, 'John')
                                  .replace(/\{\{company\}\}/g, 'Your Company') ||
                                'Your personalized message will appear here...'}
                              </div>

                              {/* Footer */}
                              {formData.footerText && (
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  {formData.footerText}
                                </p>
                              )}

                              {/* Buttons */}
                              {formData.buttons.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {formData.buttons.map((button, index) => (
                                    <button
                                      key={index}
                                      className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-sm text-green-800 transition-colors"
                                    >
                                      {button.text || `Button ${index + 1}`}
                                    </button>
                                  ))}
                                </div>
                              )}

                              <p className="text-xs text-gray-400 mt-2">12:34 PM</p>
                            </div>
                          </div>
                        </div>

                        {/* Message Input Area */}
                        <div className="mt-4 p-3 bg-white rounded-xl border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 h-8 bg-gray-100 rounded-full"></div>
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <Send className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Business Account Setup Dialog */}
      <Dialog open={showBusinessSetup} onOpenChange={setShowBusinessSetup}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <WhatsAppBusinessSetup />
        </DialogContent>
      </Dialog>

      {/* Contact Selector Dialog - FIXED */}
      <Dialog open={showContactSelector} onOpenChange={setShowContactSelector}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
          {/* Dialog Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Select Recipients for WhatsApp Campaign
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose contacts to send your WhatsApp message template to
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContactSelector(false)}
                className="hover:bg-white/80 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Contact Selector - Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <ContactSelector
              onContactsSelected={setSelectedContacts}
              selectedContacts={selectedContacts}
              showEmail={false}
              showWhatsApp={true}
              maxSelections={1000}
            />
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-t bg-white shadow-lg">
            <div className="text-sm text-gray-600 font-medium">
              {selectedContacts.length > 0 ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-700">{selectedContacts.length}</span> contact{selectedContacts.length !== 1 ? 's' : ''} selected
                </span>
              ) : (
                <span className="text-gray-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  No contacts selected
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowContactSelector(false)}
                className="px-6 hover:bg-gray-100 border-2"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={sendMessages}
                disabled={selectedContacts.length === 0 || isLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {selectedContacts.length || 0}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
