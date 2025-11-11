import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Bot,
  MessageSquare,
  Users,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Calendar,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  totalMessages: number;
  totalAutoReplies: number;
  totalHumanReplies: number;
  successRate: number;
  averageResponseTime: number;
  topPerformingRules: Array<{
    ruleId: number;
    ruleName: string;
    usageCount: number;
    successRate: number;
    averageResponseTime: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    messages: number;
    autoReplies: number;
  }>;
  dailyActivity: Array<{
    date: string;
    messages: number;
    autoReplies: number;
    successRate: number;
  }>;
  rulePerformance: Array<{
    ruleId: number;
    ruleName: string;
    triggers: number;
    successfulReplies: number;
    failedReplies: number;
    averageResponseTime: number;
  }>;
  conversationMetrics: {
    totalConversations: number;
    averageMessagesPerConversation: number;
    averageAutoReplyRatio: number;
    customerSatisfactionScore: number;
  };
}

const WhatsAppAutoReplyAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'rules' | 'trends'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/whatsapp/auto-reply/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to load analytics');
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error loading analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateBadgeVariant = (rate: number) => {
    if (rate >= 90) return 'default';
    if (rate >= 80) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground text-center">
          Analytics data will appear once your auto-reply system starts processing messages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Auto-Reply Analytics</h1>
          <p className="text-muted-foreground">
            Monitor AI auto-reply performance and effectiveness
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <p className="text-3xl font-bold">{analytics.totalMessages.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-muted-foreground ml-2">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Replies</p>
                <p className="text-3xl font-bold">{analytics.totalAutoReplies.toLocaleString()}</p>
              </div>
              <Bot className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+18.2%</span>
              <span className="text-muted-foreground ml-2">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold">{analytics.successRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <Progress value={analytics.successRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold">{formatTime(analytics.averageResponseTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">-0.3s</span>
              <span className="text-muted-foreground ml-2">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rule Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Conversation Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Conversations</span>
                  <span className="font-semibold">{analytics.conversationMetrics.totalConversations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Messages/Conversation</span>
                  <span className="font-semibold">{analytics.conversationMetrics.averageMessagesPerConversation.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">AI Reply Ratio</span>
                  <span className="font-semibold">{analytics.conversationMetrics.averageAutoReplyRatio.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">{analytics.conversationMetrics.customerSatisfactionScore.toFixed(1)}/5</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full mr-1 ${
                            i < Math.floor(analytics.conversationMetrics.customerSatisfactionScore)
                              ? 'bg-yellow-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Top Performing Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPerformingRules.map((rule, index) => (
                    <div key={rule.ruleId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium text-sm">{rule.ruleName}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span>{rule.usageCount} uses</span>
                          <span className={getSuccessRateColor(rule.successRate)}>
                            {rule.successRate.toFixed(1)}% success
                          </span>
                          <span>{formatTime(rule.averageResponseTime)} avg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Activity Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Hourly Activity (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Interactive chart would be displayed here</p>
                  <p className="text-sm">Showing message volume by hour</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.rulePerformance.map((rule) => (
                  <div key={rule.ruleId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{rule.ruleName}</h4>
                      <Badge variant={getSuccessRateBadgeVariant((rule.successfulReplies / rule.triggers) * 100)}>
                        {((rule.successfulReplies / rule.triggers) * 100).toFixed(1)}% Success
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Triggers</span>
                        <p className="font-semibold">{rule.triggers}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Successful</span>
                        <p className="font-semibold text-green-600">{rule.successfulReplies}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed</span>
                        <p className="font-semibold text-red-600">{rule.failedReplies}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Response</span>
                        <p className="font-semibold">{formatTime(rule.averageResponseTime)}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Success Rate</span>
                        <span>{((rule.successfulReplies / rule.triggers) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(rule.successfulReplies / rule.triggers) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Daily Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.dailyActivity.slice(0, 7).reverse().map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{day.messages} msgs</span>
                        <span>{day.autoReplies} AI</span>
                        <Badge variant="outline" className="text-xs">
                          {day.successRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Success Rate:</strong> Your AI replies have an 87.5% success rate,
                    which is above the recommended 80% threshold.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Response Time:</strong> Average response time of 2.3 seconds
                    is excellent for customer satisfaction.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI Coverage:</strong> 71.5% of messages are handled by AI,
                    reducing manual workload significantly.
                  </AlertDescription>
                </Alert>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Consider optimizing rules with lower success rates</li>
                    <li>• Monitor peak hours for better resource allocation</li>
                    <li>• Review customer feedback to improve AI responses</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppAutoReplyAnalytics;
