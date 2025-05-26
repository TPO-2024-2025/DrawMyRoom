import { SceneManager } from "./sceneManager";

export class Device3D {
    id; // string
    position; // Vector3
    rotation; // Vector3
    mesh; // Three.Object3D
    _callback = null; // Function to call on click
    entityId = null;

    constructor(id = undefined) {
        this.id = id;
    }

    link (entityId /* string */) {
        // Store the entity ID
        this.entityId = entityId;
        console.log(`Device ${this.id} linked to entity ${entityId}`);
        
        // Set a visual indication that it's linked
        this.setColor("blue");
        
        return this;
    }

    setState (state) {
        return "Not implemented"
    }

    setOnClick (callback) {
        if (typeof callback === 'function') {
            this._callback = callback;
        }
    }

    // Update onClick method to handle everything directly
    onClick() {
        console.log(`Device clicked: ${this.id}`);
        
        // If this device is linked to an entity, show HA entity dialog
        if (this.entityId) {
            console.log(`Opening entity dialog for ${this.entityId}`);
            // Find canvas element to dispatch event from
            const canvas = this._getCanvasElement();
            if (canvas) {
                const event = new CustomEvent('hass-more-info', {
                    detail: { entityId: this.entityId },
                    bubbles: true,
                    composed: true
                });
                canvas.dispatchEvent(event);
            }
        } else {
            // If not linked, show entity selection menu
            console.log('Showing entity selection menu');
            if (window.entitySelectionMenu) {
                // Get references from SceneManager
                const sceneManager = SceneManager.getInstance();
                if (sceneManager && sceneManager.hass && sceneManager.deviceAdapter) {
                    window.entitySelectionMenu.show(
                        sceneManager.hass,
                        this,
                        sceneManager.deviceAdapter,
                        sceneManager.config?.entities
                    );
                } else {
                    console.error('Device3D: Missing context in SceneManager');
                }
            }
        }
        
        // Call callback if provided (for backward compatibility)
        if (this._callback) {
            this._callback(this);
        }
    }

    _getCanvasElement() {
        // Try to get canvas from SceneManager
        const sceneManager = SceneManager?.getInstance();
        if (sceneManager && sceneManager.canvas) {
            return sceneManager.canvas;
        }
        
        // Fallback: walk up the mesh parent chain to find scene
        if (this.mesh) {
            let parent = this.mesh.parent;
            while (parent && !parent.isScene) {
                parent = parent.parent;
            }
            
            // If we found the scene, try to find the renderer
            if (parent && parent.isScene) {
                // This is a bit of a hack, but THREE.js doesn't expose renderer directly
                // This assumes SceneManager is a global object
                if (SceneManager.getInstance()?.renderer) {
                    return SceneManager.getInstance().renderer.domElement;
                }
            }
        }
        
        return null;
    }

    setPosition (position /* Vector3 */) {
        if (!this.mesh) return;

        this.position = position;
        this.mesh.position.set(position.x, position.y, position.z);
    }

    setRotation (rotation /* Vector3 */) {
        if (!this.mesh) return;
        
        this.rotation = rotation;
        this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }

    /**
     * Set the color of this device, affecting all meshes in the hierarchy
     * @param {string|number} color - Color name or hex value
     * @returns {Device3D} this device for chaining
     */
    setColor(color) {
        if (!this.mesh) {
            console.warn(`Device ${this.id} has no mesh to set color`);
            return this;
        }
        
        // Convert named colors to hex
        const colorMap = {
            'red': 0xff0000,
            'green': 0x00ff00, 
            'blue': 0x75bae9,
            'yellow': 0xffff00,
            'purple': 0x800080,
            'gray': 0x888888,
            'amber': 0xffbf00
        };
        
        let colorValue;
        if (typeof color === 'string') {
            colorValue = colorMap[color.toLowerCase()] || 0x888888; // Default to gray
        } else {
            colorValue = color; // Assume it's already a hex value
        }
        
        // Apply color to all meshes recursively
        this._applyColorToMesh(this.mesh, colorValue);
        
        console.log(`Device ${this.id} color set to ${colorValue.toString(16)}. Mesh:`, this.mesh);
        return this;
    }

    /**
     * Recursively apply color to a mesh and all its children
     * @param {Object3D} object - The mesh or object to color
     * @param {number} colorValue - Hex color value
     * @private
     */
    _applyColorToMesh(object, colorValue) {
        // Apply to this object if it has a material
        if (object.material) {
            // Handle both single materials and material arrays
            if (Array.isArray(object.material)) {
                // Multiple materials
                object.material.forEach(mat => {
                    if (mat.color) {
                        mat.color.setHex(colorValue);
                    }
                });
            } else {
                // Single material
                if (object.material.color) {
                    object.material.color.setHex(colorValue);
                }
            }
        }
        
        // Recursively process children
        if (object.children && object.children.length > 0) {
            object.children.forEach(child => {
                this._applyColorToMesh(child, colorValue);
            });
        }
    }

    /**
     * Get the canvas element containing this device
     * @returns {HTMLCanvasElement} The canvas element
     */
    getCanvasElement() {
        if (this.mesh && this.mesh.parent) {
            // Find the renderer/scene this mesh belongs to
            let obj = this.mesh;
            while (obj.parent && !obj.isScene) {
                obj = obj.parent;
            }
            
            // From SceneManager, get the canvas
            return SceneManager.getInstance().canvas;
        }
        return null;
    }
}