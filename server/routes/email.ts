import { Request, Response } from "express";

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  jobId?: string;
}

export const handleSendEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, body, jobId }: EmailRequest = req.body;

    // In a real implementation, you would use a service like:
    // - Nodemailer with SMTP
    // - SendGrid
    // - AWS SES
    // - Postmark
    
    console.log('Email would be sent:', {
      to,
      subject,
      body,
      jobId,
      timestamp: new Date().toISOString()
    });

    // Simulate email sending
    // For now, we'll just log it and return success
    // You can integrate with your preferred email service here

    res.json({
      success: true,
      message: 'Email prepared successfully 🌺',
      emailId: `email-${Date.now()}`,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email'
    });
  }
};

export const handleAutoSendFormSubmission = async (req: Request, res: Response) => {
  try {
    const { jobTitle, formName, submissionData, jobDetails } = req.body;

    const subject = `${jobTitle} - ${formName} Submitted`;
    const body = `Good day.

${formName} has been submitted for job: ${jobTitle}

Job Details:
${Object.entries(jobDetails || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Form Data:
${JSON.stringify(submissionData, null, 2)}

Best regards,
BBPlumbing Team
🌺 Lilo & Stitch 🌺`;

    console.log('Auto-submission email would be sent:', {
      to: 'Yashe@bbplumbing.co.za',
      subject,
      body,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Form submission email prepared 🌺',
      emailId: `form-email-${Date.now()}`
    });

  } catch (error) {
    console.error('Auto-submission email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send form submission email'
    });
  }
};
