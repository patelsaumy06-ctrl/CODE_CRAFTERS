# 🚨 DisasterLens AI – AI-Powered Emergency Intelligence Platform

> **Hackathon Submission Project** | *Real-Time Multi-Source Disaster Telemetry, Event Clustering & Emergency Broadcast Platform*

DisasterLens AI continuously aggregates, classifies, and clusters multi-source intelligence (social media streams, IoT hydrological sensors, satellite SAR frames, and seismic APIs) to verify critical disaster events in real-time, empowering response agencies with actionable, ground-truth data in under 30 seconds.

---

## 🌟 Key Features & Highlights

### 1. 🛡️ Command Center (`/admin`)
- **Tactical GIS Threat Map**: Real-time interactive map with visual severity markers (Critical, High Warning, Verified/Resolved).
- **Executive AI Situation Summaries**: Real-time natural language summaries generated across multi-modal data clusters.
- **KPI Metrics**: Telemetry throughput rate, active incident clusters, verified events, and confidence metrics.

### 2. 🔍 Live Incident Investigation (`/admin/incident`)
- **Multi-Modal Evidence Viewer**: Inspect drone video streams, thermal satellite SAR imagery, and hydrological gauge readings.
- **AI Risk Assessment**: Breakdown of hydrological risk, structural infrastructure risk, and source consensus scores.
- **Actionable Response Protocols**: Recommended tactical actions for first responders.

### 3. 📊 Analytics & Tactical Reports (`/admin/analytics`)
- **Performance Metrics**: Average AI verification time (24.2s), total incident volume, and false alarm filter rates (94.6%).
- **Visual Trends**: Incident volume timelines and disaster category breakdowns.
- **PDF Report Generation**: Instant trigger for official agency reporting.

### 4. 📢 Emergency Broadcast Dispatcher (`/admin/notifications`)
- **Emergency Payload Builder**: Formulate emergency notices by title, severity, and target recipients (cell towers, hazmat units, NGOs).
- **Active Dispatch Logs**: Monitor broadcasting statuses in real-time.

### 5. 📡 Real-Time Intelligence Feed (`/admin/intelligence-feed`)
- Ingestion stream of social posts, IoT sensor readings, and citizen reports tagged with AI sentiment and confidence levels.

### 6. 🔎 Search Intelligence Database (`/admin/search`)
- Natural language query interface for searching 1.2M+ historical disaster data points.

### 7. ⚙️ Admin Control Center (`/admin/control-center`)
- User role management, API connector health & latency monitoring, and immutable security audit logs.

### 8. 💡 How It Works (`/how-it-works`) & Support (`/support`)
- Public operational architecture pipeline explainability and 24/7 agency support portal.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7
- **Styling**: Tailwind CSS v3, Vanilla CSS, Material Symbols Outlined, Google Fonts (Inter, Work Sans, JetBrains Mono)
- **Backend / Auth**: Firebase Auth & Firestore (with automatic offline fallback mode)
- **Build System**: Vite 8

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/patelsaumy06-ctrl/CODE_CRAFTERS.git
cd CODE_CRAFTERS
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
VITE_FIREBASE_API_KEY=AIzaSyDummyKeyReplaceWithYourActualKey
VITE_FIREBASE_AUTH_DOMAIN=code-crafters.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=code-crafters
VITE_FIREBASE_STORAGE_BUCKET=code-crafters.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:1234567890
```
> *Note: If Firebase credentials are missing, DisasterLens AI automatically runs in mock mode so judges can evaluate all features without setup barriers.*

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎯 Demo Credentials for Hackathon Judges

Judges can log in using any credentials, or click the **Avatar Menu** in the top-right header to switch roles instantly:

| Role | Access Level |
| :--- | :--- |
| **Commander / Admin** | Full access to all 9 modules, settings & dispatch controls |
| **First Responder** | Access to Command Center, Live Incidents & Intelligence Feed |
| **Public / Citizen** | Public Landing Page, Architecture Overview & Support |

---

## 📄 License
Classified & Developed for Hackathon Submission. All Rights Reserved.
