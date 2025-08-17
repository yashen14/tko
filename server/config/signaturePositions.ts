// PDF signature positions configuration
// This file is automatically updated when admins change signature positions

export interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
}

export interface DualSignaturePositions {
  signature: SignaturePosition;
  signature_staff: SignaturePosition;
}

export interface PDFSignatureConfig {
  [pdfType: string]: SignaturePosition | DualSignaturePositions;
}

// Default signature positions for each PDF type
export const signaturePositions: PDFSignatureConfig = {
  "absa-form": {
    signature: {
      x: 74,
      y: 373,
      width: 200,
      height: 60,
      opacity: 0.7
    },
    signature_staff: {
      x: 320,
      y: 373,
      width: 200,
      height: 60,
      opacity: 0.7
    }
  },
  "clearance-certificate-form": {
    signature: {
      x: 87,
      y: 575,
      width: 180,
      height: 50,
      opacity: 0.7
    },
    signature_staff: {
      x: 87,
      y: 631,
      width: 180,
      height: 50,
      opacity: 0.7
    }
  },
  "sahl-certificate-form": { x: 71, y: 586, width: 200, height: 60, opacity: 0.7 },
  "discovery-form": {
    signature: {
      x: 120,
      y: 163,
      width: 180,
      height: 50,
      opacity: 0.7
    },
    signature_staff: {
      x: 120,
      y: 110,
      width: 180,
      height: 50,
      opacity: 0.7
    }
  },
  "liability-form": {
    signature: {
      x: 411,
      y: 788,
      width: 180,
      height: 50,
      opacity: 0.7
    },
    signature_staff: {
      x: 4,
      y: 788,
      width: 180,
      height: 50,
      opacity: 0.7
    }
  },
  "noncompliance-form": { x: 300, y: 700, width: 200, height: 60, opacity: 0.7 },
  "material-list-form": { x: 320, y: 750, width: 200, height: 60, opacity: 0.7 }
};

// Function to get signature position for a specific form type
export function getSignaturePosition(formType: string): SignaturePosition {
  const config = signaturePositions[formType];
  if (config && 'signature' in config) {
    // For backward compatibility, return main signature position for legacy calls
    return config.signature;
  }
  return config as SignaturePosition || {
    x: 400,
    y: 100,
    width: 200,
    height: 60,
    opacity: 0.7
  };
}

// Function to get dual signature positions for forms that support them
export function getDualSignaturePositions(formType: string): DualSignaturePositions | null {
  const config = signaturePositions[formType];
  if (config && 'signature' in config) {
    return config as DualSignaturePositions;
  }
  return null;
}

// Function to update signature position (this will be called by admin API)
export function updateSignaturePosition(formType: string, position: SignaturePosition | DualSignaturePositions): void {
  signaturePositions[formType] = position;
}
