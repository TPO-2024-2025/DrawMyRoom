// floorplanModel.js
import { Device3D } from "../device3D.js";
import { Path } from "../path.js";              // ← your Path class
import * as THREE from "three";

export class FloorplanModel {
  paths = [];
  devices = [];

  addPath(path)   { this.paths.push(path); }
  addDevice(dev)  { this.devices.push(dev); }
  clear()         { this.paths = []; this.devices = []; }

  /**
   * Rehydrate a raw object (parsed from JSON) into a FloorplanModel
   */
  static fromJSON(raw) {
    const model = new FloorplanModel();

    // 1) restore paths
    raw.paths.forEach(rawPath => {
      // assume you have a Path class whose constructor or prototype methods you want
      const p = Object.assign(new Path(), rawPath);
      model.addPath(p);
    });

    // 2) restore devices
    raw.devices.forEach(rawDev => {
      const d = new Device3D();
      d.id = rawDev.id;

      // restore Vector3
      d.position = new THREE.Vector3(
        rawDev.position.x,
        rawDev.position.y,
        rawDev.position.z
      );

      // restore the mesh from JSON snapshot:
      if (rawDev.mesh) {
        const loader = new THREE.ObjectLoader();
        d.mesh = loader.parse(rawDev.mesh);
        // position it
        d.mesh.position.copy(d.position);
      }
      // alternatively, if you stored only a URL:
      // else if (rawDev.meshUrl) { … load via GLTFLoader … }
      if (rawDev._callback) {
        d._callback = rawDev._callback;
      }
      if (rawDev.entityId) {
        d.entityId = rawDev.entity_id;
      }

      model.addDevice(d);
    });

    return model;
  }
}
