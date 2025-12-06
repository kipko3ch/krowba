/**
 * Krowba Waitlist Integration - Google Apps Script
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Update the EMAIL variable below with your email
 * 5. Deploy as Web App (Deploy > New deployment > Web app)
 * 6. Set "Execute as" to "Me" and "Who has access" to "Anyone"
 * 7. Copy the Web App URL and use it in your form submission
 */

// ========== CONFIGURATION ==========
const EMAIL = 'dimenzuri@gmail.com'; // Your notification email
const SHEET_NAME = 'Waitlist'; // Name of the sheet tab

// ========== MAIN FUNCTION ==========
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get or create the sheet
    const sheet = getOrCreateSheet();
    
    // Add headers if this is the first entry
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'WhatsApp Number', 'Instagram Handle', 'IP Address']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#44F91F');
    }
    
    // Add the new entry
    const timestamp = new Date();
    const name = data.name || '';
    const whatsapp = data.whatsapp || '';
    const instagram = data.instagram || '';
    const ipAddress = data.ip || 'N/A';
    
    sheet.appendRow([timestamp, name, whatsapp, instagram, ipAddress]);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 5).setBackground(lastRow % 2 === 0 ? '#F3F4F6' : '#FFFFFF');
    
    // Send email notification
    sendEmailNotification(name, whatsapp, instagram, timestamp);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Successfully added to waitlist!'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Get or create the waitlist sheet
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  return sheet;
}

/**
 * Send email notification
 */
function sendEmailNotification(name, whatsapp, instagram, timestamp) {
  const subject = '🎉 New Krowba Waitlist Signup!';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #44F91F 0%, #38C919 100%); color: #000; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .info-row { display: flex; padding: 15px; margin: 10px 0; background: #f9fafb; border-radius: 8px; border-left: 4px solid #44F91F; }
        .info-label { font-weight: 600; width: 150px; color: #6b7280; }
        .info-value { color: #111827; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .badge { display: inline-block; background: #44F91F; color: #000; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Waitlist Signup! 🚀</h1>
          <div class="badge">Krowba Alpha Program</div>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 25px;">You have a new vendor interested in joining the Krowba pilot program:</p>
          
          <div class="info-row">
            <div class="info-label">👤 Name:</div>
            <div class="info-value">${name}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">📱 WhatsApp:</div>
            <div class="info-value">${whatsapp}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">📸 Instagram:</div>
            <div class="info-value">${instagram}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">🕐 Signed up:</div>
            <div class="info-value">${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm:ss')}</div>
          </div>
          
          <div class="footer">
            <p>View all signups in your <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" style="color: #44F91F; text-decoration: none; font-weight: 600;">Google Sheet</a></p>
            <p style="margin-top: 15px; font-size: 12px;">This is an automated notification from Krowba Waitlist System</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const plainBody = `
New Krowba Waitlist Signup!

Name: ${name}
WhatsApp: ${whatsapp}
Instagram: ${instagram}
Signed up: ${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm:ss')}

View all signups: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
  `;
  
  MailApp.sendEmail({
    to: EMAIL,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });
}

/**
 * Test function - Run this to test email notifications
 */
function testEmailNotification() {
  sendEmailNotification(
    'Test User',
    '+234 123 456 7890',
    '@testuser',
    new Date()
  );
  Logger.log('Test email sent to: ' + EMAIL);
}
