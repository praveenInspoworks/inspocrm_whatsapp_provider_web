import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare, Send, Search, Filter, Plus, Eye, Edit, Trash2,
  CheckCircle, AlertCircle, Clock, Users, Phone, Building,
  Sparkles, Copy, MoreVertical, Calendar, User
} from 'lucide-react';
import { ContactSelector } from '../crm/ContactSelector';
import { useToast } from '@/hooks/use-toast';
import { get, post } from '@/services/apiService';

// Import Contact interface from ContactSelector to avoid duplication
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

interface WhatsAppTemplate {
  id: number;
  templateName: string;
  templateType: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  languageCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE';
  headerType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE';
  headerText?: string;
  headerMediaUrl?: string;
  messageContent: string;
  footerText?: string;
  buttons: Array<{
    type: string;
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  businessAccountId: number;
  businessAccountName?: string;
}

export function WhatsAppTemplateList() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, statusFilter, typeFilter]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await get<WhatsAppTemplate[]>('/api/v1/whatsapp/templates');
      setTemplates(response);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      toast({
        title: "Error",
        description: "Failed to load WhatsApp templates.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.messageContent.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(template => template.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(template => template.templateType === typeFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleSendMessage = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setShowContactSelector(true);
  };

  const sendMessages = async () => {
    if (!selectedTemplate || selectedContacts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a template and at least one contact.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      // Prepare campaign data
      const campaignData = {
        campaignName: `${selectedTemplate.templateName} Campaign`,
        templateId: selectedTemplate.id.toString(),
        recipientPhoneNumbers: selectedContacts.map(c => c.phone).filter(Boolean),
        templateVariables: {}, // Add variable replacement logic if needed
        businessAccountId: selectedTemplate.businessAccountId
      };

      // For Twilio templates, use the specific ContentSid
      if (selectedTemplate.templateName.toLowerCase().includes('twilio') ||
          selectedTemplate.templateName.toLowerCase().includes('welcome')) {
        campaignData.templateId = 'HX4918eabc89d15e4492be4af0fb888d0f'; // Default Twilio template
      }

      await post('/api/v1/whatsapp/campaigns', campaignData);

      toast({
        title: "Messages Sent Successfully",
        description: `Campaign created and messages sent to ${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''}.`,
      });

      // Reset state
      setSelectedTemplate(null);
      setSelectedContacts([]);
      setShowContactSelector(false);

    } catch (error: any) {
      console.error('Send messages error:', error);
      toast({
        title: "Failed to Send Messages",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'MARKETING':
        return <Badge variant="outline" className="border-purple-300 text-purple-700">Marketing</Badge>;
      case 'UTILITY':
        return <Badge variant="outline" className="border-blue-300 text-blue-700">Utility</Badge>;
      case 'AUTHENTICATION':
        return <Badge variant="outline" className="border-green-300 text-green-700">Auth</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <MessageSquare className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading Templates...</p>
        </div>
      </div>
    );
  }

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
                  WhatsApp Templates
                </h1>
                <p className="text-sm text-gray-600 font-medium">Manage and send your message templates</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-5 h-5 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-green-400 rounded-xl bg-gray-50/50"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl bg-gray-50/50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl bg-gray-50/50">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>

              {/* Results Count */}
              <div className="flex items-center justify-center">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Templates Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? "Try adjusting your filters or search terms."
                  : "Create your first WhatsApp template to get started."}
              </p>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                          {template.templateName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 font-medium">
                          {template.businessAccountName || 'Business Account'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(template.status)}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {getTypeBadge(template.templateType)}
                    <Badge variant="outline" className="text-xs">
                      {template.languageCode.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Message Preview */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                      {template.messageContent.length > 100
                        ? `${template.messageContent.substring(0, 100)}...`
                        : template.messageContent}
                    </p>
                    {template.buttons && template.buttons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.buttons.slice(0, 2).map((button, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-green-50 text-green-700">
                            {button.text}
                          </Badge>
                        ))}
                        {template.buttons.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-600">
                            +{template.buttons.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(template.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Updated {formatDate(template.updatedAt)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowPreview(true);
                      }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>

                    <Button
                      onClick={() => handleSendMessage(template)}
                      disabled={template.status !== 'ACTIVE' && template.status !== 'APPROVED'}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>

                  {/* Status Warning */}
                  {template.status !== 'ACTIVE' && template.status !== 'APPROVED' && (
                    <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 text-xs">
                        Template must be approved before sending messages.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contact Selector Dialog */}
      <Dialog open={showContactSelector} onOpenChange={setShowContactSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-600" />
              Select Recipients for "{selectedTemplate?.templateName}"
            </DialogTitle>
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
                onClick={sendMessages}
                disabled={isSending}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedTemplate.templateName}</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate.messageContent}
                </p>
                {selectedTemplate.footerText && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {selectedTemplate.footerText}
                  </p>
                )}
                {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedTemplate.buttons.map((button, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-sm text-green-800 transition-colors"
                      >
                        {button.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    handleSendMessage(selectedTemplate);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
