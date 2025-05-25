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
                (e) => {
                    if (
                        e.event_type === "state_changed" &&
                        e.data.entity_id === this._lastEntity
                    ) {
                        unsubscribe();

                        try {
                            const rawJson = e.data.new_state.attributes.plan_data;
                            const rawObj = JSON.parse(rawJson);

                            // HERE: rehydrate with our factory
                            const model = FloorplanModel.fromJSON(rawObj);
                            resolve(model);

                        } catch (err) {
                            console.error(
                                "Failed to parse/rehydrate plan data:",
                                err,
                                e.data.new_state.attributes.plan_data
                            );
                            resolve(null);
                        }
                    }
                },
                "state_changed"
            );

            // trigger the load
            this._hass.callService("draw_my_home", "load_plan", { name });
        });
    }


    getSavedPlans() {
        return new Promise(async (resolve) => {
            const unsubscribe = await this._hass.connection.subscribeEvents((event) => {
                if (event.event_type === "draw_my_home_saved_plans") {
                    const plans = event.data.plans;
                    unsubscribe();  // now unsubscribe is the real function, so call it
                    resolve(plans);
                }
            }, "draw_my_home_saved_plans");

            this._hass.callService("draw_my_home", "get_saved_plans");
        });
    }



    getLastPlan() {
        throw new Error("Not implemented");
        return "Not implemented";
    }
}