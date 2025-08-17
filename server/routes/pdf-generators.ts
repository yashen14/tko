// Re-export the PDF generation functions from pdf-generation.ts
export async function generateABSAPDF(submission: any): Promise<Uint8Array> {
  const { generateABSAPDF } = await import("./pdf-generation");
  return generateABSAPDF(submission);
}

export async function generateClearancePDF(submission: any): Promise<Uint8Array> {
  const { generateClearancePDF } = await import("./pdf-generation");
  return generateClearancePDF(submission);
}

export async function generateSAHLPDF(submission: any): Promise<Uint8Array> {
  const { generateSAHLPDF } = await import("./pdf-generation");
  return generateSAHLPDF(submission);
}

export async function generateDiscoveryPDF(submission: any): Promise<Uint8Array> {
  const { generateDiscoveryPDF } = await import("./pdf-generation");
  return generateDiscoveryPDF(submission);
}

export async function generateLiabilityPDF(submission: any): Promise<Uint8Array> {
  const { generateLiabilityPDF } = await import("./pdf-generation");
  return generateLiabilityPDF(submission);
}

export async function generateNoncompliancePDF(submission: any): Promise<Uint8Array> {
  const { generateNoncompliancePDF } = await import("./pdf-generation");
  return generateNoncompliancePDF(submission);
}

export async function generateMaterialListPDF(submission: any): Promise<Uint8Array> {
  const { generateMaterialListPDF } = await import("./pdf-generation");
  return generateMaterialListPDF(submission);
}
