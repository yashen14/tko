import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  Pen, 
  Trash2, 
  Save,
  AlertCircle,
  CheckCircle 
} from "lucide-react";
import { FullScreenSignaturePad } from "@/components/FullScreenSignaturePad";
import { useAuth } from "@/contexts/AuthContext";

export function StaffSignatureProfile() {
  const { user } = useAuth();
  const [cachedSignature, setCachedSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load cached signature on component mount
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`staff-signature-${user.id}`);
      if (saved) {
        setCachedSignature(saved);
      }
    }
  }, [user?.id]);

  const handleSaveSignature = async (signatureData: string) => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`staff-signature-${user.id}`, signatureData);
      setCachedSignature(signatureData);
      
      // Optionally save to server profile
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          await fetch("/api/staff/signature", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ signature: signatureData }),
          });
        } catch (serverError) {
          console.warn("Failed to save signature to server:", serverError);
          // Continue with local storage save even if server fails
        }
      }
      
      setMessage({ type: 'success', text: 'Signature saved successfully!' });
      setShowSignaturePad(false);
    } catch (error) {
      console.error("Failed to save signature:", error);
      setMessage({ type: 'error', text: 'Failed to save signature' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSignature = () => {
    if (!user?.id) return;
    
    localStorage.removeItem(`staff-signature-${user.id}`);
    setCachedSignature(null);
    setMessage({ type: 'success', text: 'Signature deleted successfully!' });
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          My Signature Profile
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Manage your cached signature for quick form signing
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-2">
          {cachedSignature ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Signature cached</span>
              <Badge variant="default">Active</Badge>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-sm">No signature cached</span>
              <Badge variant="secondary">Not Set</Badge>
            </>
          )}
        </div>

        {/* Message */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Current Signature Display */}
        {cachedSignature && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                <img 
                  src={cachedSignature} 
                  alt="Your cached signature" 
                  className="max-h-24 object-contain"
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Signed by: {user?.name}<br />
                This signature will be automatically used in forms when available.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowSignaturePad(true)}
            disabled={saving}
            className="flex-1"
          >
            <Pen className="h-4 w-4 mr-2" />
            {cachedSignature ? 'Update Signature' : 'Create Signature'}
          </Button>
          
          {cachedSignature && (
            <Button 
              variant="outline" 
              onClick={handleDeleteSignature}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        {/* Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your cached signature will be automatically suggested when signing forms, 
            but you can always create a new signature if needed.
          </AlertDescription>
        </Alert>

        {/* Signature Pad Modal */}
        {showSignaturePad && (
          <FullScreenSignaturePad
            isOpen={showSignaturePad}
            onClose={() => setShowSignaturePad(false)}
            onSignatureConfirm={handleSaveSignature}
            title="Create Your Signature"
            subtitle="This signature will be saved for future use in forms"
          />
        )}
      </CardContent>
    </Card>
  );
}

// Hook to get cached staff signature
export function useCachedStaffSignature() {
  const { user } = useAuth();
  const [cachedSignature, setCachedSignature] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`staff-signature-${user.id}`);
      setCachedSignature(saved);
    }
  }, [user?.id]);

  return cachedSignature;
}
