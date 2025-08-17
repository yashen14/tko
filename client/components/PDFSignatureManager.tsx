import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Edit,
  Save,
  X,
  Move,
  Grid3X3,
  MousePointer,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker with multiple fallbacks
try {
  // Try local worker first
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
} catch (error) {
  try {
    // Fallback to jsdelivr CDN
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/build/pdf.worker.min.js';
  } catch (cdnError) {
    console.warn('Could not configure PDF.js worker, PDF loading may fail');
  }
}

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface DualSignaturePositions {
  client: SignaturePosition;
  staff: SignaturePosition;
}

interface PDFSignatureManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  formType: string;
  currentSignaturePosition?: SignaturePosition;
  currentDualPositions?: DualSignaturePositions;
  onSavePosition?: (position: SignaturePosition) => void;
  onSaveDualPositions?: (positions: DualSignaturePositions) => void;
  formData?: any;
  isDualSignature?: boolean;
  signatureType?: 'client' | 'staff';
}

export function PDFSignatureManager({
  open,
  onOpenChange,
  pdfUrl,
  formType,
  currentSignaturePosition,
  currentDualPositions,
  onSavePosition,
  onSaveDualPositions,
  formData,
  isDualSignature = false,
  signatureType = 'client'
}: PDFSignatureManagerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition>(
    currentSignaturePosition || { x: 100, y: 100, width: 200, height: 60, page: 1 }
  );
  const [dualPositions, setDualPositions] = useState<DualSignaturePositions>(
    currentDualPositions || {
      staff: { x: 100, y: 100, width: 180, height: 50, page: 1 },
      client: { x: 100, y: 160, width: 180, height: 50, page: 1 }
    }
  );
  const [activeSignature, setActiveSignature] = useState<'staff' | 'client'>(signatureType);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.0); // Set to 100% scale
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);

  // Dummy signature for testing
  const dummySignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAA8CAYAAAAjW/WRAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpSIVh3YQcchQnSyIijhqFYpQIdQKrTqYXPoFTRqSFBdHwbXg4Mdi1cHFWVcHV0EQ/ABxc3NSdJES/5cUWsR4cNyPd/ced+8AoV5mmtU2Dmia1TSxYjGbyVajPq8wghDCCGJQZpYxJ0lJ6Hlfnng8eRfhWf7u/hx9as5igE8knmWGaZNvEE9v2gbnfeIwK8oq8TnxmEkXJH7kuuryG+eCwwLPDJvp1DxxmFgsdLDSwaxo6sRTxBFV0ylfyLis8r7EWStVWOOe/IWhnLa8xHWaQ4hhEUuQIEJBFSWUYSFKq0aKiRTtxzz8Q44/SS6ZXCUwciygAg2y4wf/g9/dWvnJCTcpFAW6X2z7YxSo3wUaNdv+Prbt+gnkfwJXWstfqQMzn6TX2lr4COjdBi6u25q8B1zuAP1PumRIjhSkKeRyObyf0TcygL5boGfN7a25j9MHoE2zSt0AB4fAaIGy1z3e3dXe279nWv39APBscsHD9AqQAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QgCECsrL0jvPwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJcEhZcwAACxMAAAsTAQCanBgAAAYnSURBVHic7Zu9axRBGMafzZH9";

  // Update active signature when signatureType prop changes
  useEffect(() => {
    setActiveSignature(signatureType);
  }, [signatureType]);

  useEffect(() => {
    if (open && pdfUrl) {
      loadPDF();
      loadCurrentSignaturePosition();
    }
  }, [open, pdfUrl]);

  const loadCurrentSignaturePosition = () => {
    // Try to get saved position for this form type
    const formTypeMapping: Record<string, string> = {
      "ABSACertificate.pdf": "absa-form",
      "BBPClearanceCertificate.pdf": "clearance-certificate-form",
      "sahlld.pdf": "sahl-certificate-form",
      "DiscoveryCS.pdf": "discovery-form",
      "liabWave.pdf": "liability-form",
      "Noncompliance.pdf": "noncompliance-form",
      "ML.pdf": "material-list-form"
    };

    const pdfFilename = pdfUrl.split('/').pop() || '';
    const formTypeKey = formTypeMapping[pdfFilename];

    if (formTypeKey && !currentSignaturePosition) {
      // Set default position based on form type (these match our server config)
      const defaultPositions: Record<string, SignaturePosition> = {
        "absa-form": { x: 400, y: 100, width: 200, height: 60, page: 1 },
        "clearance-certificate-form": { x: 350, y: 650, width: 200, height: 60, page: 1 },
        "sahl-certificate-form": { x: 400, y: 120, width: 200, height: 60, page: 1 },
        "discovery-form": { x: 380, y: 110, width: 200, height: 60, page: 1 },
        "liability-form": { x: 360, y: 580, width: 200, height: 60, page: 1 },
        "noncompliance-form": { x: 300, y: 700, width: 200, height: 60, page: 1 },
        "material-list-form": { x: 320, y: 750, width: 200, height: 60, page: 1 }
      };

      const defaultPos = defaultPositions[formTypeKey];
      if (defaultPos) {
        setSignaturePosition(defaultPos);
      }
    }
  };

  const loadPDF = async () => {
    console.log("Loading PDF:", pdfUrl);
    setPdfLoadError(null); // Clear any previous errors

    try {
      // Check if PDF.js worker is available
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        throw new Error("PDF.js worker not configured");
      }

      // Load the actual PDF using PDF.js with timeout
      const loadingTask = pdfjs.getDocument({
        url: pdfUrl,
        useSystemFonts: true,
        disableFontFace: false,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.54/cmaps/',
        cMapPacked: true
      });

      // Add timeout to PDF loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF loading timeout')), 10000)
      );

      const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);

      // Get the first page
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });

      const pdfDocInfo = {
        pdf,
        page,
        viewport,
        numPages: pdf.numPages,
        width: viewport.width,
        height: viewport.height
      };

      setPdfDoc(pdfDocInfo);
      console.log("PDF loaded successfully");

      // Draw PDF page on canvas
      drawPDFOnCanvas(pdfDocInfo);

    } catch (error) {
      const errorMessage = error.message || "Unknown error";
      console.warn("PDF loading failed, using fallback:", errorMessage);
      setPdfLoadError(errorMessage);

      // Create a mock PDF with realistic dimensions
      const mockDoc = {
        numPages: 1,
        width: 595,  // A4 width at 72 DPI
        height: 842, // A4 height at 72 DPI
        isMock: true,
        errorMessage
      };

      setPdfDoc(mockDoc);
      drawPDFOnCanvas(mockDoc);
    }
  };

  const drawPDFOnCanvas = async (doc: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size at actual scale
    canvas.width = doc.width * scale;
    canvas.height = doc.height * scale;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (doc.page && doc.viewport && !doc.isMock) {
      // Draw the actual PDF page
      const viewport = doc.page.getViewport({ scale: scale });

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      try {
        await doc.page.render(renderContext).promise;
        console.log("PDF rendered successfully");
      } catch (renderError) {
        console.error("Error rendering PDF:", renderError);
        // Fall back to mock content
        drawPDFContent(ctx, doc);
      }
    } else {
      // Draw mock PDF content if real PDF failed to load
      drawPDFContent(ctx, doc);
    }

    // Draw form data overlay if available
    if (formData) {
      drawFormDataOverlay(ctx, doc);
    }

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Draw signature position
    drawSignaturePosition(ctx);
  };

  const drawPDFContent = (ctx: CanvasRenderingContext2D, doc: any) => {
    // This is only used as fallback when real PDF fails to load
    const width = doc.width * scale;
    const height = doc.height * scale;

    // Draw white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(10 * scale, 10 * scale, width - 20 * scale, height - 20 * scale);

    // Draw header with warning
    ctx.fillStyle = "#d32f2f";
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillText(`⚠ ${formType} - PDF Preview Mode`, 30 * scale, 50 * scale);

    ctx.fillStyle = "#666";
    ctx.font = `${11 * scale}px Arial`;
    if (doc.errorMessage) {
      ctx.fillText(`Error: ${doc.errorMessage}`, 30 * scale, 75 * scale);
    }
    ctx.fillText("Showing form template structure - signature position editing available", 30 * scale, 95 * scale);

    // Draw realistic form structure
    const fieldY = 130 * scale;
    const fieldHeight = 25 * scale;
    const fieldSpacing = 35 * scale;

    const formFields = [
      { label: "CSA Reference:", value: formData?.["field-csa-ref"] || "" },
      { label: "Full Name of Insured:", value: formData?.["field-full-name"] || "" },
      { label: "Claim Number:", value: formData?.["field-claim-number"] || "" },
      { label: "Property Address:", value: formData?.["field-property-address"] || "" },
      { label: "Cause of Damage:", value: formData?.["field-cause-damage"] || "" },
      { label: "Assessment Date:", value: formData?.assessmentDate || "" },
      { label: "Material Cost:", value: formData?.materialCost || "" },
      { label: "Labour Cost:", value: formData?.labourCost || "" },
      { label: "Total Estimate:", value: formData?.totalEstimate || "" }
    ];

    formFields.forEach((field, i) => {
      const y = fieldY + i * fieldSpacing;

      // Field label
      ctx.fillStyle = "#333";
      ctx.font = `${11 * scale}px Arial`;
      ctx.fillText(field.label, 30 * scale, y - 5 * scale);

      // Field box
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      ctx.strokeRect(30 * scale, y, 300 * scale, fieldHeight);

      // Fill with actual data if available
      if (field.value) {
        ctx.fillStyle = "#1976d2";
        ctx.font = `${10 * scale}px Arial`;
        const displayValue = String(field.value).substring(0, 40);
        ctx.fillText(displayValue, 35 * scale, y + 16 * scale);
      }
    });

    // Draw signature area
    const sigY = fieldY + formFields.length * fieldSpacing + 30 * scale;
    ctx.fillStyle = "#333";
    ctx.font = `bold ${12 * scale}px Arial`;
    ctx.fillText("Signature Section:", 30 * scale, sigY);

    ctx.strokeStyle = "#1976d2";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(30 * scale, sigY + 10 * scale, 200 * scale, 40 * scale);
    ctx.setLineDash([]);

    ctx.fillStyle = "#1976d2";
    ctx.font = `${10 * scale}px Arial`;
    ctx.fillText("Click 'Edit Position' to position signature area", 35 * scale, sigY + 30 * scale);
  };

  const drawFormDataOverlay = (ctx: CanvasRenderingContext2D, doc: any) => {
    if (!formData) return;

    // Draw form data as overlay boxes on the actual PDF
    const overlayStyle = {
      backgroundColor: 'rgba(255, 255, 0, 0.3)', // Yellow highlight
      borderColor: '#FF6B35',
      textColor: '#000'
    };

    ctx.globalAlpha = 0.8;

    // Field positions (these would be customized per PDF type)
    const fieldPositions = [
      { x: 150, y: 150, width: 200, height: 20, dataKey: "field-csa-ref", label: "CSA Ref" },
      { x: 150, y: 180, width: 200, height: 20, dataKey: "field-full-name", label: "Full Name" },
      { x: 150, y: 210, width: 200, height: 20, dataKey: "field-claim-number", label: "Claim No" },
      { x: 150, y: 240, width: 300, height: 20, dataKey: "field-property-address", label: "Property Address" },
      { x: 150, y: 270, width: 200, height: 20, dataKey: "field-cause-damage", label: "Cause of Damage" },
    ];

    fieldPositions.forEach(position => {
      if (formData[position.dataKey]) {
        const x = position.x * scale;
        const y = position.y * scale;
        const width = position.width * scale;
        const height = position.height * scale;

        // Draw highlight box
        ctx.fillStyle = overlayStyle.backgroundColor;
        ctx.fillRect(x, y, width, height);

        // Draw border
        ctx.strokeStyle = overlayStyle.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Draw text
        ctx.fillStyle = overlayStyle.textColor;
        ctx.font = `${12 * scale}px Arial`;
        const value = String(formData[position.dataKey]).substring(0, 30);
        ctx.fillText(value, x + 5 * scale, y + 15 * scale);

        // Draw label
        ctx.fillStyle = overlayStyle.borderColor;
        ctx.font = `bold ${10 * scale}px Arial`;
        ctx.fillText(position.label, x, y - 5 * scale);
      }
    });

    ctx.globalAlpha = 1.0;
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(0, 0, 255, 0.3)";
    ctx.lineWidth = 0.5;
    
    // Draw grid lines every 50 pixels
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw coordinate numbers
    ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
    ctx.font = "10px Arial";
    for (let x = 0; x <= width; x += 100) {
      for (let y = 0; y <= height; y += 100) {
        if (x > 0 && y > 0) {
          ctx.fillText(`${x},${y}`, x + 2, y - 2);
        }
      }
    }
  };

  const drawSignaturePosition = (ctx: CanvasRenderingContext2D) => {
    const currentPos = getCurrentPosition();
    const { x, y, width, height } = currentPos;

    // Draw signature background (semi-transparent)
    ctx.fillStyle = editMode ? "rgba(255, 107, 107, 0.2)" : "rgba(78, 205, 196, 0.2)";
    ctx.fillRect(x, y, width, height);

    // Draw signature box border
    ctx.strokeStyle = editMode ? "#ff6b6b" : "#4ecdc4";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    // Draw see-through signature preview
    ctx.globalAlpha = 0.7; // Make signature see-through
    ctx.fillStyle = "rgba(0, 0, 139, 0.8)"; // Dark blue, semi-transparent
    ctx.font = "italic 16px cursive";
    ctx.fillText("Signature Preview", x + 10, y + height - 15);

    // Add transparency indicator
    ctx.font = "10px Arial";
    ctx.fillStyle = "rgba(0, 0, 139, 0.6)";
    ctx.fillText("(70% opacity)", x + 10, y + height - 5);
    ctx.globalAlpha = 1.0; // Reset opacity

    // Draw resize handles if in edit mode
    if (editMode) {
      const handleSize = 8;
      ctx.fillStyle = "#ff6b6b";
      // Corner handles
      ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    }

    // Draw coordinates label with live update indicator
    ctx.fillStyle = isLiveUpdating ? "#4CAF50" : "#333";
    ctx.font = "bold 12px Arial";
    const coordText = `Position: X:${x}, Y:${y}, Size: ${width}×${height}`;
    const liveText = isLiveUpdating ? " [UPDATING...]" : "";
    ctx.fillText(coordText + liveText, x, y - 10);

    // Add live update pulse effect
    if (isLiveUpdating) {
      ctx.shadowColor = "#4CAF50";
      ctx.shadowBlur = 5;
      ctx.fillText(coordText + liveText, x, y - 10);
      ctx.shadowBlur = 0;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x, y, width, height } = getCurrentPosition();

    // Check if clicking inside signature area
    if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
      setIsDragging(true);
      setDragOffset({
        x: mouseX - x,
        y: mouseY - y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !editMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;

    const currentPos = getCurrentPosition();
    updateCurrentPosition({
      x: Math.max(0, Math.min(newX, canvas.width - currentPos.width)),
      y: Math.max(0, Math.min(newY, canvas.height - currentPos.height))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (pdfDoc) {
      setIsLiveUpdating(true);
      drawPDFOnCanvas(pdfDoc).catch(console.error).finally(() => {
        // Small delay to show the live update indicator
        setTimeout(() => setIsLiveUpdating(false), 100);
      });
    }
  }, [signaturePosition, showGrid, editMode, scale, formData]);

  // Helper functions to handle position updates correctly
  const getCurrentPosition = () => {
    if (isDualSignature) {
      return dualPositions[activeSignature];
    }
    return signaturePosition;
  };

  const updateCurrentPosition = (updates: Partial<SignaturePosition>) => {
    if (isDualSignature) {
      setDualPositions(prev => ({
        ...prev,
        [activeSignature]: {
          ...prev[activeSignature],
          ...updates
        }
      }));
    } else {
      setSignaturePosition(prev => ({
        ...prev,
        ...updates
      }));
    }
  };

  const handleSave = () => {
    if (isDualSignature) {
      // For dual signature forms, use the position of the active signature
      const currentPosition = dualPositions[activeSignature];
      if (onSavePosition && currentPosition) {
        onSavePosition(currentPosition);
      }
    } else {
      // For single signature forms, use the regular signature position
      onSavePosition?.(signaturePosition);
    }
    setEditMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>PDF Signature Management - {formType} {isDualSignature ? `(${activeSignature.charAt(0).toUpperCase() + activeSignature.slice(1)} Signature)` : ''}</span>
            {pdfLoadError && (
              <Badge variant="destructive" className="ml-2">
                Preview Mode
              </Badge>
            )}
          </DialogTitle>
          {pdfLoadError && (
            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded mt-2">
              <strong>Note:</strong> PDF preview is using template mode.
              {pdfLoadError.includes('worker') && " PDF.js worker failed to load."}
              {pdfLoadError.includes('timeout') && " PDF loading timed out."}
              {pdfLoadError.includes('fetch') && " Could not fetch PDF file."}
              <br />Signature position editing is still available.
            </div>
          )}
        </DialogHeader>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Controls Panel */}
          <div className="w-80 border-r pr-4 space-y-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signature Position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Live Coordinates Display */}
                <div className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  isLiveUpdating ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Live Coordinates:</span>
                    {isLiveUpdating && (
                      <Badge variant="outline" className="animate-pulse border-green-500 text-green-700">
                        Updating...
                      </Badge>
                    )}
                  </div>
                  <div className="text-lg font-mono mt-1">
                    X: <span className="text-blue-600 font-bold">{signaturePosition.x}</span>,
                    Y: <span className="text-blue-600 font-bold">{signaturePosition.y}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Size: {signaturePosition.width} × {signaturePosition.height}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="sig-x" className="flex items-center gap-1">
                      X Position
                      {isLiveUpdating && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                    </Label>
                    <Input
                      id="sig-x"
                      type="number"
                      value={getCurrentPosition().x}
                      onChange={(e) => updateCurrentPosition({
                        x: parseInt(e.target.value) || 0
                      })}
                      disabled={!editMode}
                      className={isLiveUpdating ? 'border-green-500 ring-green-200' : ''}
                      placeholder="X coordinate"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sig-y" className="flex items-center gap-1">
                      Y Position
                      {isLiveUpdating && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                    </Label>
                    <Input
                      id="sig-y"
                      type="number"
                      value={getCurrentPosition().y}
                      onChange={(e) => updateCurrentPosition({
                        y: parseInt(e.target.value) || 0
                      })}
                      disabled={!editMode}
                      className={isLiveUpdating ? 'border-green-500 ring-green-200' : ''}
                      placeholder="Y coordinate"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sig-width">Width</Label>
                    <Input
                      id="sig-width"
                      type="number"
                      value={getCurrentPosition().width}
                      onChange={(e) => updateCurrentPosition({
                        width: parseInt(e.target.value) || 100
                      })}
                      disabled={!editMode}
                      placeholder="Width"
                      min="50"
                      max="500"
                      step="5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sig-height">Height</Label>
                    <Input
                      id="sig-height"
                      type="number"
                      value={getCurrentPosition().height}
                      onChange={(e) => updateCurrentPosition({
                        height: parseInt(e.target.value) || 30
                      })}
                      disabled={!editMode}
                      placeholder="Height"
                      min="30"
                      max="200"
                      step="5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={showGrid ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowGrid(!showGrid)}
                    >
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      Grid
                    </Button>
                    <Badge variant="outline">
                      Scale: {(scale * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScale(1.0)}
                    >
                      100%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScale(Math.min(2.0, scale + 0.1))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant={editMode ? "destructive" : "default"}
                    onClick={() => setEditMode(!editMode)}
                    className="w-full"
                  >
                    {editMode ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Edit
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Position
                      </>
                    )}
                  </Button>

                  {editMode && (
                    <Button
                      onClick={handleSave}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                      size="lg"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Position (X:{signaturePosition.x}, Y:{signaturePosition.y})
                    </Button>
                  )}
                </div>

                {editMode && (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center text-blue-800 text-sm">
                        <MousePointer className="h-4 w-4 mr-2" />
                        Drag the signature box to reposition
                      </div>
                    </div>

                    {/* Quick Position Presets */}
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm font-medium text-purple-800 mb-2">Quick Positions:</div>
                      <div className="grid grid-cols-2 gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => updateCurrentPosition({ x: 50, y: 700 })}
                        >
                          Bottom Left
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => updateCurrentPosition({ x: 400, y: 700 })}
                        >
                          Bottom Right
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => updateCurrentPosition({ x: 300, y: 600 })}
                        >
                          Center
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => updateCurrentPosition({ x: 50, y: 100 })}
                        >
                          Top Left
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 pl-4 overflow-auto" ref={containerRef}>
            <div className="bg-gray-100 p-4 rounded">
              <div className="bg-white shadow-lg">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-300 cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{
                    cursor: editMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
