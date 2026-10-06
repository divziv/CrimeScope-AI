import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { dbInstance } from "./server/db.ts";
import { processCopilotQuery } from "./server/copilot.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // --- API ROUTES ---

  // Get all States and UTs with analytics
  app.get("/api/states", (req, res) => {
    try {
      const states = dbInstance.getStates();
      res.json(states);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch state data", message: error.message });
    }
  });

  // Get Districts for a specific state
  app.get("/api/districts/:stateId", (req, res) => {
    try {
      const { stateId } = req.params;
      const districts = dbInstance.getDistricts(stateId);
      res.json(districts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch districts", message: error.message });
    }
  });

  // Get Criminal Network data
  app.get("/api/network", (req, res) => {
    try {
      const network = dbInstance.getNetwork();
      res.json(network);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch criminal network datasets", message: error.message });
    }
  });

  // Get Historical Crime trends for any state or national
  app.get("/api/trends/:scopeId", (req, res) => {
    try {
      const { scopeId } = req.params;
      const trends = dbInstance.getTrends(scopeId);
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch historical trends", message: error.message });
    }
  });

  // Retrieve SOS incident logger
  app.get("/api/sos", (req, res) => {
    try {
      const sosList = dbInstance.getSOSList();
      res.json(sosList);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch SOS list", message: error.message });
    }
  });

  // Trigger New SOS incident (Real-time public safety logging)
  app.post("/api/sos", (req, res) => {
    try {
      const { callerPhone, state, district, locationDetails, lat, lng, classification, priority } = req.body;
      
      if (!callerPhone || !state || !district || !classification || !priority) {
        return res.status(400).json({ error: "Missing required SOS safety credentials." });
      }

      const newSos = dbInstance.submitSOS({
        callerPhone,
        state,
        district,
        locationDetails: locationDetails || "No additional coordinates provided",
        lat: parseFloat(lat) || 12.9716,
        lng: parseFloat(lng) || 77.5946,
        classification,
        priority
      });

      res.status(201).json({ success: true, incident: newSos });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to trigger SOS logger", message: error.message });
    }
  });

  // Update SOS status
  app.post("/api/sos/status", (req, res) => {
    try {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: "Missing incident ID or status payload." });
      }

      const updated = dbInstance.updateSOSStatus(id, status);
      if (updated) {
        res.json({ success: true, incident: updated });
      } else {
        res.status(404).json({ error: "Incident not logged." });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update status", message: error.message });
    }
  });

  // Get Field Officer real-time reports
  app.get("/api/field-reports", (req, res) => {
    try {
      const reports = dbInstance.getFieldIncidents();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch field reports", message: error.message });
    }
  });

  // Post Field Officer report
  app.post("/api/field-reports", (req, res) => {
    try {
      const { officerId, officerName, district, latitude, longitude, category, severity, description, actionTaken } = req.body;

      if (!officerId || !officerName || !district || !category || !severity || !description) {
        return res.status(400).json({ error: "Missing detailed fields for public safety ledger." });
      }

      const newReport = dbInstance.submitFieldIncident({
        officerId,
        officerName,
        district,
        latitude: parseFloat(latitude) || 12.9716,
        longitude: parseFloat(longitude) || 77.5946,
        category,
        severity,
        description,
        actionTaken: actionTaken || "Investigating / Patrolling area"
      });

      res.status(201).json({ success: true, report: newReport });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to post field report", message: error.message });
    }
  });

  // Crime Environmental Weather Intel Endpoint (supports OpenWeather or contextual fallback)
  app.get("/api/weather", async (req, res) => {
    try {
      const { lat, lng, stateId } = req.query;
      const apiKey = process.env.OPENWEATHER_API_KEY;

      const getSimulatedWeather = (sid: string) => {
        switch (sid) {
          case "KA":
            return {
              name: "Bengaluru, Karnataka",
              temp: 24.5,
              humidity: 82,
              description: "moderate rain",
              rainfall: 12.5,
              status: "Rainfall Warning (Yellow)",
              alert: "Persistent rain. Officers urged to watch low-lying areas near Majestic & Koramangala sub-drains.",
              correlation: "Monsoon showers correlate with a 15% increase in road traffic deviations and a 20% drop in active commercial burglaries."
            };
          case "KL":
            return {
              name: "Kochi, Kerala",
              temp: 26.2,
              humidity: 95,
              description: "torrential rain & thunderstorm",
              rainfall: 72.8,
              status: "Active Flood Alert (Red)",
              alert: "Critical flooding risk. Emergency disaster shelters fully operational. Standard mobile patrols held.",
              correlation: "Red flood warnings coincide with a 60% spike in emergency SOS triggers and severe traffic constraints."
            };
          case "MH":
            return {
              name: "Mumbai, Maharashtra",
              temp: 28.1,
              humidity: 88,
              description: "heavy intensity rain",
              rainfall: 44.2,
              status: "Flood Alert (Amber)",
              alert: "Moderate flooding in lower street paths. Command vans deployed near Hindmata block.",
              correlation: "Heavy monsoon rain matches a 30% drop in physical shoplifting but increases vehicular accidents."
            };
          case "DL":
            return {
              name: "New Delhi, Delhi",
              temp: 36.8,
              humidity: 42,
              description: "scattered clouds",
              rainfall: 0,
              status: "Heatwave Advisory",
              alert: "High temperature warning. Heat stress risks active. Shift officers should carry hydration packs.",
              correlation: "Extreme heatwaves are mapped to a 10% rise in public brawls and domestic altercation dispatch logs."
            };
          case "TN":
            return {
              name: "Chennai, Tamil Nadu",
              temp: 31.5,
              humidity: 78,
              description: "light rain",
              rainfall: 2.1,
              status: "Normal Weather Status",
              alert: "No active hazard alerts. General temperature safety guidelines remain active.",
              correlation: "Clear, warm evenings support responsive outdoor patrolling grids and reduce localized property thefts."
            };
          case "UP":
            return {
              name: "Lucknow, Uttar Pradesh",
              temp: 33.4,
              humidity: 60,
              description: "broken clouds",
              rainfall: 1.5,
              status: "Clear/Windy Status",
              alert: "High winds reported near transport blocks. Secure open patrolling stations.",
              correlation: "Breezy conditions show steady, baseline physical crime incidents with high CCTV visibility."
            };
          case "TG":
            return {
              name: "Hyderabad, Telangana",
              temp: 29.8,
              humidity: 65,
              description: "overcast clouds",
              rainfall: 3.5,
              status: "Drizzle Pre-Warning",
              alert: "Mild storm warning on external highways. Command radars fully active.",
              correlation: "Overcast status matches steady cyber fraud registrations and stable vehicle theft benchmarks."
            };
          case "RJ":
            return {
              name: "Jaipur, Rajasthan",
              temp: 38.5,
              humidity: 28,
              description: "clear sky",
              rainfall: 0,
              status: "Severe Heat Hazard",
              alert: "Intense thermal index. Field patrols scheduled for early morning and evening blocks.",
              correlation: "High heat stress restricts suspect movement, significantly lowering physical snatchings."
            };
          default:
            return {
              name: "National Average",
              temp: 28.5,
              humidity: 70,
              description: "partly cloudy",
              rainfall: 5.0,
              status: "Stable Status",
              alert: "No extreme localized climate warnings registered.",
              correlation: "Slight regional rainfall aligns with a minor increase in road traffic safety alerts."
            };
        }
      };

      if (apiKey) {
        const targetLat = lat || "12.9716";
        const targetLng = lng || "77.5946";
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${targetLat}&lon=${targetLng}&appid=${apiKey}&units=metric`;

        const response = await fetch(weatherUrl);
        if (response.ok) {
          const data = await response.json();
          const rainObj = data.rain ? (data.rain["1h"] || data.rain["3h"] || 0) : 0;
          const description = data.weather?.[0]?.description || "clear sky";
          const temp = data.main?.temp || 25;
          const humidity = data.main?.humidity || 50;

          let status = "Stable Status";
          let alert = "No immediate physical hazard warning.";
          let correlation = "Clear climate assists steady CCTV surveillance operations.";

          if (rainObj > 50 || description.includes("heavy") || description.includes("extreme") || description.includes("flood")) {
            status = "Active Flood Alert (Red)";
            alert = "Severe local rainfall detected! Coordinate grids indicate overflow risks. Station patrollers are of high alert.";
            correlation = "Extreme rainfall is correlated with a 40% surge in emergency SOS alerts and 15% physical burglary drop.";
          } else if (rainObj > 10 || description.includes("rain") || description.includes("shower")) {
            status = "Rainfall Warning (Yellow)";
            alert = "Moderate showers reported. Avoid pooling avenues and low subway channels.";
            correlation = "Persistent rain matches a 20% spike in traffic accidents and stable cybercrime indices.";
          } else if (temp > 35) {
            status = "Heatwave Advisory";
            alert = "Extreme outdoor temperature. Shift rotation shortened to avoid stress.";
            correlation = "Intense heat is mapped to a 10% rise in physical altercation indices and a decline in street suspect activity.";
          }

          return res.json({
            name: data.name || "Precision GIS Lock",
            temp,
            humidity,
            description,
            rainfall: rainObj,
            status,
            alert,
            correlation
          });
        }
      }

      // Default to dynamic simulated fallback based on stateId
      const stateInput = (stateId as string) || "KA";
      return res.json(getSimulatedWeather(stateInput));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to connect to weather feed pipeline", message: error.message });
    }
  });

  // Get all districts across all states (for National JSON export)
  app.get("/api/districts", (req, res) => {
    try {
      const districts = dbInstance.getAllDistricts();
      res.json(districts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch all district registers", message: error.message });
    }
  });

  // Crime AI Copilot Endpoint - invokes processCopilotQuery (utilizes GoogleGenAI)
  app.post("/api/copilot", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || query.trim() === "") {
        return res.status(400).json({ error: "A clear query prompt is required to execute intelligence analysis." });
      }

      const result = await processCopilotQuery(query);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "AI reasoning failure", message: error.message });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC FILES ---

  if (process.env.NODE_ENV !== "production") {
    // Mount Vite development server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static compiled assets in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CrimeScope AI Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
