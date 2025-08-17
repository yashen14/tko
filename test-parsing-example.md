# New Line-by-Line Job Data Parsing

## Example Input Format

```
ClaimNo
 CL4471607
PolicyNo
1767761 
SPM No
SPM 261434/7/25
Underwriter
SAHL Insurance Company Ltd 
Branch
SA Home Loans 
Broker
SAHL Insurance Company Ltd
ClaimSpecialist
Sherette Jasson 
Email
sherettej@sahomeloans.com 
Risk Address
9 GREENWOOD STREET PARKLANDS, MILNERTON 7441
Claim Status
Current  
Insured Name
Erf 2601 Parklands C C 
Ins Cell
+2783-621-8459
Ins Home Tel
 
Ins Email
scullyh53@gmail.com 
Sum Insured
3233322.00 
Incident Date
28 Jul 2025 00:00 
Description of Loss
HOC Premium Checked The client advised that the geyser is leaking & not heating Resultants – none Excess advised of R750 up to R2250 Script advised Mr. 0836218459 MULTI CLAIMANT CHECKED  
Claim Estimate
8500.00 
Section
Building
Peril
Excess
Excess R750 per item, Maximum of R2250 per claim
Date Reported
28 Jul 2025 00:00 
```

## Parsed Output

The new parsing method will extract the following fields:

- **ClaimNo**: CL4471607
- **PolicyNo**: 1767761
- **SPMNo**: SPM 261434/7/25
- **Underwriter**: SAHL Insurance Company Ltd
- **Branch**: SA Home Loans
- **Broker**: SAHL Insurance Company Ltd
- **ClaimSpecialist**: Sherette Jasson
- **Email**: sherettej@sahomeloans.com
- **RiskAddress**: 9 GREENWOOD STREET PARKLANDS, MILNERTON 7441
- **ClaimStatus**: Current
- **InsuredName**: Erf 2601 Parklands C C
- **InsCell**: +2783-621-8459
- **InsEmail**: scullyh53@gmail.com
- **SumInsured**: 3233322.00
- **IncidentDate**: 28 Jul 2025 00:00
- **DescriptionOfLoss**: HOC Premium Checked The client advised that the geyser is leaking & not heating Resultants – none Excess advised of R750 up to R2250 Script advised Mr. 0836218459 MULTI CLAIMANT CHECKED
- **ClaimEstimate**: 8500.00
- **Section**: Building
- **Excess**: Excess R750 per item, Maximum of R2250 per claim
- **DateReported**: 28 Jul 2025 00:00

## How It Works

1. **Format Detection**: The parser automatically detects if the input uses the line-by-line format
2. **Field Recognition**: Recognizes field names like "ClaimNo", "Policy No", "SPM No", etc.
3. **Value Extraction**: Takes the content from the next line as the field value
4. **Multi-line Support**: Handles multi-line values (especially for "Description of Loss")
5. **Fallback**: If line-by-line format isn't detected, falls back to the existing tab/colon parsing methods

## Usage

Simply paste the job data in the Create Job modal and the parser will automatically:
- Detect the format
- Extract all relevant fields
- Populate the job form with the parsed data
- Map to the correct database fields
