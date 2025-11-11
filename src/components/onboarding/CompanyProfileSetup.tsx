import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { InputWithError } from "../ui/form-fields/InputWithError";
import { TextareaWithError } from "../ui/form-fields/TextareaWithError";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/use-toast";
import { Building, Globe, MapPin, Phone, Mail, Upload, CheckCircle, ArrowLeft } from "lucide-react";

import { useAuth } from "../../hooks/use-auth";
import { useNavigate, useLocation } from "react-router-dom";
import apiService from "../../services/apiService";
import { onboardingService } from "../../services/onboardingService";
import { z } from "zod";
import { SelectWithError } from "../ui/form-fields/SelectWithError";
import { SelectItem } from "../ui/select";
import { ListValueDropdownWrapper } from "../ui/form-fields/ListValueDropdownWrapper";

// Zod validation schema
const companyProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  zipcode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  mission: z.string().optional(),
  targetAudience: z.string().optional(),
  socialMediaHandles: z.object({
    linkedin: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
    twitter: z.string().optional(),
    facebook: z.string().url("Please enter a valid Facebook URL").optional().or(z.literal("")),
    instagram: z.string().url("Please enter a valid Instagram URL").optional().or(z.literal("")),
  }).optional(),
});

interface CompanyProfileData {
  companyName: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phone: string;
  email: string;
  logoUrl?: string;
  mission?: string;
  targetAudience?: string;
  brandColors?: string[];
  socialMediaHandles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  industry?: string;
  companySize?: string;
  annualRevenue?: string;
  employeeCount?: string;
  foundedYear?: string;
}

export function CompanyProfileSetup() {
  const { user, onboardingStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if editing existing company
  const urlParams = new URLSearchParams(location.search);
  const isEditMode = urlParams.get('edit') === 'true';
  const companyId = urlParams.get('id');

  // Check if this is onboarding context
  const isOnboardingContext = window.location.pathname.includes('/company-profile') &&
    onboardingStatus && !onboardingStatus.isOnboardingComplete;

  // Check if coming from AI onboarding bot
  const isFromAIBot = urlParams.get('from') === 'ai-bot' || localStorage.getItem('from_ai_bot') === 'true';

  const [profileData, setProfileData] = useState<CompanyProfileData>({
    companyName: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
    email: '',
    mission: '',
    targetAudience: '',
    brandColors: [],
    socialMediaHandles: {},
    industry: '',
    companySize: 'SMALL'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Load existing company data if in edit mode
  useEffect(() => {
    if (isEditMode && companyId) {
      loadCompanyData(companyId);
    }
  }, [isEditMode, companyId]);

  const loadCompanyData = async (id: string) => {
    try {
      const response = await apiService.get(`/api/v1/companies/${id}`);
      if (response) {
        const company = response;
        setProfileData({
          companyName: company.companyName || company.name || '',
          website: company.website || '',
          addressLine1: company.addressLine1 || company.address || '',
          addressLine2: company.addressLine2 || '',
          city: company.city || '',
          state: company.state || '',
          zipcode: company.zipcode || '',
          country: company.country || '',
          phone: company.phone || '',
          email: company.email || '',
          mission: company.description || company.mission || '',
          targetAudience: company.targetAudience || company.notes || '',
          brandColors: company.brandColors ? company.brandColors.split(',') : [],
          socialMediaHandles: {
            linkedin: company.linkedinUrl || '',
            twitter: company.twitterHandle || '',
            facebook: company.facebookUrl || '',
            instagram: company.instagramHandle || ''
          },
          industry: company.industry || '',
          companySize: company.companySize || company.size || 'SMALL',
          annualRevenue: company.annualRevenue ? company.annualRevenue.toString() : '',
          employeeCount: company.employeeCount || '',
          foundedYear: company.foundedYear || ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load company data",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof CompanyProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      socialMediaHandles: {
        ...prev.socialMediaHandles,
        [platform]: value
      }
    }));

    // Clear validation error for social media when user starts typing
    const errorKey = `socialMediaHandles.${platform}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For WhatsApp provider, logo upload is simplified
    toast({
      title: "Feature Not Available",
      description: "Logo upload is not available in this version.",
      variant: "destructive",
    });
  };

  // Validation function
  const validateForm = () => {
    try {
      companyProfileSchema.parse(profileData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validate form using Zod schema
      if (!validateForm()) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the form before saving.",
          variant: "destructive",
        });
        return;
      }

      // Prepare company data for backend - only include non-empty fields
      const companyData: any = {
        companyName: profileData.companyName,
        industry: profileData.industry || 'Technology',
        companySize: profileData.companySize || 'SMALL',
        status: 'ACTIVE'
      };

      // Only add fields that have values (not empty strings)
      if (profileData.website && profileData.website.trim()) {
        companyData.website = profileData.website.trim();
      }
      if (profileData.phone && profileData.phone.trim()) {
        companyData.phone = profileData.phone.trim();
      }
      if (profileData.email && profileData.email.trim()) {
        companyData.email = profileData.email.trim();
      }
      if (profileData.addressLine1 && profileData.addressLine1.trim()) {
        companyData.addressLine1 = profileData.addressLine1.trim();
      }
      if (profileData.addressLine2 && profileData.addressLine2.trim()) {
        companyData.addressLine2 = profileData.addressLine2.trim();
      }
      if (profileData.city && profileData.city.trim()) {
        companyData.city = profileData.city.trim();
      }
      if (profileData.state && profileData.state.trim()) {
        companyData.state = profileData.state.trim();
      }
      if (profileData.zipcode && profileData.zipcode.trim()) {
        companyData.zipcode = profileData.zipcode.trim();
      }
      if (profileData.country && profileData.country.trim()) {
        companyData.country = profileData.country.trim();
      }
      if (profileData.logoUrl && profileData.logoUrl.trim()) {
        companyData.logoUrl = profileData.logoUrl.trim();
      }
      if (profileData.mission && profileData.mission.trim()) {
        companyData.description = profileData.mission.trim();
      }
      if (profileData.targetAudience && profileData.targetAudience.trim()) {
        companyData.targetAudience = profileData.targetAudience.trim();
      }

      // Social media handles - only add if they have valid values
      if (profileData.socialMediaHandles?.linkedin && profileData.socialMediaHandles.linkedin.trim()) {
        companyData.linkedinUrl = profileData.socialMediaHandles.linkedin.trim();
      }
      if (profileData.socialMediaHandles?.twitter && profileData.socialMediaHandles.twitter.trim()) {
        companyData.twitterHandle = profileData.socialMediaHandles.twitter.trim();
      }
      if (profileData.socialMediaHandles?.facebook && profileData.socialMediaHandles.facebook.trim()) {
        companyData.facebookUrl = profileData.socialMediaHandles.facebook.trim();
      }
      if (profileData.socialMediaHandles?.instagram && profileData.socialMediaHandles.instagram.trim()) {
        companyData.instagramHandle = profileData.socialMediaHandles.instagram.trim();
      }

      // Brand colors - only add if not empty
      if (profileData.brandColors && profileData.brandColors.length > 0 && profileData.brandColors[0]) {
        companyData.brandColors = profileData.brandColors.join(',');
      }

      // Annual revenue - only add if valid number
      if (profileData.annualRevenue && profileData.annualRevenue.trim()) {
        const revenueValue = parseFloat(profileData.annualRevenue);
        if (!isNaN(revenueValue)) {
          companyData.annualRevenue = revenueValue;
        }
      }

      let response;

      // Check if coming from AI bot or if it's onboarding context
      if (isFromAIBot || isOnboardingContext) {
        // Use onboarding service for AI bot context
        response = await onboardingService.updateCompanyInfo(companyData);
      } else if (isEditMode && companyId) {
        // Update existing company
        response = await apiService.put(`/api/v1/companies/${companyId}`, companyData);
      } else {
        // Create new company
        response = await apiService.post('/api/v1/companies', companyData);
      }

      if (response && response.success !== false) {
        const successMessage = isEditMode ? "Company updated successfully!" : "Company profile saved successfully!";
        toast({
          title: "Success",
          description: successMessage,
        });

        // Mark step as completed in the AI bot if onboarding context
        if (isOnboardingContext || isFromAIBot) {
          window.dispatchEvent(new CustomEvent('onboardingStepCompleted', {
            detail: { stepId: 'company_profile' }
          }));
        }

        // Clear AI bot flag after successful save
        localStorage.removeItem('from_ai_bot');

        // Navigate based on context
        if (isOnboardingContext || isFromAIBot) {
          navigate('/companies');
        } else {
          navigate('/companies');
        }
      } else {
        throw new Error(response?.message || 'Failed to save company');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save company profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/companies');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Companies
            </Button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isEditMode ? 'Edit Company Profile' : 'Complete Your Company Profile'}
              </h1>
              <p className="text-gray-600">
                {isEditMode
                  ? 'Update your company information below.'
                  : 'Help us understand your business better so we can tailor INSPOCRM to your needs.'
                }
              </p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <Card className="w-full">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName" className="text-base font-semibold text-gray-900 mb-2 block">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <InputWithError
                      id="companyName"
                      placeholder="Your Company Name"
                      value={profileData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="h-12"
                      error={errors.companyName}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-base font-semibold text-gray-900 mb-2 block">
                      Website URL <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <InputWithError
                        id="website"
                        placeholder="https://yourcompany.com"
                        className="pl-10 h-12"
                        value={profileData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        error={errors.website}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="industry" className="text-base font-semibold text-gray-900 mb-2 block">Industry</Label>
                    <ListValueDropdownWrapper
                      listKey="INDUSTRIES"
                      value={profileData.industry}
                      onValueChange={(value) => handleInputChange('industry', value)}
                      placeholder="Select Industry"
                    />
                  </div>

                  <div>
                    <Label htmlFor="companySize" className="text-base font-semibold text-gray-900 mb-2 block">Company Size</Label>
                    <SelectWithError
                      value={profileData.companySize}
                      onValueChange={(value) => handleInputChange('companySize', value)}
                      placeholder="Select size"
                    >
                      <SelectItem value="STARTUP">Startup</SelectItem>
                      <SelectItem value="SMALL">Small (1-50)</SelectItem>
                      <SelectItem value="MEDIUM">Medium (51-200)</SelectItem>
                      <SelectItem value="LARGE">Large (201-1000)</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise (1000+)</SelectItem>
                    </SelectWithError>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone" className="text-base font-semibold text-gray-900 mb-2 block">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <InputWithError
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        className="pl-10 h-12"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        error={errors.phone}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base font-semibold text-gray-900 mb-2 block">Business Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <InputWithError
                        id="email"
                        type="email"
                        placeholder="business@yourcompany.com"
                        className="pl-10 h-12"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        error={errors.email}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="annualRevenue" className="text-base font-semibold text-gray-900 mb-2 block">Annual Revenue</Label>
                    <InputWithError
                      id="annualRevenue"
                      placeholder="$10M"
                      value={profileData.annualRevenue || ''}
                      onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="employeeCount" className="text-base font-semibold text-gray-900 mb-2 block">Employee Count</Label>
                    <InputWithError
                      id="employeeCount"
                      placeholder="150"
                      value={profileData.employeeCount || ''}
                      onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="foundedYear" className="text-base font-semibold text-gray-900 mb-2 block">Founded Year</Label>
                    <InputWithError
                      id="foundedYear"
                      placeholder="2010"
                      value={profileData.foundedYear || ''}
                      onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Address Information */}
          <Card className="w-full">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="addressLine1" className="text-base font-semibold text-gray-900 mb-2 block">
                      Address Line 1 <span className="text-red-500">*</span>
                    </Label>
                    <InputWithError
                      id="addressLine1"
                      placeholder="123 Business Street"
                      value={profileData.addressLine1}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      className="h-12"
                      error={errors.addressLine1}
                    />
                  </div>

                  <div>
                    <Label htmlFor="addressLine2" className="text-base font-semibold text-gray-900 mb-2 block">Address Line 2</Label>
                    <InputWithError
                      id="addressLine2"
                      placeholder="Suite 100"
                      value={profileData.addressLine2}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      className="h-12"
                      error={errors.addressLine2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-base font-semibold text-gray-900 mb-2 block">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <InputWithError
                      id="city"
                      placeholder="New York"
                      value={profileData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="h-12"
                      error={errors.city}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="state" className="text-base font-semibold text-gray-900 mb-2 block">
                      State/Province <span className="text-red-500">*</span>
                    </Label>
                    <InputWithError
                      id="state"
                      placeholder="NY"
                      value={profileData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="h-12"
                      error={errors.state}
                    />
                  </div>

                  <div>
                    <Label htmlFor="zipcode" className="text-base font-semibold text-gray-900 mb-2 block">Zip/Postal Code</Label>
                    <InputWithError
                      id="zipcode"
                      placeholder="10001"
                      value={profileData.zipcode}
                      onChange={(e) => handleInputChange('zipcode', e.target.value)}
                      className="h-12"
                      error={errors.zipcode}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country" className="text-base font-semibold text-gray-900 mb-2 block">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <InputWithError
                      id="country"
                      placeholder="United States"
                      value={profileData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="h-12"
                      error={errors.country}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Additional Information */}
          <Card className="w-full">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Logo and Mission */}
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold text-gray-900 mb-3 block">Company Logo</Label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="logo"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="logo"
                              name="logo"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>

                    {profileData.logoUrl && (
                      <div className="flex justify-center mt-4">
                        <img
                          src={profileData.logoUrl}
                          alt="Company Logo"
                          className="h-20 w-20 object-contain rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="mission" className="text-base font-semibold text-gray-900 mb-2 block">Company Mission</Label>
                    <TextareaWithError
                      id="mission"
                      placeholder="Describe your company's mission and values..."
                      value={profileData.mission}
                      onChange={(e) => handleInputChange('mission', e.target.value)}
                      rows={4}
                      className="resize-none"
                      error={errors.mission}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetAudience" className="text-base font-semibold text-gray-900 mb-2 block">Target Audience</Label>
                    <TextareaWithError
                      id="targetAudience"
                      placeholder="Describe your ideal customers..."
                      value={profileData.targetAudience}
                      onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                      rows={4}
                      className="resize-none"
                      error={errors.targetAudience}
                    />
                  </div>
                </div>

                {/* Right Column - Social Media */}
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold text-gray-900 mb-4 block">Social Media Handles</Label>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700 mb-2 block">LinkedIn</Label>
                        <InputWithError
                          id="linkedin"
                          placeholder="linkedin.com/company/yourcompany"
                          value={profileData.socialMediaHandles?.linkedin || ''}
                          onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="twitter" className="text-sm font-medium text-gray-700 mb-2 block">Twitter</Label>
                        <InputWithError
                          id="twitter"
                          placeholder="twitter.com/yourcompany"
                          value={profileData.socialMediaHandles?.twitter || ''}
                          onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="facebook" className="text-sm font-medium text-gray-700 mb-2 block">Facebook</Label>
                        <InputWithError
                          id="facebook"
                          placeholder="facebook.com/yourcompany"
                          value={profileData.socialMediaHandles?.facebook || ''}
                          onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagram" className="text-sm font-medium text-gray-700 mb-2 block">Instagram</Label>
                        <InputWithError
                          id="instagram"
                          placeholder="instagram.com/yourcompany"
                          value={profileData.socialMediaHandles?.instagram || ''}
                          onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 text-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Save Company Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
