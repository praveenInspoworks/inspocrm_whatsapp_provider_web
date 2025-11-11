import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  Key, 
  CheckCircle, 
  XCircle, 
  Download,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorAuthProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function TwoFactorAuth({ isEnabled, onToggle }: TwoFactorAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"setup" | "verify" | "enabled">(isEnabled ? "enabled" : "setup");
  const { toast } = useToast();

  // Mock data - in real app, this would come from API
  const mockSecret = "JBSWY3DPEHPK3PXP";
  const mockQrCode = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJibGFjayIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlFSIENvZGUgUGxhY2Vob2xkZXI8L3RleHQ+Cjwvc3ZnPgo=";

  const handleSetup = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Simulate API call to generate 2FA secret
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep("verify");
      toast({
        title: "2FA Setup Initiated",
        description: "Please scan the QR code and enter the verification code.",
      });
    } catch (error) {
      setError("Failed to setup 2FA. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      // Simulate API call to verify code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock verification - in real app, this would validate against the secret
      if (verificationCode === "123456") {
        setStep("enabled");
        onToggle(true);
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been successfully enabled.",
        });
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      setError("Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Simulate API call to disable 2FA
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep("setup");
      onToggle(false);
      setVerificationCode("");
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    } catch (error) {
      setError("Failed to disable 2FA. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(mockSecret);
    toast({
      title: "Secret Copied",
      description: "The secret key has been copied to clipboard.",
    });
  };

  const downloadBackupCodes = () => {
    const backupCodes = [
      "12345678",
      "87654321", 
      "11223344",
      "44332211",
      "55667788",
      "88776655",
      "99887766",
      "66778899"
    ];
    
    const content = `INSPOCRM Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inspocrm-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Backup Codes Downloaded",
      description: "Backup codes have been saved to your device.",
    });
  };

  if (step === "enabled") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Two-Factor Authentication
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is currently enabled. You'll need to enter a verification code when signing in.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Backup Codes</p>
                <p className="text-sm text-muted-foreground">Download backup codes for emergency access</p>
              </div>
              <Button variant="outline" onClick={downloadBackupCodes}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Disable 2FA</p>
                <p className="text-sm text-muted-foreground">Remove two-factor authentication from your account</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDisable}
                disabled={isLoading}
              >
                {isLoading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
          <Badge variant="outline">Disabled</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "setup" && (
          <>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Enhanced Security</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account by requiring a verification code in addition to your password.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <QrCode className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">QR Code Setup</p>
                  <p className="text-sm text-muted-foreground">
                    Scan a QR code with your authenticator app (Google Authenticator, Authy, etc.) to set up 2FA.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSetup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Setting up..." : "Enable Two-Factor Authentication"}
            </Button>
          </>
        )}

        {step === "verify" && (
          <>
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-medium mb-2">Step 1: Scan QR Code</p>
                <div className="inline-block p-4 border rounded-lg bg-white">
                  <img 
                    src={mockQrCode} 
                    alt="QR Code" 
                    className="w-32 h-32"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Use your authenticator app to scan this QR code
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="font-medium mb-2">Step 2: Manual Setup (Alternative)</p>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={showSecret ? mockSecret : "••••••••••••••••"}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copySecret}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter this key manually in your authenticator app if QR code doesn't work
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="font-medium mb-2">Step 3: Verify Setup</p>
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("setup")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                <strong>Demo:</strong> Use code <code className="bg-muted px-1 rounded">123456</code> to enable 2FA
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
