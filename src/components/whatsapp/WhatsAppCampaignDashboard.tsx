import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Plus, Search, Filter, MoreHorizontal, Eye,
  Edit, Trash2, Play, Pause, BarChart3, Users, Clock,
  CheckCircle, XCircle, AlertTriangle, Send, Calendar,
  TrendingUp, TrendingDown, Zap, RefreshCw, Download
} from 'lucide-react';
import { get, post, put, del } from '@/services/apiService';

interface WhatsAppCampaign {
  id: number;
  campaignName: string;
  campaignType: string;
  businessAccountId: number;
  templateId?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  replyCount: number;
  deliveryRate: number;
  readRate: number;
  replyRate: number;
  scheduledTime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  aiPrompt?: string;
  aiModel?: string;
  brandAlignmentScore?: number;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessages: number;
  totalDelivered: number;
  totalRead: number;
  totalReplies: number;
  averageDeliveryRate: number;
  averageReadRate: number;
  averageReplyRate: number;
}

export function WhatsAppCampaignDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Load data
  useEffect(() => {
    loadCampaigns();
    loadStats();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await get('/api/v1/whatsapp/campaigns');
      setCampaigns(response || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load WhatsApp campaigns.",
        variant: "destructive"
      });
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await get('/api/v1/whatsapp/campaigns/stats');
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null);
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'RUNNING': return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'RUNNING': return <Play className="h-4 w-4" />;
      case 'SCHEDULED': return <Clock className="h-4 w-4" />;
      case 'DRAFT': return <Edit className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      case 'FAILED': return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Campaign actions
  const handleViewDetails = (campaign: WhatsAppCampaign) => {
    setSelectedCampaign(campaign);
    setShowDetailsDialog(true);
  };

  const handleEditCampaign = (campaign: WhatsAppCampaign) => {
    navigate(`/whatsapp/campaigns/${campaign.id}/edit`);
  };

  const handleDeleteCampaign = async (campaign: WhatsAppCampaign) => {
    if (!confirm(`Are you sure you want to delete "${campaign.campaignName}"?`)) return;

    try {
      await del(`/api/v1/whatsapp/campaigns/${campaign.id}`);
      toast({
        title: "Campaign Deleted",
        description: "WhatsApp campaign has been deleted successfully.",
      });
      loadCampaigns();
      loadStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive"
      });
    }
  };

  const handleSendNow = async (campaign: WhatsAppCampaign) => {
    try {
      await post(`/api/v1/whatsapp/campaigns/${campaign.id}/send`);
      toast({
        title: "Campaign Sent",
        description: "WhatsApp campaign is being sent immediately.",
      });
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send campaign.",
        variant: "destructive"
      });
    }
  };

  const handleCancelCampaign = async (campaign: WhatsAppCampaign) => {
    try {
      await post(`/api/v1/whatsapp/campaigns/${campaign.id}/cancel`);
      toast({
        title: "Campaign Cancelled",
        description: "WhatsApp campaign has been cancelled.",
      });
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel campaign.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading WhatsApp campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and monitor your WhatsApp marketing campaigns
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadCampaigns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/whatsapp/generator')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                  <p className="text-3xl font-bold">{stats.totalCampaigns}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">+12.5%</span>
                <span className="text-muted-foreground ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Messages Delivered</p>
                  <p className="text-3xl font-bold">{stats.totalDelivered.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4">
                <Progress value={stats.averageDeliveryRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.averageDeliveryRate.toFixed(1)}% avg delivery rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Messages Read</p>
                  <p className="text-3xl font-bold">{stats.totalRead.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-4">
                <Progress value={stats.averageReadRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.averageReadRate.toFixed(1)}% avg read rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Replies</p>
                  <p className="text-3xl font-bold">{stats.totalReplies.toLocaleString()}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">+8.2%</span>
                <span className="text-muted-foreground ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first WhatsApp campaign to get started'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => navigate('/whatsapp/generator')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.campaignName}</div>
                          <div className="text-sm text-muted-foreground">
                            {campaign.campaignType} • ID: {campaign.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1">{campaign.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{campaign.sentCount}/{campaign.totalRecipients}</div>
                          <div className="text-muted-foreground">sent</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600">📨 {campaign.deliveryRate?.toFixed(1)}%</span>
                            <span className="text-blue-600">👁️ {campaign.readRate?.toFixed(1)}%</span>
                            <span className="text-purple-600">💬 {campaign.replyRate?.toFixed(1)}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {campaign.scheduledTime ? (
                            <div>
                              <div className="font-medium">{formatDate(campaign.scheduledTime)}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCampaign(campaign)}
                            disabled={campaign.status === 'RUNNING' || campaign.status === 'COMPLETED'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {campaign.status === 'SCHEDULED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendNow(campaign)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {(campaign.status === 'SCHEDULED' || campaign.status === 'RUNNING') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelCampaign(campaign)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign)}
                            disabled={campaign.status === 'RUNNING'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Campaign Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedCampaign.campaignName}</div>
                    <div><span className="font-medium">Type:</span> {selectedCampaign.campaignType}</div>
                    <div><span className="font-medium">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedCampaign.status)}`}>
                        {selectedCampaign.status}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Created:</span> {formatDate(selectedCampaign.createdAt)}</div>
                    {selectedCampaign.scheduledTime && (
                      <div><span className="font-medium">Scheduled:</span> {formatDate(selectedCampaign.scheduledTime)}</div>
                    )}
                    {selectedCampaign.completedAt && (
                      <div><span className="font-medium">Completed:</span> {formatDate(selectedCampaign.completedAt)}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Performance Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Total Recipients:</span> {selectedCampaign.totalRecipients}</div>
                    <div><span className="font-medium">Sent:</span> {selectedCampaign.sentCount}</div>
                    <div><span className="font-medium">Delivered:</span> {selectedCampaign.deliveredCount}</div>
                    <div><span className="font-medium">Read:</span> {selectedCampaign.readCount}</div>
                    <div><span className="font-medium">Replies:</span> {selectedCampaign.replyCount}</div>
                  </div>
                </div>
              </div>

              {/* Performance Bars */}
              <div>
                <h3 className="font-semibold mb-4">Delivery Performance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Delivery Rate</span>
                      <span>{selectedCampaign.deliveryRate?.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedCampaign.deliveryRate || 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Read Rate</span>
                      <span>{selectedCampaign.readRate?.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedCampaign.readRate || 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Reply Rate</span>
                      <span>{selectedCampaign.replyRate?.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedCampaign.replyRate || 0} className="h-2" />
                  </div>
                </div>
              </div>

              {/* AI Information */}
              {(selectedCampaign.aiPrompt || selectedCampaign.aiModel || selectedCampaign.brandAlignmentScore) && (
                <div>
                  <h3 className="font-semibold mb-2">AI Generation Details</h3>
                  <div className="space-y-2 text-sm">
                    {selectedCampaign.aiModel && (
                      <div><span className="font-medium">AI Model:</span> {selectedCampaign.aiModel}</div>
                    )}
                    {selectedCampaign.brandAlignmentScore && (
                      <div><span className="font-medium">Brand Alignment:</span> {selectedCampaign.brandAlignmentScore.toFixed(1)}%</div>
                    )}
                    {selectedCampaign.aiPrompt && (
                      <div>
                        <span className="font-medium">AI Prompt:</span>
                        <p className="mt-1 text-muted-foreground">{selectedCampaign.aiPrompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
