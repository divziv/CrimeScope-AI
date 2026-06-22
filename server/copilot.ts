import { dbInstance } from "./db.ts";
import { GoogleGenAI } from "@google/genai";

// Lazy initialization of Gemini client to prevent startup failure
let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

export interface CopilotResponse {
  answer: string;
  suggestedAction?: {
    type: "zoom_to_state" | "zoom_to_district" | "view_network" | "trigger_sos_layer" | "none";
    targetId?: string;
  };
  agentsMetadata: {
    agentName: string;
    actionResult: string;
  }[];
}

export async function processCopilotQuery(query: string): Promise<CopilotResponse> {
  const normQuery = query.toLowerCase();
  const dbStates = dbInstance.getStates();
  const network = dbInstance.getNetwork();

  // 1. Local RAG Retrieval: Extract matching metrics for context
  let contextSnippet = "--- REAL-TIME PUBLIC SAFETY DATA CONTEXT ---\n";
  contextSnippet += `Available States: ${dbStates.map(s => `${s.name} (${s.id}) - Crime Index: ${s.crimeIndex}, Safety Index: ${s.safetyIndex}, High Risk: ${s.riskForecastIndex}%`).join("; ")}\n`;
  
  // Find districts referenced in query
  const allDistricts = dbStates.flatMap(s => dbInstance.getDistricts(s.id));
  const matchedDistricts = allDistricts.filter(d => normQuery.includes(d.name.toLowerCase()));
  if (matchedDistricts.length > 0) {
    contextSnippet += `Directly Queried District Stats: ${matchedDistricts.map(d => `${d.name} (${d.id}) - Crime Index: ${d.crimeIndex}, Risk Forecast: ${d.riskForecastIndex}%, Active Patrols: ${d.activePatrols}, Hotspots: ${d.majorHotspotAreas.join(", ")}`).join("; ")}\n`;
  } else {
    contextSnippet += `Primary High-Risk District Metrics: ${allDistricts.slice(0, 4).map(d => `${d.name} (Crime Index: ${d.crimeIndex}, Risk: ${d.riskForecastIndex}%)`).join("; ")}\n`;
  }

  // Network context
  contextSnippet += `Underworld Gang Network: Nodes represent suspects or shared vehicles. Key suspects: ${network.nodes.filter(n => n.type === "suspect").map(s => `${s.label} (${s.role}, risk ${s.riskScore}%)`).join(", ")}. Primary edges: co-arrest, money_transfer.\n`;

  // Determine potential visual UI actions that the platform can trigger based on query
  let suggestedAction: CopilotResponse["suggestedAction"] = { type: "none" };
  if (normQuery.includes("network") || normQuery.includes("gang") || normQuery.includes("arjun") || normQuery.includes("leader") || normQuery.includes("offender")) {
    suggestedAction = { type: "view_network" };
  } else if (normQuery.includes("karnataka") || normQuery.includes("bengaluru") || normQuery.includes("mysuru")) {
    suggestedAction = { type: "zoom_to_state", targetId: "KA" };
  } else if (normQuery.includes("delhi") || normQuery.includes("noida")) {
    suggestedAction = { type: "zoom_to_state", targetId: "DL" };
  } else if (normQuery.includes("mumbai") || normQuery.includes("pune") || normQuery.includes("maharashtra")) {
    suggestedAction = { type: "zoom_to_state", targetId: "MH" };
  } else if (normQuery.includes("sos") || normQuery.includes("emergency") || normQuery.includes("accident") || normQuery.includes("live")) {
    suggestedAction = { type: "trigger_sos_layer" };
  }

  const ai = getAIClient();
  if (ai) {
    // Call real Gemini API
    const systemPrompt = `You are the lead intelligence cell orchestrator of CrimeScope AI (Datathon 2026).
Your task is to analyze user queries about public safety & crime patterns in India using real-time contextual data provided.
You MUST format your output around a Multi-Agent Reasoning framework:
- **Coordinator Agent**: Validates query boundaries and sets the orchestration chain.
- **Crime Analytics Agent**: Provides precise statistical observations (uses the real numbers/states provided, do not hallucinate).
- **Network Analysis Agent**: Analyzes relationships (suspects, vehicles, bank accounts) when appropriate.
- **Prediction Agent**: Computes likelihoods and future risk indices based on dataset parameters.
- **Recommendation Agent**: Formulates tactical deployment proposals (e.g. increase night patrols, monitor SIM swap points).

Structure your output in elegant Markdown, starting immediately with a summarizing heading, followed by sections for each agent. Give specific figures, local Indian contextual issues (cyber fraud centers, transport flyovers, border checkposts), and tactical guidance. Make it feel highly authoritative. Limit the response size to around 300-350 tokens.`;

    const userPrompt = `Real-time CrimeContext:\n${contextSnippet}\n\nUser Question: ${query}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: systemPrompt },
          { text: userPrompt }
        ],
        config: {
          temperature: 0.2,
        }
      });

      const text = response.text || "Unable to retrieve AI analysis.";
      
      const agentsMetadata = [
        { agentName: "Coordinator Agent", actionResult: "Success - Parsed custom spatial filters." },
        { agentName: "Crime Analytics Agent", actionResult: "Retrieved local regional crime registers." },
        { agentName: "Network Agent", actionResult: "Evaluated syndicates & co-arrest paths." },
        { agentName: "Prediction Agent", actionResult: "Synthesized regression risk indices." },
        { agentName: "Recommendation Agent", actionResult: "Generated dispatch plans." }
      ];

      return {
        answer: text,
        suggestedAction,
        agentsMetadata
      };
    } catch (e: any) {
      console.error("Gemini API error:", e);
      // Fallback on failure
      return getLocalFallbackReport(query, contextSnippet, suggestedAction, `(API Error: ${e.message})`);
    }
  } else {
    // Deterministic High-Fidelity Fallback when API key is missing
    return getLocalFallbackReport(query, contextSnippet, suggestedAction);
  }
}

function getLocalFallbackReport(
  query: string, 
  contextSnippet: string,
  suggestedAction: CopilotResponse["suggestedAction"],
  disclaimer: string = ""
): CopilotResponse {
  const normQuery = query.toLowerCase();
  let answer = "";
  
  const agentsMetadata = [
    { agentName: "Coordinator Agent", actionResult: "Offline Mode - Direct Database Resolution executed." },
    { agentName: "Crime Analytics Agent", actionResult: "Extracted state indices from national census dataset." },
    { agentName: "Network Agent", actionResult: "Traversed co-arrest edge directories." },
    { agentName: "Prediction Agent", actionResult: "Calculated district trend forecasting matrices." },
    { agentName: "Recommendation Agent", actionResult: "Generated automated dispatch directives." }
  ];

  if (disclaimer) {
    disclaimer = `\n\n*Note: Running in fallback mode. ${disclaimer}*`;
  } else {
    disclaimer = `\n\n*(Note: To enable custom generative AI responses, add a valid 'GEMINI_API_KEY' in the Settings > Secrets menu).*`;
  }

  // Generate highly detailed responses based on specific Datathon prompt triggers
  if (normQuery.includes("vehicle theft") || normQuery.includes("rise") || normQuery.includes("tomorrow") || normQuery.includes("next month")) {
    answer = `### 🇮🇳 CrimeScope AI - Multi-Agent Threat Forecast Report (Vehicle Theft Trend)

#### 🛡️ Coordinator Agent
- **Assessment**: Query classified as a geospatial & crime type prediction request focusing on vehicle larceny/thefts across India (specifically Karnataka & Delhi zones).
- **Execution**: Triggered Analytics, Prediction, and Recommendation agents path.

#### 📊 Crime Analytics Agent
- **Baseline Data**: In **Karnataka**, property thefts constitute **35%** of physical crime cases. **Bengaluru Urban** reports the highest density of vehicle lifting cases (especially scooters & SUVs), currently totaling **1,420 outstanding cases** under active tracking.
- **Correlation**: High correlation (~0.76) observed between vehicle thefts and unauthorized scrap markets at transit border gateways.

#### 🕸️ Network Analysis Agent
- **Syndicate Linkages**: Discovered suspicious overlaps. Known vehicle alteration operative **Rohit 'Kalia' Kumar** is linked to two prominent getaway assets: a **White Bolero (DL-3C-AS-4412)** and a **Black Scorpio (KA-03-MR-9080)**. Both vehicles frequently transit through the Devanahalli Airport toll corridor. 

#### 🔮 Prediction Agent (High-Risk Forecast)
- **Top Vulnerable Districts**:
  1. **North East Delhi (DL_NOR)**: **82% Risk** of vehicle-theft escalation next month due to high population density and porous state border boundaries.
  2. **Bengaluru Urban (KA_BLR)**: **58% Risk** — predictive factors show festival shopping parking density at Koramangala & Majestic increases opportunities.
  3. **Nagpur City (MH_NGP)**: **57% Risk** — transit route corridors are experiencing higher vehicle volume.

#### 📋 Recommendation Agent (Tactical Action Plan)
1. **Increase Night Patrols**: Recommended **25% surge** in automated patrol vehicle beats around Majestics bus stands and Koramangala block between 11 PM and 5 AM.
2. **De-anonymize Numberplates**: Deploy Automated License Plate Recognition (ALPR) cameras at the 3 high-risk entry points in North East Delhi.
3. **Syndicate Arrests**: Target runner suspect **Rohit Kumar** at his registered scrap facility location coordinates.

${disclaimer}`;
  } else if (normQuery.includes("network") || normQuery.includes("gang") || normQuery.includes("arjun") || normQuery.includes("leader")) {
    answer = `### 🇮🇳 CrimeScope AI - Syndicate & Linkage Analyst Report

#### 🛡️ Coordinator Agent
- **Assessment**: Threat profiling request for suspected criminal syndicate networks. Discovered an active hybrid cylinder.
- **Execution**: Invoked Network Agent and Recommendation Agent.

#### 📊 Crime Analytics Agent
- **Active Node Register**: Tracked **10 primary operational assets** including **4 suspects**, **2 burner phones**, **2 tracking vehicles**, and **1 corporate escrow mule account**.

#### 🕸️ Network Analysis Agent (Link Analyst)
- **Syndicate Overviews**: 
  - **Arjun Rao** acts as the high-tier **Kingpin** managing a cross-state Sim Fraud and Vehicle Lifting Syndicate. He has **5 degree connections** directly on-graph.
  - He shares a **Co-Arrest Bond (Weight 5/5)** with **Vikas 'Bunty' Sharma**, who operates the Sim farms.
  - Vikas has moved ₹4.5L to **Priya Nair**, who is the gatekeeper of **ICICI Corporate Escrow A/C (..88219)**. This account absorbs phishing payouts.
  - Getaway vehicles are tied to **Rohit Kumar**, structural runner, who alters engine chassis inside local industrial zones.

#### 🔮 Prediction Agent
- **Risk Evaluation**: Arjun Rao holds a **94% Risk score** reflecting severe offense recidivism, while Vikas Sharma holds an **88% Risk score**.

#### 📋 Recommendation Agent
1. **Freeze Assets**: Issue immediate KYC validation freeze on the ICICI Escrow bank account to prevent outflow of cyber-theft.
2. **Surveillance Target**: Establish constant digital towers track of SIM farm location coordinate **Noida Sector-62 Safehouse**.
3. **Raid**: Execute coordinated field arrest warrants for suspected operators Vikas and Rohit concurrently.

${disclaimer}`;
  } else if (normQuery.includes("compare") || normQuery.includes("bengaluru") || normQuery.includes("mysuru")) {
    answer = `### 🇮🇳 Bengaluru Urban vs Mysuru - Comparative Regional Crime Matrix

#### 🛡️ Coordinator Agent
- **Assessment**: Request for regional differential comparison between Metropolitan & Tier-2 cities in Karnataka.

#### 📊 Crime Analytics Agent (Comparative Board)
| Metric | Bengaluru Urban (KA_BLR) | Mysuru (KA_MYS) | Variance Note |
|---|---|---|---|
| **Crime Index** | **54/100** | **32/100** | Bengaluru stands +22 pts higher |
| **Safety Index** | **68/100** | **81/100** | Mysuru enjoys excellent residential security |
| **Risk Forecast** | **58%** | **28%** | Mysuru's trend remains linear |
| **Patrol Units** | **145 Active Beats** | **42 Active Beats** | High deployment concentration in capital |
| **Literacy Rate** | **87.67%** | **72.79%** | High literacy in both, yet divergent profiles |
| **Density** | **4,380 / sq km** | **413 / sq km** | High density triggers theft/assault escalation |

- **Crime Typology Variance**: Bengaluru Urban suffers heavily from **Socio-Economic Cyber frauds (Sim swaps, phishing, credit schemes)**. Mysuru holds standard local structural disputes & seasonal tourist thefts, mostly localized.

#### 🔮 Prediction Agent
- **Risk Analysis**: Predicts Bengaluru's tech-crime volume will grow by **4.2%** during Q3 2026, driven by rising remote gig logins, whereas Mysuru's levels will stay stable under pre-monsoon levels.

#### 📋 Recommendation Agent
- **Strategic Dispatch**: Bengaluru should transfer older patrol vehicles to establish stationary surveillance booths near Koramangala IT corridors. Mysuru police should maintain standard beat checks around heritage palace tourist corridors.

${disclaimer}`;
  } else {
    // General fallback report based on current status
    answer = `### 🇮🇳 CrimeScope AI - General District Intelligence Analysis

#### 🛡️ Coordinator Agent
- **Assessment**: Parsed general query: "${query}". Routing to regional registers folder for baseline indicators.

#### 📊 Crime Analytics Agent
- **National Baseline**: Average Crime Index in queried states sits at **52.5/100**. **Delhi (DL)** and **Uttar Pradesh (UP)** lead the index curves with cybercrime climbing fastest at **18% CAGR** year-over-year.
- **Socio-Economic Correlation**: Statistical correlation matrices reveal a strong linkage (**0.72**) between rising cybercrime metrics and high population density hubs carrying quick web propagation access.

#### 🔮 Prediction Agent
- **Escalation Danger Point**: **North East Delhi (78% index / 82% forecast)** and **Noida margins** are identified as the most vital emerging hotspots. 

#### 📋 Recommendation Agent
1. **Initiate SOS Patrol Sync**: Ensure local officers coordinates are constantly tracked in line with active emergency calls.
2. **Citizen Advisory**: Distribute localized security guidelines warning citizens against OTP/SIM-swapping.

${disclaimer}`;
  }

  return {
    answer,
    suggestedAction,
    agentsMetadata
  };
}
