# 🇮🇳 CrimeScope AI: AI-Driven Crime Analytics & Public Safety Platform
### *From raw police records to actionable intelligence in seconds.*

---

## 📌 Executive Summary

Modern police organizations globally often face highly fragmented networks of First Information Reports (FIRs), vehicle registration coordinates, cellular burner records, and outstanding case lists. **CrimeScope AI** transforms this unstructured data into real-time geospatial, predictive, and tactical public safety assets. 

Rather than presenting standard historical tables, CrimeScope AI utilizes:
- **India National GIS Command Map**: Zoom capability from National → State → District level with overlays for active patrol stations, hospitals, and heat maps.
- **Micro-Network Linkage Traversal**: Traverses burner phone forwarding numbers, shared co-arrest assets, and corporate escrow accounts to reveal organized crime syndicates automatically.
- **Multi-Agent AI reasoning Copilot**: Coordinate analytics workflows to predict upcoming monthly vehicle thefts and list proactive emergency patrols. Powered by the modern `@google/genai` Gemini SDK.
- **Urgent Emergency SOS & Officer Dispatch Logging**: Instant physical and medical ETAs calculated dynamically via server coordinates and updated synchronously in all views.

---

## 🗂️ Logical Directory Structure

The repository is organized following full-stack modular guidelines:

```text
/
├── .env.example            # Sample configuration file specifying secure key variables
├── package.json            # Base scripts (tsx, esbuild, vite) and full-stack dependencies
├── metadata.json           # Platform level brand permissions
├── index.html              # Custom browser title and main client entry point
├── server.ts               # Core full-stack Express server + Viteware middleware
├── server/
│   ├── db.ts               # In-Memory India Regional database (states, districts, networks)
│   └── copilot.ts          # CoT multi-agent reasoning using @google/genai (RAG system)
└── src/
    ├── main.tsx            # React bootstrap entry point
    ├── App.tsx             # Responsive dashboard layout with SVG maps & Recharts panels
    ├── index.css           # Global typography setup (Inter, Space Grotesk, JetBrains Mono)
    └── types.ts            # Shareable client types coordinating with Express API payloads
```

---

## 🛠️ Full-Stack Backend Routing

CrimeScope AI utilizes a dedicated backend folder (`/server`) to maintain proper server-to-client separation of concerns and safely isolate the Gemini API key. All endpoints return genuine, CORS-compliant structures:

### **1. Regional Statistics API**
- `GET /api/states`: Returns all 28 states with census crime indexes, safety percentages, and coordinates.
- `GET /api/districts/:stateId`: District details drill-down with major active hotspots list and patrol cells counts.
- `GET /api/trends/:scopeId`: Monthly historical datasets (Thefts, Cyber, Fraud, Assault) for charts.

### **2. Criminal Syndicate Mapping API**
- `GET /api/network`: Traverses active syndicate nodes (suspects, cars, burners) and edge weight connections.

### **3. Emergency Support API**
- `GET /api/sos`: Live active SOS logs.
- `POST /api/sos`: Logs a new emergency (Women Safety, Trauma Accident). Computes real distance metric and nearest station ETAs in real time.
- `GET /api/field-reports`: Field officer ledgers database.
- `POST /api/field-reports`: Adds fresh patrolling notes.

### **4. AI Copilot reasoning API**
- `POST /api/copilot`: Receives natural language queries, performs local RAG parsing on local records, and passes to the `@google/genai` Gemini SDK. Formulates answers using the five core agents: Coordinator, Analytics, Network, Prediction, and Recommendation.

---

## 🚀 Step-by-Step Developer Setup

Follow these commands to deploy the application structure locally:

### **Step 1: Environment Configuration**
Copy the template variables file:
```bash
cp .env.example .env
```
Open `.env` and add a valid Gemini secret key to enable real-time text synthesizers:
```env
GEMINI_API_KEY="AIzaSy..."
```

### **Step 2: Install Base Packages**
Populate node modules:
```bash
npm install
```

### **Step 3: Run Development Server**
Launch the Express application alongside the active Vite asset bundler:
```bash
npm run dev
```
Open **`http://localhost:3000`** in browser.

### **Step 4: Build for Production**
Compiles both clean React static assets and bundles the Express background TS file into standard CommonJS format:
```bash
npm run build
```
Launch compiled bundles:
```bash
npm run start
```

---

## 🛡️ Multi-Agent Design Architecture

1. **Coordinator Agent**: Decodes questions, targets geographical bounds, and routes tasks to corresponding experts.
2. **Crime Analytics Agent**: Evaluates regional indices from the real-time databases and identifies baseline correlations.
3. **Network Agent**: Analyzes high-risk links (Weight 5/5) to trace money transactions or burner contacts.
4. **Prediction Agent**: Computes the escalated risk percentage of upcoming vehicle thefts or property breaches.
5. **Recommendation Agent**: Formulates clear, actionable dispatch plans (e.g., increase patrol frequency, activate license plate cameras).
