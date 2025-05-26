export class DeviceProxy {
    /**
     * @param {string} id
     * @param {HomeAssistantAPI} api
     * @param {Device3D} device3D       — wrapper around your Three.js mesh
     * @param {string} entityId         — the HA entity to bind to
     */
    constructor(id, api, device3D, entityId) {
        this.id = id;
        this.api = api;
        this.device3D = device3D;
        this.entityId = entityId;

        // give a default “unlinked” color
        console.log(`DeviceProxy ${this.id} linked to entity ${this.entityId}. Setting initial color.`);
        this.device3D.setColor("gray");

        // subscribe to HA state changes
        this._unsubscribe = this.api.subscribe(
            this.entityId,
            (state, attrs) => this._updateFromState(state, attrs)
        );

        // forward clicks on the 3D object into a custom event
        this.device3D.setOnClick(() => this._onClick());
    }

    /** @private */
    _updateFromState(state, attrs) {
        // Simple example: green if on/open, red if off/closed, gray otherwise
        if (state === "on" || state === "open") {
            this.device3D.setColor("green");
        } else if (state === "off" || state === "closed") {
            this.device3D.setColor("red");
        } else {
            this.device3D.setColor("blue");
        }
        // let the 3D wrapper handle any extra visual state
        if (this.device3D.setState) {
            this.device3D.setState(state, attrs);
        }
    }

    /** @private */
    _onClick() {
        // When device is clicked, show Home Assistant UI for the entity
        if (this.entityId) {
            const canvas = this.device3D.getCanvasElement();
            if (canvas) {
                // Dispatch standard Home Assistant more-info event
                const event = new CustomEvent('hass-more-info', {
                    detail: { entityId: this.entityId },
                    bubbles: true,
                    composed: true
                });
                canvas.dispatchEvent(event);
            }
        }
    }

    /** Call this to clean up when unlinking */
    detach() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
        console.log(`DeviceProxy ${this.id} detached from entity ${this.entityId}. Resetting color.`);
        this.device3D.setColor("gray");
    }
}
