import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Shield, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

interface PasswordRequirement {
  id: string;
  label: string;
  regex: RegExp;
  met: boolean;
}

export function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetPasswordWithToken } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

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

    if (!token || !email) {
      setError("Invalid reset link. Please request a new password reset.");
      setIsLoading(false);
      return;
    }

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

    try {
      await resetPasswordWithToken(token, newPassword);
      setSuccess(true);
      toast({
        title: "Password Reset Successfully",
        description: "Your password has been updated. You can now log in with your new password.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center shadow-sm border border-red-200">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Invalid Reset Link</CardTitle>
              <p className="text-muted-foreground mt-2">
                This password reset link is invalid or has expired.
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <Button
              onClick={() => window.location.href = "/forgot-password"}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center shadow-sm border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Password Reset Successfully</CardTitle>
              <p className="text-muted-foreground mt-2">
                Your password has been updated successfully.
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <Button
              onClick={() => window.location.href = "/"}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex">
      {/* Left Side - Brand & Info */}
      <div className="flex-1 max-w-[50%] h-screen sticky top-0">
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
                <div className="text-4xl">🔐</div>
              </div>
            </div>

            {/* Main Description */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl font-bold mb-3">Password Reset</h2>
              <p className="text-blue-100 leading-relaxed">
                Securely reset your password to regain access to your HotKup account.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                <Lock className="w-5 h-5 text-white" />
                <span className="font-semibold">Secure Reset</span>
              </div>
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                <Shield className="w-5 h-5 text-white" />
                <span className="font-semibold">Account Protection</span>
              </div>
              <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                <CheckCircle className="w-5 h-5 text-white" />
                <span className="font-semibold">Verified Access</span>
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
                  <Lock className="w-4 h-4" />
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-start justify-center p-8 bg-gray-50 min-h-screen">
        <div className="w-full max-w-lg">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight">
              Reset Your Password
            </h1>

            <div className="space-y-3">
              <p className="text-xl lg:text-2xl text-gray-800 font-bold">
                🔐 Secure Password Reset
              </p>
              <p className="text-base text-gray-600 font-medium">
                Create a new secure password to regain access to your HotKup account.
              </p>

              {/* Feature Highlights */}
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-indigo-100">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-gray-700">Account Security</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-purple-100">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-700">Encrypted Reset</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-blue-100">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">Verified Access</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden transform hover:shadow-3xl transition-all duration-500">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-8">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <Lock className="w-6 h-6 text-yellow-300" />
                  <h3 className="text-white text-2xl font-bold text-center">
                    Password Reset
                  </h3>
                  <Lock className="w-6 h-6 text-yellow-300" />
                </div>
                <p className="text-indigo-100 text-center text-sm">
                  Create a new secure password for your account
                </p>
              </div>
              <div className="p-8 lg:p-12">
                <div className="max-w-md mx-auto space-y-8">
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Email Info */}
                  {email && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">Resetting Password For</h4>
                          <p className="text-sm text-gray-600">{email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Password */}
                  <div className="space-y-3 group">
                    <Label htmlFor="newPassword" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                      <Lock className="w-4 h-4 mr-2 text-indigo-500" />
                      New Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="text-sm transition-all duration-300 border-2 border-gray-200 focus:border-indigo-500 rounded-xl hover:shadow-lg focus:ring-4 focus:ring-indigo-100 pl-12 pr-12 h-12"
                        required
                      />
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? (
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

                  {/* Password Requirements */}
                  {newPassword && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                        Password Requirements
                      </h4>
                      <div className="space-y-3 text-sm">
                        {currentRequirements.map((requirement) => (
                          <div key={requirement.id} className={`flex items-center space-x-3 ${requirement.met ? 'text-green-700' : 'text-gray-600'}`}>
                            {requirement.met ? (
                              <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                            )}
                            <span>{requirement.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div className="space-y-3 group">
                    <Label htmlFor="confirmPassword" className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                      <CheckCircle className="w-4 h-4 mr-2 text-indigo-500" />
                      Confirm New Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="text-sm transition-all duration-300 border-2 border-gray-200 focus:border-indigo-500 rounded-xl hover:shadow-lg focus:ring-4 focus:ring-indigo-100 pl-12 pr-12 h-12"
                        required
                      />
                      <CheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {confirmPassword && (
                      <div className="flex items-center gap-2 text-sm">
                        {passwordsMatch ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={passwordsMatch ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                          {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Password is always masked for security
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                      className={`w-full h-14 text-lg font-bold transition-all duration-500 transform hover:scale-105 rounded-xl shadow-xl ${
                        !isLoading && allRequirementsMet && passwordsMatch
                          ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 shadow-indigo-500/50 hover:shadow-2xl"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Lock className="w-5 h-5 mr-3" />
                          Resetting Password...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-3" />
                          Reset Password
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
