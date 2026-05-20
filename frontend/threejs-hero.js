/**
 * threejs-hero.js — Three.js 3D Hero Section Animation
 * ═══════════════════════════════════════════════════════
 * Features:
 *   - Futuristic AI-themed icosahedron with wireframe overlay
 *   - Glowing energy rings orbiting the central object
 *   - 2000-particle floating field with purple/cyan color mix
 *   - Dynamic lighting that pulses over time
 *   - Smooth mouse-parallax interaction (object follows cursor)
 *   - Full WebGL with alpha: true (blends into CSS background)
 *   - Responsive: recalculates on window resize
 *   - Throttled resize / passive listeners for performance
 *
 * Customization guide (bottom of file):
 *   - COLORS, PARTICLE_COUNT, rotation speeds, etc.
 * ═══════════════════════════════════════════════════════
 */

(function initThreeHero() {
    'use strict';

    // ── Wait for DOM + Three.js to be ready ──────────────
    function start() {
        if (typeof THREE === 'undefined') {
            // Three.js CDN hasn't loaded yet — wait a moment
            setTimeout(start, 100);
            return;
        }

        const canvas = document.getElementById('threejs-canvas');
        if (!canvas) return; // Hero canvas not found, abort

        setup(canvas);
    }

    document.addEventListener('DOMContentLoaded', start);

    // ── Main setup function ───────────────────────────────
    function setup(canvas) {

        /* ─────────────────────────────────────────────────────
           // CUSTOMIZATION: Change these values to tweak the look
        ───────────────────────────────────────────────────── */
        const CONFIG = {
            PARTICLE_COUNT: 2000,       // Number of floating particles
            PARTICLE_SPREAD: 22,         // How far particles spread (units)
            PARTICLE_SIZE: 0.035,      // Dot size of each particle

            COLOR_PRIMARY: 0x7c3aed,   // Violet (#7c3aed)
            COLOR_SECONDARY: 0x06b6d4,   // Cyan   (#06b6d4)
            COLOR_ACCENT: 0xec4899,   // Pink   (#ec4899)

            SPHERE_RADIUS: 1.6,        // Radius of the main icosahedron
            SPHERE_DETAIL: 1,          // Poly detail level (0=low, 3=high)

            ROTATION_Y: 0.28,       // Y-axis auto-rotation speed
            ROTATION_X: 0.12,       // X-axis auto-rotation speed
            MOUSE_SENSITIVITY: 0.6,       // How strongly mouse moves the object
            LERP_FACTOR: 0.04,       // Smoothness of mouse follow (0-1)

            RING1_RADIUS: 2.4,
            RING2_RADIUS: 2.9,
            RING3_RADIUS: 3.35,
        };
        /* ──────────────────────────────────────────────────── */

        // ── Scene ─────────────────────────────────────────────
        const scene = new THREE.Scene();

        // ── Camera ────────────────────────────────────────────
        const camera = new THREE.PerspectiveCamera(
            60,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            100
        );
        camera.position.set(0, 0, 6);

        // ── Renderer ──────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,        // transparent background → CSS bg shows through
            antialias: true,
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // ── Lights ────────────────────────────────────────────

        // Soft ambient fill
        const ambient = new THREE.AmbientLight(0xffffff, 0.15);
        scene.add(ambient);

        // Main violet point light (front-top-right)
        const light1 = new THREE.PointLight(CONFIG.COLOR_PRIMARY, 4, 18);
        light1.position.set(4, 4, 4);
        scene.add(light1);

        // Secondary cyan light (front-bottom-left)
        const light2 = new THREE.PointLight(CONFIG.COLOR_SECONDARY, 4, 18);
        light2.position.set(-4, -3, 3);
        scene.add(light2);

        // Accent pink back-light for rim effect
        const light3 = new THREE.PointLight(CONFIG.COLOR_ACCENT, 2, 14);
        light3.position.set(0, 0, -5);
        scene.add(light3);

        // ── Main AI Geometry: Icosahedron (geodesic sphere) ───
        const geoSphere = new THREE.IcosahedronGeometry(
            CONFIG.SPHERE_RADIUS,
            CONFIG.SPHERE_DETAIL
        );

        // Solid surface — slightly transparent, reflective
        const matSolid = new THREE.MeshPhongMaterial({
            color: CONFIG.COLOR_PRIMARY,
            emissive: new THREE.Color(0x1a0040),
            specular: new THREE.Color(CONFIG.COLOR_SECONDARY),
            shininess: 80,
            transparent: true,
            opacity: 0.72,
        });
        const meshSolid = new THREE.Mesh(geoSphere, matSolid);
        scene.add(meshSolid);

        // Wireframe overlay — gives that futuristic AI mesh look
        const geoWire = new THREE.WireframeGeometry(geoSphere);
        const matWire = new THREE.LineBasicMaterial({
            color: CONFIG.COLOR_SECONDARY,
            transparent: true,
            opacity: 0.25,
        });
        const meshWire = new THREE.LineSegments(geoWire, matWire);
        meshSolid.add(meshWire); // attach to solid so they rotate together

        // ── Energy Rings (orbiting the central sphere) ────────
        function makeRing(radius, color, opacity, rotX, rotY, rotZ) {
            const geo = new THREE.TorusGeometry(radius, 0.018, 12, 120);
            const mat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity,
            });
            const ring = new THREE.Mesh(geo, mat);
            ring.rotation.set(rotX, rotY, rotZ);
            scene.add(ring);
            return ring;
        }

        const ring1 = makeRing(CONFIG.RING1_RADIUS, CONFIG.COLOR_PRIMARY, 0.55, Math.PI / 2.5, 0, 0);
        const ring2 = makeRing(CONFIG.RING2_RADIUS, CONFIG.COLOR_SECONDARY, 0.42, Math.PI / 4, Math.PI / 6, 0);
        const ring3 = makeRing(CONFIG.RING3_RADIUS, CONFIG.COLOR_ACCENT, 0.28, Math.PI / 6, Math.PI / 3.5, Math.PI / 5);

        // ── Floating Particles ────────────────────────────────
        const positions = new Float32Array(CONFIG.PARTICLE_COUNT * 3);
        const colors = new Float32Array(CONFIG.PARTICLE_COUNT * 3);
        const spread = CONFIG.PARTICLE_SPREAD;

        // Palette: a mix of violet, cyan, and pink
        const palette = [
            new THREE.Color(CONFIG.COLOR_PRIMARY),
            new THREE.Color(CONFIG.COLOR_SECONDARY),
            new THREE.Color(CONFIG.COLOR_ACCENT),
        ];

        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            // Random position in a large cube, avoiding the center cluster
            positions[i * 3] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;

            // Pick a random palette color with slight variation
            const base = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = base.r * (0.7 + Math.random() * 0.3);
            colors[i * 3 + 1] = base.g * (0.7 + Math.random() * 0.3);
            colors[i * 3 + 2] = base.b * (0.7 + Math.random() * 0.3);
        }

        const geoParticles = new THREE.BufferGeometry();
        geoParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geoParticles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const matParticles = new THREE.PointsMaterial({
            size: CONFIG.PARTICLE_SIZE,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,    // farther = smaller
            depthWrite: false,   // prevents z-fighting artifacts
        });

        const particles = new THREE.Points(geoParticles, matParticles);
        scene.add(particles);

        // ── Mouse Interaction ─────────────────────────────────
        let mouseX = 0, mouseY = 0;   // normalized -1 to +1
        let targetX = 0, targetY = 0; // smoothed target

        window.addEventListener('mousemove', (e) => {
            // Normalize to -1 … +1
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });

        // Touch support for mobile
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
                mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
            }
        }, { passive: true });

        // ── Resize Handler ────────────────────────────────────
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const w = canvas.clientWidth;
                const h = canvas.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }, 100); // debounce
        }, { passive: true });

        // ── Animation Loop ────────────────────────────────────
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);

            const t = clock.getElapsedTime();

            // ── Smooth mouse follow (lerp) ──
            targetX += (mouseX - targetX) * CONFIG.LERP_FACTOR;
            targetY += (mouseY - targetY) * CONFIG.LERP_FACTOR;

            // ── Rotate main sphere — auto + mouse offset ──
            meshSolid.rotation.y = t * CONFIG.ROTATION_Y + targetX * CONFIG.MOUSE_SENSITIVITY;
            meshSolid.rotation.x = t * CONFIG.ROTATION_X - targetY * (CONFIG.MOUSE_SENSITIVITY * 0.5);

            // ── Animate energy rings independently ──
            ring1.rotation.z = t * 0.22;
            ring1.rotation.y += 0.003;

            ring2.rotation.y = t * 0.14;
            ring2.rotation.x = Math.PI / 4 + targetY * 0.3;
            ring2.rotation.z = t * 0.08;

            ring3.rotation.x = t * 0.10;
            ring3.rotation.z += 0.005;
            ring3.rotation.y = Math.PI / 3.5 + targetX * 0.25;

            // ── Slowly drift particles ──
            particles.rotation.y = t * 0.018;
            particles.rotation.x = t * 0.009;

            // ── Pulse lights for breathing effect ──
            light1.intensity = 4 + Math.sin(t * 1.8) * 1.5;
            light2.intensity = 4 + Math.cos(t * 1.3) * 1.5;
            light3.intensity = 2 + Math.sin(t * 2.5) * 0.8;

            // ── Pulse main sphere opacity ──
            matSolid.opacity = 0.65 + Math.sin(t * 1.2) * 0.08;

            renderer.render(scene, camera);
        }

        animate();
    }

})();

/*
  ═══════════════════════════════════════════════════════
  CUSTOMIZATION GUIDE
  ═══════════════════════════════════════════════════════

  To change colors:
    COLOR_PRIMARY   → Main object color       (default: violet  #7c3aed)
    COLOR_SECONDARY → Wireframe + light color (default: cyan    #06b6d4)
    COLOR_ACCENT    → Ring + rim light color  (default: pink    #ec4899)

  To change the 3D shape:
    Replace IcosahedronGeometry with:
    - THREE.OctahedronGeometry(1.6, 0) → diamond shape
    - THREE.TorusKnotGeometry(1, 0.35, 128, 16) → twisted knot
    - THREE.SphereGeometry(1.6, 32, 32) → smooth sphere

  To modify performance (for low-end devices):
    PARTICLE_COUNT: 2000 → 800   (fewer particles)
    SPHERE_DETAIL:  1    → 0     (fewer polygons)
    renderer.setPixelRatio(1)    (force 1x pixel ratio)

  To adjust responsiveness:
    MOUSE_SENSITIVITY → higher = more dramatic movement
    LERP_FACTOR       → higher = snappier, lower = smoother

  ═══════════════════════════════════════════════════════
*/
