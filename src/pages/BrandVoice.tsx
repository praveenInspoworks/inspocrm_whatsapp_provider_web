import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load components for better performance
const EnhancedBrandVoiceSetup = React.lazy(() => import('@/components/ai/enhanced-brand-voice-setup').then(module => ({ default: module.EnhancedBrandVoiceSetup })));
const BrandVoiceManager = React.lazy(() => import('@/components/ai/brand-voice-manager').then(module => ({ default: module.BrandVoiceManager })));

export default function BrandVoicePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Brand Voice Center</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Create and manage your brand voices for AI-powered content generation
          </p>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="setup" className="text-sm">
              Setup & Analysis
            </TabsTrigger>
            <TabsTrigger value="manage" className="text-sm">
              Manage Brand Voices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Suspense fallback={<div className="p-8 flex items-center justify-center">Loading setup...</div>}>
                  <EnhancedBrandVoiceSetup />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Suspense fallback={<div className="p-8 flex items-center justify-center">Loading manager...</div>}>
                  <BrandVoiceManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
