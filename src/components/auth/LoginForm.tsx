import { useState, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, Building, Search, Users, UserCog, ArrowLeft, Sparkles, TrendingUp, Target, Zap, Shield, BarChart3, Rocket, Star } from "lucide-react";
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

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginMode, setLoginMode] = useState<"tenant" | "member">("member");
  const [step, setStep] = useState<"tenant_selection" | "credentials">("tenant_selection");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TenantInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  const { login, memberLogin } = authData;
  const navigate = useNavigate();

  // Generate floating CRM-themed elements - memoized to prevent re-renders
  const animatedElementsRef = useRef<Array<{id: number, x: number, y: number, delay: number, icon: string}>>([]);

  useEffect(() => {
    if (animatedElementsRef.current.length === 0) {
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
      animatedElementsRef.current = elements;
      setAnimatedElements(elements);
    }
  }, []);

  // Search tenants by company name or tenant code - debounced to prevent excessive API calls
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchTenants = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching for tenants:', query);
      const results = await authService.searchTenants(query) as any;
      console.log('✅ Search results:', results);
      setSearchResults(results || []);
    } catch (error: any) {
      console.error('❌ Search error:', error);
      // Don't show error for search failures to avoid disrupting UX
      // Just log it and clear results
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTenantSearch = (query: string) => {
    try {
      setSearchQuery(query);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search to prevent excessive API calls
      if (query.length >= 2) {
        searchTimeoutRef.current = setTimeout(() => {
          searchTenants(query).catch((error) => {
            console.error('Unhandled search error:', error);
            setError("Search failed. Please try again.");
            setSearchResults([]);
            setIsSearching(false);
          });
        }, 300); // 300ms delay
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Error in handleTenantSearch:', error);
      setError("Search failed. Please try again.");
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const selectTenant = (tenant: TenantInfo) => {
    setSelectedTenant(tenant);
    setTenantCode(tenant.tenantCode);
    setSearchQuery(tenant.companyName);
    setSearchResults([]);
    setStep("credentials");
  };

  const handleBackToTenantSelection = () => {
    setStep("tenant_selection");
    setSelectedTenant(null);
    setTenantCode("");
    setUsername("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (loginMode === "tenant") {
        // For tenant admin login, use username
        console.log('🔐 Attempting tenant admin login:', username);
        await login(username, password);
        console.log('✅ Tenant admin login successful');
      } else {
        // For member login, try to login with selected tenant
        if (selectedTenant) {
          console.log('🔐 Attempting member login for tenant:', selectedTenant.tenantCode);
          await memberLogin(username, password, selectedTenant.tenantCode);
          console.log('✅ Member login successful');
        } else {
          // If no tenant selected, show error
          setError("Please select your organization first");
          return;
        }
      }
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - 60% - Branding & Visual */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {animatedElements.map((element) => (
            <div
              key={element.id}
              className="absolute animate-pulse"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                animationDelay: `${element.delay}s`,
                animationDuration: '4s',
              }}
            >
              {renderIcon(element.icon)}
            </div>
          ))}

          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* CRM Messages Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 opacity-5">
            <h1 className="text-6xl font-bold text-indigo-600 animate-fade-in">
              INSPOCRM
            </h1>
            <p className="text-2xl text-gray-400 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              Welcome Back
            </p>
            <div className="flex justify-center space-x-8 mt-8">
              <div className="text-center animate-fade-in" style={{ animationDelay: '1s' }}>
                <Shield className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
                <p className="text-sm text-gray-500">Secure Login</p>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '1.2s' }}>
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-sm text-gray-500">Team Access</p>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '1.4s' }}>
                <Building className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-500">Organization</p>
              </div>
            </div>
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
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 xl:p-12 w-full">
          <div className="max-w-lg text-center">
            {/* Logo Section */}
            <div className="w-20 xl:w-24 h-20 xl:h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 xl:mb-8 mx-auto border border-white/20">
              <Building className="w-10 xl:w-12 h-10 xl:h-12 text-white" />
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              INSPOCRM
            </h1>
            <p className="text-xl xl:text-2xl text-blue-100 mb-6 xl:mb-8 font-medium">Enterprise</p>
            
            <p className="text-base xl:text-lg text-blue-100 leading-relaxed mb-8 xl:mb-12">
              Transform your business with our comprehensive AI-powered CRM solution. 
              Manage leads, automate marketing, and grow your revenue with intelligent automation.
            </p>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4 xl:gap-6 mb-6 xl:mb-8">
              {/* AI-Powered Lead Management */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xl:rounded-2xl p-4 xl:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-10 xl:w-12 h-10 xl:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg xl:rounded-xl flex items-center justify-center mb-3 xl:mb-4 mx-auto">
                  <svg className="w-5 xl:w-6 h-5 xl:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-xs xl:text-sm mb-1 xl:mb-2">AI-Powered</h3>
                <p className="text-blue-100 text-xs leading-relaxed">Smart lead scoring and automated follow-ups</p>
              </div>
              
              {/* Automated Marketing */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xl:rounded-2xl p-4 xl:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-10 xl:w-12 h-10 xl:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg xl:rounded-xl flex items-center justify-center mb-3 xl:mb-4 mx-auto">
                  <svg className="w-5 xl:w-6 h-5 xl:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-xs xl:text-sm mb-1 xl:mb-2">Marketing</h3>
                <p className="text-blue-100 text-xs leading-relaxed">Automated campaigns and email sequences</p>
              </div>
              
              {/* Social Media Integration */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xl:rounded-2xl p-4 xl:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-10 xl:w-12 h-10 xl:h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg xl:rounded-xl flex items-center justify-center mb-3 xl:mb-4 mx-auto">
                  <svg className="w-5 xl:w-6 h-5 xl:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12h6m-6 4h6" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-xs xl:text-sm mb-1 xl:mb-2">Social Media</h3>
                <p className="text-blue-100 text-xs leading-relaxed">Multi-platform posting and engagement</p>
              </div>
              
              {/* CRM Management */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xl:rounded-2xl p-4 xl:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-10 xl:w-12 h-10 xl:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg xl:rounded-xl flex items-center justify-center mb-3 xl:mb-4 mx-auto">
                  <svg className="w-5 xl:w-6 h-5 xl:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-xs xl:text-sm mb-1 xl:mb-2">CRM</h3>
                <p className="text-blue-100 text-xs leading-relaxed">Complete customer relationship management</p>
              </div>
            </div>
            
            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-3 xl:gap-4 text-center">
              <div className="bg-white/5 rounded-lg xl:rounded-xl p-3 xl:p-4 border border-white/10">
                <div className="text-xl xl:text-2xl font-bold text-white">500+</div>
                <div className="text-blue-200 text-xs">Active Users</div>
              </div>
              <div className="bg-white/5 rounded-lg xl:rounded-xl p-3 xl:p-4 border border-white/10">
                <div className="text-xl xl:text-2xl font-bold text-white">99.9%</div>
                <div className="text-blue-200 text-xs">Uptime</div>
              </div>
              <div className="bg-white/5 rounded-lg xl:rounded-xl p-3 xl:p-4 border border-white/10">
                <div className="text-xl xl:text-2xl font-bold text-white">24/7</div>
                <div className="text-blue-200 text-xs">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-3 sm:mb-4">
              <Building className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome Back</h2>
            <p className="text-sm sm:text-base text-gray-600">Sign in to your INSPOCRM account</p>
          </div>

          {/* Login Mode Selection */}
          <Tabs value={loginMode} onValueChange={(value) => setLoginMode(value as "tenant" | "member")} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="member" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Member
              </TabsTrigger>
              <TabsTrigger value="tenant" className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Tenant Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="member" className="space-y-4">
              {step === "tenant_selection" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Search Your Organization
                    </Label>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                      }}
                      className="relative"
                    >
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Enter company name or tenant code"
                        value={searchQuery}
                        onChange={(e) => {
                          handleTenantSearch(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          // Prevent form submission on Enter key
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-10 sm:h-11"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                    </form>
                  </div>

                  {isSearching && (
                    <div className="text-sm text-gray-500 text-center">Searching tenants...</div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <Label className="text-sm font-medium text-gray-700">Select Your Organization</Label>
                      {searchResults.map((tenant) => (
                        <div
                          key={tenant.tenantId}
                          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectTenant(tenant);
                          }}
                        >
                          <div className="font-medium text-gray-900">{tenant.companyName}</div>
                          <div className="text-sm text-gray-500">Code: {tenant.tenantCode}</div>
                          <div className={`text-xs px-2 py-1 rounded-full w-fit ${
                            tenant.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tenant.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Or enter tenant code manually</p>
                    <Input
                      placeholder="Enter tenant code (e.g., TENANT001)"
                      value={tenantCode}
                      onChange={(e) => setTenantCode(e.target.value)}
                      className="text-center"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (tenantCode) {
                          try {
                            const tenant = await authService.getTenantByCode(tenantCode) as any;
                            if (tenant) {
                              selectTenant(tenant);
                            } else {
                              setError("Invalid tenant code");
                            }
                          } catch (error) {
                            setError("Failed to validate tenant code");
                          }
                        }
                      }}
                    >
                      Continue with Code
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {selectedTenant && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-900">{selectedTenant.companyName}</div>
                          <div className="text-sm text-blue-700">Code: {selectedTenant.tenantCode}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleBackToTenantSelection}
                          className="text-blue-600"
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-10 sm:h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-10 sm:h-11"
                          required
                        />
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11"
                      disabled={isLoading || !selectedTenant}
                    >
                      {isLoading ? (
                        <>
                          <AILoadingSpinner size="sm" className="mr-2" />
                          Signing in...
                        </>
                      ) : (
                        `Sign In to ${selectedTenant?.companyName}`
                      )}
                    </Button>
                  </form>
                </>
              )}
            </TabsContent>

            <TabsContent value="tenant" className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  👑 Tenant administrators have full access to manage their organization.
                  New tenant? <Button variant="link" className="p-0 text-blue-600" onClick={() => navigate('/signup')}>
                    Create account
                  </Button>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-10 sm:h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-10 sm:h-11"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <AILoadingSpinner size="sm" className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In as Tenant Admin"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-700 p-0 text-sm"
                onClick={() => navigate('/signup')}
              >
                Create new tenant
              </Button>
            </p>
            <p className="text-sm text-gray-600">
              Forgot your password?{" "}
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-700 p-0 text-sm"
                onClick={() => navigate('/forgot-password')}
              >
                Reset it here
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(LoginForm);
