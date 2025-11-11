import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, CheckCircle, Loader2, ArrowLeft, Sparkles, TrendingUp, Target, Users, Zap, Shield, BarChart3, X, Star } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { onboardingService, SetPasswordRequest } from "@/services/onboardingService";
import { authService } from "@/services/authService";
import { setPasswordSchema, SetPasswordFormData } from "@/lib/validations";
import { useAuth } from "@/hooks/use-auth";

export function SetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [isMemberInvitation, setIsMemberInvitation] = useState(false);
  const [isTenantFlow, setIsTenantFlow] = useState(false);
  const [animatedElements, setAnimatedElements] = useState<Array<{id: number, x: number, y: number, delay: number, icon: string}>>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  // Generate floating CRM-themed elements
  useEffect(() => {
    const elements = [];
    const icons = ['Users', 'Target', 'TrendingUp', 'Zap', 'Shield', 'BarChart3'];

    for (let i = 0; i < 12; i++) {
      elements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        icon: icons[Math.floor(Math.random() * icons.length)]
      });
    }
    setAnimatedElements(elements);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    mode: "onChange"
  });

  const watchPassword = watch("password");
  const watchConfirmPassword = watch("confirmPassword");

  // Password matching validation
  const passwordsMatch = watchPassword && watchConfirmPassword && watchPassword === watchConfirmPassword;
  const passwordsDontMatch = watchPassword && watchConfirmPassword && watchPassword !== watchConfirmPassword;

  // Check if user is already authenticated (e.g., after completing signup)
  useEffect(() => {
    if (!authLoading && user) {
      console.log('✅ User already authenticated, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Get verification data from navigation state or URL parameters
  useEffect(() => {
    const state = location.state as any;
    if (state) {
      setVerificationToken(state.verificationToken || "");
      setTenantCode(state.tenantCode || "");
      setIsMemberInvitation(state.isMemberInvitation || false);
      setIsTenantFlow(state.isTenantFlow || false);

      // For member invitations, ensure tenant code is set in localStorage for API calls
      if (state.tenantCode && state.isMemberInvitation) {
        localStorage.setItem('tenant_id', state.tenantCode);
        console.log('✅ Set tenant_id in localStorage:', state.tenantCode);
      }
    } else {
      // Fallback to URL parameters
      const urlParams = new URLSearchParams(location.search);
      setVerificationToken(urlParams.get('token') || "");
      setTenantCode(urlParams.get('tenant') || "");

      // For member invitations from URL, also set in localStorage
      const tenantFromUrl = urlParams.get('tenant');
      if (tenantFromUrl) {
        setIsMemberInvitation(true); // Assume URL params indicate member invitation
        localStorage.setItem('tenant_id', tenantFromUrl);
        console.log('✅ Set tenant_id from URL params in localStorage:', tenantFromUrl);
      }
    }
  }, [location]);

  const onSubmit = async (data: SetPasswordFormData) => {
    if (!verificationToken) {
      alert('Verification token is missing. Please verify your email first.');
      return;
    }

    setIsLoading(true);
    try {
      if (isMemberInvitation || tenantCode) {
        // Member invitation flow with tenant code
        console.log('🔐 Completing member signup');
        const response = await authService.completeMemberSignup({
          invitationToken: verificationToken,
          password: data.password,
          phone: '' // Optional field
        });

        if (response.success) {
          console.log('✅ Member signup completed successfully, user is now logged in');
          // For member invitation, user is already logged in with MEMBER role in tenant schema
          navigate('/', {
            state: { fromSignup: true, userType: 'member' }
          });
        }
      } else if (isTenantFlow) {
        // Tenant flow without tenant code
        console.log('🔐 Setting password for tenant verification');
        const response = await authService.setAdminPassword({
          token: verificationToken,
          password: data.password,
          confirmPassword: data.confirmPassword
        });

        if (response.success) {
          console.log('✅ Tenant password set successfully');
          navigate('/login');
        }
      } else {
        // Fallback to onboarding service
        console.log('🔐 Setting password via onboarding service');
        const passwordData: SetPasswordRequest = {
          password: data.password,
          confirmPassword: data.confirmPassword
        };
        const response = await onboardingService.setPassword(passwordData);

        if (response.success && response.data) {
          if (response.data.loginRequired) {
            navigate('/login');
          } else {
            navigate('/');
          }
        }
      }
    } catch (error) {
      console.error('❌ Set password error:', error);
      alert('Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignup = () => {
    onboardingService.clearOnboardingInfo();
    navigate('/signup');
  };

  // Render icon based on string name
  const renderIcon = (iconName: string) => {
    const iconProps = { className: "w-8 h-8 text-indigo-300 opacity-30" };
    switch (iconName) {
      case 'Users': return <Users {...iconProps} />;
      case 'Target': return <Target {...iconProps} />;
      case 'TrendingUp': return <TrendingUp {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'Shield': return <Shield {...iconProps} />;
      case 'BarChart3': return <BarChart3 {...iconProps} />;
      default: return <Users {...iconProps} />;
    }
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Left Side - Brand & Info */}
      <div className="flex-1 h-screen hidden lg:block">
        <div className="w-full h-full bg-gradient-to-br from-[#006AFF] to-blue-700 relative overflow-hidden flex items-center justify-center p-4 lg:p-8">
          {/* Main Content */}
          <div className="relative z-10 text-center text-white max-w-md w-full">
            {/* Logo/Brand */}
            <div className="mb-8 animate-fade-in">
              <h1 className="text-4xl font-bold mb-2">HotKup</h1>
              <p className="text-blue-100 text-lg">WhatsApp Provider Setup</p>
            </div>

            {/* Central Icon */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/30">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Main Description */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl font-bold mb-3">Set Password</h2>
              <p className="text-blue-100 leading-relaxed">
                Create a strong, secure password to protect your HotKup account and ensure safe access to your business data.
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
                  <Lock className="w-4 h-4" />
                  <span>Protected</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating particles for extra visual appeal */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gray-50 h-screen w-full overflow-y-auto">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight">
              Set Your Password
            </h1>

          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden transform hover:shadow-3xl transition-all duration-500">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-8">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <Shield className="w-6 h-6 text-yellow-300" />
                  <h3 className="text-white text-2xl font-bold text-center">
                    Secure Password Setup
                  </h3>
                  <Shield className="w-6 h-6 text-yellow-300" />
                </div>
                <p className="text-indigo-100 text-center text-sm">
                  Your password is encrypted and stored securely
                </p>
              </div>
              <div className="p-8 lg:p-12">
                <div className="max-w-md mx-auto space-y-8">
                  {/* Password Fields */}
                  <div className="space-y-6">
                    <div className="space-y-3 group">
                      <Label htmlFor="password" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                        <Lock className="w-4 h-4 mr-2 text-indigo-500" />
                        New Password <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-300 hover:shadow-lg ${
                            errors.password ? 'border-red-500' : 'border-gray-200 focus:border-indigo-500'
                          }`}
                          placeholder="Enter your secure password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        {watchPassword && !errors.password && (
                          <CheckCircle className="absolute right-12 top-3 w-5 h-5 text-green-500 animate-in fade-in duration-300" />
                        )}
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                      )}
                      {watchPassword && (
                        <div className="text-xs text-gray-600">
                          Password strength: {
                            watchPassword.length >= 12 &&
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?])/.test(watchPassword)
                              ? <span className="text-green-600 font-semibold">Strong</span>
                              : <span className="text-yellow-600 font-semibold">Medium</span>
                          }
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Password is always masked for security
                      </p>
                    </div>

                    <div className="space-y-3 group">
                      <Label htmlFor="confirmPassword" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                        <CheckCircle className="w-4 h-4 mr-2 text-indigo-500" />
                        Confirm Password <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("confirmPassword")}
                          className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-300 hover:shadow-lg ${
                            passwordsDontMatch ? 'border-red-500 focus:border-red-500 focus:ring-red-100' :
                            passwordsMatch ? 'border-green-500 focus:border-green-500 focus:ring-green-100' :
                            'border-gray-200 focus:border-indigo-500'
                          }`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        {passwordsMatch && (
                          <CheckCircle className="absolute right-12 top-3 w-5 h-5 text-green-500 animate-in fade-in duration-300" />
                        )}
                        {passwordsDontMatch && (
                          <X className="absolute right-12 top-3 w-5 h-5 text-red-500 animate-in fade-in duration-300" />
                        )}
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                      )}
                      {passwordsMatch && (
                        <p className="text-sm text-green-600 font-semibold">✓ Passwords match</p>
                      )}
                      {passwordsDontMatch && (
                        <p className="text-sm text-red-600 font-semibold">✗ Passwords don't match</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Password is always masked for security
                      </p>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                        Password Requirements
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className={`flex items-center space-x-3 ${watchPassword && watchPassword.length >= 12 ? 'text-green-700' : 'text-gray-600'}`}>
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${watchPassword && watchPassword.length >= 12 ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>At least 12 characters long</span>
                        </div>
                        <div className={`flex items-center space-x-3 ${watchPassword && /^(?=.*[a-z])/.test(watchPassword) ? 'text-green-700' : 'text-gray-600'}`}>
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${watchPassword && /^(?=.*[a-z])/.test(watchPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>Contains lowercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-3 ${watchPassword && /^(?=.*[A-Z])/.test(watchPassword) ? 'text-green-700' : 'text-gray-600'}`}>
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${watchPassword && /^(?=.*[A-Z])/.test(watchPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>Contains uppercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-3 ${watchPassword && /^(?=.*\d)/.test(watchPassword) ? 'text-green-700' : 'text-gray-600'}`}>
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${watchPassword && /^(?=.*\d)/.test(watchPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>Contains number</span>
                        </div>
                        <div className={`flex items-center space-x-3 ${watchPassword && /^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?])/.test(watchPassword) ? 'text-green-700' : 'text-gray-600'}`}>
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${watchPassword && /^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?])/.test(watchPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>Contains special character</span>
                        </div>
                      </div>
                    </div>

                    {/* Security Tips */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl border border-green-100">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-green-600" />
                        Security Tips
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li className="flex items-start space-x-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Use a unique password for each account</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Avoid personal information like birthdays</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Consider using a password manager</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between space-x-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToSignup}
                      className="px-8 py-3 border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>

                    <Button
                      type="submit"
                      disabled={isLoading || passwordsDontMatch}
                      className={`px-8 py-3 text-lg font-bold transition-all duration-500 transform hover:scale-105 rounded-xl shadow-xl ${
                        passwordsDontMatch
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 shadow-indigo-500/50 hover:shadow-2xl"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Setting Password...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-3" />
                          Set Password & Continue
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}} />
    </div>
  );
}
