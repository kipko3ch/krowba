# Krowba Waitlist Integration Setup Guide

## 📋 Overview
This guide will help you set up the Google Sheets waitlist integration with email notifications.

---

## 🚀 Step-by-Step Setup

### Step 1: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Krowba Waitlist"

### Step 2: Add Apps Script
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code in the editor
3. Copy the entire code from `google-apps-script/waitlist-integration.gs`
4. Paste it into the Apps Script editor
5. **Important**: Update line 11 with your email:
   ```javascript
   const EMAIL = 'dimenzuri@gmail.com';
   ```
6. Click **Save** (💾 icon)

### Step 3: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure settings:
   - **Description**: "Krowba Waitlist API"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. **Copy the Web App URL** (you'll need this!)
7. Click **Authorize access** and grant permissions

### Step 4: Test the Integration
1. In Apps Script editor, select `testEmailNotification` from the function dropdown
2. Click **Run** ▶️
3. Check your email (dimenzuri@gmail.com) for a test notification
4. Check your Google Sheet for a test entry

---

## 🔗 Frontend Integration

### Update Your Form Submission

Replace your form submission handler in `App.tsx` with:

```typescript
const handleWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  const formData = new FormData(e.currentTarget);
  const data = {
    name: formData.get('name'),
    whatsapp: formData.get('whatsapp'),
    instagram: formData.get('instagram'),
    ip: '' // Optional: add IP detection if needed
  };
  
  try {
    const response = await fetch('YOUR_WEB_APP_URL_HERE', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    // Show success message
    alert('Successfully joined the waitlist! 🎉');
    e.currentTarget.reset();
    
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong. Please try again.');
  }
};
```

### Add Form Names

Update your form inputs in `App.tsx` (around line 219-227):

```tsx
<input
  name="name"
  type="text"
  placeholder="Name"
  required
  className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-4..."
/>

<input
  name="whatsapp"
  type="tel"
  placeholder="WhatsApp Number"
  required
  className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-4..."
/>

<input
  name="instagram"
  type="text"
  placeholder="Instagram Handle"
  required
  className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-4..."
/>
```

Add the submit handler to your form:

```tsx
<form 
  ref={formRef} 
  className="max-w-md mx-auto space-y-4" 
  onSubmit={handleWaitlistSubmit}
>
```

---

## 📧 Email Notifications

You will receive beautiful HTML emails at **dimenzuri@gmail.com** with:
- Vendor name
- WhatsApp number
- Instagram handle
- Signup timestamp
- Direct link to view all signups in Google Sheets

---

## 📊 Google Sheet Structure

Your sheet will automatically have these columns:
- **Timestamp** - When they signed up
- **Name** - Vendor name
- **WhatsApp Number** - Contact number
- **Instagram Handle** - Social media handle
- **IP Address** - (Optional) User's IP

---

## 🎨 Features

✅ Automatic email notifications  
✅ Beautiful HTML email formatting  
✅ Data stored in Google Sheets  
✅ Automatic row formatting (alternating colors)  
✅ Header row with green background  
✅ Timestamp for each entry  

---

## 🔧 Troubleshooting

### Not receiving emails?
- Check spam folder
- Verify email address in script (line 11)
- Run `testEmailNotification` function to test

### Form not submitting?
- Check Web App URL is correct
- Ensure deployment is set to "Anyone" access
- Check browser console for errors

### Script errors?
- Ensure you authorized the script
- Check Apps Script execution logs (View → Logs)

---

## 📝 Next Steps

1. ✅ Set up Google Sheet
2. ✅ Deploy Apps Script
3. ✅ Test email notifications
4. ⬜ Update frontend form handler
5. ⬜ Test full integration
6. ⬜ Monitor signups!

---

**Need help?** Check the Apps Script logs or test the `testEmailNotification` function.
