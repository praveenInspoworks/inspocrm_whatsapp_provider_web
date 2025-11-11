import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Mail,
  Building,
  Shield,
  Settings,
  Camera,
  Save,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  Key,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  Award,
  Star,
  Briefcase,
  Activity,
  Globe,
  Bell,
  CreditCard,
  Mic,
  Rocket
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { EnhancedTwoFactorAuth } from "./EnhancedTwoFactorAuth";
import { LoginHistory } from "./LoginHistory";
import { onboardingService, OnboardingProgress } from "@/services/onboardingService";
import apiService from "@/services/apiService";

import "@/styles/components/UserProfilePage.scss";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  departmentName: string;
  role: string;
  department: string;
  lastActive: string;
  joinDate: string;
  avatarUrl?: string;
}

export default function UserProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Onboarding state
  const [onboardingStatus, setOnboardingStatus] = useState<any | null>(null);

  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    setActiveTab(value);
  };

  // Determine if user is admin or member
  const isAdmin = user?.roles?.some(role => role === 'ADMIN' || role === 'SUPER_ADMIN');

  const [userData] = useState({
    firstName: user?.firstName || "John",
    lastName: user?.lastName || "Doe",
    email: user?.email || "john.doe@company.com",
    phone: user?.phone || "+1 (555) 123-4567",
    position: user?.position || "Senior Product Manager",
    department: user?.departmentName || "Product Development",
    role: user?.roles?.[0] || "ADMIN",
    avatarUrl: user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    joinDate: "Jan 2023",
    lastActive: "2 hours ago",
    completionRate: 85
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "+1 (555) 123-4567",
    position: user?.position || "",
    departmentName: user?.departmentName || "",
    role: user?.roles?.[0] || "",
    department: user?.departmentName || "",
    lastActive: "2 hours ago",
    joinDate: "Jan 2023",
    avatarUrl: user?.avatarUrl || "",
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Determine if user is admin or member and call appropriate endpoint
      const isAdmin = user?.roles?.some(role => role === 'ADMIN' || role === 'SUPER_ADMIN');

      let updateResponse;

      if (isAdmin) {
        // Update admin profile - only send fields supported by AdminProfileUpdateRequest DTO
        const adminProfileData = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
          avatarUrl: profileData.avatarUrl
        };
        updateResponse = await apiService.put('/api/v1/auth/admin/profile/update', adminProfileData);
      } else {
        // Update member profile - include all fields for member users
        updateResponse = await apiService.put('/api/v1/member/auth/profile/update', profileData);
      }

      // Update local user context with the data we sent (since API doesn't return user data)
      const updatedProfileData = {
        ...profileData,
        avatar: profileData.avatarUrl // Map avatarUrl to avatar for updateProfile function
      };

      await updateProfile(updatedProfileData);

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "+1 (555) 123-4567",
      position: user?.position || "",
      departmentName: user?.departmentName || "",
      role: user?.roles?.[0] || "",
      department: user?.departmentName || "",
      lastActive: "2 hours ago",
      joinDate: "Jan 2023",
      avatarUrl: user?.avatarUrl || "",
    });
    setIsEditing(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For WhatsApp provider, avatar upload is simplified
    toast({
      title: "Feature Not Available",
      description: "Avatar upload is not available in this version.",
      variant: "destructive",
    });
  };

  // Load onboarding status when onboarding tab is accessed
  useEffect(() => {
    if (activeTab === 'onboarding' && !onboardingStatus) {
      loadOnboardingStatus();
    }
  }, [activeTab]);

  const loadOnboardingStatus = async () => {
    try {
      const status = await onboardingService.getOnboardingStatus();
      setOnboardingStatus(status);
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
      toast({
        title: "Error",
        description: "Failed to load onboarding status. Please try again.",
        variant: "destructive",
      });
    }
  };



  // Onboarding steps display component
  const OnboardingStepsDisplay = () => {
    const onboardingSteps = [
      {
        id: 'signup',
        title: 'Account Signup',
        description: 'Complete account registration',
        icon: CheckCircle2,
        route: '/signup',
        completed: true,
        required: true
      },
      {
        id: 'email_verification',
        title: 'Email Verification',
        description: 'Verify your email address',
        icon: CheckCircle2,
        route: '/verify-email',
        completed: false,
        required: true
      },
      {
        id: 'password_setup',
        title: 'Password Setup',
        description: 'Create a strong password',
        icon: CheckCircle2,
        route: '/set-password',
        completed: false,
        required: true
      },
      {
        id: 'company_profile',
        title: 'Company Profile',
        description: 'Set up your company information',
        icon: Building,
        route: '/company-profile',
        completed: false,
        required: true
      },
      {
        id: 'billing_setup',
        title: 'Billing Setup',
        description: 'Set up payment method',
        icon: CreditCard,
        route: '/billing',
        completed: false,
        required: false
      },
      {
        id: 'brand_voice',
        title: 'AI Brand Voice',
        description: 'Configure your AI personality',
        icon: Mic,
        route: '/enhanced-brand-voice',
        completed: false,
        required: true
      },
      {
        id: 'first_campaign',
        title: 'First Campaign',
        description: 'Create your first social media post',
        icon: Rocket,
        route: '/campaigns/create',
        completed: false,
        required: true
      },
      {
        id: 'team_invitation',
        title: 'Team Members',
        description: 'Invite your team',
        icon: Users,
        route: '/team',
        completed: false,
        required: false
      },
      {
        id: 'integration_setup',
        title: 'Social Media Integration',
        description: 'Connect your social accounts',
        icon: Zap,
        route: '/social-media/accounts',
        completed: false,
        required: false
      }
    ];

    // Calculate completed steps based on API response
    const completedCount = onboardingStatus?.completedSteps || 0;
    const progressPercentage = onboardingStatus?.progressPercentage || 0;

    return (
      <div className="space-y-6">
        {/* Progress Overview */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-green-600 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
              Onboarding Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {onboardingStatus?.status === 'ACTIVE' ? 'Onboarding Complete!' : 'Complete Your Setup'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {onboardingStatus?.organizationName ?
                      `${onboardingStatus.organizationName} (${onboardingStatus.tenantCode})` :
                      'Organization setup in progress'
                    }
                  </p>
                </div>
                <Badge variant={onboardingStatus?.status === 'ACTIVE' ? "default" : "secondary"}>
                  {onboardingStatus?.status === 'ACTIVE' ? 'Complete' : 'In Progress'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {completedCount} of {onboardingSteps.length} steps completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps List */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              Setup Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onboardingSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < completedCount;
                const isPending = !isCompleted && index === completedCount;

                return (
                  <div
                    key={step.id}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-50 border-green-300 hover:border-green-400'
                        : isPending
                        ? 'bg-blue-50 border-blue-400 shadow-lg'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-600'
                          : isPending
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="text-white" size={16} />
                        ) : (
                          <Icon className="text-white" size={16} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm ${
                          isCompleted ? 'text-green-700' : isPending ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {step.description}
                        </p>

                        {!isCompleted && (
                          <Button
                            size="sm"
                            className="mt-3 w-full text-xs"
                            variant={isPending ? "default" : "outline"}
                            onClick={() => navigate(step.route)}
                          >
                            {isPending ? 'Continue' : 'Go to Step'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {step.required && (
                      <Badge variant="outline" className="absolute top-2 right-2 text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You must be logged in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }

        .profile-float {
          animation: float 3s ease-in-out infinite;
        }

        .profile-slide-up {
          animation: slideUp 0.8s ease-out forwards;
        }

        .profile-slide-right {
          animation: slideRight 0.6s ease-out forwards;
        }

        .profile-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }

        .profile-scale {
          animation: scaleIn 0.6s ease-out forwards;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .input-focus-effect input:focus {
          transform: scale(1.02);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .stat-card {
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s;
        }

        .stat-card:hover::before {
          left: 100%;
        }

        .tab-content-fade {
          animation: fadeIn 0.5s ease-out;
        }

        .btn-glow:hover {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .progress-bar {
          transition: width 1s ease-in-out;
        }

        .badge-shine {
          position: relative;
          overflow: hidden;
        }

        .badge-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 3s infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Profile Header */}
          <Card className="relative overflow-hidden border-0 shadow-2xl profile-slide-up">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient"></div>
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <CardContent className="relative p-8 md:p-12">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Profile Picture */}
                <div className="flex flex-col items-center space-y-6 profile-float">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-white/30 rounded-full blur-xl group-hover:bg-white/50 transition-all duration-500"></div>

                    <Avatar className="relative h-32 w-32 ring-4 ring-white shadow-2xl border-4 border-white/50 transition-all duration-500 group-hover:scale-105">
                      <AvatarImage src={profileData.avatarUrl} alt={profileData.firstName} />
                      <AvatarFallback className="bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm text-white text-4xl font-bold">
                        {profileData.firstName[0]}{profileData.lastName[0]}
                      </AvatarFallback>
                    </Avatar>

                    {isEditing && (
                      <>
                        <Button
                          size="sm"
                          className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full p-0 bg-white hover:bg-gray-50 shadow-xl hover:scale-110 transition-all duration-300"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          <Camera className="h-5 w-5 text-blue-600" />
                        </Button>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>

                  <div className="text-center space-y-3">
                    <div className="profile-fade-in" style={{ animationDelay: '0.1s' }}>
                      <h2 className="text-3xl font-bold text-white tracking-tight">
                        {profileData.firstName} {profileData.lastName}
                      </h2>
                      <p className="text-blue-100 text-base flex items-center justify-center gap-2 mt-2">
                        <Mail className="h-4 w-4" />
                        {profileData.email}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 profile-fade-in" style={{ animationDelay: '0.2s' }}>
                      <Badge className="badge-shine bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-1.5 text-sm font-semibold">
                        <Shield className="h-3.5 w-3.5 mr-1.5" />
                        {profileData.role}
                      </Badge>
                      <Badge className="badge-shine bg-white/10 backdrop-blur-md text-white border-white/20 px-4 py-1.5 text-sm">
                        <Building className="h-3.5 w-3.5 mr-1.5" />
                        {profileData.department}
                      </Badge>
                    </div>

                    <p className="text-blue-100/90 text-sm font-medium flex items-center justify-center gap-2 profile-fade-in" style={{ animationDelay: '0.3s' }}>
                      <Briefcase className="h-4 w-4" />
                      {profileData.position}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Email Card */}
                    <div className="glass-card stat-card group profile-fade-in" style={{ animationDelay: '0.1s' }}>
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Mail className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Email</p>
                          <p className="text-white font-semibold truncate text-sm">{profileData.email}</p>
                          <Badge className="mt-2 bg-green-500/20 text-green-100 border-green-400/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Security Card */}
                    <div className="glass-card stat-card group profile-fade-in" style={{ animationDelay: '0.2s' }}>
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Security</p>
                          <p className="text-white font-semibold text-sm">Protected</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-100 text-xs font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Organization Card */}
                    <div className="glass-card stat-card group profile-fade-in" style={{ animationDelay: '0.3s' }}>
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Building className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Organization</p>
                          <p className="text-white font-semibold text-sm">Enterprise</p>
                          <Badge className="mt-2 bg-blue-500/20 text-blue-100 border-blue-400/30 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Activity Card */}
                    <div className="glass-card stat-card group profile-fade-in" style={{ animationDelay: '0.4s' }}>
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Activity className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Activity</p>
                          <p className="text-white font-semibold text-sm">Excellent</p>
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Access Level Card */}
                    <div className="glass-card stat-card group profile-fade-in" style={{ animationDelay: '0.5s' }}>
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Access</p>
                          <p className="text-white font-semibold text-sm">Full Access</p>
                          <p className="text-white/70 text-xs mt-1">All permissions</p>
                        </div>
                      </div>
                    </div>

                    {/* Last Active Card */}
                    <div className="glass-card stat-card group profile-fade-in" style={{ animationDelay: '0.6s' }}>
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Last Active</p>
                          <p className="text-white font-semibold text-sm">{profileData.lastActive}</p>
                          <p className="text-white/70 text-xs mt-1">Member since {profileData.joinDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
            <div className="profile-fade-in" style={{ animationDelay: '0.2s' }}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/80 backdrop-blur-xl border-2 border-gray-200/50 shadow-xl rounded-2xl p-2 gap-2">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl font-semibold hover:scale-105"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl font-semibold hover:scale-105"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger
                  value="roles"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl font-semibold hover:scale-105"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Roles</span>
                </TabsTrigger>
                <TabsTrigger
                  value="onboarding"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl font-semibold hover:scale-105"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Onboarding</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 profile-slide-right">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  {activeTab === 'personal' && 'Personal Information'}
                  {activeTab === 'security' && 'Security Settings'}
                  {activeTab === 'roles' && 'Roles & Permissions'}
                  {activeTab === 'onboarding' && 'Onboarding Progress'}
                </h1>
                <p className="text-gray-600 mt-2 text-sm md:text-base">
                  {activeTab === 'personal' && 'Manage your personal details and contact information'}
                  {activeTab === 'security' && 'Configure security settings and authentication'}
                  {activeTab === 'roles' && 'View your roles and permissions in the system'}
                  {activeTab === 'onboarding' && 'Track your onboarding progress and setup'}
                </p>
              </div>

              {activeTab === 'personal' && (
                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="px-6 border-2 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-glow"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div className="tab-content-fade">
              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 profile-scale">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      Basic Information
                      <Sparkles className="h-5 w-5 text-yellow-500 ml-auto" style={{ animation: 'pulse 2s infinite' }} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3 input-focus-effect">
                        <Label className="text-sm font-semibold text-gray-700">First Name</Label>
                        <Input
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-3 input-focus-effect">
                        <Label className="text-sm font-semibold text-gray-700">Last Name</Label>
                        <Input
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-3 input-focus-effect">
                        <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                        <Input
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-3 input-focus-effect">
                        <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          className="transition-all duration-300"
                        />
                      </div>
                      {!isAdmin && (
                        <>
                          <div className="space-y-3 input-focus-effect">
                            <Label className="text-sm font-semibold text-gray-700">Position</Label>
                            <Input
                              value={profileData.position}
                              onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                              disabled={!isEditing}
                              className="transition-all duration-300"
                            />
                          </div>
                          <div className="space-y-3 input-focus-effect">
                            <Label className="text-sm font-semibold text-gray-700">Department</Label>
                            <Input
                              value={profileData.departmentName}
                              onChange={(e) => setProfileData(prev => ({ ...prev, departmentName: e.target.value }))}
                              disabled={!isEditing}
                              className="transition-all duration-300"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-6 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={() => navigate("/change-password")}
                      >
                        <div className="flex items-center w-full">
                          <Key className="h-6 w-6 mr-4 text-blue-600" />
                          <div className="text-left">
                            <div className="font-semibold text-base">Change Password</div>
                            <div className="text-sm text-muted-foreground">Update your account password</div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto p-6 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={() => navigate("/settings")}
                      >
                        <div className="flex items-center w-full">
                          <Settings className="h-6 w-6 mr-4 text-indigo-600" />
                          <div className="text-left">
                            <div className="font-semibold text-base">Account Settings</div>
                            <div className="text-sm text-muted-foreground">Manage preferences</div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto p-6 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        <div className="flex items-center w-full">
                          <Bell className="h-6 w-6 mr-4 text-purple-600" />
                          <div className="text-left">
                            <div className="font-semibold text-base">Notifications</div>
                            <div className="text-sm text-muted-foreground">Configure alerts</div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto p-6 hover:bg-green-50 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        <div className="flex items-center w-full">
                          <Globe className="h-6 w-6 mr-4 text-green-600" />
                          <div className="text-left">
                            <div className="font-semibold text-base">Privacy Settings</div>
                            <div className="text-sm text-muted-foreground">Control your data</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-red-600 rounded-lg">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      Security Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Security Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:scale-105">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <h3 className="font-semibold text-green-900">Password</h3>
                          </div>
                          <p className="text-sm text-green-700">Strong and secure</p>
                          <p className="text-xs text-green-600 mt-1">Last changed 30 days ago</p>
                        </div>

                        <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105">
                          <div className="flex items-center gap-3 mb-3">
                            <Shield className="h-6 w-6 text-blue-600" />
                            <h3 className="font-semibold text-blue-900">2FA Enabled</h3>
                          </div>
                          <p className="text-sm text-blue-700">Extra protection active</p>
                          <p className="text-xs text-blue-600 mt-1">Via authenticator app</p>
                        </div>

                        <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:scale-105">
                          <div className="flex items-center gap-3 mb-3">
                            <Activity className="h-6 w-6 text-purple-600" />
                            <h3 className="font-semibold text-purple-900">Active Sessions</h3>
                          </div>
                          <p className="text-sm text-purple-700">3 devices connected</p>
                          <p className="text-xs text-purple-600 mt-1">All recognized</p>
                        </div>
                      </div>

                      {/* Enhanced Two Factor Auth */}
                      <EnhancedTwoFactorAuth
                        isEnabled={twoFactorEnabled}
                        onToggle={setTwoFactorEnabled}
                      />

                      {/* Login History */}
                      <LoginHistory />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        Current Role
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-[1.02]">
                        <div>
                          <p className="font-semibold text-lg text-gray-900">Primary Role</p>
                          <p className="text-sm text-gray-600 mt-1">{user.roles && user.roles.length > 0 ? user.roles[0] : 'USER'}</p>
                        </div>
                        <Badge className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
                          {user.roles && user.roles.length > 0 ? user.roles[0] : 'USER'}
                        </Badge>
                      </div>
                      {user.departmentName && (
                        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 hover:border-indigo-300 transition-all duration-300 hover:scale-[1.02]">
                          <div>
                            <p className="font-semibold text-lg text-gray-900">Department</p>
                            <p className="text-sm text-gray-600 mt-1">{user.departmentName}</p>
                          </div>
                          <Badge variant="outline" className="border-indigo-300 text-indigo-700 px-4 py-2 text-sm font-semibold">
                            {user.departmentName}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-purple-600 rounded-lg">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        Permissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-6">
                          You have {user.roles?.length || 0} role(s) with associated permissions.
                        </p>
                        <div className="space-y-3">
                          {user.roles?.map((role) => (
                            <div key={role} className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-green-50 hover:to-emerald-50 transition-all duration-300 hover:scale-[1.02]">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                          )) || (
                            <div className="text-center py-4 text-muted-foreground">
                              No roles assigned
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Onboarding Tab */}
              <TabsContent value="onboarding" className="space-y-6">
                <OnboardingStepsDisplay />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
