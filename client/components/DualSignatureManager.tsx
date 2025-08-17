import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Circle,
  Users,
  User,
  UserCheck,
  Send,
  AlertCircle,
  Edit3,
  Settings
} from "lucide-react";
import { FullScreenSignaturePad } from "@/components/FullScreenSignaturePad";
import { SignaturePad } from "@/components/SignaturePad";
import { SignaturePositionEditor } from "./SignaturePositionEditor";
import { DualSignature, SignatureStatus, SignatureData } from "@shared/types";
import { useAuth } from "@/contexts/AuthContext";
import { useCachedStaffSignature } from "./StaffSignatureProfile";

interface DualSignatureManagerProps {
  jobId: string;
  formId: string;
  formName: string;
  formType: string;
  signatures?: DualSignature;
  onSignatureComplete: (signatures: DualSignature) => void;
  onSubmit: () => void;
  clientName?: string;
  disabled?: boolean;
}

export function DualSignatureManager({
  jobId,
  formId,
  formName,
  formType,
  signatures = {},
  onSignatureComplete,
  onSubmit,
  clientName,
  disabled = false
}: DualSignatureManagerProps) {
  const { user } = useAuth();
  const cachedStaffSignature = useCachedStaffSignature();
  const [currentTab, setCurrentTab] = useState<"client" | "staff">("client");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<"client" | "staff">("client");
  const [localSignatures, setLocalSignatures] = useState<DualSignature>(signatures);
  const [showPositionEditor, setShowPositionEditor] = useState(false);
  const [signaturePositions, setSignaturePositions] = useState({
    client: { x: 411, y: 788, width: 180, height: 50, opacity: 0.7 },
    staff: { x: 4, y: 788, width: 180, height: 50, opacity: 0.7 }
  });

  // Check if this form requires dual signatures
  const requiresDualSignatures = ["liability-form", "discovery-form", "clearance-certificate-form"].includes(formType);

  // Calculate signature status
  const signatureStatus: SignatureStatus = {
    clientRequired: requiresDualSignatures,
    staffRequired: false, // Staff signature is now optional
    clientSigned: !!localSignatures.client?.data,
    staffSigned: !!localSignatures.staff?.data,
    isComplete: requiresDualSignatures
      ? !!localSignatures.client?.data // Only client signature required for completion
      : true
  };

  // Update local signatures when props change
  useEffect(() => {
    setLocalSignatures(signatures);
  }, [signatures]);

  // Initialize signature positions based on form type
  useEffect(() => {
    const defaultPositions = {
      "liability-form": {
        client: { x: 411, y: 788, width: 180, height: 50, opacity: 0.7 },
        staff: { x: 4, y: 788, width: 180, height: 50, opacity: 0.7 }
      },
      "clearance-certificate-form": {
        client: { x: 87, y: 575, width: 180, height: 50, opacity: 0.7 },
        staff: { x: 87, y: 631, width: 180, height: 50, opacity: 0.7 }
      },
      "discovery-form": {
        client: { x: 120, y: 163, width: 180, height: 50, opacity: 0.7 },
        staff: { x: 120, y: 110, width: 180, height: 50, opacity: 0.7 }
      }
    };

    setSignaturePositions(defaultPositions[formType] || defaultPositions["liability-form"]);
  }, [formType]);

  // Auto-advance to staff tab after client signs
  useEffect(() => {
    if (signatureStatus.clientSigned && !signatureStatus.staffSigned && requiresDualSignatures) {
      setCurrentTab("staff");
    }
  }, [signatureStatus.clientSigned, signatureStatus.staffSigned, requiresDualSignatures]);

  const handleSignature = (signatureData: string, type: "client" | "staff") => {
    const newSignatureData: SignatureData = {
      data: signatureData,
      timestamp: new Date().toISOString(),
      signer: type === "client" ? (clientName || "Client") : user?.name || "Staff",
      type
    };

    const updatedSignatures = {
      ...localSignatures,
      [type]: newSignatureData
    };

    setLocalSignatures(updatedSignatures);
    onSignatureComplete(updatedSignatures);
    setShowSignaturePad(false);

    // Auto-advance to staff tab after client signs
    if (type === "client" && requiresDualSignatures) {
      setCurrentTab("staff");
    }
  };

  const openSignaturePad = (type: "client" | "staff") => {
    setSignatureType(type);
    setShowSignaturePad(true);
  };

  const clearSignature = (type: "client" | "staff") => {
    const updatedSignatures = {
      ...localSignatures,
      [type]: undefined
    };
    setLocalSignatures(updatedSignatures);
    onSignatureComplete(updatedSignatures);
  };

  const useCachedSignature = () => {
    if (cachedStaffSignature && user) {
      const newSignatureData: SignatureData = {
        data: cachedStaffSignature,
        timestamp: new Date().toISOString(),
        signer: user.name || "Staff",
        type: "staff"
      };

      const updatedSignatures = {
        ...localSignatures,
        staff: newSignatureData
      };

      setLocalSignatures(updatedSignatures);
      onSignatureComplete(updatedSignatures);
    }
  };

  const handleSavePositions = async (newPositions: any) => {
    setSignaturePositions(newPositions);

    // Save to server (optional - you can implement this endpoint)
    try {
      const response = await fetch('/api/signature-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'mock-token-admin-1'}`
        },
        body: JSON.stringify({
          formType,
          positions: newPositions
        })
      });

      if (response.ok) {
        console.log('Signature positions saved successfully');
      } else {
        console.error('Failed to save signature positions');
      }
    } catch (error) {
      console.error('Error saving signature positions:', error);
    }
  };

  if (!requiresDualSignatures) {
    return null; // Don't show dual signature manager for forms that don't require it
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dual Signature Required
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPositionEditor(true)}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
            disabled={disabled}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Positions
          </Button>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Both client and staff signatures are required for {formName}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Signature Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            {signatureStatus.clientSigned ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm">Client Signature</span>
            <Badge variant={signatureStatus.clientSigned ? "default" : "secondary"}>
              {signatureStatus.clientSigned ? "Signed" : "Pending"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {signatureStatus.staffSigned ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm">Staff Signature</span>
            <Badge variant={signatureStatus.staffSigned ? "default" : "outline"}>
              {signatureStatus.staffSigned ? "Signed" : "Optional"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {signatureStatus.isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            <span className="text-sm">Ready to Submit</span>
            <Badge variant={signatureStatus.isComplete ? "default" : "secondary"}>
              {signatureStatus.isComplete ? "Ready" : "Incomplete"}
            </Badge>
          </div>
        </div>

        {/* Signature Tabs */}
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "client" | "staff")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client" disabled={disabled}>
              <User className="h-4 w-4 mr-2" />
              Client Signature
              {signatureStatus.clientSigned && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="staff" disabled={disabled || !signatureStatus.clientSigned}>
              <UserCheck className="h-4 w-4 mr-2" />
              Staff Signature (Optional)
              {!signatureStatus.clientSigned && <span className="text-xs text-gray-500 ml-1">(Client must sign first)</span>}
              {signatureStatus.staffSigned && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Signature</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Client must sign to acknowledge the form details and terms.
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {localSignatures.client ? (
                  <div className="space-y-4">
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Client signature captured
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Signed by: {localSignatures.client.signer}<br />
                      Time: {new Date(localSignatures.client.timestamp).toLocaleString()}
                    </div>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={localSignatures.client.data} 
                        alt="Client signature" 
                        className="max-h-20 object-contain"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => clearSignature("client")}
                      disabled={disabled}
                    >
                      Clear Signature
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Client signature is required before proceeding to staff signature.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={() => openSignaturePad("client")}
                      disabled={disabled}
                      className="w-full"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Capture Client Signature
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Staff Signature (Optional)</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Staff member can optionally sign to verify and approve the form submission.
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {localSignatures.staff ? (
                  <div className="space-y-4">
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Staff signature captured
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Signed by: {localSignatures.staff.signer}<br />
                      Time: {new Date(localSignatures.staff.timestamp).toLocaleString()}
                    </div>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={localSignatures.staff.data} 
                        alt="Staff signature" 
                        className="max-h-20 object-contain"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => clearSignature("staff")}
                      disabled={disabled}
                    >
                      Clear Signature
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Staff signature is optional but recommended for verification.
                      </AlertDescription>
                    </Alert>

                    {/* Cached Signature Option */}
                    {cachedStaffSignature && (
                      <div className="space-y-2">
                        <div className="p-3 border rounded-lg bg-blue-50">
                          <div className="text-sm font-medium mb-2">Use Cached Signature</div>
                          <div className="border rounded p-2 bg-white mb-3 flex justify-center">
                            <img
                              src={cachedStaffSignature}
                              alt="Cached signature"
                              className="max-h-12 object-contain"
                            />
                          </div>
                          <Button
                            onClick={useCachedSignature}
                            disabled={disabled}
                            className="w-full"
                            size="sm"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Use My Cached Signature
                          </Button>
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                          or
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => openSignaturePad("staff")}
                      disabled={disabled}
                      className="w-full"
                      variant="outline"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Create New Signature
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        {signatureStatus.isComplete && (
          <div className="pt-4 border-t space-y-3">
            {signatureStatus.clientSigned && !signatureStatus.staffSigned && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  ✓ Client signature captured! You can submit now or add an optional staff signature.
                </p>
              </div>
            )}
            {signatureStatus.clientSigned && signatureStatus.staffSigned && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Both signatures captured! Ready to submit.
                </p>
              </div>
            )}
            <Button
              onClick={onSubmit}
              disabled={disabled || !signatureStatus.isComplete}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Form {signatureStatus.staffSigned ? "with Dual Signatures" : "with Client Signature"}
            </Button>
          </div>
        )}

        {/* Signature Pad Modal */}
        {showSignaturePad && (
          <FullScreenSignaturePad
            isOpen={showSignaturePad}
            onClose={() => setShowSignaturePad(false)}
            onSignatureConfirm={(signature) => handleSignature(signature, signatureType)}
            title={`${signatureType === "client" ? "Client" : "Staff"} Signature`}
            subtitle={`Please sign to ${signatureType === "client" ? "acknowledge" : "approve"} this ${formName}`}
          />
        )}

        {/* Signature Position Editor */}
        <SignaturePositionEditor
          formType={formType}
          formName={formName}
          isOpen={showPositionEditor}
          onClose={() => setShowPositionEditor(false)}
          onSave={handleSavePositions}
          initialPositions={signaturePositions}
        />
      </CardContent>
    </Card>
  );
}
