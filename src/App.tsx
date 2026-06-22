import { useState, useEffect, useRef, FormEvent } from "react";
import {
  Shield,
  Activity,
  MapPin,
  Users,
  TrendingUp,
  MessageSquare,
  AlertOctagon,
  Bell,
  Search,
  CheckCircle,
  Clock,
  Phone,
  ArrowRight,
  RefreshCw,
  Plus,
  Compass,
  FileText,
  User,
  Map,
  Sparkles,
  Database,
  CloudRain,
  Thermometer,
  Droplets,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  BarChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import {
  StateCrimeData,
  DistrictCrimeData,
  NetworkNode,
  NetworkEdge,
  SOSIncident,
  FieldOfficerIncident,
  MonthTrend,
  CopilotResponse
} from "./types.ts";

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "gis" | "network" | "trends" | "copilot" | "field"
  >("overview");

  // Server state data
  const [states, setStates] = useState<StateCrimeData[]>([]);
  const [selectedState, setSelectedState] = useState<StateCrimeData | null>(null);
  const [districts, setDistricts] = useState<DistrictCrimeData[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictCrimeData | null>(null);
  const [network, setNetwork] = useState<{ nodes: NetworkNode[]; edges: NetworkEdge[] }>({
    nodes: [],
    edges: []
  });
  const [trends, setTrends] = useState<MonthTrend[]>([]);
  const [sosList, setSosList] = useState<SOSIncident[]>([]);
  const [fieldReports, setFieldReports] = useState<FieldOfficerIncident[]>([]);
  
  // UI toggles & filters
  const [loading, setLoading] = useState(true);
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [trendScope, setTrendScope] = useState<string>("national");
  const [gisLayer, setGisLayer] = useState<"risk" | "sos" | "police" | "hospitals" | "fire_stations" | "disaster_shelters">("risk");
  const [apiError, setApiError] = useState<string | null>(null);

  // Environmental weather feed state
  const [weather, setWeather] = useState<{
    name: string;
    temp: number;
    humidity: number;
    description: string;
    rainfall: number;
    status: string;
    alert: string;
    correlation: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherScope, setWeatherScope] = useState<string>("KA");

  // GIS Tooltip state
  const [gisTooltip, setGisTooltip] = useState<{
    name: string;
    type: string;
    riskScore: number;
    primaryCrime: string;
    x: number;
    y: number;
  } | null>(null);

  // SOS Form state
  const [sosPhone, setSosPhone] = useState("");
  const [sosState, setSosState] = useState("KA");
  const [sosDistrict, setSosDistrict] = useState("Bengaluru Urban");
  const [sosLocation, setSosLocation] = useState("");
  const [sosClass, setSosClass] = useState<SOSIncident["classification"]>("Women Safety");
  const [sosPriority, setSosPriority] = useState<SOSIncident["priority"]>("Critical");
  const [sosSuccess, setSosSuccess] = useState<SOSIncident | null>(null);

  // Field Report Form state
  const [fOfficerId, setFOfficerId] = useState("FLD_9912");
  const [fOfficerName, setFOfficerName] = useState("Inspector Divya Kumar");
  const [fDistrict, setFDistrict] = useState("Bengaluru Urban");
  const [fCategory, setFCategory] = useState("Suspicious Sim Sells Spotted");
  const [fSeverity, setFSeverity] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [fDesc, setFDesc] = useState("");
  const [fAction, setFAction] = useState("");
  const [fieldSuccess, setFieldSuccess] = useState(false);

  // Copilot assistant state
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotHistory, setCopilotHistory] = useState<{
    sender: "user" | "ai";
    text: string;
    action?: CopilotResponse["suggestedAction"];
    agents?: CopilotResponse["agentsMetadata"];
  }[]>([
    {
      sender: "ai",
      text: "Welcome to CrimeScope AI Copilot. State your operational query. You can ask: 'Show districts where vehicle theft is likely to rise next month', Or 'Analyze the criminal network tied to Arjun Rao'.",
    }
  ]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load baseline statistics from full Express API
  const fetchBaselineData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      
      const statesRes = await fetch("/api/states");
      if (!statesRes.ok) throw new Error("Could not fetch states registry");
      const statesData: StateCrimeData[] = await statesRes.ok ? await statesRes.json() : [];
      setStates(statesData);

      const networkRes = await fetch("/api/network");
      if (networkRes.ok) {
        const netData = await networkRes.json();
        setNetwork(netData);
      }

      const sosRes = await fetch("/api/sos");
      if (sosRes.ok) {
        const sosData = await sosRes.json();
        setSosList(sosData);
      }

      const fieldRes = await fetch("/api/field-reports");
      if (fieldRes.ok) {
        const fieldData = await fieldRes.json();
        setFieldReports(fieldData);
      }

      // Pre-fetch national trends
      const trendRes = await fetch("/api/trends/national");
      if (trendRes.ok) {
        const trendData = await trendRes.json();
        setTrends(trendData);
      }

      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to establish socket pipeline connection with backend.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselineData();
  }, []);

  // Fetch districts when state is updated
  useEffect(() => {
    if (selectedState) {
      fetch(`/api/districts/${selectedState.id}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setDistricts(data);
          setSelectedDistrict(data[0] || null);
        })
        .catch(() => setApiError("Could not retrieve districts index."));
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedState]);

  // Handle trend scope filter changes
  useEffect(() => {
    fetch(`/api/trends/${trendScope}`)
      .then((res) => res.json())
      .then((data) => setTrends(data))
      .catch(() => {});
  }, [trendScope]);

  // Scroll chat UI on new message
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [copilotHistory, copilotLoading]);

  // Sync weather scope when selectedState changes
  useEffect(() => {
    if (selectedState) {
      setWeatherScope(selectedState.id);
    }
  }, [selectedState]);

  // Fetch weather when weatherScope changes
  const fetchWeather = async (scope: string) => {
    try {
      setWeatherLoading(true);
      const res = await fetch(`/api/weather?stateId=${scope}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (err) {
      console.error("Error fetching weather status:", err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(weatherScope);
  }, [weatherScope]);

  // Generate infrastructure assets relative to state / district boundaries
  const getInfrastructureAssets = () => {
    const list: {
      id: string;
      name: string;
      type: "hospital" | "fire_station" | "disaster_shelter";
      lat: number;
      lng: number;
      status: string;
      availability: string;
    }[] = [];

    if (selectedState) {
      // Offset values relative to active districts
      districts.forEach(d => {
        list.push({
          id: `HOSP_${d.id}`,
          name: `${d.name.replace(" District", "")} Trauma Hosp`,
          type: "hospital",
          lat: d.lat + 0.08,
          lng: d.lng + 0.08,
          status: d.crimeIndex > 60 ? "High Load" : "Operational",
          availability: d.crimeIndex > 60 ? "12% Beds Available" : "84% Beds Available"
        });
        list.push({
          id: `FIRE_${d.id}`,
          name: `${d.name.replace(" District", "")} Fire Station`,
          type: "fire_station",
          lat: d.lat - 0.06,
          lng: d.lng + 0.09,
          status: "Standby / Ready",
          availability: "4 rescue engines active"
        });
        list.push({
          id: `SHEL_${d.id}`,
          name: `${d.name.replace(" District", "")} Safe Shelter`,
          type: "disaster_shelter",
          lat: d.lat + 0.05,
          lng: d.lng - 0.07,
          status: d.crimeIndex > 58 ? "Occupied" : "Standby",
          availability: d.crimeIndex > 58 ? "Capacity: 140/300" : "Capacity: 15/200"
        });
      });
    } else {
      // Offset values relative to state centers
      states.forEach(s => {
        list.push({
          id: `HOSP_${s.id}`,
          name: `${s.name} Central Hospital`,
          type: "hospital",
          lat: s.lat + 0.6,
          lng: s.lng + 0.5,
          status: s.crimeIndex > 64 ? "Busy" : "Operational",
          availability: s.crimeIndex > 64 ? "8% beds remaining" : "42% beds available"
        });
        list.push({
          id: `FIRE_${s.id}`,
          name: `${s.name} Fire Control`,
          type: "fire_station",
          lat: s.lat - 0.5,
          lng: s.lng + 0.7,
          status: s.crimeIndex > 60 ? "Critical Response" : "Operational",
          availability: s.crimeIndex > 60 ? "1 engine on standby" : "8 engines ready"
        });
        list.push({
          id: `SHEL_${s.id}`,
          name: `${s.name} Disaster Block`,
          type: "disaster_shelter",
          lat: s.lat + 0.4,
          lng: s.lng - 0.6,
          status: "Operational",
          availability: s.crimeIndex > 60 ? "Capacity: 410/500" : "Ready for dispatch"
        });
      });
    }

    return list;
  };

  // Convert states dataset or current selection into offline-ready CSV
  const exportToCSV = () => {
    let csvContent = "";
    
    // Add headers
    const headers = [
      "State Name", "ID", "Category", "Crime Index (out of 100)", "Safety Index (%)", 
      "Total Cases 2025", "Major Crime Type", "Risk Forecast Index (%)",
      "Literacy Rate (%)", "Unemployment Rate (%)", "Population Density (per sq km)", 
      "Poverty Rate (%)", "Urbanization Rate (%)", 
      "Police Stations", "Hospitals", "Fire Stations", "Disaster Shelters"
    ];
    csvContent += headers.join(",") + "\n";
    
    states.forEach(st => {
      const row = [
        `"${st.name}"`,
        `"${st.id}"`,
        `"${st.category.toUpperCase()}"`,
        st.crimeIndex,
        st.safetyIndex,
        st.totalCases2025,
        `"${st.majorCrimeType}"`,
        st.riskForecastIndex,
        st.demographics.literacyRate,
        st.demographics.unemploymentRate,
        st.demographics.populationDensity,
        st.demographics.povertyRate,
        st.demographics.urbanizationRate,
        st.emergencyStats.policeStations,
        st.emergencyStats.hospitals,
        st.emergencyStats.fireStations,
        st.emergencyStats.disasterShelters
      ];
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CrimeScope_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit SOS Call POST fetch
  const triggerSOS = async (e: FormEvent) => {
    e.preventDefault();
    if (!sosPhone || !sosLocation) {
      alert("Please pre-enter contact phone and coordinates detail.");
      return;
    }
    try {
      const resp = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerPhone: sosPhone,
          state: sosState,
          district: sosDistrict,
          locationDetails: sosLocation,
          classification: sosClass,
          priority: sosPriority
        })
      });
      if (!resp.ok) throw new Error("SOS Dispatch submission failure");
      const result = await resp.json();
      if (result.success) {
        setSosSuccess(result.incident);
        setSosPhone("");
        setSosLocation("");
        // Instantly reload active list
        const updateSos = await fetch("/api/sos");
        if (updateSos.ok) setSosList(await updateSos.json());
        
        // Auto dismiss banner
        setTimeout(() => setSosSuccess(null), 8000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to log SOS trigger.");
    }
  };

  // Submit Field Incident POST fetch
  const submitFieldReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!fDesc || !fAction) {
      alert("Please complete the description and immediate tactical action taken.");
      return;
    }
    try {
      const resp = await fetch("/api/field-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officerId: fOfficerId,
          officerName: fOfficerName,
          district: fDistrict,
          category: fCategory,
          severity: fSeverity,
          description: fDesc,
          actionTaken: fAction
        })
      });
      if (!resp.ok) throw new Error("Report logging failed.");
      const result = await resp.json();
      if (result.success) {
        setFieldSuccess(true);
        setFDesc("");
        setFAction("");
        // Reload officer ledgers
        const updateReports = await fetch("/api/field-reports");
        if (updateReports.ok) setFieldReports(await updateReports.json());

        setTimeout(() => setFieldSuccess(false), 5000);
      }
    } catch (err: any) {
      alert(err.message || "Error deploying dispatch code.");
    }
  };

  // Handle active copilot reasoning submits
  const submitCopilotQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;

    const userMsg = copilotQuery;
    setCopilotQuery("");
    setCopilotHistory(prev => [...prev, { sender: "user", text: userMsg }]);
    setCopilotLoading(true);

    try {
      const resp = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg })
      });
      
      const data: CopilotResponse = await resp.json();
      
      setCopilotHistory(prev => [
        ...prev,
        {
          sender: "ai",
          text: data.answer,
          action: data.suggestedAction,
          agents: data.agentsMetadata
        }
      ]);

      // Apply tactical UI changes recommended by the AI Agent coordinators
      if (data.suggestedAction && data.suggestedAction.type !== "none") {
        const act = data.suggestedAction;
        if (act.type === "zoom_to_state" && act.targetId) {
          const matchedSt = states.find(s => s.id === act.targetId);
          if (matchedSt) {
            setSelectedState(matchedSt);
            setActiveTab("gis");
          }
        } else if (act.type === "view_network") {
          setActiveTab("network");
        } else if (act.type === "trigger_sos_layer") {
          setActiveTab("gis");
          setGisLayer("sos");
        }
      }
    } catch (error) {
      setCopilotHistory(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Alert: Cyber Intelligence pipeline timed out. Please check server connections and retry."
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Quick prompt triggers
  const sendQuickPrompt = (p: string) => {
    setCopilotQuery(p);
  };

  // State Risk color scoring helpers
  const getRiskColor = (idx: number) => {
    if (idx >= 65) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (idx >= 45) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  // National Crime Command Map SVG state representation
  // Render stylized SVG path block points for the key Indian regions
  const renderInteractiveMap = () => {
    // If state selected, drill-down to show its districts
    if (selectedState) {
      return (
        <div className="relative h-[380px] bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col justify-between p-5 overflow-hidden transition-all duration-300 hover:border-slate-700/60 shadow-xl">
          <div className="absolute top-4 left-4 z-10 font-mono">
            <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase bg-[#020617] px-2.5 py-1 border border-slate-800 rounded-lg">
              Drill-Down Zone Map ({selectedState.name})
            </span>
            <h3 className="text-base font-display font-semibold text-white mt-2 border-b border-dashed border-slate-800 pb-1">
              {selectedState.name} District Coordinates Index
            </h3>
          </div>

          <button
            onClick={() => {
              setSelectedState(null);
              setSelectedDistrict(null);
            }}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-all"
          >
            ← Back to India
          </button>

          {/* SVG district plotting layout */}
          <div className="flex-1 flex items-center justify-center relative mt-12 bg-radial from-slate-900 via-slate-950 to-indigo-950/20">
            <svg viewBox="0 0 500 300" className="w-[85%] h-full max-h-[300px]">
              {/* Grid backdrop */}
              <defs>
                <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#smallGrid)" />

              {/* District visual pins */}
              {districts.map((d, index) => {
                // Scaled plotting offset based on local Indian coordinate deltas
                const x = 50 + ((d.lng - 70) * 18);
                const y = 250 - ((d.lat - 8) * 12);
                const isSelected = selectedDistrict?.id === d.id;

                return (
                  <g
                    key={d.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedDistrict(d)}
                    onMouseEnter={(e) => {
                      setGisTooltip({
                        name: d.name,
                        type: "District Cell",
                        riskScore: d.crimeIndex,
                        primaryCrime: `Primary Threat: ${selectedState ? selectedState.majorCrimeType : "Local Infractions"}\nActive Patrollers: ${d.activePatrols} Units on patrol\nTotal SOS Alerts: 3 registered`,
                        x: e.clientX,
                        y: e.clientY
                      });
                    }}
                    onMouseMove={(e) => {
                      setGisTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                    }}
                    onMouseLeave={() => setGisTooltip(null)}
                  >
                    {/* Ring highlight under active district */}
                    {isSelected && (
                      <circle cx={x} cy={y} r="16" className="fill-none stroke-red-500/25 stroke-dasharray animate-spin" />
                    )}

                    {/* Outer heat bubble */}
                    <circle
                      cx={x}
                      cy={y}
                      r={gisLayer === "risk" ? (d.crimeIndex / 4) : 8}
                      className={`${
                        d.crimeIndex >= 60
                          ? "fill-red-500/15 group-hover:fill-red-500/30"
                          : d.crimeIndex >= 45
                          ? "fill-amber-500/15 group-hover:fill-amber-500/30"
                          : "fill-emerald-500/15 group-hover:fill-emerald-500/30"
                      } transition-all duration-300`}
                    />

                    {/* Core pin */}
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      className={`${
                        d.crimeIndex >= 60 ? "fill-red-500" : d.crimeIndex >= 45 ? "fill-amber-500" : "fill-emerald-500"
                      }`}
                    />

                    <text
                      x={x + 10}
                      y={y + 4}
                      className={`text-[8px] font-mono tracking-tighter ${
                        isSelected ? "fill-white font-bold" : "fill-slate-400 group-hover:fill-white"
                      } drop-shadow-md select-none transition-all`}
                    >
                      {d.name}
                    </text>
                  </g>
                );
              })}

              {/* Conditional GIS Overlay layer widgets plotted geographically */}
              {gisLayer === "sos" && sosList.map((sos, idx) => {
                const sx = 100 + (idx * 55);
                const sy = 120 + (idx * 25);
                return (
                  <g
                    key={sos.id}
                    className="animate-pulse cursor-pointer"
                    onMouseEnter={(e) => {
                      setGisTooltip({
                        name: `SOS ${sos.id}`,
                        type: "🚨 Emergency Call",
                        riskScore: sos.priority === "Critical" ? 98 : 75,
                        primaryCrime: `Incident: ${sos.classification}\nCaller Status: ${sos.status.replace(/_/g, " ")}\nDispatcher Target: Available units deployed`,
                        x: e.clientX,
                        y: e.clientY
                      });
                    }}
                    onMouseMove={(e) => {
                      setGisTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                    }}
                    onMouseLeave={() => setGisTooltip(null)}
                  >
                    <circle cx={sx} cy={sy} r="8" className="fill-red-500/20" />
                    <circle cx={sx} cy={sy} r="3" className="fill-red-500" />
                    <text x={sx + 8} y={sy - 4} className="text-[7px] font-mono fill-red-400 bg-black tracking-widest uppercase">⚠️ SOS ACTIVE</text>
                  </g>
                );
              })}

              {/* Infrastructure GIS overlay layer mappings */}
              {(gisLayer === "hospitals" || gisLayer === "fire_stations" || gisLayer === "disaster_shelters") && 
                getInfrastructureAssets()
                  .filter(item => {
                    if (gisLayer === "hospitals" && item.type === "hospital") return true;
                    if (gisLayer === "fire_stations" && item.type === "fire_station") return true;
                    if (gisLayer === "disaster_shelters" && item.type === "disaster_shelter") return true;
                    return false;
                  })
                  .map(item => {
                    const x = 50 + ((item.lng - 70) * 18);
                    const y = 250 - ((item.lat - 8) * 12);
                    
                    return (
                      <g
                        key={item.id}
                        className="cursor-pointer group"
                        onMouseEnter={(e) => {
                          setGisTooltip({
                            name: item.name,
                            type: item.type === "hospital" ? "🏥 Hospital Sector" : item.type === "fire_station" ? "🚒 Rescue Station" : "🛡️ Disaster Shelter",
                            riskScore: item.type === "hospital" ? 90 : item.type === "fire_station" ? 95 : 85,
                            primaryCrime: `Status Operational: ${item.status}\nDynamic Availability: ${item.availability}\nTele-Coordinates: Lat ${item.lat.toFixed(2)}, Lng ${item.lng.toFixed(2)}`,
                            x: e.clientX,
                            y: e.clientY
                          });
                        }}
                        onMouseMove={(e) => {
                          setGisTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                        }}
                        onMouseLeave={() => setGisTooltip(null)}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r="9"
                          className={`${
                            item.type === "hospital"
                              ? "fill-red-500/10 stroke-red-500/70"
                              : item.type === "fire_station"
                              ? "fill-orange-500/10 stroke-orange-500/70"
                              : "fill-blue-500/10 stroke-blue-500/70"
                          } stroke-2 animate-pulse`}
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="3"
                          className={
                            item.type === "hospital"
                              ? "fill-red-500"
                              : item.type === "fire_station"
                              ? "fill-orange-400"
                              : "fill-blue-500"
                          }
                        />
                        <text
                          x={x + 10}
                          y={y + 3}
                          className="text-[7.5px] font-mono fill-slate-350 drop-shadow-md select-none transition-all whitespace-nowrap opacity-60 group-hover:opacity-100"
                        >
                          {item.id.split("_")[0]}
                        </text>
                      </g>
                    );
                  })
              }
            </svg>
          </div>

          <div className="flex items-center justify-between mt-2 border-t border-slate-850 pt-2 text-[10px] text-slate-400 font-mono">
            <div>📍 Map Coordinates Extent: India South-Peninsula Quadrant</div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-[0_0_8px_#ef4444]"></span> High Risk</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Warning</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block text-emerald-500"></span> Safe</span>
            </div>
          </div>
        </div>
      );
    }

    // Default National SVG Map of India (Interactive Grid)
    return (
      <div className="relative h-[380px] bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col justify-between p-5 overflow-hidden transition-all duration-300 hover:border-slate-700/60 shadow-xl">
        <div className="absolute top-4 left-4 z-10 font-mono">
          <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase bg-[#020617] px-2.5 py-1 border border-slate-800 rounded-lg">
            National GIS Command Layer 1
          </span>
          <h3 className="text-base font-display font-semibold text-white mt-2">
            India State Surveillance Grid (Surveillance Cells)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a state cell to analyze local police sectors and active dispatches.
          </p>
        </div>

        {/* National GIS interactive elements */}
        <div className="flex-1 flex items-center justify-center relative mt-16 bg-radial from-slate-905 via-slate-950 to-indigo-950/20">
          <svg viewBox="0 0 500 300" className="w-[85%] h-full max-h-[300px]">
            {/* Grid backdrop */}
            <rect width="100%" height="100%" fill="url(#smallGrid)" />

            {/* Stylised State Boundary Path nodes plotted relatively across the Indian sub-continent boundaries */}
            {states.map((s, index) => {
              // Mathematical projection from real Lat/Lng coordinates into visual layout
              // Scaling: India coordinates sit between lat 8-36, lng 68-97
              const x = 50 + ((s.lng - 60) * 10);
              const y = 310 - ((s.lat - 6) * 10.5);
              
              const isSelected = selectedState?.id === s.id;
              
              return (
                <g
                  key={s.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedState(s)}
                  onMouseEnter={(e) => {
                    setGisTooltip({
                      name: s.name,
                      type: "State Cell",
                      riskScore: s.crimeIndex,
                      primaryCrime: `Major Cyber/Physical Crime: ${s.majorCrimeType}\nSafety Index Rank: #${index + 1}\nSafety Index Score: ${s.safetyIndex}%\nTotal 2025 Cases: ${s.totalCases2025}`,
                      x: e.clientX,
                      y: e.clientY
                    });
                  }}
                  onMouseMove={(e) => {
                    setGisTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                  }}
                  onMouseLeave={() => setGisTooltip(null)}
                >
                  {/* Subtle link connection to indicate hierarchical database linkage */}
                  <line x1="250" y1="150" x2={x} y2={y} stroke="rgba(148, 163, 184, 0.05)" strokeDasharray="3,3" />

                  {/* Pulsing ring indicator for high risk */}
                  {s.crimeIndex >= 65 && (
                    <circle cx={x} cy={y} r="12" className="fill-none stroke-red-500/10 stroke-dasharray animate-pulse" />
                  )}

                  {/* Core interactive zone polygon / block representation */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 10 : 7}
                    className={`${
                      s.crimeIndex >= 65
                        ? "fill-red-500 group-hover:fill-red-400 shadow-[0_0_8px_#ef4444]"
                        : s.crimeIndex >= 50
                        ? "fill-amber-500 group-hover:fill-amber-400"
                        : "fill-emerald-500 group-hover:fill-emerald-450"
                    } hover:scale-125 transition-all duration-300 drop-shadow-lg`}
                  />

                  {/* State labels */}
                  <text
                    x={x + 10}
                    y={y + 3}
                    className={`text-[9px] font-mono tracking-tight ${
                      isSelected ? "fill-white font-bold text-xs" : "fill-slate-300 group-hover:fill-white font-medium"
                    }`}
                  >
                    {s.name} ({s.crimeIndex})
                  </text>
                </g>
              );
            })}

            {/* Infrastructure GIS overlay layer mapping for National Scale */}
            {(gisLayer === "hospitals" || gisLayer === "fire_stations" || gisLayer === "disaster_shelters") && 
              getInfrastructureAssets()
                .filter(item => {
                  if (gisLayer === "hospitals" && item.type === "hospital") return true;
                  if (gisLayer === "fire_stations" && item.type === "fire_station") return true;
                  if (gisLayer === "disaster_shelters" && item.type === "disaster_shelter") return true;
                  return false;
                })
                .map(item => {
                  const x = 50 + ((item.lng - 60) * 10);
                  const y = 310 - ((item.lat - 6) * 10.5);
                  
                  return (
                    <g
                      key={item.id}
                      className="cursor-pointer group"
                      onMouseEnter={(e) => {
                        setGisTooltip({
                          name: item.name,
                          type: item.type === "hospital" ? "🏥 Regional Hospital" : item.type === "fire_station" ? "🚒 Fire HQ" : "🛡️ Disaster HQ",
                          riskScore: item.type === "hospital" ? 92 : item.type === "fire_station" ? 97 : 89,
                          primaryCrime: `Primary Capacity: ${item.status}\nStatus Detail: ${item.availability}\nPrecision GPS: ${item.lat.toFixed(2)}N, ${item.lng.toFixed(2)}E`,
                          x: e.clientX,
                          y: e.clientY
                        });
                      }}
                      onMouseMove={(e) => {
                        setGisTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                      }}
                      onMouseLeave={() => setGisTooltip(null)}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        className={`${
                          item.type === "hospital"
                            ? "fill-red-500/10 stroke-red-500/70"
                            : item.type === "fire_station"
                            ? "fill-orange-500/10 stroke-orange-500/70"
                            : "fill-blue-500/10 stroke-blue-500/70"
                        } stroke-2 animate-pulse`}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="3"
                        className={
                          item.type === "hospital"
                            ? "fill-red-500"
                            : item.type === "fire_station"
                            ? "fill-orange-400"
                            : "fill-blue-500"
                        }
                      />
                      <text
                        x={x + 10}
                        y={y + 3}
                        className="text-[7.5px] font-mono fill-slate-350 drop-shadow-md select-none transition-all whitespace-nowrap opacity-50 group-hover:opacity-100"
                      >
                        {item.id.split("_")[0]}
                      </text>
                    </g>
                  );
                })
            }
          </svg>
        </div>

        <div className="flex items-center justify-between mt-2 border-t border-slate-850 pt-2 text-[10px] text-slate-400 font-mono">
          <div>📍 Click state node for district drill-down, major risks, and police station coverage metrics.</div>
          <div className="text-slate-500">Datathon-surveillance 2026 Core Grid</div>
        </div>
      </div>
    );
  };

  return (
    <div id="crime-scope-platform" className="min-h-screen bg-[#020617] text-slate-100 font-sans flex flex-col cyber-bg-grid">
      
      {/* 1. TOP HEADER SURVEILLANCE RAIL */}
      <header className="h-20 border-b border-slate-800 bg-[#020617] flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)] text-white">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white uppercase font-display">
                CRIMESCOPE <span className="text-red-500 underline decoration-2 underline-offset-4">AI</span>
              </h1>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold font-mono">
              Datathon 2026 • Challenge 02
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm font-mono">
          {/* Active status label with pulsing green dots */}
          <div className="hidden md:flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            LIVE FEED: NATIONAL_SURVEILLANCE
          </div>

          <div className="hidden lg:block h-8 w-px bg-slate-800"></div>

          {/* Dynamic data loaded counts */}
          <div className="hidden lg:flex items-center gap-4 text-slate-400">
            <span>States: <strong className="text-white">{states.length || 8}</strong></span>
            <span>SOS Alerts: <strong className="text-red-500 animate-pulse">{sosList.filter(s => s.status !== "resolved").length}</strong></span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block"></div>

          <button
            onClick={fetchBaselineData}
            title="Reload telemetry indexes"
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-transform active:rotate-180"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* API ERROR BANNER */}
      {apiError && (
        <div className="bg-red-950/85 border-y border-red-800 text-red-200 px-6 py-3.5 flex items-center gap-3 text-sm font-mono shrink-0 select-none">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <strong className="text-white">Active Database Interoperability Alert:</strong> {apiError}. Check if Vite dev server / Express application is running hot. Local fallbacks are triggered.
          </div>
          <button
            onClick={() => setApiError(null)}
            className="text-red-400 hover:text-white px-2 text-xs font-bold uppercase"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-[#020617]">
        
        {/* SIDE BAR NAVIGATION MODULE - GRID SYSTEM */}
        <aside className="lg:col-span-1 p-5 bg-[#020617] flex flex-col gap-1.5 shrink-0 border-r border-slate-800">
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 px-2 mb-2 font-bold select-none">
            INTELLIGENCE CONSOLE
          </span>
          
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === "overview"
                ? "bg-red-500/10 text-red-400 border border-red-500/35 shadow-[0_0_15px_rgba(220,38,38,0.1)] font-bold"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <Activity className="w-4 h-4 text-red-500" />
            Executive Overview
          </button>

          <button
            onClick={() => setActiveTab("gis")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === "gis"
                ? "bg-red-500/10 text-red-400 border border-red-500/35 shadow-[0_0_15px_rgba(220,38,38,0.1)] font-bold"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <MapPin className="w-4 h-4 text-red-500" />
            National Command Map
          </button>

          <button
            onClick={() => setActiveTab("network")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === "network"
                ? "bg-red-500/10 text-red-400 border border-red-500/35 shadow-[0_0_15px_rgba(220,38,38,0.1)] font-bold"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <Users className="w-4 h-4 text-red-500" />
            Criminal Link Explorer
          </button>

          <button
            onClick={() => setActiveTab("trends")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === "trends"
                ? "bg-red-500/10 text-red-400 border border-red-500/35 shadow-[0_0_15px_rgba(220,38,38,0.1)] font-bold"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-red-500" />
            Trend & Forecasting
          </button>

          <button
            onClick={() => setActiveTab("copilot")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === "copilot"
                ? "bg-red-500/10 text-red-400 border border-red-500/35 shadow-[0_0_15px_rgba(220,38,38,0.1)] font-bold"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-red-500 animate-pulse" />
            AI Intelligence Copilot
          </button>

          <button
            onClick={() => setActiveTab("field")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
              activeTab === "field"
                ? "bg-red-500/10 text-red-400 border border-red-500/35 shadow-[0_0_15px_rgba(220,38,38,0.1)] font-bold"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <Bell className="w-4 h-4 text-red-500" />
            Field Dispatch Hub
          </button>

          {/* Quick SOS Trigger button panel */}
          <div className="mt-8 border-t border-slate-800 pt-6 px-2">
            <span className="text-[10px] font-mono tracking-wider uppercase text-red-500 block mb-2 font-bold">
              ⚡ LIVE EMERGENCY SOS
            </span>
            <div className="bg-[#0a0a0a]/80 rounded-2xl p-4 border border-red-900/35">
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3 font-mono">
                Need simulated rapid dispatch response? Initiate trigger immediately.
              </p>
              <button
                onClick={() => setActiveTab("field")}
                className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg text-[10px] font-mono font-bold uppercase transition-all tracking-wider"
              >
                Trigger SOS Layer
              </button>
            </div>
          </div>

          <div className="mt-auto pt-6 px-2 text-[10px] font-mono text-slate-500">
            Sovereign India Surveillance Grid © 2026
          </div>
        </aside>

        {/* 3. DYNAMIC WORKING FIELD VIEWPORTS */}
        <main className="lg:col-span-4 p-6 bg-[#020617] overflow-y-auto">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
              <p className="text-slate-400 font-mono text-sm">Decoding real geographic crime datasets from server...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* --- TAB 1: EXECUTIVE OVERVIEW --- */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                    <div>
                      <h2 className="text-2xl font-display font-medium text-white tracking-tight">
                        Executive Overview Dashboard
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Surveillance matrix comparing regional safety indexes, active dispatches, and socio-economic relationships in India.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={exportToCSV}
                        className="px-4 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 shadow-[0_0_12px_rgba(220,38,38,0.35)] flex items-center gap-2 border border-red-500/20 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-white" />
                        Export Intelligence CSV
                      </button>
                    </div>
                  </div>

                  {/* Operational KPI Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl transition-all duration-300 hover:border-slate-700/60 hover:shadow-2xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                        <span>Surveilled States</span>
                        <Compass className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="text-3xl font-display font-bold text-white mt-2">
                        {states.length || "8"}
                      </div>
                      <p className="text-xs text-emerald-400 mt-1">
                        Active live coordination
                      </p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl transition-all duration-300 hover:border-slate-700/60 hover:shadow-2xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                        <span>Urgent SOS Triggers</span>
                        <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
                      </div>
                      <div className="text-3xl font-display font-bold text-red-400 mt-2">
                        {sosList.filter(s => s.status !== "resolved").length}
                      </div>
                      <p className="text-xs text-red-400 mt-1">
                        Average Response: <strong className="text-white">6 Mins</strong>
                      </p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl transition-all duration-300 hover:border-slate-700/60 hover:shadow-2xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                        <span>Field Ledgers logged</span>
                        <FileText className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="text-3xl font-display font-bold text-white mt-2">
                        {fieldReports.length}
                      </div>
                      <p className="text-xs text-blue-400 mt-1">
                        By field patrolling cells
                      </p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl transition-all duration-300 hover:border-slate-700/60 hover:shadow-2xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                        <span>Identified Syndicates</span>
                        <Users className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="text-3xl font-display font-bold text-amber-400 mt-2">
                        01
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Active co-arrest linkages: <strong className="text-white">10</strong>
                      </p>
                    </div>
                  </div>

                  {/* Geographic Indexes Overview Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* States Watchlist Block */}
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-slate-700/60">
                      <div>
                        <h3 className="text-base font-display font-semibold text-white mb-4">
                          Regional Public Safety & Crime Index Rank list
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-mono border-collapse divide-y divide-slate-800">
                            <thead>
                              <tr className="text-slate-400 uppercase text-[10px] tracking-wider">
                                <th className="pb-3 font-medium">State</th>
                                <th className="pb-3 text-center font-medium">Crime Index</th>
                                <th className="pb-3 text-center font-medium">Safety Index</th>
                                <th className="pb-3 font-medium">Primary Threat Zone Type</th>
                                <th className="pb-3 text-center font-medium">Next-Month Risk Forecast</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                              {states.map((st) => (
                                <tr
                                  key={st.id}
                                  className="hover:bg-slate-950/40 cursor-pointer"
                                  onClick={() => {
                                    setSelectedState(st);
                                    setActiveTab("gis");
                                  }}
                                >
                                  <td className="py-3 text-white font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ background: st.crimeIndex >= 65 ? "#ef4444" : st.crimeIndex >= 45 ? "#f59e0b" : "#10b981", boxShadow: st.crimeIndex >= 65 ? "0 0 8px #ef4444" : "none" }} />
                                    {st.name} ({st.id})
                                  </td>
                                  <td className="py-3 text-center font-bold text-slate-200">
                                    {st.crimeIndex}/100
                                  </td>
                                  <td className="py-3 text-center text-teal-400">
                                    {st.safetyIndex}%
                                  </td>
                                  <td className="py-3 text-slate-400">
                                    {st.majorCrimeType}
                                  </td>
                                  <td className="py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskColor(st.riskForecastIndex)}`}>
                                      {st.riskForecastIndex}% Risk
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="mt-4 text-[10px] text-slate-500 font-mono text-right pb-1 border-t border-slate-950 pt-2.5">
                        *Crime indices formulated based on simulated NCRB datasets mapped live.
                      </div>
                    </div>

                    {/* Quick Active Hotspots and SOS List Feed */}
                    <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-red-900/30 rounded-2xl p-6 flex flex-col transition-all duration-300 hover:border-red-900/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-display font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                          Recent Vital SOS
                        </h3>
                        <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/20 uppercase tracking-wider animate-pulse">
                          Real-time
                        </span>
                      </div>

                      <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[240px] pr-1">
                        {sosList.map((sos) => (
                          <div
                            key={sos.id}
                            className="p-3 bg-red-500/5 hover:bg-red-500/10 border-l-2 border-red-600 rounded-r-lg space-y-2 transition-all"
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-bold text-red-400">{sos.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                sos.priority === "Critical" ? "bg-red-500/10 text-red-500 border border-red-500/25 shadow-[0_0_8px_rgba(220,38,38,0.2)]" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {sos.priority}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-200 font-medium leading-normal">
                              {sos.classification} - <span className="text-slate-400">{sos.locationDetails}</span>
                            </p>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {new Date(sos.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="capitalize text-teal-400 font-medium">Status: {sos.status.replace(/_/g, " ")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* TAB 1 BONUS: Bento Grid Environmental & Socio-Economic Analysis (Challenge Criteria!) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                    {/* Bento Box 1: Socio-Economic Correlation Analysis */}
                    <div className="bg-[#0c0f16]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between transition-all duration-350 hover:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                      <div>
                        <h3 className="text-base font-display font-semibold text-white">
                          Socio-Economic Correlation
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                          Evaluates relationship between **regional unemployment rate (X-axis)** and **Crime Index (Y-axis)** across major states. High unemployment combined with hyper urban density accelerates property breaches.
                        </p>

                        <div className="h-[210px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <ScatterChart margin={{ top: 20, right: 10, bottom: 20, left: -25 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                              <XAxis
                                type="number"
                                dataKey="unemploymentRate"
                                name="Unemployment"
                                unit="%"
                                stroke="#64748b"
                                fontSize={9}
                                tickLine={false}
                              />
                              <YAxis
                                type="number"
                                dataKey="crimeIndex"
                                name="Crime Index"
                                stroke="#64748b"
                                fontSize={9}
                                tickLine={false}
                              />
                              <ChartTooltip cursor={{ strokeDasharray: '3 3' }} />
                              <Scatter name="States Relationship" data={states.map(s => ({
                                name: s.name,
                                unemploymentRate: s.demographics.unemploymentRate,
                                crimeIndex: s.crimeIndex
                              }))} fill="#14b8a6">
                                {states.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.crimeIndex > 60 ? "#ef4444" : "#0d9488"} />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="mt-4 bg-[#050505]/70 p-3 rounded-xl border border-slate-850 text-[11px] text-slate-400 leading-normal font-mono">
                        <strong className="text-white">Analysis:</strong> Cyber fraud & cybercrime escalate in High-Literacy metropolitan centers with extreme population densities (e.g. Delhi, Bengaluru), while physical burglaries correlate heavier with rural-urban migrant entry points.
                      </div>
                    </div>

                    {/* Bento Box 2: Environmental Climate Intel (Dynamic OpenWeather feed widget) */}
                    <div className="bg-[#0c0f16]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between transition-all duration-350 hover:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-display font-semibold text-white flex items-center gap-1.5">
                            <CloudRain className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                            Environmental Intel
                          </h3>
                          <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/25 uppercase font-semibold">
                            Live telemetry
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal mb-4">
                          Integrates a real-time weather feed from OpenWeather to trace flood risks, storms, or severe heat that correlate with crime dispatch loops.
                        </p>

                        {/* Selector logic */}
                        <div className="mb-4">
                          <label className="block text-slate-500 mb-1.5 font-bold text-[8.5px] tracking-wider font-mono">CHOOSE SECTOR COMMAND</label>
                          <select
                            value={weatherScope}
                            onChange={(e) => setWeatherScope(e.target.value)}
                            className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 cursor-pointer"
                          >
                            {states.map(s => (
                              <option key={s.id} value={s.id}>{s.name} Sector ({s.id})</option>
                            ))}
                          </select>
                        </div>

                        {weatherLoading ? (
                          <div className="h-28 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                            <span className="text-[11px] text-slate-500 font-mono">Querying OpenWeather pipeline...</span>
                          </div>
                        ) : weather ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 bg-[#050505]/70 p-3 border border-slate-850 rounded-xl font-mono text-xs text-slate-350">
                              <div className="space-y-0.5">
                                <span className="text-slate-500 text-[8px] tracking-wider uppercase block">TEMPERATURE</span>
                                <div className="flex items-center gap-1.5">
                                  <Thermometer className="w-4 h-4 text-orange-400 shrink-0" />
                                  <span className="text-sm font-bold text-white">{weather.temp}°C</span>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-slate-500 text-[8px] tracking-wider uppercase block">HUMIDITY</span>
                                <div className="flex items-center gap-1.5">
                                  <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                                  <span className="text-sm font-bold text-white">{weather.humidity}%</span>
                                </div>
                              </div>
                              <div className="col-span-2 border-t border-slate-900/50 pt-2 flex justify-between items-center text-[11px]">
                                <div>
                                  <span className="text-slate-500 text-[8px] uppercase tracking-wider block">CLIMATE STATUS</span>
                                  <span className="text-white font-medium capitalize text-xs shrink-0">{weather.description}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-500 text-[8px] uppercase tracking-wider block">HOURLY PRECIP</span>
                                  <span className="text-blue-400 font-semibold text-xs">{weather.rainfall} mm</span>
                                </div>
                              </div>
                            </div>

                            {/* Alert Warnings panel */}
                            <div className={`p-3 border rounded-xl font-mono text-[10.5px] leading-relaxed flex gap-2 ${
                              weather.status.includes("Red") || weather.status.includes("Severe")
                                ? "bg-red-950/20 border-red-500/30 text-red-300"
                                : weather.status.includes("Warning") || weather.status.includes("Alert")
                                ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                                : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                            }`}>
                              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold uppercase tracking-wider text-[8px] block">{weather.status}</span>
                                <p>{weather.alert}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-red-900/20 text-xs font-mono text-center text-red-400 bg-red-950/5">
                            Telemetry link offline. Check connection.
                          </div>
                        )}
                      </div>

                      {weather && (
                        <div className="mt-4 bg-[#050505]/75 p-3 rounded-xl border border-slate-850 text-[10px] leading-normal text-slate-400 font-mono">
                          <strong className="text-white block uppercase tracking-wider text-[8.5px] mb-1">INCIDENT CORRELATION LOG:</strong>
                          {weather.correlation}
                        </div>
                      )}
                    </div>

                    {/* Bento Box 3: India National Tactical Command Shortcuts */}
                    <div className="bg-[#0c0f16]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between transition-all duration-350 hover:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                      <div>
                        <h3 className="text-base font-display font-semibold text-white mb-2">
                          Sector Commands Layer
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We mapped 28 States and Union Territories with precise coordinate indices. Navigate below to investigate regional active threat patterns:
                        </p>

                        <div className="grid grid-cols-2 gap-2.5 my-4 overflow-y-auto max-h-[220px] pr-1">
                          {states.map(s => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSelectedState(s);
                                setActiveTab("gis");
                              }}
                              className="p-2.5 bg-slate-950/70 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 rounded-xl text-left transition-all duration-200 cursor-pointer"
                            >
                              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">{s.id}</span>
                              <div className="text-xs font-bold text-white mt-0.5 truncate">{s.name}</div>
                              <div className="text-[10px] font-mono text-red-500 mt-1">{s.crimeIndex} Crime index</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab("gis")}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs font-mono uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer"
                      >
                        Explore Interactive GIS Map <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- TAB 2: NATIONAL COMMAND MAP --- */}
              {activeTab === "gis" && (
                <motion.div
                  key="gis"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                    <div>
                      <h2 className="text-2xl font-display font-medium text-white tracking-tight">
                        Surveillance GIS National Command center
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Surveil India, States, and District jurisdictions. Toggle overlay registers to display heat zones, resources, and live caller locations.
                      </p>
                    </div>

                    {/* Filter Overlays */}
                    <div className="flex flex-wrap gap-1 bg-[#050505] border border-slate-800 p-1 rounded-xl text-[11px] font-mono">
                      <button
                        onClick={() => setGisLayer("risk")}
                        className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 ${gisLayer === "risk" ? "bg-red-600 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]" : "text-slate-400 hover:text-white"}`}
                      >
                        🔥 Hotspots
                      </button>
                      <button
                        onClick={() => setGisLayer("sos")}
                        className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 ${gisLayer === "sos" ? "bg-red-600 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]" : "text-slate-400 hover:text-white"}`}
                      >
                        🚨 SOS Active
                      </button>
                      <button
                        onClick={() => setGisLayer("police")}
                        className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 ${gisLayer === "police" ? "bg-red-600 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]" : "text-slate-400 hover:text-white"}`}
                      >
                        🚓 Police HQ
                      </button>
                      <button
                        onClick={() => setGisLayer("hospitals")}
                        className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 ${gisLayer === "hospitals" ? "bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]" : "text-slate-400 hover:text-white"}`}
                      >
                        🏥 Hospitals
                      </button>
                      <button
                        onClick={() => setGisLayer("fire_stations")}
                        className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 ${gisLayer === "fire_stations" ? "bg-orange-600 text-white font-bold shadow-[0_0_12px_rgba(234,88,12,0.4)]" : "text-slate-400 hover:text-white"}`}
                      >
                        🚒 Fire Squads
                      </button>
                      <button
                        onClick={() => setGisLayer("disaster_shelters")}
                        className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 ${gisLayer === "disaster_shelters" ? "bg-emerald-600 text-white font-bold shadow-[0_0_12px_rgba(5,150,105,0.4)]" : "text-slate-400 hover:text-white"}`}
                      >
                        🛡️ Shelters
                      </button>
                    </div>
                  </div>

                  {/* CSS Grid layout for Map + Right statistics details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* SVG Map (Main visual) */}
                    <div className="lg:col-span-2 space-y-4">
                      {renderInteractiveMap()}

                      {/* Map Controls */}
                      <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 backdrop-blur-md border border-slate-800 p-4 rounded-2xl text-xs font-mono text-slate-300">
                        <span className="font-bold text-slate-400 uppercase mr-2 text-[10px]">Active Filters:</span>
                        <span className="px-2.5 py-1 bg-[#050505] border border-slate-800 rounded-lg flex items-center gap-1">
                          📡 Target Area: <strong className="text-white">{selectedState ? selectedState.name : "Whole country"}</strong>
                        </span>
                        {selectedState && (
                          <button
                            onClick={() => setSelectedState(null)}
                            className="text-[10px] text-red-400 hover:text-red-300 border-b border-red-500/30"
                          >
                            [Clear Zoom]
                          </button>
                        )}
                        <span className="ml-auto text-[10px] text-slate-500">Scale: MAPPED BY COORDINATES DEGREES</span>
                      </div>
                    </div>

                    {/* Drilled down node information statistics summary */}
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-5 transition-all duration-300 hover:border-slate-700/60 shadow-xl">
                      {selectedState ? (
                        <>
                          <div className="border-b border-slate-800 pb-3">
                            <span className="text-[10px] font-mono text-slate-500 uppercase block">DRILL-DOWN CODES: {selectedState.id}</span>
                            <h3 className="text-lg font-display text-white font-semibold mt-0.5">
                              {selectedState.name} Sector Intelligence
                            </h3>
                          </div>

                          <div className="space-y-4 text-xs font-mono text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Primary Incident Type:</span>
                              <span className="text-white font-bold">{selectedState.majorCrimeType}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5 border-y border-slate-800/60 py-3.5">
                              <div>
                                <span className="text-slate-500 block">Crime Index:</span>
                                <strong className="text-base text-white">{selectedState.crimeIndex}/100</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Next Month Forecast:</span>
                                <strong className="text-base text-red-400">{selectedState.riskForecastIndex}% Risk</strong>
                              </div>
                            </div>

                            {/* Districts List inside this State */}
                            <div>
                              <span className="text-slate-500 block mb-2 uppercase text-[10px] tracking-wider font-semibold">MAPPED DISTRICT JURISDICTIONS ({districts.length})</span>
                              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                {districts.map(d => (
                                  <div
                                    key={d.id}
                                    onClick={() => setSelectedDistrict(d)}
                                    className={`p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                                      selectedDistrict?.id === d.id
                                        ? "bg-red-500/10 border-red-500/50 text-red-405 shadow-[0_0_12px_rgba(220,38,38,0.15)]"
                                        : "bg-[#050505]/70 border-slate-800 text-slate-300 hover:border-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold">{d.name}</span>
                                      <span className="text-[10px] bg-red-500/10 text-red-450 px-1.5 rounded">{d.crimeIndex} idx</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {selectedDistrict && (
                              <div className="bg-[#050505]/80 p-4 border border-slate-800 rounded-2xl space-y-3">
                                <div className="border-b border-slate-900 pb-1.5">
                                  <span className="text-[9px] text-slate-500 uppercase block">Selected District</span>
                                  <strong className="text-sm text-white font-display uppercase tracking-tight">{selectedDistrict.name}</strong>
                                </div>
                                <div className="space-y-1.5 text-[11px]">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Active Patrol Units:</span>
                                    <span className="text-white font-bold">{selectedDistrict.activePatrols} units</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Outstanding Cases:</span>
                                    <span className="text-red-400 font-bold">{selectedDistrict.outstandingCases} case files</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block mb-1">Surveilled Hotspots:</span>
                                    <ul className="list-disc leading-relaxed list-inside pl-1 text-[10px] text-slate-400">
                                      {selectedDistrict.majorHotspotAreas.map((hot, idx) => (
                                        <li key={idx} className="truncate">{hot}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </>
                      ) : (
                        <div className="h-72 flex flex-col items-center justify-center text-center p-4">
                          <Compass className="w-10 h-10 text-red-500 animate-spin" />
                          <h4 className="text-white text-sm font-display mt-3 font-semibold">Coordinates Drill-Down Ready</h4>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[200px]">
                            Click any state surveillance node on the interactive map to inspect districts. Available states: Karnataka, Maharashtra, Delhi, Tamil Nadu, Telangana, Kerala.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}

              {/* --- TAB 3: CRIMINAL LINK EXPLORER --- */}
              {activeTab === "network" && (
                <motion.div
                  key="network"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                    <div>
                      <h2 className="text-2xl font-display font-medium text-white tracking-tight">
                        Criminal Network & Syndicate Explorer
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Inspect automatic syndicate linkages, phone contacts, registered getaway vehicle coordinates, and escrow banks.
                      </p>
                    </div>

                    {/* Filter Type */}
                    <div className="flex bg-[#050505] border border-slate-800 p-1 rounded-xl text-xs font-mono">
                      {["all", "suspect", "phone", "vehicle", "bank_account"].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setNetworkFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg transition-all duration-200 capitalize ${networkFilter === cat ? "bg-red-600 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]" : "text-slate-400 hover:text-white"}`}
                        >
                          {cat.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Graphical Nodes Network layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* SVG Core Graph Rendering */}
                    <div className="lg:col-span-2 bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 relative overflow-hidden h-[380px] flex items-center justify-center transition-all duration-300 hover:border-slate-700/60 shadow-xl">
                      <div className="absolute top-4 left-4 z-10 text-[9px] font-mono text-slate-400 uppercase bg-[#020617] px-2.5 py-1 border border-slate-800 rounded-lg">
                        Network Linkages Panel (Interactive Nodes)
                      </div>

                      {/* Interactive SVG Network Representation */}
                      <svg viewBox="0 0 400 300" className="w-[85%] h-full">
                        {/* Render Links */}
                        {network.edges.map(e => {
                          // Find source and target node coordinates from simulated map positions
                          const nodeCoords: Record<string, { x: number; y: number }> = {
                            sus_arjun: { x: 200, y: 150 },
                            sus_vikas: { x: 130, y: 110 },
                            sus_priya: { x: 80, y: 70 },
                            sus_rohit: { x: 280, y: 220 },
                            ph_vip_1: { x: 200, y: 90 },
                            ph_vip_2: { x: 60, y: 160 },
                            veh_bolero: { x: 340, y: 180 },
                            veh_scorpio: { x: 300, y: 130 },
                            loc_noida_safe: { x: 50, y: 240 },
                            bank_corp: { x: 140, y: 40 }
                          };
                          const s = nodeCoords[e.source];
                          const t = nodeCoords[e.target];
                          if (!s || !t) return null;

                          return (
                            <g key={e.id}>
                              <line
                                x1={s.x}
                                y1={s.y}
                                x2={t.x}
                                y2={t.y}
                                stroke="rgba(220, 38, 38, 0.2)"
                                strokeWidth={e.weight / 1.5}
                                className="hover:stroke-red-500/60 cursor-pointer"
                              />
                            </g>
                          );
                        })}

                        {/* Render Nodes */}
                        {network.nodes
                          .filter(n => networkFilter === "all" || n.type === networkFilter)
                          .map(node => {
                            // Node position coordinates match
                            const nodeCoords: Record<string, { x: number; y: number }> = {
                              sus_arjun: { x: 200, y: 150 },
                              sus_vikas: { x: 130, y: 110 },
                              sus_priya: { x: 80, y: 70 },
                              sus_rohit: { x: 280, y: 220 },
                              ph_vip_1: { x: 200, y: 90 },
                              ph_vip_2: { x: 60, y: 160 },
                              veh_bolero: { x: 340, y: 180 },
                              veh_scorpio: { x: 300, y: 130 },
                              loc_noida_safe: { x: 50, y: 240 },
                              bank_corp: { x: 140, y: 40 }
                            };
                            const pos = nodeCoords[node.id] || { x: 100, y: 100 };
                            const isSelected = selectedNode?.id === node.id;

                            // Colors based on type
                            const nodeFill =
                              node.type === "suspect"
                                ? "#ef4444"
                                : node.type === "vehicle"
                                ? "#38bdf8"
                                : node.type === "phone"
                                ? "#fbbf24"
                                : node.type === "bank_account"
                                ? "#c084fc"
                                : "#64748b";

                            return (
                              <g
                                key={node.id}
                                className="cursor-pointer group"
                                onClick={() => setSelectedNode(node)}
                                transform={`translate(${pos.x}, ${pos.y})`}
                              >
                                {isSelected && (
                                  <circle r="14" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" />
                                )}
                                <circle
                                  r={node.type === "suspect" ? 10 : 7}
                                  fill={nodeFill}
                                  className="group-hover:scale-125 transition-transform"
                                />
                                <text
                                  y={18}
                                  textAnchor="middle"
                                  className={`text-[8px] font-mono tracking-tighter ${
                                    isSelected ? "fill-red-400 font-bold" : "fill-slate-300"
                                  }`}
                                >
                                  {node.label}
                                </text>
                              </g>
                            );
                          })}
                      </svg>

                      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-slate-500">
                        *Nodes represent assets/agents. Lineweights map relationship indexes.
                      </div>
                    </div>

                    {/* Detailed Criminal Profile dossiers */}
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:border-slate-700/60 shadow-xl">
                      {selectedNode ? (
                        <>
                          <div className="border-b border-slate-800 pb-3">
                            <span className="text-[10px] font-mono text-slate-500 uppercase block">NODE PROFILE ID: {selectedNode.id}</span>
                            <h3 className="text-lg font-display text-white font-semibold mt-0.5">
                              {selectedNode.label}
                            </h3>
                          </div>

                          <div className="space-y-4 text-xs font-mono text-slate-300">
                            <div>
                              <span className="text-slate-500 block">Class Category:</span>
                              <span className="text-white font-bold uppercase">{selectedNode.type.replace("_", " ")}</span>
                            </div>

                            {selectedNode.role && (
                              <div>
                                <span className="text-slate-500 block">System Role:</span>
                                <span className="text-red-400 font-bold uppercase">{selectedNode.role}</span>
                              </div>
                            )}

                            <div>
                              <span className="text-slate-500 block">Calculated Recidivism Risk:</span>
                              <span className={`text-sm font-bold ${
                                selectedNode.riskScore >= 80 ? "text-red-500" : "text-amber-500"
                              }`}>{selectedNode.riskScore}% severity rate</span>
                            </div>

                            {selectedNode.associatedCrime && (
                              <div className="bg-[#050505]/80 p-3.5 border border-slate-850 rounded-xl">
                                <span className="text-slate-500 block mb-1 text-[10px]">ASSOCIATED OUTSTANDING CASE:</span>
                                <p className="text-xs text-slate-300 leading-normal">
                                  {selectedNode.associatedCrime}
                                </p>
                              </div>
                            )}

                            {/* Show Connections linked to this Node */}
                            <div>
                              <span className="text-slate-500 block mb-1.5 uppercase text-[10px] font-semibold">Active Node Edges</span>
                              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                                {network.edges
                                  .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                                  .map(e => {
                                    const peerId = e.source === selectedNode.id ? e.target : e.source;
                                    const peer = network.nodes.find(n => n.id === peerId);
                                    return (
                                      <div key={e.id} className="text-[10px] bg-[#050505] p-2.5 border border-slate-800 rounded-lg">
                                        Linked to <strong className="text-white">{peer ? peer.label : peerId}</strong> via <span className="text-red-500 font-bold uppercase">{e.type.replace("_", " ")}</span>
                                        <p className="text-slate-400 text-[9px] mt-1">{e.description}</p>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-72 flex flex-col items-center justify-center text-center p-4">
                          <User className="w-10 h-10 text-red-500/80 animate-pulse" />
                          <h4 className="text-white text-sm font-display mt-3 font-semibold">Intelligence Dossier Ready</h4>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Click on any node in the interactive grid map to display background case profiles, phone signals, or bank ledger histories.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}

              {/* --- TAB 4: TRENDS & FORECASTING --- */}
              {activeTab === "trends" && (
                <motion.div
                  key="trends"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                    <div>
                      <h2 className="text-2xl font-display font-medium text-white tracking-tight">
                        Surveillance Trends & Forecasting Center
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Perform seasonal regression analytics and forecast upcoming month spikes (using actual real-time database registers).
                      </p>
                    </div>

                    {/* Regional Scope Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Surveillance Region:</span>
                      <select
                        value={trendScope}
                        onChange={(e) => setTrendScope(e.target.value)}
                        className="bg-[#050505] border border-slate-800 text-xs font-mono text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
                      >
                        <option value="national">National (Aggregated Database)</option>
                        {states.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Trends Charts */}
                  <div className="grid grid-cols-1 gap-6">
                    
                    {/* Primary Line Chart */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:border-slate-700/60 shadow-xl">
                      <h3 className="text-base font-display font-medium text-white mb-4">
                        Monthly Historical & Predictive Crime Progression Matrix (2025 - Mid 2026)
                      </h3>

                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.015)" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={10} fontStyle="italic" />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <ChartTooltip contentStyle={{ background: "#050505", border: "1px solid #dc2626" }} />
                            <ChartLegend verticalAlign="top" height={36} fontSize={10} />
                            <Line type="monotone" dataKey="cybercrimeCases" stroke="#38bdf8" strokeWidth={2} name="Cyber Crime" dot={false} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="theftCases" stroke="#ef4444" strokeWidth={2} name="Vehicle & Property Theft" dot={false} />
                            <Line type="monotone" dataKey="fraudCases" stroke="#c084fc" strokeWidth={2} name="Phishing / Fraud" dot={false} />
                            <Line type="monotone" dataKey="violentCases" stroke="#f59e0b" strokeWidth={2} name="Violent Disputes" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-4 bg-[#050505] p-5 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono text-slate-400">
                        <strong className="text-white block">🔮 Statistical Forecaster Analysis (Sovereign Engine):</strong>
                        <p className="leading-relaxed text-slate-300">
                          A noticeable seasonal acceleration in **Vehicle & Property Theft** is registered around Oct-Nov annually (festival season crowds). Concurrently, **Cyber Crimes and KYC Phishing scams** have scaled **35% linearly** across modern tech corridors due to increased internet propagation.
                        </p>
                      </div>
                    </div>

                    {/* Regional demographics barchart comparison block */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:border-slate-700/60 shadow-xl">
                      <h3 className="text-base font-display font-medium text-white mb-4">
                        Sub-Continent Regional High-Risk Indices Ratio
                      </h3>

                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={states} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.015)" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <ChartTooltip contentStyle={{ background: "#050505", border: "1px solid #ef4444" }} />
                            <Bar dataKey="crimeIndex" fill="#ef4444" radius={[6, 6, 0, 0]} name="Baseline Crime Index">
                              {states.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.crimeIndex > 60 ? "#ef4444" : "#f59e0b"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* --- TAB 5: INTELLIGENCE ASSISTANT (COPILOT) --- */}
              {activeTab === "copilot" && (
                <motion.div
                  key="copilot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                    <div>
                      <h2 className="text-2xl font-display font-medium text-white tracking-tight">
                        AI Crime Copilot Assistant
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Sovereign Multi-Agent coordinator executing real-time data lookups and automated response proposals.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono bg-red-500/10 text-red-400 px-3 py-1.5 border border-red-500/20 rounded-lg animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      Gemini Activated
                    </div>
                  </div>

                  {/* Chat interface */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                    
                    {/* Main Chat Box */}
                    <div className="lg:col-span-3 bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col h-[480px] overflow-hidden shadow-xl">
                      
                      {/* Chat Messages */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-sm">
                        {copilotHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[10px] text-slate-500 mb-1">
                              {msg.sender === "user" ? "Officer-ID (divharikumar)" : "CrimeScope AI Coordinators"}
                            </span>

                            {msg.sender === "user" ? (
                              <div className="bg-red-600 text-white px-4 py-2.5 rounded-2xl max-w-[85%] font-sans font-medium shadow-[0_0_12px_rgba(220,38,38,0.2)]">
                                {msg.text}
                              </div>
                            ) : (
                              <div className="bg-[#050505] border border-slate-850 px-4 py-3 rounded-2xl max-w-[85%] space-y-3">
                                
                                {/* If there are Agents Metadata, show them collapsible */}
                                {msg.agents && (
                                  <div className="bg-[#0a0a0a] p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
                                    <span className="text-slate-500 uppercase block font-bold tracking-wider">Multi-Agent Processing Path:</span>
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                                      {msg.agents.map((ag, indexKey) => (
                                        <div key={indexKey} className="bg-[#050505] p-1.5 rounded-lg border border-slate-850">
                                          <div className="text-white font-bold truncate">{ag.agentName.split(" ")[0]}</div>
                                          <div className="text-red-400 truncate text-[9px]">{ag.actionResult}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Main Text markdown response */}
                                <div className="text-slate-200 text-xs leading-relaxed font-sans space-y-1 white-space-pre-line">
                                  {msg.text.split("\n").map((line, lidx) => (
                                    <p key={lidx}>{line}</p>
                                  ))}
                                </div>

                                {/* suggested action visual warning */}
                                {msg.action && msg.action.type !== "none" && (
                                  <div className="text-[10px] bg-red-500/10 text-red-400 p-2.5 rounded-lg border border-red-500/20 uppercase font-bold tracking-widest animate-pulse">
                                    🎯 Suggested UI Action Triggered: {msg.action.type.replace(/_/g, " ")} {msg.action.targetId || ""}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        {copilotLoading && (
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono italic">
                            <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                            Multi-agent consensus resolving crime registries parameters...
                          </div>
                        )}
                        <div ref={chatScrollRef} />
                      </div>

                      {/* Chat Input */}
                      <form onSubmit={submitCopilotQuery} className="p-4 border-t border-slate-850 bg-[#020202] rounded-b-2xl flex gap-3">
                        <input
                          type="text"
                          value={copilotQuery}
                          onChange={(e) => setCopilotQuery(e.target.value)}
                          placeholder="Speak into command console (e.g., 'Show districts where vehicle theft is likely to rise')"
                          className="flex-1 bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="submit"
                          className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 shadow-[0_0_12px_rgba(220,38,38,0.35)]"
                        >
                          Instruct
                        </button>
                      </form>

                    </div>

                    {/* Quick Command presets list */}
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:border-slate-700/60 shadow-xl">
                      <div>
                        <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Tactical Prompt Presets</h4>
                        <p className="text-[11px] text-slate-500 leading-normal mt-1">
                          Click any preset to load its context directly into the Multi-Agent reasoning chain:
                        </p>
                      </div>

                      <div className="space-y-2.5 font-mono">
                        <button
                          onClick={() => sendQuickPrompt("Show districts where vehicle theft is likely to rise next month.")}
                          className="w-full text-left p-3 bg-[#050505] hover:bg-slate-900/40 border border-slate-850 hover:border-slate-700 rounded-xl text-[11px] text-slate-300 transition-all duration-200 leading-normal"
                        >
                          🔮 M1: Vehicle theft escalation risk metrics next month
                        </button>
                        <button
                          onClick={() => sendQuickPrompt("Analyze the criminal network tied to lead suspect Arjun Rao.")}
                          className="w-full text-left p-3 bg-[#050505] hover:bg-slate-900/40 border border-slate-850 hover:border-slate-700 rounded-xl text-[11px] text-slate-300 transition-all duration-200 leading-normal"
                        >
                          🕸️ M2: Arjun Rao Syndicate file & financial connections
                        </button>
                        <button
                          onClick={() => sendQuickPrompt("Compare cyber crime trends between Bengaluru Urban and Mysuru.")}
                          className="w-full text-left p-3 bg-[#050505] hover:bg-slate-900/40 border border-slate-850 hover:border-slate-700 rounded-xl text-[11px] text-slate-300 transition-all duration-200 leading-normal"
                        >
                          📊 M3: Comparative analysis - Bengaluru vs Mysuru
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* --- TAB 6: FIELD DISPATCH HUB & SOS ACTIVE --- */}
              {activeTab === "field" && (
                <motion.div
                  key="field"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                    <div>
                      <h2 className="text-2xl font-display font-medium text-white tracking-tight">
                        Field Patrolling & Emergency SOS Dispatch
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Log live on-field police observations or activate emergency SOS responses (linked interactively with database registries).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    
                    {/* LEFT PANEL: RAPID EMERGENCY SOS */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:border-slate-700/60 shadow-xl">
                      <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
                        <h3 className="text-base font-display font-semibold text-white">
                          Initiate Emergency SOS Call
                        </h3>
                      </div>

                      {sosSuccess && (
                        <div className="bg-emerald-950/20 backdrop-blur-md border border-emerald-900/50 p-4 rounded-xl space-y-1.5 text-xs font-mono">
                          <strong className="text-emerald-400 block font-semibold">✓ Emergency SOS Logged Securely!</strong>
                          <div className="text-slate-350">Logged Incident ID: {sosSuccess.id}</div>
                          {sosSuccess.assignedResource && (
                            <div className="bg-[#050505] p-3 border border-slate-850 rounded-xl mt-3 space-y-1 text-slate-350">
                              <div>🚓 Dispatch Unit: <strong className="text-white">{sosSuccess.assignedResource.policeStation}</strong></div>
                              {sosSuccess.assignedResource.hospital && <div>🏥 Trauma Support: <strong className="text-white">{sosSuccess.assignedResource.hospital}</strong></div>}
                              <div>⏱ Response ETA: <strong className="text-red-400 font-semibold">{sosSuccess.assignedResource.etaMinutes} Minutes ({sosSuccess.assignedResource.distanceKm} km away)</strong></div>
                            </div>
                          )}
                        </div>
                      )}

                      <form onSubmit={triggerSOS} className="space-y-4 text-xs font-mono text-slate-300">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">CALLER JURISDICTION (STATE)</label>
                            <select
                              value={sosState}
                              onChange={(e) => setSosState(e.target.value)}
                              className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-white font-medium"
                            >
                              {states.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">MAPPED DISTRICT</label>
                            <select
                              value={sosDistrict}
                              onChange={(e) => setSosDistrict(e.target.value)}
                              className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-white font-medium"
                            >
                              <option value="Bengaluru Urban">Bengaluru Urban</option>
                              <option value="Mysuru">Mysuru</option>
                              <option value="Mumbai City">Mumbai City</option>
                              <option value="Pune">Pune</option>
                              <option value="New Delhi">New Delhi</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">CONTACT PHONE NUMBER</label>
                          <input
                            type="text"
                            required
                            placeholder="+91-888XX-XXXXX"
                            value={sosPhone}
                            onChange={(e) => setSosPhone(e.target.value)}
                            className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">INCIDENT CLASSIFICATION</label>
                          <select
                            value={sosClass}
                            onChange={(e) => setSosClass(e.target.value as any)}
                            className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-white font-medium"
                          >
                            <option value="Women Safety">Women Safety (Assistance Alert)</option>
                            <option value="Road Accident">Road Accident (Trauma Emergency)</option>
                            <option value="Cyber Fraud">Cyber Fraud (Urgent account lockout)</option>
                            <option value="Theft/Burglary">Theft/Burglary (Property incident)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">LOCATION DETAILS COORDINATES</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Opposite Metro station block, corridor 2..."
                            value={sosLocation}
                            onChange={(e) => setSosLocation(e.target.value)}
                            className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-white leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl uppercase tracking-wider text-center flex items-center justify-center gap-2.5 transition-all duration-200 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        >
                          <Phone className="w-4 h-4" /> Trigger Urgent SOS Dispatch
                        </button>
                      </form>
                    </div>

                    {/* RIGHT PANEL: FIELD REPORT LEDGER */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:border-slate-700/60 shadow-xl">
                      <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-red-500" />
                        <h3 className="text-base font-display font-semibold text-white">
                          On-Field Patrol Officer Ledger
                        </h3>
                      </div>

                      {fieldSuccess && (
                        <div className="bg-emerald-950/20 backdrop-blur-md border border-emerald-900/50 p-4 rounded-xl space-y-1.5 text-xs text-white font-mono">
                          ✓ On-field report added successfully to police surveillance records.
                        </div>
                      )}

                      <form onSubmit={submitFieldReport} className="space-y-4 text-xs font-mono text-slate-300">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">OFFICER IDENTIFIER ID</label>
                            <input
                              type="text"
                              value={fOfficerId}
                              onChange={(e) => setFOfficerId(e.target.value)}
                              className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-slate-300 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">OFFICER NAME</label>
                            <input
                              type="text"
                              value={fOfficerName}
                              onChange={(e) => setFOfficerName(e.target.value)}
                              className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-slate-300 font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">DISTRICT BLOCK</label>
                            <select
                              value={fDistrict}
                              onChange={(e) => setFDistrict(e.target.value)}
                              className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-slate-300 font-medium"
                            >
                              <option value="Bengaluru Urban">Bengaluru Urban</option>
                              <option value="Mumbai City">Mumbai City</option>
                              <option value="New Delhi">New Delhi</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">CATEGORY DETAILS</label>
                            <select
                              value={fCategory}
                              onChange={(e) => setFCategory(e.target.value)}
                              className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-slate-300 font-medium"
                            >
                              <option value="Suspicious Sim Sells Spotted">SIM swapping hub suspects</option>
                              <option value="CCTV blindspot report">CCTV visibility compromise</option>
                              <option value="Emerging Assembly">Unauthorized assembly tracker</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">TACTICAL SITUATION DESCRIPTION</label>
                          <textarea
                            rows={2}
                            required
                            placeholder="Type observations here..."
                            value={fDesc}
                            onChange={(e) => setFDesc(e.target.value)}
                            className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-white leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1.5 font-semibold text-[10px] tracking-wider">IMMEDIATE FIELD ACTION TAKEN</label>
                          <input
                            type="text"
                            required
                            placeholder="Detained suspects, issued notice, set blockades..."
                            value={fAction}
                            onChange={(e) => setFAction(e.target.value)}
                            className="w-full bg-[#050505] border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 text-white font-medium"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl uppercase tracking-wider text-center transition-all duration-200 bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.25)]"
                        >
                          Publish Patrol Report
                        </button>
                      </form>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>

        {/* Floating Interactive GIS map tooltip */}
        {gisTooltip && (
          <div
            style={{
              position: "fixed",
              left: gisTooltip.x + 15,
              top: gisTooltip.y + 15,
              pointerEvents: "none",
              zIndex: 99999
            }}
            className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-xs font-mono text-slate-300 w-56 space-y-2 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-905 pb-1.5">
              <span className="font-bold text-white text-xs truncate max-w-[130px]">{gisTooltip.name}</span>
              <span className="text-[8px] bg-slate-900 font-bold px-2 py-0.5 rounded text-slate-400 uppercase tracking-wider shrink-0 border border-slate-850">
                {gisTooltip.type}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Surveillance Score:</span>
              <span className={`font-bold ${
                gisTooltip.riskScore >= 60 ? "text-red-400" : gisTooltip.riskScore >= 45 ? "text-amber-400" : "text-emerald-400"
              }`}>{gisTooltip.riskScore}/100</span>
            </div>
            <div className="flex flex-col gap-1 text-[11px] pt-1.5 border-t border-slate-900/60">
              <span className="text-slate-500 text-[8.5px] uppercase tracking-wider font-bold">Telemetry:</span>
              <p className="text-white font-medium whitespace-pre-line leading-relaxed text-[10.5px]">{gisTooltip.primaryCrime}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
