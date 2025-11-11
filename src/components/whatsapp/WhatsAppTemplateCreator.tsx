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
  Type, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { WhatsAppChatPreview } from './WhatsAppChatPreview';
import { ContactSelector } from '../crm/ContactSelector';
import { WhatsAppBusinessSetup } from './WhatsAppBusinessSetup';
import { useToast } from '@/hooks/use-toast';
import { get, post, uploadFile } from '@/services/apiService';

// Contact type matching ContactSelector's interface
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  tags?: string[];
  preferredContactMethod: 'email' | 'whatsapp' | 'both';
  status: 'active' | 'inactive' | 'do_not_contact';
  lastInteraction?: Date;
  avatar?: string;
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

  // Header
  headerType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE';
  headerText: string;
  headerMediaUrl: string;
  headerMediaFile: File | null;

  // Body
  messageBody: string;

  // Footer
  footerText: string;

  // Buttons
  buttons: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

// Using the Contact interface from ContactSelector

export function WhatsAppTemplateCreator() {
  const { toast } = useToast();
  const [businessAccounts, setBusinessAccounts] = useState<WhatsAppBusinessAccount[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
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

  // Load business accounts on component mount (don't show popup automatically)
  useEffect(() => {
    loadBusinessAccounts(false);
  }, []);

  // Text formatting functions for textarea
  const applyTextFormatting = (formatType: string, value?: string) => {
    const textarea = messageBodyRef.current as HTMLTextAreaElement;
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
      case 'color':
        // For color, we'll just apply it visually in the preview
        formattedText = selectedText;
        break;
      default:
        formattedText = selectedText;
    }

    // Replace the selected text with formatted text
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    handleInputChange('messageBody', newValue);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const handleBold = () => applyTextFormatting('bold');
  const handleItalic = () => applyTextFormatting('italic');
  const handleUnderline = () => applyTextFormatting('underline');

  const handleFontSizeChange = (size: string) => {
    setSelectedFontSize(size);
    // Font size is visual only in preview
  };

  const handleColorChange = (color: string) => {
    applyTextFormatting('color', color);
  };

  const handleAlignLeft = () => {
    // Alignment is visual only in preview
  };

  const handleAlignCenter = () => {
    // Alignment is visual only in preview
  };

  const handleAlignRight = () => {
    // Alignment is visual only in preview
  };

  const handleFontFamilyChange = (font: string) => {
    setSelectedFontFamily(font);
    // Font family is visual only in preview
  };

  // Handle textarea input
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange('messageBody', e.target.value);
  };

  const loadBusinessAccounts = async (showPopupOnNoAccounts = true) => {
    try {
      const accounts = await get<WhatsAppBusinessAccount[]>('/api/v1/whatsapp/accounts');
      setBusinessAccounts(accounts);
      if (accounts.length === 0 && showPopupOnNoAccounts) {
        setShowBusinessSetup(true);
      } else {
        // Auto-select first active account
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

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    const maxSize = 16 * 1024 * 1024; // 16MB

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
      // Upload to backend using apiService
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
      buttons: [...prev.buttons, { type: 'QUICK_REPLY', text: '' }]
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

    // Validate buttons
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
      // Check subscription status
      const subscriptionResponse = await get('/api/v1/subscription/status');

      // For development, skip payment validation
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        // In development, only check if account is linked
        if (!formData.businessAccountId) {
          return {
            allowed: false,
            title: "WhatsApp Account Required",
            message: "Please connect your WhatsApp Business account to create templates.",
            showAccountSetup: true
          };
        }
        return { allowed: true };
      }

      // Production validation
      if (!subscriptionResponse.active) {
        return {
          allowed: false,
          title: "Subscription Required",
          message: "Please upgrade your subscription to create WhatsApp templates.",
          showAccountSetup: false
        };
      }

      if (!formData.businessAccountId) {
        return {
          allowed: false,
          title: "WhatsApp Account Required",
          message: "Please connect your WhatsApp Business account to create templates.",
          showAccountSetup: true
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Subscription check failed:', error);
      // In case of error, allow in development, block in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      return {
        allowed: isDevelopment,
        title: isDevelopment ? "" : "Service Unavailable",
        message: isDevelopment ? "" : "Unable to verify subscription. Please try again later.",
        showAccountSetup: false
      };
    }
  };

  const createTemplate = async () => {
    // First validate basic form data
    const errors = validateTemplate();
    if (errors.length > 0) {
      toast({
        title: "Validation failed",
        description: errors.join('. '),
        variant: "destructive"
      });
      return;
    }

    // Check subscription and account status
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
      const templateData = {
        businessAccountId: formData.businessAccountId,
        templateName: formData.templateName,
        templateType: formData.templateType,
        languageCode: formData.languageCode,
        headerType: formData.headerType,
        headerText: formData.headerText,
        headerMediaUrl: formData.headerMediaUrl,
        messageContent: formData.messageBody,
        footerText: formData.footerText,
        buttons: formData.buttons
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

    // Check subscription and account status
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
      // Create campaign with selected contacts
      const campaignData = {
        campaignName: `${formData.templateName} Campaign`,
        templateId: 'template_id', // From created template
        recipientPhoneNumbers: selectedContacts.map(c => c.phone),
        templateVariables: {} // Add variable replacement logic
      };

      await post('/api/v1/whatsapp/campaigns', campaignData);
      toast({
        title: "Messages sent successfully",
        description: `Messages sent to ${selectedContacts.length} contacts.`
      });
      // Reset form or navigate away
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



  // Build preview message content for real-time preview
  const buildPreviewMessage = () => {
    let message = formData.messageBody;

    // Add header if present
    if (formData.headerType === 'TEXT' && formData.headerText) {
      message = `*${formData.headerText}*\n\n${message}`;
    }

    // Add footer if present
    if (formData.footerText) {
      message += `\n\n_${formData.footerText}_`;
    }

    // Add buttons preview
    if (formData.buttons.length > 0) {
      message += '\n\n';
      formData.buttons.forEach((button, index) => {
        message += `🔘 ${button.text}\n`;
      });
    }

    return message;
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
              {selectedAccount && (
                <div className="flex items-center gap-3 px-4 py-2 bg-green-50/80 rounded-full border border-green-200/50 backdrop-blur-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                  <span className="text-sm font-semibold text-green-800">{selectedAccount.accountName}</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBusinessSetup(true)}
                className="bg-white/80 hover:bg-white border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Link className="w-4 h-4 mr-2 text-green-600" />
                <span className="font-medium">{selectedAccount ? 'Switch Account' : 'Connect Account'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Professional Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 min-h-[calc(100vh-8rem)]">

          {/* Left Column - Template Editor (3/5 width) */}
          <div className="xl:col-span-3 space-y-6 overflow-y-auto">
            {/* Template Editor Card */}
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

                {/* Header Section - Enhanced */}
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

                  {/* Header Content Based on Type */}
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

                {/* Message Body - Enhanced */}
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
                        onClick={handleBold}
                      >
                        <Bold className="w-4 h-4 text-green-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Italic"
                        onClick={handleItalic}
                      >
                        <Italic className="w-4 h-4 text-green-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Underline"
                        onClick={handleUnderline}
                      >
                        <Underline className="w-4 h-4 text-green-700" />
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6 bg-green-300" />

                    <div className="flex items-center gap-1">
                      <Select value={selectedFontSize} onValueChange={handleFontSizeChange}>
                        <SelectTrigger className="h-8 w-16 text-xs bg-white border-green-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12px</SelectItem>
                          <SelectItem value="14">14px</SelectItem>
                          <SelectItem value="16">16px</SelectItem>
                          <SelectItem value="18">18px</SelectItem>
                          <SelectItem value="20">20px</SelectItem>
                          <SelectItem value="24">24px</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-100"
                          title="Text Color"
                        >
                          <Palette className="w-4 h-4 text-green-700" />
                        </Button>
                        <input
                          type="color"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Choose text color"
                          onChange={(e) => handleColorChange(e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator orientation="vertical" className="h-6 bg-green-300" />

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Align Left"
                        onClick={handleAlignLeft}
                      >
                        <AlignLeft className="w-4 h-4 text-green-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Align Center"
                        onClick={handleAlignCenter}
                      >
                        <AlignCenter className="w-4 h-4 text-green-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Align Right"
                        onClick={handleAlignRight}
                      >
                        <AlignRight className="w-4 h-4 text-green-700" />
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6 bg-green-300" />

                    <div className="flex items-center gap-1">
                      <Select value={selectedFontFamily} onValueChange={handleFontFamilyChange}>
                        <SelectTrigger className="h-8 w-20 text-xs bg-white border-green-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">Times</SelectItem>
                          <SelectItem value="Courier New">Courier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      ref={messageBodyRef}
                      id="messageBody"
                      value={formData.messageBody}
                      onChange={handleTextareaChange}
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

                {/* Call-to-Action Buttons - Enhanced */}
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

            {/* Action Buttons - Enhanced */}
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

          {/* Right Column - WhatsApp Preview (2/5 width) */}
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
                                      {formData.headerMediaUrl.includes('.jpg') || formData.headerMediaUrl.includes('.jpeg') || formData.headerMediaUrl.includes('.png') || formData.headerMediaUrl.includes('.gif') ? (
                                        <img
                                          src={formData.headerMediaUrl}
                                          alt="Uploaded image"
                                          className="w-full h-full object-cover rounded-lg"
                                          onError={(e) => {
                                            const img = e.currentTarget as HTMLImageElement;
                                            img.style.display = 'none';
                                            const fallback = img.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                          }}
                                        />
                                      ) : formData.headerMediaUrl.includes('.mp4') || formData.headerMediaUrl.includes('.avi') || formData.headerMediaUrl.includes('.mov') ? (
                                        <div className="text-center">
                                          <Video className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                          <p className="text-xs text-gray-500">Video</p>
                                        </div>
                                      ) : formData.headerMediaUrl.includes('.pdf') || formData.headerMediaUrl.includes('.doc') || formData.headerMediaUrl.includes('.docx') ? (
                                        <div className="text-center">
                                          <FileText className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                          <p className="text-xs text-gray-500">Document</p>
                                        </div>
                                      ) : (
                                        <div className="text-center">
                                          <FileText className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                          <p className="text-xs text-gray-500">File</p>
                                        </div>
                                      )}
                                      {/* Fallback for failed image loads */}
                                      <div className="text-center" style={{ display: 'none' }}>
                                        <Image className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs text-gray-500">Media</p>
                                      </div>
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

      {/* Contact Selector Dialog */}
      <Dialog open={showContactSelector} onOpenChange={setShowContactSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Recipients</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ContactSelector
              onContactsSelected={setSelectedContacts}
              selectedContacts={selectedContacts}
              showEmail={false}
              showWhatsApp={true}
              maxSelections={1000}
            />
          </div>
          {selectedContacts.length > 0 && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowContactSelector(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowContactSelector(false);
                  sendMessages();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
