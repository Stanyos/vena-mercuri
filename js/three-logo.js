/* ==========================================================================
   VENAMERCURI - WebGL 3D Logo Engine (Three.js)
   Renders the icosahedron amethyst crystal core with gold wireframe cage.
   ========================================================================== */

class Venamercuri3DLogo {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      radius: 1.25,
      cameraZ: 4.2,
      showStars: true,
      starCount: 60,
      interactive: true
    }, options);

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 320;
    const height = this.container.clientHeight || 320;

    // 1. Scene, Camera, Transparent Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = this.options.cameraZ;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const warmKeyLight = new THREE.PointLight(0xffd56b, 2.5, 50);
    warmKeyLight.position.set(6, 6, 6);
    this.scene.add(warmKeyLight);

    const coolRimLight = new THREE.PointLight(0x8a6aff, 2.0, 50);
    coolRimLight.position.set(-6, -4, -3);
    this.scene.add(coolRimLight);

    // 3. Icosahedron Crystal & Wireframe
    const radius = this.options.radius;
    const geometry = new THREE.IcosahedronGeometry(radius, 0);

    // Deep amethyst-crystal core
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x30135c,
      emissive: 0x160a2b,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.65,
      opacity: 0.9,
      transparent: true,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    this.crystalMesh = new THREE.Mesh(geometry, crystalMaterial);

    // Bright golden wireframe cage
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xfbd065,
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });
    this.wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    // Grouping
    this.icosahedronGroup = new THREE.Group();
    this.icosahedronGroup.add(this.crystalMesh);
    this.icosahedronGroup.add(this.wireframeMesh);
    this.scene.add(this.icosahedronGroup);

    // 4. Ambient Particle Stars (Optional)
    if (this.options.showStars) {
      const starGeometry = new THREE.BufferGeometry();
      const starCount = this.options.starCount;
      const starPositions = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 8;
        starPositions[i + 1] = (Math.random() - 0.5) * 8;
        starPositions[i + 2] = (Math.random() - 0.5) * 4;
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffe9a0,
        size: 0.04,
        transparent: true,
        opacity: 0.6
      });
      this.starField = new THREE.Points(starGeometry, starMaterial);
      this.scene.add(this.starField);
    }

    // 5. Mouse Interaction
    this.targetRotationX = 0;
    this.targetRotationY = 0;

    if (this.options.interactive) {
      window.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
        const mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
        this.targetRotationY = mouseX;
        this.targetRotationX = mouseY;
      });
    }

    // 6. Animation
    this.clock = new THREE.Clock();
    this.animate();

    // 7. Resize listener
    window.addEventListener('resize', () => this.onResize());
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const elapsedTime = this.clock.getElapsedTime();

    // Multi-axis rotation + mouse offset
    this.icosahedronGroup.rotation.x = elapsedTime * 0.35 + this.targetRotationX;
    this.icosahedronGroup.rotation.y = elapsedTime * 0.45 + this.targetRotationY;
    this.icosahedronGroup.rotation.z = Math.sin(elapsedTime * 0.2) * 0.1;

    // Gentle floating bob
    this.icosahedronGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.08;

    // Subtle star drift
    if (this.starField) {
      this.starField.rotation.y = elapsedTime * 0.03;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w && h) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }
  }
}

// Global initialization helper
document.addEventListener('DOMContentLoaded', () => {
  if (typeof THREE !== 'undefined') {
    // Hero 3D Logo
    if (document.getElementById('hero-3d-canvas')) {
      new Venamercuri3DLogo('hero-3d-canvas', { radius: 1.25, cameraZ: 4.2, showStars: true });
    }
    // Header Mini-Logo
    if (document.getElementById('header-3d-canvas')) {
      new Venamercuri3DLogo('header-3d-canvas', { radius: 1.25, cameraZ: 4.2, showStars: false, interactive: false });
    }
    // Wheel Hub Mini-Logo
    if (document.getElementById('hub-3d-canvas')) {
      new Venamercuri3DLogo('hub-3d-canvas', { radius: 1.25, cameraZ: 4.2, showStars: false, interactive: false });
    }
  }
});
