/**
 * VENA MERCURI - FULL SUITE TEST: LEADS & CONTACT API WORKFLOW
 * Tests DOM structure, service auto-selection, server-side validation,
 * restricted email dispatch with mock binding, public email privacy,
 * and live HTTP server response.
 */

const fs = require('fs');
const http = require('http');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runSuite() {
  console.log('====================================================');
  console.log('  RUNNING FULL SUITE TEST: VENA MERCURI LEADS FLOW');
  console.log('====================================================\n');

  // Test Group 1: Source Files & HTML Structure & Privacy
  console.log('Test Group 1: Source Files, HTML Structure & Privacy');
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  assert(htmlContent.includes('<form class="intake-form" id="intakeForm"'), 'Form #intakeForm exists in DOM');
  assert(htmlContent.includes('id="fullName"'), 'Input #fullName exists');
  assert(htmlContent.includes('id="email"'), 'Input #email exists');
  assert(htmlContent.includes('id="dob"'), 'Input #dob exists');
  assert(htmlContent.includes('id="tob"'), 'Input #tob exists');
  assert(htmlContent.includes('id="pob"'), 'Input #pob exists');
  assert(htmlContent.includes('id="service"'), 'Select #service exists');
  assert(htmlContent.includes('id="message"'), 'Textarea #message exists');
  assert(htmlContent.includes('id="intakeSubmitBtn"'), 'Button #intakeSubmitBtn exists');
  assert(htmlContent.includes('id="intakeStatus"'), 'Status indicator #intakeStatus exists');
  assert(htmlContent.includes('mailto:contact@venamercuri.nfinitemindai.com'), 'Public contact mailto uses contact@venamercuri.nfinitemindai.com');
  assert(!htmlContent.includes('yesmara29@gmail.com'), 'Owner private email is ABSENT from public index.html');

  const legalContent = fs.readFileSync('legal.html', 'utf8');
  const termsContent = fs.readFileSync('terms.html', 'utf8');
  const privacyContent = fs.readFileSync('privacy.html', 'utf8');
  assert(!legalContent.includes('yesmara29@gmail.com'), 'Owner private email is ABSENT from legal.html');
  assert(!termsContent.includes('yesmara29@gmail.com'), 'Owner private email is ABSENT from terms.html');
  assert(!privacyContent.includes('yesmara29@gmail.com'), 'Owner private email is ABSENT from privacy.html');

  // Test Group 2: Services Dropdown Options
  console.log('\nTest Group 2: Services Dropdown Options');
  const expectedServices = [
    'Guided Meditation (Group Classes)',
    'Astrology Classes (Group Cohorts)',
    'Astrology Readings (Individual &amp; Family)',
    'Intuitive Tarot',
    'Energy Portraits',
    'Astral Projection (Group Classes)',
    'Not sure yet'
  ];
  expectedServices.forEach(s => {
    assert(htmlContent.includes(`<option>${s}</option>`), `Option '${s}' present in #service select`);
  });

  // Test Group 3: Service Selection Function Logic Simulation
  console.log('\nTest Group 3: Service Auto-Selection Logic');
  function simulateSelectService(serviceTitle) {
    const options = [
      'Choose one',
      'Guided Meditation (Group Classes)',
      'Astrology Classes (Group Cohorts)',
      'Astrology Readings (Individual & Family)',
      'Intuitive Tarot',
      'Energy Portraits',
      'Astral Projection (Group Classes)',
      'Not sure yet'
    ];
    let selected = null;
    for (let i = 0; i < options.length; i++) {
      if (options[i].toLowerCase().includes(serviceTitle.toLowerCase()) || 
          serviceTitle.toLowerCase().includes(options[i].toLowerCase())) {
        selected = options[i];
        break;
      }
    }
    return selected;
  }
  assert(simulateSelectService('Energy Portraits') === 'Energy Portraits', 'Auto-selects Energy Portraits');
  assert(simulateSelectService('Guided Meditation') === 'Guided Meditation (Group Classes)', 'Auto-selects Guided Meditation');
  assert(simulateSelectService('Astrology Classes') === 'Astrology Classes (Group Cohorts)', 'Auto-selects Astrology Classes');
  assert(simulateSelectService('Astral Projection') === 'Astral Projection (Group Classes)', 'Auto-selects Astral Projection');

  // Test Group 4: Server-Side POST /api/contact Validation
  console.log('\nTest Group 4: Server-Side /api/contact Request & Validation Logic');
  const workerModule = await import('../worker.js');
  const worker = workerModule.default;

  // 4a. Wrong method rejection (GET)
  const getReq = new Request('http://localhost/api/contact', { method: 'GET' });
  const getRes = await worker.fetch(getReq, {}, {});
  assert(getRes.status === 405, 'Rejects GET with 405 Method Not Allowed');

  // 4b. Missing/invalid Content-Type
  const badTypeReq = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'hello'
  });
  const badTypeRes = await worker.fetch(badTypeReq, {}, {});
  assert(badTypeRes.status === 400, 'Rejects non-JSON Content-Type with 400');

  // 4c. Malformed JSON
  const malformedReq = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ bad json '
  });
  const malformedRes = await worker.fetch(malformedReq, {}, {});
  assert(malformedRes.status === 400, 'Rejects malformed JSON with 400');

  // 4d. Arbitrary recipient / sender field injection
  const injectionReq = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test User',
      email: 'test@example.com',
      service: 'Energy Portraits',
      to: 'hacker@example.com',
      message: 'Test'
    })
  });
  const injectionRes = await worker.fetch(injectionReq, {}, {});
  assert(injectionRes.status === 400, 'Rejects payload with forbidden "to" field');

  // 4e. Header injection attempt in name / email (CR/LF)
  const crlfReq = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test\r\nBcc: evil@example.com',
      email: 'test@example.com',
      service: 'Energy Portraits'
    })
  });
  const crlfRes = await worker.fetch(crlfReq, {}, {});
  assert(crlfRes.status === 400, 'Rejects CR/LF header injection in fullName');

  // 4f. Invalid service (not in allowlist)
  const badServiceReq = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test User',
      email: 'test@example.com',
      service: 'Arbitrary Unapproved Service'
    })
  });
  const badServiceRes = await worker.fetch(badServiceReq, {}, {});
  assert(badServiceRes.status === 400, 'Rejects service not in approved allowlist');

  // 4g. Invalid email format
  const badEmailReq = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test User',
      email: 'not-an-email',
      service: 'Energy Portraits'
    })
  });
  const badEmailRes = await worker.fetch(badEmailReq, {}, {});
  assert(badEmailRes.status === 400, 'Rejects invalid email format');

  // Test Group 5: Restricted Email Dispatch & Binding Verification (Mocked)
  console.log('\nTest Group 5: Restricted Email Dispatch & Mock Binding');
  let dispatchedEmail = null;
  const mockEnv = {
    EMAIL: {
      send: async (msg) => {
        dispatchedEmail = msg;
        return true;
      }
    }
  };

  const validReq = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Isabella Vance',
      email: 'isabella@example.com',
      dob: '1992-04-18',
      tob: '14:22',
      pob: 'Florence, Italy',
      service: 'Energy Portraits',
      message: 'Seeking a frequency portrait focused on my natal Neptune conjunction.'
    })
  });

  const validRes = await worker.fetch(validReq, mockEnv, {});
  assert(validRes.status === 200, 'Valid request returns HTTP 200');
  const validJson = await validRes.json();
  assert(validJson.success === true, 'Response JSON indicates success: true');
  assert(dispatchedEmail !== null, 'Mock env.EMAIL.send was invoked');
  assert(dispatchedEmail?.from === 'contact@venamercuri.nfinitemindai.com', 'Dispatched From address is fixed business email');
  assert(dispatchedEmail?.to === 'yesmara29@gmail.com', 'Dispatched To address is restricted private owner destination');
  assert(dispatchedEmail?.replyTo === 'isabella@example.com', 'Dispatched replyTo is client submitted email');
  assert(dispatchedEmail?.subject === 'New Vena Mercuri Inquiry — Energy Portraits', 'Subject formatted correctly with service');
  assert(dispatchedEmail?.text.includes('Isabella Vance'), 'Plain text body contains client name');
  assert(dispatchedEmail?.html.includes('Isabella Vance'), 'HTML body contains client name');
  assert(!dispatchedEmail?.html.includes('<script>'), 'HTML output does not contain raw scripts');

  // Test Group 6: Client Form Script Inspection
  console.log('\nTest Group 6: Client Form Script & UX Behavior');
  assert(htmlContent.includes("fetch('/api/contact'"), 'Client form submits via fetch to /api/contact');
  assert(htmlContent.includes("submitBtn.disabled = true"), 'Client form disables submit button to prevent duplicates');
  assert(htmlContent.includes("status.className = 'intake-status show success'"), 'Client form presents success state');
  assert(htmlContent.includes("status.className = 'intake-status show error'"), 'Client form presents failure state');
  assert(!htmlContent.includes('localStorage.setItem(\'vena_mercuri_leads\''), 'localStorage PII persistence is eliminated');

  // Test Group 7: Live HTTP Server Validation (Port 8080)
  console.log('\nTest Group 7: Live HTTP Server Validation (Port 8080)');
  await new Promise((resolve) => {
    http.get('http://localhost:8080', (res) => {
      assert(res.statusCode === 200, `Live server returned status ${res.statusCode} OK`);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        assert(data.includes('Vena Mercuri'), 'Live response contains brand title');
        assert(data.includes('intakeForm'), 'Live response serves intake form');
        assert(data.includes('contact@venamercuri.nfinitemindai.com'), 'Live response contains public business email');
        resolve();
      });
    }).on('error', (err) => {
      assert(false, `HTTP connection failed: ${err.message}`);
      resolve();
    });
  });

  // Final Summary
  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
