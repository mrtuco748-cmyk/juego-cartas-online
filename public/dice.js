let diceRenderer, diceScene, diceCam, diceMesh, ptLight;
let diceReady = false, diceRolling = false, diceQueue = [];

// Physics state
const DICE = {
  vy: 0, posY: 8, angVX: 0, angVY: 0, angVZ: 0,
  phase: 'idle', targetResult: null, resolveRoll: null, settleCount: 0,
  faceMap: [2,5,3,4,1,6],
  faceNormals: [
    new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0),
    new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1,0),
    new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1),
  ],
  snapQ: {},
};

function makeDiceFace(n) {
  const s = 256, rd = 30;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f5f0e8';
  ctx.beginPath();
  ctx.moveTo(rd,0); ctx.lineTo(s-rd,0);
  ctx.quadraticCurveTo(s,0,s,rd);
  ctx.lineTo(s,s-rd);
  ctx.quadraticCurveTo(s,s,s-rd,s);
  ctx.lineTo(rd,s);
  ctx.quadraticCurveTo(0,s,0,s-rd);
  ctx.lineTo(0,rd);
  ctx.quadraticCurveTo(0,0,rd,0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#111';
  const dr = 22;
  const pos = {1:[[128,128]],2:[[80,80],[176,176]],3:[[80,80],[128,128],[176,176]],4:[[80,80],[176,80],[80,176],[176,176]],5:[[80,80],[176,80],[128,128],[80,176],[176,176]],6:[[80,75],[176,75],[80,128],[176,128],[80,181],[176,181]]};
  for (const [px,py] of pos[n]) { ctx.beginPath(); ctx.arc(px,py,dr,0,Math.PI*2); ctx.fill(); }
  return new THREE.CanvasTexture(c);
}

function initDice() {
  if (diceReady) return;
  diceCam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  diceCam.position.set(0, 7, 5); diceCam.lookAt(0,0,0);

  diceScene = new THREE.Scene();
  diceScene.background = null;

  diceScene.add(new THREE.AmbientLight(0x3a2510, 1.2));
  ptLight = new THREE.PointLight(0xf97316, 2.5, 20);
  ptLight.position.set(0,8,2); ptLight.castShadow = true;
  diceScene.add(ptLight);
  for (const p of [[-6,4,-2],[6,4,-2]]) {
    const t = new THREE.PointLight(0xff6600, 1.5, 15);
    t.position.set(...p); diceScene.add(t);
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8,8),
    new THREE.MeshLambertMaterial({ color: 0x2a1e0e, transparent: true, opacity: 0 })
  );
  floor.rotation.x = -Math.PI/2; floor.position.y = -1.2; floor.receiveShadow = true;
  diceScene.add(floor);

  const mats = DICE.faceMap.map(n => new THREE.MeshLambertMaterial({ map: makeDiceFace(n) }));
  diceMesh = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), mats);
  diceMesh.castShadow = true; diceMesh.visible = false;
  diceScene.add(diceMesh);

  for (let i = 1; i <= 6; i++) {
    const angles = {1:[Math.PI/2,0,0],2:[0,0,-Math.PI/2],3:[0,0,0],4:[Math.PI,0,0],5:[0,0,Math.PI/2],6:[-Math.PI/2,0,0]};
    DICE.snapQ[i] = new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles[i]));
  }

  diceReady = true;
  tick();
}

function getTopFace() {
  const up = new THREE.Vector3(0,1,0);
  let best = -Infinity, bestIdx = 2;
  for (let i = 0; i < 6; i++) {
    const wn = DICE.faceNormals[i].clone().applyQuaternion(diceMesh.quaternion);
    const dot = wn.dot(up);
    if (dot > best) { best = dot; bestIdx = i; }
  }
  return DICE.faceMap[bestIdx];
}

function tick() {
  requestAnimationFrame(tick);
  ptLight.intensity = 2.5 + Math.sin(performance.now()*0.013)*0.3 + Math.random()*0.1;

  if (DICE.phase === 'falling') {
    DICE.vy += -0.018;
    DICE.posY += DICE.vy;
    diceMesh.position.y = DICE.posY;
    diceMesh.rotation.x += DICE.angVX;
    diceMesh.rotation.y += DICE.angVY;
    diceMesh.rotation.z += DICE.angVZ;

    if (DICE.posY <= -0.1) {
      DICE.posY = -0.1;
      diceMesh.position.y = -0.1;
      if (Math.abs(DICE.vy) > 0.08) {
        DICE.vy = -DICE.vy * 0.38;
        DICE.angVX *= 0.88; DICE.angVY *= 0.88; DICE.angVZ *= 0.88;
      } else {
        DICE.vy = 0;
        DICE.angVX *= 0.7; DICE.angVY *= 0.7; DICE.angVZ *= 0.7;
        if (Math.abs(DICE.angVX) < 0.005 && Math.abs(DICE.angVY) < 0.005 && Math.abs(DICE.angVZ) < 0.005) {
          if (DICE.targetResult !== null) {
            const tq = DICE.snapQ[DICE.targetResult];
            diceMesh.quaternion.slerp(tq, 0.12);
            if (diceMesh.quaternion.angleTo(tq) < 0.01) {
              diceMesh.quaternion.copy(tq);
              DICE.phase = 'settled'; DICE.settleCount = 0;
            }
          } else {
            DICE.phase = 'settled'; DICE.settleCount = 0;
          }
        }
      }
    }
  } else if (DICE.phase === 'settled') {
    DICE.settleCount++;
    if (DICE.settleCount > 30 && DICE.resolveRoll) {
      const result = getTopFace();
      const r = DICE.resolveRoll;
      DICE.phase = 'idle'; DICE.resolveRoll = null;
      setTimeout(() => {
        diceMesh.visible = false;
        diceRenderer.domElement.style.display = 'none';
        diceRolling = false;
        r(result);
        processQueue();
      }, 400);
    }
  }

  diceRenderer.render(diceScene, diceCam);
}

function startRoll(targetVal, resolve) {
  DICE.phase = 'falling';
  DICE.targetResult = targetVal;
  DICE.resolveRoll = resolve;
  DICE.settleCount = 0;
  DICE.vy = -0.5 + Math.random() * -0.5;
  DICE.posY = 7;
  DICE.angVX = (Math.random()-0.5)*0.35;
  DICE.angVY = (Math.random()-0.5)*0.35;
  DICE.angVZ = (Math.random()-0.5)*0.2;
  diceMesh.position.set((Math.random()-0.5)*1.5, 7, (Math.random()-0.5)*1.5);
  diceMesh.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
  diceMesh.visible = true;
  diceRenderer.domElement.style.display = 'block';
}

function processQueue() {
  if (diceRolling || diceQueue.length === 0) return;
  const { target, resolve } = diceQueue.shift();
  if (!diceReady) {
    setTimeout(() => { diceRolling = false; resolve(target); processQueue(); }, 50);
    return;
  }
  diceRolling = true;
  startRoll(target, resolve);
}

function rollDice(targetValue) {
  return new Promise((resolve) => {
    if (targetValue === undefined) targetValue = Math.floor(Math.random() * 6) + 1;
    diceQueue.push({ target: targetValue, resolve });
    processQueue();
  });
}

// Auto-init
if (typeof THREE !== 'undefined') {
  diceRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  diceRenderer.setSize(260, 260);
  diceRenderer.shadowMap.enabled = true;
  diceRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  diceRenderer.domElement.style.cssText =
    'position:fixed;z-index:250;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;display:none;';
  document.body.appendChild(diceRenderer.domElement);
  initDice();
}
