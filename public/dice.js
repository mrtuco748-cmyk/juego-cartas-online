let diceRenderer, diceScene, diceCam, diceMesh, ptLight;
let diceReady = false, diceRolling = false, diceQueue = [];

const STATE = {
  vy: 0, vx: 0, vz: 0, posY: 4, angVX: 0, angVY: 0, angVZ: 0,
  phase: 'idle', resolve: null, settleFrames: 0, resultShown: false, serverVal: null,
};

const FACES = [2,5,3,4,1,6];
const FACE_NORMALS = [
  new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0),
  new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1,0),
  new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1),
];

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

  const s = Math.min(window.innerWidth, 540);
  diceRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  diceRenderer.setSize(s, s);
  diceRenderer.shadowMap.enabled = true;
  diceRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  diceRenderer.domElement.style.cssText =
    'position:fixed;z-index:250;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;display:none;';
  document.body.appendChild(diceRenderer.domElement);

  diceCam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  diceCam.position.set(0, 3.5, 10);
  diceCam.lookAt(0, 2, 0);

  diceScene = new THREE.Scene();
  diceScene.background = null;

  diceScene.add(new THREE.AmbientLight(0xffeedd, 1.2));
  ptLight = new THREE.PointLight(0xff8800, 4.0, 25);
  ptLight.position.set(2, 8, 4); ptLight.castShadow = true;
  diceScene.add(ptLight);
  const fill = new THREE.DirectionalLight(0x4488ff, 0.6);
  fill.position.set(-3, 5, -2);
  diceScene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshLambertMaterial({ color: 0x2a1e0e, transparent: true, opacity: 0.15 })
  );
  floor.rotation.x = -Math.PI/2; floor.position.y = -0.6;
  floor.receiveShadow = true;
  diceScene.add(floor);

  const mats = FACES.map(n => new THREE.MeshLambertMaterial({ map: makeFace(n) }));
  diceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), mats);
  diceMesh.castShadow = true; diceMesh.visible = false;
  diceScene.add(diceMesh);

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

let resultOverlay = null;

function showResult(n) {
  if (resultOverlay) document.body.removeChild(resultOverlay);
  resultOverlay = document.createElement('div');
  resultOverlay.style.cssText =
    `position:fixed;z-index:260;top:50%;left:50%;transform:translate(-50%,-50%);
     font-size:clamp(80px,20vw,160px);font-weight:900;color:#fff;
     text-shadow:0 0 40px rgba(255,200,50,0.9),0 0 80px rgba(255,150,0,0.6),
      0 0 120px rgba(255,100,0,0.3);
     font-family:'Georgia',serif;pointer-events:none;
     animation:resultPop 0.4s ease-out;`;
  resultOverlay.textContent = n;
  document.body.appendChild(resultOverlay);
}

function startRoll(serverVal, resolve) {
  STATE.phase='falling';
  STATE.resolve=resolve;
  STATE.serverVal=serverVal;
  STATE.settleFrames=0;
  STATE.resultShown=false;
  STATE.vx=(Math.random()-0.5)*0.15;
  STATE.vy=-(0.4+Math.random()*0.8);
  STATE.vz=(Math.random()-0.5)*0.15;
  STATE.posY=4+Math.random()*1.5;
  STATE.angVX=(Math.random()-0.5)*0.7;
  STATE.angVY=(Math.random()-0.5)*0.7;
  STATE.angVZ=(Math.random()-0.5)*0.5;
  diceMesh.position.set((Math.random()-0.5)*2.5, STATE.posY, (Math.random()-0.5)*1.5);
  diceMesh.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
  diceMesh.visible=true;
  diceRenderer.domElement.style.display='block';
}

function tick() {
  requestAnimationFrame(tick);
  ptLight.intensity=3.5+Math.sin(performance.now()*0.02)*0.4;

  if(STATE.phase==='falling'){
    STATE.vy+=-0.04;
    STATE.posY+=STATE.vy;
    diceMesh.position.x+=STATE.vx;
    diceMesh.position.y=STATE.posY;
    diceMesh.position.z+=STATE.vz;
    diceMesh.rotation.x+=STATE.angVX;
    diceMesh.rotation.y+=STATE.angVY;
    diceMesh.rotation.z+=STATE.angVZ;
    STATE.vx*=0.995;
    STATE.vz*=0.995;

    if(STATE.posY<=-0.5){
      STATE.posY=-0.5;
      diceMesh.position.y=-0.5;
      STATE.vx*=0.7;
      STATE.vz*=0.7;
      if(Math.abs(STATE.vy)>0.08){
        STATE.vy=-STATE.vy*0.22;
        STATE.angVX*=0.9;STATE.angVY*=0.9;STATE.angVZ*=0.9;
      }else{
        STATE.vy=0;
        STATE.angVX*=0.65;STATE.angVY*=0.65;STATE.angVZ*=0.65;
        if(Math.abs(STATE.angVX)<0.002&&Math.abs(STATE.angVY)<0.002&&Math.abs(STATE.angVZ)<0.002){
          STATE.phase='settled';STATE.settleFrames=0;
        }
      }
    }
  }else if(STATE.phase==='settled'){
    STATE.settleFrames++;
    if(!STATE.resultShown&&STATE.settleFrames>15){
      STATE.resultShown=true;
      showResult(STATE.serverVal||getTopFace());
    }
    if(STATE.settleFrames>50&&STATE.resolve){
      const result=STATE.serverVal||getTopFace();
      const r=STATE.resolve;
      STATE.phase='idle';STATE.resolve=null;
      setTimeout(()=>{
        diceMesh.visible=false;
        diceRenderer.domElement.style.display='none';
        if(resultOverlay&&resultOverlay.parentNode)resultOverlay.parentNode.removeChild(resultOverlay);
        diceRolling=false;
        r(result);
        processQueue();
      },1500);
    }
  }

  diceRenderer.render(diceScene,diceCam);
}

function processQueue() {
  if(diceRolling||diceQueue.length===0)return;
  const {serverVal,resolve}=diceQueue.shift();
  if(!diceReady){
    setTimeout(()=>{diceRolling=false;resolve(serverVal||Math.floor(Math.random()*6)+1);processQueue();},50);
    return;
  }
  diceRolling=true;
  startRoll(serverVal,resolve);
}

function rollDice(serverVal) {
  return new Promise((resolve)=>{
    diceQueue.push({serverVal,resolve});
    processQueue();
  });
}

if(typeof THREE!=='undefined'&&THREE)initDice();
