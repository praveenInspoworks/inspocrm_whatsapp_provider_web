import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Download,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  subscriptionService,
  Subscription,
  SubscriptionPlanDetails,
  SubscriptionStatusResponse,
  PaymentMethod,
  Invoice,
  UsageMetrics,
} from '@/services/subscriptionService';
import { paymentService } from '@/services/paymentService';
import { trialService, TrialStatus } from '@/services/trialService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export function SubscriptionManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const [sub, subStatus, methods, invs, usageData, trial] = await Promise.all([
        subscriptionService.getSubscription().catch(() => null),
        subscriptionService.getSubscriptionStatus(),
        subscriptionService.getPaymentMethods(),
        subscriptionService.getInvoices(),
        subscriptionService.getUsageMetrics(),
        trialService.getTrialStatus().catch(() => null),
      ]);

      setSubscription(sub);
      setStatus(subStatus);
      setPaymentMethods(methods);
      setInvoices(invs);
      setUsage(usageData);
      setTrialStatus(trial);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load subscription data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: string, billingCycle: 'MONTHLY' | 'YEARLY') => {
    try {
      setLoading(true);
      await subscriptionService.upgradeSubscription({
        newPlan: newPlan as any,
        billingCycle,
        prorate: true,
      });
      await loadSubscriptionData();
      setShowUpgradeDialog(false);
    } catch (error: any) {
      // Error handled by service
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async (newPlan: string, effectiveDate: 'IMMEDIATE' | 'END_OF_PERIOD') => {
    try {
      setLoading(true);
      await subscriptionService.downgradeSubscription({
        newPlan: newPlan as any,
        effectiveDate,
      });
      await loadSubscriptionData();
    } catch (error: any) {
      // Error handled by service
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      await subscriptionService.cancelSubscription({
        reason: 'User requested cancellation',
      });
      await loadSubscriptionData();
      setShowCancelDialog(false);
    } catch (error: any) {
      // Error handled by service
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setLoading(true);
      await subscriptionService.reactivateSubscription();
      await loadSubscriptionData();
    } catch (error: any) {
      // Error handled by service
    } finally {
      setLoading(false);
    }
  };

  if (loading && !subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = subscription
    ? subscriptionService.getPlanDetails(subscription.plan)
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription, billing, and usage
          </p>
        </div>
        <Button onClick={loadSubscriptionData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Trial Warning */}
      {trialStatus?.isTrial && !trialStatus.isExpired && (
        <Alert className={trialStatus.daysRemaining <= 7 ? 'border-orange-500 bg-orange-50' : ''}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Free Trial Active:</strong> {trialStatus.daysRemaining} days remaining.
            {trialStatus.daysRemaining <= 7 && (
              <Button
                variant="link"
                className="ml-2 p-0 h-auto"
                onClick={() => setShowUpgradeDialog(true)}
              >
                Upgrade now
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Card */}
      {subscription && currentPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan: {currentPlan.name}
                  {currentPlan.popular && (
                    <Badge variant="default" className="bg-primary">
                      Popular
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {currentPlan.description}
                </CardDescription>
              </div>
              <Badge
                variant={
                  subscription.status === 'ACTIVE'
                    ? 'default'
                    : subscription.status === 'TRIAL'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Billing Cycle</p>
                <p className="text-lg font-semibold">{subscription.billingCycle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Billing Date</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-lg font-semibold">
                  ${subscription.billingCycle === 'YEARLY'
                    ? currentPlan.price.yearly
                    : currentPlan.price.monthly}
                  /{subscription.billingCycle === 'YEARLY' ? 'year' : 'month'}
                </p>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will be cancelled at the end of the current billing period.
                  <Button
                    variant="link"
                    className="ml-2 p-0 h-auto"
                    onClick={handleReactivate}
                  >
                    Reactivate
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {status?.canUpgrade && (
                <Button onClick={() => setShowUpgradeDialog(true)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
              {status?.canDowngrade && (
                <Button variant="outline" onClick={() => setShowUpgradeDialog(true)}>
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              )}
              {!subscription.cancelAtPeriodEnd && (
                <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Metrics */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage & Limits</CardTitle>
            <CardDescription>Your current usage against plan limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(usage).map(([key, metric]) => {
                if (metric.limit === -1) return null; // Skip unlimited
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{key}</span>
                      <span>
                        {metric.used.toLocaleString()} / {metric.limit.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={metric.percentage} className="h-2" />
                    {metric.percentage >= 80 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {metric.percentage >= 100
                          ? 'Limit reached'
                          : 'Approaching limit'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Payment Methods and Invoices */}
      <Tabs defaultValue="payment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No payment methods added</p>
                  <Button>Add Payment Method</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {method.card?.brand.toUpperCase()} •••• {method.card?.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.card?.expMonth}/{method.card?.expYear}
                          </p>
                        </div>
                        {method.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              subscriptionService.setDefaultPaymentMethod(method.id)
                            }
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            subscriptionService.removePaymentMethod(method.id)
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Invoice #{invoice.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.periodStart).toLocaleDateString()} -{' '}
                          {new Date(invoice.periodEnd).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold mt-1">
                          ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            invoice.status === 'PAID'
                              ? 'default'
                              : invoice.status === 'UNPAID'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                        {invoice.pdfUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              subscriptionService.downloadInvoice(invoice.id)
                            }
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionService.getAvailablePlans().map((plan) => {
              if (plan.id === 'FREE_TRIAL') return null;
              const isCurrentPlan = subscription?.plan === plan.id;
              return (
                <Card key={plan.id} className={plan.popular ? 'border-primary border-2' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.popular && (
                        <Badge className="bg-primary">Popular</Badge>
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        ${plan.price.monthly}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrentPlan ? (
                      <Button disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedPlan(plan.id);
                          setShowUpgradeDialog(true);
                        }}
                      >
                        {subscription && subscriptionService.getPlanDetails(subscription.plan).price.monthly < plan.price.monthly
                          ? 'Upgrade'
                          : 'Switch Plan'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan and billing cycle
            </DialogDescription>
          </DialogHeader>
          {/* Plan selection UI would go here */}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

