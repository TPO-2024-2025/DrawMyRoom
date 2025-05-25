import { FloorplanBuilder } from "./floorplanBuilder.js";
import { FloorplanModel } from './model/floorplanModel.js';
import { FloorplanFileManager } from './model/floorplanFileManager.js';
import { Canvas2DView } from './view/canvas2DView.js';
import { Scene3DView } from './view/scene3Dview.js';
import { ToolPalette } from './view/toolPalette.js';
import { DropdownFloorplanSelector } from './view/dropdownFloorplanSelector.js';
import { HomeAssistantAPI } from './ha-integration/homeAssistantAPI.js';
import { SceneManager } from './sceneManager.js';
import { DeviceFactory } from './deviceFactory.js';
import { SnapData } from './snapStrategy.js';
import { ProximitySnap, AxisSnap } from './snapStrategy.js';
import { ThreeJSFacade } from './threeJSFacade.js';
import { Device3D } from './device3D.js';
import { DeviceAdapter } from './ha-integration/deviceAdapter.js';
import * as THREE from 'three';
import { Scene } from "three";
import { EntitySelectionMenu } from './view/entitySelectionMenu.js';

export class DrawMyHomeCard extends HTMLElement {
  model;
  builder;
  canvasView;
  sceneView;
  palette;
  planSelector;
  api;
  isDrawing = false;
  _elements = {};
  selectedDevice = null;

  constructor() {
    super();
    this.model = new FloorplanModel();
    this.facade = new ThreeJSFacade();
    this.builder = new FloorplanBuilder(this.facade);
    this.api = new HomeAssistantAPI();
    this.deviceFactory = new DeviceFactory(this.facade);

    // Initialize views
    this.canvasView = new Canvas2DView();
    this.canvasView.setSnapStrategy(new ProximitySnap());
    this.palette = new ToolPalette();
    this.planSelector = new DropdownFloorplanSelector();

    this.attachShadow({ mode: "open" });
    this.render();
  }

  connectedCallback() {
    console.log('DrawingCard connected');
    const canvas = this.shadowRoot.querySelector('#canvas-2d');
    const canvas3D = this.shadowRoot.querySelector('#canvas-3d');
    this.canvasView.canvas = canvas;
    SceneManager.getInstance().init(canvas3D, this.sceneView);

    // Initialize the plan selector
    const planSelectorElement = this.shadowRoot.querySelector('#plan-selector');
    planSelectorElement.appendChild(this.planSelector);

    this.resize();
    this.canvasView.render2D(this.model);
    // Set up event listeners
    this.setupListeners();
  }

  setupListeners() {
    // this.palette.addEventListener('tool-selected', (e) => this.handleToolSelect(e.detail));

    // Tool palette
    this._elements.lineTool = this.shadowRoot.querySelector('#line-tool');
    this._elements.rectangleTool = this.shadowRoot.querySelector('#rectangle-tool');
    this._elements.circleTool = this.shadowRoot.querySelector('#circle-tool');
    this._elements.eraserTool = this.shadowRoot.querySelector('#eraser-tool');
    this._elements.lineTool.addEventListener('click', () => this.handleToolSelect('line'));
    this._elements.rectangleTool.addEventListener('click', () => this.handleToolSelect('rectangle'));
    this._elements.circleTool.addEventListener('click', () => this.handleToolSelect('circle'));
    this._elements.eraserTool.addEventListener('click', () => this.handleToolSelect('eraser'));

    // Device palette
    this._elements.switchDevice = this.shadowRoot.querySelector('#switch-device');
    this._elements.switchDevice.addEventListener('click', () => this.handleDeviceSelect('switch'));

    // Plan selector
    this.planSelector.addEventListener('plan-selected', (e) => {
      this.loadPlan(e.detail.plan);
    });

    this.planSelector.addEventListener('new-plan-requested', () => {
      this.createNewPlan();
    });


    this.canvasView.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvasView.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvasView.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    window.addEventListener('resize', (e) => this.resize(e));
    this.shadowRoot.querySelector('#submit-button').addEventListener('click', (e) => this.handleSubmit(e));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        console.log('Shift key pressed');
        this.canvasView.setSnapStrategy(new AxisSnap());
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        this.canvasView.setSnapStrategy(new ProximitySnap());
      }
    });

    // Listen for device clicks
    this.addEventListener('draw-my-home-device-clicked', (e) => this.handleDeviceClick(e));
    SceneManager.getInstance().canvas.addEventListener('click', this.handle3DCanvasClick.bind(this));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #75bae9;
          --background-color: #282a30;

          color: var(--primary-color);
          border-radius: 10px;
        }   
        :host * {
          box-sizing: border-box;
        }
        #top-bar {
          display: flex;
          justify-content: space-around;
          padding: 10px;
          flex-direction: row;
          width: 100%;
        }
        #tool-palette {
          display: flex;
          flex-direction: row;
          padding: 10px;
          justify-content: center;
          gap: 10px;
          align-items: center;
        }
        #main-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          
        }
        #secondary-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background-color: var(--background-color);
          padding: 10px;
          border-radius: 15px;
        }
        #canvas-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 80%;
        }
        canvas {
          border-radius: 20px / 15px;
          border-color: var(--primary-color);
          border-style: solid;
          border-width: 2px;
          width: 100%;
          height: 100%;
          min-height: 300px;
        }
        #submit-button, #clear-button {
          background-color: #15161a;
          padding: 10px 30px;
          border-radius: 5px;
          cursor: pointer;
        }
        .selected-tool {
          background-color: var(--primary-color);
          color: var(--background-color);
          padding: 5px;
          border-radius: 5px;
        }
        .hidden {
          display: none;
        }

      </style>
      <div id="main-container">
        <div id="secondary-container">
          <div id="top-bar">
            <div id="submit-button" class="button">SUBMIT</div>
            <div id="plan-selector" class="dropdown"></div>
            <div id="clear-button" class="button">CLEAR</div>
          </div>
          <div id="canvas-container">
            <canvas id="canvas-2d"></canvas>
            <canvas id="canvas-3d" class="hidden"></canvas>
          </div>
          <div id="tool-palette">
            <div id="line-tool" class="tool">Line</div>
            <div id="rectangle-tool" class="tool">Rectangle</div>
            <div id="circle-tool" class="tool">Circle</div>
            <div id="eraser-tool" class="tool">Eraser</div>

            <div id="switch-device" class="device hidden">Switch</div>
          </div>
        </div>
      </div>
      `;
  }

  setConfig(cfg) {
    this.config = cfg;
    if (cfg.devices) {
      cfg.devices.forEach(deviceCfg => {
        const device = this.deviceFactory.createDevice(deviceCfg.type, deviceCfg.url);
        device.link(deviceCfg.entity_id);
        this.model.addDevice(device);
      });
    }
    // this.updateViews();
  }

  set hass(hass) {
    this._hass = hass;
    this.api.connect(hass);
    
    // Initialize device adapter if needed
    if (!this.deviceAdapter) {
        this.deviceAdapter = new DeviceAdapter(this.api);
    }
    
    // Update SceneManager with current context
    SceneManager.getInstance().setContext(
        hass,
        this.config,
        this.deviceAdapter
    );
    
    this.fileManager = new FloorplanFileManager(hass);

    // Get saved plans and populate dropdown
    this.fileManager.getSavedPlans().then(plans => {
      console.log('Available plans:', plans);
      this.planSelector.show(plans);

      // If we have a config with a default plan, select it
      if (this.config && this.config.default_plan && plans.includes(this.config.default_plan)) {
        this.planSelector.setSelected(this.config.default_plan);
        this.loadPlan(this.config.default_plan);
      } else if (plans.length > 0) {
        // Otherwise select the first plan if available
        this.planSelector.setSelected(plans[0]);
      }
    });
  }

  /**
   * Load a floor plan from storage
   * @param {string} planName The name of the plan to load
   */
  loadPlan(planName) {
    console.log(`Loading plan: ${planName}`);

    this.fileManager.load(planName).then(model => {
      console.log('Loaded model:', model);
      if (model) {
        console.log(`Loaded plan: ${planName} : `, model);
        this.model = model;

        // Update view state to 3D
        this.switchTo3DView();
      } else {
        console.error(`Failed to load plan: ${planName}`);
      }
    });
  }

  async savePlan() {
    const planName = this.planSelector.getSelected();

    if (!planName) {
      // If no plan is selected, prompt for a name
      this.createNewPlan();
      return;
    }

    // Save the current model to the selected plan
    console.log(`Saving to plan: ${planName}`);
    await this.fileManager.save(planName, this.model);
  }

  /**
   * Create a new floor plan
   */
  createNewPlan() {
    const newName = prompt("Enter name for new plan:", "my_floorplan");

    if (newName && newName.trim() !== '') {
      // Create a new model
      this.model = new FloorplanModel();

      // Save the new model
      this.fileManager.save(newName, this.model).then(success => {
        if (success) {
          console.log(`Created new plan: ${newName}`);

          // Update dropdown with the new plan name
          const currentPlans = this.planSelector.plans || [];
          this.planSelector.show([...currentPlans, newName]);
          this.planSelector.setSelected(newName);

          // Update view
          this.canvasView.render2D(this.model);
          this.switchTo2DView();
        }
      });
    }
  }

  /**
   * Switch to 2D view mode
   */
  switchTo2DView() {
    // Show 2D canvas
    this.canvasView.canvas.classList.remove('hidden');

    // Show tool palette and hide device palette
    const tools = this.shadowRoot.querySelectorAll('.tool');
    tools.forEach(tool => tool.classList.remove('hidden'));

    const devices = this.shadowRoot.querySelectorAll('.device');
    devices.forEach(device => device.classList.add('hidden'));

    // Hide 3D canvas
    SceneManager.getInstance().canvas.classList.add('hidden');
    SceneManager.getInstance().stop();
  }

  handleToolSelect(name) {
    this._elements.lineTool.classList.remove('selected-tool');
    this._elements.rectangleTool.classList.remove('selected-tool');
    this._elements.circleTool.classList.remove('selected-tool');
    this._elements.eraserTool.classList.remove('selected-tool');
    this._elements[name + 'Tool'].classList.add('selected-tool');
    console.log('handleToolSelect', name);
    this.palette.selectTool(name);
    this.currentTool = this.palette.getTool();
    this.canvasView.setTool(this.currentTool);
  }

  handleDeviceSelect(name) {
    console.log('handleDeviceSelect', name);

    this._elements.switchDevice.classList.remove('selected-tool');
    this._elements[name + 'Device'].classList.add('selected-tool');

    this.selectedDevice = name;
  }

  handle3DCanvasClick(event) {
    if (!this.selectedDevice) {
      console.warn('No device selected for 3D canvas click');
      return;
    }
    const name = this.selectedDevice;
    console.log('3D canvas clicked for device:', name);
    const clickedIntersection = SceneManager.getInstance().getIntersection();
    if (!clickedIntersection) {
      console.warn('No object clicked in 3D scene');
      return null;
    }
    const position = clickedIntersection.point.clone();
    const rotation = clickedIntersection.object.rotation.clone();
    console.log('CLICKED OBJECT ROTATION HEREEEE:', rotation);
  
    console.log('Clicked position:', position);

    try {
      // Create device using the factory

      const device = this.deviceFactory.createDevice(name, this.api);

      if (!device) {
        console.error(`Failed to create device of type: ${name}`);
        return;
      }

      device.setPosition(position);
      device.setRotation(rotation);

      // Add device to model
      this.model.addDevice(device);
      this.savePlan();
      this.switchTo3DView();

      // Allow linking to Home Assistant entities later
      console.log(`Added ${name} device to scene`);
    } catch (error) {
      console.error('Error adding device:', error);
    } finally {
      // Reset selected device after placement
      this.selectedDevice = null;
      this._elements.switchDevice.classList.remove('selected-tool');
    }
  }

  updateSnapData() {
    console.log('updateSnapData drawingCard.js');
    let data = new SnapData();
    data.paths = this.model.paths;
    data.lastPoint = this.palette.getTool().getFirstPoint();
    this.canvasView.updateSnapData(data);
  }

  handleMouseDown(e) {
    if (!this.currentTool) return;

    this.isDrawing = true;
    this.updateSnapData();
    const point = this.canvasView.getCanvasCoordinates(e);
    this.currentTool.onClick(point.x, point.y);
    this.canvasView.render2D(this.model);
    this.currentTool.draw(this.canvasView.canvas.getContext('2d'));
  }

  handleMouseMove(e) {
    if (!this.isDrawing || !this.currentTool) return;

    this.updateSnapData();
    const point = this.canvasView.getCanvasCoordinates(e);
    this.currentTool.onHover(point.x, point.y, this.model.paths);
    this.canvasView.render2D(this.model);
    this.currentTool.draw(this.canvasView.canvas.getContext('2d'));
  }

  handleMouseUp(e) {
    if (!this.isDrawing || !this.currentTool) return;

    this.isDrawing = false;
    this.updateSnapData();
    const point = this.canvasView.getCanvasCoordinates(e);
    const paths = this.currentTool.onRelease(point.x, point.y);

    if (paths) {
      paths.forEach(path => {
        this.model.addPath(path);
      });
    }
    this.canvasView.render2D(this.model);
  }

  async handleSubmit(e) {
    console.log('handleSubmit', e);

    if (!this.model) {
      console.error('No model to save');
      return;
    }
    if (this.model.paths.length === 0) {
      console.error('No paths to save');
      return;
    }

    // Get the selected plan name from the dropdown
    this.savePlan();

    // Switch to 3D view to see the result
    this.switchTo3DView();
  }

  switchTo3DView() {
    // Hide 2D canvas
    this.canvasView.canvas.classList.add('hidden');

    // Hide tool palette and show device palette
    const tools = this.shadowRoot.querySelectorAll('.tool');
    tools.forEach(tool => tool.classList.add('hidden'));

    const devices = this.shadowRoot.querySelectorAll('.device');
    devices.forEach(device => device.classList.remove('hidden'));

    // Show 3D canvas
    SceneManager.getInstance().canvas.classList.remove('hidden');

    // Rebuild the 3D scene with the model including the new device
    const sceneData = this.builder.build(this.model);
    this.facade.setupScene(SceneManager.getInstance().getScene());
    SceneManager.getInstance().displayScene(sceneData, this.model);
    SceneManager.getInstance().start();
  }

  updateViews() {
    // Update 2D canvas
    console.log('updateViews');

    // Update 3D scene
    // const sceneData = this.builder.build(this.model);
    // this.sceneView.display(sceneData);
  }

  resize() {
    this.canvasView.resize();
    SceneManager.getInstance().resize();
  }


  // Add this method to handle device click events
  handleDeviceClick(event) {
    const deviceId = event.detail.deviceId;
    const entityId = event.detail.entityId;

    if (entityId) {
      // Device is already linked - show HA entity dialog
      this.showEntityDialog(entityId);
    } else {
      // Device needs to be linked - show entity selection menu
      this.showEntitySelectionMenu(deviceId);
    }
  }

  /**
   * Show Home Assistant entity dialog
   * @param {string} entityId - Entity ID to display
   */
  showEntityDialog(entityId) {
    const event = new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  /**
   * Show entity selection menu
   * @param {string} deviceId - Device to link
   */
  showEntitySelectionMenu(deviceId) {
    // Find the device
    const device = this.model.devices.find(d => d.id === deviceId);
    if (!device) return;

    // Get entities from config or all entities from hass
    let entities = [];
    if (this.config && this.config.entities) {
      entities = this.config.entities;
    } else {
      entities = Object.keys(this._hass.states).map(id => ({ entity: id }));
    }

    // Show selection menu
    window.entitySelectionMenu.show(entities, (selectedEntityId) => {
      // Link the device to selected entity
      this.linkDeviceToEntity(device, selectedEntityId);
    });
  }

  /**
   * Link a device to an entity
   * @param {Device3D} device - Device to link
   * @param {string} entityId - Entity ID to link to
   */
  linkDeviceToEntity(device, entityId) {
    // Create proxy to handle entity state changes
    const proxy = new DeviceProxy(
      device.id,
      this.api,
      device,
      entityId
    );

    // Store proxy for later cleanup
    if (!this._deviceProxies) {
      this._deviceProxies = new Map();
    }
    this._deviceProxies.set(device.id, proxy);

    // Update model
    device.entityId = entityId;

    console.log(`Linked device ${device.id} to entity ${entityId}`);
  }

  // Make sure to clean up proxies when removing the card
  disconnectedCallback() {
    if (this._deviceProxies) {
      this._deviceProxies.forEach(proxy => proxy.detach());
      this._deviceProxies.clear();
    }

    // Any other cleanup...
  }
}


customElements.define('draw-my-home', DrawMyHomeCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "draw-my-home",
  name: "Draw My Home",
  description: "Interactive 2D/3D floorplan editor",
});