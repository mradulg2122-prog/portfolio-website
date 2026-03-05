/**
 * server.js — Portfolio Contact Form Backend
 *
 * Stack: Node.js + Express
 * Endpoints:
 *   GET  /             → Health check
 *   GET  /api/health   → JSON health check
 *   POST /api/contact  → Save contact form submission to data/contacts.json
 *
 * Usage:
 *   npm install
 *   npm start        (production)
 *   npm run dev      (development with auto-reload via nodemon)
 */

'use strict';

// ── Imports ───────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

// ── App Setup ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── Paths ─────────────────────────────────────────────────
/** Directory to store JSON data files */
const DATA_DIR = path.join(__dirname, 'data');
/** File that stores all contact form submissions */
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
// Ensure the contacts JSON file exists with an empty array
if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// ── Middleware ────────────────────────────────────────────

/**
 * CORS — allow requests from the frontend (any localhost origin in dev).
 * In production, replace `origin` with your actual domain.
 */
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000',
        'http://localhost:5500', 'http://127.0.0.1:5500',
        'null'],   // 'null' covers file:// origin when opening index.html directly
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

/** Parse incoming JSON request bodies */
app.use(express.json());

/** Parse URL-encoded form bodies (for standard HTML form POST, just in case) */
app.use(express.urlencoded({ extended: true }));

// ── Request Logger (simple) ───────────────────────────────
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ── Routes ────────────────────────────────────────────────

/**
 * GET /
 * Simple HTML landing page confirming the API is live.
 */
app.get('/', (_req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Portfolio API</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 600px;
               margin: 6rem auto; padding: 2rem; text-align: center;
               background: #0a0a0f; color: #f0f0ff; }
        h1 { color: #7c3aed; }
        code { background: #16161f; padding: 0.2em 0.5em; border-radius: 6px;
               font-size: 0.95rem; color: #06b6d4; }
        .badge { display: inline-block; background: #10b981; color: #fff;
                 padding: 0.4rem 1rem; border-radius: 999px; font-size: 0.85rem;
                 margin-top: 1rem; }
      </style>
    </head>
    <body>
      <h1>🚀 Portfolio API</h1>
      <div class="badge">✓ Server is running</div>
      <p>Use <code>POST /api/contact</code> to submit a contact form message.</p>
      <p><a href="/api/contacts" style="color:#7c3aed">View all submissions →</a></p>
    </body>
    </html>
  `);
});

/**
 * GET /api/health
 * JSON health check endpoint.
 */
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Portfolio API is healthy',
        timestamp: new Date().toISOString(),
    });
});

/**
 * GET /api/contacts
 * Returns all stored contact submissions (for review/admin purposes).
 * ⚠️  In production, protect this endpoint with authentication.
 */
app.get('/api/contacts', (_req, res) => {
    try {
        const contacts = readContacts();
        res.json({
            success: true,
            count: contacts.length,
            data: contacts,
        });
    } catch (err) {
        console.error('Error reading contacts:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve contacts.',
        });
    }
});

/**
 * POST /api/contact
 * Validates and saves a contact form submission.
 *
 * Expected body:
 *   { name: string, email: string, subject: string, message: string }
 *
 * Validation is performed server-side with express-validator.
 */
app.post(
    '/api/contact',

    // ── Validation rules ──────────────────────────────────
    [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required.')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

        body('email')
            .trim()
            .notEmpty().withMessage('Email is required.')
            .isEmail().withMessage('Please provide a valid email address.')
            .normalizeEmail(),

        body('subject')
            .trim()
            .notEmpty().withMessage('Subject is required.')
            .isLength({ min: 3, max: 200 }).withMessage('Subject must be between 3 and 200 characters.'),

        body('message')
            .trim()
            .notEmpty().withMessage('Message is required.')
            .isLength({ min: 10, max: 3000 }).withMessage('Message must be between 10 and 3000 characters.'),
    ],

    // ── Route Handler ─────────────────────────────────────
    (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                message: 'Validation failed. Please check your inputs.',
                errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
            });
        }

        const { name, email, subject, message } = req.body;

        // Build the new contact record
        const newContact = {
            id: generateId(),
            name,
            email,
            subject,
            message,
            createdAt: new Date().toISOString(),
            ipAddress: req.ip || 'unknown',
        };

        try {
            // Read existing contacts, append new entry, and save back
            const contacts = readContacts();
            contacts.push(newContact);
            saveContacts(contacts);

            console.log(`✅ New contact saved: ${name} <${email}>`);

            return res.status(201).json({
                success: true,
                message: 'Thank you! Your message has been received. I\'ll get back to you within 24 hours.',
                id: newContact.id,
            });
        } catch (err) {
            console.error('Error saving contact:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.',
            });
        }
    }
);

// ── 404 Handler ───────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found.',
    });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Something went wrong on the server.',
    });
});

// ── Helper Functions ──────────────────────────────────────

/**
 * Read contacts from the JSON file.
 * Returns an empty array if the file is empty or malformed.
 */
function readContacts() {
    const raw = fs.readFileSync(CONTACTS_FILE, 'utf8');
    try {
        return JSON.parse(raw) || [];
    } catch {
        return [];
    }
}

/**
 * Save the contacts array back to the JSON file (pretty-printed).
 */
function saveContacts(contacts) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf8');
}

/**
 * Generate a simple unique ID (timestamp + random hex).
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

// ── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║   Portfolio API Server — Running      ║');
    console.log(`║   http://localhost:${PORT}               ║`);
    console.log('╚══════════════════════════════════════╝');
    console.log('');
    console.log(`📂 Contacts file: ${CONTACTS_FILE}`);
    console.log('📡 Endpoints:');
    console.log(`   GET  http://localhost:${PORT}/`);
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   POST http://localhost:${PORT}/api/contact`);
    console.log(`   GET  http://localhost:${PORT}/api/contacts`);
    console.log('');
});
