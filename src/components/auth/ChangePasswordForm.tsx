import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Shield, Sparkles, TrendingUp, Target, Zap, Loader2, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface PasswordRequirement {
  id: string;
  label: string;
  regex: RegExp;
  met: boolean;
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [animatedElements, setAnimatedElements] = useState<Array<{id: number, x: number, y: number, delay: number, icon: string}>>([]);
  const { user, updatePassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const elements = [];
    const icons = ['Shield', 'Target', 'TrendingUp', 'Zap', 'Lock'];

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

  // Password requirements
  const passwordRequirements: PasswordRequirement[] = [
    {
      id: "length",
      label: "At least 8 characters",
      regex: /.{8,}/,
      met: false
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      regex: /[A-Z]/,
      met: false
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      regex: /[a-z]/,
      met: false
    },
    {
      id: "number",
      label: "One number",
      regex: /[0-9]/,
      met: false
    },
    {
      id: "special",
      label: "One special character",
      regex: /[!@#$%^&*(),.?":{}|<>]/,
      met: false
    }
  ];

  // Check password requirements
  const checkPasswordRequirements = (password: string) => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
  };

  const currentRequirements = checkPasswordRequirements(newPassword);
  const allRequirementsMet = currentRequirements.every(req => req.met);
  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (!allRequirementsMet) {
      setError("New password does not meet all requirements.");
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError("New passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      setIsLoading(false);
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderIcon = (iconName: string) => {
    const iconProps = { className: "w-6 h-6 text-indigo-300 opacity-40" };
    switch (iconName) {
      case 'Shield': return <Shield {...iconProps} />;
      case 'Target': return <Target {...iconProps} />;
      case 'TrendingUp': return <TrendingUp {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'Lock': return <Lock {...iconProps} />;
      default: return <Shield {...iconProps} />;
    }
  };

  const inputClasses = "text-sm transition-all duration-300 border-2 border-gray-200 focus:border-indigo-500 rounded-xl hover:shadow-lg focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex">
      {/* Left Side - Animation Section */}
      <div className="w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-md">
            {/* Central Logo */}
            <div className="text-center mb-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6 animate-pulse">
                <Shield className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">
                INSPOCRM
              </h1>
              <p className="text-blue-200 text-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
                Security Center
              </p>
            </div>

            {/* Cube/Polygon Animation */}
            <div className="relative flex items-center justify-center">
              {/* Central Cube */}
              <div className="relative animate-spin" style={{ animationDuration: '12s' }}>
                <div className="w-40 h-40 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 clip-hexagon flex items-center justify-center shadow-2xl border-4 border-white/30">
                  <div className="text-center">
                    <Lock className="w-12 h-12 text-white mx-auto mb-2 animate-pulse" />
                    <span className="text-white text-sm font-bold">Secure</span>
                  </div>
                </div>
              </div>

              {/* Surrounding Polygons */}
              <div className="absolute inset-0">
                {/* Top Polygon */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 clip-pentagon flex items-center justify-center shadow-xl border-2 border-white/20">
                    <div className="text-center">
                      <Shield className="w-6 h-6 text-white mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Top-Right Square */}
                <div className="absolute top-16 right-12 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.5s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-xl border-2 border-white/20">
                    <div className="text-center">
                      <Target className="w-5 h-5 text-white mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Right Pentagon */}
                <div className="absolute top-1/2 right-6 transform -translate-y-1/2 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.8s' }}>
                  <div className="w-18 h-18 bg-gradient-to-br from-purple-400 to-pink-500 clip-pentagon flex items-center justify-center shadow-xl border-2 border-white/20">
                    <div className="text-center">
                      <TrendingUp className="w-5 h-5 text-white mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Bottom-Right Triangle */}
                <div className="absolute bottom-16 right-12 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.2s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 clip-triangle flex items-center justify-center shadow-xl border-2 border-white/20">
                    <div className="text-center">
                      <Zap className="w-5 h-5 text-white mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Bottom Cube */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '4.2s' }}>
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-500 clip-hexagon flex items-center justify-center shadow-xl border-2 border-white/20">
                    <div className="text-center">
                      <CheckCircle className="w-6 h-6 text-white mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Bottom-Left Diamond */}
                <div className="absolute bottom-16 left-12 animate-bounce" style={{ animationDelay: '3s', animationDuration: '3.6s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rotate-45 flex items-center justify-center shadow-xl border-2 border-white/20">
                    <div className="text-center">
                      <Sparkles className="w-5 h-5 text-white mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Left Pentagon */}
                <div className="absolute top-1/2 left-6 transform -translate-y-1/2 animate-bounce" style={{ animationDelay: '3.5s', animationDuration: '4.4s' }}>
                  <div className="w-18 h-18 bg-gradient-to-br from-indigo-400 to-purple-500 clip-pentagon flex items-center justify-center shadow-xl border-2 border-white/20">
                    <div className="text-center">
                      <XCircle className="w-5 h-5 text-white mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Top-Left Circle */}
                <div className="absolute top-16 left-12 animate-bounce" style={{ animationDelay: '4s', animationDuration: '3.9s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-xl border-2 border-white/20">
                    <div className="text-center">
                      <Loader2 className="w-5 h-5 text-white mx-auto" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Geometric Connections */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                  <defs>
                    <linearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
                    </linearGradient>
                  </defs>

                  {/* Connecting lines forming a security shield pattern */}
                  <path d="M 200 120 L 280 160 L 320 200 L 280 240 L 200 280 L 120 240 L 80 200 L 120 160 Z" stroke="url(#securityGradient)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDelay: '1s' }}>
                    <animate attributeName="stroke-dasharray" values="0,40;40,0" dur="3s" repeatCount="indefinite" />
                  </path>
                  <path d="M 160 140 L 240 140 L 240 180 L 200 200 L 160 180 Z" stroke="url(#securityGradient)" strokeWidth="1.5" fill="none" className="animate-pulse" style={{ animationDelay: '2s' }}>
                    <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="2.5s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>
            </div>

            {/* Project Description */}
            <div className="text-center mt-20 animate-fade-in" style={{ animationDelay: '2.5s' }}>
              <p className="text-blue-200 text-sm leading-relaxed max-w-xs mx-auto">
                Enhance your account security with strong passwords and advanced protection measures for your business data.
              </p>
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

      {/* Right Side - Form Section */}
      <div className="w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto transform hover:scale-110 hover:rotate-3 transition-all duration-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-20 animate-pulse"></div>
                <Shield className="w-12 h-12 text-white relative z-10 animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
                <Star className="w-3 h-3 text-white" />
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight">
              Secure Your Account
            </h1>

            <div className="space-y-3">
              <p className="text-xl lg:text-2xl text-gray-800 font-bold">
                🔐 Password Security Center
              </p>
              <p className="text-base text-gray-600 font-medium">
                Create a strong password to protect your business data and enhance account security.
              </p>

              {/* Feature Highlights */}
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-indigo-100">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-gray-700">Enhanced Security</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-purple-100">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-700">Password Protection</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-blue-100">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">Validation Checks</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden transform hover:shadow-3xl transition-all duration-500">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-8">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  <h3 className="text-white text-2xl font-bold text-center">
                    Update Password
                  </h3>
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <p className="text-indigo-100 text-center text-sm">
                  Strengthen your account security with a new password
                </p>
              </div>
              <div className="p-8 lg:p-12">
                <div className="max-w-4xl mx-auto space-y-12">

                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Current Password */}
                  <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="flex items-center mb-8 pb-4 border-b-2 border-indigo-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl transform hover:scale-110 transition-all duration-300">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Current Password</h3>
                        <p className="text-sm text-gray-600 mt-1">Verify your identity</p>
                      </div>
                    </div>

                    <div className="space-y-3 group">
                      <Label htmlFor="currentPassword" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                        <Lock className="w-4 h-4 mr-2 text-indigo-500" />
                        Current Password <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter your current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={`${inputClasses} pl-12 pr-12 transition-all duration-300 group-hover:border-indigo-400 group-focus-within:ring-indigo-200 h-12`}
                          required
                        />
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* New Password Section */}
                  <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="flex items-center mb-8 pb-4 border-b-2 border-purple-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">New Password</h3>
                    </div>

                    <div className="space-y-3 group">
                      <Label htmlFor="newPassword" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                        <Shield className="w-4 h-4 mr-2 text-indigo-500" />
                        New Password <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Create a strong new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`${inputClasses} pl-12 pr-12 transition-all duration-300 group-hover:border-indigo-400 group-focus-within:ring-indigo-200 h-12`}
                          required
                        />
                        <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced Password Requirements */}
                    {newPassword && (
                      <div className="space-y-4 animate-fade-in p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100" style={{ animationDelay: '0.8s' }}>
                        <div className="flex items-center mb-4">
                          <Shield className="w-5 h-5 text-indigo-600 mr-2" />
                          <Label className="text-lg font-bold text-gray-800">Password Strength Requirements</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentRequirements.map((requirement, index) => (
                            <div
                              key={requirement.id}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                                requirement.met
                                  ? 'bg-green-50 border border-green-200 shadow-sm'
                                  : 'bg-red-50 border border-red-200'
                              }`}
                              style={{ animationDelay: `${1.0 + index * 0.1}s` }}
                            >
                              <div className={`transition-all duration-300 ${
                                requirement.met ? 'animate-bounce' : ''
                              }`}>
                                {requirement.met ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                              <span className={`text-sm font-medium transition-colors duration-300 ${
                                requirement.met ? "text-green-800" : "text-red-700"
                              }`}>
                                {requirement.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-3 bg-white/70 rounded-xl border border-indigo-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Overall Strength:</span>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                                allRequirementsMet ? 'bg-green-500 animate-pulse' : 'bg-red-400'
                              }`}></div>
                              <span className={`text-sm font-bold transition-colors duration-300 ${
                                allRequirementsMet ? 'text-green-700' : 'text-red-600'
                              }`}>
                                {allRequirementsMet ? 'Strong' : 'Weak'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 group">
                      <Label htmlFor="confirmPassword" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                        <CheckCircle className="w-4 h-4 mr-2 text-indigo-500" />
                        Confirm New Password <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`${inputClasses} pl-12 pr-12 transition-all duration-300 group-hover:border-indigo-400 group-focus-within:ring-indigo-200 h-12`}
                          required
                        />
                        <CheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {confirmPassword && (
                        <div className={`flex items-center gap-2 text-sm p-3 rounded-xl transition-all duration-300 ${
                          passwordsMatch
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                          {passwordsMatch ? (
                            <CheckCircle className="h-5 w-5 text-green-600 animate-bounce" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            {passwordsMatch ? 'Passwords match perfectly!' : 'Passwords do not match'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms and Submit */}
                  <div className="space-y-6">
                    <Button
                      type="submit"
                      disabled={isLoading || !allRequirementsMet || !passwordsMatch || !currentPassword}
                      className={`w-full h-14 text-lg font-bold transition-all duration-500 transform hover:scale-105 rounded-xl shadow-xl ${
                        !allRequirementsMet || !passwordsMatch || !currentPassword
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 shadow-indigo-500/50 hover:shadow-2xl"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-3" />
                          Update Password Securely
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
