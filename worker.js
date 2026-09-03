/**
 * VENAMERCURI - Cloudflare Worker
 * Handles static asset delivery and secure contact intake API (/api/contact).
 */

const ALLOWED_SERVICES = new Set([
  'Guided Meditation (Group Classes)',
  'Astrology Classes (Group Cohorts)',
  'Astrology Readings (Individual & Family)',
  'Intuitive Tarot',
  'Energy Portraits',
  'Astral Projection (Group Classes)',
  'Not sure yet'
]);

const OWNER_DESTINATION = 'yesmara29@gmail.com';
const SENDER_EMAIL = 'contact@venamercuri.nfinitemindai.com';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasCRLF(str) {
  return /[\r\n]/.test(str);
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      return handleContact(request, env);
    }

    // Default: serve static assets directly
    return env.ASSETS.fetch(request);
  }
};

async function handleContact(request, env) {
  // 1. Method validation: POST only
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } }
    );
  }

  // 2. Content-Type validation
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid Content-Type. Expected application/json.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Payload size check (max 16KB)
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > 16384) {
    return new Response(
      JSON.stringify({ success: false, error: 'Payload too large.' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    const text = await request.text();
    if (text.length > 16384) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payload too large.' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }
    body = JSON.parse(text);
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Malformed JSON payload.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid payload schema.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Disallow arbitrary recipient or sender tampering fields
  const forbiddenFields = ['to', 'from', 'cc', 'bcc', 'recipient', 'sender', 'destination'];
  for (const field of forbiddenFields) {
    if (field in body) {
      return new Response(
        JSON.stringify({ success: false, error: `Forbidden field detected: ${field}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 5. Extract and validate required & optional fields
  let { fullName, email, dob, tob, pob, service, message } = body;

  // fullName: required string, 1-100 chars
  if (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 100 || hasCRLF(fullName)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Full name is required (max 100 characters, single line).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  fullName = fullName.trim();

  // email: required string, 5-254 chars, valid format
  if (typeof email !== 'string' || !email.trim() || email.length > 254 || hasCRLF(email) || !EMAIL_REGEX.test(email.trim())) {
    return new Response(
      JSON.stringify({ success: false, error: 'A valid email address is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  email = email.trim();

  // service: required string, must match allowlist
  if (typeof service !== 'string' || !ALLOWED_SERVICES.has(service.trim()) || hasCRLF(service)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Please select a valid service from the offering list.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  service = service.trim();

  // dob: optional string, max 20 chars
  if (dob !== undefined && dob !== null && dob !== '') {
    if (typeof dob !== 'string' || dob.length > 20 || hasCRLF(dob) || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Date of Birth format (YYYY-MM-DD expected).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else {
    dob = 'Not provided';
  }

  // tob: optional string, max 20 chars
  if (tob !== undefined && tob !== null && tob !== '') {
    if (typeof tob !== 'string' || tob.length > 20 || hasCRLF(tob) || !/^\d{1,2}:\d{2}(?::\d{2})?$/.test(tob)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Time of Birth format (HH:MM expected).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else {
    tob = 'Not provided';
  }

  // pob: optional string, max 100 chars
  if (pob !== undefined && pob !== null && pob !== '') {
    if (typeof pob !== 'string' || pob.length > 100 || hasCRLF(pob)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Place of Birth exceeds length limit (100 chars).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    pob = pob.trim();
  } else {
    pob = 'Not provided';
  }

  // message: optional string, max 3000 chars
  if (message !== undefined && message !== null && message !== '') {
    if (typeof message !== 'string' || message.length > 3000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message exceeds length limit (3000 chars).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    message = message.trim();
  } else {
    message = 'None provided';
  }

  const timestamp = new Date().toISOString();
  const subject = `New Vena Mercuri Inquiry — ${service}`;

  const textBody = [
    '=== VENA MERCURI INTAKE SUBMISSION ===',
    '',
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Service: ${service}`,
    `Date of Birth: ${dob}`,
    `Time of Birth: ${tob}`,
    `Place of Birth: ${pob}`,
    '',
    'What they are hoping to explore:',
    message,
    '',
    `Submitted at: ${timestamp}`,
    'Source: Vena Mercuri website (https://venamercuri.nfinitemindai.com)',
    '======================================='
  ].join('\n');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a24; background: #fdfbf7; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e2d8; border-radius: 8px; padding: 28px;">
    <h2 style="color: #30135c; margin-top: 0; font-size: 20px; border-bottom: 2px solid #fbd065; padding-bottom: 8px;">New Vena Mercuri Inquiry</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr><td style="padding: 6px 0; color: #6b617b; width: 140px;"><strong>Client Name:</strong></td><td style="padding: 6px 0; color: #1a1a24;">${escapeHtml(fullName)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b617b;"><strong>Client Email:</strong></td><td style="padding: 6px 0; color: #1a1a24;"><a href="mailto:${escapeHtml(email)}" style="color: #7b4397;">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding: 6px 0; color: #6b617b;"><strong>Service:</strong></td><td style="padding: 6px 0; color: #1a1a24; font-weight: 600;">${escapeHtml(service)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b617b;"><strong>Date of Birth:</strong></td><td style="padding: 6px 0; color: #1a1a24;">${escapeHtml(dob)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b617b;"><strong>Time of Birth:</strong></td><td style="padding: 6px 0; color: #1a1a24;">${escapeHtml(tob)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b617b;"><strong>Place of Birth:</strong></td><td style="padding: 6px 0; color: #1a1a24;">${escapeHtml(pob)}</td></tr>
    </table>
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee;">
      <strong style="color: #6b617b;">Hoping to explore:</strong>
      <p style="margin-top: 8px; white-space: pre-wrap; background: #faf7f2; padding: 14px; border-radius: 6px; color: #2d2638;">${escapeHtml(message)}</p>
    </div>
    <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; font-size: 12px; color: #8e839e;">
      Submitted on ${escapeHtml(timestamp)} via <a href="https://venamercuri.nfinitemindai.com" style="color: #7b4397;">venamercuri.nfinitemindai.com</a>
    </div>
  </div>
</body>
</html>
  `.trim();

  // 6. Send via Cloudflare Email Service binding
  if (env.EMAIL && typeof env.EMAIL.send === 'function') {
    try {
      await env.EMAIL.send({
        from: SENDER_EMAIL,
        to: OWNER_DESTINATION,
        replyTo: email,
        subject: subject,
        text: textBody,
        html: htmlBody
      });
    } catch (err) {
      console.error('Email dispatch error:', err);
      return new Response(
        JSON.stringify({ success: false, error: 'Email service temporary failure. Please try again later.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else {
    // If running in an environment without EMAIL binding (e.g. unit test runner without mock)
    console.warn('env.EMAIL binding not available on request environment');
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Thank you. Your inquiry has been received. I will review your details and reply shortly.'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
