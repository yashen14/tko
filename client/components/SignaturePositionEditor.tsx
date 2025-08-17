import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit3, Save, X, RotateCcw } from "lucide-react";

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
}

interface DualSignaturePositions {
  client: SignaturePosition;
  staff: SignaturePosition;
}

interface SignaturePositionEditorProps {
  formType: string;
  formName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (positions: DualSignaturePositions) => void;
  initialPositions: DualSignaturePositions;
}

export function SignaturePositionEditor({
  formType,
  formName,
  isOpen,
  onClose,
  onSave,
  initialPositions,
}: SignaturePositionEditorProps) {
  const [positions, setPositions] = useState<DualSignaturePositions>(initialPositions);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePosition = (
    type: 'client' | 'staff',
    field: keyof SignaturePosition,
    value: number
  ) => {
    setPositions(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(positions);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setPositions(initialPositions);
    setHasChanges(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    setPositions(initialPositions);
    setHasChanges(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Edit3 className="h-6 w-6 mr-3 text-blue-600" />
              Signature Position Editor
              <Badge variant="outline" className="ml-3">
                {formName}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Instructions</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• X and Y coordinates are measured from the top-left corner of the page</li>
                <li>• Width and height define the signature area size</li>
                <li>• Opacity controls transparency (0.1 = very transparent, 1.0 = opaque)</li>
                <li>• Typical PDF page size is 595 x 842 points (A4)</li>
              </ul>
            </div>

            {/* Current Form Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Form Type</Label>
                <p className="text-sm text-gray-600">{formType}</p>
              </div>
              <div>
                <Label className="font-medium">Form Name</Label>
                <p className="text-sm text-gray-600">{formName}</p>
              </div>
            </div>

            <Separator />

            {/* Client Signature Position */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                Client Signature Position
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="client-x">X Position</Label>
                  <Input
                    id="client-x"
                    type="number"
                    value={positions.client.x}
                    onChange={(e) => updatePosition('client', 'x', parseFloat(e.target.value) || 0)}
                    placeholder="X coordinate"
                  />
                </div>
                <div>
                  <Label htmlFor="client-y">Y Position</Label>
                  <Input
                    id="client-y"
                    type="number"
                    value={positions.client.y}
                    onChange={(e) => updatePosition('client', 'y', parseFloat(e.target.value) || 0)}
                    placeholder="Y coordinate"
                  />
                </div>
                <div>
                  <Label htmlFor="client-width">Width</Label>
                  <Input
                    id="client-width"
                    type="number"
                    value={positions.client.width}
                    onChange={(e) => updatePosition('client', 'width', parseFloat(e.target.value) || 0)}
                    placeholder="Width"
                  />
                </div>
                <div>
                  <Label htmlFor="client-height">Height</Label>
                  <Input
                    id="client-height"
                    type="number"
                    value={positions.client.height}
                    onChange={(e) => updatePosition('client', 'height', parseFloat(e.target.value) || 0)}
                    placeholder="Height"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client-opacity">Opacity</Label>
                  <Input
                    id="client-opacity"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1.0"
                    value={positions.client.opacity || 0.7}
                    onChange={(e) => updatePosition('client', 'opacity', parseFloat(e.target.value) || 0.7)}
                    placeholder="0.7"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    Preview: Box at ({positions.client.x}, {positions.client.y}) 
                    - {positions.client.width}×{positions.client.height}px
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Staff Signature Position */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                Staff Signature Position
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="staff-x">X Position</Label>
                  <Input
                    id="staff-x"
                    type="number"
                    value={positions.staff.x}
                    onChange={(e) => updatePosition('staff', 'x', parseFloat(e.target.value) || 0)}
                    placeholder="X coordinate"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-y">Y Position</Label>
                  <Input
                    id="staff-y"
                    type="number"
                    value={positions.staff.y}
                    onChange={(e) => updatePosition('staff', 'y', parseFloat(e.target.value) || 0)}
                    placeholder="Y coordinate"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-width">Width</Label>
                  <Input
                    id="staff-width"
                    type="number"
                    value={positions.staff.width}
                    onChange={(e) => updatePosition('staff', 'width', parseFloat(e.target.value) || 0)}
                    placeholder="Width"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-height">Height</Label>
                  <Input
                    id="staff-height"
                    type="number"
                    value={positions.staff.height}
                    onChange={(e) => updatePosition('staff', 'height', parseFloat(e.target.value) || 0)}
                    placeholder="Height"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staff-opacity">Opacity</Label>
                  <Input
                    id="staff-opacity"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1.0"
                    value={positions.staff.opacity || 0.7}
                    onChange={(e) => updatePosition('staff', 'opacity', parseFloat(e.target.value) || 0.7)}
                    placeholder="0.7"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    Preview: Box at ({positions.staff.x}, {positions.staff.y}) 
                    - {positions.staff.width}×{positions.staff.height}px
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Visual Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Visual Preview</h3>
              <div className="border border-gray-300 bg-white relative" style={{ width: '595px', height: '400px', maxWidth: '100%' }}>
                <div className="text-xs text-gray-500 absolute top-1 left-1">PDF Preview (scaled)</div>
                
                {/* Client signature preview */}
                <div
                  className="absolute border-2 border-green-500 bg-green-100 flex items-center justify-center text-xs font-medium text-green-700"
                  style={{
                    left: `${(positions.client.x / 595) * 100}%`,
                    top: `${(positions.client.y / 842) * 100}%`,
                    width: `${(positions.client.width / 595) * 100}%`,
                    height: `${(positions.client.height / 842) * 100}%`,
                    opacity: positions.client.opacity || 0.7
                  }}
                >
                  Client
                </div>

                {/* Staff signature preview */}
                <div
                  className="absolute border-2 border-blue-500 bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700"
                  style={{
                    left: `${(positions.staff.x / 595) * 100}%`,
                    top: `${(positions.staff.y / 842) * 100}%`,
                    width: `${(positions.staff.width / 595) * 100}%`,
                    height: `${(positions.staff.height / 842) * 100}%`,
                    opacity: positions.staff.opacity || 0.7
                  }}
                >
                  Staff
                </div>
              </div>
              <div className="text-xs text-gray-500">
                * This is a scaled preview. Actual PDF page size is 595×842 points.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
                className="flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Original
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Positions
                </Button>
              </div>
            </div>

            {hasChanges && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700 font-medium">
                  ⚠️ You have unsaved changes
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
