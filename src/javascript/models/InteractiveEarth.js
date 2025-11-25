import * as THREE from 'three';

export default class InteractiveEarth {

  constructor(textures) {
    this.loadTextures(textures);
    this.loadModel();
  }

  loadTextures(textures) {
    this.colorMap = textures.colorMap;
    this.elevMap = textures.elevMap;
    this.alphaMap = textures.alphaMap;
  }

  loadModel() {
    this.model = new THREE.Group();
    this.geo = new THREE.IcosahedronGeometry(1, 10);
    this.mat = new THREE.MeshBasicMaterial({
        color: 0x202020,
        wireframe: true
    });
    this.cube = new THREE.Mesh(this.geo, this.mat);
    this.model.add(this.cube);
    //
    const detail = 120;
    this.pointsGeo = new THREE.IcosahedronGeometry(1, detail);
    this.loadShaders();
    this.pointsMat = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        transparent: true
    });
    this.points = new THREE.Points(this.pointsGeo, this.pointsMat);
    this.model.add(this.points);
  }

  loadShaders() {
    this.vertexShader = `
        uniform float size;
        uniform sampler2D elevTexture;

        varying vec2 vUv;
        varying float vVisible;

        void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            float elv = texture2D(elevTexture, vUv).r;
            vec3 vNormal = normalMatrix * normal;
            vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
            mvPosition.z += 0.15 * elv;
            gl_PointSize = size;
            gl_Position = projectionMatrix * mvPosition;
        }
    `;
    this.fragmentShader = `
        uniform sampler2D colorTexture;
        uniform sampler2D alphaTexture;

        varying vec2 vUv;
        varying float vVisible;

        void main() {
            if (floor(vVisible + 0.1) == 0.0) discard;
            float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
            vec3 color = texture2D(colorTexture, vUv).rgb;
            gl_FragColor = vec4(color, alpha);
        }
    `;
    this.uniforms = {
        size: { type: "f", value: 4.0 },
        colorTexture: { type: "t", value: this.colorMap },
        elevTexture: { type: "t", value: this.elevMap },
        alphaTexture: { type: "t", value: this.alphaMap }
    };
  }
  
}