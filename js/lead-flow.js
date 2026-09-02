/* ==========================================================================
   VENAMERCURI - Contact & Lead Flow Controller
   Handles natal chart intake validation and submission state.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  const formWrapper = document.getElementById('lead-form-content');
  const successCard = document.getElementById('lead-success-card');
  const resetBtn = document.getElementById('btn-reset-lead');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Field Validation
    const name = document.getElementById('lead-name')?.value.trim();
    const email = document.getElementById('lead-email')?.value.trim();
    const dob = document.getElementById('lead-dob')?.value;
    const birthplace = document.getElementById('lead-birthplace')?.value.trim();
    const service = document.getElementById('lead-service')?.value;
    const notes = document.getElementById('lead-notes')?.value.trim();

    if (!name || !email || !dob || !birthplace) {
      alert('Please complete all required fields (Name, Email, Date of Birth, and Birth City).');
      return;
    }

    const leadData = {
      name,
      email,
      dob,
      time: document.getElementById('lead-tob')?.value || 'Unknown',
      birthplace,
      service: service || 'General Inquiry',
      notes: notes || '',
      submittedAt: new Date().toISOString()
    };

    // Store lead locally for persistence demonstration
    try {
      const existing = JSON.parse(localStorage.getItem('venamercuri_leads') || '[]');
      existing.push(leadData);
      localStorage.setItem('venamercuri_leads', JSON.stringify(existing));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }

    // Toggle view to success card with smooth transition
    if (formWrapper && successCard) {
      formWrapper.style.display = 'none';
      successCard.classList.add('active');
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (form) form.reset();
      if (formWrapper && successCard) {
        successCard.classList.remove('active');
        formWrapper.style.display = 'block';
      }
    });
  }
});
