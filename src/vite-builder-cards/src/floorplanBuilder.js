import * as THREE from "three";

export class FloorplanBuilder {
  _facade;

  constructor(facade) {
    this._facade = facade;
  }

  reset() {
    return "Not implemented"
  }

  build(m /* FloorplanModel */) {
    const paths = m.paths;
    const devices = m.devices;

    console.log("Building 3D scene in builder!");

    const wallWidth = 0.2; // Wall width in meters
    const divisionFactor = 50; // Adjust this value to change the scaling factor

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    let sceneData = {
      objects: new THREE.Group(),
      devices: new THREE.Group(),
      averagePosition: { x: 0, z: 0 },
    };

    // Create all the walls
    for (const path of paths) {
      const x1 = path.x1 / divisionFactor;
      const y1 = path.y1 / divisionFactor;
      const x2 = path.x2 / divisionFactor;
      const y2 = path.y2 / divisionFactor;

      minX = Math.min(minX, x1, x2);
      minY = Math.min(minY, y1, y2);
      maxX = Math.max(maxX, x1, x2);
      maxY = Math.max(maxY, y1, y2);

      const length = Math.sqrt(
        Math.pow(x2 - x1, 2) +
        Math.pow(y2 - y1, 2)
      ) + wallWidth * 0.8;

      const cube = this._facade.createWallMesh(length, 1, wallWidth);
      // Console log cube uuid
      console.log("Cube UUID", cube.uuid);
      cube.castShadow = true;
      cube.receiveShadow = true;

      const angle = Math.atan2(x2 - x1, y2 - y1);
      const centerX = ((x1 + x2)) / 2;
      const centerZ = ((y1 + y2)) / 2;
      const centerY = 0;
      cube.rotation.y = angle;
      cube.position.set(centerX, centerY, centerZ);

      sceneData.objects.add(cube);
    }
    // Create all the devices
    for (const device of devices) {
      if (!device || !device.mesh) {
        console.warn("Invalid device found:", device);
        continue;
      }
      
      // Add the device mesh to our scene
      sceneData.devices.add(device.mesh);
      
      // Set position if device has one
      if (device.position) {
        device.mesh.position.copy(device.position);
      }
      
      // Enable shadows
      device.mesh.castShadow = true;
      device.mesh.receiveShadow = true;
      
      // Add some user data to make it identifiable for raycasting
      device.mesh.userData.isDevice = true;
      device.mesh.userData.deviceId = device.id;
      
      console.log("Added device to scene:", device.id, "at position", device.position);
      
      // Keep track of bounds to adjust camera
      if (device.position) {
        minX = Math.min(minX, device.position.x);
        minY = Math.min(minY, device.position.z); // Note: z in THREE.js = y in 2D
        maxX = Math.max(maxX, device.position.x);
        maxY = Math.max(maxY, device.position.z);
      }
    }

    // Calculate the average position
    const averageX = (minX + maxX) / 2;
    const averageZ = (minY + maxY) / 2;
    sceneData.averagePosition = { x: averageX, z: averageZ };

    // let camera = this._facade.getCamera();

    // Set the camera position to the average position
    // this._three.camera.position.set(averageX + 5, 5, averageZ + 5);
    // this._three.camera.lookAt(averageX, 0, averageZ);

    // this._facade.setupScene(scene);
    console.log("Scene data", sceneData);
    return sceneData;
  }
}