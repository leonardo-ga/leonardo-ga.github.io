import * as THREE from 'three';
import InteractiveEarth from './models/InteractiveEarth';
import getStarfield from './models/getStarfield';

// Canvas
const canvas = document.querySelector('canvas.webgl-background')

// Sizes
const sizes = { width: window.innerWidth, height: window.innerHeight };

// Scene
const scene = new THREE.Scene();

// Earth and Stars
const textureLoader = new THREE.TextureLoader();
const starSprite = textureLoader.load("./textures/circle.png");
const colorMap = textureLoader.load("./textures/04_rainbow1k.jpg");
const elevMap = textureLoader.load("./textures/01_earthbump1k.jpg");
const alphaMap = textureLoader.load("./textures/02_earthspec1k.jpg");

const earth = new InteractiveEarth({
    colorMap,
    elevMap,
    alphaMap
});
scene.add(earth.model);

const stars = getStarfield({
    numStars: 4500,
    sprite: starSprite
});
scene.add(stars);

// Lights
/*const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);*/
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 3);
scene.add(hemiLight);

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 2;
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Track scroll
let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// Animate
function animate() {
    requestAnimationFrame(animate);

    // Rotate Earth
    earth.model.rotation.y += 0.002;

    // Parallax effect based on scroll
    camera.position.y = -scrollY * 0.001;  // subtle vertical parallax

    renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
});
