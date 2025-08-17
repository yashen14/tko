// Enhanced text parsing utilities for jobs and forms

export interface ParsedJobData {
  title?: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  policyNumber?: string;
  serviceAddress?: string;
  estimatedAmount?: number;
  jobType?: string;
  excess?: string;
  refNumber?: string;
  claimNo?: string;
  spmNo?: string;
  underwriter?: string;
  branch?: string;
  broker?: string;
  claimSpecialist?: string;
  riskAddress?: string;
  claimStatus?: string;
  insuredName?: string;
  insCell?: string;
  insHometel?: string;
  insEmail?: string;
  sumInsured?: number;
  incidentDate?: string;
  descriptionOfLoss?: string;
  claimEstimate?: number;
  section?: string;
  peril?: string;
  dateReported?: string;
  category?: string;
}

// Parse format where field names are on one line followed by values on the next line
function parseLineByLineFormat(lines: string[]): ParsedJobData {
  const data: ParsedJobData = {};

  // Field name patterns to look for - order matters for specificity
  const fieldPatterns = {
    claimNo: /^ClaimNo$/i,
    claimEstimate: /^Claim\s+Estimate$/i,
    claimStatus: /^Claim\s+Status$/i,
    claimSpecialist: /^ClaimSpecialist$/i,
    policyNumber: /^PolicyNo$/i,
    spmNo: /^SPM\s+No$/i,
    underwriter: /^Underwriter$/i,
    branch: /^Branch$/i,
    broker: /^Broker$/i,
    clientEmail: /^Email$/i,
    serviceAddress: /^Risk\s+Address$/i,
    insuredName: /^Insured\s+Name$/i,
    clientPhone: /^Ins\s+Cell$/i,
    insHometel: /^Ins\s+Home\s+Tel$/i,
    insEmail: /^Ins\s+Email$/i,
    sumInsured: /^Sum\s+Insured$/i,
    incidentDate: /^Incident\s+Date$/i,
    descriptionOfLoss: /^Description\s+of\s+Loss$/i,
    section: /^Section$/i,
    peril: /^Peril$/i,
    excess: /^Excess$/i,
    dateReported: /^Date\s+Reported$/i,
  };

  let isLineByLineFormat = false;

  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();

    // Check if current line matches any field pattern
    for (const [fieldKey, pattern] of Object.entries(fieldPatterns)) {
      if (pattern.test(currentLine)) {
        isLineByLineFormat = true;

        // If next line has content and doesn't match another field pattern, it's the value
        if (nextLine && !isFieldName(nextLine, fieldPatterns)) {
          let value = nextLine;

          // Handle multi-line values (especially for Description of Loss)
          if (fieldKey === 'descriptionOfLoss') {
            let j = i + 1;
            const multiLineValue = [nextLine];

            // Continue reading lines until we hit another field name
            while (j + 1 < lines.length) {
              const followingLine = lines[j + 1].trim();
              if (followingLine && !isFieldName(followingLine, fieldPatterns)) {
                multiLineValue.push(followingLine);
                j++;
              } else {
                break;
              }
            }
            value = multiLineValue.join(' ').trim();
            i = j; // Skip the lines we've processed
          }

          // Process the value based on field type
          processJobKeyValue(fieldKey, value, data);
        }
        break;
      }
    }
  }

  // Only return data if we detected the line-by-line format
  return isLineByLineFormat ? data : {};
}

// Helper function to check if a line is a field name
function isFieldName(line: string, patterns: Record<string, RegExp>): boolean {
  return Object.values(patterns).some(pattern => pattern.test(line));
}

export interface ParsedFormField {
  label: string;
  type:
    | "text"
    | "email"
    | "number"
    | "textarea"
    | "select"
    | "radio"
    | "checkbox"
    | "date"
    | "datetime-local";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

// Enhanced job text parser - supports up to 80 fields exactly as parsed
export function parseJobText(text: string): ParsedJobData {
  const data: ParsedJobData = {};
  const maxFields = 80;
  let fieldCount = 0;

  // Clean and normalize the text
  const cleanText = text.replace(/\s+/g, " ").trim();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // First try the new line-by-line format where field names are on one line and values on the next
  const lineByLineData = parseLineByLineFormat(lines);
  if (Object.keys(lineByLineData).length > 0) {
    Object.assign(data, lineByLineData);
    fieldCount = Object.keys(lineByLineData).length;
  } else {
    // Process each line to extract ALL key-value pairs (existing logic)
    for (const line of lines) {
      if (fieldCount >= maxFields) break;

      // Skip header lines
      if (
        line.includes("Service Provider Appointment") ||
        line.includes("Claim Appointment") ||
        line.includes("Notification Details")
      ) {
        continue;
      }

      // Handle tab-separated format (most common)
      if (line.includes("\t")) {
        const parts = line
          .split("\t")
          .map((part) => part.trim())
          .filter((part) => part);

        for (let i = 0; i < parts.length - 1 && fieldCount < maxFields; i += 2) {
          const key = parts[i];
          const value = parts[i + 1];

          if (key && value) {
            // Use exact key names as parsed, just clean them slightly
            const cleanKey = key.replace(/[^\w\s]/g, "").replace(/\s+/g, "");
            if (cleanKey && !data[cleanKey as keyof ParsedJobData]) {
              (data as any)[cleanKey] = value;
              fieldCount++;
            }
          }
        }
      }
      // Handle colon-separated format
      else if (line.includes(":")) {
        const colonIndex = line.indexOf(":");
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        if (key && value && fieldCount < maxFields) {
          const cleanKey = key.replace(/[^\w\s]/g, "").replace(/\s+/g, "");
          if (cleanKey && !data[cleanKey as keyof ParsedJobData]) {
            (data as any)[cleanKey] = value;
            fieldCount++;
          }
        }
      }
    }
  }

  // Also extract using enhanced patterns for known fields - more specific patterns
  const enhancedPatterns = {
    ClaimNo: /(?:ClaimNo)\s*[:\t]\s*([^\s\t]+)/i,
    ClaimEstimate: /(?:Claim\s+Estimate)\s*[:\t]\s*([^\s\t]+)/i,
    PolicyNo: /(?:PolicyNo|Policy No|Policy)\s*[:\t]\s*([^\s\t]+)/i,
    SPMNo: /(?:SPM No|SPMNo|SPM)\s*[:\t]\s*([^\s\t]+)/i,
    Underwriter: /Underwriter\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Branch: /Branch\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Broker: /Broker\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    ClaimSpecialist:
      /(?:ClaimSpecialist|Claim Specialist)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Email: /Email\s*[:\t]\s*([^\s\t]+@[^\s\t]+)/i,
    RiskAddress:
      /(?:Risk Address|Home Address|Address)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    InsuredName:
      /(?:Insured Name|Client|Name)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    InsCell: /(?:Ins Cell|Contact|Cell|Phone)\s*[:\t]\s*([+\d\s\-()]+)/i,
    Excess: /Excess\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
  };

  // Fill in any missing standard fields
  for (const [key, pattern] of Object.entries(enhancedPatterns)) {
    if (fieldCount >= maxFields) break;

    if (!data[key as keyof ParsedJobData]) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        (data as any)[key] = match[1].trim();
        fieldCount++;
      }
    }
  }

  // Auto-detect job category based on description and other fields
  data.category = detectJobCategory(data);

  return data;
}

// Auto-detect job category based on parsed job data
function detectJobCategory(data: ParsedJobData): string {
  const description = (data.descriptionOfLoss || data.description || '').toLowerCase();
  const title = (data.title || '').toLowerCase();
  const combinedText = `${description} ${title}`.toLowerCase();

  // Geyser-related keywords
  if (combinedText.includes('geyser') || combinedText.includes('water heater') ||
      combinedText.includes('hot water') || combinedText.includes('heating')) {
    if (combinedText.includes('replace') || combinedText.includes('replacement') ||
        combinedText.includes('install') || combinedText.includes('new geyser')) {
      return 'Geyser Replacement';
    } else {
      return 'Geyser Assessment';
    }
  }

  // Leak detection keywords
  if (combinedText.includes('leak') || combinedText.includes('leaking') ||
      combinedText.includes('water damage') || combinedText.includes('water loss')) {
    return 'Leak Detection';
  }

  // Drain/blockage keywords
  if (combinedText.includes('block') || combinedText.includes('drain') ||
      combinedText.includes('clog') || combinedText.includes('overflow') ||
      combinedText.includes('sewer') || combinedText.includes('pipe block')) {
    return 'Drain Blockage';
  }

  // Camera inspection keywords
  if (combinedText.includes('camera') || combinedText.includes('inspection') ||
      combinedText.includes('cctv') || combinedText.includes('pipe inspection')) {
    return 'Camera Inspection';
  }

  // Toilet/shower keywords
  if (combinedText.includes('toilet') || combinedText.includes('shower') ||
      combinedText.includes('bathroom') || combinedText.includes('cistern') ||
      combinedText.includes('flush')) {
    return 'Toilet/Shower';
  }

  // Default category if no specific keywords found
  return 'Other';
}

function processJobKeyValue(key: string, value: string, data: ParsedJobData) {
  const keyLower = key.toLowerCase().replace(/\s+/g, "");

  // Map keys to job fields with comprehensive patterns - more specific matches first
  const keyMappings: Record<string, keyof ParsedJobData> = {
    claimno: "claimNo",
    claimestimate: "claimEstimate",
    claimstatus: "claimStatus",
    claimspecialist: "claimSpecialist",
    policyno: "policyNumber",
    policy: "policyNumber",
    spmno: "spmNo",
    spm: "spmNo",
    underwriter: "underwriter",
    branch: "branch",
    broker: "broker",
    email: "clientEmail",
    riskaddress: "serviceAddress",
    address: "serviceAddress",
    location: "serviceAddress",
    insuredname: "clientName",
    insured: "clientName",
    client: "clientName",
    name: "clientName",
    inscell: "clientPhone",
    cell: "clientPhone",
    contact: "clientPhone",
    phone: "clientPhone",
    inshometel: "insHometel",
    hometel: "insHometel",
    insemail: "insEmail",
    suminsured: "sumInsured",
    sum: "sumInsured",
    incidentdate: "incidentDate",
    incident: "incidentDate",
    descriptionofloss: "descriptionOfLoss",
    description: "descriptionOfLoss",
    section: "section",
    peril: "peril",
    excess: "excess",
    datereported: "dateReported",
    reported: "dateReported",
    refnumber: "refNumber",
    ref: "refNumber",
    reference: "refNumber",
    // Less specific patterns at the end
    date: "dateReported",
    estimate: "claimEstimate",
    amount: "estimatedAmount",
    status: "claimStatus",
    claim: "claimNo",
  };

  // Find matching key
  let mappedKey: keyof ParsedJobData | undefined;
  for (const [pattern, field] of Object.entries(keyMappings)) {
    if (keyLower.includes(pattern)) {
      mappedKey = field;
      break;
    }
  }

  if (mappedKey && value) {
    // Special handling for numeric fields
    if (
      ["sumInsured", "claimEstimate", "estimatedAmount"].includes(mappedKey)
    ) {
      const numericValue = parseFloat(value.replace(/[^\d.]/g, ""));
      if (!isNaN(numericValue)) {
        (data as any)[mappedKey] = numericValue;
      }
    } else {
      (data as any)[mappedKey] = value;
    }
  }
}

// Enhanced form schema parser
export function parseFormSchema(schemaText: string): ParsedFormField[] {
  // Try HTML form parsing first
  if (
    schemaText.includes("<form") ||
    schemaText.includes("<input") ||
    schemaText.includes("<label")
  ) {
    return parseHTMLForm(schemaText);
  }

  // Try JSON parsing
  try {
    const schema = JSON.parse(schemaText);
    if (schema.fields && Array.isArray(schema.fields)) {
      return schema.fields.map((field: any) => ({
        label: field.label || field.name || "Unnamed Field",
        type: mapFieldType(field.type),
        required: field.required || false,
        options: field.options || [],
        placeholder: field.placeholder,
      }));
    }
  } catch {
    // Not JSON, continue
  }

  // Try Mongoose schema parsing
  if (
    schemaText.includes("mongoose.Schema") ||
    schemaText.includes("Schema({")
  ) {
    return parseMongooseSchema(schemaText);
  }

  // Parse raw text and auto-generate form fields
  return parseRawTextToFormFields(schemaText);
}

function parseHTMLForm(htmlText: string): ParsedFormField[] {
  const fields: ParsedFormField[] = [];

  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  // Find all input, select, and textarea elements
  const inputs = doc.querySelectorAll("input, select, textarea");

  inputs.forEach((input) => {
    const field: ParsedFormField = {
      label: "",
      type: "text",
      required: input.hasAttribute("required"),
      options: [],
    };

    // Get label text
    const label = findLabelForInput(doc, input);
    field.label =
      label ||
      input.getAttribute("name") ||
      input.getAttribute("id") ||
      "Unnamed Field";

    // Handle different input types
    if (input.tagName.toLowerCase() === "select") {
      field.type = "select";
      const options = input.querySelectorAll("option");
      field.options = Array.from(options)
        .map((opt) => opt.textContent?.trim() || "")
        .filter((opt) => opt);
    } else if (input.getAttribute("type") === "radio") {
      // Group radio buttons by name
      const existingRadio = fields.find(
        (f) =>
          f.type === "radio" && (f as any).name === input.getAttribute("name"),
      );
      if (existingRadio) {
        const value = input.getAttribute("value");
        if (value && !existingRadio.options?.includes(value)) {
          existingRadio.options?.push(value);
        }
        return; // Skip adding duplicate radio field
      } else {
        field.type = "radio";
        (field as any).name = input.getAttribute("name");
        const value = input.getAttribute("value");
        if (value) field.options = [value];
      }
    } else if (input.getAttribute("type") === "checkbox") {
      field.type = "checkbox";
    } else if (input.tagName.toLowerCase() === "textarea") {
      field.type = "textarea";
    } else {
      // Map HTML input types to our form types
      const inputType = input.getAttribute("type") || "text";
      field.type = mapFieldType(inputType);
    }

    fields.push(field);
  });

  return fields;
}

function findLabelForInput(doc: Document, input: Element): string {
  // Try to find label by 'for' attribute
  const id = input.getAttribute("id");
  if (id) {
    const label = doc.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || "";
  }

  // Try to find parent label
  const parentLabel = input.closest("label");
  if (parentLabel) {
    return parentLabel.textContent?.replace(input.outerHTML, "").trim() || "";
  }

  // Try to find preceding label
  let prev = input.previousElementSibling;
  while (prev) {
    if (prev.tagName.toLowerCase() === "label") {
      return prev.textContent?.trim() || "";
    }
    prev = prev.previousElementSibling;
  }

  return "";
}

function parseMongooseSchema(schemaText: string): ParsedFormField[] {
  const fields: ParsedFormField[] = [];

  // Extract the schema content between Schema({ and })
  const schemaMatch = schemaText.match(/Schema\s*\(\s*\{([\s\S]*?)\}\s*\)/);
  if (!schemaMatch) {
    throw new Error("Could not find Schema definition");
  }

  const schemaContent = schemaMatch[1];

  // Split by field definitions
  const fieldMatches = schemaContent.match(/(\w+)\s*:\s*\{[^}]*\}/g) || [];

  fieldMatches.forEach((fieldMatch) => {
    const fieldNameMatch = fieldMatch.match(/(\w+)\s*:/);
    if (!fieldNameMatch) return;

    const fieldName = fieldNameMatch[1];

    // Skip internal mongoose fields
    if (fieldName === "_id" || fieldName === "__v") return;

    // Extract field properties
    const typeMatch = fieldMatch.match(/type\s*:\s*(\w+)/);
    const requiredMatch = fieldMatch.match(/required\s*:\s*(true|false)/);
    const enumMatch = fieldMatch.match(/enum\s*:\s*\[(.*?)\]/);

    // Determine field type and properties
    const mongooseType = typeMatch ? typeMatch[1] : "String";
    const isRequired = requiredMatch ? requiredMatch[1] === "true" : false;

    // Convert field name to readable label
    const label = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    // Determine HTML input type based on Mongoose type and field name
    let fieldType: ParsedFormField["type"] = "text";
    let options: string[] = [];

    if (enumMatch) {
      fieldType = "select";
      options = enumMatch[1]
        .split(",")
        .map((opt) => opt.trim().replace(/['"]/g, ""))
        .filter((opt) => opt);
    } else {
      fieldType = determineFieldTypeFromMongoose(fieldName, mongooseType);
    }

    fields.push({
      label,
      type: fieldType,
      required: isRequired,
      options: options.length > 0 ? options : undefined,
    });
  });

  return fields;
}

function parseRawTextToFormFields(text: string): ParsedFormField[] {
  const fields: ParsedFormField[] = [];
  const processedKeys = new Set<string>();

  // Split text into lines and process each line
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  for (const line of lines) {
    // Skip header lines
    if (
      line.includes("Service Provider Appointment") ||
      line.includes("Claim Appointment") ||
      line.includes("Notification Details")
    ) {
      continue;
    }

    // Split by tab or multiple spaces
    const parts = line.split(/\t+/).map((part) => part.trim());

    // Process pairs of key-value
    for (let i = 0; i < parts.length - 1; i += 2) {
      const key = parts[i];
      const value = parts[i + 1];

      // Skip if key is empty or already processed
      if (!key || processedKeys.has(key.toLowerCase())) continue;

      processedKeys.add(key.toLowerCase());

      // Clean up the key for display
      const cleanKey = key.replace(/([A-Z])/g, " $1").trim();
      const fieldLabel = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);

      // Determine field type based on key name and value
      const { type, options } = determineFieldType(key, value);

      // Create field object
      fields.push({
        label: fieldLabel,
        type,
        required: isRequiredField(key),
        options,
      });
    }
  }

  return fields;
}

function determineFieldType(
  key: string,
  value: string,
): { type: ParsedFormField["type"]; options?: string[] } {
  const keyLower = key.toLowerCase();

  // Email fields
  if (keyLower.includes("email") || (value && value.includes("@"))) {
    return { type: "email" };
  }

  // Phone/Cell fields
  if (
    keyLower.includes("cell") ||
    keyLower.includes("phone") ||
    keyLower.includes("tel")
  ) {
    return { type: "text" };
  }

  // Date fields
  if (keyLower.includes("date") || keyLower.includes("time")) {
    return { type: "datetime-local" };
  }

  // Number fields
  if (
    keyLower.includes("amount") ||
    keyLower.includes("sum") ||
    keyLower.includes("estimate") ||
    keyLower.includes("no") ||
    keyLower.includes("number") ||
    (value && /^\d+(\.\d+)?$/.test(value.replace(/[^\d.]/g, "")))
  ) {
    return { type: "number" };
  }

  // Address fields (textarea)
  if (
    keyLower.includes("address") ||
    keyLower.includes("description") ||
    (value && value.length > 50)
  ) {
    return { type: "textarea" };
  }

  // Status fields (select dropdown)
  if (keyLower.includes("status")) {
    return {
      type: "select",
      options: ["Current", "Pending", "Completed", "Cancelled", "In Progress"],
    };
  }

  // Priority fields
  if (keyLower.includes("priority")) {
    return {
      type: "select",
      options: ["Low", "Medium", "High", "Urgent"],
    };
  }

  // Default to text
  return { type: "text" };
}

function determineFieldTypeFromMongoose(
  fieldName: string,
  mongooseType: string,
): ParsedFormField["type"] {
  const fieldNameLower = fieldName.toLowerCase();

  if (fieldNameLower.includes("email")) {
    return "email";
  }

  if (fieldNameLower.includes("phone") || fieldNameLower.includes("number")) {
    return "text";
  }

  if (fieldNameLower.includes("date") || fieldNameLower.includes("time")) {
    return "datetime-local";
  }

  if (
    fieldNameLower.includes("address") ||
    fieldNameLower.includes("description")
  ) {
    return "textarea";
  }

  // Handle by Mongoose type
  switch (mongooseType) {
    case "Number":
      return "number";
    case "Date":
      return "datetime-local";
    case "Boolean":
      return "checkbox";
    case "String":
    default:
      return "text";
  }
}

function mapFieldType(inputType: string): ParsedFormField["type"] {
  switch (inputType) {
    case "email":
      return "email";
    case "tel":
    case "phone":
      return "text";
    case "number":
      return "number";
    case "date":
      return "date";
    case "datetime-local":
      return "datetime-local";
    case "checkbox":
      return "checkbox";
    case "radio":
      return "radio";
    case "textarea":
      return "textarea";
    case "select":
      return "select";
    default:
      return "text";
  }
}

function isRequiredField(key: string): boolean {
  const keyLower = key.toLowerCase();
  const requiredFields = [
    "name",
    "email",
    "phone",
    "cell",
    "address",
    "status",
    "claim",
    "policy",
  ];

  return requiredFields.some((field) => keyLower.includes(field));
}
