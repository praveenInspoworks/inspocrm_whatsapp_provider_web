import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Download,
  Trash2,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { gdprService, PrivacySettings, ConsentPreferences } from '@/services/gdprService';
import { useToast } from '@/hooks/use-toast';

export function DataManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const settings = await gdprService.getPrivacySettings();
      setPrivacySettings(settings);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const handleRequestExport = async () => {
    setLoading(true);
    try {
      const response = await gdprService.requestDataExport({
        format: 'JSON',
      });
      toast({
        title: 'Export Requested',
        description: 'You will receive an email when your data export is ready.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request data export',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: 'Invalid Confirmation',
        description: 'Please type "DELETE" to confirm',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await gdprService.requestDataDeletion({
        reason: deleteReason,
        confirmation: deleteConfirmation,
      });
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      setDeleteReason('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request data deletion',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsent = async (preferences: ConsentPreferences) => {
    setLoading(true);
    try {
      await gdprService.updateConsentPreferences(preferences);
      await loadPrivacySettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update consent preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Management & Privacy</h1>
        <p className="text-muted-foreground mt-1">
          Manage your data, privacy settings, and GDPR rights
        </p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger value="deletion">Data Deletion</TabsTrigger>
          <TabsTrigger value="consent">Consent Preferences</TabsTrigger>
          <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>
                Request a copy of all your data (GDPR Right to Data Portability)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Your data export will include all personal information, usage data, and content
                  associated with your account. The export will be available for download for 7 days.
                </AlertDescription>
              </Alert>
              <Button onClick={handleRequestExport} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Request Data Export
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deletion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Your Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data (GDPR Right to be Forgotten)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This action cannot be undone. All your data, including
                  messages, campaigns, contacts, and settings will be permanently deleted.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Request Account Deletion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Consent Preferences
              </CardTitle>
              <CardDescription>
                Manage your consent preferences for data processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {privacySettings && (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Marketing Communications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive marketing emails and updates
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.consentPreferences.marketing}
                      onCheckedChange={(checked) =>
                        handleUpdateConsent({
                          ...privacySettings.consentPreferences,
                          marketing: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Analytics & Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow usage analytics and tracking
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.consentPreferences.analytics}
                      onCheckedChange={(checked) =>
                        handleUpdateConsent({
                          ...privacySettings.consentPreferences,
                          analytics: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
                    <div>
                      <Label className="text-base font-medium">Required Services</Label>
                      <p className="text-sm text-muted-foreground">
                        Essential services required for platform operation
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Configure your privacy and data retention preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your privacy is important to us. All data is encrypted and stored securely.
                  We comply with GDPR, CCPA, and other data protection regulations.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason (optional)</Label>
              <Input
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Why are you deleting your account?"
              />
            </div>
            <div>
              <Label>
                Type <strong>"DELETE"</strong> to confirm
              </Label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRequestDeletion}
              disabled={deleteConfirmation !== 'DELETE' || loading}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

