let scene, camera, renderer, globe, controls;
let isAutoRotating = true;
let texturesLoaded = 0;
let totalTextures = 1; // We'll use just one texture for better loading

function init() {
    // Create scene
    scene = new THREE.Scene();

    // Create camera with enhanced perspective
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;

    // Create renderer with enhanced settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('globe-container').appendChild(renderer.domElement);

    // Load texture with error handling
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'Anonymous';

    textureLoader.load(
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
        (texture) => {
            texturesLoaded++;
            updateLoadingProgress();
            createGlobe(texture);
        },
        undefined,
        (error) => {
            console.error('Error loading texture:', error);
            document.querySelector('.loading-text').innerHTML = 'Error loading texture. Please refresh.';
        }
    );

    // Add stars immediately for visual feedback
    createStars();
}

function updateLoadingProgress() {
    const progress = Math.round((texturesLoaded / totalTextures) * 100);
    document.querySelector('.loading-text').innerHTML = `Loading... ${progress}%`;
    if (texturesLoaded >= totalTextures) {
        setTimeout(() => {
            document.getElementById('loading').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
            }, 500);
        }, 1000);
    }
}

function createGlobe(earthMap) {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        map: earthMap,
        shininess: 10
    });

    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add atmosphere effect
    const atmosphereGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.5);
            }
        `,
        blending: THREE.AdditiveBlending
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);

    // Add controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 1.5;
    controls.maxDistance = 4;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 0.5;
    controls.enablePan = false;

    // Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    
    // Control buttons
    document.getElementById('autoRotate').addEventListener('click', toggleAutoRotate);
    document.getElementById('zoomIn').addEventListener('click', () => {
        gsap.to(camera.position, {
            z: Math.max(camera.position.z - 0.5, controls.minDistance),
            duration: 0.5,
            ease: "power2.out"
        });
    });
    document.getElementById('zoomOut').addEventListener('click', () => {
        gsap.to(camera.position, {
            z: Math.min(camera.position.z + 0.5, controls.maxDistance),
            duration: 0.5,
            ease: "power2.out"
        });
    });

    // Start animation
    animate();
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const r = 15 + Math.random() * 100;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function toggleAutoRotate() {
    isAutoRotating = !isAutoRotating;
    controls.autoRotate = isAutoRotating;
    document.getElementById('autoRotate').textContent = isAutoRotating ? 'Stop Rotation' : 'Auto Rotate';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) {
        controls.update();
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Initialize when the window loads
window.addEventListener('load', init);