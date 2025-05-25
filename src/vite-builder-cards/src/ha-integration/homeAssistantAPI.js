export class HomeAssistantAPI {
    constructor() {
        /** @private {import('custom-card-helpers').HomeAssistant} */
        this._hass = null;
    }

    /**
     * Store the injected Home Assistant object.
     * @param {import('custom-card-helpers').HomeAssistant} hass
     */
    connect(hass) {
        this._hass = hass;
    }

    /**
     * Subscribe to state changes of a single entity.
     * Calls callback immediately with the current state.
     * @param {string} entityId
     * @param {(state: string, attrs: Record<string, any>) => void} callback
     * @returns {() => void} unsubscribe function
     */
    subscribe(entityId, callback) {
        if (!this._hass) {
            throw new Error("HomeAssistantAPI: not connected");
        }
        // Initial call with current state
        const stateObj = this._hass.states[entityId];
        if (stateObj) {
            callback(stateObj.state, stateObj.attributes);
        }

        // Subscribe to future changes
        const unsub = this._hass.connection.subscribeEvents((event) => {
            if (
                event.event_type === "state_changed" &&
                event.data.entity_id === entityId
            ) {
                callback(
                    event.data.new_state.state,
                    event.data.new_state.attributes
                );
            }
        }, "state_changed");

        return unsub;
    }

    /**
     * Call a Home Assistant service.
     * @param {string} domain
     * @param {string} service
     * @param {Record<string, any>} data
     * @returns {Promise<any>}
     */
    callService(domain, service, data) {
        if (!this._hass) {
            return Promise.reject(new Error("HomeAssistantAPI: not connected"));
        }
        return this._hass.callService(domain, service, data);
    }
}
