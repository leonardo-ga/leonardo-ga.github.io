import * as THREE from 'three';
import InteractiveEarth from './models/InteractiveEarth';
import Stars from './models/Stars';

const root = document.documentElement;
const canvas = document.querySelector('canvas.webgl-background');
if (!canvas) throw new Error('Globe canvas is missing');

// Reject the import on texture failure so the appearance control can show a fallback.
const loader = new THREE.TextureLoader();
const siteRoot = new URL(document.querySelector('[data-home]').href);
const [starSprite, colorMap, elevMap, alphaMap] = await Promise.all([
  loader.loadAsync(new URL('textures/circle.png', siteRoot).href),
  loader.loadAsync(new URL('textures/04_rainbow1k.jpg', siteRoot).href),
  loader.loadAsync(new URL('textures/01_earthbump1k.jpg', siteRoot).href),
  loader.loadAsync(new URL('textures/02_earthspec1k.jpg', siteRoot).href)
]);

const scene = new THREE.Scene();
const earth = new InteractiveEarth({ icoDetail: 10, pointsDetail: 120, textures: { colorMap, elevMap, alphaMap } });
const stars = new Stars({ numStars: 4500, textures: { sprite: starSprite } });
scene.add(earth.model, stars.model);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 2;
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let frame = null;
let lastTime = null;

const enabled = () => root.dataset.globe === 'on' && !document.hidden;
const render = () => {
  camera.position.y = -window.scrollY * 0.001;
  renderer.render(scene, camera);
};
function animate(time) {
  frame = null;
  if (!enabled() || motionPreference.matches) return;
  const delta = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  earth.update(delta);
  render();
  frame = requestAnimationFrame(animate);
}
function syncAnimation() {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  lastTime = null;
  if (!enabled()) return;
  render();
  if (!motionPreference.matches) frame = requestAnimationFrame(animate);
}
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  if (enabled()) render();
}
function syncTheme() {
  const dark = root.dataset.theme === 'dark';
  if (stars.mat.vertexColors !== dark) {
    stars.mat.vertexColors = dark;
    stars.mat.needsUpdate = true;
  }
  stars.mat.color.set(dark ? 0xffffff : 0x4b5563);
  stars.mat.opacity = dark ? 0.85 : 0.55;
  earth.mat.color.set(dark ? 0x202020 : 0x8c949e);
  earth.mat.transparent = true;
  earth.mat.opacity = dark ? 1 : 0.25;
  earth.uniforms.colorStrength.value = dark ? 1 : 0.65;
  if (enabled()) render();
}

resize();
syncTheme();
syncAnimation();
requestAnimationFrame(() => root.classList.add('globe-ready'));
new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
window.addEventListener('globechange', syncAnimation);
document.addEventListener('visibilitychange', syncAnimation);
motionPreference.addEventListener('change', syncAnimation);
window.addEventListener('resize', resize);
window.addEventListener('scroll', () => {
  if (enabled() && motionPreference.matches) render();
}, { passive: true });
window.addEventListener('pagehide', () => {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
});
window.addEventListener('pageshow', syncAnimation);
