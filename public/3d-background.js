import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function init3DBackground() {
  const canvas = document.querySelector('#canvas3d');
  if (!canvas) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting for the "clay" look
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // Brand Colors
  const colors = [
    0xF97316, // Brand Orange
    0x8b5cf6, // Accent Purple
    0xec4899  // Accent Pink
  ];

  const shapes = [];

  // Create Spheres
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  
  for (let i = 0; i < 20; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Random position
    mesh.position.x = (Math.random() - 0.5) * 60;
    mesh.position.y = (Math.random() - 0.5) * 60;
    mesh.position.z = (Math.random() - 0.5) * 20;
    
    // Random scale
    const scale = Math.random() * 2 + 1;
    mesh.scale.set(scale, scale, scale);
    
    // Random rotation and speed parameters
    mesh.userData = {
      rx: (Math.random() - 0.5) * 0.02,
      ry: (Math.random() - 0.5) * 0.02,
      dy: (Math.random() - 0.5) * 0.05,
      startY: mesh.position.y
    };
    
    scene.add(mesh);
    shapes.push(mesh);
  }

  // Mouse Parallax
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.01;
    mouseY = (event.clientY - windowHalfY) * 0.01;
  });

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    shapes.forEach((shape, index) => {
      shape.rotation.x += shape.userData.rx;
      shape.rotation.y += shape.userData.ry;
      
      // Floating effect
      shape.position.y = shape.userData.startY + Math.sin(time + index) * 2;
    });

    renderer.render(scene, camera);
  }

  animate();

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Auto-init when loaded
window.addEventListener('DOMContentLoaded', () => {
  init3DBackground();
});
