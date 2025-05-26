import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store

DOMAIN = "draw_my_home"
STORAGE_KEY = "draw_my_home_data"
STORAGE_VERSION = 1
LAST_LOADED_ENTITY = f"{DOMAIN}.last_loaded"

SAVE_SCHEMA = vol.Schema({
    vol.Required("name"): cv.string,
    vol.Required("data"): cv.string,
})
LOAD_SCHEMA = vol.Schema({
    vol.Required("name"): cv.string,
})
GET_SAVED_PLANS_SCHEMA = vol.Schema({})  # no parameters
DELETE_SCHEMA = vol.Schema({
    vol.Required("name"): cv.string,
})

async def async_setup(hass: HomeAssistant, config: dict):
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)

    async def handle_save(call: ServiceCall):
        name = call.data["name"]
        data = call.data["data"]
        current = await store.async_load() or {}

        # Ensure "plans" key exists
        plans = current.get("plans", {})

        # Save the floorplan inside "plans"
        plans[name] = data

        # Update and save whole store
        current["plans"] = plans
        await store.async_save(current)


    async def handle_load(call: ServiceCall):
        name = call.data["name"]
        current = await store.async_load() or {}
        plans = current.get("plans", {})

        # Fetch the requested plan JSON (empty string if missing)
        payload = plans.get(name, "")

        hass.states.async_set(LAST_LOADED_ENTITY, name, {"plan_data": payload, "plan": name})
    
    async def get_saved_plan_names(hass: HomeAssistant, store: Store):
        current = await store.async_load() or {}
        plans = current.get("plans", {})
        return list(plans.keys())

    async def handle_get_saved_plans(call: ServiceCall):
        plan_names = await get_saved_plan_names(hass, store)
        hass.bus.async_fire("draw_my_home_saved_plans", {"plans": plan_names})
    
    async def handle_delete(call: ServiceCall):
        name = call.data["name"]
        current = await store.async_load() or {}
        plans = current.get("plans", {})
        if name in plans:
            plans.pop(name)
            current["plans"] = plans
            await store.async_save(current)
        # Optionally clear last_loaded if it was this one
        if hass.states.get(LAST_LOADED_ENTITY).state == name:
            hass.states.async_set(LAST_LOADED_ENTITY, "", {"plan_data": "", "plan": ""})


    hass.services.async_register(DOMAIN, "save_plan", handle_save, schema=SAVE_SCHEMA)
    hass.services.async_register(DOMAIN, "load_plan", handle_load, schema=LOAD_SCHEMA)
    hass.services.async_register(DOMAIN, "get_saved_plans", handle_get_saved_plans, schema=GET_SAVED_PLANS_SCHEMA)
    hass.services.async_register(DOMAIN, "delete_plan", handle_delete, schema=DELETE_SCHEMA)

    return True
