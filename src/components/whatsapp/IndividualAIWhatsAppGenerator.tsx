import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Sparkles, CheckCircle, Edit3, Paperclip, Save,
  Users, Send, Calendar, ArrowLeft, Eye, Smartphone,
  Monitor, Wand2, Loader2, ThumbsUp, ThumbsDown,
  Upload, X, FileText, Image, Archive, Check,
  Settings, Palette, Target, Zap, Globe, Clock,
  Search, Filter, Plus, Minus, RotateCcw, ZoomIn, ZoomOut,
  User, Building, Star, Phone
} from 'lucide-react';
import { get, post } from '@/services/apiService';
import { WhatsAppChatPreview } from './WhatsAppChatPreview'; 
import { WhatsAppAdvancedScheduler } from './WhatsAppAdvancedScheduler';

// TypeScript Interfaces
interface ContentConfig {
  topic: string;
  targetAudience: string;
  brandVoiceId: number;
  category: WhatsAppCategory;
  callToAction?: string;
  keyPoints?: string[];
  tone: ContentTone;
  contentLength: ContentLength;
  keywordCount: number;
  includePersonalization: boolean;
  customPrompt?: string;
}

interface GeneratedWhatsAppContent {
  message: string;
  previewText: string;
  brandAlignmentScore: number;
  wordCount: number;
  suggestedEmojis: string[];
  personalizationTags: string[];
  characterCount: number;
  imageUrl?: string;
  imageGenerated?: boolean;
  suggestedActions?: string[];
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  company?: string;
  companyName?: string;
  status?: string;
  email?: string;
  position?: string;
}

interface BrandVoice {
  id: number;
  website?: string;
  logo?: string;
  tone: string;
  brandVoiceName: string;
  brandVoiceDescription: string;
  brandVoiceStyleDescription?: string;
  brandPhrases?: string[];
  brandKeywords?: string[];
  wordsToAvoid?: string[];
  industry?: string[];
  audience?: string[];
  colorPalette?: any;
  typography?: any;
}

// Enums
type WhatsAppCategory = 'PROMOTIONAL' | 'CUSTOMER_SERVICE' | 'ORDER_UPDATE' | 'APPOINTMENT' | 'NEWSLETTER' | 'RE_ENGAGEMENT';
type ContentTone = 'PROFESSIONAL' | 'CASUAL' | 'FRIENDLY' | 'AUTHORITATIVE' | 'CONVERSATIONAL' | 'EXCITING';
type ContentLength = 'SHORT' | 'MEDIUM' | 'LARGE';

const WHATSAPP_CATEGORIES = [
  { value: 'PROMOTIONAL' as WhatsAppCategory, label: 'Promotional', description: 'Product launches, offers, sales' },
  { value: 'CUSTOMER_SERVICE' as WhatsAppCategory, label: 'Customer Service', description: 'Support, inquiries, feedback' },
  { value: 'ORDER_UPDATE' as WhatsAppCategory, label: 'Order Updates', description: 'Order status, shipping, delivery' },
  { value: 'APPOINTMENT' as WhatsAppCategory, label: 'Appointments', description: 'Booking confirmations, reminders' },
  { value: 'NEWSLETTER' as WhatsAppCategory, label: 'Newsletter', description: 'Regular updates, industry news' },
  { value: 'RE_ENGAGEMENT' as WhatsAppCategory, label: 'Re-engagement', description: 'Win back inactive customers' }
];

const CONTENT_LENGTHS = [
  { value: 'SHORT' as ContentLength, label: 'Short', description: '50-100 characters, quick messages' },
  { value: 'MEDIUM' as ContentLength, label: 'Medium', description: '150-300 characters, balanced content' },
  { value: 'LARGE' as ContentLength, label: 'Large', description: '400-600 characters, detailed content' }
];

const CONTENT_TONES = [
  { value: 'PROFESSIONAL' as ContentTone, label: 'Professional', description: 'Formal business communication' },
  { value: 'CASUAL' as ContentTone, label: 'Casual', description: 'Friendly, relaxed tone' },
  { value: 'FRIENDLY' as ContentTone, label: 'Friendly', description: 'Warm and approachable' },
  { value: 'AUTHORITATIVE' as ContentTone, label: 'Authoritative', description: 'Confident and expert' },
  { value: 'CONVERSATIONAL' as ContentTone, label: 'Conversational', description: 'Like talking to a friend' },
  { value: 'EXCITING' as ContentTone, label: 'Exciting', description: 'Energetic and enthusiastic' }
];

export function IndividualAIWhatsAppGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Component State
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedWhatsAppContent | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [loadingBrandVoices, setLoadingBrandVoices] = useState(true);

  // Form Data State
  const [contentConfig, setContentConfig] = useState<ContentConfig>({
    topic: '',
    targetAudience: '',
    brandVoiceId: 0,
    category: 'PROMOTIONAL',
    callToAction: '',
    keyPoints: [],
    tone: 'PROFESSIONAL',
    contentLength: 'MEDIUM',
    keywordCount: 5,
    includePersonalization: true
  });

  // AI Generation Options - Simplified to one control
  const [includeImage, setIncludeImage] = useState(false);

  // Contact State
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');

  // WhatsApp Business Account State
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);
  const [loadingBusinessAccounts, setLoadingBusinessAccounts] = useState(true);
  const [selectedBusinessAccountId, setSelectedBusinessAccountId] = useState<number | null>(null);

  // UI State
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [zoom, setZoom] = useState(100);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<GeneratedWhatsAppContent | null>(null);

  // Send/Schedule State
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [trackDelivery, setTrackDelivery] = useState(true);
  const [trackReads, setTrackReads] = useState(true);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Steps Definition
  const steps = [
    { id: 'config', title: 'Content Configuration', description: 'Set up your WhatsApp message parameters' },
    { id: 'generate', title: 'AI Generation', description: 'Generate personalized WhatsApp content' },
    { id: 'review', title: 'Review & Edit', description: 'Approve and refine content' },
    { id: 'contacts', title: 'Select Recipients', description: 'Choose contacts to receive the message' },
    { id: 'send', title: 'Send or Schedule', description: 'Deliver your WhatsApp campaign' }
  ];

  // Load initial data
  useEffect(() => {
    loadBrandVoices();
    loadBusinessAccounts();
  }, []);



  const loadBrandVoices = async () => {
    try {
      setLoadingBrandVoices(true);
      const response = await get('/api/v1/brand-voices/all');
      const voices = response || [];
      setBrandVoices(voices);

      // Set default brand voice if available
      if (voices.length > 0 && !contentConfig.brandVoiceId) {
        setContentConfig(prev => ({ ...prev, brandVoiceId: voices[0].id }));
      }
    } catch (error) {
      console.error('Failed to load brand voices:', error);
      toast({
        title: "Warning",
        description: "Could not load brand voices. Using default settings.",
        variant: "destructive"
      });
    } finally {
      setLoadingBrandVoices(false);
    }
  };

  const loadBusinessAccounts = async () => {
    try {
      setLoadingBusinessAccounts(true);
      const response = await get('/api/v1/whatsapp/accounts');
      const accounts = response || [];
      setBusinessAccounts(accounts);

      // Set default business account if available
      if (accounts.length > 0 && !selectedBusinessAccountId) {
        setSelectedBusinessAccountId(accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load business accounts:', error);
      toast({
        title: "Warning",
        description: "Could not load WhatsApp business accounts. Please set up a business account first.",
        variant: "destructive"
      });
    } finally {
      setLoadingBusinessAccounts(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const params = new URLSearchParams();
      if (contactSearchTerm.trim()) {
        params.append('searchTerm', contactSearchTerm.trim());
      }
      params.append('page', '0');
      params.append('size', '100');
      params.append('sortBy', 'firstName');
      params.append('sortDirection', 'asc');

      const response = await get(`/api/v1/contacts?${params.toString()}`);
      const contacts = (response.data || []).filter((contact: Contact) =>
        contact.status === 'ACTIVE' && contact.phone
      );
      setAvailableContacts(contacts);

      // Auto-select all contacts if this is the first load and no search term
      if (contacts.length > 0 && selectedContacts.length === 0 && !contactSearchTerm.trim()) {
        setSelectedContacts(contacts);
        toast({
          title: "Contacts Loaded",
          description: `Loaded ${contacts.length} active contacts with phone numbers.`,
        });
      } else if (contacts.length > 0) {
        toast({
          title: "Contacts Loaded",
          description: `Found ${contacts.length} contacts matching your search.`,
        });
      } else {
        toast({
          title: "No Contacts Found",
          description: contactSearchTerm.trim()
            ? "No contacts match your search criteria."
            : "No active contacts with phone numbers found in your CRM.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts from CRM. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  // Generate AI Content
  const handleGenerateContent = async () => {
    if (!contentConfig.topic.trim() || !contentConfig.targetAudience.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both topic and target audience.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const selectedBrandVoice = brandVoices.find(bv => bv.id === contentConfig.brandVoiceId);

      // Choose endpoint based on whether image is requested
      const endpoint = includeImage
        ? '/api/v1/whatsapp/content/generate-with-image'
        : '/api/v1/whatsapp/content/generate';

      const requestData = {
        topic: contentConfig.topic,
        audience: contentConfig.targetAudience,
        brandVoiceId: contentConfig.brandVoiceId,
        callToAction: contentConfig.callToAction,
        keyPoints: contentConfig.keyPoints,
        tone: contentConfig.tone,
        category: contentConfig.category,
        contentLength: contentConfig.contentLength,
        keywordCount: contentConfig.keywordCount,
        includePersonalization: contentConfig.includePersonalization,
        brandVoice: selectedBrandVoice,
        customPrompt: contentConfig.customPrompt,
        // Include image generation fields when requested
        ...(includeImage && {
          generateImage: includeImage,
          includePersonalization: contentConfig.includePersonalization
        })
      };

      // Debug logging for image generation
      console.log('WhatsApp Generation Debug:', {
        includeImage,
        endpoint,
        requestData
      });

      const response = await post(endpoint, requestData);

      console.log('WhatsApp API Response:', response);

      // The API returns content directly, not wrapped in success/data structure
      if (response && (response.content || response.message)) {
        const data = response;
        console.log('WhatsApp Response Data:', data);

        // Clean the message content by removing email-style metadata
        let cleanMessage = data.message || data.content || '';

        // Remove "**WhatsApp Message:**" header
        cleanMessage = cleanMessage.replace(/^\*\*WhatsApp Message:\*\*\s*\n+/m, '');

        // Remove character count lines like "*Character count: 890*"
        cleanMessage = cleanMessage.replace(/\*\*Character count:\s*\d+\*\*\s*\n?/gi, '');

        // Remove emoji count lines
        cleanMessage = cleanMessage.replace(/\*\*Emojis used:\s*[\d\/]+\s*[\s\S]*?\*\*\s*\n?/gi, '');

        // Remove tone lines
        cleanMessage = cleanMessage.replace(/\*\*Tone:\s*[\s\S]*?\*\*\s*\n?/gi, '');

        // Remove call-to-action lines
        cleanMessage = cleanMessage.replace(/\*\*Call-to-action:\s*[\s\S]*?\*\*\s*\n?/gi, '');

        // Remove everything from "---" onwards (metadata section)
        cleanMessage = cleanMessage.replace(/\n---\n[\s\S]*$/m, '');

        // Clean up extra whitespace
        cleanMessage = cleanMessage.trim();

        const content: GeneratedWhatsAppContent = {
          message: cleanMessage || 'Generated message will appear here...',
          previewText: cleanMessage || 'WhatsApp message preview...',
          brandAlignmentScore: data.brandAlignmentScore || 85,
          wordCount: data.wordCount || 50,
          suggestedEmojis: data.suggestedEmojis || [],
          personalizationTags: data.personalizationTags || ['{{firstName}}', '{{lastName}}', '{{phone}}', '{{company}}'],
          characterCount: data.characterCount || 200,
          // Combined AI specific fields
          imageUrl: data.imageUrl,
          imageGenerated: data.imageGenerated,
          suggestedActions: data.suggestedActions
        };

        console.log('Created content object:', content);

        setGeneratedContent(content);
        setEditedContent(content);
        setCurrentStep(2); // Navigate to review step

        const generationType = includeImage ? (data.imageGenerated ? 'content and image' : 'content') : 'content';

        // Show success toast
        toast({
          title: "Content Generated Successfully!",
          description: `Created ${content.characterCount} characters with ${content.brandAlignmentScore}% brand alignment${data.imageGenerated ? ' and marketing image' : ''}.`,
        });

        // Show image generation status if image was requested
        if (includeImage) {
          if (data.imageGenerated) {
            toast({
              title: "Image Generated Successfully!",
              description: "AI marketing image created and uploaded to cloud storage.",
              variant: "default",
            });
          } else {
            // Show warning for image generation failure (not destructive - doesn't block flow)
            const imageReason = data.imageReason || "Unknown reason";
            toast({
              title: "Image Generation Skipped",
              description: imageReason + " - Text content generated successfully.",
              variant: "default", // Changed from "destructive" to "default" so it doesn't block flow
            });
          }
        }

      } else {
        throw new Error('Generation failed');
      }

    } catch (error) {
      console.error('Content generation failed:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate WhatsApp content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Contact Selection
  const handleContactToggle = (contact: Contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleSelectAllContacts = () => {
    setSelectedContacts(availableContacts);
  };

  const handleClearAllContacts = () => {
    setSelectedContacts([]);
  };

  // Send or Schedule Campaign
  const handleSendCampaign = async () => {
    if (!generatedContent || selectedContacts.length === 0 || !selectedBusinessAccountId) {
      toast({
        title: "Missing Information",
        description: "Please select recipients, business account, and ensure content is generated.",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedBrandVoice = brandVoices.find(bv => bv.id === contentConfig.brandVoiceId);

      const campaignData = {
        campaignName: `${contentConfig.topic} - Individual WhatsApp Campaign`,
        recipientPhoneNumbers: selectedContacts.map(c => c.phone),
        businessAccountId: selectedBusinessAccountId,
        aiPrompt: `Generated individual WhatsApp message for topic: ${contentConfig.topic}`,
        aiModel: 'llama-3.1-8b-instant',
        brandAlignmentScore: generatedContent.brandAlignmentScore,
        // For individual messages, we need to store the message content
        // Since the DTO expects templateVariables, we'll use a special key
        templateVariables: {
          "message": generatedContent.message,
          "content": generatedContent.message,
          "brandVoiceId": contentConfig.brandVoiceId.toString(),
          "brandLogoUrl": selectedBrandVoice?.logo,
          "brandName": selectedBrandVoice?.brandVoiceName,
          "brandWebsiteUrl": selectedBrandVoice?.website,
          "trackDelivery": trackDelivery.toString(),
          "trackReads": trackReads.toString(),
          "scheduleData": scheduleData ? JSON.stringify(scheduleData) : null
        },
        // Set status to indicate this is a direct message campaign
        status: "DRAFT",
        // Store additional metadata
        metadata: {
          brandVoiceId: contentConfig.brandVoiceId,
          category: contentConfig.category,
          tone: contentConfig.tone,
          contentLength: contentConfig.contentLength,
          trackDelivery,
          trackReads,
          scheduleData
        }
      };

      const response = await post('/api/v1/whatsapp/campaigns', campaignData);

      if (response.success) {
        // Save as template if requested
        if (saveAsTemplate && templateName.trim()) {
          await saveAsTemplateFunc();
        }

        toast({
          title: "Campaign Created Successfully!",
          description: scheduleData?.scheduleType === 'immediate'
            ? `Campaign sent to ${selectedContacts.length} recipients`
            : `Campaign scheduled with advanced scheduling options`,
        });

        // Navigate to campaign dashboard
        navigate('/whatsapp/campaigns');
      } else {
        throw new Error('Campaign creation failed');
      }

    } catch (error) {
      console.error('Campaign creation failed:', error);
      toast({
        title: "Campaign Failed",
        description: "Failed to create WhatsApp campaign. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveAsTemplateFunc = async () => {
    if (!generatedContent) return;

    try {
      const selectedBrandVoice = brandVoices.find(bv => bv.id === contentConfig.brandVoiceId);

      const templateData = {
        templateName: templateName || `${contentConfig.topic} - WhatsApp Template`,
        message: generatedContent.message,
        category: contentConfig.category,
        description: `AI-generated individual WhatsApp template for ${contentConfig.topic}`,
        tags: ['ai-generated', 'individual', 'personalized', contentConfig.category.toLowerCase()],
        customFields: {
          topic: contentConfig.topic,
          targetAudience: contentConfig.targetAudience,
          brandAlignmentScore: generatedContent.brandAlignmentScore,
          contentLength: contentConfig.contentLength,
          keywordCount: contentConfig.keywordCount,
          generatedAt: new Date().toISOString()
        },
        brandVoiceId: selectedBrandVoice?.id,
        brandLogoUrl: selectedBrandVoice?.logo,
        brandName: selectedBrandVoice?.brandVoiceName,
        aiPrompt: `Individual WhatsApp message generated for topic: ${contentConfig.topic}, audience: ${contentConfig.targetAudience}`,
        aiModel: 'llama-3.1-8b-instant'
      };

      await post('/api/v1/whatsapp/templates', templateData);

      toast({
        title: "Template Saved",
        description: "WhatsApp template saved for future use.",
      });

    } catch (error) {
      console.error('Template save failed:', error);
      toast({
        title: "Template Save Failed",
        description: "Failed to save template, but campaign was created.",
        variant: "destructive"
      });
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to completed steps
    if (stepIndex <= currentStep || (generatedContent && stepIndex <= 4)) {
      setCurrentStep(stepIndex);
    }
  };

  // Render Step Indicator
  const renderStepIndicator = () => {
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2 mb-6" />

        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isAccessible = index <= currentStep || (generatedContent && index <= 4);

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && handleStepClick(index)}
                disabled={!isAccessible}
                className={`flex flex-col items-center flex-1 transition-all duration-300 ${
                  isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 text-white shadow-lg'
                    : isCurrent
                    ? 'bg-blue-500 text-white shadow-lg animate-pulse'
                    : isAccessible
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium ${
                    isCurrent ? 'text-blue-600' : isAccessible ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 max-w-20 leading-tight">
                    {step.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Content Configuration Panel
  const renderContentConfiguration = () => (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Content Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic" className="text-sm font-medium">
              Message Topic *
            </Label>
            <Input
              id="topic"
              placeholder="e.g., New Product Launch, Customer Success Story"
              value={contentConfig.topic}
              onChange={(e) => setContentConfig({...contentConfig, topic: e.target.value})}
              className="text-base"
            />
          </div>

          <div>
            <Label htmlFor="audience" className="text-sm font-medium">
              Target Audience *
            </Label>
            <Textarea
              id="audience"
              placeholder="Describe your target audience (e.g., Small business owners in tech industry, Marketing managers aged 30-50)"
              value={contentConfig.targetAudience}
              onChange={(e) => setContentConfig({...contentConfig, targetAudience: e.target.value})}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-medium">
              WhatsApp Category
            </Label>
            <Select
              value={contentConfig.category}
              onValueChange={(value: WhatsAppCategory) => setContentConfig({...contentConfig, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select WhatsApp category" />
              </SelectTrigger>
              <SelectContent>
                {WHATSAPP_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div>
                      <div className="font-medium">{category.label}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tone" className="text-sm font-medium">
              Content Tone
            </Label>
            <Select
              value={contentConfig.tone}
              onValueChange={(value: ContentTone) => setContentConfig({...contentConfig, tone: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content tone" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TONES.map((tone) => (
                  <SelectItem key={tone.value} value={tone.value}>
                    <div>
                      <div className="font-medium">{tone.label}</div>
                      <div className="text-xs text-gray-500">{tone.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="length" className="text-sm font-medium">
              Content Length
            </Label>
            <Select
              value={contentConfig.contentLength}
              onValueChange={(value: ContentLength) => setContentConfig({...contentConfig, contentLength: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content length" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_LENGTHS.map((length) => (
                  <SelectItem key={length.value} value={length.value}>
                    <div>
                      <div className="font-medium">{length.label}</div>
                      <div className="text-xs text-gray-500">{length.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="keywords" className="text-sm font-medium">
              Number of Keywords (3-10)
            </Label>
            <Input
              id="keywords"
              type="number"
              min={3}
              max={10}
              value={contentConfig.keywordCount}
              onChange={(e) => setContentConfig({...contentConfig, keywordCount: parseInt(e.target.value) || 5})}
            />
          </div>

          <div>
            <Label htmlFor="keyPoints" className="text-sm font-medium">
              Key Points to Include (optional)
            </Label>
            <Textarea
              id="keyPoints"
              placeholder="Enter key points you want the AI to include in the message (one per line):&#10;&#10;e.g.,&#10;• Product benefits&#10;• Customer testimonials&#10;• Pricing information&#10;• Next steps"
              value={contentConfig.keyPoints?.join('\n') || ''}
              onChange={(e) => {
                const points = e.target.value.split('\n').filter(point => point.trim());
                setContentConfig({...contentConfig, keyPoints: points});
              }}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter each key point on a new line. The AI will incorporate these into the WhatsApp message.
            </p>
          </div>

          <div>
            <Label htmlFor="callToAction" className="text-sm font-medium">
              Call to Action (optional)
            </Label>
            <Input
              id="callToAction"
              placeholder="e.g., Reply 'YES' to schedule a demo"
              value={contentConfig.callToAction}
              onChange={(e) => setContentConfig({...contentConfig, callToAction: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="customPrompt" className="text-sm font-medium">
              Custom Instructions (optional)
            </Label>
            <Textarea
              id="customPrompt"
              placeholder="Any specific instructions for the AI WhatsApp generation..."
              value={contentConfig.customPrompt || ''}
              onChange={(e) => setContentConfig({...contentConfig, customPrompt: e.target.value})}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Additional instructions for how the AI should generate this WhatsApp message.
            </p>
          </div>
        </div>

        {/* Right Panel - Brand Voice & Settings */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="brandVoice" className="text-sm font-medium">
              Brand Voice
            </Label>
            {loadingBrandVoices ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 p-3 border rounded">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading brand voices...
              </div>
            ) : (
              <Select
                value={contentConfig.brandVoiceId.toString()}
                onValueChange={(value) => setContentConfig({...contentConfig, brandVoiceId: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand voice" />
                </SelectTrigger>
                <SelectContent>
                  {brandVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id.toString()}>
                      <div className="flex items-center gap-2">
                        {voice.logo && (
                          <img src={voice.logo} alt={voice.brandVoiceName} className="w-6 h-6 rounded" />
                        )}
                        <span>{voice.brandVoiceName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-900">WhatsApp Personalization Settings</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="personalization"
                  checked={contentConfig.includePersonalization}
                  onCheckedChange={(checked) => setContentConfig({...contentConfig, includePersonalization: checked})}
                />
                <Label htmlFor="personalization" className="text-sm">
                  Include personalization tags ({`{{firstName}}`}, {`{{company}}`}, etc.)
                </Label>
              </div>
              {contentConfig.includePersonalization && (
                <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                  Available tags: <code className="bg-green-200 px-1 rounded text-xs">{'{{firstName}}'}</code>, <code className="bg-green-200 px-1 rounded text-xs">{'{{lastName}}'}</code>, <code className="bg-green-200 px-1 rounded text-xs">{'{{phone}}'}</code>, <code className="bg-green-200 px-1 rounded text-xs">{'{{company}}'}</code>, <code className="bg-green-200 px-1 rounded text-xs">{'{{position}}'}</code>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">AI Generation Settings</h4>
            </div>
            <div className="text-sm text-blue-700">
              Content will be generated using Inspo ai model,
              incorporating your brand voice and optimized for WhatsApp's conversational format.
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-orange-600" />
              <h4 className="font-medium text-orange-900">WhatsApp Best Practices</h4>
            </div>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Keep messages under 4096 characters</li>
              <li>• Use conversational language</li>
              <li>• Include clear call-to-action</li>
              <li>• Respect opt-in requirements</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleNext}
          disabled={!contentConfig.topic.trim() || !contentConfig.targetAudience.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          Continue to AI Generation
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render AI Generation Step
  const renderAIGeneration = () => (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">AI WhatsApp Content Generation</h3>
        <p className="text-gray-600">Generate personalized WhatsApp messages with AI</p>
      </div>

      {/* AI Generation Options - Simplified */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            AI Generation Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeImage"
                checked={includeImage}
                onCheckedChange={(checked) => setIncludeImage(checked === true)}
              />
              <Label htmlFor="includeImage" className="text-sm font-medium">
                Include Marketing Image
              </Label>
            </div>
            <p className="text-xs text-gray-600 ml-6">
              Generate both text content and professional marketing images using Stability AI
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">InspoCRM AI Features</h4>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• AI-powered text generation with brand voice</li>
              <li>• Professional marketing image creation (when enabled)</li>
              <li>• Automatic cloud storage for images</li>
              <li>• Complete brand consistency integration</li>
              <li>• Smart WhatsApp action suggestions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">Generation Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Topic:</span>
              <p className="text-gray-900">{contentConfig.topic}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Audience:</span>
              <p className="text-gray-900">{contentConfig.targetAudience}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Category:</span>
              <p className="text-gray-900">
                {WHATSAPP_CATEGORIES.find(cat => cat.value === contentConfig.category)?.label}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Length:</span>
              <p className="text-gray-900">
                {CONTENT_LENGTHS.find(len => len.value === contentConfig.contentLength)?.label}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Keywords:</span>
              <p className="text-gray-900">{contentConfig.keywordCount}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Personalization:</span>
              <p className="text-gray-900">{contentConfig.includePersonalization ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">AI Mode:</span>
              <p className="text-gray-900">{includeImage ? 'Combined (Text + Image)' : 'Text Only'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Image Generation:</span>
              <p className="text-gray-900">{includeImage ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button
          onClick={handleGenerateContent}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-medium"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {includeImage ? 'Generating Content & Image...' : 'Generating WhatsApp Content...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              {includeImage ? 'Generate AI Content & Image' : 'Generate AI WhatsApp Content'}
            </>
          )}
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePrevious}>
          Back to Configuration
        </Button>
      </div>
    </div>
  );

  // Render Content Review & Edit
  const renderContentReview = () => {
    if (!generatedContent) return null;

    return (
      <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Review & Edit Generated WhatsApp Content</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? 'Stop Editing' : 'Edit Content'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview WhatsApp
            </Button>
          </div>
        </div>

        {/* Generated Image Display */}
        {generatedContent?.imageUrl && generatedContent?.imageGenerated && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-5 w-5 text-purple-600" />
                Generated Marketing Image
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative max-w-md">
                  <img
                    src={generatedContent.imageUrl}
                    alt="AI Generated Marketing Image"
                    className="w-full h-auto rounded-lg shadow-lg border"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/512x512?text=Image+Failed+to+Load';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-purple-600 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  <p>This image was automatically generated using Stability AI and uploaded to S3.</p>
                  <p className="mt-1">It incorporates your brand voice and is optimized for WhatsApp marketing.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-gray-50 to-blue-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">WhatsApp Message</Label>
                <div className="mt-1 p-4 bg-white rounded border max-h-64 overflow-y-auto">
                  {isEditing && editedContent ? (
                    <Textarea
                      value={editedContent.message}
                      onChange={(e) => setEditedContent({...editedContent, message: e.target.value})}
                      rows={8}
                      className="border-0 p-0 focus:ring-0 resize-none"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{generatedContent.message}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Character Count: {generatedContent.characterCount}</span>
                <span>Word Count: {generatedContent.wordCount}</span>
                <span>Brand Alignment: {generatedContent.brandAlignmentScore}%</span>
              </div>

              {generatedContent.suggestedEmojis.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Suggested Emojis</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {generatedContent.suggestedEmojis.map((emoji, index) => (
                      <Badge key={index} variant="outline" className="text-lg px-2 py-1">
                        {emoji}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {generatedContent.personalizationTags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Personalization Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {generatedContent.personalizationTags.map((tag, index) => (
                      <code key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {tag}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {generatedContent.suggestedActions && generatedContent.suggestedActions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Suggested WhatsApp Actions</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {generatedContent.suggestedActions.map((action, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedContent(generatedContent);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              if (editedContent) {
                setGeneratedContent(editedContent);
                setIsEditing(false);
                toast({
                  title: "Content Updated",
                  description: "Your edits have been saved.",
                });
              }
            }}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}

        {!isEditing && (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setGeneratedContent(null);
                setEditedContent(null);
                setCurrentStep(1);
              }}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              Regenerate
            </Button>
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve & Continue
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render Contact Selection
  const renderContactSelection = () => (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select WhatsApp Recipients</h3>
        <p className="text-gray-600">Choose contacts with phone numbers to receive this WhatsApp message</p>
      </div>

      {/* Search and Load Contacts */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search contacts by name, phone, or email..."
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => loadContacts()}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Load Contacts
        </Button>
      </div>

      {/* Contact List */}
      <Card className="max-h-96 overflow-hidden">
        <CardContent className="p-0">
          {availableContacts.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">No contacts found</h4>
              <p className="text-gray-600 mb-4">
                {contactSearchTerm ? 'Try adjusting your search' : 'Load contacts from your CRM first'}
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {availableContacts.map((contact) => {
                const isSelected = selectedContacts.some(c => c.id === contact.id);
                return (
                  <div
                    key={contact.id}
                    className={`flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleContactToggle(contact)}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                          {contact.company && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {contact.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {selectedContacts.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Check className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-900">Selected Recipients</h4>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {selectedContacts.length} contacts
              </Badge>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {selectedContacts.slice(0, 3).map(contact => (
                <div key={contact.id} className="flex items-center justify-between text-sm">
                  <span className="text-green-800">
                    {contact.firstName} {contact.lastName}
                  </span>
                  <span className="text-green-600">{contact.phone}</span>
                </div>
              ))}
              {selectedContacts.length > 3 && (
                <div className="text-sm text-green-600 text-center">
                  ...and {selectedContacts.length - 3} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAllContacts}
            disabled={availableContacts.length === 0}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllContacts}
            disabled={selectedContacts.length === 0}
          >
            Clear All
          </Button>
        </div>
        <Badge variant="outline">
          {selectedContacts.length} of {availableContacts.length} selected
        </Badge>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePrevious}>
          Back to Review
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedContacts.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          Continue to Send
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render Send/Schedule Options
  const renderSendOptions = () => (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">WhatsApp Scheduling & Delivery</h3>
        <p className="text-gray-600">Configure advanced scheduling options for your WhatsApp campaign</p>
      </div>

      {/* WhatsApp Business Account Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            WhatsApp Business Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBusinessAccounts ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading business accounts...
            </div>
          ) : businessAccounts.length === 0 ? (
            <div className="text-center py-6">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">No WhatsApp Business Accounts Found</h4>
              <p className="text-gray-600 mb-4">
                You need to set up a WhatsApp Business Account before you can send messages.
              </p>
              <Button
                onClick={() => navigate('/whatsapp/setup')}
                className="bg-green-600 hover:bg-green-700"
              >
                Set Up WhatsApp Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessAccount" className="text-sm font-medium">
                  Select WhatsApp Business Account *
                </Label>
                <Select
                  value={selectedBusinessAccountId?.toString() || ''}
                  onValueChange={(value) => setSelectedBusinessAccountId(parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a WhatsApp business account" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>{account.accountName || account.displayPhoneNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            {account.status || 'ACTIVE'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBusinessAccountId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <Check className="h-4 w-4" />
                    <span>
                      Selected: {businessAccounts.find(acc => acc.id === selectedBusinessAccountId)?.accountName ||
                                businessAccounts.find(acc => acc.id === selectedBusinessAccountId)?.displayPhoneNumber}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced WhatsApp Scheduler */}
      <WhatsAppAdvancedScheduler
        onScheduleChange={(scheduleData) => setScheduleData(scheduleData)}
        initialSchedule={scheduleData}
      />

      {/* Delivery Tracking Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Tracking Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="trackDelivery"
              checked={trackDelivery}
              onCheckedChange={setTrackDelivery}
            />
            <Label htmlFor="trackDelivery" className="text-sm">
              Track message delivery status
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="trackReads"
              checked={trackReads}
              onCheckedChange={setTrackReads}
            />
            <Label htmlFor="trackReads" className="text-sm">
              Track message read status
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Template Save Option */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="saveTemplate"
              checked={saveAsTemplate}
              onCheckedChange={setSaveAsTemplate}
            />
            <Label htmlFor="saveTemplate" className="text-sm">
              Save as reusable WhatsApp template
            </Label>
          </div>
          {saveAsTemplate && (
            <Input
              placeholder="Template name (optional)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mt-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Campaign Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">Campaign Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Recipients:</span>
              <p className="text-gray-900">{selectedContacts.length} contacts</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Message:</span>
              <p className="text-gray-900">{generatedContent?.characterCount} characters</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Schedule:</span>
              <p className="text-gray-900">
                {scheduleData?.scheduleType === 'immediate' ? 'Send Now' :
                 scheduleData?.scheduleType === 'once' ? 'One-time' :
                 scheduleData?.scheduleType === 'daily' ? 'Daily' :
                 scheduleData?.scheduleType === 'weekly' ? 'Weekly' :
                 scheduleData?.scheduleType === 'monthly' ? 'Monthly' : 'Custom'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tracking:</span>
              <p className="text-gray-900">
                {trackDelivery && trackReads ? 'Delivery & Reads' :
                 trackDelivery ? 'Delivery only' :
                 trackReads ? 'Reads only' : 'Disabled'}
              </p>
            </div>
          </div>
          {scheduleData?.scheduleType !== 'immediate' && scheduleData?.sendTime && (
            <div className="mt-3 p-3 bg-blue-100 rounded">
              <p className="text-sm text-blue-800">
                📅 Scheduled: {scheduleData.scheduleType === 'once' ? 'One-time send' :
                               scheduleData.scheduleType === 'daily' ? `Daily at ${scheduleData.sendTime}` :
                               scheduleData.scheduleType === 'weekly' ? `Weekly at ${scheduleData.sendTime}` :
                               scheduleData.scheduleType === 'monthly' ? `Monthly at ${scheduleData.sendTime}` :
                               `Custom schedule at ${scheduleData.sendTime}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePrevious}>
          Back to Recipients
        </Button>
        <Button
          onClick={handleSendCampaign}
          disabled={!scheduleData || !selectedBusinessAccountId}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {scheduleData?.scheduleType === 'immediate' ? (
            <>
              <Send className="h-4 w-4" />
              Send Campaign
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              Schedule Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Render WhatsApp Preview Modal
  const renderPreviewModal = () => {
    // Create a sample contact for personalization preview
    const sampleContact: Contact | undefined = selectedContacts.length > 0 ? selectedContacts[0] : undefined;

    return (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              WhatsApp Message Preview
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            {generatedContent && (
              <WhatsAppChatPreview
                message={generatedContent.message}
                sampleContact={sampleContact}
                brandVoice={brandVoices.find(bv => bv.id === contentConfig.brandVoiceId) || undefined}
                zoom={zoom}
                previewMode={previewMode}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Main Render
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderContentConfiguration();
      case 1:
        return renderAIGeneration();
      case 2:
        return renderContentReview();
      case 3:
        return renderContactSelection();
      case 4:
        return renderSendOptions();
      default:
        return renderContentConfiguration();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ai')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to AI Hub
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                Individual AI WhatsApp Generator
              </h1>
              <p className="text-gray-600 mt-1">
                Create personalized, professional WhatsApp messages with AI assistance
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered WhatsApp Creation
          </Badge>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Preview Modal */}
        {renderPreviewModal()}
      </div>
    </div>
  );
};
