import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, TrendingUp, MessageSquare, Users, BarChart3, PieChart, Activity, Clock, Target } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { get } from '@/services/apiService';

interface AnalyticsData {
  campaignAnalytics?: any;
  messageAnalytics?: any;
  tenantAnalytics?: any;
  campaignStatusDistribution?: any;
  messageTrends?: any[];
  providerComparison?: any[];
  successRateAnalysis?: any;
  hourlyDistribution?: any;
  topPerformingCampaigns?: any[];
}

interface ApiError {
  endpoint: string;
  error: any;
}

const WhatsAppAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // For now, provide mock data to prevent logout issues
      // TODO: Replace with actual API calls once analytics service is fully implemented
      const mockAnalyticsData: AnalyticsData = {
        campaignAnalytics: {
          totalCampaigns: 0,
          scheduledCampaigns: 0,
          runningCampaigns: 0,
          completedCampaigns: 0,
          failedCampaigns: 0,
          cancelledCampaigns: 0,
          totalMessagesSent: 0,
          totalMessagesDelivered: 0,
          totalMessagesRead: 0,
          deliveryRate: 0,
          readRate: 0,
          averageMessagesPerCampaign: 0,
          periodStartDate: dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          periodEndDate: dateRange.to || new Date(),
        },
        messageAnalytics: {
          totalMessagesSent: 0,
          totalMessagesDelivered: 0,
          totalMessagesRead: 0,
          totalMessagesFailed: 0,
          deliveryRate: 0,
          readRate: 0,
          failureRate: 0,
          hourlyDistribution: {},
          periodStartDate: dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          periodEndDate: dateRange.to || new Date(),
        },
        tenantAnalytics: {
          totalCampaigns: 0,
          totalBusinessAccounts: 0,
          activeBusinessAccounts: 0,
          totalMessagesSent: 0,
          totalMessagesDelivered: 0,
          totalMessagesRead: 0,
          overallDeliveryRate: 0,
          overallReadRate: 0,
          campaignStatusDistribution: {},
          periodStartDate: dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          periodEndDate: dateRange.to || new Date(),
        },
        campaignStatusDistribution: {
          totalCampaigns: 0,
          distribution: []
        },
        messageTrends: [],
        providerComparison: [],
        successRateAnalysis: {
          totalCampaigns: 0,
          successfulCampaigns: 0,
          overallSuccessRate: 0,
          completionRate: 0,
          successByCampaignType: {}
        },
        hourlyDistribution: {
          date: format(new Date(), 'yyyy-MM-dd'),
          totalMessagesSent: 0,
          totalMessagesDelivered: 0,
          totalMessagesRead: 0,
          hourlyData: []
        },
        topPerformingCampaigns: []
      };

      // Only try to load real data for basic endpoints that are more likely to work
      try {
        const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
        const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

        // Try loading basic campaign overview
        // const campaignOverview = await get(`/api/whatsapp/analytics/campaigns/overview?startDate=${startDate}&endDate=${endDate}`);
        // if (campaignOverview) {
        //   mockAnalyticsData.campaignAnalytics = campaignOverview;
        // }
      } catch (error) {
        console.warn('Campaign analytics not available, using mock data');
      }

      try {
        const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
        const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

        // Try loading tenant overview
       // const tenantOverview = await get(`/api/whatsapp/analytics/tenant/overview?startDate=${startDate}&endDate=${endDate}`);
      //  if (tenantOverview) {
        //  mockAnalyticsData.tenantAnalytics = tenantOverview;
      //  }
      } catch (error) {
        console.warn('Tenant analytics not available, using mock data');
      }

      setAnalyticsData(mockAnalyticsData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      // Set empty analytics data to prevent dashboard from breaking
      setAnalyticsData({});
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'scheduled': return '#3b82f6';
      case 'running': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive analytics for your WhatsApp campaigns</p>
        </div>

        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[280px] justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={loadAnalyticsData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData?.campaignAnalytics?.totalCampaigns)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData?.campaignAnalytics?.completedCampaigns)} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData?.campaignAnalytics?.totalMessagesSent)}</div>
            <p className="text-xs text-muted-foreground">
              Delivery rate: {formatPercentage(analyticsData?.campaignAnalytics?.deliveryRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analyticsData?.campaignAnalytics?.readRate)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData?.campaignAnalytics?.totalMessagesRead)} messages read
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData?.tenantAnalytics?.activeBusinessAccounts)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatNumber(analyticsData?.tenantAnalytics?.totalBusinessAccounts)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Status Distribution</CardTitle>
                <CardDescription>Breakdown of campaign statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.campaignStatusDistribution?.distribution?.map((item: any) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStatusColor(item.status) }}
                        ></div>
                        <span className="text-sm capitalize">{item.status.toLowerCase()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{item.count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({analyticsData.campaignStatusDistribution.totalCampaigns > 0
                            ? ((item.count / analyticsData.campaignStatusDistribution.totalCampaigns) * 100).toFixed(1)
                            : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Message Trends</CardTitle>
                <CardDescription>Daily message delivery over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analyticsData?.messageTrends?.slice(-7).map((item: any) => (
                    <div key={item.date} className="flex items-center justify-between text-sm">
                      <span>{item.date}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-blue-600">Sent: {formatNumber(item.messagesSent)}</span>
                        <span className="text-green-600">Del: {formatNumber(item.messagesDelivered)}</span>
                        <span className="text-purple-600">Read: {formatNumber(item.messagesRead)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tenant Overview</CardTitle>
              <CardDescription>Overall WhatsApp marketing performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(analyticsData?.tenantAnalytics?.totalCampaigns)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(analyticsData?.tenantAnalytics?.overallDeliveryRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Delivery Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(analyticsData?.tenantAnalytics?.overallReadRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Read Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatNumber(analyticsData?.tenantAnalytics?.totalMessagesSent)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Messages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Campaigns ranked by delivery rate and message volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topPerformingCampaigns?.map((campaign: any, index: number) => (
                  <div key={campaign.campaignId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{campaign.campaignName}</div>
                        <div className="text-sm text-muted-foreground">
                          {campaign.campaignType} • {formatNumber(campaign.messagesSent)} messages
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPercentage(campaign.deliveryRate)}</div>
                      <div className="text-sm text-muted-foreground">Delivery Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Success Analysis</CardTitle>
              <CardDescription>Success rates and completion statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(analyticsData?.successRateAnalysis?.overallSuccessRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Success Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(analyticsData?.successRateAnalysis?.completionRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(analyticsData?.successRateAnalysis?.successfulCampaigns)}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful Campaigns</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Delivery Analytics</CardTitle>
              <CardDescription>Detailed message delivery statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(analyticsData?.messageAnalytics?.totalMessagesSent)}
                  </div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(analyticsData?.messageAnalytics?.totalMessagesDelivered)}
                  </div>
                  <div className="text-sm text-muted-foreground">Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(analyticsData?.messageAnalytics?.totalMessagesRead)}
                  </div>
                  <div className="text-sm text-muted-foreground">Read</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatNumber(analyticsData?.messageAnalytics?.totalMessagesFailed)}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {formatPercentage(analyticsData?.messageAnalytics?.deliveryRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Delivery Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    {formatPercentage(analyticsData?.messageAnalytics?.readRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Read Rate</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    {formatPercentage(analyticsData?.messageAnalytics?.failureRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Failure Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Message Distribution</CardTitle>
              <CardDescription>Message activity throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {analyticsData?.hourlyDistribution?.hourlyData?.map((item: any) => (
                  <div key={item.hour} className="text-center p-2 border rounded">
                    <div className="text-sm font-medium">{item.hour}</div>
                    <div className="text-xs text-blue-600">Sent: {item.messagesSent}</div>
                    <div className="text-xs text-green-600">Del: {item.messagesDelivered}</div>
                    <div className="text-xs text-purple-600">Read: {item.messagesRead}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance Comparison</CardTitle>
              <CardDescription>Compare delivery rates across different WhatsApp providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.providerComparison?.map((provider: any, index: number) => (
                  <div key={provider.accountName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{provider.accountName}</div>
                        <div className="text-sm text-muted-foreground">
                          {provider.provider} • {provider.totalCampaigns} campaigns
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{provider.deliveryRate}%</div>
                      <div className="text-sm text-muted-foreground">Delivery Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData?.providerComparison?.map((provider: any) => (
              <Card key={provider.accountName}>
                <CardHeader>
                  <CardTitle className="text-lg">{provider.accountName}</CardTitle>
                  <Badge variant="outline">{provider.provider}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Campaigns:</span>
                      <span className="font-medium">{provider.totalCampaigns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Messages Sent:</span>
                      <span className="font-medium">{formatNumber(provider.totalMessagesSent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Delivery Rate:</span>
                      <span className="font-medium text-green-600">{provider.deliveryRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Read Rate:</span>
                      <span className="font-medium text-purple-600">{provider.readRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators for campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Average Messages per Campaign</span>
                    </div>
                    <span className="font-medium">
                      {analyticsData?.campaignAnalytics?.averageMessagesPerCampaign?.toFixed(1) || '0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Overall Delivery Rate</span>
                    </div>
                    <span className="font-medium">
                      {formatPercentage(analyticsData?.campaignAnalytics?.deliveryRate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Overall Read Rate</span>
                    </div>
                    <span className="font-medium">
                      {formatPercentage(analyticsData?.campaignAnalytics?.readRate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Scheduled Campaigns</span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(analyticsData?.campaignAnalytics?.scheduledCampaigns)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate Breakdown</CardTitle>
                <CardDescription>Campaign success analysis by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.successRateAnalysis?.successByCampaignType &&
                    Object.entries(analyticsData.successRateAnalysis.successByCampaignType).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type.toLowerCase()}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${analyticsData.successRateAnalysis.totalCampaigns > 0
                                  ? (count / analyticsData.successRateAnalysis.totalCampaigns) * 100
                                  : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Trends</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {analyticsData?.messageTrends?.slice(-10).map((item: any) => (
                  <div key={item.date} className="flex items-center justify-between text-sm p-2 border-b">
                    <span className="font-medium">{item.date}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600">Delivery: {item.deliveryRate}%</span>
                      <span className="text-blue-600">Sent: {formatNumber(item.messagesSent)}</span>
                      <span className="text-purple-600">Read: {formatNumber(item.messagesRead)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppAnalyticsDashboard;
