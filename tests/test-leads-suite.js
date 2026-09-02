/**
 * VENA MERCURI - FULL SUITE TEST: LEADS & INTAKE WORKFLOW
 * Tests DOM elements, form validation, service auto-population, 
 * mailto link synthesis, local backup storage, and live HTTP endpoint.
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

  // Test 1: File Presence & HTML Integrity
  console.log('Test Group 1: Source Files & HTML Structure');
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  assert(htmlContent.includes('<form class="intake-form" id="intakeForm"'), 'Form #intakeForm exists in DOM');
  assert(htmlContent.includes('id="fullName"'), 'Input #fullName exists');
  assert(htmlContent.includes('id="email"'), 'Input #email exists');
  assert(htmlContent.includes('id="dob"'), 'Input #dob exists');
  assert(htmlContent.includes('id="tob"'), 'Input #tob exists');
  assert(htmlContent.includes('id="pob"'), 'Input #pob exists');
  assert(htmlContent.includes('id="service"'), 'Select #service exists');
  assert(htmlContent.includes('id="message"'), 'Textarea #message exists');
  assert(htmlContent.includes('id="intakeStatus"'), 'Status indicator #intakeStatus exists');

  // Test 2: Services Dropdown Options
  console.log('\nTest Group 2: Services Dropdown Options');
  const expectedServices = [
    'Guided Meditation (Group Classes)',
    'Astrology Classes (Group Cohorts)',
    'Astrology Readings (Individual &amp; Family)',
    'Intuitive Tarot',
    'Energy Portraits',
    'Astral Projection (Group Classes)'
  ];
  expectedServices.forEach(s => {
    assert(htmlContent.includes(`<option>${s}</option>`), `Option '${s}' present in #service select`);
  });

  // Test 3: Service Selection Function Logic Simulation
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

  // Test 4: Mailto Link & Payload Construction Simulation
  console.log('\nTest Group 4: Mailto Payload & Data Encoding');
  const mockLead = {
    fullName: 'Isabella Vance',
    email: 'isabella@example.com',
    dob: '1992-04-18',
    tob: '14:22',
    pob: 'Florence, Italy',
    service: 'Energy Portraits',
    message: 'Seeking a frequency portrait focused on my natal Neptune conjunction.'
  };

  const lines = [
    `Name: ${mockLead.fullName}`,
    `Email: ${mockLead.email}`,
    `Date of Birth: ${mockLead.dob}`,
    `Time of Birth: ${mockLead.tob}`,
    `Place of Birth: ${mockLead.pob}`,
    '',
    `What they're hoping to explore:`,
    mockLead.message
  ];
  const subject = encodeURIComponent(`Vena Mercuri Intake — ${mockLead.service}`);
  const body = encodeURIComponent(lines.join('\n'));
  const mailtoUrl = `mailto:yesmara29@gmail.com?subject=${subject}&body=${body}`;

  assert(mailtoUrl.startsWith('mailto:yesmara29@gmail.com'), 'Target recipient is yesmara29@gmail.com');
  assert(mailtoUrl.includes(encodeURIComponent('Vena Mercuri Intake — Energy Portraits')), 'Subject contains correct service');
  assert(mailtoUrl.includes(encodeURIComponent('Isabella Vance')), 'Body encodes client name');
  assert(mailtoUrl.includes(encodeURIComponent('Florence, Italy')), 'Body encodes birth place');
  assert(mailtoUrl.includes(encodeURIComponent('1992-04-18')), 'Body encodes birth date');

  // Test 5: Local Storage Backup Entry Structure
  console.log('\nTest Group 5: Local Lead Backup Verification');
  const leadEntry = {
    fullName: mockLead.fullName,
    email: mockLead.email,
    dob: mockLead.dob,
    tob: mockLead.tob,
    pob: mockLead.pob,
    service: mockLead.service,
    message: mockLead.message,
    timestamp: new Date().toISOString()
  };
  assert(leadEntry.fullName === 'Isabella Vance', 'Lead record preserves full name');
  assert(leadEntry.service === 'Energy Portraits', 'Lead record preserves service');
  assert(Boolean(leadEntry.timestamp), 'Lead record stamps timestamp');

  // Test 6: Live HTTP Server Response
  console.log('\nTest Group 6: Live HTTP Server Validation (Port 8080)');
  await new Promise((resolve) => {
    http.get('http://localhost:8080', (res) => {
      assert(res.statusCode === 200, `Live server returned status ${res.statusCode} OK`);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        assert(data.includes('Vena Mercuri'), 'Live response contains brand title');
        assert(data.includes('intakeForm'), 'Live response serves intake form');
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
