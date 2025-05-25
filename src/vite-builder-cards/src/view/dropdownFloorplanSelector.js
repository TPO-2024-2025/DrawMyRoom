export class DropdownFloorplanSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selectedPlan = null;
        this.plans = [];
        
        // Initialize the shadow DOM
        this.render();
    }
    
    // Web Component lifecycle callbacks
    connectedCallback() {
        // Called when element is added to the document
        this.updateSelectOptions();
    }
    
    // Create the initial shadow DOM structure
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                
                select {
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: 1px solid var(--divider-color, #c7c7c7);
                    background-color: var(--card-background-color, #ffffff);
                    color: var(--primary-text-color, #212121);
                    width: 100%;
                    font-size: 14px;
                    cursor: pointer;
                    appearance: none;
                    background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
                    background-repeat: no-repeat;
                    background-position: right 8px center;
                    padding-right: 28px;
                }
                
                select:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px var(--primary-color, #03a9f4);
                }
                
                .new-option {
                    color: var(--primary-color, #03a9f4);
                    font-weight: bold;
                }
            </style>
            <select></select>
        `;
        
        // Add event listener to the select element
        const select = this.shadowRoot.querySelector('select');
        select.addEventListener('change', this.handleSelectionChange.bind(this));
    }
    
    /**
     * Populate dropdown with floor plans
     * @param {Array<string>} plans - List of plan names
     */
    show(plans) {
        this.plans = plans || [];
        this.updateSelectOptions();
        return this;
    }
    
    /**
     * Update the select element options
     */
    updateSelectOptions() {
        console.log('Updating select options with plans:', this.plans);
        const select = this.shadowRoot.querySelector('select');
        if (!select) return;
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add placeholder option
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a floor plan...';
        placeholder.disabled = true;
        placeholder.selected = !this.selectedPlan;
        select.appendChild(placeholder);
        
        // Add plan options
        this.plans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan;
            option.textContent = plan;
            option.selected = plan === this.selectedPlan;
            select.appendChild(option);
        });
        
        // Add "New Plan" option
        const newOption = document.createElement('option');
        newOption.value = 'new';
        newOption.textContent = '+ Create New Plan';
        newOption.className = 'new-option';
        select.appendChild(newOption);
    }
    
    /**
     * Handle selection change events
     * @param {Event} event 
     */
    handleSelectionChange(event) {
        const value = event.target.value;
        console.log('Selected value:', value);
        
        if (value === 'new') {
            // Reset selection to previous value
            setTimeout(() => {
                this.updateSelectOptions();
            }, 0);
            
            // Dispatch an event indicating new plan request
            this.dispatchEvent(new CustomEvent('new-plan-requested', {
                bubbles: true,
                composed: true
            }));
        } else {
            this.selectedPlan = value;
            
            // Dispatch an event with the selected plan
            this.dispatchEvent(new CustomEvent('plan-selected', {
                detail: { plan: value },
                bubbles: true,
                composed: true
            }));
        }
    }
    
    /**
     * Get the currently selected plan
     * @returns {string|null} The selected plan name or null if none selected
     */
    getSelected() {
        return this.selectedPlan;
    }
    
    /**
     * Set the selected plan programmatically
     * @param {string} planName - Plan name to select
     * @returns {boolean} True if plan was found and selected
     */
    setSelected(planName) {
        if (!this.plans.includes(planName) && planName !== null) {
            return false;
        }
        
        this.selectedPlan = planName;
        this.updateSelectOptions();
        return true;
    }
}

// Register the custom element
customElements.define('dropdown-floorplan-selector', DropdownFloorplanSelector);