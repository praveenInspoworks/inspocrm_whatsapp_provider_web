import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar, DollarSign, SkipForward, CheckCircle, AlertCircle, Sparkles, Shield, Zap, Crown, Star, ArrowRight, Lock, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import apiService from "@/services/apiService";
import { onboardingService } from "@/services/onboardingService";

interface BillingSetupData {
  subscriptionPlan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  paymentMethod: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
    billingAddress: {
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      zipcode: string;
      country: string;
    };
  };
  skipForNow: boolean;
}

export function BillingSetupForm() {
  const { user, onboardingStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [billingData, setBillingData] = useState<BillingSetupData>({
    subscriptionPlan: 'PREMIUM',
    paymentMethod: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
      billingAddress: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipcode: '',
        country: 'United States'
      }
    },
    skipForNow: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(24 * 60 * 60); // 24 hours in seconds
  const [currentStep, setCurrentStep] = useState<'plans' | 'payment' | 'confirmation'>('plans');

  // Check if this is onboarding context
  const isOnboardingContext = onboardingStatus && !onboardingStatus.isOnboardingComplete;

  // Countdown timer for skip option
  useEffect(() => {
    if (billingData.skipForNow) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [billingData.skipForNow]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setBillingData(prev => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        [field]: value
      }
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setBillingData(prev => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        billingAddress: {
          ...prev.paymentMethod.billingAddress,
          [field]: value
        }
      }
    }));
  };

  const handlePlanChange = (plan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE') => {
    setBillingData(prev => ({
      ...prev,
      subscriptionPlan: plan
    }));
  };

  const validateCardNumber = (cardNumber: string) => {
    // Basic Luhn algorithm validation
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const getCardType = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'MasterCard';
    if (/^3[47]/.test(cleaned)) return 'American Express';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    return 'Unknown';
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (billingData.skipForNow) {
        // Handle skip logic - mark as skipped in backend
        const skipResponse = await onboardingService.skipOnboardingStep('billing_setup');

        if (skipResponse.success) {
          toast({
            title: "Billing Skipped",
            description: "Skip now we move next step as brand voice setup",
          });

          // Mark step as skipped in the AI bot
          window.dispatchEvent(new CustomEvent('onboardingStepSkipped', {
            detail: { stepId: 'billing_setup', reason: 'user_skipped' }
          }));

          // Navigate to next step
          navigate('/brand-voice');
        } else {
          toast({
            title: "Skip Failed",
            description: skipResponse.message || "Failed to skip billing setup.",
            variant: "destructive",
          });
        }
        return;
      }

      // Validate payment information
      if (!validateCardNumber(billingData.paymentMethod.cardNumber)) {
        toast({
          title: "Invalid Card Number",
          description: "Please enter a valid credit card number.",
          variant: "destructive",
        });
        return;
      }

      if (!billingData.paymentMethod.cardholderName.trim()) {
        toast({
          title: "Cardholder Name Required",
          description: "Please enter the cardholder name.",
          variant: "destructive",
        });
        return;
      }

      // Prepare payment method data
      const paymentMethodData = {
        paymentGateway: 'STRIPE',
        paymentType: 'CREDIT_CARD',
        cardLastFour: billingData.paymentMethod.cardNumber.slice(-4),
        cardBrand: getCardType(billingData.paymentMethod.cardNumber),
        expiryMonth: parseInt(billingData.paymentMethod.expiryMonth),
        expiryYear: parseInt(billingData.paymentMethod.expiryYear),
        billingAddress: billingData.paymentMethod.billingAddress,
        isDefault: true
      };

      // Setup billing through onboarding service
      const billingSetupData = {
        subscriptionPlan: billingData.subscriptionPlan,
        paymentMethod: paymentMethodData,
        skipForNow: false
      };

      const response = await onboardingService.setupBilling(billingSetupData);

      if (response.success) {
        toast({
          title: "Payment Setup Complete",
          description: "Your subscription has been activated successfully!",
        });

        // Mark step as completed in the AI bot
        window.dispatchEvent(new CustomEvent('onboardingStepCompleted', {
          detail: { stepId: 'billing_setup' }
        }));

        // Navigate to next step
        navigate('/brand-voice');
      } else {
        throw new Error(response.message);
      }

    } catch (error: any) {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to set up billing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'BASIC',
      name: 'Basic Plan',
      price: '$29.99',
      period: '/month',
      features: [
        'Up to 5 users',
        '10 GB storage',
        'Basic CRM features',
        'Email integration',
        'Basic reporting',
        'Mobile app access',
        'Email support'
      ]
    },
    {
      id: 'PREMIUM',
      name: 'Premium Plan',
      price: '$79.99',
      period: '/month',
      features: [
        'Up to 25 users',
        '100 GB storage',
        'Advanced CRM features',
        'AI content generation',
        'Advanced analytics',
        'Social media integration',
        'Priority support',
        'API access'
      ],
      popular: true
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise Plan',
      price: '$199.99',
      period: '/month',
      features: [
        'Up to 100 users',
        '1 TB storage',
        'Full CRM suite',
        'AI content generation',
        'Advanced analytics',
        'Social media integration',
        'Dedicated support',
        'API access',
        'Custom integrations',
        'SLA guarantee'
      ]
    }
  ];

  const selectedPlan = plans.find(p => p.id === billingData.subscriptionPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce-gentle">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 animate-slide-up">
            Choose Your Success Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            Unlock the full potential of INSPOCRM with our professional plans designed for growing businesses
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8 animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Company Setup</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <span className="text-sm font-medium text-blue-700">Billing & Payment</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">3</span>
              </div>
              <span className="text-sm font-medium text-gray-500">Brand Voice</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Subscription Plans */}
          <div className="xl:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`relative group cursor-pointer transform transition-all duration-500 hover:scale-105 animate-slide-up ${
                    billingData.subscriptionPlan === plan.id
                      ? 'scale-105'
                      : ''
                  }`}
                  style={{animationDelay: `${0.6 + index * 0.1}s`}}
                  onClick={() => handlePlanChange(plan.id as 'BASIC' | 'PREMIUM' | 'ENTERPRISE')}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg animate-bounce">
                        ⭐ Most Popular
                      </div>
                    </div>
                  )}

                  <div className={`relative h-full bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 overflow-hidden ${
                    billingData.subscriptionPlan === plan.id
                      ? 'border-blue-500 shadow-blue-200 shadow-2xl ring-4 ring-blue-100'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-2xl'
                  }`}>

                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${
                      plan.id === 'BASIC' ? 'from-blue-500 to-blue-600' :
                      plan.id === 'PREMIUM' ? 'from-purple-500 to-purple-600' :
                      'from-yellow-500 to-orange-600'
                    }`}></div>

                    <div className="relative p-6 h-full flex flex-col">
                      {/* Plan Header */}
                      <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                          plan.id === 'BASIC' ? 'bg-blue-100 text-blue-600' :
                          plan.id === 'PREMIUM' ? 'bg-purple-100 text-purple-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {plan.id === 'BASIC' ? <Shield className="w-6 h-6" /> :
                           plan.id === 'PREMIUM' ? <Zap className="w-6 h-6" /> :
                           <Crown className="w-6 h-6" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold text-gray-900">{plan.price.split('$')[1]}</span>
                          <span className="text-lg text-gray-500 ml-1">{plan.period}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex-1 space-y-3 mb-6">
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 4 && (
                          <div className="text-sm text-gray-500 text-center">
                            +{plan.features.length - 4} more features
                          </div>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      <div className={`w-full h-1 rounded-full transition-all duration-300 ${
                        billingData.subscriptionPlan === plan.id
                          ? `bg-gradient-to-r ${
                              plan.id === 'BASIC' ? 'from-blue-500 to-blue-600' :
                              plan.id === 'PREMIUM' ? 'from-purple-500 to-purple-600' :
                              'from-yellow-500 to-orange-600'
                            }`
                          : 'bg-gray-200'
                      }`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Form */}
            {!billingData.skipForNow && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up" style={{animationDelay: '1s'}}>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Secure Payment Information</h3>
                      <p className="text-sm text-gray-600">Your payment information is encrypted and secure</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Card Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                      Card Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">Card Number *</Label>
                        <div className="relative mt-1">
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={billingData.paymentMethod.cardNumber}
                            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                            className="pl-12 pr-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="expiryMonth" className="text-sm font-medium text-gray-700">Expiry Month *</Label>
                        <Input
                          id="expiryMonth"
                          placeholder="MM"
                          value={billingData.paymentMethod.expiryMonth}
                          onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <Label htmlFor="expiryYear" className="text-sm font-medium text-gray-700">Expiry Year *</Label>
                        <Input
                          id="expiryYear"
                          placeholder="YYYY"
                          value={billingData.paymentMethod.expiryYear}
                          onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">CVV *</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={billingData.paymentMethod.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="cardholderName" className="text-sm font-medium text-gray-700">Cardholder Name *</Label>
                        <Input
                          id="cardholderName"
                          placeholder="John Doe"
                          value={billingData.paymentMethod.cardholderName}
                          onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Billing Address</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="addressLine1" className="text-sm font-medium text-gray-700">Address Line 1 *</Label>
                        <Input
                          id="addressLine1"
                          placeholder="123 Main Street"
                          value={billingData.paymentMethod.billingAddress.addressLine1}
                          onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="addressLine2" className="text-sm font-medium text-gray-700">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          placeholder="Apt 4B, Suite 100"
                          value={billingData.paymentMethod.billingAddress.addressLine2}
                          onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">City *</Label>
                        <Input
                          id="city"
                          placeholder="New York"
                          value={billingData.paymentMethod.billingAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <Label htmlFor="state" className="text-sm font-medium text-gray-700">State *</Label>
                        <Input
                          id="state"
                          placeholder="NY"
                          value={billingData.paymentMethod.billingAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <Label htmlFor="zipcode" className="text-sm font-medium text-gray-700">ZIP Code *</Label>
                        <Input
                          id="zipcode"
                          placeholder="10001"
                          value={billingData.paymentMethod.billingAddress.zipcode}
                          onChange={(e) => handleAddressChange('zipcode', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country *</Label>
                        <Input
                          id="country"
                          placeholder="United States"
                          value={billingData.paymentMethod.billingAddress.country}
                          onChange={(e) => handleAddressChange('country', e.target.value)}
                          className="mt-1 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up" style={{animationDelay: '0.8s'}}>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-semibold text-white">Order Summary</h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-gray-900">{selectedPlan?.name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Price</span>
                  <span className="font-semibold text-gray-900">{selectedPlan?.price}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Users</span>
                  <span className="font-semibold text-gray-900">{selectedPlan?.features[0]}</span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{selectedPlan?.price}/month</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-medium">Secure Payment Processing</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Your payment information is encrypted and processed securely
                  </p>
                </div>
              </div>
            </div>

            {/* Trial Option */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200 animate-slide-up" style={{animationDelay: '1.2s'}}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-orange-800 mb-2">Start Free Trial</h4>
                  <p className="text-orange-700 mb-4 text-sm">
                    Skip payment setup and enjoy 14 days of full access to all INSPOCRM features. No credit card required.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setBillingData(prev => ({ ...prev, skipForNow: true }))}
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400 transition-all duration-200"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start 14-Day Free Trial
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 animate-slide-up" style={{animationDelay: '1.4s'}}>
              <div className="text-center space-y-4">
                <div className="flex justify-center space-x-6">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-gray-600">SSL Secured</span>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-600">PCI Compliant</span>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Star className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-600">Money Back</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  30-day money-back guarantee • Cancel anytime • No hidden fees
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 pt-8 animate-fade-in" style={{animationDelay: '1.6s'}}>
          <Button
            variant="outline"
            onClick={() => navigate('/company-profile')}
            disabled={isLoading}
            className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            ← Back to Company Profile
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-12 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
              billingData.skipForNow ? 'from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing Payment...
              </>
            ) : billingData.skipForNow ? (
              <>
                <Sparkles className="w-5 h-5 mr-3" />
                Start My Free Trial
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-3" />
                Complete Setup & Start
              </>
            )}
          </Button>
        </div>

        {/* Trial Confirmation Modal */}
        {billingData.skipForNow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-scale-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Your Free Trial!</h3>
                <p className="text-gray-600 mb-6">
                  You've successfully started your 14-day free trial of INSPOCRM. Enjoy full access to all premium features!
                </p>
                <div className="bg-orange-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-orange-800">
                    <strong>What happens next?</strong><br />
                    We'll send gentle reminders to help you set up billing before your trial ends.
                  </p>
                </div>
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-3 rounded-xl font-semibold"
                >
                  Continue to Brand Voice Setup →
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes slide-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }

          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }

          .animate-slide-up {
            animation: slide-up 0.6s ease-out forwards;
          }

          .animate-bounce-gentle {
            animation: bounce-gentle 2s ease-in-out infinite;
          }

          .animate-scale-in {
            animation: scale-in 0.3s ease-out forwards;
          }
        `
      }} />
    </div>
  );
}
