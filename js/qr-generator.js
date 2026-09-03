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

  /* Standard Valid QR Canvas Renderer */
  renderQR(url) {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    const size = 200;
    this.canvas.width = size;
    this.canvas.height = size;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Standard ISO/IEC 18004 QR Matrix (Version 3-M) for https://venamercuri.nfinitemindai.com
    const qrMatrix = [
      '11111110010110100010001111111',
      '10000010110110101010001000001',
      '10111010100100101001101011101',
      '10111010110100111100101011101',
      '10111010011001001111101011101',
      '10000010000001101100001000001',
      '11111110101010101010101111111',
      '00000000100011010011100000000',
      '10000010101000110101011001110',
      '10111101010010110111000110110',
      '01001010101100010010001110000',
      '10010101100110111001110011000',
      '00101110010001101000101100001',
      '01110101100101110001001110011',
      '11101010000111111000100001100',
      '11001001100011101010111100101',
      '10110111110110100101000001100',
      '10101100101000011011111110111',
      '11110011000111110101111011001',
      '10111001111010100001001110000',
      '10011010010110010100111110111',
      '00000000111101010111100011000',
      '11111110011111110001101011100',
      '10000010001101001001100010010',
      '10111010000111011001111111001',
      '10111010001011011111010001101',
      '10111010010011010011011111110',
      '10000010010100010001001001101',
      '11111110110001000101001111100'
    ];

    const border = 2;
    const cols = qrMatrix.length;
    const totalCols = cols + border * 2;
    const moduleSize = Math.floor(size / totalCols);
    const offset = Math.floor((size - totalCols * moduleSize) / 2);

    ctx.fillStyle = '#08070c';
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        if (qrMatrix[r][c] === '1') {
          ctx.fillRect(
            offset + (c + border) * moduleSize,
            offset + (r + border) * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.qrModalInstance = new QRModalController();
});
