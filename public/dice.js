let diceRenderer, diceScene, diceCam, diceMesh, diceFloor;
let diceReady = false, diceRolling = false, diceQueue = [];
let diceOverlay = null, diceBackdrop = null;

const S = {
  vy: 0, vx: 0, vz: 0, posY: 3, angVX: 0, angVY: 0, angVZ: 0,
  phase: 'idle', resolve: null, settleFrames: 0, resultShown: false, serverVal: null,
};

const FACES = [2,5,3,4,1,6];
const FN = [
  new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0),
  new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1,0),
  new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1),
];
const FLOOR_TILT = -0.2;
const FLOOR_Y = -0.25;

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

function makeFloorTex() {
  const s=512;
  const c=document.createElement('canvas');
  c.width=c.height=s;
  const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  g.addColorStop(0,'rgba(60,50,70,0.25)');
  g.addColorStop(0.5,'rgba(40,35,50,0.12)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,s,s);
  return new THREE.CanvasTexture(c);
}

function initDice() {
  if (diceReady) return;

  diceBackdrop = document.createElement('div');
  diceBackdrop.style.cssText =
    'position:fixed;z-index:245;top:0;left:0;width:100%;height:100%;' +
    'pointer-events:none;display:none;' +
    'background:rgba(0,0,0,0.5);' +
    'backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);';
  document.body.appendChild(diceBackdrop);

  const s = Math.min(window.innerWidth, 400);
  diceRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  diceRenderer.setSize(s, s);
  diceRenderer.setClearColor(0x000000, 0);
  diceRenderer.domElement.style.cssText =
    'position:fixed;z-index:250;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'pointer-events:none;display:none;';
  document.body.appendChild(diceRenderer.domElement);

  diceCam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  diceCam.position.set(0, 3.2, 8);
  diceCam.lookAt(0, 0.6, 0);

  diceScene = new THREE.Scene();
  diceScene.background = null;

  const amb = new THREE.AmbientLight(0x8888bb, 0.8);
  diceScene.add(amb);
  const key = new THREE.DirectionalLight(0xeeeeff, 1.5);
  key.position.set(4, 8, 5);
  diceScene.add(key);
  const rim = new THREE.DirectionalLight(0xff8844, 1.0);
  rim.position.set(-5, 2, -4);
  diceScene.add(rim);
  const fill = new THREE.DirectionalLight(0xaabbff, 0.4);
  fill.position.set(-2, 1, 7);
  diceScene.add(fill);

  diceFloor = new THREE.Mesh(
    new THREE.CircleGeometry(3, 32),
    new THREE.MeshLambertMaterial({ map: makeFloorTex(), transparent: true, side: THREE.DoubleSide })
  );
  diceFloor.rotation.x = -Math.PI/2 + FLOOR_TILT;
  diceFloor.position.set(0, FLOOR_Y, 0.3);
  diceFloor.receiveShadow = false;
  diceScene.add(diceFloor);

  const mats = FACES.map(n => new THREE.MeshLambertMaterial({ map: makeFace(n) }));
  diceMesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), mats);
  diceMesh.castShadow = false;
  diceMesh.visible = false;
  diceScene.add(diceMesh);

  diceReady = true;
  tick();
}

function getTopFace() {
  const up=new THREE.Vector3(0,1,0);
  let best=-Infinity, idx=2;
  for(let i=0;i<6;i++){
    const wn=FN[i].clone().applyQuaternion(diceMesh.quaternion);
    const d=wn.dot(up);
    if(d>best){best=d;idx=i;}
  }
  return FACES[idx];
}

function showResult(n) {
  if (diceOverlay && diceOverlay.parentNode) diceOverlay.parentNode.removeChild(diceOverlay);
  const el = document.createElement('div');
  el.style.cssText =
    `position:fixed;z-index:260;top:50%;left:50%;transform:translate(-50%,-50%);
     font-size:clamp(68px,18vw,140px);font-weight:900;color:#fff;
     text-shadow:0 0 30px rgba(200,220,255,0.7),0 0 60px rgba(150,180,255,0.4);
     font-family:'Georgia',serif;pointer-events:none;
     animation:resultPop 0.35s ease-out;`;
  el.textContent = n;
  document.body.appendChild(el);
  diceOverlay = el;
}

function showDiceUI() {
  if (diceBackdrop) diceBackdrop.style.display = 'block';
  if (diceRenderer) diceRenderer.domElement.style.display = 'block';
}

function hideDiceUI() {
  if (diceBackdrop) diceBackdrop.style.display = 'none';
  if (diceRenderer) diceRenderer.domElement.style.display = 'none';
}

function startRoll(serverVal, resolve) {
  S.phase='falling'; S.resolve=resolve; S.serverVal=serverVal;
  S.settleFrames=0; S.resultShown=false;
  S.vx=(Math.random()-0.5)*0.18;
  S.vy=-(0.3+Math.random()*0.6);
  S.vz=(Math.random()-0.5)*0.12 + 0.15;
  S.posY=2.8+Math.random()*0.6;
  S.angVX=(Math.random()-0.5)*1.0;
  S.angVY=(Math.random()-0.5)*1.0;
  S.angVZ=(Math.random()-0.5)*0.7;
  diceMesh.position.set((Math.random()-0.5)*1.5, S.posY, (Math.random()-0.5)*0.8);
  diceMesh.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
  diceMesh.visible=true;
  showDiceUI();
}

function tick() {
  requestAnimationFrame(tick);

  if(S.phase==='falling'){
    S.vy+=-0.045;
    S.vz+=FLOOR_TILT*0.12;
    S.posY+=S.vy;
    diceMesh.position.x+=S.vx; diceMesh.position.y=S.posY; diceMesh.position.z+=S.vz;
    diceMesh.rotation.x+=S.angVX; diceMesh.rotation.y+=S.angVY; diceMesh.rotation.z+=S.angVZ;
    S.vx*=0.995; S.vz*=0.995;

    if(S.posY<=FLOOR_Y+0.05){
      S.posY=FLOOR_Y+0.05; diceMesh.position.y=FLOOR_Y+0.05;
      S.vx*=0.5; S.vz*=0.5;
      if(Math.abs(S.vy)>0.05){
        S.vy=-S.vy*0.15;
        S.angVX*=0.8; S.angVY*=0.8; S.angVZ*=0.8;
      }else{
        S.vy=0;
        S.angVX*=0.4; S.angVY*=0.4; S.angVZ*=0.4;
        if(Math.abs(S.angVX)<0.002&&Math.abs(S.angVY)<0.002&&Math.abs(S.angVZ)<0.002){
          diceMesh.rotation.x+=FLOOR_TILT*0.5;
          S.phase='settled'; S.settleFrames=0;
        }
      }
    }
  }else if(S.phase==='settled'){
    S.settleFrames++;
    if(!S.resultShown && S.settleFrames>12){
      S.resultShown=true;
      showResult(S.serverVal||getTopFace());
    }
    if(S.settleFrames>40 && S.resolve){
      const result=S.serverVal||getTopFace();
      const r=S.resolve;
      const overlay = diceOverlay;
      S.phase='idle'; S.resolve=null;
      setTimeout(()=>{
        diceMesh.visible=false;
        hideDiceUI();
        if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if(diceOverlay === overlay) diceOverlay = null;
        diceRolling=false;
        r(result);
        processQueue();
      },1200);
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
