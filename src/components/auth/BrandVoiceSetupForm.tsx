import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TextareaWithError } from "@/components/ui/form-fields/TextareaWithError";
import { SelectWithError } from "@/components/ui/form-fields/SelectWithError";
import { SelectItem } from "@/components/ui/select";
import * as LucideReact from "lucide-react";
import * as ReactRouterDom from "react-router-dom";
import { onboardingService, BrandVoiceSetupRequest } from "@/services/onboardingService";
import { brandVoiceSchema, BrandVoiceFormData, brandValuesOptions } from "@/lib/validations";

export function BrandVoiceSetupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = ReactRouterDom.useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BrandVoiceFormData>({
    resolver: zodResolver(brandVoiceSchema),
    mode: "onChange",
    defaultValues: {
      brandValues: []
    }
  });

  const watchTone = watch("tone");
  const watchBrandValues = watch("brandValues");

  const onSubmit = async (data: BrandVoiceFormData) => {
    setIsLoading(true);
    try {
      const brandVoiceData: BrandVoiceSetupRequest = {
        tone: data.tone,
        voiceProfile: data.voiceProfile,
        bannedWords: data.bannedWords,
        preferredHashtags: data.preferredHashtags,
        targetAudience: data.targetAudience,
        brandValues: data.brandValues
      };

      const response = await onboardingService.setupBrandVoice(brandVoiceData);

      if (response.success) {
        // Navigate to campaign setup
        navigate('/campaign-setup');
      }
    } catch (error) {
      console.error('Brand voice setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(1);
    }
  };

  const handleBrandValueChange = (value: string, checked: boolean) => {
    const currentValues = watchBrandValues || [];
    if (checked) {
      setValue("brandValues", [...currentValues, value]);
    } else {
      setValue("brandValues", currentValues.filter(v => v !== value));
    }
  };

  const toneDescriptions = {
    professional: "Formal, business-like communication style",
    friendly: "Warm, approachable, and conversational tone",
    formal: "Traditional, respectful, and structured language",
    casual: "Relaxed, informal, and easy-going communication",
    luxury: "Premium, sophisticated, and elegant expression",
    playful: "Fun, energetic, and light-hearted approach"
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated background elements */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/5 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-2000"></div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 xl:p-12 w-full">
          <div className="max-w-lg text-center">
            <div className="w-20 xl:w-24 h-20 xl:h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 xl:mb-8 mx-auto border border-white/20">
              <LucideReact.Mic className="w-10 xl:w-12 h-10 xl:h-12 text-white" />
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              Brand Voice Setup
            </h1>
            <p className="text-xl xl:text-2xl text-purple-100 mb-6 xl:mb-8 font-medium">AI-Powered</p>

            <p className="text-base xl:text-lg text-purple-100 leading-relaxed mb-8 xl:mb-12">
              Define your brand's personality and voice. This will help our AI generate content that perfectly matches your brand identity.
            </p>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-white' : 'bg-white/30'}`}></div>
                <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
              </div>
              <p className="text-sm text-purple-200">
                Step {currentStep} of 2: {currentStep === 1 ? 'Brand Identity' : 'Voice Profile'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Brand Voice Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-3 sm:mb-4">
              <LucideReact.Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Define Your Brand Voice</h2>
            <p className="text-sm sm:text-base text-gray-600">Help our AI understand your brand personality</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Step 1: Brand Identity */}
            {currentStep === 1 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <LucideReact.Lightbulb className="w-5 h-5 mr-2 text-purple-600" />
                    Brand Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Brand Tone</Label>
                    <Controller
                      name="tone"
                      control={control}
                      render={({ field }) => (
                        <SelectWithError
                          value={field.value}
                          onValueChange={field.onChange}
                          error={errors.tone?.message}
                          placeholder="Select your brand tone"
                        >
                          {Object.entries(toneDescriptions).map(([tone, description]) => (
                            <SelectItem key={tone} value={tone}>
                              <div className="text-left">
                                <div className="font-medium capitalize">{tone}</div>
                                <div className="text-xs text-gray-500">{description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectWithError>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <TextareaWithError
                      {...register("targetAudience")}
                      error={errors.targetAudience?.message}
                      placeholder="Describe your ideal customers, their demographics, interests, and pain points..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Brand Values (Select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {brandValuesOptions.map((value) => (
                        <label key={value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={watchBrandValues?.includes(value) || false}
                            onChange={(e) => handleBrandValueChange(value, e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium">{value}</span>
                        </label>
                      ))}
                    </div>
                    {errors.brandValues && (
                      <p className="text-sm text-red-500">{errors.brandValues.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Voice Profile */}
            {currentStep === 2 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <LucideReact.Mic className="w-5 h-5 mr-2 text-purple-600" />
                    Voice Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="voiceProfile">Brand Voice Profile</Label>
                    <TextareaWithError
                      {...register("voiceProfile")}
                      error={errors.voiceProfile?.message}
                      placeholder="Describe how your brand communicates. Include style guidelines, preferred language, key phrases, and communication patterns..."
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      Be specific about your brand's communication style, vocabulary preferences, and personality traits.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bannedWords">Words/Phrases to Avoid (Optional)</Label>
                      <TextareaWithError
                        {...register("bannedWords")}
                        error={errors.bannedWords?.message}
                        placeholder="Enter words or phrases that don't align with your brand..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredHashtags">Preferred Hashtags (Optional)</Label>
                      <TextareaWithError
                        {...register("preferredHashtags")}
                        error={errors.preferredHashtags?.message}
                        placeholder="#YourBrand #Industry..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Preview Section */}
                  {watchTone && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="text-sm font-medium text-purple-900 mb-2">Preview:</h4>
                      <p className="text-xs text-purple-800">
                        Your brand voice will generate content with a <strong className="capitalize">{watchTone}</strong> tone,
                        targeting <strong>{watch("targetAudience")?.substring(0, 50)}...</strong>
                        {watchBrandValues && watchBrandValues.length > 0 && (
                          <>, emphasizing values like <strong>{watchBrandValues.slice(0, 2).join(", ")}</strong></>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="px-6"
                >
                  <LucideReact.ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}

              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="px-6 ml-auto bg-purple-600 hover:bg-purple-700"
                >
                  Next
                  <LucideReact.ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 ml-auto bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <LucideReact.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving Brand Voice...
                    </>
                  ) : (
                    <>
                      <LucideReact.CheckCircle className="w-4 h-4 mr-2" />
                      Save Brand Voice
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <Button
                variant="link"
                className="text-purple-600 hover:text-purple-700 p-0 text-sm"
                onClick={() => window.open('/help/brand-voice', '_blank')}
              >
                View examples
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
