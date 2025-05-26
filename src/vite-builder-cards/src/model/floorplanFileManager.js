import { FloorplanModel } from "./floorplanModel.js";

export class FloorplanFileManager {
    constructor(hass) {
        this._hass = hass;
        this._lastEntity = "draw_my_home.last_loaded";
    }

    save(name, model) {
        const data = JSON.stringify(model);
        return this._hass.callService("draw_my_home", "save_plan", { name, data });
    }

    load(name) {
        console.log("File manager load:", name);
        return new Promise(async (resolve) => {
            const unsubscribe = await this._hass.connection.subscribeEvents(
                (msg) => {
                    const e = msg.event || msg;
                    if (
                        e.event_type === "state_changed" &&
                        e.data.entity_id === this._lastEntity
                    ) {
                        // safely unsubscribe
                        try {
                            const maybe = unsubscribe();
                            if (maybe && typeof maybe.catch === "function") {
                                maybe.catch(err => {
                                    if (err.code !== "not_found") {
                                        console.error("Error during unsubscribe:", err);
                                    }
                                });
                            }
                        } catch (err) {
                            if (err.code !== "not_found") {
                                console.error("Error during unsubscribe:", err);
                            }
                        }

                        // then parse and resolve…
                        try {
                            const raw = JSON.parse(e.data.new_state.attributes.plan_data);
                            resolve(FloorplanModel.fromJSON(raw));
                        } catch (err) {
                            console.error("Parse/rehydrate failed:", err);
                            resolve(null);
                        }
                    }
                },
                "state_changed"
            );

            this._hass.callService("draw_my_home", "load_plan", { name });
        });
    }

    getSavedPlans() {
        return new Promise(async (resolve) => {
            const unsubscribe = await this._hass.connection.subscribeEvents(
                (event) => {
                    if (event.event_type === "draw_my_home_saved_plans") {
                        const plans = event.data.plans;

                        // safely unsubscribe
                        try {
                            const maybe = unsubscribe();
                            if (maybe && typeof maybe.catch === "function") {
                                maybe.catch(err => {
                                    if (err.code !== "not_found") {
                                        console.error("Error during unsubscribe:", err);
                                    }
                                });
                            }
                        } catch (err) {
                            if (err.code !== "not_found") {
                                console.error("Error during unsubscribe:", err);
                            }
                        }

                        resolve(plans);
                    }
                },
                "draw_my_home_saved_plans"
            );

            this._hass.callService("draw_my_home", "get_saved_plans");
        });
    }

    deletePlan(name) {
        return this._hass.callService("draw_my_home", "delete_plan", { name });
    }
}