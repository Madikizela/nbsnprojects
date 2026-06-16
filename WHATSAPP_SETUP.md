# WhatsApp Business API Setup Guide

## 1. Create a Meta App

1. Go to https://developers.facebook.com → My Apps → Create App
2. Choose **Business** type
3. Add the **WhatsApp** product
4. Under WhatsApp → API Setup, note your **Phone Number ID** and **Temporary Access Token**
5. For production create a **Permanent System User Token** via Meta Business Manager

## 2. Set Config Values

Add to your `.env` file (or Railway environment variables):
```
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
LEARNER_PORTAL_URL=https://your-domain.com/learner
```

The backend reads these via `appsettings.json` → `WhatsApp:PhoneNumberId` etc.
Map env vars to config in `Program.cs` if using environment variable overrides.

## 3. Create Message Templates in Meta Business Manager

Go to: Business Manager → WhatsApp Manager → Message Templates → Create Template
Category: **UTILITY** (for transactional messages — lower cost, faster approval)
Language: **en** (English) — add `af` (Afrikaans) variants later if needed

---

### Template 1: `learner_welcome`
**Body:**
```
Hello {{1}}, welcome to NBSN! Your learner portal credentials are:
Username: {{2}}
Password: {{3}}
Portal: {{4}}
Please log in and change your password immediately.
```
Parameters: `{{1}}`=learnerName, `{{2}}`=username, `{{3}}`=password, `{{4}}`=portalUrl

---

### Template 2: `document_approved`
**Body:**
```
Hi {{1}}, great news! Your *{{2}}* document has been approved. You can view your document status in the NBSN learner portal.
```
Parameters: `{{1}}`=learnerName, `{{2}}`=documentType

---

### Template 3: `document_declined`
**Body:**
```
Hi {{1}}, your *{{2}}* document was not approved. Reason: {{3}}. Please re-upload a clear, legible copy via the NBSN learner portal.
```
Parameters: `{{1}}`=learnerName, `{{2}}`=documentType, `{{3}}`=reason

---

### Template 4: `assessment_submitted`
**Body:**
```
Hi {{1}}, your *{{2}} Assessment* answers for *{{3}}* have been received. Your facilitator will mark them shortly.
```
Parameters: `{{1}}`=learnerName, `{{2}}`=assessmentType, `{{3}}`=unitStandardName

---

### Template 5: `competency_achieved`
**Body:**
```
Congratulations {{1}}! 🎉 You have been declared *Competent* for *{{2}}* ({{3}}). Well done!
```
Parameters: `{{1}}`=learnerName, `{{2}}`=unitStandardName, `{{3}}`=qualificationName

---

### Template 6: `attendance_clockin`
**Body:**
```
Hi {{1}}, your attendance has been recorded for *{{2}}* at {{3}}. If this was not you, contact your facilitator immediately.
```
Parameters: `{{1}}`=learnerName, `{{2}}`=className, `{{3}}`=clockTime

---

### Template 7: `class_announcement`
**Body:**
```
📢 Message from {{2}} to {{1}}: {{3}}
```
Parameters: `{{1}}`=learnerName, `{{2}}`=teacherName, `{{3}}`=message

---

## 4. Important WhatsApp Rules

- Templates must be approved by Meta before use (usually 24–48 hours)
- You can only send template messages to users who have **opted in**
- Add an opt-in checkbox or consent step when capturing learner phone numbers
- Template messages work outside the 24-hour service window
- Free-text messages (`SendTextMessageAsync`) only work within 24h of the learner messaging you first

## 5. Testing Without Approval

The service runs in **STUB mode** when `WhatsApp:AccessToken` is empty — it logs what would be sent to the console instead of calling the API. This lets you develop and test locally without credentials.
