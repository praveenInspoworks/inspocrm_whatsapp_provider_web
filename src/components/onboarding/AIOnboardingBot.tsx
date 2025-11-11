import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, ArrowRight, Sparkles, Building2, CreditCard, Mic, Rocket, Users, Zap, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { onboardingService } from '@/services/onboardingService';
import { toast } from 'sonner';
import { on } from 'events';
import { set } from 'date-fns';

const AIOnboardingBot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show onboarding bot for ADMIN users, not members
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');
  if (!isAdmin) {
    return null; // Don't render anything for non-admin users
  }
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([true, true, false, false]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showGuideMessage, setShowGuideMessage] = useState(false);
  const [guideMessage, setGuideMessage] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [remainingSteps, setRemainingSteps] = useState(0);
  const [loading, setLoading] = useState(false);

  const onboardingSteps = [
    {
      id: 'signup',
      title: 'Account Signup',
      description: 'Complete account registration and organization setup',
      icon: CheckCircle2,
      route: '/signup',
      completed: false,
      required: true,
      guideMessage: 'Account registration completed successfully.'
    },
    {
      id: 'email_verification',
      title: 'Email Verification',
      description: 'Verify admin email address for account activation',
      icon: CheckCircle2,
      route: '/verify-email',
      completed: false,
      required: true,
      guideMessage: 'Verify your email to secure your account and activate all features.'
    },
    {
      id: 'admin_setup',
      title: 'Admin Setup',
      description: 'Set up admin user account and security settings',
      icon: Building2,
      route: '/set-password',
      completed: false,
      required: true,
      guideMessage: 'Complete admin account setup with password and security configuration.'
    },
    {
      id: 'first_campaign',
      title: 'First Campaign',
      description: 'Create and send your first WhatsApp marketing campaign with template',
      icon: Rocket,
      route: '/whatsapp/campaigns',
      completed: false,
      required: true,
      guideMessage: 'Create your first message template and successfully publish your first WhatsApp marketing campaign.'
    }
  ];

  // Guide messages for each onboarding route
  const getGuideMessage = (route: string) => {
    const step = onboardingSteps.find(s => s.route === route);
    return step?.guideMessage || 'Continue with your onboarding setup.';
  };

  const progressPercentage = onboardingStatus && typeof onboardingStatus.progressPercentage === 'number' && !isNaN(onboardingStatus.progressPercentage)
    ? onboardingStatus.progressPercentage
    : completedSteps.length > 0
      ? Math.round((completedSteps.filter(s => s === true).length / completedSteps.length) * 100)
      : 0;

  const mandatoryComplete = onboardingStatus
    ? (onboardingStatus.isOnboardingComplete || onboardingStatus.status === 'ACTIVE')
    : completedSteps.every(s => s === true); // All 4 steps are mandatory

  // Function to activate tenant
  const activateTenant = async () => {
    try {
      // Get tenant code from localStorage or user context
      const tenantCode = localStorage.getItem('tenant_code') ||
                        (user as any)?.tenantCode ||
                        (user as any)?.organizationCode;
      if (!tenantCode) {
        throw new Error('Tenant code not found');
      }

      // Use the apiService post function which handles base URL and auth headers
      const { post } = await import('@/services/apiService');
      const result = await post(`/api/v1/admin/tenants/${tenantCode}/activate`);

      console.log('Tenant activation successful:', result);
      return result;
    } catch (error) {
      console.error('Error activating tenant:', error);
      throw error;
    }
  };



  // Fetch onboarding status from backend
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (user) {
        try {
          setLoading(true);
          const status = await onboardingService.getOnboardingStatus() as any;
          setOnboardingStatus(status);

          console.log('Fetched onboarding status:', status);

          // FIRST: Update completed steps based on actual backend checklist data
          let newCompletedSteps = completedSteps; // Default to current state
          if (status && status.checklist && status.checklist.steps) {
            const checklistSteps = status.checklist.steps;
            newCompletedSteps = onboardingSteps.map((step) => {
              // Find the corresponding step in the backend checklist
              const backendStep = checklistSteps.find((cs: any) => cs.name === step.id);
              if (backendStep) {
                // A step is considered completed if it's marked as COMPLETED or SKIPPED
                return backendStep.status === 'COMPLETED' || backendStep.status === 'SKIPPED';
              }
              return false;
            });

            setCompletedSteps(newCompletedSteps);
            console.log('Updated completed steps from backend checklist:', newCompletedSteps);

            // Calculate remaining steps (only count required steps that are not completed)
            const remainingRequired = onboardingSteps.filter((step, index) =>
              step.required && !newCompletedSteps[index]
            ).length;
            setRemainingSteps(remainingRequired);
          }

          // SECOND: Check organization status and activate if pending AND core steps are complete
          if (status && (status.organizationStatus === 'PENDING_ACTIVATION' || status.status === 'PENDING_ACTIVATION')) {
            // Check if core steps are complete (steps 0,1,2 - signup, email_verification, admin_setup)
            const coreStepsIndices = [0, 1, 2]; // signup, email_verification, admin_setup
            const coreStepsComplete = coreStepsIndices.every(index => newCompletedSteps[index] === true);

            if (coreStepsComplete) {
              console.log('Organization is PENDING_ACTIVATION and core onboarding steps are complete, activating...');
              try {
                await activateTenant();
                // Refresh status after activation
                const updatedStatus = await onboardingService.getOnboardingStatus() as any;
                setOnboardingStatus(updatedStatus);
                // Update local status variable for further processing
                Object.assign(status, updatedStatus);
                toast.success('Organization activated successfully!');
              } catch (activationError) {
                console.error('Failed to activate tenant:', activationError);
                toast.error('Failed to activate organization');
              }
            } else {
              const completedCore = coreStepsIndices.filter(index => newCompletedSteps[index] === true).length;
              console.log(`Organization is PENDING_ACTIVATION but only ${completedCore}/${coreStepsIndices.length} core steps complete. Waiting for completion.`);
            }
          }

          // Fallback to progress-based calculation if no checklist data
          if (!status?.checklist?.steps) {
            // Fallback to progress-based calculation if no checklist data
            const completedCount = (status as any).completedSteps || (status as any).progress?.completedSteps || 0;
            const progressPercentage = (status as any).progressPercentage || 0;
            const stepsFromProgress = Math.round((progressPercentage / 100) * onboardingSteps.length);
            const actualCompletedCount = Math.max(completedCount, stepsFromProgress);

            const newCompletedSteps = onboardingSteps.map((_, index) => {
              return index < actualCompletedCount;
            });

            setCompletedSteps(newCompletedSteps);
            console.log('Fallback: Backend completed count:', completedCount, 'Calculated from progress:', stepsFromProgress);

            const remaining = onboardingSteps.length - actualCompletedCount;
            setRemainingSteps(remaining < 0 ? 0 : remaining);
          }
        } catch (error) {
          console.error('Failed to fetch onboarding status:', error);
          toast.error('Failed to load onboarding progress');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOnboardingStatus();
  }, [user]);

  useEffect(() => {
    const firstIncomplete = completedSteps.findIndex(step => !step);
    if (firstIncomplete !== -1) {
      setCurrentStep(firstIncomplete);
    }
  }, [completedSteps]);

  // Check if it's the first time login
  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem(`onboardingSeen_${user.id}`);
      const firstTime = !hasSeenOnboarding;
      setIsFirstTime(firstTime);

      // Get fullName from localStorage for personalization
      const userData = JSON.parse(localStorage.getItem('tenant_user') || '{}');
      const fullName = userData.fullName || 'there';

      if (firstTime) {
        // First time: Show welcome message for 8-10 seconds
        setGuideMessage(`🎉 Welcome, ${fullName}! I am INSPOCRM AI guide for onboarding process. Click to setup your onboarding process.`);
        setShowGuideMessage(true);
        setIsMinimized(true); // Start minimized with message
        localStorage.setItem(`onboardingSeen_${user.id}`, 'true');

        // Auto-hide welcome message after 8-10 seconds
        setTimeout(() => {
          setShowGuideMessage(false);
        }, 9000); // 9 seconds (between 8-10)
      } else if (!mandatoryComplete) {
        // Subsequent login, onboarding not complete: Show welcome back for 8-10 seconds
        setGuideMessage(`Welcome back, ${fullName}! Complete your setup. Click to open brief popup and step way.`);
        setShowGuideMessage(true);
        setIsMinimized(true); // Start minimized with message

        // Auto-hide welcome back message after 8-10 seconds
        setTimeout(() => {
          setShowGuideMessage(false);
        }, 8500); // 8.5 seconds (between 8-10)
      } else {
        // Onboarding complete: Hide or minimize
        setIsMinimized(true);
        setShowGuideMessage(false);
      }
    }
  }, [user, mandatoryComplete]);

  // Detect navigation to onboarding routes and show guide message
  useEffect(() => {
    const onboardingRoutes = onboardingSteps.map(step => step.route);
    if (onboardingRoutes.includes(location.pathname)) {
      // Auto-minimize when navigating to onboarding page
      setIsMinimized(true);

      // Show guide message for 3 seconds
      const message = getGuideMessage(location.pathname);
      setGuideMessage(message);
      setShowGuideMessage(true);

      const timer = setTimeout(() => {
        setShowGuideMessage(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Listen for step completion events
  useEffect(() => {
    const handleStepCompleted = (event: any) => {
      const { stepId } = event.detail;
      const stepIndex = onboardingSteps.findIndex(step => step.id === stepId);
      if (stepIndex !== -1) {
        handleComplete(stepIndex);
      }
    };

    const handleStepSkipped = (event: any) => {
      const { stepId } = event.detail;
      const stepIndex = onboardingSteps.findIndex(step => step.id === stepId);
      if (stepIndex !== -1) {
        // Show specific message for billing setup skip
        if (stepId === 'billing_setup') {
          setGuideMessage('Skip now we move next step as brand voice setup');
          setShowGuideMessage(true);
          setIsMinimized(true);

          // Auto-hide message after 5 seconds
          setTimeout(() => {
            setShowGuideMessage(false);
          }, 5000);
        }

        // Mark as skipped (not completed) for proper Quartz scheduler handling
        handleSkipComplete(stepIndex);
      }
    };

    window.addEventListener('onboardingStepCompleted', handleStepCompleted);
    window.addEventListener('onboardingStepSkipped', handleStepSkipped);

    return () => {
      window.removeEventListener('onboardingStepCompleted', handleStepCompleted);
      window.removeEventListener('onboardingStepSkipped', handleStepSkipped);
    };
  }, []);

  const handleNavigate = (route) => {
    console.log('Navigating to:', route);

    // Set flag for AI bot navigation
    if (route === '/company-profile' || route === '/enhanced-brand-voice/create') {
      localStorage.setItem('from_ai_bot', 'true');
    }

    navigate(route);
  };

  const handleSkipStep = async (stepId) => {
    console.log('Skipping step:', stepId);

    try {
      setLoading(true);

      // Dispatch skip event to trigger the existing skip handler
      const skipEvent = new CustomEvent('onboardingStepSkipped', {
        detail: { stepId }
      });
      window.dispatchEvent(skipEvent);

      toast.success('Step skipped successfully!');

    } catch (error) {
      console.error('Failed to skip step:', error);
      toast.error('Failed to skip step');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipComplete = async (index) => {
    const step = onboardingSteps[index];
    if (!step) return;

    try {
      setLoading(true);

      // Update local state to mark as completed (for UI purposes)
      const newCompleted = [...completedSteps];
      newCompleted[index] = true;
      setCompletedSteps(newCompleted);

      // Call backend API to mark step as skipped
      const response = await onboardingService.skipOnboardingStep(step.id);

      if (response.success) {
        toast.success('Step skipped successfully!');
      } else {
        toast.error(response.message || 'Failed to skip step');
      }
    } catch (error) {
      console.error('Failed to skip step:', error);
      toast.error('Failed to skip step');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (index) => {
    const step = onboardingSteps[index];
    if (!step) return;

    try {
      setLoading(true);

      // For company_profile step, just show success message and mark as complete
      if (step.id === 'company_profile') {
        // Update local state immediately for better UX
        const newCompleted = [...completedSteps];
        newCompleted[index] = true;
        setCompletedSteps(newCompleted);

        toast.success('Company profile updated successfully!');

        // Check if all mandatory steps are complete (all 4 steps)
        const allMandatoryComplete = newCompleted.every(step => step);
        if (allMandatoryComplete) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }

        setLoading(false);
        return;
      }

      // Call backend API to complete the step for other steps
      const response = await onboardingService.completeOnboardingStep(step.id);

      if (response.success) {
        // Update local state
        const newCompleted = [...completedSteps];
        newCompleted[index] = true;
        setCompletedSteps(newCompleted);

        // Refresh onboarding status from backend
        const updatedStatus = await onboardingService.getOnboardingStatus();
        setOnboardingStatus(updatedStatus);

        // Update completed steps based on refreshed backend data
        if (updatedStatus) {
          const completedCount = (updatedStatus as any).completedSteps || (updatedStatus as any).progress?.completedSteps || 0;
          const progressPercentage = (updatedStatus as any).progressPercentage || 0;
          const stepsFromProgress = Math.round((progressPercentage / 100) * onboardingSteps.length);
          const actualCompletedCount = Math.max(completedCount, stepsFromProgress);

          const refreshedCompletedSteps = onboardingSteps.map((_, index) => {
            return index < actualCompletedCount;
          });
          setCompletedSteps(refreshedCompletedSteps);
        }

        toast.success('Step completed successfully!');

        // Check if all mandatory steps are complete (all 4 steps)
        const allMandatoryComplete = newCompleted.every(step => step);
        if (allMandatoryComplete) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } else {
        toast.error(response.message || 'Failed to complete step');
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      toast.error('Failed to complete step');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in backdrop-blur-sm">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 max-w-md text-center transform animate-bounce-in shadow-2xl border-2 border-white">
            <div className="text-7xl mb-4 animate-pulse">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-3">Congratulations!</h2>
            <p className="text-blue-100 text-lg mb-6">
              You've completed all mandatory onboarding steps! Your INSPOCRM account is now fully set up and ready to go.
            </p>
            <button
              onClick={() => setShowCelebration(false)}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
            >
              Start Creating Posts! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Main Guide Container */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 animate-slide-in-right">
        {/* Minimized State */}
        {isMinimized ? (
          <div
            onClick={() => setIsMinimized(false)}
            className="relative cursor-pointer group"
          >
            {/* Guide Message Bubble */}
            {showGuideMessage && (
              <div className="absolute bottom-full right-0 mb-3 bg-white rounded-lg shadow-lg p-3 border border-blue-200 animate-fade-in max-w-xs">
                <div className="flex items-start gap-2">
                  <img src="/images/Graident%20Ai%20Robot.jpg" alt="AI Robot" className="w-6 h-6 rounded-full flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{guideMessage}</p>
                </div>
                {/* Speech bubble tail */}
                <div className="absolute top-full right-4 w-3 h-3 bg-white border-r border-b border-blue-200 transform rotate-45"></div>
              </div>
            )}

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 p-1 shadow-2xl animate-pulse-slow hover:scale-110 transition-transform">
              <img src="/images/Graident%20Ai%20Robot.jpg" alt="AI Robot" className="w-full h-full rounded-full border-2 border-blue-200" />
            </div>
            {!mandatoryComplete && (
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce border-2 border-white">
                {remainingSteps}
              </div>
            )}
            <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Click to continue setup
            </div>
          </div>
        ) : (
          <>
            {/* Speech Bubble */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-5 max-w-sm border-2 border-blue-600 animate-float">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <img src="/images/Graident%20Ai%20Robot.jpg" alt="AI Robot" className="w-8 h-8 rounded-full" />
                  <div>
                    <h3 className="font-bold text-gray-900">AI Onboarding Assistant</h3>
                    <p className="text-xs text-gray-500">{isNaN(progressPercentage) ? '0' : Math.round(progressPercentage)}% Complete</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                    title="Minimize"
                  >
                    <div className="w-4 h-0.5 bg-current"></div>
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="mb-4 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-blue-700">{guideMessage}</span>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Setup Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {isNaN(progressPercentage) ? '0' : Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${isNaN(progressPercentage) ? 0 : progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white opacity-20 animate-shimmer"></div>
                  </div>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {onboardingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = completedSteps[index];
                  const isCurrent = index === currentStep;
                  
                  return (
                    <div
                      key={step.id}
                      className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer group ${
                        isCompleted
                          ? 'bg-blue-50 border-blue-300 hover:border-blue-400'
                          : isCurrent
                          ? 'bg-white border-blue-600 shadow-lg ring-2 ring-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                      onClick={() => !isCompleted && handleNavigate(step.route)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-blue-600 shadow-md'
                            : isCurrent
                            ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg animate-pulse'
                            : 'bg-gray-300'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="text-white" size={20} />
                          ) : (
                            <Icon className={`text-white ${isCurrent ? '' : 'opacity-60'}`} size={20} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold text-sm ${
                              isCompleted ? 'text-blue-700' : isCurrent ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {step.title}
                            </h4>
                            {!step.required && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                Optional
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        {/* Action Arrow */}
                        {!isCompleted && isCurrent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(step.route);
                            }}
                            className="flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-2 rounded-lg hover:scale-110 transition-transform shadow-md"
                          >
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!isCompleted && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(index);
                            }}
                            className="flex-1 text-xs py-1.5 px-2 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 font-medium transition-colors"
                          >
                            ✓ Mark Complete (Demo)
                          </button>
                          {/* Skip button for optional steps */}
                          {step.required === false && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSkipStep(step.id);
                              }}
                              className="flex-1 text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-medium transition-colors"
                            >
                              ⏭️ Skip
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {mandatoryComplete ? (
                  <button
                    onClick={() => setIsVisible(false)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-4 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
                  >
                    🚀 Start Creating Posts!
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigate(onboardingSteps[currentStep].route)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-4 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
                  >
                    Continue Setup →
                  </button>
                )}
              </div>

              {/* Speech Bubble Tail */}
              <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white border-b-2 border-r-2 border-blue-600 transform rotate-45"></div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </>
  );
};

export default AIOnboardingBot;
