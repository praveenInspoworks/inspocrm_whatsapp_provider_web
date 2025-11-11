import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputWithError } from "@/components/ui/form-fields/InputWithError";
import { SelectWithError } from "@/components/ui/form-fields/SelectWithError";
import { SelectItem } from "@/components/ui/select";
import {
  Building,
  User,
  CheckCircle,
  Loader2,
  X,
  TrendingUp,
  Users,
  Target,
  Zap,
  Shield,
  BarChart3,
  Sparkles,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService, AdminSignupRequest } from "@/services/authService";
import { tenantSignupSchema, TenantSignupFormData } from "@/lib/validations";

export function TenantSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<TenantSignupFormData>({
    resolver: zodResolver(tenantSignupSchema),
    mode: "onChange",
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const watchAgreeToTerms = watch("agreeToTerms");
  const formValues = getValues();

  const hasNoErrors = Object.keys(errors).length === 0;
  const hasRequiredFields = Boolean(
    formValues.firstName?.trim() &&
      formValues.lastName?.trim() &&
      formValues.email?.trim() &&
      formValues.organizationName?.trim() &&
      formValues.companySize
  );
  const termsAccepted = Boolean(formValues.agreeToTerms);
  const canSubmit = hasNoErrors && hasRequiredFields && termsAccepted;

  const onSubmit = async (data: TenantSignupFormData) => {
    setIsLoading(true);
    try {
      console.log("🚀 Starting signup process with data:", data);

      const signupData: AdminSignupRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        organizationName: data.organizationName,
        companySize: data.companySize,
        industry: data.industry,
        address: data.address,
        agreeToTerms: data.agreeToTerms,
      };

      console.log("📡 Sending signup request to backend:", signupData);

      const response = await authService.adminSignup(signupData);

      console.log("📥 Received response from backend:", response);

      if (response.success && response.data) {
        console.log('✅ Signup successful, navigating to email verification');
        localStorage.setItem('signup_email', data.email);
        reset();

        try {
          navigate("/verify-email");
          setTimeout(() => {
            if (globalThis.location.pathname !== '/verify-email') {
              globalThis.location.href = '/verify-email';
            }
          }, 100);
        } catch (navError) {
          console.error('❌ Navigation error:', navError);
          globalThis.location.href = '/verify-email';
        }
      } else {
        console.error('❌ Signup failed - response not successful:', response);
      }
    } catch (error) {
      console.error("❌ Signup error caught:", error);
      console.error("❌ Error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
      });
    } finally {
      setIsLoading(false);
      console.log("🏁 Signup process completed");
    }
  };

  const inputClasses = "text-sm transition-all duration-300 border-2 border-gray-200 focus:border-indigo-500 rounded-xl hover:shadow-lg focus:ring-4 focus:ring-indigo-100";

  // Left Side Content Component
  const LeftSideContent = () => (
    <div className="w-full h-full bg-gradient-to-br from-[#006AFF] to-blue-700 relative overflow-hidden flex items-center justify-center p-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center text-white max-w-md w-full">
        {/* Logo/Brand */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">HotKup</h1>
          <p className="text-blue-100 text-lg">WhatsApp Provider Platform</p>
        </div>

        {/* Central Icon */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/30">
            <div className="text-4xl">📱</div>
          </div>
        </div>

        {/* Main Description */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-2xl font-bold mb-3">WhatsApp Provider</h2>
          <p className="text-blue-100 leading-relaxed">
            Professional WhatsApp Business API provider for modern businesses.
            CRM and Service Management in One.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
            <Zap className="w-5 h-5 text-white" />
            <span className="font-semibold">WhatsApp API</span>
          </div>
          <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
            <Target className="w-5 h-5 text-white" />
            <span className="font-semibold">Business Messaging</span>
          </div>
          <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="font-semibold">CRM Integration</span>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 pt-6 border-t border-white/20 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="flex justify-center space-x-6 text-blue-100 text-sm">
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="w-4 h-4" />
              <span>Reliable</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Layout - Stacked */}
      {isMobile ? (
        <div className="flex flex-col">
          {/* Header Section for Mobile */}
          <div className="bg-gradient-to-r from-[#006AFF] to-blue-600 text-white p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-1">HotKup</h1>
              <p className="text-blue-100 text-sm">WhatsApp Provider Platform</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="flex-1 p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Create Account
                </h2>
                <p className="text-gray-600">
                  Start your WhatsApp business journey
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  {/* Form fields remain the same as desktop */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name *
                      </Label>
                      <InputWithError
                        {...register("firstName")}
                        error={errors.firstName?.message}
                        placeholder="John"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name *
                      </Label>
                      <InputWithError
                        {...register("lastName")}
                        error={errors.lastName?.message}
                        placeholder="Doe"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Continue with other form fields... */}
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address *
                    </Label>
                    <InputWithError
                      type="email"
                      {...register("email")}
                      error={errors.email?.message}
                      placeholder="your.email@company.com"
                      className="w-full"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <InputWithError
                      {...register("phone")}
                      error={errors.phone?.message}
                      placeholder="+1-555-0123 (optional)"
                      className="w-full"
                    />
                  </div>

                  {/* Organization */}
                  <div className="space-y-2">
                    <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700">
                      Organization Name *
                    </Label>
                    <InputWithError
                      {...register("organizationName")}
                      error={errors.organizationName?.message}
                      placeholder="Mavens Innovations"
                      className="w-full"
                    />
                  </div>

                  {/* Company Size & Industry */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companySize" className="text-sm font-medium text-gray-700">
                        Company Size *
                      </Label>
                      <SelectWithError
                        value={watch("companySize")}
                        onValueChange={(value) => setValue("companySize", value as any)}
                        error={errors.companySize?.message}
                        placeholder="Select Size"
                      >
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectWithError>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                        Industry
                      </Label>
                      <SelectWithError
                        value={watch("industry")}
                        onValueChange={(value) => setValue("industry", value)}
                        error={errors.industry?.message}
                        placeholder="Select Industry"
                      >
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectWithError>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Address
                    </Label>
                    <InputWithError
                      {...register("address")}
                      error={errors.address?.message}
                      placeholder="Enter your address (optional)"
                      className="w-full"
                    />
                  </div>

                  {/* Terms */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        checked={watchAgreeToTerms || false}
                        className="w-4 h-4 text-[#006AFF] border-gray-300 rounded focus:ring-[#006AFF] mt-1"
                        onChange={(e) => setValue("agreeToTerms", e.target.checked, { shouldValidate: true })}
                      />
                      <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                        I agree to the{" "}
                        <button type="button" className="text-[#006AFF] underline" onClick={() => setShowTermsModal(true)}>
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button type="button" className="text-[#006AFF] underline" onClick={() => setShowTermsModal(true)}>
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !canSubmit}
                    className="w-full h-12 bg-[#006AFF] hover:bg-blue-700 text-white font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="text-[#006AFF] font-semibold"
                        onClick={() => navigate("/login")}
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Layout - Side by Side */
        <div className="flex">
          {/* Left Side - Brand & Info */}
          <div className="flex-1 max-w-[50%] h-screen sticky top-0">
            <LeftSideContent />
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 flex items-start justify-center p-8 bg-gray-50 min-h-screen">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Create Account
                </h1>
                <p className="text-gray-600">
                  Start your WhatsApp business journey with HotKup
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                          First Name *
                        </Label>
                        <InputWithError
                          {...register("firstName")}
                          error={errors.firstName?.message}
                          placeholder="John"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                          Last Name *
                        </Label>
                        <InputWithError
                          {...register("lastName")}
                          error={errors.lastName?.message}
                          placeholder="Doe"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <InputWithError
                        type="email"
                        {...register("email")}
                        error={errors.email?.message}
                        placeholder="your.email@company.com"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        Organization emails only - no Gmail, Outlook, etc.
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <InputWithError
                        {...register("phone")}
                        error={errors.phone?.message}
                        placeholder="+1-555-0123 (optional)"
                        className="w-full"
                      />
                    </div>

                    {/* Organization */}
                    <div className="space-y-2">
                      <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700">
                        Organization Name *
                      </Label>
                      <InputWithError
                        {...register("organizationName")}
                        error={errors.organizationName?.message}
                        placeholder="Mavens Innovations"
                        className="w-full"
                      />
                    </div>

                    {/* Company Size & Industry */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companySize" className="text-sm font-medium text-gray-700">
                          Company Size *
                        </Label>
                        <SelectWithError
                          value={watch("companySize")}
                          onValueChange={(value) => setValue("companySize", value as any)}
                          error={errors.companySize?.message}
                          placeholder="Select Size"
                        >
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectWithError>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                          Industry
                        </Label>
                        <SelectWithError
                          value={watch("industry")}
                          onValueChange={(value) => setValue("industry", value)}
                          error={errors.industry?.message}
                          placeholder="Select Industry"
                        >
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectWithError>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Address
                      </Label>
                      <InputWithError
                        {...register("address")}
                        error={errors.address?.message}
                        placeholder="Enter your address (optional)"
                        className="w-full"
                      />
                    </div>

                    {/* Terms */}
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="agreeToTerms"
                          checked={watchAgreeToTerms || false}
                          className="w-4 h-4 text-[#006AFF] border-gray-300 rounded focus:ring-[#006AFF] mt-1"
                          onChange={(e) => setValue("agreeToTerms", e.target.checked, { shouldValidate: true })}
                        />
                        <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                          I agree to the{" "}
                          <button type="button" className="text-[#006AFF] underline" onClick={() => setShowTermsModal(true)}>
                            Terms of Service
                          </button>{" "}
                          and{" "}
                          <button type="button" className="text-[#006AFF] underline" onClick={() => setShowTermsModal(true)}>
                            Privacy Policy
                          </button>
                        </label>
                      </div>
                      {errors.agreeToTerms && (
                        <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isLoading || !canSubmit}
                      className="w-full h-12 bg-[#006AFF] hover:bg-blue-700 text-white font-semibold text-lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating Your Account...
                        </>
                      ) : (
                        "Create Account & Get Started"
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="text-[#006AFF] font-semibold"
                          onClick={() => navigate("/login")}
                        >
                          Sign in here
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal (same as before) */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#006AFF] to-blue-600">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Shield className="w-6 h-6 mr-3" />
                Terms of Service & Privacy Policy
              </h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-white hover:text-gray-200 transition-colors duration-300 rounded-full p-2 hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[60vh]">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Terms of Service</h3>
                <div className="text-gray-700 space-y-3">
                  <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h3>
                <div className="text-gray-700 space-y-4">
                  <p>This Privacy Policy describes how HotKup collects, uses, and protects your personal information when you use our services.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <Button
                onClick={() => setShowTermsModal(false)}
                className="bg-[#006AFF] hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl"
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 20s infinite linear;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}} />
    </div>
  );
}
