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
const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure contacts.json exists
if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// ── CORS FIX ──────────────────────────────────────────────
app.use(cors({
    origin: [
        'https://mradulportfolio-three.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// ── Middleware ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request Logger ────────────────────────────────────────
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ── Routes ────────────────────────────────────────────────

// Home Route
app.get('/', (_req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Portfolio API</title>
      <style>
        body {
          font-family: system-ui, sans-serif;
          max-width: 600px;
          margin: 6rem auto;
          padding: 2rem;
          text-align: center;
          background: #0a0a0f;
          color: #f0f0ff;
        }

        h1 {
          color: #7c3aed;
        }

        code {
          background: #16161f;
          padding: 0.2em 0.5em;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #06b6d4;
        }

        .badge {
          display: inline-block;
          background: #10b981;
          color: #fff;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          margin-top: 1rem;
        }
      </style>
    </head>

    <body>
      <h1>Portfolio API</h1>

      <div class="badge">
        Server Running Successfully
      </div>

      <p>
        Use <code>POST /api/contact</code> to submit form data.
      </p>

      <p>
        <a href="/api/contacts" style="color:#7c3aed">
          View Contacts
        </a>
      </p>
    </body>
    </html>
    `);
});

// Health Check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Portfolio API is healthy',
        timestamp: new Date().toISOString(),
    });
});

// Get All Contacts
app.get('/api/contacts', (_req, res) => {
    try {
        const contacts = readContacts();

        res.json({
            success: true,
            count: contacts.length,
            data: contacts,
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch contacts',
        });
    }
});

// Contact Form Route
app.post(
    '/api/contact',

    [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 2, max: 100 }),

        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email')
            .normalizeEmail(),

        body('subject')
            .trim()
            .notEmpty().withMessage('Subject is required')
            .isLength({ min: 3, max: 200 }),

        body('message')
            .trim()
            .notEmpty().withMessage('Message is required')
            .isLength({ min: 10, max: 3000 }),
    ],

    (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { name, email, subject, message } = req.body;

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

            const contacts = readContacts();

            contacts.push(newContact);

            saveContacts(contacts);

            console.log(`New Contact Saved: ${name}`);

            return res.status(201).json({
                success: true,
                message: 'Message received successfully!',
                id: newContact.id,
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Internal Server Error',
            });
        }
    }
);

// 404 Route
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Global Error Handler
app.use((err, _req, res, _next) => {

    console.error(err);

    res.status(500).json({
        success: false,
        message: 'Something went wrong',
    });
});

// ── Helper Functions ──────────────────────────────────────

function readContacts() {

    const raw = fs.readFileSync(CONTACTS_FILE, 'utf8');

    try {
        return JSON.parse(raw) || [];
    } catch {
        return [];
    }
}

function saveContacts(contacts) {

    fs.writeFileSync(
        CONTACTS_FILE,
        JSON.stringify(contacts, null, 2),
        'utf8'
    );
}

function generateId() {

    return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

// ── Start Server ──────────────────────────────────────────

app.listen(PORT, () => {

    console.log('');
    console.log('===================================');
    console.log(`Server Running on Port ${PORT}`);
    console.log('===================================');
    console.log('');

});