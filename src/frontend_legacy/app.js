// --- CONFIGURATION ---
const BRIDGE_URL = "http://127.0.0.1:8000";
const logContainer = document.getElementById('log-container');
const waveformContainer = document.getElementById('waveform');
let lastAction = "IDLE";

// --- 1. UI INITIALIZATION (Waveform) ---
function initWaveform() {
    for (let i = 0; i < 40; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        waveformContainer.appendChild(bar);
    }
}

function updateWaveform() {
    const bars = document.querySelectorAll('.waveform-bar');
    bars.forEach(bar => {
        const height = Math.random() * 80 + 10;
        bar.style.height = `${height}%`;
        bar.style.opacity = Math.random() * 0.5 + 0.5;
    });
}

// --- 2. THREE.JS SCENE SETUP (Neural Spark) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('threejs-container').appendChild(renderer.domElement);

// HUD Scene Assets (Digital Grid)
const gridHelper = new THREE.GridHelper(20, 40, 0x00d2ff, 0x002222);
gridHelper.position.y = -5;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.15;
scene.add(gridHelper);

let neuralGroup = new THREE.Group();
scene.add(neuralGroup);

// Neural Topology (Particles)
const particleCount = 3000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    // Spherical distribution matching reference
    const r = 3 + Math.random() * 1.5;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Gradient matching reference: Deep Red, Pure Blue, White
    const mix = Math.random();
    if (mix < 0.35) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.05; colors[i * 3 + 2] = 0.05; // Red
    } else if (mix < 0.85) {
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0; // Cyber Blue
    } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0; // Energy White
    }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
});

const points = new THREE.Points(geometry, material);
neuralGroup.add(points);

// Bloom Layer (Blurred secondary system)
const bloomMaterial = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
});
const bloomPoints = new THREE.Points(geometry, bloomMaterial);
neuralGroup.add(bloomPoints);

// Spark Lines (600 positions = 100 lines * 2 pts * 3 coords)
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00d2ff,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
});

const lineGeometry = new THREE.BufferGeometry();
const linePositions = new Float32Array(1800); // 300 segments for jittered arcs
lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
const connections = new THREE.LineSegments(lineGeometry, lineMaterial);
neuralGroup.add(connections);

function updateSparkLines() {
    const pos = points.geometry.attributes.position.array;
    const lPos = connections.geometry.attributes.position.array;
    let lIdx = 0;

    for (let i = 0; i < 60; i++) {
        const p1 = Math.floor(Math.random() * particleCount);
        const p2 = Math.floor(Math.random() * particleCount);

        let x1 = pos[p1 * 3], y1 = pos[p1 * 3 + 1], z1 = pos[p1 * 3 + 2];
        let x2 = pos[p2 * 3], y2 = pos[p2 * 3 + 1], z2 = pos[p2 * 3 + 2];

        const d = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);

        if (d < 4.5) {
            // High-Fidelity Fractal Arc (5 segments)
            let lastX = x1, lastY = y1, lastZ = z1;
            const segments = 5;

            for (let s = 1; s <= segments; s++) {
                const ratio = s / segments;
                let tx = x1 + (x2 - x1) * ratio;
                let ty = y1 + (y2 - y1) * ratio;
                let tz = z1 + (z2 - z1) * ratio;

                // Add erratic fractal jitter (peaking in middle)
                const jitter = Math.sin(Math.PI * ratio) * 0.8;
                tx += (Math.random() - 0.5) * jitter;
                ty += (Math.random() - 0.5) * jitter;
                tz += (Math.random() - 0.5) * jitter;

                lPos[lIdx++] = lastX; lPos[lIdx++] = lastY; lPos[lIdx++] = lastZ;
                lPos[lIdx++] = tx; lPos[lIdx++] = ty; lPos[lIdx++] = tz;

                lastX = tx; lastY = ty; lastZ = tz;
            }
        }
    }
    // Fill remaining with zeros
    while (lIdx < 1800) lPos[lIdx++] = 0;
    connections.geometry.attributes.position.needsUpdate = true;
}

addLogEntry("NEURAL CORE", "Spark Topology Sync Successful");

// Lighting
const mainLight = new THREE.PointLight(0xff3e3e, 2, 50);
mainLight.position.set(5, 5, 5);
scene.add(mainLight);

const blueLight = new THREE.PointLight(0x00d2ff, 2, 50);
blueLight.position.set(-5, -5, 5);
scene.add(blueLight);

scene.add(new THREE.AmbientLight(0x404040, 0.5));

camera.position.z = 8;

// --- 3. GESTURE & BRIDGE LOGIC ---
const WS_URL = BRIDGE_URL.replace('http', 'ws') + "/ws";
let socket;

function initWebSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        addLogEntry("WS-CORE", "Real-time bridge established");
        document.querySelector('.status-pill').innerText = "NEURAL CORE: SYNCED";
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action !== "IDLE") handleAction(data.action, data.text);
    };

    socket.onclose = () => {
        console.warn("WS disconnected. Retrying...");
        setTimeout(initWebSocket, 2000);
    };

    socket.onerror = (err) => {
        console.error("WS error:", err);
    };
}

async function pollGestures() {
    // Only poll if socket is not open
    if (socket && socket.readyState === WebSocket.OPEN) return;

    try {
        const response = await fetch(`${BRIDGE_URL}/status`);
        const data = await response.json();
        if (data.action !== "IDLE") handleAction(data.action, data.text);
    } catch (err) {
        // Silent fail for dev
    }
}

function handleAction(action, text = "") {
    const voiceModule = document.querySelector('.voice-module');
    const transcript = document.getElementById('voice-transcript');

    // Reset listening state if a command is processed or IDLE
    if (action !== "STATUS_HEARING" && action !== "IDLE") {
        voiceModule.classList.remove('listening');
    }

    switch (action) {
        case "STATUS_HEARING":
            voiceModule.classList.add('listening');
            if (transcript) transcript.innerText = "Hearing...";
            break;
        case "ACTION_ROTATE":
            neuralGroup.rotation.y += 0.2;
            triggerEnergyPulse(0xff3e3e);
            highlightGesture('gesture-rotate');
            break;
        case "ACTION_ZOOM_IN":
            neuralGroup.scale.multiplyScalar(1.1);
            triggerEnergyPulse(0x00f2ff);
            highlightGesture('gesture-zoom');
            break;
        case "ACTION_ZOOM_OUT":
            neuralGroup.scale.multiplyScalar(0.9);
            triggerEnergyPulse(0x00f2ff);
            highlightGesture('gesture-zoom');
            break;
        case "ACTION_RESET":
            neuralGroup.rotation.set(0, 0, 0);
            neuralGroup.scale.set(1, 1, 1);
            highlightGesture('gesture-reset');
            break;
        case "ACTION_CAPTURE":
            highlightGesture('gesture-capture');
            triggerEnergyPulse(0xffffff);
            break;
    }

    if (action !== lastAction) {
        if (action !== "STATUS_HEARING") {
            addLogEntry(action, text);
            if (transcript && text) transcript.innerText = `"${text}"`;
        }
        lastAction = action;
        updateWaveform();
    }
}

function triggerEnergyPulse(color) {
    const originalColor = neuralGroup.children[0].material.color.getHex();
    neuralGroup.children[0].material.color.setHex(color);
    setTimeout(() => {
        neuralGroup.children[0].material.color.setHex(0xffffff);
    }, 200);
}

function highlightGesture(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.classList.add('gesture-active');
    clearTimeout(el.highlightTimeout);
    el.highlightTimeout = setTimeout(() => el.classList.remove('gesture-active'), 1200);
}

function addLogEntry(msg, details = "") {
    const entry = document.createElement('div');
    entry.className = 'log-entry new';
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const cleanMsg = msg.replace('ACTION_', '').replace('_', ' ');
    entry.innerHTML = `<span style="color:var(--spark-blue)">[${time}]</span> ${cleanMsg} <small style="display:block; opacity:0.5">${details}</small>`;

    logContainer.prepend(entry);
    setTimeout(() => entry.classList.remove('new'), 2000);

    if (logContainer.children.length > 12) logContainer.removeChild(logContainer.lastChild);
}

// --- 4. ANIMATION & UPDATES ---
function animate() {
    requestAnimationFrame(animate);

    neuralGroup.rotation.y += 0.003;
    neuralGroup.rotation.z += 0.0015;

    // Neural Jitter (Now with Bloom Sync)
    const pos = points.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        const noise = Math.sin(Date.now() * 0.002 + pos[i * 3]) * 0.01;
        pos[i * 3 + 1] += noise;
        pos[i * 3] += noise * 0.5;
    }
    points.geometry.attributes.position.needsUpdate = true;
    bloomPoints.geometry.attributes.position.needsUpdate = true;

    if (Math.random() > 0.9) updateSparkLines();

    // Pulse the Grid & Spectral Shift
    gridHelper.material.opacity = 0.02 + Math.sin(Date.now() * 0.002) * 0.05;

    const spectralHue = (Math.sin(Date.now() * 0.0005) + 1) / 2;
    mainLight.color.setHSL(0, 1.0, 0.5); // Stays Red
    blueLight.color.setHSL(0.55 + spectralHue * 0.1, 1.0, 0.5); // Shifts around Blue

    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Vitals Simulation
function updateVitals() {
    const hr = document.getElementById('hr-value');
    if (hr) hr.innerText = 70 + Math.floor(Math.random() * 5);

    const ox = document.getElementById('ox-value');
    if (ox) ox.innerText = 97 + Math.floor(Math.random() * 3);
}

// Start everything
initWebSocket();
initWaveform();
animate();
setInterval(updateWaveform, 150);
setInterval(pollGestures, 1000); // Polling is now just a watchdog/fallback
setInterval(updateVitals, 3000);
