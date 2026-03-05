/**
 * script.js — Portfolio Website JavaScript
 * Features:
 *  - Dark / Light mode toggle (persisted in localStorage)
 *  - Sticky navbar with scroll effects & active link highlighting
 *  - Hamburger mobile menu
 *  - Typed-text animation in Hero
 *  - Particle canvas background
 *  - Scroll-reveal (AOS-lite) animations
 *  - Skill bar animated fill on scroll
 *  - Contact form with validation + API submission
 *  - Scroll-to-top button
 */

'use strict';

/* =========================================================
   THEME — Dark / Light Mode
   ========================================================= */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;

/**
 * Apply a theme ('dark' | 'light') and persist to localStorage.
 */
function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio-theme', theme);
    // Update toggle icon
    themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// Restore saved theme on load (default = dark)
applyTheme(localStorage.getItem('portfolio-theme') || 'dark');

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

/* =========================================================
   NAVBAR — scroll effect, active link, hamburger
   ========================================================= */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link');

// Add 'scrolled' glass-morphism class when page is scrolled
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    updateActiveNavLink();
    toggleScrollTopBtn();
}, { passive: true });

/** Highlight the nav link whose section is in view */
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    let currentId = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            currentId = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentId}`) {
            link.classList.add('active');
        }
    });
}

// Hamburger toggle
hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    mobileMenu.style.display = mobileMenu.classList.contains('open') ? 'block' : 'none';

    // Animate hamburger bars to × and back
    const spans = hamburger.querySelectorAll('span');
    if (mobileMenu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
});

// Close mobile menu when a link is clicked
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        mobileMenu.style.display = 'none';
        hamburger.querySelectorAll('span').forEach(s => {
            s.style.transform = '';
            s.style.opacity = '';
        });
    });
});

/* Keep mobile menu display synced with class on resize */
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        mobileMenu.classList.remove('open');
        mobileMenu.style.display = 'none';
        hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
}, { passive: true });

/* =========================================================
   TYPED-TEXT ANIMATION in Hero
   ========================================================= */
const typingEl = document.getElementById('typingText');

// Phrases to cycle through
const phrases = [
    'AI models',
    'intelligent systems',
    'ML pipelines',
    'smart web apps',
    'the future 🚀',
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typeSpeed = 80;   // ms per char while typing
const deleteSpeed = 45;  // ms per char while deleting
const pauseAfterType = 1600; // ms pause before deleting
const pauseAfterDelete = 400;  // ms pause before next phrase

function typeEffect() {
    const currentPhrase = phrases[phraseIndex];

    if (!isDeleting) {
        // -- Typing forward --
        typingEl.textContent = currentPhrase.slice(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentPhrase.length) {
            // Finished typing; pause then start deleting
            isDeleting = true;
            setTimeout(typeEffect, pauseAfterType);
            return;
        }
        setTimeout(typeEffect, typeSpeed);
    } else {
        // -- Deleting --
        typingEl.textContent = currentPhrase.slice(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(typeEffect, pauseAfterDelete);
            return;
        }
        setTimeout(typeEffect, deleteSpeed);
    }
}

// Start the typing animation after a short delay
setTimeout(typeEffect, 1000);

/* =========================================================
   PARTICLE CANVAS BACKGROUND
   ========================================================= */
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 80;
    const CONNECTION_DISTANCE = 140;

    // Resize canvas to fill hero
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Particle constructor
    function Particle() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.5 + 0.2;
    }

    Particle.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    };

    Particle.prototype.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${this.alpha})`;
        ctx.fill();
    };

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    // Draw connections between nearby particles
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECTION_DISTANCE) {
                    const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(124, 58, 237, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections();
        requestAnimationFrame(animate);
    }

    animate();
})();

/* =========================================================
   SCROLL REVEAL — AOS-lite (Intersection Observer)
   ========================================================= */
function initScrollReveal() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    // Once animated, unobserve (one-shot animation)
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px',
        }
    );

    document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
}

// Kick off after DOM is settled
window.addEventListener('load', initScrollReveal);

/* =========================================================
   SKILL BARS — animated fill on scroll
   ========================================================= */
function initSkillBars() {
    const skillFills = document.querySelectorAll('.skill-fill');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target;
                    const width = fill.dataset.width;
                    // Small delay so scroll-reveal completes first
                    setTimeout(() => { fill.style.width = `${width}%`; }, 300);
                    observer.unobserve(fill);
                }
            });
        },
        { threshold: 0.4 }
    );

    skillFills.forEach(fill => observer.observe(fill));
}

window.addEventListener('load', initSkillBars);

/* =========================================================
   SCROLL-TO-TOP BUTTON
   ========================================================= */
const scrollTopBtn = document.getElementById('scrollTop');

function toggleScrollTopBtn() {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
}

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* =========================================================
   FOOTER — current year
   ========================================================= */
const yearEl = document.getElementById('currentYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =========================================================
   CONTACT FORM — Validation + API Submission
   ========================================================= */

/** Backend API URL — adjust port if needed */
const API_URL = "https://portfolio-website-h8lv.onrender.com/api/contact";

const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formAlert = document.getElementById('formAlert');

/* --- Field references --- */
const fields = {
    name: { el: document.getElementById('name'), errorEl: document.getElementById('nameError') },
    email: { el: document.getElementById('email'), errorEl: document.getElementById('emailError') },
    subject: { el: document.getElementById('subject'), errorEl: document.getElementById('subjectError') },
    message: { el: document.getElementById('message'), errorEl: document.getElementById('messageError') },
};

/* --- Validation rules --- */
const validators = {
    name: (value) => {
        if (!value.trim()) return 'Name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
    },
    email: (value) => {
        if (!value.trim()) return 'Email is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address.';
        return '';
    },
    subject: (value) => {
        if (!value.trim()) return 'Subject is required.';
        if (value.trim().length < 3) return 'Subject must be at least 3 characters.';
        return '';
    },
    message: (value) => {
        if (!value.trim()) return 'Message is required.';
        if (value.trim().length < 10) return 'Message must be at least 10 characters.';
        return '';
    },
};

/**
 * Validate a single field.
 * Returns true if valid, false if invalid.
 */
function validateField(name) {
    const field = fields[name];
    const value = field.el.value;
    const errorMsg = validators[name](value);

    field.errorEl.textContent = errorMsg;
    field.el.classList.toggle('error', !!errorMsg);
    field.el.classList.toggle('valid', !errorMsg && value.trim() !== '');
    return !errorMsg;
}

/**
 * Validate all fields.
 * Returns true if all are valid.
 */
function validateAll() {
    return Object.keys(validators).map(validateField).every(Boolean);
}

// Live validation on blur
Object.keys(fields).forEach(name => {
    fields[name].el.addEventListener('blur', () => validateField(name));
    fields[name].el.addEventListener('input', () => {
        if (fields[name].el.classList.contains('error')) {
            validateField(name); // Re-validate immediately if already errored
        }
    });
});

/**
 * Show the form alert banner.
 * @param {'success'|'error'} type
 * @param {string} message
 */
function showAlert(type, message) {
    formAlert.className = `form-alert ${type}`;
    formAlert.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    ${message}
  `;
    formAlert.style.display = 'flex';

    // Auto-hide success alert after 6 seconds
    if (type === 'success') {
        setTimeout(() => { formAlert.style.display = 'none'; }, 6000);
    }
}

/** Toggle loading state on submit button */
function setLoading(loading) {
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    submitBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'flex';
    btnLoading.style.display = loading ? 'flex' : 'none';
}

/* --- Form submit handler --- */
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formAlert.style.display = 'none';

    // Run full validation
    if (!validateAll()) {
        showAlert('error', 'Please fix the errors above and try again.');
        return;
    }

    setLoading(true);

    const payload = {
        name: fields.name.el.value.trim(),
        email: fields.email.el.value.trim(),
        subject: fields.subject.el.value.trim(),
        message: fields.message.el.value.trim(),
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('success', '🎉 Your message was sent! I\'ll get back to you within 24 hours.');
            contactForm.reset();
            // Clear all valid/error states on inputs
            Object.values(fields).forEach(f => {
                f.el.classList.remove('valid', 'error');
                f.errorEl.textContent = '';
            });
        } else {
            showAlert('error', data.message || 'Something went wrong. Please try again.');
        }
    } catch (err) {
        // Network error or server is offline
        console.error('Contact form error:', err);
        showAlert(
            'error',
            '⚡ Could not reach the server. Make sure the backend is running on port 5000, or try again later.'
        );
    } finally {
        setLoading(false);
    }
});

/* =========================================================
   SMOOTH SCROLL for all anchor links
   ========================================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

/* =========================================================
   INITIAL TRIGGER — handle page load at non-zero scroll
   ========================================================= */
window.dispatchEvent(new Event('scroll'));

/* =========================================================
   PROFILE CARD — Vanilla JS port of React ProfileCard
   Exact port of the tilt engine from ProfileCard.jsx
   (Original by Javi A. Torres / reactbits.dev)
   ========================================================= */
(function initProfileCard() {
    const wrap = document.getElementById('profileCardWrapper');
    const shell = document.getElementById('profileCardShell');
    const card = document.getElementById('profileCard');
    if (!wrap || !shell || !card) return;

    /* ---- Mirrors React component ANIMATION_CONFIG ---- */
    const ANIMATION_CONFIG = {
        INITIAL_DURATION: 1200,
        INITIAL_X_OFFSET: 70,
        INITIAL_Y_OFFSET: 60,
        DEVICE_BETA_OFFSET: 20,
        ENTER_TRANSITION_MS: 180
    };

    /* ---- Exact helpers from the React component ---- */
    const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
    const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
    const adjust = (v, fMin, fMax, tMin, tMax) =>
        round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

    /* ---- Tilt engine state ---- */
    let rafId = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0, currentY = 0;
    let targetX = 0, targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    /* setVarsFromXY — exact copy of the React version */
    function setVarsFromXY(x, y) {
        const width = shell.clientWidth || 1;
        const height = shell.clientHeight || 1;
        const percentX = clamp((100 / width) * x);
        const percentY = clamp((100 / height) * y);
        const centerX = percentX - 50;
        const centerY = percentY - 50;

        const props = {
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

        for (const [k, v] of Object.entries(props)) {
            wrap.style.setProperty(k, v);
        }
    }

    /* Animation step — exact exponential tau smoothing from React version */
    function step(ts) {
        if (!running) return;
        if (lastTs === 0) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;

        const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
        const k = 1 - Math.exp(-dt / tau);

        currentX += (targetX - currentX) * k;
        currentY += (targetY - currentY) * k;

        setVarsFromXY(currentX, currentY);

        const stillFar =
            Math.abs(targetX - currentX) > 0.05 ||
            Math.abs(targetY - currentY) > 0.05;

        if (stillFar || document.hasFocus()) {
            rafId = requestAnimationFrame(step);
        } else {
            running = false;
            lastTs = 0;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        }
    }

    function start() {
        if (running) return;
        running = true;
        lastTs = 0;
        rafId = requestAnimationFrame(step);
    }

    function setTarget(x, y) { targetX = x; targetY = y; start(); }
    function setImmediate_(x, y) { currentX = x; currentY = y; setVarsFromXY(x, y); }
    function toCenter() { setTarget(shell.clientWidth / 2, shell.clientHeight / 2); }
    function beginInitial(ms) { initialUntil = performance.now() + ms; start(); }
    function getCurrent() { return { x: currentX, y: currentY, tx: targetX, ty: targetY }; }

    function getOffsets(evt, el) {
        const rect = el.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    /* ---- Event listeners — exact same logic as React useEffect ---- */
    let enterTimer = null;
    let leaveRaf = null;

    shell.addEventListener('pointerenter', function (e) {
        shell.classList.add('active');
        card.classList.add('active');
        shell.classList.add('entering');
        if (enterTimer) clearTimeout(enterTimer);
        enterTimer = setTimeout(() => shell.classList.remove('entering'), ANIMATION_CONFIG.ENTER_TRANSITION_MS);
        const { x, y } = getOffsets(e, shell);
        setTarget(x, y);
    });

    shell.addEventListener('pointermove', function (e) {
        const { x, y } = getOffsets(e, shell);
        setTarget(x, y);
    });

    shell.addEventListener('pointerleave', function () {
        toCenter();
        function checkSettle() {
            const { x, y, tx, ty } = getCurrent();
            const settled = Math.hypot(tx - x, ty - y) < 0.6;
            if (settled) {
                shell.classList.remove('active');
                card.classList.remove('active');
                leaveRaf = null;
            } else {
                leaveRaf = requestAnimationFrame(checkSettle);
            }
        }
        if (leaveRaf) cancelAnimationFrame(leaveRaf);
        leaveRaf = requestAnimationFrame(checkSettle);
    });

    /* ---- Initial animation (card starts offset, smoothly centers) ---- */
    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    setImmediate_(initialX, initialY);
    toCenter();
    beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    /* ---- Avatar: show img if src is provided, else show icon fallback ---- */
    const avatarImg = document.getElementById('pcAvatarImg');
    const avatarIcon = document.getElementById('pcAvatarIcon');
    if (avatarImg && avatarIcon) {
        if (avatarImg.src && avatarImg.src !== window.location.href) {
            avatarImg.style.display = '';
            avatarIcon.style.display = 'none';
            avatarImg.onerror = () => {
                avatarImg.style.display = 'none';
                avatarIcon.style.display = '';
            };
        }
    }
})();
