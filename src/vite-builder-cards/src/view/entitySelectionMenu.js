export class EntitySelectionMenu {
    constructor() {
        this._createElements();
    }
    
    _createElements() {
        // Create the dialog elements
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'fixed',
            zIndex: 9999,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--card-background-color, white)',
            borderRadius: '8px',
            boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
            padding: '16px',
            width: '300px',
            maxHeight: '80vh',
            overflow: 'auto'
        });
        
        // Create backdrop
        this.backdrop = document.createElement('div');
        Object.assign(this.backdrop.style, {
            position: 'fixed',
            zIndex: 9998,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)'
        });
    }
    
    /**
     * Show entity selection dialog
     * @param {Object} hass - Home Assistant object
     * @param {Device3D} device - Device to link
     * @param {DeviceAdapter} adapter - Device adapter
     * @param {Array} configEntities - Entities from card config
     */
    show(hass, device, adapter, configEntities = []) {
        this.container.innerHTML = `
            <h3>Select Entity for Device</h3>
            <div style="margin-bottom:12px">
                <label>
                    Filter: 
                    <select id="domain-filter">
                        <option value="">All</option>
                        <option value="light">Lights</option>
                        <option value="switch">Switches</option>
                        <option value="sensor">Sensors</option>
                    </select>
                </label>
            </div>
            <div id="entity-list" style="max-height:400px;overflow:auto"></div>
            <div style="margin-top:16px;text-align:right">
                <button id="cancel-btn">Cancel</button>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.container);
        
        // Set up filter
        const filter = this.container.querySelector('#domain-filter');
        filter.addEventListener('change', () => {
            this._populateEntityList(hass, device, adapter, configEntities, filter.value);
        });
        
        // Initial population
        this._populateEntityList(hass, device, adapter, configEntities);
        
        // Set up cancel
        this.container.querySelector('#cancel-btn').addEventListener('click', () => {
            this.close();
        });
        
        // Close on backdrop click
        this.backdrop.addEventListener('click', () => {
            this.close();
        });
    }
    
    /**
     * Populate entity list
     */
    _populateEntityList(hass, device, adapter, configEntities, domainFilter = '') {
        const list = this.container.querySelector('#entity-list');
        list.innerHTML = '';
        
        // Get entities to display
        let entities = [];
        
        // First try from config
        if (configEntities && configEntities.length > 0) {
            entities = configEntities.map(e => typeof e === 'string' ? e : e.entity);
        } else {
            // Otherwise use all entities from hass
            entities = Object.keys(hass.states);
        }
        
        // Apply domain filter
        if (domainFilter) {
            entities = entities.filter(e => e.startsWith(domainFilter + '.'));
        }
        
        // Create entity items
        entities.forEach(entityId => {
            const state = hass.states[entityId];
            if (!state) return; // Skip if entity not found
            
            const item = document.createElement('div');
            Object.assign(item.style, {
                padding: '8px 12px',
                margin: '4px 0',
                borderRadius: '4px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--divider-color, #eee)'
            });
            
            const name = state.attributes.friendly_name || entityId;
            
            item.innerHTML = `
                <div style="font-weight:bold">${name}</div>
                <div style="font-size:12px;color:var(--secondary-text-color, #666)">${entityId}</div>
            `;
            
            // Hover effect
            item.addEventListener('mouseover', () => {
                item.style.backgroundColor = 'var(--secondary-background-color, #f0f0f0)';
            });
            
            item.addEventListener('mouseout', () => {
                item.style.backgroundColor = '';
            });
            
            // Click handler
            item.addEventListener('click', () => {
                adapter.link(device, entityId);
                this.close();
            });
            
            list.appendChild(item);
        });
        
        // Show message if no entities
        if (list.children.length === 0) {
            list.innerHTML = '<div style="padding:8px;color:var(--secondary-text-color, #666)">No matching entities found</div>';
        }
    }
    
    close() {
        if (this.container.parentNode) {
            document.body.removeChild(this.container);
        }
        if (this.backdrop.parentNode) {
            document.body.removeChild(this.backdrop);
        }
    }
}

// Create singleton instance
window.entitySelectionMenu = new EntitySelectionMenu();