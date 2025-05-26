import { DeviceProxy } from "./deviceProxy.js";

export class DeviceAdapter {
    /**
     * @param {HomeAssistantAPI} api
     */
    constructor(api) {
        /** @private */
        this.api = api;
        /** @type {Record<string, DeviceProxy>} */
        this._proxies = {};
    }

    savePlanCallback = null;

    /**
     * Link a device to an entity and create a proxy
     * @param {Device3D} device - The device to link
     * @param {string} entityId - Home Assistant entity ID
     * @returns {DeviceProxy} The created proxy
     */
    link(device, entityId, doSavePlan = true) {
        // First link the device
        device.link(entityId);

        // Create a proxy to manage the device-entity relationship
        const proxy = new DeviceProxy(device.id, this.api, device, entityId);

        // Store the proxy for later management
        this.proxies = this.proxies || new Map();
        this.proxies.set(device.id, proxy);

        if (this.savePlanCallback && doSavePlan) {
            // If a save callback is set, call it with the updated device
            this.savePlanCallback(device);
        }

        return proxy;
    }

    /**
     * Unlink a device from its entity
     * @param {string} deviceId - ID of device to unlink
     */
    unlink(deviceId) {
        if (this.proxies && this.proxies.has(deviceId)) {
            const proxy = this.proxies.get(deviceId);
            proxy.detach();
            this.proxies.delete(deviceId);
        }
    }
}
