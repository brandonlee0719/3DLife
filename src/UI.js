import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

import { MapControls, OrbitControls } from './three/OrbitControls';
import { DRACOLoader } from './three/DRACOLoader';
import { GLTFLoader } from './three/GLTFLoader';
import { CSS2DRenderer } from './three/CSS2DRenderer';
import { DragControls } from './three/DragControls';

import { Wall } from './components/Wall';
import { BottomWall } from './components/Bottom';
import { AXIS, DELTA_DIS, DIR, STORE, wallItems } from './Constant';
import { AxesHelper, Vector3 } from 'three';
import { render } from '@testing-library/react';

import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
import RoomLayout from "./components/RoomLayout";
import { Dimensions } from "./components/dimension";
import { Category } from './components/Category';

const Room_types = [1, 2, 3, 4, 5];

let walls_group = [];
let door = null;
let bathtub = null;
let temp_bathtub = null;
let temp_door = null;

let dims = [];

let isMouseDown = false;

let isDrag = false;

let updateTimeout;

const gltfLoader = new GLTFLoader();

let selectedItem = null;
let hoverItem;

let rayWalls = [];

let selectedObject;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('js/');
gltfLoader.setDRACOLoader(dracoLoader);


let objects = [];

const mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster();


const canvas = document.createElement('canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0X808080);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, .01, 50);
function initCamera() {
    camera.position.y = 10;
    camera.position.z = 8;
    scene.add(camera);
}

initCamera();

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

const labelRenderer = new CSS2DRenderer();

renderer.outputEncoding = THREE.sRGBEncoding;

const orbitControls = new OrbitControls(camera, renderer.domElement);

function initOrbit() {
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 20;
    orbitControls.maxPolarAngle = 1.5;
    orbitControls.minAzimuthAngle = .1;
}

initOrbit();

const frustum = 1000;
const orthoCam = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 0, 30);

// const orthoCam = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, 0, 30);
orthoCam.zoom = STORE.Scale * 100;
const mapControls = new MapControls(orthoCam, labelRenderer.domElement);

mapControls.zoomSpeed = .1;
mapControls.enableRotate = false;
mapControls.screenSpacePanning = false;
mapControls.minZoom = 100;
mapControls.maxZoom = frustum;
orthoCam.updateProjectionMatrix();



const global_light = new THREE.HemisphereLight('white', '', 0.5);
const light_1 = new THREE.PointLight('white', .2, 20, 1);
const light_2 = new THREE.PointLight('white', .2, 20, 1);

function initLight() {
    scene.add(global_light, light_1, light_2);
    global_light.position.set(10, 10, 10);
}

initLight();



// const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ side: THREE.BackSide, transparent: true, color :'white' }));

let InvisibleMat;
// box.geometry.translate(0, .5, 0);
// // scene.add(box);



function DragObject(vec3, object, selectedwall) {
    isDrag = true;
    switch (selectedwall.userData.normalAxis) {
        case AXIS.X:
            object.position.x = vec3.x;
            object.position.z = vec3.z;
            object.userData.normalAxis = AXIS.X;
            if (selectedwall.userData.dir == DIR.START) {
                object.rotation.y = Math.PI / 2;
                object.userData.dir = DIR.START;
            }
            else {
                object.rotation.y = -Math.PI / 2;
                object.userData.dir = DIR.END;
            }
            break;
        case AXIS.Z:
            object.position.x = vec3.x;
            object.position.z = vec3.z;
            object.userData.normalAxis = AXIS.Z;
            if (selectedwall.userData.dir == DIR.START) {
                object.rotation.y = 0;
                object.userData.dir = DIR.START;
            }
            else {
                object.rotation.y = -Math.PI;
                object.userData.dir = DIR.END;
            }
            break;
        case AXIS.Y:
            object.position.x = vec3.x;
            object.position.z = vec3.z;
            break;
        default:
            break;
    }

}



function isFacingCamera(object) {
    let v = new Vector3();
    // this is one way. adapt to your use case.
    if (v.subVectors(camera.position, object.position).dot(object.userData.normalVector) < 0) {
        object.geometry.setDrawRange(0, 0);
    }
    else {
        object.geometry.setDrawRange(0, Infinity);
        rayWalls.push(object);
    }
}

let walls;
function animate() {

    rayWalls = [];
    for (let index = 0; index < walls_group.length; index++) {
        if (walls_group[index].material.visible)
            isFacingCamera(walls_group[index]);
    }
    // isFacingCamera(ceiling);

    if (STORE.view === 1) {
        renderer.render(scene, camera);
        orbitControls.update();
        // let isDoor = false;
        // for (let index = 0; index < rayWalls.length; index++) {
        //     if (temp_door.userData.normalAxis === rayWalls[index].userData.normalAxis && temp_door.userData.dir === rayWalls[index].userData.dir) {
        //         isDoor = true;
        //     }
        // }
        // temp_door.chlldren[0].children[0].material.visible = isDoor;
    } else {
        renderer.render(scene, orthoCam);
        labelRenderer.render(scene, orthoCam);
        mapControls.update();
    }
    requestAnimationFrame(animate);

}

function resize() {
    const container = document.getElementById('canvas-container');
    container.innerHTML = '';
    container.append(canvas);
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(container.clientWidth, container.clientWidth);

}

window.addEventListener('resize', resize, false);

GenerateBathroom();
loadDoor();
loadBathtub();
animate();



const onmousedown = (e) => {

    isMouseDown = true;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (e.touches) {
        mouse.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);

    var objectIntersects = raycaster.intersectObjects(objects);

    if (objectIntersects.length > 0 && isMouseDown) {
        selectedItem = objectIntersects[0].object;
        orbitControls.enabled = false;
    }

}

const onmouseup = (e) => {

    isMouseDown = false;
    isDrag = false;
    orbitControls.enabled = true;
    selectedItem = null;

    Update();
}

const onmousemove = (e) => {

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (e.touches) {
        mouse.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    }

    let temp_camera;
    if (STORE.view == 1)
        temp_camera = camera;
    else
        temp_camera = orthoCam;
    raycaster.setFromCamera(mouse, temp_camera);
    var intersects = raycaster.intersectObjects(walls_group, false);

    if (intersects.length > 0) {

        selectedObject = intersects[0].object;
        if (isMouseDown && selectedItem) {
            console.log(intersects[0].point);
            if (selectedItem.userData.normalAxis === AXIS.Y && selectedObject.userData.normalAxis === AXIS.Y) {
                DragObject(intersects[0].point, selectedItem, selectedObject);
            }
            else if (selectedItem.userData.normalAxis !== AXIS.Y && selectedObject.userData.normalAxis !== AXIS.Y) {
                DragObject(intersects[0].point, selectedItem, selectedObject);
            }

        }

    } else {
        selectedObject = null;
    }

    var objectIntersects = raycaster.intersectObjects(objects);

    if (objectIntersects.length > 0) {
        hoverItem = objectIntersects[0].object;
        hoverItem.material.visible = true;
    } else if (hoverItem && !isDrag) {
        hoverItem.material.visible = false;
    }


    mapControls.enabled = false;

}

window.addEventListener('mousemove', onmousemove);
window.addEventListener('mousedown', onmousedown);
window.addEventListener('mouseup', onmouseup);

function Update() {
    if (updateTimeout) clearTimeout(updateTimeout);

    updateTimeout = setTimeout(() => {
        GenerateBathroom();
        GenerateMeasurements();
    }, 5);
}

function createWalls(type) {
    for (let index = 0; index < walls_group.length; index++) {
        scene.remove(walls_group[index]);
    }
    walls_group = [];
    switch (type) {
        case 1:
            walls_group.push(new Wall(STORE.Length, STORE.Height, new Vector3(-STORE.Width / 2, 0, 0), AXIS.X, DIR.START));
            walls_group.push(new Wall(STORE.Length, STORE.Height, new Vector3(STORE.Width / 2, 0, 0), AXIS.X, DIR.END));
            walls_group.push(new Wall(STORE.Width, STORE.Height, new Vector3(0, 0, -STORE.Length / 2), AXIS.Z, DIR.START));
            walls_group.push(new Wall(STORE.Width, STORE.Height, new Vector3(0, 0, STORE.Length / 2), AXIS.Z, DIR.END));
            break;
        case 2:
            walls_group.push(new Wall(STORE.Length, STORE.Height, new Vector3(-STORE.Width / 2, 0, 0), AXIS.X, DIR.START));
            walls_group.push(new Wall(STORE.Length - STORE.CutOutLength, STORE.Height, new Vector3(STORE.Width / 2, 0, -STORE.CutOutLength / 2), AXIS.X, DIR.END));
            walls_group.push(new Wall(STORE.Width, STORE.Height, new Vector3(0, 0, -STORE.Length / 2), AXIS.Z, DIR.START));
            walls_group.push(new Wall(STORE.Width - STORE.CutOutWidth, STORE.Height, new Vector3(- STORE.CutOutWidth / 2, 0, STORE.Length / 2), AXIS.Z, DIR.END));
            walls_group.push(new Wall(STORE.CutOutWidth, STORE.Height, new Vector3(STORE.Width / 2 - STORE.CutOutWidth / 2, 0, STORE.Length / 2 - STORE.CutOutLength), AXIS.Z, DIR.END));
            walls_group.push(new Wall(STORE.CutOutLength, STORE.Height, new Vector3(STORE.Width / 2 - STORE.CutOutWidth, 0, STORE.Length / 2 - STORE.CutOutLength / 2), AXIS.X, DIR.END));
            break;
        case 3:
            walls_group.push(new Wall(STORE.Length - STORE.CutOutLength, STORE.Height, new Vector3(-STORE.Width / 2, 0, -STORE.CutOutLength / 2), AXIS.X, DIR.START, true));
            walls_group.push(new Wall(STORE.Length, STORE.Height, new Vector3(STORE.Width / 2, 0, 0), AXIS.X, DIR.END, false));
            walls_group.push(new Wall(STORE.Width, STORE.Height, new Vector3(0, 0, -STORE.Length / 2), AXIS.Z, DIR.START, false));
            walls_group.push(new Wall(STORE.Width - STORE.CutOutWidth, STORE.Height, new Vector3(STORE.CutOutWidth / 2, 0, STORE.Length / 2), AXIS.Z, DIR.END, true));
            walls_group.push(new Wall(STORE.CutOutWidth, STORE.Height, new Vector3(-STORE.Width / 2 + STORE.CutOutWidth / 2, 0, STORE.Length / 2 - STORE.CutOutLength), AXIS.Z, DIR.END));
            walls_group.push(new Wall(STORE.CutOutLength, STORE.Height, new Vector3(-STORE.Width / 2 + STORE.CutOutWidth, 0, STORE.Length / 2 - STORE.CutOutLength / 2), AXIS.X, DIR.START));
            break;
        case 4:
            walls_group.push(new Wall(STORE.Length, STORE.Height, new Vector3(-STORE.Width / 2, 0, 0), AXIS.X, DIR.START));
            walls_group.push(new Wall(STORE.Length - STORE.CutOutLength, STORE.Height, new Vector3(STORE.Width / 2, 0, STORE.CutOutLength / 2), AXIS.X, DIR.END));
            walls_group.push(new Wall(STORE.Width - STORE.CutOutWidth, STORE.Height, new Vector3(- STORE.CutOutWidth / 2, 0, -STORE.Length / 2), AXIS.Z, DIR.START));
            walls_group.push(new Wall(STORE.Width, STORE.Height, new Vector3(0, 0, STORE.Length / 2), AXIS.Z, DIR.END));
            walls_group.push(new Wall(STORE.CutOutWidth, STORE.Height, new Vector3(STORE.Width / 2 - STORE.CutOutWidth / 2, 0, -STORE.Length / 2 + STORE.CutOutLength), AXIS.Z, DIR.START));
            walls_group.push(new Wall(STORE.CutOutLength, STORE.Height, new Vector3(STORE.Width / 2 - STORE.CutOutWidth, 0, -STORE.Length / 2 + STORE.CutOutLength / 2), AXIS.X, DIR.END));
            break;
        case 5:
            walls_group.push(new Wall(STORE.Length - STORE.CutOutLength, STORE.Height, new Vector3(-STORE.Width / 2, 0, STORE.CutOutLength / 2), AXIS.X, DIR.START));
            walls_group.push(new Wall(STORE.Length, STORE.Height, new Vector3(STORE.Width / 2, 0, 0), AXIS.X, DIR.END));
            walls_group.push(new Wall(STORE.Width - STORE.CutOutWidth, STORE.Height, new Vector3(STORE.CutOutWidth / 2, 0, -STORE.Length / 2), AXIS.Z, DIR.START));
            walls_group.push(new Wall(STORE.Width, STORE.Height, new Vector3(0, 0, STORE.Length / 2), AXIS.Z, DIR.END));
            walls_group.push(new Wall(STORE.CutOutWidth, STORE.Height, new Vector3(-STORE.Width / 2 + STORE.CutOutWidth / 2, 0, -STORE.Length / 2 + STORE.CutOutLength), AXIS.Z, DIR.START));
            walls_group.push(new Wall(STORE.CutOutLength, STORE.Height, new Vector3(-STORE.Width / 2 + STORE.CutOutWidth, 0, -STORE.Length / 2 + STORE.CutOutLength / 2), AXIS.X, DIR.START));
            break;
        default:
            break;
    }
    walls_group.push(new BottomWall(new Vector3(0, 0, 0), AXIS.Y, DIR.START, STORE.type, STORE.view));
    walls_group.push(new BottomWall(new Vector3(0, STORE.Height, 0), AXIS.Y, DIR.END, STORE.type, STORE.view));
    for (let index = 0; index < walls_group.length; index++) {
        scene.add(walls_group[index]);
        // if(STORE.view ===1 ){
        //     walls_group[index].onBeforeRender = onBeforeRender;
        //     walls_group[index].onAfterRender = onAfterRender;
        // }

    }

}


function GenerateBathroom() {

    orthoCam.position.y = STORE.Height + DELTA_DIS;
    light_1.position.set(-STORE.Width / 2, STORE.Height, 0);
    light_2.position.set(STORE.Width / 2, STORE.Height, 0);

    createWalls(STORE.type);

}

function GenerateMeasurements() {
    document.getElementById('measures').append(labelRenderer.domElement);

    for (let index = 0; index < dims.length; index++) {
        scene.remove(dims[index]);
    }
    dims = [];
    if (STORE.view !== 1)
        new Dimensions(scene, dims, orthoCam, labelRenderer.domElement, STORE.type, temp_bathtub);

}

function loadDoor() {
    gltfLoader.load(
        // resource URL
        'assets/doors/panel.glb',
        // called when the resource is loaded
        function (gltf) {
            InvisibleMat = new THREE.MeshBasicMaterial({ color: 'red', visible: false, transparent: true, opacity: .3 });
            temp_door = new THREE.Mesh(new THREE.BoxGeometry(wallItems.door.width, wallItems.door.height, wallItems.door.depth), InvisibleMat);
            temp_door.geometry.translate(0, wallItems.door.height * .5, 0);
            temp_door.position.set(0, 0, -STORE.Length / 2 - 0.02);
            temp_door.userData.normalAxis = AXIS.Z;
            temp_door.userData.normalVector = new Vector3(0, 0, 1);
            temp_door.userData.dir = DIR.START;
            door = gltf.scene;
            temp_door.add(door);
            scene.add(temp_door);
            objects.push(temp_door);
        },
    );
}

function loadBathtub() {
    gltfLoader.load(
        // resource URL
        'assets/doors/bathtub.glb',
        function (gltf) {
            bathtub = gltf.scene;
            bathtub.scale.x = 0.25;
            bathtub.scale.y = 0.25;
            bathtub.scale.z = 0.25;
            bathtub.rotation.y = Math.PI / 2;
            InvisibleMat = new THREE.MeshBasicMaterial({ color: 'red', visible: false, transparent: true, opacity: .3 });
            temp_bathtub = new THREE.Mesh(new THREE.BoxGeometry(wallItems.bathtub.width, wallItems.bathtub.height, wallItems.bathtub.depth), InvisibleMat);
            temp_bathtub.geometry.translate(0, wallItems.bathtub.height * .5, 0);
            temp_bathtub.position.set(0, 0, 0);
            temp_bathtub.userData.normalAxis = AXIS.Y;
            bathtub.children[0].material.visible = true;
            temp_bathtub.add(bathtub);
            scene.add(temp_bathtub);
            objects.push(temp_bathtub);
        },
    );
}


const UI = observer(() => {

    useEffect(() => {
        resize();
    }, []);

    const [menuOption, setMenuOption] = useState([false, false, false, false, false, false, false, false, false]);
    const [isCategory, setIsCategory] = useState(false);
    const { isAdd, setAdd } = useState(false);

    function AssignVal(e) {

        STORE[e.target.id] = e.target.value;
        if (door !== null) {
            if (door.children[0].userData.normalAxis === AXIS.X) {
                if (door.children[0].userData.dir === DIR.START)
                    door.position.x = -STORE.Width / 2;
                else
                    door.position.x = STORE.Width / 2;
            } else if (door.children[0].userData.normalAxis === AXIS.Z) {
                if (door.children[0].userData.dir === DIR.START)
                    door.position.z = -STORE.Length / 2;
                else
                    door.position.z = STORE.Length / 2;
            }
        }
    }


    Update();


    return <div className='container vh-100 overflow-auto'>
        <Navbar />
        <Sidebar

            menuOption={menuOption}
            setMenuOption={setMenuOption}
            setIsCategory={setIsCategory}
        />
        <div className="row content" >

            <div className="roomsSideBar" style={{ marginLeft: (menuOption[0] && !isCategory ? 0 : -400) }}>
                <h6 className='trig-btn  py-3 w-100 border-bottom' style={{ color: "black" }}>  Room Layout</h6>
                <div className="d-flex flex-wrap w-100">
                    <h6 className='trig-btn  w-100' style={{ color: "black", height: "30px" }}> Floor  Plan</h6>
                    <div className="d-flex flex-wrap w-100">
                        {Room_types.map(type => {

                            return <div onClick={e => {

                                STORE.cwidth = Math.min(STORE.width - 1000, STORE.cwidth);
                                STORE.clength = Math.min(STORE.length - 1000, STORE.clength);
                                STORE.type = type;

                            }} key={type} className="px-4 py-3 bg-white rounded-1 m-2 hover shadow">
                                <img src={"assets/ui/" + type + ".svg"} alt="" />
                            </div>
                        })}
                    </div>
                </div>
                <div className="d-flex flex-wrap w-100">
                    <h6 className='trig-btn py-3 w-100' style={{ color: "black" }}> Room  Dimensions</h6>
                    <div className="p-3 d-flex bg-white justify-content-between shadow-sm mb-3 flex-nowrap">
                        <span style={{ width: "220px" }}>Room Width</span>
                        <input onChange={AssignVal} type="range" id='width' value={STORE.width} min={2100} max={10000} className="form-range me-1" />
                        <input onChange={AssignVal} type="text" id='width' value={STORE.width} className="sizeInput"></input>
                        <span>mm</span>
                    </div>
                    <div className="p-3 d-flex bg-white justify-content-between shadow-sm mb-3 flex-nowrap">
                        <span style={{ width: "220px" }} >Room Length</span>
                        <input onChange={AssignVal} type="range" id='length' value={STORE.length} min={2100} max={10000} className="form-range" />
                        <input onChange={AssignVal} type="text" id='length' value={STORE.length} className="sizeInput"></input>
                        <span>mm</span>
                    </div>
                    <div className="p-3 d-flex bg-white justify-content-between shadow-sm mb-3 flex-nowrap">
                        <span style={{ width: "220px" }} >Room Height </span>
                        <input onChange={AssignVal} type="range" id='height' value={STORE.height} min={2000} max={10000} className="form-range" />
                        <input onChange={AssignVal} type="text" id='height' value={STORE.height} className="sizeInput"></input>
                        <span>mm</span>
                    </div>

                    {STORE.type > 1 && < div >
                        <div className="p-3 d-flex bg-white justify-content-between shadow-sm mb-3 flex-nowrap">
                            <span style={{ width: "220px" }} >Cutout width </span>
                            <input onChange={AssignVal} type="range" id='cwidth' value={STORE.cwidth} min={1000} max={STORE.width - 1000} className="form-range" />
                            <input onChange={AssignVal} type="text" id='cwidth' value={STORE.cwidth} className="sizeInput"></input>
                            <span>mm</span>
                        </div>
                        <div className="p-3 d-flex bg-white justify-content-between shadow-sm mb-3 flex-nowrap">
                            <span style={{ width: "230px" }} >Cutout length </span>
                            <input onChange={AssignVal} type="range" id='clength' value={STORE.clength} min={1000} max={STORE.length - 1000} className="form-range" />
                            <input onChange={AssignVal} type="text" id='clength' value={STORE.clength} className="sizeInput"></input>
                            <span>mm</span>
                        </div>
                    </div>}
                </div>

            </div>

            <div className='roomsSideBar' style={{ marginLeft: (menuOption[1] && !isCategory ? 0 : -400) }} >
                <h6 className='trig-btn  py-3 w-100 border-bottom' style={{ color: "black" }}> Bathroom Elements</h6>
                <div className="d-flex flex-wrap w-100">
                    <h6 className='trig-btn  w-100' style={{ color: "black", height: "30px" }}> Add Room Elements</h6>
                    <div className="d-flex flex-wrap w-100">
                        <div className='card m-2 d-flex align-items-center text-center p-2 rounded'>
                            <span className='m-2'>Door</span>
                            <img style={{ width: "80px" }} src="assets/ui/door.svg"></img>
                            <div className='btn m-2 rounded-5 shadow-sm'>Add to Plan +</div>
                        </div>
                        <div className='card m-2 d-flex align-items-center text-center p-2 rounded'>
                            <span className='m-2'>Window</span>
                            <img style={{ width: "80px" }} src="assets/ui/window.svg"></img>
                            <div className='btn m-2 rounded-5 shadow-sm'>Add to Plan +</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='roomsSideBar' >
                <h6 className='trig-btn py-3 w-100 border-bottom' style={{ color: "black" }}> Bathroom Products</h6>
                {
                    isCategory ? <Category
                        isAdd={isAdd}
                        setAdd={setAdd}

                    />
                        : <div className='px-3'>
                            <input placeholder='Search' type="search" className='d-flex w-100 rounded-4 shadow-sm w-100 mb-2 px-3' style={{ height: 40, border: "none" }} />
                            <div className="d-flex flex-wrap w-100">
                                <div className="d-flex flex-wrap w-100 justify-between">
                                    <div className='w-50 px-1'>
                                        <div className='card  d-flex align-items-center text-center p-2 rounded w-100 h-100' onClick={() => setIsCategory(true)}>
                                            <span className='m-2'>Baths & Spas</span>
                                            <img style={{ width: "70px", scale: "2" }} src="assets/ui/e09acac1-fc05-4078-bd84-73b765c26c31.png"></img>
                                        </div>
                                    </div>
                                    <div className='w-50 px-1'>
                                        <div className='card d-flex align-items-center text-center p-2 rounded w-100 h-100'>
                                            <span className='m-2'>Window</span>
                                            <img style={{ width: "70px" }} src="assets/ui/window.svg"></img>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                }
            </div>

            <div className='roomsSideBar' style={{ marginLeft: (menuOption[3] && !isCategory ? 0 : -400) }} >
                <h6 className='trig-btn  py-3 w-100 border-bottom' style={{ color: "black" }}> Styling</h6>
            </div>

            <div className='roomsSideBar' style={{ marginLeft: (menuOption[4] && !isCategory ? 0 : -400) }} >
                <h6 className='trig-btn  py-3 w-100 border-bottom' style={{ color: "black" }}> Product Summary</h6>
            </div>

            <div className='roomsSideBar' style={{ marginLeft: (menuOption[5] && !isCategory ? 0 : -400) }} >
                <h6 className='trig-btn  py-3 w-100 border-bottom' style={{ color: "black" }}> Consultation</h6>
            </div>

            <div className='roomsSideBar' style={{ marginLeft: (menuOption[6] && !isCategory ? 0 : -400) }} >
                <h6 className='trig-btn py-3 w-100 border-bottom' style={{ color: "black" }}> Exit Plan</h6>
            </div>
            <div className="col-12 position-relative p-0 m-0">
                <div id='measures' style={{ display: STORE.view !== 1 ? '' : 'none' }} className="top-0 start-0 position-absolute w-100 h-100">

                </div>
                <div id="canvas-container" className='border col-12'>

                </div>
                <div className="rightSideBar" style={{ left: window.innerWidth - 150 }}>
                    <div>
                        <img onClick={e => STORE.view = 0} className={(STORE.view === 0 ? 'active ' : '') + 'btn p-2 bg-light m-3 rounded-1'} src="assets/ui/2d.svg" alt="" />
                        <img onClick={e => STORE.view = 1} className={(STORE.view === 1 ? 'active ' : '') + 'btn p-2 bg-light  m-3 rounded-1'} src="assets/ui/3d_view.png" alt="" />
                        <img onClick={e => STORE.scale += 0.1} className='d-block shadow-focus btn p-2 bg-light  m-3 rounded-1' src="assets/ui/zoomin.svg" alt="" />
                        <img className='d-block shadow-focus btn p-2 bg-light  m-3 rounded-1' src="assets/ui/zoomout.svg" alt="" />
                    </div>
                </div>
            </div>

        </div>
    </div >
});

export default UI;