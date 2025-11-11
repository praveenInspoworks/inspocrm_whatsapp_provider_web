import { useState, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, CheckCircle, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use the new common password reset API
      const response = await fetch('/api/v1/auth/common/password/reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      setSuccess(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden flex">
        {/* Left Side - Brand & Info */}
        <div className="flex-1 max-w-[50%] h-screen sticky top-0">
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden flex items-center justify-center p-8">
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
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Main Description */}
              <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h2 className="text-2xl font-bold mb-3">Password Reset Sent</h2>
                <p className="text-blue-100 leading-relaxed">
                  Check your email for password reset instructions. The link will expire in 1 hour.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 pt-6 border-t border-white/20 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <div className="flex justify-center space-x-6 text-blue-100 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>Email Sent</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="flex-1 flex items-start justify-center p-8 bg-gray-50 min-h-screen">
          <div className="w-full max-w-lg">
            {/* Header Section */}
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight">
                Email Sent Successfully
              </h1>

              <div className="space-y-3">
                <p className="text-xl lg:text-2xl text-gray-800 font-bold">
                  Check Your Inbox
                </p>
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden transform hover:shadow-3xl transition-all duration-500">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-8">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                    <h3 className="text-white text-2xl font-bold text-center">
                      Password Reset Email Sent
                    </h3>
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                  <p className="text-indigo-100 text-center text-sm">
                    We've sent reset instructions to your email address
                  </p>
                </div>
                <div className="p-8 lg:p-12">
                  <div className="max-w-md mx-auto space-y-8">
                    {/* Success Info */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">Email Sent Successfully</h4>
                          <p className="text-sm text-gray-600">Check your inbox for reset instructions</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        We've sent a secure password reset link to <strong>{email}</strong>.
                        The link will expire in 1 hour for security reasons.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      <Button
                        onClick={() => {
                          setSuccess(false);
                          setEmail("");
                        }}
                        className="w-full h-14 text-lg font-bold transition-all duration-500 transform hover:scale-105 rounded-xl shadow-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 shadow-indigo-500/50 hover:shadow-2xl"
                      >
                        <Mail className="w-5 h-5 mr-3" />
                        Send Another Email
                      </Button>

                      <Button
                        onClick={handleBackToLogin}
                        variant="outline"
                        className="w-full h-14 text-lg font-semibold transition-all duration-300 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50"
                      >
                        <ArrowLeft className="w-5 h-5 mr-3" />
                        Back to Login
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
                        Didn't receive the email? Check your spam folder or{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="text-indigo-600 hover:text-indigo-800 p-0 text-sm font-semibold transition-colors duration-300"
                          onClick={() => {
                            setSuccess(false);
                            setEmail("");
                          }}
                        >
                          try again
                        </Button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Left Side - Brand & Info */}
      <div className="flex-1 h-screen hidden lg:block">
        <div className="w-full h-full bg-gradient-to-br from-[#006AFF] to-blue-700 relative overflow-hidden flex items-center justify-center p-4 lg:p-8">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating circles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/10 animate-float"
                style={{
                  width: `${Math.random() * 80 + 30}px`,
                  height: `${Math.random() * 80 + 30}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center text-white max-w-sm w-full">
            {/* Logo/Brand */}
            <div className="mb-6 animate-fade-in">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">HotKup</h1>
              <p className="text-blue-100 text-base lg:text-lg">WhatsApp Provider Platform</p>
            </div>

            {/* Central Icon */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/30">
                <Mail className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </div>
            </div>

            {/* Main Description */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-xl lg:text-2xl font-bold mb-3">Password Recovery</h2>
              <p className="text-blue-100 leading-relaxed text-sm lg:text-base">
                Secure password recovery process. Enter your email and we'll send you a reset link to regain access to your account.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 pt-4 border-t border-white/20 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="flex justify-center space-x-4 lg:space-x-6 text-blue-100 text-xs lg:text-sm">
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Email</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Protected</span>
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
          <div className="text-center mb-8 lg:mb-12 animate-fade-in">
            <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-600 via-blue-700 to-purple-800 bg-clip-text text-transparent mb-4 leading-tight">
              Forgot Password
            </h1>

            <div className="space-y-3">
              <p className="text-lg lg:text-xl text-gray-800 font-bold">
                Reset Your Password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl border border-indigo-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 lg:px-8 py-6 lg:py-8">
                <div className="flex items-center justify-center space-x-2 lg:space-x-3 mb-2">
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-300" />
                  <h3 className="text-white text-xl lg:text-2xl font-bold text-center">
                    Password Recovery
                  </h3>
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-300" />
                </div>
                <p className="text-indigo-100 text-center text-xs lg:text-sm">
                  Enter your email to receive reset instructions
                </p>
              </div>
              <div className="px-6 lg:px-8 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <p className="text-xs text-gray-600 text-center font-medium">
                  We'll send you a secure link to reset your password. Check your email after submitting.
                </p>
              </div>
              <div className="p-6 lg:p-8">
                <div className="max-w-md mx-auto space-y-6 lg:space-y-8">
                  {/* Admin Info */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-indigo-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                        <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm lg:text-base">Password Reset</h4>
                        <p className="text-xs lg:text-sm text-gray-600">Secure email recovery</p>
                      </div>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
                      Enter your registered email address below. We'll send you a secure link to reset your password.
                      The link will expire in 1 hour for security reasons.
                    </p>
                  </div>

                  {/* Login Form */}
                  <div className="space-y-6">
                    <div className="space-y-3 group">
                      <Label htmlFor="email" className="flex items-center text-xs lg:text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                        <Mail className="w-3 h-3 lg:w-4 lg:h-4 mr-2 text-indigo-500" />
                        Email Address <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="text-sm transition-all duration-300 border-2 border-gray-200 focus:border-indigo-500 rounded-xl hover:shadow-lg focus:ring-4 focus:ring-indigo-100 h-12 pl-12"
                          required
                          autoComplete="email"
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-12 lg:h-14 text-base lg:text-lg font-bold transition-all duration-500 transform hover:scale-105 rounded-xl shadow-lg lg:shadow-xl ${
                        !isLoading
                          ? "bg-gradient-to-r from-[#006AFF] to-[#0052CC] hover:from-[#0052CC] hover:to-[#004080] shadow-[#006AFF]/50 hover:shadow-2xl"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Mail className="w-4 h-4 lg:w-5 lg:h-5 mr-3" />
                          Sending Reset Email...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 lg:w-5 lg:h-5 mr-3" />
                          Send Reset Link
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertDescription className="text-red-800 text-xs lg:text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Footer Links */}
                  <div className="text-center space-y-3 pt-4 lg:pt-6 border-t border-gray-200">
                    <p className="text-xs lg:text-sm text-gray-600">
                      Remember your password?{" "}
                      <Button
                        type="button"
                        variant="link"
                        className="text-indigo-600 hover:text-indigo-800 p-0 text-xs lg:text-sm font-semibold transition-colors duration-300"
                        onClick={handleBackToLogin}
                      >
                        Back to Login
                      </Button>
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600">
                      Need help? Contact your administrator
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default memo(ForgotPasswordForm);
