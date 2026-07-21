import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const data = window.portfolio;
const canvas = document.querySelector("#world");
const loading = document.querySelector("#loading");
const progress = document.querySelector("#loading-progress");
const loadingStatus = document.querySelector("#loading-status");
const intro = document.querySelector("#intro-card");
const prompt = document.querySelector("#explore-prompt");
const panel = document.querySelector("#panel");
const panelContent = document.querySelector("#panel-content");
const mapOverview = document.querySelector("#map-overview");
const mapCanvas = document.querySelector("#map-canvas");
const mapContext = mapCanvas.getContext("2d");
const mobileDrive = document.querySelector("#mobile-drive");
const joystickRing = mobileDrive.querySelector(".joystick-ring");
const joystickThumb = mobileDrive.querySelector(".joystick-thumb");

progress.style.width = "18%";
loadingStatus.textContent = "Creating landscape…";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaedfff);
scene.fog = new THREE.FogExp2(0xaedfff, 0.0052);

const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 350);
camera.position.set(-13, 9, 17);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const hemi = new THREE.HemisphereLight(0xeaf8ff, 0x52765c, 2.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d0, 3.7);
sun.position.set(-35, 48, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -65;
sun.shadow.camera.right = sun.shadow.camera.top = 65;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 130;
sun.shadow.bias = -0.0004;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);
const mat = (color, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const mesh = (geometry, material, x=0, y=0, z=0) => { const m = new THREE.Mesh(geometry, material); m.position.set(x,y,z); m.castShadow = m.receiveShadow = true; return m; };

// One source of truth for the city. The 2D navigator projects these exact
// coordinates, so a building, an interaction zone and its map marker cannot drift apart.
const CITY = {
  bounds: { minX: -70, maxX: 70, minZ: -58, maxZ: 58 },
  roads: [
    [0, -50, 128, 8], [0, 50, 128, 8], [-64, 0, 8, 108], [64, 0, 8, 108],
    [-36.5, 0, 8, 104], [7, -27, 8, 50], [7, -2, 8, 8], [7, 36, 8, 32],
    [-50.25, 6, 27.5, 8], [7, -6, 100, 9], [7, 45, 100, 8]
  ],
  crosswalks: [
    {x:-36.5,z:-6,orientation:"vertical"},{x:7,z:-6,orientation:"vertical"},{x:64,z:-6,orientation:"vertical"},
    {x:7,z:-25,orientation:"horizontal"},{x:7,z:36,orientation:"horizontal"},{x:7,z:45,orientation:"horizontal"}
  ],
  plaza: { x: 8, z: 10, width: 18, depth: 16, fountainX: 8, fountainZ: 10 },
  buildings: [
    { id: "about", x: -16, z: -26, width: 27, depth: 22, height: 10, color: 0x91a5b7, mapColor: "#91a5b7", label: "ABOUT", subtitle: "Who I am and how I work" },
    { id: "projects", x: 32, z: -26, width: 27, depth: 22, height: 10, color: 0x799b70, mapColor: "#799b70", label: "PROJECTS", subtitle: "Selected work · 2025—2026" },
    { id: "experience", x: -16, z: 27, width: 27, depth: 22, height: 10, color: 0xb28a39, mapColor: "#b28a39", label: "EXPERIENCE", subtitle: "Experience and education" },
    { id: "contact", x: 32, z: 27, width: 27, depth: 22, height: 10, color: 0x8c789a, mapColor: "#8c789a", label: "CONTACT", subtitle: "Let’s build something" },
    { id: "home", x: -56, z: -25, width: 25, depth: 24, height: 10, color: 0x30343a, mapColor: "#30343a", label: "GARAGE", subtitle: "SPAWN" }
  ]
};
const cameraOccluders = [];

// Park district map
const solidColliders = [];
const addBoxCollider = (x, z, width, depth, padding = 0) => solidColliders.push({type:"box",minX:x-width/2-padding,maxX:x+width/2+padding,minZ:z-depth/2-padding,maxZ:z+depth/2+padding});
const addCircleCollider = (x, z, radius) => solidColliders.push({type:"circle",x,z,radius});
const ground = mesh(new THREE.BoxGeometry(144,.8,120),mat(0x79a85d,.95),0,-.55,0);
world.add(ground);
const border = mat(0x59624e,.9);
world.add(mesh(new THREE.BoxGeometry(140,.35,2.4),border,0,.15,CITY.bounds.minZ));
world.add(mesh(new THREE.BoxGeometry(140,.35,2.4),border,0,.15,CITY.bounds.maxZ));
world.add(mesh(new THREE.BoxGeometry(2.4,.35,116),border,CITY.bounds.minX,.15,0));
world.add(mesh(new THREE.BoxGeometry(2.4,.35,116),border,CITY.bounds.maxX,.15,0));
addBoxCollider(0,CITY.bounds.minZ,140,2.4,1.2);addBoxCollider(0,CITY.bounds.maxZ,140,2.4,1.2);addBoxCollider(CITY.bounds.minX,0,2.4,116,1.2);addBoxCollider(CITY.bounds.maxX,0,2.4,116,1.2);

const roadMat = mat(0x303a3e,.98);
const curbMat = mat(0xb8b7a1,.82);
const lineMat = new THREE.MeshBasicMaterial({color:0xf4f0d5});
function roadBox(x,z,width,depth){
  world.add(mesh(new THREE.BoxGeometry(width,.12,depth),roadMat,x,.06,z));
  world.add(mesh(new THREE.BoxGeometry(width+.8,.12,depth+.8),curbMat,x,.025,z));
  world.add(mesh(new THREE.BoxGeometry(width,.14,depth),roadMat,x,.085,z));
}
CITY.roads.forEach(([x,z,width,depth])=>roadBox(x,z,width,depth));
const roadRects=CITY.roads;
function isRoadPosition(x,z,clearance=1.4){return roadRects.some(([roadX,roadZ,width,depth])=>Math.abs(x-roadX)<width/2+clearance&&Math.abs(z-roadZ)<depth/2+clearance)}
function safeDecorPosition(x,z,clearance=2.2){
  if(!isRoadPosition(x,z,clearance))return [x,z];
  for(let distance=5;distance<=24;distance+=2){
    const candidates=[[x,z-distance],[x,z+distance],[x-distance,z],[x+distance,z],[x-distance,z-distance],[x+distance,z-distance],[x-distance,z+distance],[x+distance,z+distance]];
    const safe=candidates.find(([candidateX,candidateZ])=>!isRoadPosition(candidateX,candidateZ,clearance));
    if(safe)return safe;
  }
  return [x,z];
}
for(const z of [-50,-6,45,50]) for(let x=-56;x<=56;x+=7) world.add(mesh(new THREE.BoxGeometry(3.4,.025,.14),lineMat,x,.18,z));
for(const x of [-64,-36.5,64]) for(let z=-52;z<=52;z+=7) world.add(mesh(new THREE.BoxGeometry(.14,.025,3.4),lineMat,x,.18,z));
for(let z=-52;z<=-3;z+=7) world.add(mesh(new THREE.BoxGeometry(.14,.025,3.4),lineMat,7,.18,z));
for(let z=22;z<=52;z+=7) world.add(mesh(new THREE.BoxGeometry(.14,.025,3.4),lineMat,7,.18,z));
world.add(mesh(new THREE.BoxGeometry(.14,.025,2.2),lineMat,7,.18,-1));
CITY.crosswalks.forEach(({x,z,orientation})=>{
  for(let i=-3;i<=3;i++){
    const stripe=orientation === "vertical"
      ? new THREE.BoxGeometry(1.1,.035,5.2)
      : new THREE.BoxGeometry(5.2,.035,1.1);
    world.add(mesh(stripe,lineMat,x+(orientation === "vertical" ? i*1.55 : 0),.2,z+(orientation === "vertical" ? 0 : i*1.55)));
  }
});
function sidewalk(x,z,width,depth){world.add(mesh(new THREE.BoxGeometry(width,.16,depth),curbMat,x,.16,z));}

const water = mesh(new THREE.CircleGeometry(280,128),new THREE.MeshPhysicalMaterial({color:0x5db9e8,roughness:.18,metalness:.08,transparent:true,opacity:.9}),0,-5,0);
water.rotation.x=-Math.PI/2;scene.add(water);
for(let i=0;i<18;i++){const a=i/18*Math.PI*2,dist=132+Math.sin(i*3)*16;const mountain=mesh(new THREE.ConeGeometry(14+Math.random()*12,25+Math.random()*22,6),mat(i%2?0x7ca1a0:0x6e9496),Math.cos(a)*dist,6,Math.sin(a)*dist);mountain.rotation.y=a;scene.add(mountain);}

function makeTextTexture(title, subtitle=""){
  const c=document.createElement("canvas"); c.width=1024;c.height=512;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle="#1388ff";ctx.fillRect(0,0,26,c.height);
  ctx.fillStyle="#0c2340";ctx.font="800 104px Manrope, sans-serif";ctx.fillText(title,78,235);
  ctx.fillStyle="#63788d";ctx.font="500 35px DM Sans, sans-serif";ctx.fillText(subtitle,82,320);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}

function building(x,z,w,h,d,color,title,subtitle){
  const g=new THREE.Group();g.position.set(x,0,z);
  const body=mesh(new THREE.BoxGeometry(w,h,d),mat(color,.68),0,h/2,0);g.add(body);
  const roof=mesh(new THREE.BoxGeometry(w+.5,.35,d+.5),mat(0xffffff,.65),0,h+.15,0);g.add(roof);
  const glass=mat(0x7fc6f2,.18,.25);
  for(let yy=2;yy<h-1;yy+=2.6) for(let xx=-w/2+1.2;xx<w/2;xx+=2.2){
    const win=mesh(new THREE.BoxGeometry(1.3,1.25,.08),glass,xx,yy,d/2+.05);g.add(win);
  }
  const sign=mesh(new THREE.PlaneGeometry(Math.min(w*.82,11),Math.min(w*.82,11)/2),new THREE.MeshBasicMaterial({map:makeTextTexture(title,subtitle)}),0,h+2.1,d/2+.03);
  const entrance=mesh(new THREE.BoxGeometry(3.2,.15,2.4),curbMat,0,.1,d/2+1.4);g.add(entrance);
  g.add(sign);shadow(g);world.add(g);cameraOccluders.push(g);addBoxCollider(x,z,w,d,1.2);return g;
}

CITY.buildings.forEach(({x,z,width,depth,height,color,label,subtitle})=>building(x,z,width,height,depth,color,label,subtitle));
CITY.buildings.forEach(({x,z,width,depth})=>{
  // Keep a measured green setback between every sidewalk edge and the road curb.
  sidewalk(x,z,width+2.4,depth+2.4);
  world.add(mesh(new THREE.BoxGeometry(4,.17,3.2),curbMat,x,.18,z+depth/2+2.7));
});
const garage = CITY.buildings.find(building => building.id === "home");
const spawnZ=garage.z+garage.depth/2+7;
world.add(mesh(new THREE.BoxGeometry(14,.08,14),new THREE.MeshStandardMaterial({color:0x59605f,roughness:.9}),garage.x,.22,spawnZ));
world.add(mesh(new THREE.BoxGeometry(.18,.04,12),new THREE.MeshBasicMaterial({color:0xd6ae36}),garage.x-6.5,.28,spawnZ));
world.add(mesh(new THREE.BoxGeometry(.18,.04,12),new THREE.MeshBasicMaterial({color:0xd6ae36}),garage.x+6.5,.28,spawnZ));
world.add(mesh(new THREE.BoxGeometry(13,.04,.18),new THREE.MeshBasicMaterial({color:0xd6ae36}),garage.x,.28,spawnZ-6));

function bench(x,z,rotation=0){const [safeX,safeZ]=safeDecorPosition(x,z,2.5);const g=new THREE.Group();g.position.set(safeX,.2,safeZ);g.rotation.y=rotation;g.add(mesh(new THREE.BoxGeometry(2.8,.22,.5),mat(0x85512e,.8),0,1,0));g.add(mesh(new THREE.BoxGeometry(2.8,.18,.5),mat(0x85512e,.8),0,.35,0));g.add(mesh(new THREE.BoxGeometry(.16,.8,.4),mat(0x303536,.7),-.95,.4,0));g.add(mesh(new THREE.BoxGeometry(.16,.8,.4),mat(0x303536,.7),.95,.4,0));shadow(g);world.add(g);addBoxCollider(safeX,safeZ,3,1.4,1);}
function tree(x,z,s=1){const [safeX,safeZ]=safeDecorPosition(x,z,2.6*s);const g=new THREE.Group();g.position.set(safeX,0,safeZ);g.add(mesh(new THREE.CylinderGeometry(.28*s,.42*s,2.4*s,8),mat(0x76533b),0,1.2*s,0));const leaves=mat(Math.random()>.5?0x4f9e57:0x65ad5f,.9);g.add(mesh(new THREE.IcosahedronGeometry(1.5*s,1),leaves,0,3.2*s,0));g.add(mesh(new THREE.IcosahedronGeometry(1.1*s,1),leaves,.7*s,3.1*s,.3*s));shadow(g);world.add(g);addCircleCollider(safeX,safeZ,1.2*s);}
[
  [-55,-45,1.1],[-42,-45,.8],[-8,-45,.7],[18,-45,.9],[51,-45,1.1],[-55,45,1.1],[-40,45,.8],[0,45,.9],[42,45,1.1],[56,37,.8],
  [-31,-17,.75],[-3,-17,.7],[42,-17,.8],[-31,17,.8],[-3,17,.7],[42,17,.8],[-55,20,.8],[56,-18,.9],[56,12,.8]
].forEach(([x,z,s])=>tree(x,z,s));
function lamp(x,z){const [safeX,safeZ]=safeDecorPosition(x,z,1.8);const g=new THREE.Group();g.position.set(safeX,0,safeZ);g.add(mesh(new THREE.CylinderGeometry(.07,.11,3.2,8),mat(0x263b4d,.4,.7),0,1.6,0));g.add(mesh(new THREE.SphereGeometry(.25,12,8),new THREE.MeshStandardMaterial({color:0xffe9ac,emissive:0xffc85c,emissiveIntensity:2}),0,3.25,0));world.add(g);addCircleCollider(safeX,safeZ,.55);}
[-52,-43,-27,-15,20,38,53].forEach(x=>{lamp(x,-37);lamp(x,37);});[-30,-14,14,30].forEach(z=>{lamp(-52,z);lamp(53,z);});
bench(-47,-44);bench(-2,-44);bench(48,-44);bench(-2,43);bench(48,43);

const parkPath=mat(0xb49b70,.9);world.add(mesh(new THREE.BoxGeometry(CITY.plaza.width,.12,CITY.plaza.depth),parkPath,CITY.plaza.x,.08,CITY.plaza.z));
world.add(mesh(new THREE.BoxGeometry(CITY.plaza.width,.14,3),mat(0xc3a878,.9),CITY.plaza.x,.18,CITY.plaza.z));
world.add(mesh(new THREE.BoxGeometry(3,.14,CITY.plaza.depth),mat(0xc3a878,.9),CITY.plaza.x,.18,CITY.plaza.z));
const fountain=new THREE.Group();fountain.position.set(CITY.plaza.fountainX,.2,CITY.plaza.fountainZ);fountain.add(mesh(new THREE.CylinderGeometry(5,5.5,.45,8),mat(0x838b91,.5,.25),0,.2,0));fountain.add(mesh(new THREE.CylinderGeometry(3.8,3.8,.12,32),new THREE.MeshPhysicalMaterial({color:0x55bce9,roughness:.08,metalness:.2}),0,.48,0));fountain.add(mesh(new THREE.CylinderGeometry(.65,.9,1.7,8),mat(0x8d989e,.5,.3),0,1.2,0));fountain.add(mesh(new THREE.SphereGeometry(.5,16,10),new THREE.MeshPhysicalMaterial({color:0x55bce9,emissive:0x176fa1,emissiveIntensity:.4}),0,2.15,0));shadow(fountain);world.add(fountain);addCircleCollider(CITY.plaza.fountainX,CITY.plaza.fountainZ,5.5);
// Interactive area markers
const zones=[...CITY.buildings.filter(building=>building.id === "home"),...CITY.buildings.filter(building=>building.id !== "home")].map(building=>({
  id:building.id,
  label:building.id === "home" ? "Garage" : building.label[0] + building.label.slice(1).toLowerCase(),
  // Keep the interaction/menu marker behind each building so it does not sit
  // on the visible road or block the front entrance. Garage remains at spawn.
  pos:new THREE.Vector3(building.x,0,building.z + (building.id === "home" ? building.depth / 2 + 7 : -building.depth / 2 - 2)),
  radius:building.id === "home" ? 6 : 8
}));
zones.slice(1).forEach((zone,i)=>{
  const ring=mesh(new THREE.RingGeometry(3.1,3.35,48),new THREE.MeshBasicMaterial({color:0x1688ff,transparent:true,opacity:.72,side:THREE.DoubleSide}),zone.pos.x,.2,zone.pos.z);ring.rotation.x=-Math.PI/2;world.add(ring);
  const beam=mesh(new THREE.CylinderGeometry(2.9,2.9,5.5,32,1,true),new THREE.MeshBasicMaterial({color:0x48a6ff,transparent:true,opacity:.075,side:THREE.DoubleSide}),zone.pos.x,2.8,zone.pos.z);world.add(beam);
});

// Drivable car
const homeZone=zones.find(zone=>zone.id === "home");
const car=new THREE.Group();car.position.set(homeZone.pos.x,.18,homeZone.pos.z);car.rotation.y=Math.PI;world.add(car);
const paint=new THREE.MeshPhysicalMaterial({color:0x0878dc,roughness:.24,metalness:.58,clearcoat:.82,clearcoatRoughness:.12});
const darkPaint=new THREE.MeshPhysicalMaterial({color:0x092844,roughness:.25,metalness:.72,clearcoat:.45});
const glass=new THREE.MeshPhysicalMaterial({color:0x244e6d,roughness:.08,metalness:.15,transmission:.18,transparent:true,opacity:.95,clearcoat:.75});
const carBody=mesh(new RoundedBoxGeometry(2.5,.7,4.25,6,.22),paint,0,.78,0);carBody.geometry.translate(0,0,-.08);car.add(carBody);
const hood=mesh(new RoundedBoxGeometry(2.22,.34,1.25,5,.15),paint,0,1.22,-1.37);car.add(hood);
const cabin=mesh(new RoundedBoxGeometry(1.92,.86,1.82,8,.22),glass,0,1.43,.25);car.add(cabin);
const roof=mesh(new RoundedBoxGeometry(1.75,.08,1.55,4,.04),darkPaint,0,1.9,.24);car.add(roof);
const bumperMat=mat(0x10212f,.3,.72);car.add(mesh(new RoundedBoxGeometry(2.48,.22,.24,4,.08),bumperMat,0,.58,-2.16));car.add(mesh(new RoundedBoxGeometry(2.48,.22,.24,4,.08),bumperMat,0,.58,2.16));
const grille=mesh(new RoundedBoxGeometry(1.25,.16,.06,3,.03),mat(0x0b1721,.4,.8),0,.75,-2.29);car.add(grille);
const wheels=[];
for(const x of [-1.23,1.23])for(const z of [-1.4,1.4]){
  const tire=mesh(new THREE.TorusGeometry(.43,.17,14,24),mat(0x101820,.86),x,.48,z);tire.rotation.y=Math.PI/2;car.add(tire);wheels.push(tire);
  const rim=mesh(new THREE.CylinderGeometry(.25,.25,.12,16),mat(0xb9c8d2,.2,.85),x,.48,z);rim.rotation.z=Math.PI/2;car.add(rim);
}
for(const x of [-.76,.76]){const light=mesh(new RoundedBoxGeometry(.43,.2,.06,4,.04),new THREE.MeshPhysicalMaterial({color:0xfff7d4,emissive:0xffc86a,emissiveIntensity:4,roughness:.15}),x,.84,-2.28);car.add(light)}
for(const x of [-1.08,1.08]){const mirror=mesh(new RoundedBoxGeometry(.25,.16,.32,4,.08),darkPaint,x,1.47,-.52);car.add(mirror)}
const carShadow=mesh(new THREE.CircleGeometry(1.8,32),new THREE.MeshBasicMaterial({color:0x0a2d42,transparent:true,opacity:.22,depthWrite:false}),0,.025,0);carShadow.rotation.x=-Math.PI/2;car.add(carShadow);
carShadow.visible = false;
shadow(car);

// Replace the procedural fallback with the supplied BMW M3 Touring GLB.
const fallbackCarParts = car.children.filter(child => child !== carShadow);
const nativeBrakeMaterials = [];
const nativeReverseMaterials = [];
const nativeRearIndicatorMaterials = { left: [], right: [] };
const nativeFrontIndicatorMaterials = { left: [], right: [] };
let bmwModel = null;
let bmwModelBaseY = 0;
const wheelAssemblies = [];
const modelFrontWheels = [];
const modelAllWheels = [];
function halfGeometry(source, side) {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  const position = geometry.getAttribute("position");
  const keep = [];
  for (let i = 0; i < position.count; i += 3) {
    const centerX = (position.getX(i) + position.getX(i + 1) + position.getX(i + 2)) / 3;
    if ((side < 0 && centerX < 0) || (side > 0 && centerX >= 0)) keep.push(i, i + 1, i + 2);
  }
  const result = new THREE.BufferGeometry();
  Object.entries(geometry.attributes).forEach(([name, attribute]) => {
    const values = new attribute.array.constructor(keep.length * attribute.itemSize);
    keep.forEach((sourceIndex, outputIndex) => {
      for (let component = 0; component < attribute.itemSize; component++) values[outputIndex * attribute.itemSize + component] = attribute.array[sourceIndex * attribute.itemSize + component];
    });
    result.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
  });
  result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}
new GLTFLoader().load("assets/models/bmw-m3-touring.glb", gltf => {
  const bmw = gltf.scene;
  bmwModel = bmw;
  bmw.name = "BMW M3 Touring";
  const combinedRearLamps = [];
  const frontLampMeshes = [];
  bmw.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach(material => {
      if ((material.name || "").toLowerCase().includes("paint")) {
        material.color.set(0x1598ff);
        material.metalness = .72;
        material.roughness = .2;
        material.clearcoat = .8;
        material.clearcoatRoughness = .12;
      }
      material.envMapIntensity = 1.15;
      material.needsUpdate = true;
    });
  });
  const wheelCandidates=[];
  bmw.traverse(child=>{
    if(!child.isMesh||!/^(Tire_|Shared_Tire|M_Rim)/i.test(child.name))return;
    const center=child.getWorldPosition(new THREE.Vector3());
    car.worldToLocal(center);
    wheelCandidates.push({object:child,center});
  });
  const axleMin=Math.min(...wheelCandidates.map(item=>item.center.z));
  const axleMax=Math.max(...wheelCandidates.map(item=>item.center.z));
  const axleMiddle=(axleMin+axleMax)/2;
  wheelCandidates.forEach(({object,center})=>{
    const parentWorldQuaternion=object.parent.getWorldQuaternion(new THREE.Quaternion());
    const verticalAxis=new THREE.Vector3(0,1,0).applyQuaternion(parentWorldQuaternion.invert()).normalize();
    const rollingAxis=new THREE.Vector3(1,0,0).applyQuaternion(parentWorldQuaternion.invert()).normalize();
    const parentScale=object.parent.getWorldScale(new THREE.Vector3());
    const effectiveVerticalScale=Math.sqrt((verticalAxis.x*parentScale.x)**2+(verticalAxis.y*parentScale.y)**2+(verticalAxis.z*parentScale.z)**2)||1;
    // In the GLB, the front axle is on the negative local-Z side. The old
    // comparison selected the rear axle, so steering was visibly reversed.
    const wheel={object,baseQuaternion:object.quaternion.clone(),basePosition:object.position.clone(),verticalAxis,verticalScale:effectiveVerticalScale,rollingAxis,roll:0,suspensionOffset:0,front:center.z<axleMiddle};
    modelAllWheels.push(wheel);
    if(wheel.front) modelFrontWheels.push(wheel);
  });
  let box = new THREE.Box3().setFromObject(bmw);
  let size = box.getSize(new THREE.Vector3());
  bmw.scale.setScalar(4.85 / Math.max(size.x, size.z));
  box.setFromObject(bmw);
  size = box.getSize(new THREE.Vector3());
  if (size.x > size.z) bmw.rotation.y = -Math.PI / 2;
  // The downloaded model faces backward relative to our driving direction.
  bmw.rotation.y += Math.PI;
  box.setFromObject(bmw);
  const center = box.getCenter(new THREE.Vector3());
  bmw.position.set(-center.x, -box.min.y, -center.z);
  bmwModelBaseY = bmw.position.y;
  car.add(bmw);
  car.updateMatrixWorld(true);

  const assemblyMap = new Map();
  modelAllWheels.forEach(wheel => {
    const point = car.worldToLocal(wheel.object.getWorldPosition(new THREE.Vector3()));
    const key = `${wheel.front ? "front" : "rear"}-${point.x < 0 ? "left" : "right"}`;
    let assembly = assemblyMap.get(key);
    if (!assembly) {
      const group = new THREE.Group();
      group.name = `${key} wheel assembly`;
      bmw.add(group);
      assembly = { group, roots: new Set() };
      assemblyMap.set(key, assembly);
      wheelAssemblies.push(group);
    }
    let root = wheel.object;
    while (root.parent && root.parent !== bmw) root = root.parent;
    if (!assembly.roots.has(root)) {
      assembly.roots.add(root);
      assembly.group.attach(root);
    }
  });

  [true, false].forEach(front => {
    const axleWheels = modelAllWheels.filter(wheel => wheel.front === front && /^Tire_/i.test(wheel.object.name));
    if (axleWheels.length !== 2) return;
    const points = axleWheels.map(wheel => {
      const point = wheel.object.getWorldPosition(new THREE.Vector3());
      return car.worldToLocal(point);
    });
    const width = Math.abs(points[0].x - points[1].x) * .8;
    const axle = mesh(new THREE.BoxGeometry(width, .12, .12), mat(0x090f16, .55, .15), 0, (points[0].y + points[1].y) / 2, (points[0].z + points[1].z) / 2);
    car.add(axle);
  });

  // Connect controls to the lamp meshes already built into the BMW model.
  bmw.traverse(child => {
    if (!child.isMesh || !child.name.includes("M_LGlass")) return;
    const lampBox = new THREE.Box3().setFromObject(child);
    const lampCenter = lampBox.getCenter(new THREE.Vector3());
    const lampSize = lampBox.getSize(new THREE.Vector3());
    car.worldToLocal(lampCenter);
    if (lampCenter.z < -.45) {
      const headlightSources = Array.isArray(child.material) ? child.material : [child.material];
      const headlightMaterials = headlightSources.map(material => {
        const clone = material.clone();
        clone.emissive = new THREE.Color(0xfff2cf);
        clone.emissiveIntensity = 3.2;
        clone.toneMapped = false;
        return clone;
      });
      child.material = Array.isArray(child.material) ? headlightMaterials : headlightMaterials[0];
      if (child.name.includes("InnerClear")) {
        const accentSource = Array.isArray(child.material) ? child.material[0] : child.material;
        const accentMaterial = accentSource.clone();
        accentMaterial.color.set(0x32ff82);
        accentMaterial.emissive = new THREE.Color(0x32ff82);
        accentMaterial.emissiveIntensity = .75;
        accentMaterial.toneMapped = false;
        accentMaterial.transparent = true;
        accentMaterial.opacity = .58;
        const accent = new THREE.Mesh(child.geometry.clone(), accentMaterial);
        accent.name = "Continuous green lamp accent";
        accent.position.copy(child.position);
        accent.rotation.copy(child.rotation);
        accent.scale.copy(child.scale);
        accent.renderOrder = child.renderOrder + 2;
        child.parent.add(accent);
      }
      frontLampMeshes.push({source:child,combined:Math.abs(lampCenter.x)<lampSize.x*.35});
      return;
    }
    if (lampCenter.z < .45) return;
    const isTurnLens = child.name.includes("OuterClear");
    const isBrakeLens = child.name.includes("InnerClear");
    const isReverseLens = child.name.includes("OuterRed");
    if (isTurnLens && Math.abs(lampCenter.x) < lampSize.x * .35) {
      combinedRearLamps.push(child);
      return;
    }
    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const clonedMaterials = sourceMaterials.map(material => material.clone());
    child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
    clonedMaterials.forEach(material => {
      material.emissive = new THREE.Color(0x000000);
      material.emissiveIntensity = 0;
      material.toneMapped = false;
      if (isTurnLens) {
        nativeRearIndicatorMaterials[lampCenter.x < 0 ? "left" : "right"].push(material);
      } else if (isBrakeLens) nativeBrakeMaterials.push(material);
      else if (isReverseLens) nativeReverseMaterials.push(material);
    });
  });
  combinedRearLamps.forEach(source => {
    [-1, 1].forEach(side => {
      const material = (Array.isArray(source.material) ? source.material[0] : source.material).clone();
      material.emissive = new THREE.Color(0xff7900);
      material.emissiveIntensity = 0;
      material.toneMapped = false;
      material.transparent = true;
      const half = new THREE.Mesh(halfGeometry(source.geometry, side), material);
      half.name = `Native rear indicator ${side < 0 ? "left" : "right"}`;
      half.position.copy(source.position); half.rotation.copy(source.rotation); half.scale.copy(source.scale);
      half.renderOrder = source.renderOrder + 1;
      source.parent.add(half);
      car.updateMatrixWorld(true);
      const halfCenter = new THREE.Box3().setFromObject(half).getCenter(new THREE.Vector3());
      car.worldToLocal(halfCenter);
      nativeRearIndicatorMaterials[halfCenter.x < 0 ? "left" : "right"].push(material);
    });
  });
  frontLampMeshes.forEach(({source,combined}) => {
    const sides = combined ? [-1,1] : [0];
    sides.forEach(side => {
      const sourceMaterial = Array.isArray(source.material) ? source.material[0] : source.material;
      const material = sourceMaterial.clone();
      material.emissive = new THREE.Color(0xff7900);
      material.emissiveIntensity = 0;
      material.toneMapped = false;
      material.transparent = true;
      const geometry = combined ? halfGeometry(source.geometry,side) : source.geometry.clone();
      const overlay = new THREE.Mesh(geometry,material);
      overlay.name = "Native front indicator";
      overlay.position.copy(source.position);overlay.rotation.copy(source.rotation);overlay.scale.copy(source.scale);
      overlay.renderOrder=source.renderOrder+1;source.parent.add(overlay);
      car.updateMatrixWorld(true);
      const overlayCenter=new THREE.Box3().setFromObject(overlay).getCenter(new THREE.Vector3());
      car.worldToLocal(overlayCenter);
      nativeFrontIndicatorMaterials[overlayCenter.x<0?"left":"right"].push(material);
    });
  });
  fallbackCarParts.forEach(part => { part.visible = false; });
}, progressEvent => {
  if (progressEvent.total) loadingStatus.textContent = `Loading BMW ${Math.round(progressEvent.loaded / progressEvent.total * 100)}%`;
}, error => console.warn("BMW model failed to load; using procedural fallback", error));

progress.style.width="76%";loadingStatus.textContent="Starting the car…";

const keys={};let speed=0,steer=0,driving=false,currentZone=null,panelOpen=false,mapOpen=false,hazardOn=false,suspensionRaised=false,suspensionLift=0,landingSpring=0,landingSpringVelocity=0;
let verticalVelocity=0;let jumpQueued=false;let suspensionImpact=0;const groundY=.18;
const carVelocity=new THREE.Vector3();
addEventListener("keydown",e=>{const key=e.key.toLowerCase();if(key===" "&&!keys[" "]){jumpQueued=true}if(key==="t"&&!keys.t)hazardOn=!hazardOn;if(key==="y"&&!keys.y)suspensionRaised=!suspensionRaised;keys[key]=true;if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();driving=true;intro.classList.add("hidden")});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
let joystickPointerId=null;
function setJoystickKeys(event){
  const rect=joystickRing.getBoundingClientRect();
  const maxDistance=rect.width*.34;
  const dx=event.clientX-(rect.left+rect.width/2);
  const dy=event.clientY-(rect.top+rect.height/2);
  const distance=Math.min(Math.hypot(dx,dy),maxDistance);
  const angle=Math.atan2(dy,dx);
  const thumbX=Math.cos(angle)*distance;
  const thumbY=Math.sin(angle)*distance;
  const horizontal=thumbX/maxDistance;
  const vertical=-thumbY/maxDistance;
  joystickThumb.style.transform=`translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
  keys.w=vertical>.18||(Math.abs(horizontal)>.25&&vertical>-.3);keys.s=vertical<-.35;keys.a=horizontal<-.18;keys.d=horizontal>.18;
  if(Math.hypot(horizontal,vertical)>.18){driving=true;intro.classList.add("hidden")}
}
function releaseJoystick(){
  joystickPointerId=null;keys.w=keys.s=keys.a=keys.d=false;
  joystickThumb.style.transform="translate(-50%, -50%)";
}
joystickRing.addEventListener("pointerdown",event=>{event.preventDefault();joystickPointerId=event.pointerId;joystickRing.setPointerCapture(event.pointerId);setJoystickKeys(event)});
joystickRing.addEventListener("pointermove",event=>{if(event.pointerId===joystickPointerId)setJoystickKeys(event)});
joystickRing.addEventListener("pointerup",releaseJoystick);
joystickRing.addEventListener("pointercancel",releaseJoystick);

function resetCar(){car.position.set(homeZone.pos.x,groundY,homeZone.pos.z);car.rotation.set(0,Math.PI,0);speed=0;steer=0;verticalVelocity=0;jumpQueued=false;suspensionImpact=0;suspensionRaised=false;landingSpring=0;landingSpringVelocity=0;}
document.querySelector("#reset-car").addEventListener("click",resetCar);
document.querySelector("#start-driving").addEventListener("click",()=>{driving=true;intro.classList.add("hidden")});

function resolveSolidCollisions(){
  const vehicleRadius=1.45;
  for(const collider of solidColliders){
    if(collider.type==="circle"){
      const dx=car.position.x-collider.x,dz=car.position.z-collider.z;
      const distance=Math.hypot(dx,dz),minimum=collider.radius+vehicleRadius;
      if(distance<minimum){
        const angle=distance>.001?Math.atan2(dz,dx):0;
        car.position.x=collider.x+Math.cos(angle)*minimum;
        car.position.z=collider.z+Math.sin(angle)*minimum;
        speed*=.25;
      }
      continue;
    }
    const minX=collider.minX-vehicleRadius,maxX=collider.maxX+vehicleRadius,minZ=collider.minZ-vehicleRadius,maxZ=collider.maxZ+vehicleRadius;
    if(car.position.x<=minX||car.position.x>=maxX||car.position.z<=minZ||car.position.z>=maxZ)continue;
    const pushX=Math.min(car.position.x-minX,maxX-car.position.x);
    const pushZ=Math.min(car.position.z-minZ,maxZ-car.position.z);
    if(pushX<pushZ)car.position.x+=car.position.x<(minX+maxX)/2?-pushX:pushX;
    else car.position.z+=car.position.z<(minZ+maxZ)/2?-pushZ:pushZ;
    speed*=.25;
  }
}

function panelMarkup(id){
  if(id==="about")return `<p class="panel-index">01 · About</p><h2>A developer who cares about the details.</h2><p class="panel-lead">${data.about}</p><div class="fact-row">${data.facts.map(f=>`<div class="fact"><strong>${f.number}</strong><span>${f.label}</span></div>`).join("")}</div>`;
  if(id==="projects")return `<p class="panel-index">02 · Selected work</p><h2>Projects I’ve learned from.</h2><p class="panel-lead">A selection of practical products I’ve built independently and with a team.</p>${data.projects.map(p=>`<article class="project-card"><div class="project-card-top"><span>${p.category}</span><span>${p.year}</span></div><h3>${p.title}</h3><p class="company">${p.company}</p><p>${p.description}</p><div class="tags">${p.tech.map(t=>`<span>${t}</span>`).join("")}</div></article>`).join("")}`;
  if(id==="experience")return `<p class="panel-index">03 · Journey</p><h2>Experience and education.</h2><p class="panel-lead">I’m still early in my career, building a solid foundation through university, projects, and organizational work.</p>${data.timeline.map(t=>`<article class="timeline-item"><time>${t.period}</time><div><h3>${t.role}</h3><p>${t.place} · ${t.type}</p></div></article>`).join("")}<h3 class="skill-title">Tools I work with</h3>${Object.entries(data.skills).map(([g,s])=>`<p class="panel-index">${g}</p><div class="skill-list">${s.map(x=>`<span>${x}</span>`).join("")}</div>`).join("")}`;
  if(id==="contact")return `<p class="panel-index">04 · Contact</p><h2>Let’s work together.</h2><p class="panel-lead">I’m open to internships, junior developer roles, and collaborative web projects. If you think I could be a good fit, send me a message.</p><div class="contact-links"><a href="mailto:${data.email}"><span>${data.email}</span><b>↗</b></a>${data.socials.filter(x=>x.label!=="Email").map(x=>`<a href="${x.url}" target="_blank" rel="noreferrer"><span>${x.label}</span><b>↗</b></a>`).join("")}<a href="assets/CV_Dimas_Al_Gazali_EN.pdf" download><span>Download résumé</span><b>↓</b></a></div>`;
  return "";
}
function openPanel(id){if(id==="home"){closePanel();return}panelContent.innerHTML=panelMarkup(id);panel.classList.add("open");panel.setAttribute("aria-hidden","false");panelOpen=true;prompt.classList.remove("visible");}
function closePanel(){panel.classList.remove("open");panel.setAttribute("aria-hidden","true");panelOpen=false;}
document.querySelector("#panel-close").addEventListener("click",closePanel);
prompt.addEventListener("click",()=>currentZone&&openPanel(currentZone.id));
function toggleMap(){mapOpen=!mapOpen;mapOverview.classList.toggle("open",mapOpen);mapOverview.setAttribute("aria-hidden",String(!mapOpen));document.querySelector("#map-toggle").classList.toggle("active",mapOpen);if(mapOpen)drawMap();}
document.querySelector("#map-toggle").addEventListener("click",toggleMap);
document.querySelector("#map-close").addEventListener("click",toggleMap);
document.querySelectorAll("[data-place]").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();const z=zones.find(x=>x.id===btn.dataset.place);if(z){car.position.set(z.pos.x,.18,z.pos.z);if(z.id==="home")car.rotation.y=Math.PI;speed=0;if(z.id==="home"){closePanel();intro.classList.remove("hidden")}else openPanel(z.id)}}));

let mapLayout={size:0,scale:0,offset:0};
const mapMarker={x:null,z:null,rotation:0};
function drawMap(){
  const size=Math.max(1,Math.min(mapCanvas.clientWidth,mapCanvas.clientHeight));
  const ratio=Math.min(devicePixelRatio,2);mapCanvas.width=size*ratio;mapCanvas.height=size*ratio;mapContext.setTransform(ratio,0,0,ratio,0,0);
  const {minX,maxX,minZ,maxZ}=CITY.bounds;const padding=16;const scale=Math.min((size-padding*2)/(maxX-minX),(size-padding*2)/(maxZ-minZ));
  const offset=(size-((maxX-minX)*scale))/2;const px=x=>offset+(x-minX)*scale;const py=z=>offset+(z-minZ)*scale;
  mapLayout={size,scale,offset,px,py};
  mapContext.clearRect(0,0,size,size);mapContext.fillStyle="#6e9e50";mapContext.fillRect(0,0,size,size);
  for(let x=minX;x<maxX;x+=4)for(let z=minZ;z<maxZ;z+=4){const n=(Math.sin(x*17.13+z*5.71)*43758.5453)%1;mapContext.fillStyle=n>.52?"rgba(218,235,126,.2)":"rgba(37,91,48,.12)";mapContext.fillRect(px(x+Math.abs(n)*2),py(z+Math.abs(n)*2),Math.max(1,scale*.7),Math.max(1,scale*.7))}
  const rounded=(x,z,w,d,r,fill,stroke)=>{const left=px(x-w/2),top=py(z-d/2),width=w*scale,height=d*scale;mapContext.beginPath();mapContext.roundRect(left,top,width,height,r*scale);mapContext.fillStyle=fill;mapContext.fill();if(stroke){mapContext.strokeStyle=stroke;mapContext.lineWidth=Math.max(1,scale);mapContext.stroke()}};
  const roadRect=(x,z,w,d)=>{rounded(x+1,z+1,w,d,2,"rgba(13,35,31,.24)");rounded(x,z,w,d,2,"#b5b4a2");rounded(x,z,w-2.2,d-2.2,1.6,"#303b3d")};
  // Keep a single perimeter road on the far right; the inner x=51 lane
  // beside Projects/Contact is intentionally omitted.
  rounded(0,0,136,108,7,"#b5b4a2");rounded(0,0,132,104,5,"#303b3d");rounded(0,0,124,96,3,"#6e9e50");
  CITY.roads.slice(4).forEach(([x,z,w,d])=>roadRect(x,z,w,d));
  const centerLine=(x1,z1,x2,z2)=>{mapContext.save();mapContext.strokeStyle="rgba(245,241,216,.92)";mapContext.lineWidth=Math.max(1,scale*.75);mapContext.setLineDash([5*scale,6*scale]);mapContext.beginPath();mapContext.moveTo(px(x1),py(z1));mapContext.lineTo(px(x2),py(z2));mapContext.stroke();mapContext.restore()};
  centerLine(-62,-50,62,-50);centerLine(-62,50,62,50);centerLine(-64,-6,64,-6);centerLine(-36.5,-51,-36.5,51);centerLine(64,-51,64,51);centerLine(7,-51,7,-11);centerLine(7,-6,7,1);centerLine(7,20,7,51);centerLine(-63,6,-37,6);
  CITY.crosswalks.forEach(({x,z,orientation})=>{for(let i=-3;i<=3;i++){mapContext.fillStyle="#f6f2d9";if(orientation==="vertical")mapContext.fillRect(px(x-4.6+i*1.45),py(z-3),1.1*scale,6*scale);else mapContext.fillRect(px(x-3),py(z-4.6+i*1.45),6*scale,1.1*scale)}});
  const plaza=CITY.plaza;rounded(plaza.x,plaza.z,plaza.width+4,plaza.depth+4,2,"rgba(35,65,35,.25)");rounded(plaza.x,plaza.z,plaza.width,plaza.depth,1,"#b49b70","#e1d0ad");mapContext.fillStyle="#c9ad7d";mapContext.fillRect(px(plaza.x-plaza.width/2),py(plaza.z-1.5),plaza.width*scale,3*scale);mapContext.fillRect(px(plaza.x-1.5),py(plaza.z-plaza.depth/2),3*scale,plaza.depth*scale);
  mapContext.fillStyle="#55bce9";mapContext.beginPath();mapContext.arc(px(plaza.fountainX),py(plaza.fountainZ),Math.max(5,4.2*scale),0,Math.PI*2);mapContext.fill();mapContext.strokeStyle="#eef8ff";mapContext.lineWidth=2;mapContext.stroke();mapContext.fillStyle="#687d86";mapContext.beginPath();mapContext.arc(px(plaza.fountainX),py(plaza.fountainZ),Math.max(2,1.1*scale),0,Math.PI*2);mapContext.fill();
  const trees=[[-56,-42,2.5],[-48,-42,1.8],[-4,-42,1.7],[42,-42,2.2],[56,-42,2.5],[-56,42,2.2],[-48,42,1.8],[-2,42,2],[43,42,2.2],[56,42,1.8],[-55,16,2.1],[-28,-15,1.7],[-2,-15,1.5],[-28,17,1.7],[-2,18,1.5],[57,-15,1.8],[57,17,1.8],[19,21,1.5]];
  trees.forEach(([x,z,r])=>{mapContext.fillStyle="rgba(20,56,31,.3)";mapContext.beginPath();mapContext.arc(px(x)+2,py(z)+3,r*scale,0,Math.PI*2);mapContext.fill();mapContext.fillStyle="#3f843d";mapContext.beginPath();mapContext.arc(px(x),py(z),r*scale,0,Math.PI*2);mapContext.fill();mapContext.fillStyle="#72ae43";mapContext.beginPath();mapContext.arc(px(x-r*.25),py(z-r*.28),r*.42*scale,0,Math.PI*2);mapContext.fill()});
  const lamps=[[-42,-42],[-29,-8],[0,-8],[43,-8],[57,-42],[-42,42],[0,42],[43,42],[-5,8],[19,8],[19,22]];
  lamps.forEach(([x,z])=>{mapContext.fillStyle="#172c2e";mapContext.fillRect(px(x)-1,py(z)-5,2,9);mapContext.fillStyle="#ffd766";mapContext.beginPath();mapContext.arc(px(x),py(z)-6,2.2,0,Math.PI*2);mapContext.fill()});
  const benches=[[-30,-42],[28,-42],[-31,8],[31,8],[-31,42],[43,42],[0,22],[19,22]];
  benches.forEach(([x,z])=>{mapContext.fillStyle="#70462b";mapContext.fillRect(px(x)-5,py(z)-1.5,10,2);mapContext.fillRect(px(x)-4,py(z)+2,2,2);mapContext.fillRect(px(x)+2,py(z)+2,2,2)});
  CITY.buildings.forEach(building=>{
    const left=px(building.x-building.width/2),top=py(building.z-building.depth/2),width=building.width*scale,height=building.depth*scale;
    rounded(building.x,building.z,building.width+5,building.depth+5,2,"rgba(22,48,32,.3)");rounded(building.x,building.z,building.width+3,building.depth+3,2,"#d3d0bc");rounded(building.x,building.z,building.width,building.depth,2,building.mapColor,"#f1f0d9");
    mapContext.fillStyle="rgba(255,255,255,.18)";mapContext.fillRect(left+width*.12,top+height*.14,width*.76,height*.08);
    mapContext.fillStyle="#fff";mapContext.font=`800 ${Math.max(8,Math.min(14,size*.022))}px Manrope, sans-serif`;mapContext.textAlign="center";mapContext.textBaseline="middle";mapContext.fillText(building.label,px(building.x),py(building.z));
    mapContext.fillStyle="#6c8794";for(let i=-1;i<=1;i++)mapContext.fillRect(px(building.x+i*6)-2,py(building.z+building.depth/2-2),4,2);
  });
  // Garage has the larger footprint and a clearly marked spawn bay below it.
  mapContext.fillStyle="#59605f";mapContext.fillRect(px(garage.x-7),py(spawnZ-7),14*scale,14*scale);mapContext.strokeStyle="#e0b93f";mapContext.lineWidth=2;mapContext.strokeRect(px(garage.x-6),py(spawnZ-6),12*scale,12*scale);mapContext.fillStyle="#e0b93f";mapContext.font=`800 ${Math.max(7,size*.016)}px sans-serif`;mapContext.fillText("SPAWN",px(garage.x),py(spawnZ));
  if(mapMarker.x===null){mapMarker.x=car.position.x;mapMarker.z=car.position.z;mapMarker.rotation=car.rotation.y}
  const targetX=car.position.x,targetZ=car.position.z,targetRotation=car.rotation.y;
  mapMarker.x=THREE.MathUtils.lerp(mapMarker.x,targetX,.22);mapMarker.z=THREE.MathUtils.lerp(mapMarker.z,targetZ,.22);mapMarker.rotation=THREE.MathUtils.lerp(mapMarker.rotation,targetRotation,.22);
  const markerRadius=Math.max(5,6*scale);mapContext.fillStyle="#1288ff";mapContext.beginPath();mapContext.arc(px(mapMarker.x),py(mapMarker.z),markerRadius,0,Math.PI*2);mapContext.fill();mapContext.strokeStyle="#fff";mapContext.lineWidth=2;mapContext.stroke();
  mapContext.save();mapContext.translate(px(mapMarker.x),py(mapMarker.z));mapContext.rotate(-mapMarker.rotation);mapContext.fillStyle="#fff";mapContext.beginPath();mapContext.moveTo(0,-markerRadius-5);mapContext.lineTo(-4,markerRadius-1);mapContext.lineTo(4,markerRadius-1);mapContext.closePath();mapContext.fill();mapContext.restore();
}
function mapPlaceAt(event){
  if(!mapOpen||!mapLayout.size)return;
  const rect=mapCanvas.getBoundingClientRect();const x=(event.clientX-rect.left)*(mapCanvas.width/rect.width)/Math.min(devicePixelRatio,2);const z=(event.clientY-rect.top)*(mapCanvas.height/rect.height)/Math.min(devicePixelRatio,2);
  const worldX=(x-mapLayout.offset)/mapLayout.scale+CITY.bounds.minX;const worldZ=(z-mapLayout.offset)/mapLayout.scale+CITY.bounds.minZ;
  const target=CITY.buildings.find(building=>Math.abs(worldX-building.x)<building.width/2&&Math.abs(worldZ-building.z)<building.depth/2);
  if(!target)return;
  const zone=zones.find(item=>item.id===target.id);car.position.set(zone.pos.x,.18,zone.pos.z);speed=0;toggleMap();
  if(target.id==="home"){closePanel();intro.classList.remove("hidden")}else openPanel(target.id);
}
mapCanvas.addEventListener("click",mapPlaceAt);

// Lightweight synthesized engine audio, opt-in only
let audioCtx,osc,gain,soundOn=false;
function toggleSound(){
  if(!audioCtx){audioCtx=new AudioContext();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type="sawtooth";osc.frequency.value=42;gain.gain.value=0;osc.connect(gain).connect(audioCtx.destination);osc.start()}
  soundOn=!soundOn;document.querySelector("#sound").classList.toggle("muted",!soundOn);
}
document.querySelector("#sound").addEventListener("click",toggleSound);

const clock=new THREE.Clock();const targetCam=new THREE.Vector3(),lookAt=new THREE.Vector3(),cameraRaycaster=new THREE.Raycaster();
let cameraOrbit=0,cameraHeight=6.8,cameraDistance=11.5,cameraDragging=false,lastPointerX=0,lastPointerY=0;
canvas.addEventListener("pointerdown",event=>{cameraDragging=true;lastPointerX=event.clientX;lastPointerY=event.clientY;canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener("pointermove",event=>{
  if(!cameraDragging)return;
  cameraOrbit-=(event.clientX-lastPointerX)*.0038;
  cameraHeight=THREE.MathUtils.clamp(cameraHeight+(event.clientY-lastPointerY)*.012,3.4,10);
  lastPointerX=event.clientX;lastPointerY=event.clientY;
});
canvas.addEventListener("pointerup",()=>cameraDragging=false);
canvas.addEventListener("pointercancel",()=>cameraDragging=false);
canvas.addEventListener("wheel",event=>{event.preventDefault();cameraDistance=THREE.MathUtils.clamp(cameraDistance+event.deltaY*.007,7,18)},{passive:false});
function updateCar(dt,time){
  if(panelOpen)return;
  suspensionLift=THREE.MathUtils.lerp(suspensionLift,suspensionRaised?.48:0,1-Math.pow(.0008,dt));
  landingSpringVelocity+=(-landingSpring*48-landingSpringVelocity*11)*dt;
  landingSpring+=landingSpringVelocity*dt;
  const forward=keys.w||keys.arrowup,back=keys.s||keys.arrowdown,left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright;
  const braking=keys.b||(back&&speed>.35)||(forward&&speed<-.35);
  const hazard=hazardOn;
  const blinkOn=Math.sin(time*8)>0;
  nativeBrakeMaterials.forEach(material=>{material.emissive.set(0xff1000);material.emissiveIntensity=braking?4:.18});
  nativeReverseMaterials.forEach(material=>{material.emissive.set(0xffffff);material.emissiveIntensity=back?4:0});
  nativeRearIndicatorMaterials.left.forEach(material=>{material.emissiveIntensity=(left||hazard)&&blinkOn?5:0});
  nativeRearIndicatorMaterials.right.forEach(material=>{material.emissiveIntensity=(right||hazard)&&blinkOn?5:0});
  nativeFrontIndicatorMaterials.left.forEach(material=>{material.emissiveIntensity=(left||hazard)&&blinkOn?9:0});
  nativeFrontIndicatorMaterials.right.forEach(material=>{material.emissiveIntensity=(right||hazard)&&blinkOn?9:0});
  const accel=forward?24:back?-15:0;
  if(keys.b) speed*=Math.pow(.78,dt*60);
  speed+=accel*dt;speed*=Math.pow(accel?0.988:0.91,dt*60);speed=THREE.MathUtils.clamp(speed,-9,21);
  const steerTarget=(left?1:0)+(right?-1:0);steer=THREE.MathUtils.lerp(steer,steerTarget,1-Math.pow(.0008,dt));
  if(Math.abs(speed)>.12)car.rotation.y+=steer*dt*1.35*THREE.MathUtils.clamp(speed/10,-1.05,1.2);
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(car.quaternion);carVelocity.copy(dir).multiplyScalar(speed*dt);car.position.add(carVelocity);
  const radial=Math.hypot(car.position.x,car.position.z);if(radial>85){car.position.multiplyScalar(85/radial);speed*=-.18}
  resolveSolidCollisions();
  const grounded=car.position.y<=groundY+.001;
  const wasAirborne=car.position.y>groundY+.02;
  const impactVelocity=verticalVelocity;
  if(jumpQueued&&grounded){verticalVelocity=5.2;jumpQueued=false;}
  if(!grounded||verticalVelocity>0){verticalVelocity-=14*dt;car.position.y+=verticalVelocity*dt;if(car.position.y<=groundY){car.position.y=groundY;verticalVelocity=0;}}
  else {jumpQueued=false;car.position.y=groundY+Math.sin(time*12)*Math.min(Math.abs(speed)*.0012,.012)}
  const airborne=Math.max(0,car.position.y-groundY);
  if(wasAirborne&&airborne<=.001&&impactVelocity<0){
    suspensionImpact=THREE.MathUtils.clamp(Math.abs(impactVelocity)*.025,.06,.17);
    landingSpring=0;
    landingSpringVelocity=-Math.min(1.2,Math.abs(impactVelocity)*.12);
  }
  suspensionImpact=THREE.MathUtils.lerp(suspensionImpact,0,1-Math.pow(.035,dt));
  const visualLift=suspensionLift+landingSpring;
  if(bmwModel)bmwModel.position.y=bmwModelBaseY+visualLift;
  if (bmwModel) wheelAssemblies.forEach(assembly => { assembly.position.y = -visualLift / bmwModel.scale.y; });
  car.rotation.x=THREE.MathUtils.lerp(car.rotation.x,airborne>.05?-verticalVelocity*.018:0,.12);car.rotation.z=THREE.MathUtils.lerp(car.rotation.z,-steer*Math.min(Math.abs(speed)*.006,.07),.12);
  wheels.forEach(w=>w.rotation.x-=speed*dt*1.9);
  modelFrontWheels.forEach(({object,baseQuaternion,verticalAxis})=>{
    object.userData.steeringRotation=new THREE.Quaternion().setFromAxisAngle(verticalAxis,steer*.32);
  });
  modelAllWheels.forEach(wheel=>{
    wheel.roll-=speed*dt*2.25;
    wheel.suspensionOffset=0;
    const steering=wheel.object.userData.steeringRotation||new THREE.Quaternion();
    const rolling=new THREE.Quaternion().setFromAxisAngle(wheel.rollingAxis,wheel.roll);
    wheel.object.quaternion.copy(steering).multiply(rolling).multiply(wheel.baseQuaternion);
  });
  if(soundOn&&gain){gain.gain.setTargetAtTime(.018+Math.abs(speed)*.002,audioCtx.currentTime,.08);osc.frequency.setTargetAtTime(38+Math.abs(speed)*4,audioCtx.currentTime,.07)}
}
function updateZone(){
  let closest=null,dist=Infinity;for(const z of zones.slice(1)){const d=car.position.distanceTo(z.pos);if(d<z.radius&&d<dist){closest=z;dist=d}}
  currentZone=closest;if(closest&&!panelOpen){prompt.querySelector("strong").textContent=closest.label;prompt.classList.add("visible")}else prompt.classList.remove("visible");
}
function updateCamera(dt){
  const offset=new THREE.Vector3(Math.sin(cameraOrbit)*cameraDistance,cameraHeight,Math.cos(cameraOrbit)*cameraDistance).applyQuaternion(car.quaternion);targetCam.copy(car.position).add(offset);
  // Keep the follow camera outside buildings when the car drives alongside a block.
  // Without this check the camera can enter a facade, making it fill the viewport.
  const cameraOrigin=car.position.clone().add(new THREE.Vector3(0,1.8,0));
  const cameraVector=targetCam.clone().sub(cameraOrigin);const cameraDistanceToTarget=cameraVector.length();
  if(cameraDistanceToTarget>0){
    cameraVector.normalize();cameraRaycaster.set(cameraOrigin,cameraVector);
    const hit=cameraRaycaster.intersectObjects(cameraOccluders,true)[0];
    if(hit)targetCam.copy(cameraOrigin).add(cameraVector.multiplyScalar(Math.max(4.5,hit.distance-.8)));
  }
  const responsiveness=1-Math.pow(.00001,dt);camera.position.lerp(targetCam,responsiveness*.62);lookAt.copy(car.position).add(new THREE.Vector3(0,1,-2.4).applyQuaternion(car.quaternion));camera.lookAt(lookAt);
}
function animate(){
  const dt=Math.min(clock.getDelta(),.04),time=clock.elapsedTime;updateCar(dt,time);updateZone();updateCamera(dt);
  if(mapOpen)drawMap();
  water.material.opacity=.88+Math.sin(time*.8)*.025;
  renderer.render(scene,camera);requestAnimationFrame(animate);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));if(mapOpen)drawMap()});
progress.style.width="100%";loadingStatus.textContent="Ready to explore";
setTimeout(()=>{loading.classList.add("done");animate()},450);
