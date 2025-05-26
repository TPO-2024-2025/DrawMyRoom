import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
    _instance = null;

    model = null;

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(
        400 / - 2,
        400 / 2,
        400 / 2,
        400 / - 2,
        -1000,
        1000
    );

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    userPressedDown = false;
    userPressedUp = false;
    userAddingDevice = false;

    renderer = null;
    canvas = null;


    static getInstance() {
        if (!this._instance) {
            this._instance = new SceneManager();
        }
        return this._instance;
    }
    init(canvas, sceneView) {
        this.canvas = canvas;
        this.sceneView = sceneView;

        // const camera = new THREE.PerspectiveCamera(75, 400 / 400, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,    // transparent background
            antialias: true, // smooth edges
            canvas: canvas,
        });

        this.renderer.setSize(canvas.width, canvas.height);
        // Shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.scene.add(this.camera);

        // Set up orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.maxPolarAngle = Math.PI - Math.PI / 2 - 0.05;
        this.controls.minPolarAngle = 0;
        this.controls.minZoom = 1;
        this.controls.target.set(0, 2, 0);
        this.camera.lookAt(this.controls.target);

        // Add event listeners for pointer and mouse events
        canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    }
    start() {
        if (this.frameId) {
            return;
        }
        this.renderLoop();
    }
    stop() {
        cancelAnimationFrame(this.frameId);
        this.frameId = null;
    }

    calculatePointer(event) {
        if (!this.pointer || !this.renderer) {
            return;
        }

        let rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
        this.pointer.y = - ((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;
    }

    onPointerMove(event) {
        if (!this.pointer || !this.renderer) {
            return;
        }
        this.calculatePointer(event);
        this.userPressedDown = false;
        this.userPressedUp = false;
    }

    onMouseDown(event) {
        this.calculatePointer(event);
        this.userPressedDown = true;
    }

    onMouseUp(event) {
        this.userPressedUp = true;
    }

    renderLoop() {
        this.frameId = requestAnimationFrame(() => {
            this.renderLoop();
        });

        this.checkIntersections();

        this.renderer.render(this.scene, this.camera);
    }

    checkIntersections() {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        if (!this.userPressedDown || !this.userPressedUp) {
            return; // No user interaction, skip intersection checks
        }
        // Raycaster logic

        this.checkDeviceIntersections();
        

        this.userPressedDown = false;
        this.userPressedUp = false;
    }

    checkDeviceIntersections() {
        // calculate objects intersecting the picking ray
        const devices = this.model.devices;

        for (const device of devices) {
            const intersects = this.raycaster.intersectObjects(device.mesh.children.length > 0 ? device.mesh.children : [device.mesh]);

            if (intersects.length !== 0) {
                device.onClick();
                break;
            }
        }
    }

    getIntersectionObjects() {
        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length > 0) {
            return intersects;
        }
        return [];
    }

    getIntersection() {
        // calculate objects intersecting the picking ray
        const intersects = this.getIntersectionObjects();
        if (intersects.length > 0) {
            return intersects[0];
        }
        return null;
    }

    displayScene(data /* SceneData */, model) {
        // Convert data to actual scene
        console.log('displayScene', data);
        while (data.objects.children.length > 0) {
            this.scene.add(data.objects.children[0]);
        }
        this.scene.add(data.devices);
        this.camera.position.set(data.averagePosition.x + 5, 5, data.averagePosition.z + 5);
        this.controls.target.set(data.averagePosition.x, 0.5, data.averagePosition.z);
        this.camera.lookAt(this.controls.target);
        this.camera.updateProjectionMatrix();

        this.model = model;

        // this.sceneView.displayScene(scene);
    }
    getScene() {
        return this.scene;
    }
    resize() {
        if (!this.canvas) {
            console.log('Canvas not initialized resize()');
            return;
        }
        // Set the canvas internal dimensions to match its CSS dimensions of parent element
        const width = this.canvas.parentElement.clientWidth;
        const height = this.canvas.parentElement.clientHeight;
        this.canvas.width = width;
        this.canvas.height = height;

        this.camera.left = width / - 20;
        this.camera.right = width / 20;
        this.camera.top = height / 20;
        this.camera.bottom = height / - 20;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio)

        // Update the camera aspect ratio and projection matrix

    }

    setContext(hass, config, deviceAdapter) {
        this.hass = hass;
        this.config = config;
        this.deviceAdapter = deviceAdapter;
    }
}