import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, MessageCircle, User, Clock } from 'lucide-react';

interface WhatsAppChatPreviewProps {
  content: string;
  title: string;
  brandVoiceName?: string;
  fileUrl?: string;
  fileType?: string;
}

export function WhatsAppChatPreview({
  content,
  title,
  brandVoiceName,
  fileUrl,
  fileType
}: WhatsAppChatPreviewProps) {
  // Simulate a WhatsApp-like chat interface
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="max-w-sm mx-auto bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
      {/* Phone Header */}
      <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-xs">{currentTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* WhatsApp Header */}
      <div className="bg-green-600 text-white p-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Content Preview</h3>
          <p className="text-xs opacity-90">Online</p>
        </div>
        <div className="ml-auto">
          <MessageCircle className="h-5 w-5" />
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-[#e5ddd5] p-4 min-h-[300px] flex flex-col justify-end">
        {/* Brand Voice Indicator */}
        {brandVoiceName && (
          <div className="flex justify-center mb-3">
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              {brandVoiceName}
            </Badge>
          </div>
        )}

        {/* Content Message */}
        <div className="flex justify-end mb-2">
          <div className="bg-green-500 text-white rounded-lg rounded-br-sm px-3 py-2 max-w-[80%]">
            <div className="text-sm">
              {fileUrl && fileType?.startsWith('image/') && (
                <div className="mb-2">
                  <img
                    src={fileUrl}
                    alt="Content image"
                    className="rounded-lg max-w-full h-auto"
                    style={{ maxHeight: '150px' }}
                  />
                </div>
              )}
              <p className="whitespace-pre-wrap break-words">{content}</p>
            </div>
            <div className="text-xs opacity-70 text-right mt-1">
              {currentTime} ✓✓
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center mt-2">
          <Badge variant="outline" className="text-xs bg-white border-green-200 text-green-700">
            Message will be sent to selected contacts
          </Badge>
        </div>
      </div>

      {/* Phone Bottom */}
      <div className="bg-gray-800 h-1"></div>
    </div>
  );
}
