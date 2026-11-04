# Sahu Ji Gajak

A premium royal Indian sweets e-commerce web platform handcrafted with a Rajput and Mughal palace aesthetic, deep maroon velvet tones, antique gold filigree borders, and a 269-frame scroll-controlled canvas hero animation.

---

## 🏛️ Project Architecture

```
sahu-ji-gajak/
│
├── frontend/
│   ├── public/
│   │   ├── frames/                   # 269 sequential 1920x1080 animation frames
│   │   └── assets/                   # SVG crowns, royal seals & branding
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Royal palace navbar matching reference design
│   │   │   └── ScrollAnimation.jsx   # 269-frame scroll-controlled HTML5 canvas sequence
│   │   │
│   │   ├── styles/
│   │   │   ├── Navbar.css            # Translucent maroon, gold borders, corner filigree
│   │   │   └── ScrollAnimation.css   # Cover aspect ratio, HUD loader & logo reveal stage
│   │   │
│   │   ├── App.jsx                   # Main layout container
│   │   ├── main.jsx                  # React 18 DOM mount
│   │   └── index.css                 # Royal palettes, custom scrollbar & fonts
│   │
│   ├── index.html                    # Google Fonts (Cinzel, Marcellus, Philosopher)
│   ├── vite.config.js                # Vite build & dev server config
│   └── package.json                  # React 18 + Vite dependencies
│
├── backend/
│   ├── config/
│   │   └── config.php                # App constants, CORS & DB configuration
│   ├── api/
│   │   └── health.php                # System health check API endpoint
│   └── index.php                     # Central API entry router with CORS headers
│
├── sahu ji gajak frame folder.zip     # Original 269 frames archive preserved intact
└── README.md
```

---

## 👑 Design Palette

- **Deep Maroon**: `#3B0909`
- **Dark Burgundy**: `#4A0808`
- **Royal Gold**: `#D4A33D`
- **Bright Gold**: `#F5C65B`
- **Cream / Muted Gold**: `#FFF0D0`
- **Notification Ruby Red**: `#D32F2F`

---

## 🚀 Running the Project

### 1. Frontend (React + Vite)

Prerequisites: Node.js (v18+)

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Start the Vite development server
npm run dev
```

The application will be live at: `http://localhost:5173`

To create a production build:
```bash
npm run build
```

### 2. Backend (Core PHP)

Prerequisites: PHP 8.x (e.g. XAMPP PHP or standalone PHP)

Start PHP built-in web server:
```bash
# Navigate to backend directory
cd backend

# Start PHP built-in server on port 8000
php -S localhost:8000
```
Or run directly with XAMPP:
```bash
C:\xampp\php\php.exe -S localhost:8000 -t backend
```

Test the API endpoints:
- `http://localhost:8000/` &rarr; API Information
- `http://localhost:8000/api/health` &rarr; System Health Check

---

## 🎬 Scroll Animation Technical Details

- **Total Frames**: 269 sequential JPEG frames (`ezgif-frame-001.jpg` to `ezgif-frame-269.jpg`).
- **Resolution**: 1920 × 1080 (16:9 aspect ratio).
- **Renderer**: HTML5 Canvas with `devicePixelRatio`-aware scaling and cover cropping.
- **Preloading**: Instant priority loading of Frame 1 followed by an 8-worker concurrent background queue with progress HUD.
- **Scroll Mapping**: 480vh scroll container mapped smoothly with `requestAnimationFrame` interpolation.
- **Directional Responsiveness**: Scrolling down advances the two royal elephants inward; scrolling up reverses the movement smoothly.
- **Grand Reveal**: At frames 220–269 (scroll progress &ge; 88%), the final royal seal and branding illuminate between the elephants.

---

## 🛡️ Milestone 1 Verification Checklist

- [x] React + Vite project initialized cleanly.
- [x] All 269 animation frames extracted and verified in `frontend/public/frames/`.
- [x] PHP backend structure with router and health check endpoint configured.
- [x] Royal Navbar crafted matching reference screenshot (ornate corners, crown badge, medallions, red notification badges).
- [x] HTML5 Canvas scroll animation with reverse-scroll capability and cover scaling.
- [x] Responsive layout with hamburger menu for mobile/tablet screens.

