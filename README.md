# DTD — Decode The Data (CTF Platform)
### Data Science Club 2026 Flagship Event Platform

A modern, responsive, competitive CTF-style web platform designed specifically for **Data Science & Machine Learning challenges**. Inspired by premier competitive cybersecurity CTF dashboard layouts (such as the reference IIIT Hyderabad CTF board), redesigned with an original, crisp, clean white technical aesthetic for college Data Science clubs.

---

## 🚀 Live Demo & Getting Started

### Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🎯 Core Features & Architecture

### 1. Landing Page (`/` or Overview Tab)
- High-impact technical hero banner: **DTD — Decode The Data 2026**.
- **What is DTD?** Explains how competitive data science decoding replaces traditional cybersecurity flags.
- **4-Step Pipeline**: 1. Ingest Dataset → 2. EDA & Model Investigation → 3. Extract Decoded Token → 4. Climb Scoreboard.
- **4 Difficulty Tiers**: 🟢 Welcome (20–50 pts), 🔵 Beginner (50–150 pts), 🟡 Intermediate (150–300 pts), 🔴 Advanced (300–500+ pts).
- **Event Timeline & Live Release Schedule**: 10:00 AM Launch, 12:00 PM Midday Drop, 02:00 PM Advanced Track, 04:00 PM Scoreboard Freeze.
- Live Top 5 Team Leaderboard preview with quick action buttons.

### 2. Team Authentication & Passcode System
- **Create Team**: Enter Team Name and set a secret **Team Password / Passcode**.
- **Join Team**: Select registered team or type name, verify with the team passcode to join teammates.
- **Solo Entry**: Compete as an individual participant.
- **1-Click Demo Profiles**: Instantly switch between test users (e.g. *Sai Krishna [NeuralCoders]*, *Sneha Rao [GradientDescenders]*, *Harsha [MatrixMultipliers]*).

### 3. Participant Dashboard & CTF Arena (Inspired by Reference Images)
- **Status Bar**: Participant Name, Team Affiliation, Total Score, Rank, Solved Progress Bar (e.g., `8 / 12 Challenges Solved`), and a Live Countdown Timer.
- **CTF Categories Grid**:
  1. `welcome` — 🟢 Welcome Track (Instagram verification, CSV starter)
  2. `analysis` — 📊 Data Analysis & Statistics (Outlier IQR, Correlation traps, Simpson's Paradox)
  3. `cleaning` — 🧹 Data Cleaning & Preprocessing (Ghost duplicates, Median imputation)
  4. `ml` — 🤖 Machine Learning & Modeling (Metric mirage recall, XGBoost gain, Overfitting early stop)
  5. `investigation` — 🔍 Data Forensics & Hidden Signals (SHA-256 reverse lookup, Residual steganography)
  6. `deeplearning` — 🧠 Deep Learning & AI Reasoning (Word2Vec latent space, Transformer attention weights)
- **Challenge Cards**:
  - Unsolved: Clean white card with difficulty pill, points badge, and solve counter.
  - Solved: **Turns solid vibrant green (`bg-emerald-600`) with checkmark**, matching the CTF reference screenshot solve box!
  - Locked: Displays 🔒 **Coming Soon** with scheduled release time.

### 4. Interactive Challenge Modal (Matching Image 1, 2 & 4)
- Tabs: **Challenge** and **Solves (N)**.
- Challenge Title, Points, Like/Dislike ratings, and Author signature.
- **Welcome Challenge 1**: Connects to the **Data Science Club Instagram Page** (`@datascienceclub_2026`) with simulated post preview and token extraction (`DTD{welcome_to_ds_club_2026}`).
- **Dataset Download**: One-click download of CSV, JSON, and text datasets.
- **Interactive Data Inspector**: Inspect dataset tables directly inside the browser modal.
- **Hint System**: Expandable hints with penalty point deduction warnings.
- **Answer Submission**: Clean input box for **Decoded Key** (`DTD{...}`) with instant evaluation, confetti celebration, and real-time score updates.

### 5. Dual Leaderboard / Scoreboard
- **Team Scoreboard**: Aggregates team scores while deduplicating multi-member solves.
- **Individual Scoreboard**: Tracks individual participant performance.
- **Podium Display**: Gold 🥇, Silver 🥈, and Bronze 🥉 cards for the Top 3.
- Highlights the currently logged-in user or team.

### 6. Teams Directory
- View all squads, colleges, rosters, total points, and solves.
- Join a team by entering their team access password.

### 7. Real-time Submissions Stream
- Transparent live log of all solve attempts (ACCEPTED / REJECTED) with timestamps and point deltas.

### 8. Admin Control Console & Live Release Scheduler
- **Live Challenge Release**: Instantly toggle challenges between Live and Locked ("Coming Soon").
- **Add New Challenge**: Custom form with title, category, points, answer key, dataset, and hints.
- **Manage Challenges**: Edit or delete challenges.
- **Reset State**: Instant reset to pristine tournament data.

---

## 💻 Tech Stack
- **React 19**
- **Vite 8**
- **Tailwind CSS v4**
- **Lucide Icons**
- **Canvas Confetti**
- **LocalStorage State Persistence**
