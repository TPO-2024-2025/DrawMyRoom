import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ThreeJSFacade {
  createWallMesh(length, height = 1, width = 0.2) {
    const wallGeometry = new THREE.BoxGeometry(width, 2, length);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    wallMaterial.side = THREE.DoubleSide;
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    return wallMesh;
  }

  loadModel(name) {
    console.log('Loading model:', name);
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        name,
        (gltf) => {
          console.log('Model loaded:', gltf);
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          resolve(model);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
          reject(error);
        }
      );
    });

  }

  setupScene(scene) {
    scene.clear();
    scene.background = new THREE.Color( 0x333333 );
    scene.fog = new THREE.Fog( 0x222222, 10, 200 );

    const groundMesh = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000 ), new THREE.MeshPhongMaterial( { color: 0xffffff, depthWrite: false } ) );
    groundMesh.rotation.x = - Math.PI / 2;
    groundMesh.position.y = -1;
    groundMesh.receiveShadow = true;
    groundMesh.castShadow = true;
    scene.add( groundMesh );

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 2 );
    dirLight.position.set( - 3, 10, - 10 );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    // expand the shadow camera volume
    const d = 20; // half-width of the shadow camera frustum
    dirLight.shadow.camera.left   = -d;
    dirLight.shadow.camera.right  =  d;
    dirLight.shadow.camera.top    =  d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.near   =  1;
    dirLight.shadow.camera.far    =  50;

    dirLight.shadow.bias = -0.0001;


    scene.add( dirLight );
  }
}