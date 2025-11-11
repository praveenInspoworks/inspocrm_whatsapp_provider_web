import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputWithError } from "@/components/ui/form-fields/InputWithError";
import { TextareaWithError } from "@/components/ui/form-fields/TextareaWithError";
import { SelectWithError } from "@/components/ui/form-fields/SelectWithError";
import { SelectItem } from "@/components/ui/select";
import { CheckboxWithError } from "@/components/ui/form-fields/CheckboxWithError";
import { DatePickerWithError } from "@/components/ui/form-fields/DatePickerWithError";
import * as LucideReact from "lucide-react";
import { onboardingService, CampaignSetupRequest } from "@/services/onboardingService";
import { campaignSetupSchema, CampaignSetupFormData, campaignGoalsOptions } from "@/lib/validations";
import { useNavigate } from "react-router-dom";

export function CampaignSetupForm() {
  const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CampaignSetupFormData>({
    resolver: zodResolver(campaignSetupSchema),
    mode: "onChange",
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      goals: []
    }
  });

  const watchCampaignType = watch("campaignType");
  const watchGoals = watch("goals");
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");

  const onSubmit = async (data: CampaignSetupFormData) => {
    setIsLoading(true);
    try {
      const campaignData: CampaignSetupRequest = {
        campaignName: data.campaignName,
        campaignType: data.campaignType,
        targetAudience: data.targetAudience,
        goals: data.goals,
        budget: data.budget,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString()
      };

      const response = await onboardingService.setupCampaign(campaignData);

      if (response.success) {
        // Onboarding complete - navigate to dashboard
        navigate('/');
      }
    } catch (error) {
      console.error('Campaign setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalChange = (goal: string, checked: boolean) => {
    const currentGoals = watchGoals || [];
    if (checked) {
      setValue("goals", [...currentGoals, goal]);
    } else {
      setValue("goals", currentGoals.filter(g => g !== goal));
    }
  };

  const campaignTypeDescriptions = {
    email: "Send targeted emails to your audience",
    social: "Post content across social media platforms",
    sms: "Send text messages to subscribers",
    multichannel: "Combine multiple channels for maximum reach"
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-green-600 via-green-700 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated background elements */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/5 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-2000"></div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 xl:p-12 w-full">
          <div className="max-w-lg text-center">
            <div className="w-20 xl:w-24 h-20 xl:h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 xl:mb-8 mx-auto border border-white/20">
              <LucideReact.Megaphone className="w-10 xl:w-12 h-10 xl:h-12 text-white" />
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              Launch Your First Campaign
            </h1>
            <p className="text-xl xl:text-2xl text-green-100 mb-6 xl:mb-8 font-medium">Get Started</p>

            <p className="text-base xl:text-lg text-green-100 leading-relaxed mb-8 xl:mb-12">
              Create your first marketing campaign to engage with your audience and start driving results with INSPOCRM.
            </p>

            {/* Campaign Tips */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl xl:rounded-2xl p-4 xl:p-6 border border-white/20">
              <h3 className="text-sm font-medium text-white mb-3">Campaign Success Tips:</h3>
              <ul className="text-xs text-green-100 space-y-1 text-left">
                <li>• Start with clear, measurable goals</li>
                <li>• Know your target audience well</li>
                <li>• Choose the right channels for your message</li>
                <li>• Set a realistic budget and timeline</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Campaign Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-3 sm:mb-4">
              <LucideReact.Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Create Your First Campaign</h2>
            <p className="text-sm sm:text-base text-gray-600">Launch a campaign to engage your audience</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <LucideReact.Target className="w-5 h-5 mr-2 text-green-600" />
                  Campaign Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <InputWithError
                    {...register("campaignName")}
                    error={errors.campaignName?.message}
                    placeholder="Summer Sale 2024, Product Launch, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Campaign Type</Label>
                  <Controller
                    name="campaignType"
                    control={control}
                    render={({ field }) => (
                      <SelectWithError
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.campaignType?.message}
                        placeholder="Select campaign type"
                      >
                        {Object.entries(campaignTypeDescriptions).map(([type, description]) => (
                          <SelectItem key={type} value={type}>
                            <div className="text-left">
                              <div className="font-medium capitalize">{type}</div>
                              <div className="text-xs text-gray-500">{description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectWithError>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <TextareaWithError
                    {...register("targetAudience")}
                    error={errors.targetAudience?.message}
                    placeholder="Describe who this campaign is targeting, their demographics, interests, and behaviors..."
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Campaign Goals (Select all that apply)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {campaignGoalsOptions.map((goal) => (
                      <label key={goal} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watchGoals?.includes(goal) || false}
                          onChange={(e) => handleGoalChange(goal, e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium">{goal}</span>
                      </label>
                    ))}
                  </div>
                  {errors.goals && (
                    <p className="text-sm text-red-500">{errors.goals.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (Optional)</Label>
                    <div className="relative">
                      <LucideReact.DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <InputWithError
                        type="number"
                        {...register("budget", { valueAsNumber: true })}
                        error={errors.budget?.message}
                        placeholder="0.00"
                        className="pl-10"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <div className="text-sm text-gray-600">
                      {watchStartDate && watchEndDate && (
                        <span>
                          {Math.ceil((watchEndDate.getTime() - watchStartDate.getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DatePickerWithError
                          selected={field.value}
                          onSelect={field.onChange}
                          error={errors.startDate?.message}
                          minDate={new Date()}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <DatePickerWithError
                          selected={field.value}
                          onSelect={field.onChange}
                          error={errors.endDate?.message}
                          minDate={watchStartDate || new Date()}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Campaign Preview */}
                {watchCampaignType && watch("campaignName") && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Campaign Preview:</h4>
                    <div className="text-xs text-green-800 space-y-1">
                      <p><strong>Name:</strong> {watch("campaignName")}</p>
                      <p><strong>Type:</strong> <span className="capitalize">{watchCampaignType}</span></p>
                      <p><strong>Goals:</strong> {watchGoals?.join(", ") || "None selected"}</p>
                      {watchStartDate && watchEndDate && (
                        <p><strong>Duration:</strong> {watchStartDate.toLocaleDateString()} - {watchEndDate.toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/brand-voice-setup')}
                className="px-6"
              >
                <LucideReact.ArrowLeft className="w-4 h-4 mr-2" />
                Back to Brand Voice
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="px-6 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <LucideReact.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <LucideReact.CheckCircle className="w-4 h-4 mr-2" />
                    Launch Campaign
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Skip campaign setup?{" "}
              <Button
                variant="link"
                className="text-green-600 hover:text-green-700 p-0 text-sm"
                onClick={() => navigate('/')}
              >
                Go to dashboard
              </Button>
            </p>
          </div>

          {/* Campaign Success Tips */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <LucideReact.CheckCircle className="w-3 h-3 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-green-900 mb-1">Ready to Launch!</h3>
                <p className="text-xs text-green-800">
                  Once you create this campaign, you'll be taken to your dashboard where you can monitor its performance and create more campaigns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
