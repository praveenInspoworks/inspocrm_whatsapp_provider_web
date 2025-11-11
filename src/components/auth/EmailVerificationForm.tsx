import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, Loader2, RefreshCw, ArrowLeft, XCircle, Shield, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/authService";

export function EmailVerificationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Check for verification tokens in URL (when user clicks email link)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get('token');
    const tenantFromUrl = urlParams.get('tenant');

    console.log('🔍 Checking URL parameters:', { tokenFromUrl, tenantFromUrl });

    if (tokenFromUrl) {
      if (tenantFromUrl) {
        // Member invitation flow with tenant code
        console.log('✅ Found member invitation tokens in URL, auto-verifying...');
        handleMemberInvitationVerification(tokenFromUrl, tenantFromUrl);
      } else {
        // Tenant verification flow without tenant code
        console.log('✅ Found tenant verification token in URL, auto-verifying...');
        handleTenantVerification(tokenFromUrl);
      }
    } else {
      // Get email from signup process for display
      const signupEmail = localStorage.getItem('signup_email');
      setEmail(signupEmail || "your email address");
      console.log('📧 Showing email verification waiting page for:', signupEmail);
    }
  }, [location.search]);

  // Handle successful verification with 5-second delay
  const handleSuccessfulVerification = (token: string, tenantCode?: string, isMemberInvitation?: boolean) => {
    setVerificationStatus('success');
    
    // Show success message for 5 seconds before navigating
    setTimeout(() => {
      console.log('✅ Email verified successfully, navigating to set password');

      // Clear stored data
      localStorage.removeItem('verification_token');
      localStorage.removeItem('tenant_code');
      localStorage.removeItem('signup_email');

      // Navigate to set password
      navigate('/set-password', {
        state: {
          verificationToken: token,
          tenantCode: tenantCode,
          isTenantFlow: !isMemberInvitation,
          isMemberInvitation: isMemberInvitation
        }
      });
    }, 5000);
  };

  // Handle verification error
  const handleVerificationError = (error: any, customMessage?: string) => {
    setVerificationStatus('error');
    setErrorMessage(customMessage || 'Verification failed. Please try again.');
    console.error('❌ Verification error:', error);
  };

  // Handle tenant verification (admin signup flow)
  const handleTenantVerification = async (token: string) => {
    setIsLoading(true);
    setVerificationStatus('idle');
    setErrorMessage("");
    
    try {
      console.log('🚀 Tenant verification with token:', token);

      const verificationData = { token };
      const response = await authService.verifyAdminEmail(verificationData);

      if (response.success) {
        handleSuccessfulVerification(token, undefined, false);
      } else {
        handleVerificationError(response, 'Tenant verification failed. Please try again.');
      }
    } catch (error) {
      handleVerificationError(error, 'Tenant verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle member invitation verification
  const handleMemberInvitationVerification = async (token: string, tenantCode: string) => {
    setIsLoading(true);
    setVerificationStatus('idle');
    setErrorMessage("");

    try {
      console.log('🚀 Member invitation verification with token:', token, 'tenant:', tenantCode);

      // Store tenant code in localStorage for API service to include in header
      localStorage.setItem('tenant_id', tenantCode);

      const response = await authService.verifyMemberInvitation(token, tenantCode);

      if (response && response.success) {
        // Call handleSuccessfulVerification for successful member invitation
        handleSuccessfulVerification(token, tenantCode, true);
      } else {
        handleVerificationError(response, 'Member invitation verification failed. Please try again or contact your administrator.');
      }
    } catch (error) {
      handleVerificationError(error, 'Member invitation verification failed. Please try again or contact your administrator.');
    } finally {
      setIsLoading(false);
      // Clean up tenant_code from localStorage after verification
      localStorage.removeItem('tenant_id');
    }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (countdown > 0 || !email) return;

    setResendLoading(true);
    try {
      console.log('📤 Resending verification email to:', email);

      const signupEmail = localStorage.getItem('signup_email') || email;
      await authService.resendAdminVerificationEmail(signupEmail);
      setCountdown(60); // 60 second cooldown

      console.log('✅ Verification email resent');
    } catch (error) {
      console.error('❌ Resend verification error:', error);
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToSignup = () => {
    console.log('🔙 Going back to signup');

    // Clear all stored data
    localStorage.removeItem('verification_token');
    localStorage.removeItem('tenant_code');
    localStorage.removeItem('signup_email');

    navigate('/signup');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex">
      {/* Left Side - Brand & Info */}
      <div className="flex-1 h-screen hidden lg:block">
        <div className="w-full h-full bg-gradient-to-br from-[#006AFF] to-blue-700 relative overflow-hidden flex items-center justify-center p-4 lg:p-8">
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
                <Mail className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Main Description */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl font-bold mb-3">Email Verification</h2>
              <p className="text-blue-100 leading-relaxed">
                Secure email verification to protect your account and ensure only authorized access to your HotKup instance.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 pt-6 border-t border-white/20 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="flex justify-center space-x-6 text-blue-100 text-sm">
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verified</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Trusted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gray-50 h-screen w-full overflow-y-auto">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-slate-600 via-blue-700 to-purple-800 bg-clip-text text-transparent mb-4 leading-tight">
              Email Verification
            </h1>

            <div className="space-y-3">
              <p className="text-xl lg:text-2xl text-gray-800 font-bold">
                Secure Account Verification
              </p>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden transform hover:shadow-3xl transition-all duration-500">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-8">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  <h3 className="text-white text-2xl font-bold text-center">
                    {verificationStatus === 'success' ? 'Email Verified!' : 'Verify Your Email'}
                  </h3>
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <p className="text-indigo-100 text-center text-sm">
                  {verificationStatus === 'success'
                    ? 'Your email has been successfully verified'
                    : 'Check your email for the verification link'}
                </p>
              </div>
              <div className="px-8 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <p className="text-xs text-gray-600 text-center font-medium">
                  {verificationStatus === 'success'
                    ? 'Your account is now secure and ready to use. Redirecting to set password...'
                    : 'Secure email verification to protect your account and ensure only authorized access to your HotKup instance.'}
                </p>
              </div>
              <div className="p-8 lg:p-12">
                <div className="max-w-md mx-auto space-y-8">
                  {/* Success Message */}
                  {verificationStatus === 'success' && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800">Email Verified Successfully!</h4>
                          <p className="text-sm text-green-600">Your email has been verified</p>
                        </div>
                      </div>
                      <p className="text-sm text-green-700 leading-relaxed mb-4">
                        Your email has been verified. Redirecting to set password in 5 seconds...
                      </p>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full animate-[countdown_5s_linear_forwards]"></div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {verificationStatus === 'error' && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-2xl border border-red-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-800">Verification Failed</h4>
                          <p className="text-sm text-red-600">Please try again</p>
                        </div>
                      </div>
                      <p className="text-sm text-red-700 leading-relaxed mb-4">
                        {errorMessage}
                      </p>
                      <Button
                        onClick={() => setVerificationStatus('idle')}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* Email Verification Instructions - Only show when not in success state */}
                  {verificationStatus !== 'success' && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">Check Your Email</h4>
                          <p className="text-sm text-gray-600">Verification link sent</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-4">
                        We've sent a verification link to <strong>{email || 'your email address'}</strong>
                      </p>
                      <p className="text-xs text-gray-500 mb-6">
                        Click the verification link in your email to automatically verify your account and continue to set your password.
                      </p>

                      {/* Resend Link */}
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-3">
                          Didn't receive the email?
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResendVerification}
                          disabled={resendLoading || countdown > 0}
                          className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          {resendLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : countdown > 0 ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Resend in {countdown}s
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Resend Verification Email
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {verificationStatus !== 'success' && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToSignup}
                        className="px-6"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Signup
                      </Button>
                    </div>
                  )}

                  {verificationStatus !== 'success' && (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Wrong email address?{" "}
                        <Button
                          variant="link"
                          className="text-blue-600 hover:text-blue-700 p-0 text-sm"
                          onClick={handleBackToSignup}
                        >
                          Go back and change it
                        </Button>
                      </p>
                    </div>
                  )}

                  {/* Help Text - Only show when not in success state */}
                  {verificationStatus !== 'success' && (
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">Need help?</h3>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Check your spam/junk folder</li>
                        <li>• Make sure you entered the correct email address</li>
                        <li>• The verification link expires after 24 hours</li>
                        <li>• Contact support if you continue having issues</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
