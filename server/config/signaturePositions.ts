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
  client: SignaturePosition;
  staff: SignaturePosition;
}

export interface PDFSignatureConfig {
  [pdfType: string]: SignaturePosition | DualSignaturePositions;
}

// Default signature positions for each PDF type
export const signaturePositions: PDFSignatureConfig = {
  "absa-form": {
    client: {
      x: 74,
      y: 373,
      width: 200,
      height: 60,
      opacity: 0.7
    },
    staff: {
      x: 320,
      y: 373,
      width: 200,
      height: 60,
      opacity: 0.7
    }
  },
  "clearance-certificate-form": {
    client: {
      x: 91.0330810546875,
      y: 683.6632232666016,
      width: 200,
      height: 60,
      opacity: 0.7
    },
    staff: {
      x: 87.97,
      y: 682.24,
      width: 200,
      height: 60,
      opacity: 0.7
    }
  },
  "sahl-certificate-form": {
    client: {
      x: 71,
      y: 586,
      width: 200,
      height: 60,
      opacity: 0.7
    },
    staff: {
      x: 320,
      y: 586,
      width: 200,
      height: 60,
      opacity: 0.7
    }
  },
  "discovery-form": {
    client: {
      x: 120,
      y: 163,
      width: 180,
      height: 50,
      opacity: 0.7
    },
    staff: {
      x: 223.97,
      y: 797.24,
      width: 175,
      height: 40,
      opacity: 0.7
    }
  },
  "liability-form": {
    client: {
      x: 58,
      y: 670,
      width: 200,
      height: 60,
      opacity: 0.7
    },
    staff: {
      x: 316,
      y: 663,
      width: 200,
      height: 60,
      opacity: 0.7
    }
  },
  "noncompliance-form": {
    client: {
      x: 300,
      y: 700,
      width: 200,
      height: 60,
      opacity: 0.7
    },
    staff: {
      x: 80,
      y: 700,
      width: 200,
      height: 60,
      opacity: 0.7
    }
  },
  "material-list-form": {
    client: {
      x: 320,
      y: 750,
      width: 200,
      height: 60,
      opacity: 0.7
    },
    staff: {
      x: 80,
      y: 750,
      width: 200,
      height: 60,
      opacity: 0.7
    }
  }
};

// Function to get signature position for a specific form type
export function getSignaturePosition(formType: string): SignaturePosition {
  const config = signaturePositions[formType];
  if (config && 'client' in config) {
    // For backward compatibility, return client signature position for legacy calls
    return config.client;
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
  if (config && 'client' in config) {
    return config as DualSignaturePositions;
  }
  return null;
}

// Function to update signature position (this will be called by admin API)
export function updateSignaturePosition(formType: string, position: SignaturePosition | DualSignaturePositions): void {
  signaturePositions[formType] = position;
}
