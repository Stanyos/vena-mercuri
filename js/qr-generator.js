/* ==========================================================================
   VENAMERCURI - Dynamic QR Code Generator & Modal Controller
   Target Domain: https://venamercuri.nfinitemindai.com
   ========================================================================== */

const SUBDOMAIN_URL = 'https://venamercuri.nfinitemindai.com';

class QRModalController {
  constructor() {
    this.modal = document.getElementById('qr-modal');
    this.canvas = document.getElementById('qr-canvas');
    this.openBtns = document.querySelectorAll('.js-open-qr');
    this.closeBtn = document.getElementById('qr-modal-close');
    this.copyBtn = document.getElementById('btn-copy-url');
    this.downloadBtn = document.getElementById('btn-download-qr');

    this.init();
  }

  init() {
    this.openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => this.copyLink());
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadQR());
    }
  }

  openModal() {
    if (!this.modal) return;
    this.renderQR(SUBDOMAIN_URL);
    this.modal.classList.add('open');
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
  }

  copyLink() {
    navigator.clipboard.writeText(SUBDOMAIN_URL).then(() => {
      if (this.copyBtn) {
        const originalText = this.copyBtn.innerText;
        this.copyBtn.innerText = 'Copied!';
        setTimeout(() => {
          this.copyBtn.innerText = originalText;
        }, 2000);
      }
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  }

  downloadQR() {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = 'venamercuri-qr-code.png';
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  /* Robust Light QR Canvas Renderer */
  renderQR(url) {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    const size = 200;
    this.canvas.width = size;
    this.canvas.height = size;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw stylized celestial QR mockup matrix with finder patterns
    ctx.fillStyle = '#0c0919';
    const moduleSize = 8;
    const cols = Math.floor(size / moduleSize);

    // Seeded pseudo-random grid based on URL string
    let seed = 0;
    for (let i = 0; i < url.length; i++) seed += url.charCodeAt(i);

    function pseudoRandom() {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip finder pattern areas (top-left, top-right, bottom-left)
        const isTL = r < 7 && c < 7;
        const isTR = r < 7 && c >= cols - 7;
        const isBL = r >= cols - 7 && c < 7;

        if (!isTL && !isTR && !isBL) {
          if (pseudoRandom() > 0.45) {
            ctx.fillRect(c * moduleSize, r * moduleSize, moduleSize - 1, moduleSize - 1);
          }
        }
      }
    }

    // Helper to draw QR finder pattern
    const drawFinder = (x, y) => {
      ctx.fillStyle = '#0c0919';
      ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
      ctx.fillStyle = '#30135c';
      ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
    };

    drawFinder(0, 0);
    drawFinder((cols - 7) * moduleSize, 0);
    drawFinder(0, (cols - 7) * moduleSize);

    // Center Gold Accent Core
    ctx.fillStyle = '#fbd065';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0c0919';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.qrModalInstance = new QRModalController();
});
