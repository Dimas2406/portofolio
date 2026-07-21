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

// Island and roads
const island = mesh(new THREE.CylinderGeometry(88, 93, 3.2, 128), mat(0x91bf70), 0, -1.65, 0);
world.add(island);
const soil = mesh(new THREE.CylinderGeometry(92.8, 98, 2.4, 128), mat(0x856a4d), 0, -3.7, 0);
world.add(soil);
const roadMat = mat(0x293746, .98);
const road = mesh(new THREE.RingGeometry(31, 43, 128), roadMat, 0, .07, 0);
road.rotation.x = -Math.PI / 2;
world.add(road);
const crossRoad = mesh(new THREE.BoxGeometry(88, .14, 10), roadMat, 0, .12, 0);
world.add(crossRoad);
const verticalRoad = mesh(new THREE.BoxGeometry(10, .14, 88), roadMat, 0, .13, 0);
world.add(verticalRoad);

const lineMat = new THREE.MeshBasicMaterial({color:0xffffff});
for(let a=0;a<Math.PI*2;a+=.22){
  const dash=mesh(new THREE.BoxGeometry(2.7,.025,.15),lineMat,Math.cos(a)*37,.16,Math.sin(a)*37);
  dash.rotation.y=-a;
  world.add(dash);
}
for(let x=-42;x<=42;x+=6){ world.add(mesh(new THREE.BoxGeometry(3.4,.025,.14),lineMat,x,.2,0)); }
for(let z=-42;z<=42;z+=6){ world.add(mesh(new THREE.BoxGeometry(.14,.025,3.4),lineMat,0,.21,z)); }

// Water plane and distant mountains
const water = mesh(new THREE.CircleGeometry(280, 128), new THREE.MeshPhysicalMaterial({color:0x5db9e8,roughness:.18,metalness:.08,transparent:true,opacity:.9}), 0,-5,0);
water.rotation.x=-Math.PI/2; scene.add(water);
for(let i=0;i<18;i++){
  const a=i/18*Math.PI*2, dist=132+Math.sin(i*3)*16;
  const mountain=mesh(new THREE.ConeGeometry(14+Math.random()*12,25+Math.random()*22,6),mat(i%2?0x7ca1a0:0x6e9496),Math.cos(a)*dist,6,Math.sin(a)*dist);
  mountain.rotation.y=a; scene.add(mountain);
}

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
  g.add(sign);shadow(g);world.add(g);return g;
}

building(-43,-25,16,10,11,0xf4f9ff,"ABOUT","Who I am and how I work");
building(42,-29,19,13,12,0xe8f4ff,"PROJECTS","Selected work · 2025—2026");
building(44,28,17,11,11,0xffffff,"JOURNEY","Experience and education");
building(-41,29,16,9,11,0xeaf6ff,"CONTACT","Let’s build something");

// Trees, lamps, rocks and clouds
function tree(x,z,s=1){
  const g=new THREE.Group();g.position.set(x,0,z);
  g.add(mesh(new THREE.CylinderGeometry(.28*s,.42*s,2.4*s,8),mat(0x76533b),0,1.2*s,0));
  const leaves=mat(Math.random()>.5?0x4f9e57:0x65ad5f,.9);
  g.add(mesh(new THREE.IcosahedronGeometry(1.5*s,1),leaves,0,3.2*s,0));
  g.add(mesh(new THREE.IcosahedronGeometry(1.1*s,1),leaves,.7*s,3.1*s,.3*s));shadow(g);world.add(g);
}
for(let i=0;i<78;i++){
  const a=Math.random()*Math.PI*2,r=49+Math.random()*33;
  const x=Math.cos(a)*r,z=Math.sin(a)*r;
  const nearRoad=Math.abs(z)<7||Math.abs(x)<7||(r>29&&r<46);
  const nearBuilding=(Math.abs(x+43)<11&&Math.abs(z+25)<9)||(Math.abs(x-42)<12&&Math.abs(z+29)<10)||(Math.abs(x-44)<11&&Math.abs(z-28)<9)||(Math.abs(x+41)<11&&Math.abs(z-29)<9);
  if(nearRoad||nearBuilding)continue;
  tree(x,z,.65+Math.random()*.65);
}
function lamp(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);g.add(mesh(new THREE.CylinderGeometry(.07,.11,3.2,8),mat(0x263b4d,.4,.7),0,1.6,0));
  g.add(mesh(new THREE.SphereGeometry(.25,12,8),new THREE.MeshStandardMaterial({color:0xffe9ac,emissive:0xffc85c,emissiveIntensity:2}),0,3.25,0));world.add(g);
}
for(let a=0;a<Math.PI*2;a+=Math.PI/12)lamp(Math.cos(a)*45,Math.sin(a)*45);
for(let i=0;i<10;i++){const cloud=new THREE.Group();cloud.position.set(-70+i*15,24+(i%3)*5,-35-(i%2)*22);for(let j=0;j<4;j++)cloud.add(mesh(new THREE.SphereGeometry(3+j%2,12,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.72}),j*3,Math.sin(j)*1,0));scene.add(cloud);}

// Interactive area markers
const zones=[
  {id:"home",label:"Home",pos:new THREE.Vector3(-7,0,6),radius:7},
  {id:"about",label:"About",pos:new THREE.Vector3(-43,0,-14),radius:8},
  {id:"projects",label:"Projects",pos:new THREE.Vector3(41,0,-17),radius:9},
  {id:"experience",label:"Experience",pos:new THREE.Vector3(44,0,17),radius:8},
  {id:"contact",label:"Contact",pos:new THREE.Vector3(-41,0,18),radius:8}
];
zones.slice(1).forEach((zone,i)=>{
  const ring=mesh(new THREE.RingGeometry(3.1,3.35,48),new THREE.MeshBasicMaterial({color:0x1688ff,transparent:true,opacity:.72,side:THREE.DoubleSide}),zone.pos.x,.2,zone.pos.z);ring.rotation.x=-Math.PI/2;world.add(ring);
  const beam=mesh(new THREE.CylinderGeometry(2.9,2.9,5.5,32,1,true),new THREE.MeshBasicMaterial({color:0x48a6ff,transparent:true,opacity:.075,side:THREE.DoubleSide}),zone.pos.x,2.8,zone.pos.z);world.add(beam);
});

// Drivable car
const car=new THREE.Group();car.position.set(-6,.18,6);world.add(car);
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
const nativeIndicatorMaterials = { left: [], right: [] };
const nativeFrontIndicatorMaterials = { left: [], right: [] };
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
    if(!child.isMesh||!/^(Tire_|M_Rim)/i.test(child.name))return;
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
    const wheel={object,baseQuaternion:object.quaternion.clone(),basePosition:object.position.clone(),verticalAxis,verticalScale:effectiveVerticalScale,rollingAxis,roll:0,suspensionOffset:0,front:center.z>axleMiddle};
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
  car.add(bmw);
  car.updateMatrixWorld(true);

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
      frontLampMeshes.push({source:child,combined:Math.abs(lampCenter.x)<lampSize.x*.35});
      return;
    }
    if (lampCenter.z < .45) return;
    const isBrakeLens = child.name.includes("OuterRed");
    // Combined lamp meshes cross the center of the car and would illuminate both sides.
    // Indicators only use factory meshes that live entirely on one side.
    if (!isBrakeLens && Math.abs(lampCenter.x) < lampSize.x * .35) {
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
      if (isBrakeLens) nativeBrakeMaterials.push(material);
      else {
        const side = lampCenter.x < 0 ? "left" : "right";
        nativeIndicatorMaterials[side].push(material);
      }
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
      half.name = `Native indicator ${side < 0 ? "left" : "right"}`;
      half.position.copy(source.position); half.rotation.copy(source.rotation); half.scale.copy(source.scale);
      half.renderOrder = source.renderOrder + 1;
      source.parent.add(half);
      car.updateMatrixWorld(true);
      const halfCenter = new THREE.Box3().setFromObject(half).getCenter(new THREE.Vector3());
      car.worldToLocal(halfCenter);
      nativeIndicatorMaterials[halfCenter.x < 0 ? "left" : "right"].push(material);
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

const keys={};let speed=0,steer=0,driving=false,currentZone=null,panelOpen=false;
let verticalVelocity=0;let jumpQueued=false;let suspensionImpact=0;const groundY=.18;
const carVelocity=new THREE.Vector3();
addEventListener("keydown",e=>{const key=e.key.toLowerCase();if(key===" "&&!keys[" "]){jumpQueued=true}keys[key]=true;if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();driving=true;intro.classList.add("hidden")});
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

function resetCar(){car.position.set(-6,groundY,6);car.rotation.set(0,0,0);speed=0;steer=0;verticalVelocity=0;jumpQueued=false;suspensionImpact=0;}
document.querySelector("#reset-car").addEventListener("click",resetCar);
document.querySelector("#start-driving").addEventListener("click",()=>{driving=true;intro.classList.add("hidden")});

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
document.querySelectorAll("[data-place]").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();const z=zones.find(x=>x.id===btn.dataset.place);if(z){car.position.copy(z.pos).add(new THREE.Vector3(0,.18,2));speed=0;if(z.id==="home"){closePanel();intro.classList.remove("hidden")}else openPanel(z.id)}}));

// Lightweight synthesized engine audio, opt-in only
let audioCtx,osc,gain,soundOn=false;
function toggleSound(){
  if(!audioCtx){audioCtx=new AudioContext();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type="sawtooth";osc.frequency.value=42;gain.gain.value=0;osc.connect(gain).connect(audioCtx.destination);osc.start()}
  soundOn=!soundOn;document.querySelector("#sound").classList.toggle("muted",!soundOn);
}
document.querySelector("#sound").addEventListener("click",toggleSound);

const clock=new THREE.Clock();const targetCam=new THREE.Vector3(),lookAt=new THREE.Vector3();
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
  const forward=keys.w||keys.arrowup,back=keys.s||keys.arrowdown,left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright;
  const braking=keys.b||(back&&speed>.35)||(forward&&speed<-.35);
  const blinkOn=Math.sin(time*8)>0;
  nativeBrakeMaterials.forEach(material=>{material.emissive.set(0xff1000);material.emissiveIntensity=braking?4:.18});
  nativeIndicatorMaterials.left.forEach(material=>{material.emissive.set(0xff7900);material.emissiveIntensity=left&&blinkOn?5:0});
  nativeIndicatorMaterials.right.forEach(material=>{material.emissive.set(0xff7900);material.emissiveIntensity=right&&blinkOn?5:0});
  nativeFrontIndicatorMaterials.left.forEach(material=>{material.emissiveIntensity=left&&blinkOn?6:0});
  nativeFrontIndicatorMaterials.right.forEach(material=>{material.emissiveIntensity=right&&blinkOn?6:0});
  const accel=forward?24:back?-15:0;
  if(keys.b) speed*=Math.pow(.78,dt*60);
  speed+=accel*dt;speed*=Math.pow(accel?0.988:0.91,dt*60);speed=THREE.MathUtils.clamp(speed,-9,21);
  const steerTarget=(left?1:0)+(right?-1:0);steer=THREE.MathUtils.lerp(steer,steerTarget,1-Math.pow(.0008,dt));
  if(Math.abs(speed)>.12)car.rotation.y+=steer*dt*1.35*THREE.MathUtils.clamp(speed/10,-1.05,1.2);
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(car.quaternion);carVelocity.copy(dir).multiplyScalar(speed*dt);car.position.add(carVelocity);
  const radial=Math.hypot(car.position.x,car.position.z);if(radial>85){car.position.multiplyScalar(85/radial);speed*=-.18}
  const grounded=car.position.y<=groundY+.001;
  const wasAirborne=car.position.y>groundY+.02;
  const impactVelocity=verticalVelocity;
  if(jumpQueued&&grounded){verticalVelocity=5.2;jumpQueued=false;}
  if(!grounded||verticalVelocity>0){verticalVelocity-=14*dt;car.position.y+=verticalVelocity*dt;if(car.position.y<=groundY){car.position.y=groundY;verticalVelocity=0;}}
  else {jumpQueued=false;car.position.y=groundY+Math.sin(time*12)*Math.min(Math.abs(speed)*.0012,.012)}
  const airborne=Math.max(0,car.position.y-groundY);
  if(wasAirborne&&airborne<=.001&&impactVelocity<0)suspensionImpact=THREE.MathUtils.clamp(Math.abs(impactVelocity)*.025,.06,.17);
  suspensionImpact=THREE.MathUtils.lerp(suspensionImpact,0,1-Math.pow(.035,dt));
  car.rotation.x=THREE.MathUtils.lerp(car.rotation.x,airborne>.05?-verticalVelocity*.018:0,.12);car.rotation.z=THREE.MathUtils.lerp(car.rotation.z,-steer*Math.min(Math.abs(speed)*.006,.07),.12);
  wheels.forEach(w=>w.rotation.x-=speed*dt*1.9);
  modelFrontWheels.forEach(({object,baseQuaternion,verticalAxis})=>{
    object.userData.steeringRotation=new THREE.Quaternion().setFromAxisAngle(verticalAxis,steer*.32);
  });
  modelAllWheels.forEach(wheel=>{
    wheel.roll-=speed*dt*2.25;
    const suspensionTarget=airborne>.02?-Math.min(.3,.075+airborne*.12):suspensionImpact;
    wheel.suspensionOffset=THREE.MathUtils.lerp(wheel.suspensionOffset,suspensionTarget,1-Math.pow(airborne>.02?.055:.018,dt));
    wheel.object.position.copy(wheel.basePosition).addScaledVector(wheel.verticalAxis,wheel.suspensionOffset/wheel.verticalScale);
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
  const responsiveness=1-Math.pow(.00001,dt);camera.position.lerp(targetCam,responsiveness*.62);lookAt.copy(car.position).add(new THREE.Vector3(0,1,-2.4).applyQuaternion(car.quaternion));camera.lookAt(lookAt);
}
function animate(){
  const dt=Math.min(clock.getDelta(),.04),time=clock.elapsedTime;updateCar(dt,time);updateZone();updateCamera(dt);
  water.material.opacity=.88+Math.sin(time*.8)*.025;
  renderer.render(scene,camera);requestAnimationFrame(animate);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8))});
progress.style.width="100%";loadingStatus.textContent="Ready to explore";
setTimeout(()=>{loading.classList.add("done");animate()},450);
