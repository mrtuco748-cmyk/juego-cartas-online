let diceRenderer, diceScene, diceCam, diceMesh, ptLight;
let diceReady = false, diceRolling = false, diceQueue = [];

const STATE = {
  vy: 0, posY: 3, angVX: 0, angVY: 0, angVZ: 0,
  phase: 'idle', targetVal: null, resolve: null, settleCount: 0,
};

const FACES = [2,5,3,4,1,6];
const FACE_NORMALS = [
  new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0),
  new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1,0),
  new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1),
];
const SNAP_Q = {};

function makeFace(n) {
  const s=256, rd=30;
  const c=document.createElement('canvas');
  c.width=c.height=s;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#f5f0e8';
  ctx.beginPath();
  ctx.moveTo(rd,0);ctx.lineTo(s-rd,0);
  ctx.quadraticCurveTo(s,0,s,rd);
  ctx.lineTo(s,s-rd);
  ctx.quadraticCurveTo(s,s,s-rd,s);
  ctx.lineTo(rd,s);
  ctx.quadraticCurveTo(0,s,0,s-rd);
  ctx.lineTo(0,rd);
  ctx.quadraticCurveTo(0,0,rd,0);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ccc';ctx.lineWidth=6;ctx.stroke();
  ctx.fillStyle='#111';
  const dr=22;
  const p={1:[[128,128]],2:[[80,80],[176,176]],3:[[80,80],[128,128],[176,176]],4:[[80,80],[176,80],[80,176],[176,176]],5:[[80,80],[176,80],[128,128],[80,176],[176,176]],6:[[80,75],[176,75],[80,128],[176,128],[80,181],[176,181]]};
  for(const[px,py] of p[n]){ctx.beginPath();ctx.arc(px,py,dr,0,Math.PI*2);ctx.fill();}
  return new THREE.CanvasTexture(c);
}

function initDice() {
  if (diceReady) return;

  const s = Math.min(window.innerWidth, 500);
  diceRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  diceRenderer.setSize(s, s);
  diceRenderer.shadowMap.enabled = true;
  diceRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  diceRenderer.domElement.style.cssText =
    'position:fixed;z-index:250;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;display:none;';
  document.body.appendChild(diceRenderer.domElement);

  diceCam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  diceCam.position.set(0, 2, 9);
  diceCam.lookAt(0, 1, 0);

  diceScene = new THREE.Scene();
  diceScene.background = null;

  diceScene.add(new THREE.AmbientLight(0x3a2510, 1.5));
  ptLight = new THREE.PointLight(0xf97316, 3.0, 25);
  ptLight.position.set(0, 6, 3); ptLight.castShadow = true;
  diceScene.add(ptLight);
  for (const p of [[-5,3,-3],[5,3,-3]]) {
    const t = new THREE.PointLight(0xff6600, 1.8, 18);
    t.position.set(...p); diceScene.add(t);
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshLambertMaterial({ color: 0x2a1e0e, transparent: true, opacity: 0.25 })
  );
  floor.rotation.x = -Math.PI/2; floor.position.y = -0.6;
  floor.receiveShadow = true;
  diceScene.add(floor);

  const mats = FACES.map(n => new THREE.MeshLambertMaterial({ map: makeFace(n) }));
  diceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), mats);
  diceMesh.castShadow = true; diceMesh.visible = false;
  diceScene.add(diceMesh);

  for (let i=1;i<=6;i++) {
    const a={1:[Math.PI/2,0,0],2:[0,0,-Math.PI/2],3:[0,0,0],4:[Math.PI,0,0],5:[0,0,Math.PI/2],6:[-Math.PI/2,0,0]};
    SNAP_Q[i]=new THREE.Quaternion().setFromEuler(new THREE.Euler(...a[i]));
  }

  diceReady = true;
  tick();
}

function getTopFace() {
  const up=new THREE.Vector3(0,1,0);
  let best=-Infinity, idx=2;
  for(let i=0;i<6;i++){
    const wn=FACE_NORMALS[i].clone().applyQuaternion(diceMesh.quaternion);
    const d=wn.dot(up);
    if(d>best){best=d;idx=i;}
  }
  return FACES[idx];
}

function startRoll(targetVal, resolve) {
  STATE.phase='falling';
  STATE.targetVal=targetVal;
  STATE.resolve=resolve;
  STATE.settleCount=0;
  STATE.vy=-0.3+Math.random()*-0.5;
  STATE.posY=3+Math.random()*0.5;
  STATE.angVX=(Math.random()-0.5)*0.4;
  STATE.angVY=(Math.random()-0.5)*0.4;
  STATE.angVZ=(Math.random()-0.5)*0.3;
  diceMesh.position.set((Math.random()-0.5)*1.2, STATE.posY, (Math.random()-0.5)*0.8);
  diceMesh.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
  diceMesh.visible=true;
  diceRenderer.domElement.style.display='block';
}

function tick() {
  requestAnimationFrame(tick);
  ptLight.intensity=3.0+Math.sin(performance.now()*0.015)*0.3+Math.random()*0.1;

  if(STATE.phase==='falling'){
    STATE.vy+=-0.025;
    STATE.posY+=STATE.vy;
    diceMesh.position.y=STATE.posY;
    diceMesh.rotation.x+=STATE.angVX;
    diceMesh.rotation.y+=STATE.angVY;
    diceMesh.rotation.z+=STATE.angVZ;

    if(STATE.posY<=-0.5){
      STATE.posY=-0.5;
      diceMesh.position.y=-0.5;
      if(Math.abs(STATE.vy)>0.06){
        STATE.vy=-STATE.vy*0.35;
        STATE.angVX*=0.85;STATE.angVY*=0.85;STATE.angVZ*=0.85;
      }else{
        STATE.vy=0;
        STATE.angVX*=0.6;STATE.angVY*=0.6;STATE.angVZ*=0.6;
        if(Math.abs(STATE.angVX)<0.004&&Math.abs(STATE.angVY)<0.004&&Math.abs(STATE.angVZ)<0.004){
          if(STATE.targetVal!==null){
            const tq=SNAP_Q[STATE.targetVal];
            diceMesh.quaternion.slerp(tq,0.15);
            if(diceMesh.quaternion.angleTo(tq)<0.008){
              diceMesh.quaternion.copy(tq);
              STATE.phase='settled';STATE.settleCount=0;
            }
          }else{
            STATE.phase='settled';STATE.settleCount=0;
          }
        }
      }
    }
  }else if(STATE.phase==='settled'){
    STATE.settleCount++;
    if(STATE.settleCount>20&&STATE.resolve){
      const result=getTopFace();
      const r=STATE.resolve;
      STATE.phase='idle';STATE.resolve=null;
      setTimeout(()=>{
        diceMesh.visible=false;
        diceRenderer.domElement.style.display='none';
        diceRolling=false;
        r(result);
        processQueue();
      },500);
    }
  }

  diceRenderer.render(diceScene,diceCam);
}

function processQueue() {
  if(diceRolling||diceQueue.length===0)return;
  const {target,resolve}=diceQueue.shift();
  if(!diceReady){
    setTimeout(()=>{diceRolling=false;resolve(target);processQueue();},50);
    return;
  }
  diceRolling=true;
  startRoll(target,resolve);
}

function rollDice(targetValue) {
  return new Promise((resolve)=>{
    if(targetValue===undefined)targetValue=Math.floor(Math.random()*6)+1;
    diceQueue.push({target:targetValue,resolve});
    processQueue();
  });
}

if(typeof THREE!=='undefined'&&THREE)initDice();
