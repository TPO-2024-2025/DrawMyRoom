import { Device3D } from './device3D.js';
import { ThreeJSFacade } from './threeJSFacade.js';
import * as THREE from 'three';

export class DeviceFactory {
    /**
     * @type {ThreeJSFacade}
     */
    facade;

    constructor() {
        this.facade = new ThreeJSFacade();
    }

    /**
     * Create a 3D device based on specified type
     * @param {string} type - Device type (e.g. "switch", "light")
     * @param {HomeAssistantAPI} api - Reference to HA API for later connectivity
     * @returns {Device3D|null} Created device or null if type not supported
     */
    createDevice(type, api) {
        // Generate unique ID for this device
        const deviceId = `${type}_${Math.floor(Math.random() * 10000)}`;
        
        // Create base device
        const device = new Device3D(deviceId);
        
        // Handle specific device types
        switch (type.toLowerCase()) {
            case 'switch':
                return this.createSwitch(device);
            case 'light':
                return this.createLight(device);
            case 'sensor':
                return this.createSensor(device);
            default:
                console.warn(`Unknown device type: ${type}`);
                return this.createGenericDevice(device);
        }
    }

    /**
     * Create a switch device
     * @param {Device3D} device - Base device object
     * @returns {Device3D} Configured device
     */
    createSwitch(device) {
        console.log("Creating switch device");
        // Create a temporary mesh while model loads
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshLambertMaterial({ color: 0xFF8888 });
        device.mesh = new THREE.Mesh(geometry, material);
        
        // Load actual model asynchronously
        this.facade.loadModel('/local/models3d/switch.glb').then(model => {
            // When model loads, replace the temporary mesh
            if (model) {
                // Remove temporary mesh if it's in a scene
                if (device.mesh.parent) {
                    const parent = device.mesh.parent;
                    parent.remove(device.mesh);
                    parent.add(model);
                }

                if (device.mesh.material) {
                    // Copy material properties if needed
                    model.material = device.mesh.material;
                }
                
                // Update device mesh
                device.mesh = model;
                
                // Restore position
                console.log("Restoring position here. Original: ", device.position);
                if (device.position) {
                    device.mesh.position.copy(device.position);
                }
                console.log("Restoring rotation here. Original: ", device.rotation);
                if (device.rotation) {
                    device.mesh.rotation.copy(device.rotation);
                    console.log("Restored rotation:", device.rotation);
                }
            }
        }).catch(error => {
            console.error('Error loading switch model:', error);
        });
        return device;
    }

    /**
     * Create a light device
     * @param {Device3D} device - Base device object
     * @returns {Device3D} Configured device
     */
    createLight(device) {
        // Create a sphere for the light
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
        device.mesh = new THREE.Mesh(geometry, material);
        
        // Add actual light source
        const light = new THREE.PointLight(0xffaa00, 0, 2); // Start with intensity 0 (off)
        device.mesh.add(light);
        
        // Store reference to the light for state changes
        device.lightSource = light;
        
        // Override setState to control light intensity
        const originalSetState = device.setState;
        device.setState = function(state) {
            // Call original setState
            originalSetState.call(this, state);
            
            // Update light intensity based on state
            if (state === "on" || state === true) {
                this.lightSource.intensity = 1;
            } else {
                this.lightSource.intensity = 0;
            }
        };
        
        return device;
    }
    
    /**
     * Create a sensor device
     * @param {Device3D} device - Base device object
     * @returns {Device3D} Configured device
     */
    createSensor(device) {
        // Create a cylinder for the sensor
        const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const material = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        device.mesh = new THREE.Mesh(geometry, material);
        
        return device;
    }
    
    /**
     * Create a generic device when type is unknown
     * @param {Device3D} device - Base device object
     * @returns {Device3D} Configured device
     */
    createGenericDevice(device) {
        // Create a simple cube for unknown devices
        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const material = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
        device.mesh = new THREE.Mesh(geometry, material);
        
        return device;
    }
}