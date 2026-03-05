const ANIMATION_CONFIG = {
    INITIAL_DURATION: 1200,
    INITIAL_X_OFFSET: 70,
    INITIAL_Y_OFFSET: 60,
    DEVICE_BETA_OFFSET: 20,
    ENTER_TRANSITION_MS: 180
};

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

function createTiltEngine(getShell, getWrap) {
    let rafId = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x, y) => {
        const shell = getShell();
        const wrap = getWrap();
        if (!shell || !wrap) return;

        const width = shell.clientWidth || 1;
        const height = shell.clientHeight || 1;

        const percentX = clamp((100 / width) * x);
        const percentY = clamp((100 / height) * y);

        const centerX = percentX - 50;
        const centerY = percentY - 50;

        const properties = {
            '--pointer-x': `${percentX}%`,
            '--pointer-y': `${percentY}%`,
            '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
            '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
            '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
            '--pointer-from-top': `${percentY / 100}`,
            '--pointer-from-left': `${percentX / 100}`,
            '--rotate-x': `${round(-(centerX / 5))}deg`,
            '--rotate-y': `${round(centerY / 4)}deg`
        };

        for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = ts => {
        if (!running) return;
        if (lastTs === 0) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;

        const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
        const k = 1 - Math.exp(-dt / tau);

        currentX += (targetX - currentX) * k;
        currentY += (targetY - currentY) * k;

        setVarsFromXY(currentX, currentY);

        const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

        if (stillFar || document.hasFocus()) {
            rafId = requestAnimationFrame(step);
        } else {
            running = false;
            lastTs = 0;
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    };

    const start = () => {
        if (running) return;
        running = true;
        lastTs = 0;
        rafId = requestAnimationFrame(step);
    };

    return {
        setImmediate(x, y) {
            currentX = x;
            currentY = y;
            setVarsFromXY(currentX, currentY);
        },
        setTarget(x, y) {
            targetX = x;
            targetY = y;
            start();
        },
        toCenter() {
            const shell = getShell();
            if (!shell) return;
            this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
        },
        beginInitial(durationMs) {
            initialUntil = performance.now() + durationMs;
            start();
        },
        getCurrent() {
            return { x: currentX, y: currentY, tx: targetX, ty: targetY };
        },
        cancel() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
            running = false;
            lastTs = 0;
        }
    };
}

function initProfileCard(options) {
    const {
        enableTilt = true,
        enableMobileTilt = false,
        mobileTiltSensitivity = 5
    } = options || {};

    const wrapEl = document.querySelector('.pc-card-wrapper');
    const shellEl = document.querySelector('.pc-card-shell');

    if (!wrapEl || !shellEl) return;

    let enterTimer = null;
    let leaveRaf = null;

    const tiltEngine = enableTilt
        ? createTiltEngine(() => shellEl, () => wrapEl)
        : null;

    const getOffsets = (evt, el) => {
        const rect = el.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    };

    const handlePointerMove = event => {
        if (!tiltEngine) return;
        const { x, y } = getOffsets(event, shellEl);
        tiltEngine.setTarget(x, y);
    };

    const handlePointerEnter = event => {
        if (!tiltEngine) return;
        shellEl.classList.add('active');
        shellEl.classList.add('entering');
        if (enterTimer) window.clearTimeout(enterTimer);
        enterTimer = window.setTimeout(() => {
            shellEl.classList.remove('entering');
        }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);
        const { x, y } = getOffsets(event, shellEl);
        tiltEngine.setTarget(x, y);
    };

    const handlePointerLeave = () => {
        if (!tiltEngine) return;
        tiltEngine.toCenter();
        const checkSettle = () => {
            const { x, y, tx, ty } = tiltEngine.getCurrent();
            const settled = Math.hypot(tx - x, ty - y) < 0.6;
            if (settled) {
                shellEl.classList.remove('active');
                leaveRaf = null;
            } else {
                leaveRaf = requestAnimationFrame(checkSettle);
            }
        };
        if (leaveRaf) cancelAnimationFrame(leaveRaf);
        leaveRaf = requestAnimationFrame(checkSettle);
    };

    const handleDeviceOrientation = event => {
        if (!tiltEngine) return;
        const { beta, gamma } = event;
        if (beta == null || gamma == null) return;
        const centerX = shellEl.clientWidth / 2;
        const centerY = shellEl.clientHeight / 2;
        const x = clamp(centerX + gamma * mobileTiltSensitivity, 0, shellEl.clientWidth);
        const y = clamp(
            centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity,
            0,
            shellEl.clientHeight
        );
        tiltEngine.setTarget(x, y);
    };

    if (enableTilt && tiltEngine) {
        shellEl.addEventListener('pointerenter', handlePointerEnter);
        shellEl.addEventListener('pointermove', handlePointerMove);
        shellEl.addEventListener('pointerleave', handlePointerLeave);

        const handleClick = () => {
            if (!enableMobileTilt || location.protocol !== 'https:') return;
            const anyMotion = window.DeviceMotionEvent;
            if (anyMotion && typeof anyMotion.requestPermission === 'function') {
                anyMotion
                    .requestPermission()
                    .then(state => {
                        if (state === 'granted') {
                            window.addEventListener('deviceorientation', handleDeviceOrientation);
                        }
                    })
                    .catch(console.error);
            } else {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
        };
        shellEl.addEventListener('click', handleClick);

        const initialX = (shellEl.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
        const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
        tiltEngine.setImmediate(initialX, initialY);
        tiltEngine.toCenter();
        tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initProfileCard({
        enableTilt: true,
        enableMobileTilt: false,
        mobileTiltSensitivity: 5
    });
});
