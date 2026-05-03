import twilio from 'twilio';
import nodemailer from 'nodemailer';

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID 
  && !process.env.TWILIO_ACCOUNT_SID.startsWith('your_')
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const isEmailConfigured = Boolean(
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  !process.env.EMAIL_USER.startsWith('your-') &&
  !process.env.EMAIL_PASS.startsWith('your-')
);

// Initialize Nodemailer
const emailTransporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : null;

export const sendEmergencySMS = async (to, message) => {
  if (!twilioClient) {
    console.log('Twilio not configured. SMS would be sent to:', to);
    console.log('Message:', message);
    return { success: true, mock: true };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

export const sendEmergencyEmail = async (to, userName, emergencyDetails) => {
  const { type, description, location, googleMapsLink, userPhone, bloodGroup, medicalConditions, allergies } = emergencyDetails;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .btn { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 10px 5px; }
        .btn-secondary { background: #2563eb; }
        .medical-info { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { background: #1f2937; color: white; padding: 15px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 EMERGENCY ALERT</h1>
          <p>${userName} needs immediate help!</p>
        </div>
        <div class="content">
          <div class="alert-box">
            <h2 style="margin-top: 0; color: #dc2626;">Emergency Type: ${type}</h2>
            ${description ? `<p><strong>Details:</strong> ${description}</p>` : ''}
          </div>
          
          <div class="info-row">
            <span class="label">📍 Location:</span><br>
            <a href="${googleMapsLink}" style="color: #2563eb;">View on Google Maps</a><br>
            <small>Coordinates: ${location.latitude}, ${location.longitude}</small>
          </div>
          
          <div class="info-row">
            <span class="label">📞 Contact Phone:</span>
            <span class="value">${userPhone}</span>
          </div>
          
          ${bloodGroup !== 'Unknown' ? `
          <div class="medical-info">
            <h3 style="margin-top: 0;">Medical Information</h3>
            <p><strong>Blood Group:</strong> ${bloodGroup}</p>
            ${medicalConditions?.length ? `<p><strong>Medical Conditions:</strong> ${medicalConditions.join(', ')}</p>` : ''}
            ${allergies?.length ? `<p><strong>Allergies:</strong> ${allergies.join(', ')}</p>` : ''}
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${googleMapsLink}" class="btn">📍 View Location</a>
            <a href="tel:${userPhone}" class="btn btn-secondary">📞 Call Now</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This is an automated emergency alert from ZeroDelay. Please respond immediately if you can help.
          </p>
        </div>
        <div class="footer">
          <p>ZeroDelay Emergency Response System</p>
          <p>Every second matters.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!emailTransporter) {
    console.log('Email not configured. Email would be sent to:', to);
    console.log('Emergency details:', { userName, type, googleMapsLink });
    return { success: true, mock: true };
  }

  try {
    await emailTransporter.sendMail({
      from: `"ZeroDelay Emergency" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `🚨 EMERGENCY: ${userName} needs help immediately!`,
      html: htmlContent
    });
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};
