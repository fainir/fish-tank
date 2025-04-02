import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Optional: For camera control

// --- Configuration ---
const NUM_FISH = 15;
const FISH_SPEED = 0.05;
const FISH_SPEED_EXCITED = 0.12; // Faster speed when hunting for food
const FISH_SIZE = 0.5;
const AVOID_DISTANCE = FISH_SIZE * 3; // How close fish can get before turning
const TURN_SPEED = 0.05; // How quickly fish turn
const TURN_SPEED_FOOD = 0.1; // Faster turning when food is nearby
const BOUNDARY_MARGIN = 1.5; // How far from the edge fish start turning - increased margin
const NUM_PLANTS = 12; // Number of plants to create
const NUM_BUBBLES = 60; // Number of bubbles
const NUM_PARTICLES = 200; // Number of floating particles
const FOOD_ATTRACTION_DISTANCE = 8; // How far away fish can sense food
const FOOD_EAT_DISTANCE = 0.4; // How close fish need to be to eat food
const FOOD_SINK_SPEED = 0.03; // How fast food sinks
const CRUMBS_PER_CLICK = 5; // Number of food crumbs to drop per click

const AQUARIUM_WIDTH = 20;
const AQUARIUM_HEIGHT = 10;
const AQUARIUM_DEPTH = 15;

// --- Living Room Configuration ---
const ROOM_WIDTH = 100; // Increased from 80
const ROOM_HEIGHT = 50; // Increased from 40
const ROOM_DEPTH = 80; // Increased from 60
const FLOOR_Y = -AQUARIUM_HEIGHT / 2 - 10; // Floor position
const AQUARIUM_STAND_HEIGHT = 8; // Height of the stand under the aquarium

// --- Scene Setup ---
const scene = new THREE.Scene();
// Changed from sky blue to room interior color
scene.background = new THREE.Color(0xf5f5f5); // Light gray/white wall color

// Remove fog that was for underwater effect
// scene.fog = new THREE.FogExp2(0x88bbee, 0.02);

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Move the camera back to see the room
camera.position.set(0, AQUARIUM_HEIGHT / 2, AQUARIUM_DEPTH * 2.5); 
camera.lookAt(0, 0, 0);

// --- Mobile Device Detection ---
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 800 && window.innerHeight <= 900);
}

// Check if using a mobile device and show a message
if (isMobileDevice()) {
    // Hide canvas
    const canvas = document.getElementById('aquariumCanvas');
    if (canvas) {
        canvas.style.display = 'none';
    }
    
    // Create mobile message
    const mobileMessage = document.createElement('div');
    mobileMessage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #f5f5f5;
        color: #333;
        font-family: Arial, sans-serif;
        padding: 20px;
        text-align: center;
        z-index: 1000;
    `;
    
    const heading = document.createElement('h1');
    heading.textContent = 'Desktop Only Experience';
    heading.style.marginBottom = '20px';
    
    const message = document.createElement('p');
    message.textContent = 'This 3D aquarium is not supported on mobile devices. Please try using a desktop computer.';
    message.style.fontSize = '18px';
    message.style.lineHeight = '1.5';
    message.style.maxWidth = '600px';
    
    mobileMessage.appendChild(heading);
    mobileMessage.appendChild(message);
    document.body.appendChild(mobileMessage);
    
    // Stop further execution
    throw new Error('Mobile device detected - initialization stopped');
}

// --- Renderer Setup ---
const canvas = document.getElementById('aquariumCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // For sharper rendering on high-res displays
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows

// --- Custom Hand Cursor Setup ---
function setupCustomCursor() {
    // Create and add CSS styles for custom cursors using native CSS cursor values
    const style = document.createElement('style');
    
    // Use the native CSS grab/grabbing cursors
    style.innerHTML = `
        #aquariumCanvas {
            cursor: grab;  /* Open hand */
        }
        #aquariumCanvas.grabbing {
            cursor: grabbing;  /* Closed hand */
        }
    `;
    document.head.appendChild(style);
    
    // Add event listeners for mouse actions
    canvas.addEventListener('mousedown', () => {
        canvas.classList.add('grabbing');
    });
    
    canvas.addEventListener('mouseup', () => {
        canvas.classList.remove('grabbing');
    });
    
    canvas.addEventListener('mouseleave', () => {
        canvas.classList.remove('grabbing');
    });
}

// Setup custom cursor
setupCustomCursor();

// --- Lighting ---
// Room lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft ambient light
scene.add(ambientLight);

// Main room light
const mainLight = new THREE.DirectionalLight(0xffffeb, 1.0);
mainLight.position.set(ROOM_WIDTH/4, ROOM_HEIGHT - 5, ROOM_DEPTH/4);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.left = -50;
mainLight.shadow.camera.right = 50;
mainLight.shadow.camera.top = 50;
mainLight.shadow.camera.bottom = -50;
scene.add(mainLight);

// Window light - simulating light from a window
const windowLight = new THREE.DirectionalLight(0xadd8e6, 0.8);
windowLight.position.set(-ROOM_WIDTH/2, ROOM_HEIGHT/2, 0);
windowLight.castShadow = true;
scene.add(windowLight);

// Aquarium specific lighting - will add these after creating the room
const aquariumLight = new THREE.PointLight(0x88ccff, 0.8, 30);
aquariumLight.position.set(0, AQUARIUM_HEIGHT + 5, 0);
scene.add(aquariumLight);

// --- Create Living Room ---
// Room Group to hold all room elements
const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Floor
const floorGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Wood brown
    roughness: 0.8,
    metalness: 0.2
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
floor.position.y = FLOOR_Y;
floor.receiveShadow = true;
roomGroup.add(floor);

// Walls
// Back wall
const backWallGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT);
const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5e0, // Off-white with yellowish tint
    roughness: 0.95,
    metalness: 0.05
});
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.set(0, FLOOR_Y + ROOM_HEIGHT/2, -ROOM_DEPTH/2);
backWall.receiveShadow = true;
roomGroup.add(backWall);

// Left wall
const leftWallGeometry = new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT);
const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
leftWall.position.set(-ROOM_WIDTH/2, FLOOR_Y + ROOM_HEIGHT/2, 0);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
roomGroup.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
rightWall.position.set(ROOM_WIDTH/2, FLOOR_Y + ROOM_HEIGHT/2, 0);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
roomGroup.add(rightWall);

// Front wall (facing the camera)
const frontWallGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT);
const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
frontWall.position.set(0, FLOOR_Y + ROOM_HEIGHT/2, ROOM_DEPTH/2);
frontWall.rotation.y = Math.PI;
frontWall.receiveShadow = true;
roomGroup.add(frontWall);

// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
ceiling.position.set(0, FLOOR_Y + ROOM_HEIGHT, 0);
ceiling.rotation.x = Math.PI / 2;
ceiling.receiveShadow = true;
roomGroup.add(ceiling);

// Window on left wall (a simple cutout)
const windowGeometry = new THREE.PlaneGeometry(ROOM_DEPTH/2, ROOM_HEIGHT/2);
const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xadd8e6, // Light blue
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
});
const windowPane = new THREE.Mesh(windowGeometry, windowMaterial);
windowPane.position.set(-ROOM_WIDTH/2 + 0.1, FLOOR_Y + ROOM_HEIGHT/2, ROOM_DEPTH/4);
windowPane.rotation.y = Math.PI / 2;
// roomGroup.add(windowPane);

// Window frame
const frameGeometry = new THREE.BoxGeometry(1, ROOM_HEIGHT/2 + 2, ROOM_DEPTH/2 + 2);
const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const windowFrame = new THREE.Mesh(frameGeometry, frameMaterial);
windowFrame.position.set(-ROOM_WIDTH/2 + 0.5, FLOOR_Y + ROOM_HEIGHT/2, ROOM_DEPTH/4);
// roomGroup.add(windowFrame);

// --- Add Paintings to Walls ---
// Function to create a painting with frame
function createPainting(width, height, frameWidth = 0.4, frameColor = 0x5c4033, paintingColor) {
    const paintingGroup = new THREE.Group();
    
    // Create frame (outer part)
    const frameGeometry = new THREE.BoxGeometry(width + frameWidth * 2, height + frameWidth * 2, 0.2);
    const frameMaterial = new THREE.MeshStandardMaterial({ 
        color: frameColor, 
        roughness: 0.7, 
        metalness: 0.2 
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    paintingGroup.add(frame);
    
    // Create canvas (inner part)
    const canvasGeometry = new THREE.PlaneGeometry(width, height);
    
    // If no color is provided, create a more complex "painting"
    let canvasMaterial;
    
    if (paintingColor) {
        // Solid color painting
        canvasMaterial = new THREE.MeshStandardMaterial({ 
            color: paintingColor,
            roughness: 0.8,
            metalness: 0.1
        });
    } else {
        // Create a procedural texture for the painting
        const paintingCanvas = document.createElement('canvas');
        paintingCanvas.width = 256;
        paintingCanvas.height = 256;
        const ctx = paintingCanvas.getContext('2d');
        
        // Background
        ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        ctx.fillRect(0, 0, 256, 256);
        
        // Add some "art" to the canvas
        const numShapes = 3 + Math.floor(Math.random() * 10);
        for (let i = 0; i < numShapes; i++) {
            ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
            
            // Randomly choose between rectangles and circles
            if (Math.random() > 0.5) {
                // Draw rectangle
                ctx.fillRect(
                    Math.random() * 200, 
                    Math.random() * 200,
                    Math.random() * 100 + 10,
                    Math.random() * 100 + 10
                );
            } else {
                // Draw circle
                ctx.beginPath();
                ctx.arc(
                    Math.random() * 256,
                    Math.random() * 256,
                    Math.random() * 50 + 10,
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // Create texture from canvas
        const paintingTexture = new THREE.CanvasTexture(paintingCanvas);
        canvasMaterial = new THREE.MeshStandardMaterial({ 
            map: paintingTexture,
            roughness: 0.8,
            metalness: 0.1
        });
    }
    
    const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
    canvas.position.z = 0.101; // Slightly in front of the frame
    paintingGroup.add(canvas);
    
    return paintingGroup;
}

// Add paintings to the back wall
const painting1 = createPainting(8, 6); // Abstract art
painting1.position.set(-15, FLOOR_Y + ROOM_HEIGHT/2, -ROOM_DEPTH/2 + 0.15);
roomGroup.add(painting1);

const painting2 = createPainting(10, 8, 0.5, 0x2c2c2c); // Large painting with dark frame
painting2.position.set(20, FLOOR_Y + ROOM_HEIGHT/2, -ROOM_DEPTH/2 + 0.15);
roomGroup.add(painting2);

// Add painting to the left wall
const painting3 = createPainting(6, 8, 0.4, 0x8b4513, 0x4169e1); // Blue painting
painting3.rotation.y = Math.PI / 2; // Rotate to face into the room
painting3.position.set(-ROOM_WIDTH/2 + 0.15, FLOOR_Y + ROOM_HEIGHT/2, -10);
roomGroup.add(painting3);

// Add painting to the right wall
const painting4 = createPainting(8, 5, 0.3, 0x8b4513, 0x228b22); // Green painting
painting4.rotation.y = -Math.PI / 2; // Rotate to face into the room
painting4.position.set(ROOM_WIDTH/2 - 0.15, FLOOR_Y + ROOM_HEIGHT/2 - 5, 10);
roomGroup.add(painting4);

// Small painting collection on the right wall
for (let i = 0; i < 3; i++) {
    const smallPainting = createPainting(3, 3, 0.3, 0x8b4513);
    smallPainting.rotation.y = -Math.PI / 2;
    smallPainting.position.set(
        ROOM_WIDTH/2 - 0.15,
        FLOOR_Y + ROOM_HEIGHT/2 - 2 - i * 4,
        -15
    );
    roomGroup.add(smallPainting);
}

// Aquarium Stand
const standGeometry = new THREE.BoxGeometry(AQUARIUM_WIDTH + 2, AQUARIUM_STAND_HEIGHT, AQUARIUM_DEPTH + 2);
const standMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5c4033, // Dark brown
    roughness: 0.9,
    metalness: 0.1
});
const aquariumStand = new THREE.Mesh(standGeometry, standMaterial);
aquariumStand.position.set(0, FLOOR_Y + AQUARIUM_STAND_HEIGHT/2, 0);
aquariumStand.castShadow = true;
aquariumStand.receiveShadow = true;
roomGroup.add(aquariumStand);

// --- Aquarium Box ---
const aquariumGeometry = new THREE.BoxGeometry(AQUARIUM_WIDTH, AQUARIUM_HEIGHT, AQUARIUM_DEPTH);
// Make material transparent
const aquariumMaterial = new THREE.MeshStandardMaterial({
    color: 0xadd8e6, // Light blue tint
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide // Render both inner and outer faces
});
const aquarium = new THREE.Mesh(aquariumGeometry, aquariumMaterial);
// Position aquarium on the stand
aquarium.position.y = FLOOR_Y + AQUARIUM_STAND_HEIGHT + AQUARIUM_HEIGHT/2;
scene.add(aquarium);

// Add edges for visibility
const edges = new THREE.EdgesGeometry(aquariumGeometry);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }); // White edges
const aquariumEdges = new THREE.LineSegments(edges, lineMaterial);
aquariumEdges.position.copy(aquarium.position);
scene.add(aquariumEdges);

// Additional Living Room Furniture
// Sofa
const sofaGroup = new THREE.Group();
roomGroup.add(sofaGroup);

// Sofa base
const sofaBaseGeometry = new THREE.BoxGeometry(30, 5, 10);
const sofaMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3264a8, // Blue
    roughness: 0.9,
    metalness: 0.1
});
const sofaBase = new THREE.Mesh(sofaBaseGeometry, sofaMaterial);
sofaBase.position.set(0, FLOOR_Y + 2.5, -ROOM_DEPTH/2 + 15);
sofaBase.castShadow = true;
sofaBase.receiveShadow = true;
sofaGroup.add(sofaBase);

// Sofa back
const sofaBackGeometry = new THREE.BoxGeometry(30, 8, 3);
const sofaBack = new THREE.Mesh(sofaBackGeometry, sofaMaterial);
sofaBack.position.set(0, FLOOR_Y + 8, -ROOM_DEPTH/2 + 11);
sofaBack.castShadow = true;
sofaBack.receiveShadow = true;
sofaGroup.add(sofaBack);

// Sofa arms
const sofaArmGeometry = new THREE.BoxGeometry(3, 8, 10);
const sofaArm1 = new THREE.Mesh(sofaArmGeometry, sofaMaterial);
sofaArm1.position.set(-13.5, FLOOR_Y + 4, -ROOM_DEPTH/2 + 15);
sofaArm1.castShadow = true;
sofaArm1.receiveShadow = true;
sofaGroup.add(sofaArm1);

const sofaArm2 = new THREE.Mesh(sofaArmGeometry, sofaMaterial);
sofaArm2.position.set(13.5, FLOOR_Y + 4, -ROOM_DEPTH/2 + 15);
sofaArm2.castShadow = true;
sofaArm2.receiveShadow = true;
sofaGroup.add(sofaArm2);

// Coffee table
const tableGeometry = new THREE.BoxGeometry(18, 2, 10);
const tableMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x6d4c41, // Brown
    roughness: 0.8,
    metalness: 0.2
});


// Table legs
const legGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4e342e });

const createTableLeg = (x, z) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, FLOOR_Y + 2, z);
    leg.castShadow = true;
    return leg;
};

createTableLeg(8, -ROOM_DEPTH/2 + 25);
createTableLeg(-8, -ROOM_DEPTH/2 + 25);
createTableLeg(8, -ROOM_DEPTH/2 + 35);
createTableLeg(-8, -ROOM_DEPTH/2 + 35);

// Floor lamp
const lampGroup = new THREE.Group();
roomGroup.add(lampGroup);

// Lamp pole
const poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
const lampPole = new THREE.Mesh(poleGeometry, poleMaterial);
lampPole.position.set(ROOM_WIDTH/4, FLOOR_Y + 10, -ROOM_DEPTH/3);
lampGroup.add(lampPole);

// Lamp shade
const shadeGeometry = new THREE.ConeGeometry(5, 7, 16, 1, true);
const shadeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5dc, // Beige
    side: THREE.DoubleSide 
});
const lampShade = new THREE.Mesh(shadeGeometry, shadeMaterial);
lampShade.position.set(ROOM_WIDTH/4, FLOOR_Y + 21, -ROOM_DEPTH/3);
lampGroup.add(lampShade);

// Lamp light
const lampLight = new THREE.PointLight(0xffffcc, 0.8, 30);
lampLight.position.set(ROOM_WIDTH/4, FLOOR_Y + 19, -ROOM_DEPTH/3);
lampLight.castShadow = true;
scene.add(lampLight);

// Plant pot
const potGeometry = new THREE.CylinderGeometry(2, 1.5, 4, 16);
const potMaterial = new THREE.MeshStandardMaterial({ color: 0xb22222 }); // Red pot
const pot = new THREE.Mesh(potGeometry, potMaterial);
pot.position.set(ROOM_WIDTH/3, FLOOR_Y + 2, ROOM_DEPTH/4);
pot.castShadow = true;
pot.receiveShadow = true;
roomGroup.add(pot);

// Create a decorative plant
const plantGroup = new THREE.Group();
plantGroup.position.copy(pot.position);
plantGroup.position.y += 2;
roomGroup.add(plantGroup);

const housePlantLeafGeometry = new THREE.SphereGeometry(1, 8, 8);
housePlantLeafGeometry.scale(1, 0.3, 1);
const housePlantLeafMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });

for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 1.5 + Math.random();
    const leaf = new THREE.Mesh(housePlantLeafGeometry, housePlantLeafMaterial);
    leaf.position.set(Math.cos(angle) * radius, 1 + Math.random() * 3, Math.sin(angle) * radius);
    leaf.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.5);
    plantGroup.add(leaf);
}

// --- Water Surface with Waves ---
const waterGeometry = new THREE.PlaneGeometry(AQUARIUM_WIDTH, AQUARIUM_DEPTH, 32, 32);
const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8888ff,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.9,
    side: THREE.DoubleSide
});

const waterSurface = new THREE.Mesh(waterGeometry, waterMaterial);
waterSurface.rotation.x = Math.PI / 2;
// Reposition water surface to match aquarium position
waterSurface.position.y = aquarium.position.y + AQUARIUM_HEIGHT / 2 - 0.05; // Slightly below the top
scene.add(waterSurface);

// Store original vertices for water animation
const waterVertices = [];
for (let i = 0; i < waterGeometry.attributes.position.count; i++) {
    waterVertices.push({
        x: waterGeometry.attributes.position.getX(i),
        y: waterGeometry.attributes.position.getY(i),
        z: waterGeometry.attributes.position.getZ(i),
        // Random values for wave animation
        ang: Math.random() * Math.PI * 2,
        amp: Math.random() * 0.05 + 0.05,
        speed: Math.random() * 0.1 + 0.05
    });
}

// --- Add Caustics Texture Effect ---
const causticsGeometry = new THREE.PlaneGeometry(AQUARIUM_WIDTH, AQUARIUM_DEPTH, 1, 1);
const textureLoader = new THREE.TextureLoader();

// Load the caustics texture
const causticTextures = [
    textureLoader.load('https://threejs.org/examples/textures/caustics/caustics_0.jpg'),
    textureLoader.load('https://threejs.org/examples/textures/caustics/caustics_1.jpg'),
    textureLoader.load('https://threejs.org/examples/textures/caustics/caustics_2.jpg'),
    textureLoader.load('https://threejs.org/examples/textures/caustics/caustics_3.jpg'),
    textureLoader.load('https://threejs.org/examples/textures/caustics/caustics_4.jpg'),
    textureLoader.load('https://threejs.org/examples/textures/caustics/caustics_5.jpg'),
    textureLoader.load('https://threejs.org/examples/textures/caustics/caustics_6.jpg'),
    textureLoader.load('https://threejs.org/examples/textures/caustics/caustics_7.jpg')
];

// Set texture properties
causticTextures.forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
});

const causticsMaterial = new THREE.MeshBasicMaterial({
    map: causticTextures[0],
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
});

const caustics = new THREE.Mesh(causticsGeometry, causticsMaterial);
caustics.rotation.x = -Math.PI / 2;
// Update caustics position
caustics.position.y = aquarium.position.y - AQUARIUM_HEIGHT / 2 + 0.05; // Just above the sand
scene.add(caustics);

// Create a second caustics layer with offset for more complex patterns
const caustics2 = caustics.clone();
caustics2.position.y = aquarium.position.y - AQUARIUM_HEIGHT / 2 + 0.1;
caustics2.rotation.z = Math.PI / 4; // Rotated for varied effect
scene.add(caustics2);

// --- Add Sand at Bottom ---
const sandGeometry = new THREE.BoxGeometry(AQUARIUM_WIDTH, 0.5, AQUARIUM_DEPTH);
const sandMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e68c }); // Khaki color for sand
const sand = new THREE.Mesh(sandGeometry, sandMaterial);
sand.position.y = aquarium.position.y - AQUARIUM_HEIGHT / 2 + 0.25; // Position at bottom of tank
scene.add(sand);

// --- Volumetric Light Rays ---
// Remove the floor lamp and replace with ceiling-mounted spotlights
const lightRays = [];

// Create ceiling-mounted spotlights that shine directly into the aquarium
const spotlightsGroup = new THREE.Group();
roomGroup.add(spotlightsGroup);

// Position the group above the aquarium
spotlightsGroup.position.set(0, FLOOR_Y + ROOM_HEIGHT - 0.1, 0);

// Function to create a spotlight and its visible beam
const createSpotlight = (xOffset) => {
    // Create the spotlight mounting fixture
    const fixtureGroup = new THREE.Group();
    
    // Position relative to the ceiling
    fixtureGroup.position.set(xOffset, 0, 0);
    
    // Create a black cylindrical housing for the spotlight
    const housingGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 16);
    const housingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        roughness: 0.7,
        metalness: 0.5
    });
    const housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.rotation.x = Math.PI / 2; // Rotate to point downward
    housing.position.y = -0.3;
    fixtureGroup.add(housing);
    
    // Small bulb visible inside the housing
    const bulbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const bulbMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffee,
        emissive: 0xffffee
    });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.y = -0.3;
    fixtureGroup.add(bulb);
    
    // Add actual light source
    const light = new THREE.SpotLight(0xffffee, 2.0);
    light.position.set(0, 0, 0);
    // Target is positioned at the aquarium bottom to ensure light goes through water
    light.target.position.set(0, -ROOM_HEIGHT + FLOOR_Y, 0);
    fixtureGroup.add(light);
    light.castShadow = true;
    light.angle = 0.3;
    light.penumbra = 0.2;
    light.decay = 1;
    light.distance = ROOM_HEIGHT * 1.5;
    
    // IMPROVED LIGHT BEAM: Using multiple overlapping cylinders for better visibility
    const beamGroup = new THREE.Group();
    fixtureGroup.add(beamGroup);
    
    // Calculate the distance from ceiling to aquarium top
    const distanceToCeiling = ROOM_HEIGHT - (aquarium.position.y + AQUARIUM_HEIGHT/2);
    
    // Create primary beam - from ceiling to water surface
    const upperBeamGeometry = new THREE.CylinderGeometry(0.2, 0.7, distanceToCeiling, 16, 10, true);
    const upperBeamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffee,
    transparent: true,
        opacity: 0.2,
    side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false // Important for transparency sorting
    });
    
    const upperBeam = new THREE.Mesh(upperBeamGeometry, upperBeamMaterial);
    upperBeam.position.y = -distanceToCeiling/2;
    upperBeam.rotation.x = Math.PI; // Align with the direction of the light
    beamGroup.add(upperBeam);
    
    // Create secondary beam - within the water
    const waterBeamGeometry = new THREE.CylinderGeometry(0.7, 1.2, AQUARIUM_HEIGHT, 16, 10, true);
    const waterBeamMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff, // Bluish tint for underwater effect
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false // Important for transparency sorting
    });
    
    const waterBeam = new THREE.Mesh(waterBeamGeometry, waterBeamMaterial);
    waterBeam.position.set(0, -distanceToCeiling - AQUARIUM_HEIGHT/2, 0);
    waterBeam.rotation.x = Math.PI;
    beamGroup.add(waterBeam);
    
    // Add small particles inside the beam for volumetric effect
    const particlesGroup = new THREE.Group();
    beamGroup.add(particlesGroup);
    
    const particleGeometries = [
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.SphereGeometry(0.02, 8, 8)
    ];
    
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
    blending: THREE.AdditiveBlending
});

    // Create particles throughout the beam (more concentrated in water)
    const numParticles = 20;
    for (let i = 0; i < numParticles; i++) {
        // Determine if particle is in water or air
        const inWater = Math.random() > 0.3; // 70% in water for better visibility
        
        // Get random position for particle
        let yPos;
        if (inWater) {
            // Position in water
            yPos = -distanceToCeiling - Math.random() * AQUARIUM_HEIGHT;
        } else {
            // Position in air
            yPos = -Math.random() * distanceToCeiling;
        }
        
        // Calculate radius based on position down the beam (wider at bottom)
        const radius = inWater ? 
            0.7 + Math.random() * 0.5 : // Wider spread in water
            0.2 + Math.random() * 0.3;  // Narrower in air
            
        // Random angle around beam center
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius * Math.random();
        const z = Math.sin(angle) * radius * Math.random();
        
        // Choose random geometry for variety
        const geomIndex = Math.floor(Math.random() * particleGeometries.length);
        const particle = new THREE.Mesh(particleGeometries[geomIndex], particleMaterial.clone());
        
        // Position particle
        particle.position.set(x, yPos, z);
        
        // Make water particles slightly blue
        if (inWater) {
            particle.material.color.setRGB(0.9, 0.95, 1.0);
        }
    
    // Random scale for variety
        const scale = 0.5 + Math.random() * 1.5;
        particle.scale.set(scale, scale, scale);
        
        // Add to group
        particlesGroup.add(particle);
        
        // Store animation properties
        particle.userData = {
            originalY: yPos,
            floatSpeed: 0.01 + Math.random() * 0.02,
            floatRange: 0.1 + Math.random() * 0.2,
            floatOffset: Math.random() * Math.PI * 2
        };
    }
    
    // Add both beams to tracking array for animation
    lightRays.push(upperBeam);
    lightRays.push(waterBeam);
    lightRays.push(particlesGroup);
    
    // Add target to the scene as well so the spotlight will work
    scene.add(light.target);
    
    // Position the target at aquarium
    const targetWorldPos = new THREE.Vector3();
    fixtureGroup.updateWorldMatrix(true, true);
    fixtureGroup.localToWorld(targetWorldPos);
    targetWorldPos.y = aquarium.position.y;
    light.target.position.copy(targetWorldPos);
    
    return fixtureGroup;
};

// Create three spotlights in a row above the aquarium
const spotlight1 = createSpotlight(-AQUARIUM_WIDTH/4);
const spotlight2 = createSpotlight(0);
const spotlight3 = createSpotlight(AQUARIUM_WIDTH/4);

spotlightsGroup.add(spotlight1);
spotlightsGroup.add(spotlight2);
spotlightsGroup.add(spotlight3);

// --- Create Bubbles ---
const bubbles = [];
const bubbleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
const bubbleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    roughness: 0,
    metalness: 0,
    transmission: 0.99,
    ior: 1.5
});

for (let i = 0; i < NUM_BUBBLES; i++) {
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    
    // Random size
    const scale = 0.5 + Math.random() * 1.5;
    bubble.scale.set(scale, scale, scale);
    
    // Random position at the bottom - updated for new aquarium position
    bubble.position.set(
        THREE.MathUtils.randFloatSpread(AQUARIUM_WIDTH * 0.8),
        aquarium.position.y - AQUARIUM_HEIGHT / 2 + Math.random() * AQUARIUM_HEIGHT, // Start at different heights
        THREE.MathUtils.randFloatSpread(AQUARIUM_DEPTH * 0.8)
    );
    
    // Random rising speed
    bubble.userData = {
        speed: 0.01 + Math.random() * 0.03,
        wobbleSpeed: 0.05 + Math.random() * 0.05,
        wobbleAmplitude: 0.1 + Math.random() * 0.2,
        wobbleOffset: Math.random() * Math.PI * 2
    };
    
    bubbles.push(bubble);
    scene.add(bubble);
}

// --- Create Floating Particles ---
const particles = [];
const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3
});

for (let i = 0; i < NUM_PARTICLES; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Random size
    const scale = 0.3 + Math.random() * 0.7;
    particle.scale.set(scale, scale, scale);
    
    // Random position throughout the tank - updated for new position
    particle.position.set(
        THREE.MathUtils.randFloatSpread(AQUARIUM_WIDTH * 0.9),
        aquarium.position.y + THREE.MathUtils.randFloatSpread(AQUARIUM_HEIGHT * 0.9),
        THREE.MathUtils.randFloatSpread(AQUARIUM_DEPTH * 0.9)
    );
    
    // Random drift movement
    particle.userData = {
        velocity: new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(0.01),
            THREE.MathUtils.randFloatSpread(0.005),
            THREE.MathUtils.randFloatSpread(0.01)
        ),
        rotationAxis: new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize(),
        rotationSpeed: Math.random() * 0.02
    };
    
    particles.push(particle);
    scene.add(particle);
}

// --- Food Tracking ---
const foodItems = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- Create Food Function ---
function createFoodCrumb(position) {
    // Create a small sphere for the food
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    
    // Food colors (oranges, browns, yellows)
    const foodColors = [0xECB939, 0xE49B0F, 0xCD6E1D, 0xB85C3C, 0xDA8829];
    const colorIndex = Math.floor(Math.random() * foodColors.length);
    
    const material = new THREE.MeshStandardMaterial({
        color: foodColors[colorIndex],
        roughness: 0.8,
        metalness: 0.1
    });
    
    const crumb = new THREE.Mesh(geometry, material);
    
    // Position at the top of the aquarium, with a small random offset - updated for new position
    crumb.position.set(
        position.x + THREE.MathUtils.randFloatSpread(1),
        aquarium.position.y + AQUARIUM_HEIGHT / 2 - 0.2, // Just below the water surface
        position.z + THREE.MathUtils.randFloatSpread(1)
    );
    
    // Add a slight random scale for variety
    const scale = 0.7 + Math.random() * 0.6;
    crumb.scale.set(scale, scale, scale);
    
    // Add some random rotation for visual interest
    crumb.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );
    
    // Add properties to track
    crumb.userData = {
        isFood: true,
        sinkSpeed: FOOD_SINK_SPEED * (0.7 + Math.random() * 0.6), // Random sink speed
        wobbleOffset: Math.random() * Math.PI * 2, // For sideways motion
        wobbleSpeed: 0.5 + Math.random() * 1.5,
        wobbleAmount: 0.01 + Math.random() * 0.02
    };
    
    // Add to scene and tracking array
    scene.add(crumb);
    foodItems.push(crumb);
    
    // Add little splash effect at the water surface
    createSplashEffect(crumb.position.clone());
    
    return crumb;
}

// Create a splash effect when food hits water
function createSplashEffect(position) {
    // Small white rings expanding outward
    const ringGeometry = new THREE.RingGeometry(0.1, 0.12, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.position.y = aquarium.position.y + AQUARIUM_HEIGHT / 2 - 0.05; // At water surface - updated
    ring.rotation.x = Math.PI / 2; // Lay flat on water
    
    scene.add(ring);
    
    // Animation data for the ring
    ring.userData = {
        expansionRate: 0.1,
        maxRadius: 0.5 + Math.random() * 0.5,
        fadeRate: 0.05,
        age: 0
    };
    
    // Add to a separate array for animation
    splashEffects.push(ring);
}

// Track splash effects
const splashEffects = [];

// --- Handle Mouse Clicks ---
function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects([aquarium]);
    
    if (intersects.length > 0) {
        // Get the point of intersection
        const intersectionPoint = intersects[0].point;
        
        // Find where this ray intersects the water surface
        const waterY = aquarium.position.y + AQUARIUM_HEIGHT / 2 - 0.05; // Same as water surface Y - updated
        
        // Calculate how far along the ray we need to go to hit the water level
        const tY = (waterY - camera.position.y) / raycaster.ray.direction.y;
        
        // Calculate the X and Z position at that point
        const dropPosition = new THREE.Vector3();
        dropPosition.copy(camera.position).add(raycaster.ray.direction.clone().multiplyScalar(tY));
        
        // Make sure the position is within the aquarium bounds
        dropPosition.x = THREE.MathUtils.clamp(
            dropPosition.x, 
            -AQUARIUM_WIDTH/2 + 1, 
            AQUARIUM_WIDTH/2 - 1
        );
        
        dropPosition.z = THREE.MathUtils.clamp(
            dropPosition.z, 
            -AQUARIUM_DEPTH/2 + 1, 
            AQUARIUM_DEPTH/2 - 1
        );
        
        // Create multiple food crumbs at that position
        for (let i = 0; i < CRUMBS_PER_CLICK; i++) {
            createFoodCrumb(dropPosition);
        }
    }
}

// Enhanced mouse interaction with visual feedback
function setupMouseInteraction() {
    // We'll track if mouse is down to animate "dropping" the food
    let isMouseDown = false;
    let mouseDownPosition = { x: 0, y: 0 };
    
    // Handle mouse down - grabbing food
    canvas.addEventListener('mousedown', (event) => {
        isMouseDown = true;
        mouseDownPosition = { x: event.clientX, y: event.clientY };
        
        // Add grabbing cursor class from our custom cursor setup
        canvas.classList.add('grabbing');
    });
    
    // Handle mouse up - releasing/dropping food
    canvas.addEventListener('mouseup', (event) => {
        if (isMouseDown) {
            // Process the click only if mouse is released while over canvas
            onMouseClick(event);
            
            // Create a small visual indication of dropping food (optional)
            const foodIndicator = document.createElement('div');
            foodIndicator.style.cssText = `
                position: fixed;
                left: ${event.clientX}px;
                top: ${event.clientY}px;
                width: 10px;
                height: 10px;
                background-color: rgba(255, 220, 100, 0.8);
                border-radius: 50%;
                pointer-events: none;
                transform: translate(-50%, -50%);
                z-index: 1000;
                animation: food-drop 0.6s ease-out forwards;
            `;
            
            // Add keyframes for the animation
            if (!document.querySelector('#food-drop-animation')) {
                const keyframes = document.createElement('style');
                keyframes.id = 'food-drop-animation';
                keyframes.innerHTML = `
                    @keyframes food-drop {
                        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
                    }
                `;
                document.head.appendChild(keyframes);
            }
            
            document.body.appendChild(foodIndicator);
            
            // Clean up the visual indicator after animation completes
            setTimeout(() => {
                if (foodIndicator.parentNode) {
                    foodIndicator.parentNode.removeChild(foodIndicator);
                }
            }, 600);
        }
        
        // Reset state
        isMouseDown = false;
        canvas.classList.remove('grabbing');
    });
    
    // Handle mouse leave - reset state if mouse leaves canvas
    canvas.addEventListener('mouseleave', () => {
        isMouseDown = false;
        canvas.classList.remove('grabbing');
    });
}

// Replace the simple click listener with our enhanced mouse interaction
setupMouseInteraction();
// window.addEventListener('click', onMouseClick, false); // Remove this line since we're using our custom handler

// --- Create Fish Function ---
function createFish() {
    // Create fish body group
    const fish = new THREE.Group();
    
    // Generate fish properties
    const fishType = Math.floor(Math.random() * 4); // 4 different fish types
    const fishSize = FISH_SIZE * (0.8 + Math.random() * 0.5); // Varying sizes
    
    // Generate base fish color with more vibrant options
    let fishColor, patternColor, finColor;
    
    // Create different color schemes based on fish type
    switch(fishType) {
        case 0: // Tropical colorful fish
            fishColor = new THREE.Color().setHSL(Math.random() * 0.2 + 0.5, 0.9, 0.6); // Orange-red range
            patternColor = new THREE.Color().setHSL(Math.random() * 0.2 + 0.1, 0.8, 0.5); // Blue-green range
            finColor = new THREE.Color().setHSL(Math.random() * 0.1 + 0.7, 0.9, 0.7); // Yellow range
            break;
        case 1: // Blue/silver fish
            fishColor = new THREE.Color().setHSL(0.6, 0.7, 0.6); // Blue base
            patternColor = new THREE.Color().setHSL(0.6, 0.3, 0.8); // Silver/white
            finColor = new THREE.Color().setHSL(0.6, 0.8, 0.4); // Deeper blue
            break;
        case 2: // Yellow with stripes
            fishColor = new THREE.Color().setHSL(0.15, 0.9, 0.6); // Yellow
            patternColor = new THREE.Color().setHSL(0.05, 0.8, 0.4); // Orange-brown
            finColor = fishColor.clone().multiplyScalar(1.2); // Lighter yellow
            break;
        case 3: // Exotic colorful fish
            fishColor = new THREE.Color().setHSL(Math.random(), 0.9, 0.6); // Random vibrant base
            patternColor = new THREE.Color().setHSL((Math.random() + 0.5) % 1, 0.9, 0.5); // Complementary 
            finColor = new THREE.Color().setHSL((Math.random() + 0.25) % 1, 0.8, 0.7); // Contrasting
            break;
    }
    
    // Body Materials with improved appearance
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: fishColor,
        metalness: 0.3,
        roughness: 0.6,
        emissive: fishColor.clone().multiplyScalar(0.2), // Subtle glow
    });
    
    const patternMaterial = new THREE.MeshStandardMaterial({
        color: patternColor,
        metalness: 0.4,
        roughness: 0.5,
    });
    
    const finMaterial = new THREE.MeshStandardMaterial({
        color: finColor,
        metalness: 0.4,
        roughness: 0.4,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    // Create fish body based on type
    if (fishType === 0 || fishType === 3) {
        // Oval/tropical fish body shape
        const bodyGeometry = new THREE.SphereGeometry(fishSize * 0.5, 16, 16);
        bodyGeometry.scale(1, 0.7, 0.5); // Make it oval shaped
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        fish.add(body);
        
        // Add pattern/stripes if exotic (type 3)
        if (fishType === 3) {
            const stripeGeometry = new THREE.SphereGeometry(fishSize * 0.51, 16, 16);
            stripeGeometry.scale(0.8, 0.6, 0.45);
            
            // Create "slices" in the geometry to make stripes
            for (let i = 0; i < stripeGeometry.attributes.position.count; i++) {
                const y = stripeGeometry.attributes.position.getY(i);
                // Only keep vertices within certain bands to create stripe effect
                if (Math.abs(y) % 0.3 < 0.15) {
                    stripeGeometry.attributes.position.setY(i, 0);
                }
            }
            
            const stripes = new THREE.Mesh(stripeGeometry, patternMaterial);
            fish.add(stripes);
        }
    } else if (fishType === 1) {
        // Sleeker, more streamlined fish
        const bodyGeometry = new THREE.SphereGeometry(fishSize * 0.5, 16, 16);
        bodyGeometry.scale(1.2, 0.6, 0.4); // More elongated
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        fish.add(body);
        
        // Add shimmering effect material
        const shimmerGeometry = bodyGeometry.clone();
        const shimmerMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.8,
            roughness: 0.2,
            opacity: 0.3,
            transparent: true,
            side: THREE.FrontSide
        });
        const shimmer = new THREE.Mesh(shimmerGeometry, shimmerMaterial);
        shimmer.scale.set(1.02, 1.02, 1.02);
        fish.add(shimmer);
    } else if (fishType === 2) {
        // Rounder body for yellow fish
        const bodyGeometry = new THREE.SphereGeometry(fishSize * 0.5, 16, 16);
        bodyGeometry.scale(0.9, 0.8, 0.55);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        fish.add(body);
        
        // Add stripes
        const numStripes = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numStripes; i++) {
            const stripeGeometry = new THREE.BoxGeometry(
                fishSize * 0.05, 
                fishSize * 0.7, 
                fishSize * 0.4
            );
            const stripe = new THREE.Mesh(stripeGeometry, patternMaterial);
            stripe.position.x = -fishSize * 0.2 + (i * fishSize * 0.2 / numStripes);
            fish.add(stripe);
        }
    }
    
    // Tail fin - more elaborate for all fish types
    const tailGeometry = new THREE.BufferGeometry();
    
    // Create a fan-shaped tail with multiple segments
    const tailSegments = 8;
    const tailLength = fishSize * 0.8;
    const tailWidth = fishSize * 0.7;
    
    const tailVertices = [];
    const tailIndices = [];
    
    // Create the vertices for a fan-shaped tail
    for (let i = 0; i <= tailSegments; i++) {
        const angle = (i / tailSegments) * Math.PI - Math.PI/2;
        const x = -tailLength;
        const y = Math.sin(angle) * tailWidth;
        const z = Math.cos(angle) * tailWidth * 0.5;
        
        // Base of tail connects to body
        tailVertices.push(0, 0, 0);
        // Outer edge of tail fan
        tailVertices.push(x, y, z);
    }
    
    // Create faces 
    for (let i = 0; i < tailSegments * 2; i += 2) {
        tailIndices.push(i, i+1, i+2);
    }
    
    tailGeometry.setIndex(tailIndices);
    tailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tailVertices, 3));
    tailGeometry.computeVertexNormals();
    
    const tail = new THREE.Mesh(tailGeometry, finMaterial);
    tail.position.x = -fishSize * 0.4;
    fish.add(tail);
    
    // Store original tail vertices for animation
    tail.userData.originalVertices = tailVertices.slice();
    tail.userData.animationOffset = Math.random() * Math.PI * 2; // Random starting phase
    
    // Top fin
    const topFinShape = new THREE.Shape();
    topFinShape.moveTo(0, 0);
    topFinShape.quadraticCurveTo(fishSize * 0.1, fishSize * 0.4, fishSize * 0.2, fishSize * 0.1);
    topFinShape.lineTo(-fishSize * 0.2, fishSize * 0.1);
    topFinShape.quadraticCurveTo(-fishSize * 0.1, fishSize * 0.4, 0, 0);
    
    const topFinGeometry = new THREE.ShapeGeometry(topFinShape);
    const topFin = new THREE.Mesh(topFinGeometry, finMaterial);
    topFin.rotation.z = Math.PI / 2;
    topFin.position.y = fishSize * 0.4;
    fish.add(topFin);
    
    // Side fins
    const sideFinShape = new THREE.Shape();
    sideFinShape.moveTo(0, 0);
    sideFinShape.quadraticCurveTo(-fishSize * 0.1, fishSize * 0.15, -fishSize * 0.3, fishSize * 0.1);
    sideFinShape.lineTo(-fishSize * 0.1, fishSize * 0.3);
    sideFinShape.quadraticCurveTo(fishSize * 0.05, fishSize * 0.2, 0, 0);
    
    const sideFinGeometry = new THREE.ShapeGeometry(sideFinShape);
    
    // Left side fin
    const leftFin = new THREE.Mesh(sideFinGeometry, finMaterial);
    leftFin.rotation.x = Math.PI / 2;
    leftFin.rotation.z = -Math.PI / 6;
    leftFin.position.set(0, -fishSize * 0.1, fishSize * 0.25);
    fish.add(leftFin);
    
    // Right side fin (mirror of left)
    const rightFin = new THREE.Mesh(sideFinGeometry, finMaterial);
    rightFin.rotation.x = -Math.PI / 2;
    rightFin.rotation.z = -Math.PI / 6;
    rightFin.position.set(0, -fishSize * 0.1, -fishSize * 0.25);
    fish.add(rightFin);
    
    // Eyes with more detail
    const eyeGeometry = new THREE.SphereGeometry(fishSize * 0.08, 12, 12);
    const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const irisMaterial = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 0.9, 0.3) // Random iris color
    });
    
    function createDetailedEye(position) {
        const eyeGroup = new THREE.Group();
        eyeGroup.position.copy(position);
        
        // White of eye
        const eyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        eyeGroup.add(eyeWhite);
        
        // Iris
        const irisGeometry = new THREE.SphereGeometry(fishSize * 0.06, 10, 10);
        const iris = new THREE.Mesh(irisGeometry, irisMaterial);
        iris.position.x = fishSize * 0.03;
        eyeGroup.add(iris);
        
        // Pupil
        const pupilGeometry = new THREE.SphereGeometry(fishSize * 0.04, 8, 8);
        const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupil.position.x = fishSize * 0.045;
        eyeGroup.add(pupil);
        
        // Highlight
        const highlightGeometry = new THREE.SphereGeometry(fishSize * 0.015, 6, 6);
        const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.set(fishSize * 0.07, fishSize * 0.03, fishSize * 0.01);
        eyeGroup.add(highlight);
        
        return eyeGroup;
    }
    
    // Add detailed eyes
    const leftEye = createDetailedEye(new THREE.Vector3(fishSize * 0.3, fishSize * 0.1, fishSize * 0.25));
    fish.add(leftEye);
    
    const rightEye = createDetailedEye(new THREE.Vector3(fishSize * 0.3, fishSize * 0.1, -fishSize * 0.25));
    fish.add(rightEye);
    
    // Store fish properties for animation
    fish.userData.fishType = fishType;
    fish.userData.fishSize = fishSize;
    fish.userData.tailFin = tail;
    fish.userData.leftFin = leftFin;
    fish.userData.rightFin = rightFin;
    fish.userData.animationTime = 0;
    
    // Important: Fish models are built facing forward along positive X-axis
    // We do NOT rotate them here, will handle rotation during animation
    
    return fish;
}

// --- Create Plant Function ---
function createPlant(height) {
    const plant = new THREE.Group();
    
    // Plant stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, height, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x006400, // Dark green
        roughness: 0.8 
    });
    
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = height / 2;
    plant.add(stem);
    
    // Add leaves at different heights
    const numLeaves = Math.floor(height * 2);
    const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x32CD32, // Lime green
        roughness: 0.7,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < numLeaves; i++) {
        const leafSize = 0.2 + Math.random() * 0.3;
        const leafGeometry = new THREE.ConeGeometry(leafSize, leafSize * 2, 4, 1);
        leafGeometry.rotateX(Math.PI / 2);
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // Position along stem
        const heightPos = (i / numLeaves) * height;
        leaf.position.y = heightPos;
        
        // Random rotation around stem
        const angle = Math.random() * Math.PI * 2;
        leaf.position.x = Math.sin(angle) * 0.2;
        leaf.position.z = Math.cos(angle) * 0.2;
        
        // Point outward
        leaf.lookAt(leaf.position.clone().add(new THREE.Vector3(
            Math.sin(angle), 
            0.2 * Math.random(), 
            Math.cos(angle)
        )));
        
        plant.add(leaf);
    }
    
    return plant;
}

// --- Precompute boundary limits ---
// Define this earlier so it can be used for initial positioning
const bounds = {
    xMin: -AQUARIUM_WIDTH / 2 + BOUNDARY_MARGIN,
    xMax: AQUARIUM_WIDTH / 2 - BOUNDARY_MARGIN,
    yMin: aquarium.position.y - AQUARIUM_HEIGHT / 2 + BOUNDARY_MARGIN,
    yMax: aquarium.position.y + AQUARIUM_HEIGHT / 2 - BOUNDARY_MARGIN,
    zMin: -AQUARIUM_DEPTH / 2 + BOUNDARY_MARGIN,
    zMax: AQUARIUM_DEPTH / 2 - BOUNDARY_MARGIN,
};

// --- Create Fish ---
const fishes = [];

for (let i = 0; i < NUM_FISH; i++) {
    const fish = createFish();

    // Random initial position within the bounds - updated for new aquarium position
    fish.position.set(
        THREE.MathUtils.randFloat(bounds.xMin, bounds.xMax),
        THREE.MathUtils.randFloat(bounds.yMin, bounds.yMax),
        THREE.MathUtils.randFloat(bounds.zMin, bounds.zMax)
    );

    // Random initial velocity (direction)
    const velocity = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(1), // Random number between -0.5 and 0.5
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1)
    ).normalize().multiplyScalar(FISH_SPEED);

    fish.userData = { velocity }; // Store velocity in userData
    fishes.push(fish);
    scene.add(fish);
}

// --- Create Plants ---
for (let i = 0; i < NUM_PLANTS; i++) {
    // Random height for each plant
    const height = 1.5 + Math.random() * 2.5;
    
    const plant = createPlant(height);
    
    // Position at the bottom of the tank, random x/z - updated for new position
    plant.position.set(
        THREE.MathUtils.randFloatSpread(AQUARIUM_WIDTH - 2),
        aquarium.position.y - AQUARIUM_HEIGHT / 2 + 0.5, // Just above the sand
        THREE.MathUtils.randFloatSpread(AQUARIUM_DEPTH - 2)
    );
    
    // Add slight random rotation for variety
    plant.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(plant);
}

// --- Optional: Camera Controls (allows rotating view with mouse) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, aquarium.position.y, 0); // Point controls at the center of the tank - updated
controls.enableDamping = true; // Smooths camera movement
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false; // Keep panning relative to the target
controls.maxDistance = 120; // Increased to see the whole room
controls.minDistance = 5;

// --- Window Resize Handling ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate); // Request next frame

    const avoidanceVector = new THREE.Vector3(); // Reusable vector for calculations
    const targetVelocity = new THREE.Vector3();  // Reusable vector
    const time = performance.now() * 0.001; // Current time in seconds
    
    // Create a temporary quaternion for rotation calculations
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    // --- Animate splash effects ---
    for (let i = splashEffects.length - 1; i >= 0; i--) {
        const splash = splashEffects[i];
        
        // Expand the ring
        splash.userData.age += 0.016; // Frame time
        const innerRadius = splash.userData.age * splash.userData.expansionRate;
        const outerRadius = innerRadius + 0.02;
        
        // Update geometry
        splash.geometry.dispose();
        splash.geometry = new THREE.RingGeometry(innerRadius, outerRadius, 16);
        
        // Fade out
        splash.material.opacity = 0.7 * (1 - splash.userData.age / 2);
        
        // Remove when fully expanded or faded
        if (innerRadius > splash.userData.maxRadius || splash.material.opacity < 0.05) {
            scene.remove(splash);
            splash.geometry.dispose();
            splash.material.dispose();
            splashEffects.splice(i, 1);
        }
    }
    
    // --- Animate food ---
    for (let i = foodItems.length - 1; i >= 0; i--) {
        const food = foodItems[i];
        
        // Make food sink
        food.position.y -= food.userData.sinkSpeed;
        
        // Add some side-to-side motion as it sinks
        food.position.x += Math.sin(time * food.userData.wobbleSpeed + food.userData.wobbleOffset) * food.userData.wobbleAmount;
        food.position.z += Math.cos(time * food.userData.wobbleSpeed + food.userData.wobbleOffset) * food.userData.wobbleAmount;
        
        // Slowly rotate for visual interest
        food.rotation.x += 0.01;
        food.rotation.z += 0.005;
        
        // Remove if it hits the bottom - updated for new position
        if (food.position.y < aquarium.position.y - AQUARIUM_HEIGHT / 2 + 0.5) {
            scene.remove(food);
            foodItems.splice(i, 1);
        }
    }

    // --- Animate water surface ---
    if (waterSurface) {
        const positions = waterGeometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const vertex = waterVertices[i];
            // Create gentle wave effect
            positions.setZ(i, vertex.z + Math.sin(time * vertex.speed + vertex.ang) * vertex.amp);
        }
        
        positions.needsUpdate = true;
    }
    
    // --- Animate caustics ---
    if (caustics && caustics2) {
        // Cycle through caustics textures
        const textureIndex = Math.floor(time * 10) % causticTextures.length;
        causticsMaterial.map = causticTextures[textureIndex];
        
        // Rotate and move caustics slightly for flowing water effect
        caustics.rotation.z = time * 0.05;
        caustics2.rotation.z = -time * 0.03;
    }
    
    // --- Animate spotlight beams ---
    lightRays.forEach((element, index) => {
        // Check if this is a beam or a particles group
        if (element.type === 'Mesh') {
            // This is a beam
            // Subtle pulsing of the light beam opacity
            const pulseSpeed = 0.2 + (index % 3) * 0.1;
            element.material.opacity = element.material.color.r > 0.5 ? 
                0.2 + Math.sin(time * pulseSpeed) * 0.05 : // Air beam
                0.3 + Math.sin(time * pulseSpeed) * 0.08;  // Water beam (stronger effect)
            
            // Subtle scaling effect
            const breatheAmount = 0.98 + Math.sin(time * 0.4 + index * 0.7) * 0.02;
            element.scale.x = breatheAmount;
            element.scale.z = breatheAmount;
        } 
        else if (element.type === 'Group') {
            // This is the particles group
            element.children.forEach(particle => {
                if (particle.userData.originalY) {
                    // Animate floating motion
                    const floatOffset = particle.userData.floatOffset;
                    const floatRange = particle.userData.floatRange;
                    const floatSpeed = particle.userData.floatSpeed;
                    
                    // Float up and down
                    particle.position.y = particle.userData.originalY + 
                        Math.sin(time * floatSpeed + floatOffset) * floatRange;
                        
                    // Slight horizontal drift
                    particle.position.x += Math.sin(time * 0.2 + floatOffset) * 0.001;
                    particle.position.z += Math.cos(time * 0.3 + floatOffset * 2) * 0.001;
                    
                    // Subtle pulsing opacity
                    particle.material.opacity = 0.5 + Math.sin(time + floatOffset) * 0.2;
                }
            });
        }
    });
    
    // --- Animate bubbles ---
    bubbles.forEach(bubble => {
        // Rise upward
        bubble.position.y += bubble.userData.speed;
        
        // Add wobble effect
        bubble.position.x += Math.sin(time * bubble.userData.wobbleSpeed + bubble.userData.wobbleOffset) * bubble.userData.wobbleAmplitude * 0.01;
        bubble.position.z += Math.cos(time * bubble.userData.wobbleSpeed + bubble.userData.wobbleOffset) * bubble.userData.wobbleAmplitude * 0.01;
        
        // Reset if reached the top - updated for new position
        if (bubble.position.y > aquarium.position.y + AQUARIUM_HEIGHT / 2) {
            bubble.position.y = aquarium.position.y - AQUARIUM_HEIGHT / 2;
            bubble.position.x = THREE.MathUtils.randFloatSpread(AQUARIUM_WIDTH * 0.8);
            bubble.position.z = THREE.MathUtils.randFloatSpread(AQUARIUM_DEPTH * 0.8);
            
            // Randomize size for variety
            const scale = 0.5 + Math.random() * 1.5;
            bubble.scale.set(scale, scale, scale);
        }
    });
    
    // --- Animate floating particles ---
    particles.forEach(particle => {
        // Apply drift movement
        particle.position.add(particle.userData.velocity);
        
        // Rotate around random axis
        particle.rotateOnAxis(particle.userData.rotationAxis, particle.userData.rotationSpeed);
        
        // Add slight gravity/buoyancy effect based on particle size
        particle.userData.velocity.y += (particle.scale.x < 0.5 ? -0.0001 : 0.0001);
        
        // Apply boundaries - updated for new position
        if (Math.abs(particle.position.x) > AQUARIUM_WIDTH / 2 * 0.9) {
            particle.userData.velocity.x *= -1;
        }
        if (particle.position.y < aquarium.position.y - AQUARIUM_HEIGHT / 2 * 0.9 || 
            particle.position.y > aquarium.position.y + AQUARIUM_HEIGHT / 2 * 0.9) {
            particle.userData.velocity.y *= -1;
        }
        if (Math.abs(particle.position.z) > AQUARIUM_DEPTH / 2 * 0.9) {
            particle.userData.velocity.z *= -1;
        }
    });

    fishes.forEach((fish, i) => {
        const currentPos = fish.position;
        const currentVel = fish.userData.velocity;
        
        // Update fish animation time
        fish.userData.animationTime += 0.016; // Assuming ~60fps
        
        // Animate tail fin if present
        if (fish.userData.tailFin) {
            const tail = fish.userData.tailFin;
            const originalVertices = tail.userData.originalVertices;
            const animationOffset = tail.userData.animationOffset;
            const vertices = tail.geometry.getAttribute('position');
            
            // Only modify the outer edge vertices of the tail (odd indices)
            for (let j = 1; j < vertices.count; j += 2) {
                const idx = j * 3;
                // Get original vertex
                const origX = originalVertices[idx];
                const origY = originalVertices[idx + 1];
                const origZ = originalVertices[idx + 2];
                
                // Apply sine wave to z-coordinate based on y position
                // This creates a realistic tail swishing motion
                const swishFactor = Math.sin(time * 10 + animationOffset) * 0.2;
                const offset = swishFactor * Math.abs(origY);
                
                // Apply modified position
                vertices.setZ(j, origZ + offset);
            }
            
            vertices.needsUpdate = true;
        }
        
        // Animate side fins with subtle motion
        if (fish.userData.leftFin && fish.userData.rightFin) {
            const finMovement = Math.sin(time * 5 + fish.userData.animationTime) * 0.1;
            fish.userData.leftFin.rotation.y = Math.PI / 2 + finMovement;
            fish.userData.rightFin.rotation.y = -Math.PI / 2 - finMovement;
        }

        targetVelocity.copy(currentVel); // Start with current velocity
        
        // Set default swimming speed
        let swimSpeed = FISH_SPEED;
        let turnSpeed = TURN_SPEED;
        
        // Check for food and find the closest food item
        let closestFood = null;
        let closestDistance = Infinity;
        
        for (let j = 0; j < foodItems.length; j++) {
            const food = foodItems[j];
            const distance = currentPos.distanceTo(food.position);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestFood = food;
            }
        }
        
        // If there's food nearby
        if (closestFood && closestDistance < FOOD_ATTRACTION_DISTANCE) {
            // If very close to food, try to eat it
            if (closestDistance < FOOD_EAT_DISTANCE) {
                // Fish has reached the food - eat it!
                scene.remove(closestFood);
                
                // Remove from food array
                const foodIndex = foodItems.indexOf(closestFood);
                if (foodIndex !== -1) {
                    foodItems.splice(foodIndex, 1);
                }
                
                // Create tiny bubble effect when eating
                for (let b = 0; b < 3; b++) {
                    const tinyBubble = new THREE.Mesh(
                        new THREE.SphereGeometry(0.03 + Math.random() * 0.03, 6, 6),
                        bubbleMaterial.clone()
                    );
                    
                    tinyBubble.position.copy(currentPos);
                    tinyBubble.position.x += Math.random() * 0.1 - 0.05;
                    tinyBubble.position.y += Math.random() * 0.1;
                    tinyBubble.position.z += Math.random() * 0.1 - 0.05;
                    
                    tinyBubble.userData = {
                        speed: 0.02 + Math.random() * 0.03,
                        wobbleSpeed: 0.05 + Math.random() * 0.05,
                        wobbleAmplitude: 0.1 + Math.random() * 0.2,
                        wobbleOffset: Math.random() * Math.PI * 2,
                        lifespan: 1.5 + Math.random() * 1, // Shorter lifespan
                        age: 0
                    };
                    
                    scene.add(tinyBubble);
                    bubbles.push(tinyBubble);
                }
            } 
            else {
                // Fish sees food but hasn't reached it yet
                // Create a vector pointing from the fish to the food
                const foodDirection = new THREE.Vector3().subVectors(closestFood.position, currentPos).normalize();
                
                // The closer to food, the more we prioritize it
                const foodInfluence = 1.0 - (closestDistance / FOOD_ATTRACTION_DISTANCE);
                
                // Add to the target velocity, with more influence the closer we are
                targetVelocity.add(foodDirection.multiplyScalar(foodInfluence * 2.0));
                
                // Move faster when food is detected
                swimSpeed = THREE.MathUtils.lerp(FISH_SPEED, FISH_SPEED_EXCITED, foodInfluence);
                turnSpeed = THREE.MathUtils.lerp(TURN_SPEED, TURN_SPEED_FOOD, foodInfluence);
            }
        }

        // 1. Strict Boundary Enforcement - updated for new aquarium position
        // If a fish somehow gets outside the aquarium, force it back inside
        if (currentPos.x < -AQUARIUM_WIDTH / 2 || currentPos.x > AQUARIUM_WIDTH / 2 ||
            currentPos.y < aquarium.position.y - AQUARIUM_HEIGHT / 2 || 
            currentPos.y > aquarium.position.y + AQUARIUM_HEIGHT / 2 ||
            currentPos.z < -AQUARIUM_DEPTH / 2 || currentPos.z > AQUARIUM_DEPTH / 2) {
            
            // Clamp position to be within the aquarium (with a small buffer)
            currentPos.x = THREE.MathUtils.clamp(currentPos.x, -AQUARIUM_WIDTH / 2 + 0.1, AQUARIUM_WIDTH / 2 - 0.1);
            currentPos.y = THREE.MathUtils.clamp(currentPos.y, 
                aquarium.position.y - AQUARIUM_HEIGHT / 2 + 0.1, 
                aquarium.position.y + AQUARIUM_HEIGHT / 2 - 0.1);
            currentPos.z = THREE.MathUtils.clamp(currentPos.z, -AQUARIUM_DEPTH / 2 + 0.1, AQUARIUM_DEPTH / 2 - 0.1);
            
            // Direct velocity towards the center of the aquarium
            targetVelocity.set(
                -currentPos.x * 0.1, 
                -(currentPos.y - aquarium.position.y) * 0.1, // Adjusted to account for aquarium position
                -currentPos.z * 0.1
            ).normalize().multiplyScalar(swimSpeed);
        }
        
        // 2. Boundary Avoidance (stronger than before)
        const boundaryForce = 2.0; // Stronger force near boundaries
        
        // X boundaries
        if (currentPos.x < bounds.xMin) {
            targetVelocity.x += (bounds.xMin - currentPos.x) * boundaryForce;
        } else if (currentPos.x > bounds.xMax) {
            targetVelocity.x += (bounds.xMax - currentPos.x) * boundaryForce;
        }
        
        // Y boundaries - updated for new position
        if (currentPos.y < bounds.yMin) {
            targetVelocity.y += (bounds.yMin - currentPos.y) * boundaryForce;
        } else if (currentPos.y > bounds.yMax) {
            targetVelocity.y += (bounds.yMax - currentPos.y) * boundaryForce;
        }
        
        // Z boundaries
        if (currentPos.z < bounds.zMin) {
            targetVelocity.z += (bounds.zMin - currentPos.z) * boundaryForce;
        } else if (currentPos.z > bounds.zMax) {
            targetVelocity.z += (bounds.zMax - currentPos.z) * boundaryForce;
        }

        // 3. Collision Avoidance (Fish-to-Fish)
        fishes.forEach((otherFish, j) => {
            if (i === j) return; // Don't check against self

            const distance = currentPos.distanceTo(otherFish.position);

            if (distance < AVOID_DISTANCE) {
                // Calculate vector pointing away from the other fish
                avoidanceVector.subVectors(currentPos, otherFish.position).normalize();
                // Add this avoidance push to the target velocity
                targetVelocity.add(avoidanceVector.multiplyScalar(swimSpeed * 0.5)); // Adjust multiplier as needed
            }
        });

        // Normalize target velocity to maintain desired speed and smoothly interpolate
        targetVelocity.normalize().multiplyScalar(swimSpeed);
        currentVel.lerp(targetVelocity, turnSpeed); // Smoothly turn towards target velocity

        // Update position
        fish.position.add(currentVel);

        // IMPROVED ORIENTATION:
        // Only proceed if the fish has velocity (is moving)
        if (currentVel.lengthSq() > 0.0001) {
            // Step 1: Create a direction vector (forward direction)
            const direction = currentVel.clone().normalize();
            
            // Step 2: Calculate rotation matrix that aligns fish to its direction of movement
            // First parameter is the direction to look at
            // Second parameter is the up vector (to keep fish level)
            quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
            fish.quaternion.copy(quaternion);
            
            // Step 3: Apply a slight tilt based on vertical movement
            // This makes fish tilt up when ascending and down when descending
            const tiltAmount = Math.min(Math.max(direction.y, -0.3), 0.3); // Limit tilt angle
            fish.rotateZ(-tiltAmount);
        }
    });

    controls.update(); // Update controls if enabled
    renderer.render(scene, camera); // Render the scene
}

// Start the animation
animate();

// TV Stand
const tvStandGeometry = new THREE.BoxGeometry(22, 3, 8);
const tvStandMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2a2a2a, // Dark gray
    roughness: 0.8,
    metalness: 0.3
});
const tvStand = new THREE.Mesh(tvStandGeometry, tvStandMaterial);
// Reposition TV stand to be under the TV on the front wall
tvStand.position.set(0, FLOOR_Y + 1.5, ROOM_DEPTH/2 - 4);
tvStand.castShadow = true;
tvStand.receiveShadow = true;
roomGroup.add(tvStand);

// TV Stand drawers
const drawerGeometry = new THREE.BoxGeometry(6, 2, 0.2);
const drawerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a3a3a,
    roughness: 0.7, 
    metalness: 0.3
});

// Add three drawers to the TV stand
for (let i = 0; i < 3; i++) {
    const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
    // Updated drawer positions to match new TV stand position
    drawer.position.set(-7 + i * 7, FLOOR_Y + 1.5, ROOM_DEPTH/2 - 8.1);
    // Rotate drawers to face the room
    drawer.rotation.y = Math.PI;
    roomGroup.add(drawer);
    
    // Drawer handle
    const handleGeometry = new THREE.BoxGeometry(2, 0.3, 0.1);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0, 0.2);
    drawer.add(handle);
}

// TV
const tvFrameGeometry = new THREE.BoxGeometry(20, 12, 1);
const tvFrameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111, // Almost black
    roughness: 0.5,
    metalness: 0.8
});
const tvFrame = new THREE.Mesh(tvFrameGeometry, tvFrameMaterial);
// Move TV to the front wall (opposite to where the sofa is)
tvFrame.position.set(0, FLOOR_Y + 15, ROOM_DEPTH/2 - 1);
tvFrame.rotation.y = Math.PI; // Rotate 180 degrees to face the sofa
tvFrame.castShadow = true;
tvFrame.receiveShadow = true;
roomGroup.add(tvFrame);

// TV Screen
const tvScreenGeometry = new THREE.PlaneGeometry(18, 10);
const tvScreenMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x0a0a0a, // Very dark gray/black for TV screen
    side: THREE.FrontSide
});
const tvScreen = new THREE.Mesh(tvScreenGeometry, tvScreenMaterial);
tvScreen.position.set(0, 0, 0.51); // Slightly in front of the TV frame
tvFrame.add(tvScreen);

// TV Mount/Bracket
const tvMountGeometry = new THREE.BoxGeometry(4, 6, 2);
const tvMountMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const tvMount = new THREE.Mesh(tvMountGeometry, tvMountMaterial);
tvMount.position.set(0, 0, -0.5);
tvFrame.add(tvMount);

// Cable management - some cables hanging from the TV
const cableGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -4, 0.5),
        new THREE.Vector3(0.5, -8, 1),
    ]),
    10,
    0.1,
    8,
    false
);
const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
const cable = new THREE.Mesh(cableGeometry, cableMaterial);
cable.position.set(0, 0, 0.5);
tvFrame.add(cable);

// TV Stand devices (cable box, game console, etc.)
function createDevice(width, height, depth, color, x) {
    const deviceGeometry = new THREE.BoxGeometry(width, height, depth);
    const deviceMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.9,
        metalness: 0.3
    });
    const device = new THREE.Mesh(deviceGeometry, deviceMaterial);
    // Update device positions to match new TV stand position
    device.position.set(x, FLOOR_Y + 3.1, ROOM_DEPTH/2 - 4);
    device.castShadow = true;
    device.receiveShadow = true;
    
    // Add a small LED light to the device
    const ledGeometry = new THREE.CircleGeometry(0.1, 12);
    const ledMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green LED
    const led = new THREE.Mesh(ledGeometry, ledMaterial);
    led.position.set(width/2 - 0.3, 0, depth/2 + 0.01);
    led.rotation.y = Math.PI/2;
    device.add(led);
    
    roomGroup.add(device);
    return device;
}

// Add some devices to the TV stand
createDevice(8, 0.8, 6, 0x222222, -5); // Cable box
createDevice(6, 1.2, 6, 0x444444, 5);  // Game console