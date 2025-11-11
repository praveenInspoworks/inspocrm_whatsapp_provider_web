// components/onboarding/OnboardingCompletionPopup.tsx
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Building,
  Mail,
  User,
  Settings,
  Users,
  Megaphone
} from "lucide-react";
import { onboardingService } from "@/services/onboardingService";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

interface OnboardingCompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  action?: string;
}

export function OnboardingCompletionPopup({
  isOpen,
  onClose,
  onComplete
}: OnboardingCompletionPopupProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      loadOnboardingStatus();
    }
  }, [isOpen, user]);

  const loadOnboardingStatus = async () => {
    try {
      const status = await onboardingService.getOnboardingStatus();
      const progressData = onboardingService.getOnboardingProgress();
      
      // Define onboarding steps based on your requirements
      const steps: OnboardingStep[] = [
        {
          id: 'company-info',
          title: 'Company Information',
          description: 'Complete your company profile and details',
          completed: !!status.tenantInfo?.companyName,
          required: true,
          action: '/profile?tab=company'
        },
        {
          id: 'billing-address',
          title: 'Billing Address',
          description: 'Set up invoice and important information delivery',
          completed: false, // You'll need to track this in your backend
          required: true,
          action: '/profile?tab=billing'
        },
        {
          id: 'team-members',
          title: 'Team Members',
          description: 'Add your team members to collaborate',
          completed: false, // You'll need to track this
          required: false,
          action: '/team'
        },
        {
          id: 'brand-voice',
          title: 'Brand Voice Setup',
          description: 'Configure your communication preferences',
          completed: false, // Track from onboarding service
          required: true,
          action: '/profile?tab=brand'
        },
        {
          id: 'first-campaign',
          title: 'Create First Campaign',
          description: 'Set up your initial marketing campaign',
          completed: false, // Track from onboarding service
          required: false,
          action: '/campaigns/new'
        }
      ];

      setOnboardingSteps(steps);
      
      // Calculate progress
      const completedSteps = steps.filter(step => step.completed).length;
      const totalRequiredSteps = steps.filter(step => step.required).length;
      setProgress(Math.round((completedSteps / totalRequiredSteps) * 100));
      
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
      toast({
        title: "Error",
        description: "Failed to load onboarding progress",
        variant: "destructive",
      });
    }
  };

  const handleCompleteStep = async (stepId: string) => {
    const step = onboardingSteps.find(s => s.id === stepId);
    if (step?.action) {
      navigate(step.action);
      onClose();
    }
  };

  const handleCompleteAll = async () => {
    if (progress < 100) {
      toast({
        title: "Incomplete Setup",
        description: "Please complete all required steps before finishing onboarding.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use the onboarding service method
      const response = await onboardingService.completeOnboarding();

      if (response.success) {
        toast({
          title: "Success!",
          description: "Onboarding completed successfully!",
          variant: "success",
        });
        onComplete();
        onClose();

        // Refresh user status
        window.location.reload();
      } else {
        throw new Error(response.message || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemindLater = () => {
    toast({
      title: "Reminder Set",
      description: "We'll remind you to complete setup in 24 hours.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6 text-blue-600" />
            Complete Your Setup
          </DialogTitle>
          <DialogDescription>
            Finish these steps to unlock all features and optimize your INSPOCRM experience.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold">Setup Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {progress}% complete - Almost there!
                </p>
              </div>
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {progress === 100 ? "Ready to Complete" : "In Progress"}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Steps List */}
        <div className="space-y-4">
          <h4 className="font-semibold">Required Steps</h4>
          {onboardingSteps
            .filter(step => step.required)
            .map((step) => (
              <Card key={step.id} className={`border-l-4 ${
                step.completed 
                  ? 'border-l-green-500 bg-green-50' 
                  : 'border-l-blue-500 bg-blue-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        step.completed ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium">{step.title}</h5>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={step.completed ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleCompleteStep(step.id)}
                      disabled={step.completed}
                    >
                      {step.completed ? "Completed" : "Complete"}
                      {!step.completed && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Optional Steps */}
        <div className="space-y-4">
          <h4 className="font-semibold">Recommended Steps</h4>
          {onboardingSteps
            .filter(step => !step.required)
            .map((step) => (
              <Card key={step.id} className="border-l-4 border-l-orange-500 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-orange-100">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h5 className="font-medium">{step.title}</h5>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompleteStep(step.id)}
                    >
                      Setup
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Benefits */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2 text-blue-900">Unlock Full Potential</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Advanced analytics and reporting
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Team collaboration features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Automated campaign management
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Priority customer support
              </li>
            </ul>
          </CardContent>
        </Card>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleRemindLater}
            disabled={loading}
          >
            Remind Me Later
          </Button>
          <Button
            onClick={handleCompleteAll}
            disabled={loading || progress < 100}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Complete Setup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
