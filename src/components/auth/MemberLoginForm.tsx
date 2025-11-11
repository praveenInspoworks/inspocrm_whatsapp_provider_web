import { useState, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, Building, Sparkles, TrendingUp, Target, Zap, Shield, BarChart3, Rocket, Star, Users, Search, User } from "lucide-react";
import { AILoadingSpinner } from "@/components/ui/ai-loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

interface TenantInfo {
  tenantId: string;
  tenantCode: string;
  companyName: string;
  status: 'active' | 'inactive';
}

function MemberLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [animatedElements, setAnimatedElements] = useState<Array<{id: number, x: number, y: number, delay: number, icon: string}>>([]);

  // Safely use auth hook with error boundary
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    // During hot reloading, useAuth might not be available
    console.warn('useAuth not available during component initialization');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { memberLogin } = authData;
  const navigate = useNavigate();

  // Generate floating CRM-themed elements - memoized to prevent re-renders
  const animatedElementsRef = useRef<Array<{id: number, x: number, y: number, delay: number, icon: string}>>([]);

  useEffect(() => {
    if (animatedElementsRef.current.length === 0) {
      const elements = [];
      const icons = ['Users', 'Target', 'TrendingUp', 'Zap', 'Shield', 'BarChart3'];

      for (let i = 0; i < 15; i++) {
        elements.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 3,
          icon: icons[Math.floor(Math.random() * icons.length)]
        });
      }
      animatedElementsRef.current = elements;
      setAnimatedElements(elements);
    }
  }, []);

  // Extract tenant code from email domain
  const extractTenantCodeFromEmail = (email: string): string => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return '';

    // Remove common TLDs to get the tenant code
    // e.g., user@company.com -> company
    const parts = domain.split('.');
    if (parts.length >= 2) {
      // Remove the last part (TLD like .com, .org, etc.)
      parts.pop();
      return parts.join('.').toUpperCase();
    }
    return domain.toUpperCase();
  };

  // Check if email is from a common public domain
  const isPublicEmailDomain = (email: string): boolean => {
    const publicDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'live.com',
      'msn.com',
      'aol.com',
      'icloud.com',
      'protonmail.com',
      'mail.com',
      'yandex.com',
      'zoho.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return publicDomains.includes(domain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate email format
      if (!username || !username.includes('@')) {
        setError("Please enter a valid email address");
        return;
      }

      // Check if email is from a public domain (not allowed)
      if (isPublicEmailDomain(username)) {
        setError("Personal email addresses (Gmail, Outlook, etc.) are not allowed. Please use your organization email address.");
        return;
      }

      // Extract tenant code from email domain
      const tenantCode = extractTenantCodeFromEmail(username);

      if (!tenantCode) {
        setError("Unable to determine organization from email address");
        return;
      }

      console.log('🔐 Attempting member login for tenant:', tenantCode, 'with email:', username);

      // Set tenant header for API calls
      localStorage.setItem('tenant_code', tenantCode);

      await memberLogin(username, password, tenantCode);
      console.log('✅ Member login successful');

    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

  const inputClasses = "text-sm transition-all duration-300 border-2 border-gray-200 focus:border-indigo-500 rounded-xl hover:shadow-lg focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Left Side - Brand & Info */}
      <div className="flex-1 h-screen hidden lg:block">
        <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden flex items-center justify-center p-4 lg:p-8">
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
                <div className="text-4xl">👥</div>
              </div>
            </div>

            {/* Main Description */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl font-bold mb-3">Team Portal</h2>
              <p className="text-blue-100 leading-relaxed">
                Connect with your team members, share resources, and collaborate on customer relationships.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                <Users className="w-5 h-5 text-white" />
                <span className="font-semibold">Team Collaboration</span>
              </div>
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                <Target className="w-5 h-5 text-white" />
                <span className="font-semibold">Project Management</span>
              </div>
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="font-semibold">Resource Sharing</span>
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
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gray-50 h-screen w-full overflow-y-auto">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight">
              Team Member Login
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden transform hover:shadow-3xl transition-all duration-500">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-8">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  <h3 className="text-white text-2xl font-bold text-center">
                    Team Member Access
                  </h3>
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <p className="text-indigo-100 text-center text-sm">
                  Sign in to your team workspace
                </p>
              </div>
              <div className="p-8 lg:p-12">
                <div className="max-w-md mx-auto space-y-8">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Enter Your Credentials</h4>
                        <p className="text-sm text-gray-600">Sign in with your organization email</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Enter your organization email address and password. Your organization will be automatically detected from your email domain.
                      Personal email addresses (Gmail, Outlook, Yahoo, etc.) are not allowed.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3 group">
                      <Label htmlFor="username" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                        <Mail className="w-4 h-4 mr-2 text-indigo-500" />
                        Email Address <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="username"
                          type="email"
                          placeholder="your.email@company.com"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`${inputClasses} pl-12 transition-all duration-300 group-hover:border-indigo-400 group-focus-within:ring-indigo-200 h-12`}
                          required
                          autoComplete="email"
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                      </div>
                      <p className="text-xs text-gray-500">
                        Your organization will be detected from the email domain
                      </p>
                    </div>

                    <div className="space-y-3 group">
                      <Label htmlFor="password" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                        <Lock className="w-4 h-4 mr-2 text-indigo-500" />
                        Password <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`${inputClasses} pl-12 pr-12 transition-all duration-300 group-hover:border-indigo-400 group-focus-within:ring-indigo-200 h-12`}
                          required
                          autoComplete="current-password"
                        />
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Password is always masked for security
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-14 text-lg font-bold transition-all duration-500 transform hover:scale-105 rounded-xl shadow-xl ${
                        !isLoading
                          ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 shadow-indigo-500/50 hover:shadow-2xl"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <AILoadingSpinner size="sm" className="mr-3" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <Users className="w-5 h-5 mr-3" />
                          Sign In to Team
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Footer Links */}
                  <div className="text-center space-y-3 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Are you a tenant administrator?{" "}
                      <Button
                        variant="link"
                        className="text-indigo-600 hover:text-indigo-800 p-0 text-sm font-semibold transition-colors duration-300"
                        onClick={() => navigate("/login")}
                      >
                        Admin Login
                      </Button>
                    </p>
                    <p className="text-sm text-gray-600">
                      Need to create a new tenant?{" "}
                      <Button
                        variant="link"
                        className="text-indigo-600 hover:text-indigo-800 p-0 text-sm font-semibold transition-colors duration-300"
                        onClick={() => navigate("/signup")}
                      >
                        Create Tenant Account
                      </Button>
                    </p>
                    <p className="text-sm text-gray-600">
                      Forgot your password?{" "}
                      <Button
                        variant="link"
                        className="text-indigo-600 hover:text-indigo-800 p-0 text-sm font-semibold transition-colors duration-300"
                        onClick={() => navigate("/forgot-password")}
                      >
                        Reset Password
                      </Button>
                    </p>
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

export default memo(MemberLoginForm);
