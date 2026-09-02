/* ==========================================================================
   VENAMERCURI - Spinning Wheel of Service Controller
   Provides interactive celestial wheel navigation for practice offerings.
   ========================================================================== */

const SERVICES_DATA = [
  {
    id: 'natal-translation',
    number: 'SERVICE I',
    name: 'Natal Chart Translation',
    subtitle: 'The Architecture of Your Placements',
    description: 'A comprehensive deep dive into your natal chart placements, planetary aspects, and elemental weight. We translate what is already written into clear, practical language so you can navigate your life with precise alignment.',
    tags: ['Natal Chart', 'Aspects & Transits', 'Pattern Translation'],
    icon: '✦'
  },
  {
    id: 'placement-mastery',
    number: 'SERVICE II',
    name: 'Placement Mastery Class',
    subtitle: 'Read Your Own Celestial Map',
    description: 'An intimate, single-focused masterclass that equips you with the foundational framework to read your own chart placements, transits, and personal cycles with clarity and autonomy.',
    tags: ['Educational Masterclass', 'Self-Sufficiency', 'Transits'],
    icon: '☉'
  },
  {
    id: 'frequency-portrait',
    number: 'SERVICE III',
    name: 'Frequency & Chart Portrait',
    subtitle: 'A Portrait Built from Frequency',
    description: 'A unique chart interpretation expressed through sonic resonance and symbolic frequency portraiture rather than predictive claims. Putting your body somewhere quieter than thought.',
    tags: ['Sonic Resonance', 'Chart Frequency', 'Somatic Field'],
    icon: '☽'
  },
  {
    id: 'somatic-session',
    number: 'SERVICE IV',
    name: 'Somatic Chart Session',
    subtitle: 'Somatic Grounding & Quietude',
    description: 'A private 1-on-1 session designed to ground your astrological insights into somatic felt experience. Translating chart dynamics into practical body quietude and grounded presence.',
    tags: ['1-on-1 Session', 'Grounding', 'Somatic Integration'],
    icon: '☿'
  }
];

class SpinningWheelController {
  constructor() {
    this.ring = document.getElementById('wheel-ring-outer');
    this.nodesContainer = document.getElementById('wheel-nodes');
    this.displayContainer = document.getElementById('service-display');
    this.hub = document.getElementById('wheel-center-hub');

    if (!this.ring || !this.nodesContainer) return;

    this.currentIndex = 0;
    this.currentRotation = 0;
    this.nodeElements = [];

    this.initNodes();
    this.initInteractivity();
    this.updateDisplay(0);
  }

  initNodes() {
    this.nodesContainer.innerHTML = '';
    const count = SERVICES_DATA.length;
    const radius = 170; // radius of node circle in px

    SERVICES_DATA.forEach((service, idx) => {
      const angle = (idx * (360 / count) - 90) * (Math.PI / 180);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const node = document.createElement('div');
      node.className = `wheel-node ${idx === 0 ? 'active' : ''}`;
      node.style.transform = `translate(${x}px, ${y}px)`;
      node.dataset.index = idx;
      node.setAttribute('title', service.name);

      node.innerHTML = `<span class="wheel-node-icon">${service.icon}</span>`;

      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectIndex(idx);
      });

      this.nodesContainer.appendChild(node);
      this.nodeElements.push(node);
    });

    if (this.hub) {
      this.hub.addEventListener('click', () => {
        const nextIdx = (this.currentIndex + 1) % SERVICES_DATA.length;
        this.selectIndex(nextIdx);
      });
    }
  }

  initInteractivity() {
    let isDragging = false;
    let startAngle = 0;
    let startRotation = 0;

    const getAngle = (e) => {
      const rect = this.ring.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    };

    const startDrag = (e) => {
      isDragging = true;
      startAngle = getAngle(e);
      startRotation = this.currentRotation;
      this.ring.style.transition = 'none';
    };

    const doDrag = (e) => {
      if (!isDragging) return;
      const currentAngle = getAngle(e);
      const delta = currentAngle - startAngle;
      this.currentRotation = startRotation + delta;
      this.ring.style.transform = `rotate(${this.currentRotation}deg)`;
    };

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      this.ring.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      
      // Snap to nearest service
      const count = SERVICES_DATA.length;
      const step = 360 / count;
      const nearestIndex = (Math.round(-this.currentRotation / step) % count + count) % count;
      this.selectIndex(nearestIndex);
    };

    this.ring.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);

    this.ring.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', doDrag, { passive: true });
    window.addEventListener('touchend', stopDrag);
  }

  selectIndex(index) {
    this.currentIndex = index;
    const count = SERVICES_DATA.length;
    const step = 360 / count;

    this.currentRotation = -index * step;
    this.ring.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    this.ring.style.transform = `rotate(${this.currentRotation}deg)`;

    // Counter rotate nodes to keep icons upright
    this.nodeElements.forEach((node, idx) => {
      if (idx === index) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    this.updateDisplay(index);
  }

  updateDisplay(index) {
    const service = SERVICES_DATA[index];
    if (!this.displayContainer || !service) return;

    this.displayContainer.innerHTML = `
      <div class="service-card">
        <div class="service-number">${service.number} • ${service.subtitle}</div>
        <h3 class="service-name">${service.name}</h3>
        <p class="service-description">${service.description}</p>
        <div class="service-tags">
          ${service.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')}
        </div>
        <button class="btn-primary" onclick="selectServiceForLead('${service.name}')">
          Request This Session &rarr;
        </button>
      </div>
    `;
  }
}

// Global helper to select service in lead form
window.selectServiceForLead = function(serviceName) {
  const selectElem = document.getElementById('lead-service');
  if (selectElem) {
    selectElem.value = serviceName;
  }
  const contactSec = document.getElementById('contact');
  if (contactSec) {
    contactSec.scrollIntoView({ behavior: 'smooth' });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.wheelInstance = new SpinningWheelController();
});
