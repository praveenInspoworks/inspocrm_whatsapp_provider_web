import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bot, MessageSquare, Settings, TestTube, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppAutoReplyRule {
  id: number;
  ruleName: string;
  description: string;
  isActive: boolean;
  priority: number;
  triggerType: 'KEYWORD' | 'DEFAULT';
  keywords: string;
  excludedKeywords: string;
  timeStart: string;
  timeEnd: string;
  daysOfWeek: string;
  replyType: 'TEMPLATE' | 'AI_GENERATED' | 'MIXED';
  replyTemplate: string;
  aiPromptTemplate: string;
  aiModel: string;
  maxReplyLength: number;
  includeBrandVoice: boolean;
  brandVoiceId: number;
  fallbackReply: string;
  usageCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

const WhatsAppAutoReplyManager: React.FC = () => {
  const [rules, setRules] = useState<WhatsAppAutoReplyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<WhatsAppAutoReplyRule | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    ruleName: '',
    description: '',
    isActive: true,
    priority: 0,
    triggerType: 'KEYWORD' as 'KEYWORD' | 'DEFAULT',
    keywords: '',
    excludedKeywords: '',
    timeStart: '',
    timeEnd: '',
    daysOfWeek: '',
    replyType: 'AI_GENERATED' as 'TEMPLATE' | 'AI_GENERATED' | 'MIXED',
    replyTemplate: '',
    aiPromptTemplate: '',
    aiModel: 'llama-3.1-8b-instant',
    maxReplyLength: 500,
    includeBrandVoice: true,
    brandVoiceId: 0,
    fallbackReply: 'Thank you for your message. We\'ll get back to you soon.'
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/auto-reply/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        toast.error('Failed to load auto-reply rules');
        setRules([]);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      toast.error('Error loading auto-reply rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/whatsapp/auto-reply/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Auto-reply rule created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        loadRules();
      } else {
        toast.error('Failed to create auto-reply rule');
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Error creating auto-reply rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;

    try {
      const response = await fetch(`/api/whatsapp/auto-reply/rules/${selectedRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Auto-reply rule updated successfully');
        setIsEditDialogOpen(false);
        resetForm();
        loadRules();
      } else {
        toast.error('Failed to update auto-reply rule');
      }
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Error updating auto-reply rule');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/whatsapp/auto-reply/rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Auto-reply rule deleted successfully');
        loadRules();
      } else {
        toast.error('Failed to delete auto-reply rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Error deleting auto-reply rule');
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/whatsapp/auto-reply/rules/${ruleId}/toggle`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('Rule status updated');
        loadRules();
      } else {
        toast.error('Failed to update rule status');
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Error updating rule status');
    }
  };

  const handleTestRule = async () => {
    if (!selectedRule || !testMessage.trim()) return;

    try {
      setTestLoading(true);
      const response = await fetch('/api/whatsapp/auto-reply/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          ruleId: selectedRule.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
      } else {
        toast.error('Failed to test rule');
      }
    } catch (error) {
      console.error('Error testing rule:', error);
      toast.error('Error testing rule');
    } finally {
      setTestLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ruleName: '',
      description: '',
      isActive: true,
      priority: 0,
      triggerType: 'KEYWORD',
      keywords: '',
      excludedKeywords: '',
      timeStart: '',
      timeEnd: '',
      daysOfWeek: '',
      replyType: 'AI_GENERATED',
      replyTemplate: '',
      aiPromptTemplate: '',
      aiModel: 'llama-3.1-8b-instant',
      maxReplyLength: 500,
      includeBrandVoice: true,
      brandVoiceId: 0,
      fallbackReply: 'Thank you for your message. We\'ll get back to you soon.'
    });
    setSelectedRule(null);
  };

  const openEditDialog = (rule: WhatsAppAutoReplyRule) => {
    setSelectedRule(rule);
    setFormData({
      ruleName: rule.ruleName,
      description: rule.description,
      isActive: rule.isActive,
      priority: rule.priority,
      triggerType: rule.triggerType,
      keywords: rule.keywords || '',
      excludedKeywords: rule.excludedKeywords || '',
      timeStart: rule.timeStart || '',
      timeEnd: rule.timeEnd || '',
      daysOfWeek: rule.daysOfWeek || '',
      replyType: rule.replyType,
      replyTemplate: rule.replyTemplate || '',
      aiPromptTemplate: rule.aiPromptTemplate || '',
      aiModel: rule.aiModel || 'llama-3.1-8b-instant',
      maxReplyLength: rule.maxReplyLength || 500,
      includeBrandVoice: rule.includeBrandVoice,
      brandVoiceId: rule.brandVoiceId || 0,
      fallbackReply: rule.fallbackReply || 'Thank you for your message. We\'ll get back to you soon.'
    });
    setIsEditDialogOpen(true);
  };

  const openTestDialog = (rule: WhatsAppAutoReplyRule) => {
    setSelectedRule(rule);
    setTestMessage('');
    setTestResult(null);
    setIsTestDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp AI Auto-Reply</h1>
          <p className="text-muted-foreground">
            Manage automated responses for incoming WhatsApp messages
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Auto-Reply Rule</DialogTitle>
            </DialogHeader>
            <RuleForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateRule}
              submitLabel="Create Rule"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bot className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">{rule.ruleName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Trigger Type</Label>
                  <p className="text-sm font-medium">{rule.triggerType}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reply Type</Label>
                  <p className="text-sm font-medium">{rule.replyType}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <p className="text-sm font-medium">{rule.priority}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Usage Count</Label>
                  <p className="text-sm font-medium">{rule.usageCount}</p>
                </div>
              </div>

              {rule.keywords && (
                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground">Keywords</Label>
                  <p className="text-sm">{rule.keywords}</p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(rule)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openTestDialog(rule)}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Auto-Reply Rules</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first auto-reply rule to start automating WhatsApp responses.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Auto-Reply Rule</DialogTitle>
          </DialogHeader>
          <RuleForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateRule}
            submitLabel="Update Rule"
          />
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Auto-Reply Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-message">Test Message</Label>
              <Textarea
                id="test-message"
                placeholder="Enter a test message to see how the rule responds..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleTestRule}
              disabled={!testMessage.trim() || testLoading}
              className="w-full"
            >
              {testLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Rule
            </Button>

            {testResult && (
              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  <strong>Response:</strong> {testResult.reply}
                  {testResult.matched && (
                    <div className="mt-2">
                      <Badge variant="default">Rule Matched</Badge>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Rule Form Component
interface RuleFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitLabel: string;
}

const RuleForm: React.FC<RuleFormProps> = ({ formData, setFormData, onSubmit, submitLabel }) => {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic Settings</TabsTrigger>
        <TabsTrigger value="triggers">Triggers</TabsTrigger>
        <TabsTrigger value="responses">Responses</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ruleName">Rule Name *</Label>
            <Input
              id="ruleName"
              value={formData.ruleName}
              onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
              placeholder="e.g., Greeting Responses"
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this rule does..."
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </TabsContent>

      <TabsContent value="triggers" className="space-y-4">
        <div>
          <Label htmlFor="triggerType">Trigger Type</Label>
          <Select
            value={formData.triggerType}
            onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KEYWORD">Keyword Match</SelectItem>
              <SelectItem value="DEFAULT">Default (Fallback)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.triggerType === 'KEYWORD' && (
          <>
            <div>
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="hello, hi, hey"
              />
            </div>

            <div>
              <Label htmlFor="excludedKeywords">Excluded Keywords (comma-separated)</Label>
              <Input
                id="excludedKeywords"
                value={formData.excludedKeywords}
                onChange={(e) => setFormData({ ...formData, excludedKeywords: e.target.value })}
                placeholder="stop, unsubscribe"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeStart">Time Start (HH:mm)</Label>
            <Input
              id="timeStart"
              value={formData.timeStart}
              onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
              placeholder="09:00"
            />
          </div>
          <div>
            <Label htmlFor="timeEnd">Time End (HH:mm)</Label>
            <Input
              id="timeEnd"
              value={formData.timeEnd}
              onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
              placeholder="18:00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="daysOfWeek">Days of Week (comma-separated numbers, 1-7)</Label>
          <Input
            id="daysOfWeek"
            value={formData.daysOfWeek}
            onChange={(e) => setFormData({ ...formData, daysOfWeek: e.target.value })}
            placeholder="1,2,3,4,5 (Monday to Friday)"
          />
        </div>
      </TabsContent>

      <TabsContent value="responses" className="space-y-4">
        <div>
          <Label htmlFor="replyType">Reply Type</Label>
          <Select
            value={formData.replyType}
            onValueChange={(value) => setFormData({ ...formData, replyType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEMPLATE">Template</SelectItem>
              <SelectItem value="AI_GENERATED">AI Generated</SelectItem>
              <SelectItem value="MIXED">Mixed (AI + Template)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(formData.replyType === 'TEMPLATE' || formData.replyType === 'MIXED') && (
          <div>
            <Label htmlFor="replyTemplate">Reply Template</Label>
            <Textarea
              id="replyTemplate"
              value={formData.replyTemplate}
              onChange={(e) => setFormData({ ...formData, replyTemplate: e.target.value })}
              placeholder="Hello! Thank you for your message. How can I help you today?"
              rows={3}
            />
          </div>
        )}

        {(formData.replyType === 'AI_GENERATED' || formData.replyType === 'MIXED') && (
          <>
            <div>
              <Label htmlFor="aiPromptTemplate">AI Prompt Template</Label>
              <Textarea
                id="aiPromptTemplate"
                value={formData.aiPromptTemplate}
                onChange={(e) => setFormData({ ...formData, aiPromptTemplate: e.target.value })}
                placeholder="Respond professionally and helpfully to: {message}"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aiModel">AI Model</Label>
                <Select
                  value={formData.aiModel}
                  onValueChange={(value) => setFormData({ ...formData, aiModel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxReplyLength">Max Reply Length</Label>
                <Input
                  id="maxReplyLength"
                  type="number"
                  value={formData.maxReplyLength}
                  onChange={(e) => setFormData({ ...formData, maxReplyLength: parseInt(e.target.value) || 500 })}
                />
              </div>
            </div>
          </>
        )}

        <div>
          <Label htmlFor="fallbackReply">Fallback Reply</Label>
          <Textarea
            id="fallbackReply"
            value={formData.fallbackReply}
            onChange={(e) => setFormData({ ...formData, fallbackReply: e.target.value })}
            placeholder="Thank you for your message. We'll get back to you soon."
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="includeBrandVoice"
            checked={formData.includeBrandVoice}
            onCheckedChange={(checked) => setFormData({ ...formData, includeBrandVoice: checked })}
          />
          <Label htmlFor="includeBrandVoice">Include Brand Voice</Label>
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </Tabs>
  );
};

export default WhatsAppAutoReplyManager;
