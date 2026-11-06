import * as THREE from 'three';

export default class Stars {

    constructor(params = {}) {
        this.loadParameters(params);
        this.loadModel();
    }

    loadParameters(params) {
        this.numStars = params.numStars || 500;
        this.sprite = params.textures.sprite;
    }

    loadModel() {
        const verts = [];
        const colors = [];
        let col;
        for (let i = 0; i < this.numStars; i += 1) {
            let p = this.randomSpherePoint();
            const { pos, hue } = p;
            col = new THREE.Color().setHSL(hue, 0.2, Math.random());
            verts.push(pos.x, pos.y, pos.z);
            colors.push(col.r, col.g, col.b);
        }

        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
        this.geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

        this.mat = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            alphaMap: this.sprite,
            transparent: true,
            depthWrite: false
        });

        this.model = new THREE.Points(this.geo, this.mat);
    }

    randomSpherePoint() {
        const radius = Math.random() * 25 + 25;
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        let x = radius * Math.sin(phi) * Math.cos(theta);
        let y = radius * Math.sin(phi) * Math.sin(theta);
        let z = radius * Math.cos(phi);

        return {
            pos: new THREE.Vector3(x, y, z),
            hue: 0.6,
        };
    }

}
