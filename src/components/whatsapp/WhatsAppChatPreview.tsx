import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Smartphone, Monitor, ZoomIn, ZoomOut, RotateCcw,
  MessageSquare, User, Phone, Building, Star
} from 'lucide-react';

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

interface WhatsAppChatPreviewProps {
  message: string;
  sampleContact?: Contact;
  brandVoice?: BrandVoice;
  zoom?: number;
  previewMode?: 'desktop' | 'mobile';
}

export function WhatsAppChatPreview({
  message,
  sampleContact,
  brandVoice,
  zoom = 100,
  previewMode = 'mobile'
}: WhatsAppChatPreviewProps) {
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [currentMode, setCurrentMode] = useState<'desktop' | 'mobile'>(previewMode);

  // Replace personalization tags with sample data
  const personalizeMessage = (msg: string, contact?: Contact) => {
    if (!contact) return msg;

    return msg
      .replace(/\{\{firstName\}\}/g, contact.firstName || 'John')
      .replace(/\{\{lastName\}\}/g, contact.lastName || 'Doe')
      .replace(/\{\{phone\}\}/g, contact.phone || '+1234567890')
      .replace(/\{\{company\}\}/g, contact.company || contact.companyName || 'Acme Corp')
      .replace(/\{\{position\}\}/g, contact.position || 'Manager')
      .replace(/\{\{email\}\}/g, contact.email || 'john.doe@company.com');
  };

  const personalizedMessage = personalizeMessage(message, sampleContact);

  const handleZoomChange = (value: number[]) => {
    setCurrentZoom(value[0]);
  };

  const resetZoom = () => {
    setCurrentZoom(100);
  };

  const renderMobilePreview = () => (
    <div
      className="mx-auto border-2 border-gray-300 rounded-3xl overflow-hidden bg-gray-100 p-2 shadow-lg"
      style={{
        transform: `scale(${currentZoom / 100})`,
        transformOrigin: 'center',
        width: '320px',
        height: '640px'
      }}
    >
      {/* Phone Frame */}
      <div className="bg-black rounded-2xl h-full w-full relative overflow-hidden">
        {/* Status Bar */}
        <div className="bg-black text-white px-4 py-1 flex justify-between items-center text-xs">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <span>100%</span>
          </div>
        </div>

        {/* WhatsApp Header */}
        <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">
              {sampleContact ? `${sampleContact.firstName} ${sampleContact.lastName}` : 'Contact Name'}
            </h3>
            <p className="text-xs opacity-80">online</p>
          </div>
          <div className="flex gap-2">
            <Phone className="w-4 h-4" />
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {/* Sample received message */}
          <div className="flex justify-start mb-4">
            <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 max-w-xs shadow-sm">
              <p className="text-sm text-gray-800">Hi there! 👋</p>
              <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
            </div>
          </div>

          {/* Our message */}
          <div className="flex justify-end mb-4">
            <div className="bg-green-500 text-white rounded-lg rounded-tr-none px-3 py-2 max-w-xs shadow-sm">
              <p className="text-sm whitespace-pre-wrap">{personalizedMessage}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <p className="text-xs opacity-80">10:31 AM</p>
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 border border-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <div className="w-3 h-3 border border-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
          <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-gray-400">Type a message</span>
          </div>
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopPreview = () => (
    <div
      className="mx-auto border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg"
      style={{
        transform: `scale(${currentZoom / 100})`,
        transformOrigin: 'center',
        width: '800px',
        height: '600px'
      }}
    >
      {/* WhatsApp Web Header */}
      <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-gray-900">
              {sampleContact ? `${sampleContact.firstName} ${sampleContact.lastName}` : 'Contact Name'}
            </h3>
            <p className="text-xs text-gray-500">last seen recently</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Phone className="w-5 h-5 text-gray-500" />
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
        {/* Sample conversation */}
        <div className="space-y-4">
          {/* Received message */}
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-2 max-w-md shadow-sm">
              <p className="text-sm text-gray-800">Hello! How can I help you today?</p>
              <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
            </div>
          </div>

          {/* Sent message */}
          <div className="flex justify-end">
            <div className="bg-green-500 text-white rounded-lg px-4 py-2 max-w-md shadow-sm">
              <p className="text-sm whitespace-pre-wrap">{personalizedMessage}</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <p className="text-xs opacity-80">10:31 AM</p>
                <div className="flex gap-1">
                  <div className="w-3 h-3 border border-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <div className="w-3 h-3 border border-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white px-6 py-4 border-t flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-gray-500 text-sm">Type a message</span>
        </div>
        <Button size="sm" className="bg-green-500 hover:bg-green-600">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={currentMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentMode('mobile')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile
            </Button>
            <Button
              variant={currentMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentMode('desktop')}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-gray-500" />
            <Slider
              value={[currentZoom]}
              onValueChange={handleZoomChange}
              max={150}
              min={50}
              step={10}
              className="w-24"
            />
            <ZoomIn className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 w-12">{currentZoom}%</span>
            <Button variant="outline" size="sm" onClick={resetZoom}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Badge variant="outline" className="text-xs">
          {currentMode === 'mobile' ? 'WhatsApp Mobile' : 'WhatsApp Web'}
        </Badge>
      </div>

      {/* Contact Info */}
      {sampleContact && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">
                  {sampleContact.firstName} {sampleContact.lastName}
                </h4>
                <div className="flex items-center gap-4 text-sm text-blue-700">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {sampleContact.phone}
                  </span>
                  {sampleContact.company && (
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {sampleContact.company}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Preview Contact
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Preview */}
      <div className="flex justify-center py-8 bg-gray-50 rounded-lg">
        {currentMode === 'mobile' ? renderMobilePreview() : renderDesktopPreview()}
      </div>

      {/* Message Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Message Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Characters:</span>
              <p className="font-medium">{personalizedMessage.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Words:</span>
              <p className="font-medium">{personalizedMessage.split(/\s+/).length}</p>
            </div>
            <div>
              <span className="text-gray-600">WhatsApp Limit:</span>
              <p className={`font-medium ${personalizedMessage.length > 4096 ? 'text-red-600' : 'text-green-600'}`}>
                {personalizedMessage.length}/4096
              </p>
            </div>
            <div>
              <span className="text-gray-600">Brand Voice:</span>
              <p className="font-medium">{brandVoice?.brandVoiceName || 'Default'}</p>
            </div>
          </div>

          {personalizedMessage.length > 4096 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                ⚠️ Message exceeds WhatsApp's 4096 character limit. Consider shortening your content.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
