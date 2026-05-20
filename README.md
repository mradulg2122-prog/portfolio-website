# 🚀 AI Developer Portfolio Website

A complete professional full-stack portfolio website for an AI Developer.

**Stack:** HTML + CSS + JavaScript (frontend) | Node.js + Express (backend)

---

## 📁 Project Structure

```
portfolio-website/
├── frontend/
│   ├── index.html      ← Main HTML (all sections)
│   ├── styles.css      ← Complete stylesheet (dark/light mode, animations)
│   └── script.js       ← All JavaScript (theme, form, particles, animations)
│
├── backend/
│   ├── server.js       ← Express API server
│   ├── package.json    ← Node.js dependencies
│   └── data/
│       └── contacts.json   ← Contact submissions (auto-created)
│
└── README.md
```

---

## 🛠️ Setup & Running

### 1. Start the Backend API

```bash
# Navigate to the backend folder
cd backend

# Install dependencies
npm install

# Start the server (runs on http://localhost:5000)
npm start

# OR for development with auto-reload
npm run dev
```

You'll see:
```
╔══════════════════════════════════════╗
║   Portfolio API Server — Running      ║
║   http://localhost:5000               ║
╚══════════════════════════════════════╝
```

### 2. Open the Frontend

**Option A — Open directly in browser (simplest)**
```
Just open:  frontend/index.html  in any modern browser
```

**Option B — Via a local dev server (recommended, avoids CORS issues)**
```bash
# Using VS Code Live Server extension, or:
npx -y serve frontend
# Then open http://localhost:3000
```

---

## 🌐 API Endpoints

| Method | Endpoint         | Description                    |
|--------|-----------------|-------------------------------|
| GET    | `/`             | API landing page               |
| GET    | `/api/health`   | Health check (JSON)            |
| POST   | `/api/contact`  | Submit contact form            |
| GET    | `/api/contacts` | View all submissions           |

### POST `/api/contact` — Request Body

```json
{
  "name":    "John Doe",
  "email":   "john@example.com",
  "subject": "Project Inquiry",
  "message": "Hello, I'd like to work with you!"
}
```

### POST `/api/contact` — Success Response (`201`)

```json
{
  "success": true,
  "message": "Thank you! Your message has been received.",
  "id": "1706123456789-a3f8c2"
}
```

---

## ✨ Features

| Feature                    | Detail                                             |
|----------------------------|----------------------------------------------------|
| 🌙 Dark / Light Mode       | Toggle with memory (localStorage)                  |
| 💬 Typed Animation          | Auto-cycling phrases in hero section               |
| ✨ Particle Background       | Animated canvas with connected nodes               |
| 📜 Scroll Reveal            | Elements animate in as you scroll                  |
| 📊 Skill Bars               | Animated progress bars                             |
| 📱 Fully Responsive         | Mobile, tablet, desktop                            |
| ✅ Form Validation          | Frontend + server-side                             |
| 💾 Data Persistence         | Saved to `backend/data/contacts.json`              |
| 🔒 CORS Enabled             | Configured for local dev and production            |

---

## 🎨 Customization

- **Name / Role:** Edit `frontend/index.html` — search for "Alex Nova"
- **Colors / Theme:** Edit CSS variables in `frontend/styles.css` (`:root` block)
- **Projects:** Add/edit `.project-card` blocks in `index.html`
- **Social Links:** Update `href` values in the footer and contact section
- **Backend Port:** Change `PORT` in `backend/server.js` and `API_URL` in `frontend/script.js`

---

## 📦 Dependencies

### Backend
- **express** — Web framework
- **cors** — Cross-Origin Resource Sharing
- **express-validator** — Server-side input validation
- **nodemon** *(dev)* — Auto-reload on file changes
