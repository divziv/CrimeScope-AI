/**
 * CrimeScope AI In-Memory Database and Analytics Module
 * Contains realistic Geospatial, Demographic, Network, Emergency, and Historical datasets for India.
 * Also manages real-time state for SOS triggers and field officer reports.
 */

export interface DemographicCorrelation {
  literacyRate: number;      // percentage
  unemploymentRate: number;  // percentage
  populationDensity: number; // per sq km
  povertyRate: number;       // percentage
  urbanizationRate: number;  // percentage
}

export interface StateCrimeData {
  id: string;
  name: string;
  category: "state" | "ut";
  lat: number;
  lng: number;
  crimeIndex: number;      // out of 100
  safetyIndex: number;     // out of 100
  totalCases2025: number;
  majorCrimeType: string;
  riskForecastIndex: number; // probability of crime rise next month (percentage)
  demographics: DemographicCorrelation;
  emergencyStats: {
    policeStations: number;
    hospitals: number;
    fireStations: number;
    disasterShelters: number;
  };
}

export interface DistrictCrimeData {
  id: string;
  stateId: string;
  name: string;
  lat: number;
  lng: number;
  crimeIndex: number;
  safetyIndex: number;
  outstandingCases: number;
  majorHotspotAreas: string[];
  riskForecastIndex: number;
  activePatrols: number;
  demographics: DemographicCorrelation;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: "suspect" | "vehicle" | "phone" | "address" | "bank_account";
  role?: "Kingpin" | "Operator" | "Mule" | "Asset" | "Runner";
  associatedCrime?: string;
  riskScore: number; // percentage
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: "shared_call" | "shared_vehicle" | "shared_location" | "co_arrest" | "money_transfer";
  weight: number; // connection strength 1-5
  description: string;
}

export interface EmergencyResource {
  id: string;
  name: string;
  type: "police_station" | "hospital" | "fire_station" | "ambulance";
  lat: number;
  lng: number;
  phone: string;
  status: "available" | "busy" | "dispatched";
  etaMinutes: number;
}

export interface SOSIncident {
  id: string;
  timestamp: string;
  callerPhone: string;
  state: string;
  district: string;
  locationDetails: string;
  lat: number;
  lng: number;
  classification: "Women Safety" | "Cyber Fraud" | "Theft/Burglary" | "Road Accident" | "Missing Person" | "Assault/Violence" | "Disaster Emergency";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "triggered" | "dispatching" | "responder_en_route" | "resolved";
  assignedResource?: {
    policeStation: string;
    hospital?: string;
    distanceKm: number;
    etaMinutes: number;
  };
}

export interface FieldOfficerIncident {
  id: string;
  timestamp: string;
  officerId: string;
  officerName: string;
  district: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  actionTaken: string;
}

// Historical crime trends for forecasting (monthly cases from Jan 2025 to May 2026)
export interface MonthTrend {
  month: string; // "Jan 25", "Feb 25", ...
  theftCases: number;
  cybercrimeCases: number;
  fraudCases: number;
  violentCases: number;
}

class CrimeScopeDatabase {
  private states: StateCrimeData[] = [];
  private districts: DistrictCrimeData[] = [];
  private networkNodes: NetworkNode[] = [];
  private networkEdges: NetworkEdge[] = [];
  private sosIncidents: SOSIncident[] = [];
  private fieldIncidents: FieldOfficerIncident[] = [];
  private historicalTrends: Record<string, MonthTrend[]> = {}; // Key is state ID or 'national'

  constructor() {
    this.seedStates();
    this.seedDistricts();
    this.seedNetwork();
    this.seedHistoricalTrends();
    this.seedInitialSOS();
    this.seedInitialFieldIncidents();
  }

  private seedStates() {
    this.states = [
      {
        id: "KA",
        name: "Karnataka",
        category: "state",
        lat: 12.9716,
        lng: 77.5946,
        crimeIndex: 48,
        safetyIndex: 72,
        totalCases2025: 142050,
        majorCrimeType: "Cyber Fraud & Tech Crime",
        riskForecastIndex: 44,
        demographics: { literacyRate: 75.36, unemploymentRate: 4.2, populationDensity: 319, povertyRate: 20.91, urbanizationRate: 38.6 },
        emergencyStats: { policeStations: 1045, hospitals: 750, fireStations: 210, disasterShelters: 45 }
      },
      {
        id: "MH",
        name: "Maharashtra",
        category: "state",
        lat: 19.7515,
        lng: 75.7139,
        crimeIndex: 56,
        safetyIndex: 65,
        totalCases2025: 324100,
        majorCrimeType: "Property & Commercial Fraud",
        riskForecastIndex: 62,
        demographics: { literacyRate: 82.34, unemploymentRate: 5.6, populationDensity: 365, povertyRate: 17.35, urbanizationRate: 45.2 },
        emergencyStats: { policeStations: 1140, hospitals: 920, fireStations: 280, disasterShelters: 60 }
      },
      {
        id: "DL",
        name: "Delhi",
        category: "ut",
        lat: 28.7041,
        lng: 77.1025,
        crimeIndex: 74,
        safetyIndex: 42,
        totalCases2025: 295400,
        majorCrimeType: "Theft & Assault",
        riskForecastIndex: 78,
        demographics: { literacyRate: 86.21, unemploymentRate: 8.4, populationDensity: 11320, povertyRate: 9.91, urbanizationRate: 97.5 },
        emergencyStats: { policeStations: 210, hospitals: 410, fireStations: 65, disasterShelters: 80 }
      },
      {
        id: "TN",
        name: "Tamil Nadu",
        category: "state",
        lat: 11.1271,
        lng: 78.6569,
        crimeIndex: 41,
        safetyIndex: 82,
        totalCases2025: 168900,
        majorCrimeType: "Theft & Traffic Violations",
        riskForecastIndex: 32,
        demographics: { literacyRate: 80.09, unemploymentRate: 6.1, populationDensity: 555, povertyRate: 11.28, urbanizationRate: 48.4 },
        emergencyStats: { policeStations: 1420, hospitals: 880, fireStations: 330, disasterShelters: 120 }
      },
      {
        id: "UP",
        name: "Uttar Pradesh",
        category: "state",
        lat: 26.8467,
        lng: 80.9462,
        crimeIndex: 68,
        safetyIndex: 51,
        totalCases2025: 412500,
        majorCrimeType: "Violent Crime & Burglary",
        riskForecastIndex: 70,
        demographics: { literacyRate: 67.68, unemploymentRate: 6.9, populationDensity: 829, povertyRate: 29.43, urbanizationRate: 22.3 },
        emergencyStats: { policeStations: 1520, hospitals: 1240, fireStations: 380, disasterShelters: 95 }
      },
      {
        id: "TG",
        name: "Telangana",
        category: "state",
        lat: 18.1124,
        lng: 79.0193,
        crimeIndex: 46,
        safetyIndex: 74,
        totalCases2025: 113400,
        majorCrimeType: "Cybercrime & Fraud",
        riskForecastIndex: 48,
        demographics: { literacyRate: 66.54, unemploymentRate: 5.1, populationDensity: 312, povertyRate: 15.6, urbanizationRate: 38.9 },
        emergencyStats: { policeStations: 820, hospitals: 610, fireStations: 140, disasterShelters: 30 }
      },
      {
        id: "KL",
        name: "Kerala",
        category: "state",
        lat: 10.8505,
        lng: 76.2711,
        crimeIndex: 38,
        safetyIndex: 86,
        totalCases2025: 185200,
        majorCrimeType: "Traffic Violations & Altercations",
        riskForecastIndex: 24,
        demographics: { literacyRate: 94.00, unemploymentRate: 9.2, populationDensity: 860, povertyRate: 7.05, urbanizationRate: 47.7 },
        emergencyStats: { policeStations: 540, hospitals: 480, fireStations: 130, disasterShelters: 110 }
      },
      {
        id: "RJ",
        name: "Rajasthan",
        category: "state",
        lat: 27.0238,
        lng: 74.2179,
        crimeIndex: 59,
        safetyIndex: 60,
        totalCases2025: 224600,
        majorCrimeType: "Burglary & Fraud",
        riskForecastIndex: 55,
        demographics: { literacyRate: 66.11, unemploymentRate: 4.7, populationDensity: 200, povertyRate: 14.7, urbanizationRate: 24.9 },
        emergencyStats: { policeStations: 920, hospitals: 710, fireStations: 190, disasterShelters: 25 }
      }
    ];
  }

  private seedDistricts() {
    this.districts = [
      // Karnataka Districts
      {
        id: "KA_BLR",
        stateId: "KA",
        name: "Bengaluru Urban",
        lat: 12.9716,
        lng: 77.5946,
        crimeIndex: 54,
        safetyIndex: 68,
        outstandingCases: 1420,
        majorHotspotAreas: ["Koramangala IT Corridor", "Whitefield Suburbs", "Majestic Bus Station", "Indiranagar Nightlife Hub"],
        riskForecastIndex: 58,
        activePatrols: 145,
        demographics: { literacyRate: 87.67, unemploymentRate: 3.8, populationDensity: 4380, povertyRate: 8.5, urbanizationRate: 91.2 }
      },
      {
        id: "KA_MYS",
        stateId: "KA",
        name: "Mysuru",
        lat: 12.2958,
        lng: 76.6394,
        crimeIndex: 32,
        safetyIndex: 81,
        outstandingCases: 320,
        majorHotspotAreas: ["Palace Precincts", "Devaraja Market", "Gokulam Residential Area"],
        riskForecastIndex: 28,
        activePatrols: 42,
        demographics: { literacyRate: 72.79, unemploymentRate: 4.1, populationDensity: 413, povertyRate: 12.4, urbanizationRate: 41.5 }
      },
      {
        id: "KA_BLG",
        stateId: "KA",
        name: "Belagavi",
        lat: 15.8497,
        lng: 74.4977,
        crimeIndex: 36,
        safetyIndex: 78,
        outstandingCases: 410,
        majorHotspotAreas: ["Cantonment Area", "Shahapur Markets", "Border Transit Checkposts"],
        riskForecastIndex: 35,
        activePatrols: 35,
        demographics: { literacyRate: 73.48, unemploymentRate: 4.5, populationDensity: 356, povertyRate: 16.2, urbanizationRate: 25.3 }
      },
      {
        id: "KA_MNG",
        stateId: "KA",
        name: "Dakshina Kannada (Mangaluru)",
        lat: 12.8703,
        lng: 74.8826,
        crimeIndex: 42,
        safetyIndex: 73,
        outstandingCases: 550,
        majorHotspotAreas: ["Mangaluru Port Area", "Hampankatta Commercial Hub", "Ullal Coastzone"],
        riskForecastIndex: 40,
        activePatrols: 48,
        demographics: { literacyRate: 88.57, unemploymentRate: 5.2, populationDensity: 430, povertyRate: 10.1, urbanizationRate: 47.6 }
      },

      // Maharashtra Districts
      {
        id: "MH_MUM",
        stateId: "MH",
        name: "Mumbai City",
        lat: 18.9750,
        lng: 72.8258,
        crimeIndex: 61,
        safetyIndex: 60,
        outstandingCases: 3850,
        majorHotspotAreas: ["Dharavi Transit Point", "Kurla Junction Area", "Colaba Tourist Zone", "Bandra Financial District"],
        riskForecastIndex: 65,
        activePatrols: 210,
        demographics: { literacyRate: 89.21, unemploymentRate: 6.2, populationDensity: 21000, povertyRate: 11.3, urbanizationRate: 100.0 }
      },
      {
        id: "MH_PUN",
        stateId: "MH",
        name: "Pune",
        lat: 18.5204,
        lng: 73.8567,
        crimeIndex: 46,
        safetyIndex: 72,
        outstandingCases: 1150,
        majorHotspotAreas: ["Hinjawadi IT Park", "Swargate Transport Hub", "Koregaon Park Suburbs"],
        riskForecastIndex: 48,
        activePatrols: 92,
        demographics: { literacyRate: 86.15, unemploymentRate: 5.0, populationDensity: 603, povertyRate: 14.1, urbanizationRate: 61.0 }
      },
      {
        id: "MH_NGP",
        stateId: "MH",
        name: "Nagpur",
        lat: 21.1458,
        lng: 79.0882,
        crimeIndex: 55,
        safetyIndex: 64,
        outstandingCases: 950,
        majorHotspotAreas: ["Sitabuldi Market", "Nagpur Junction Area", "Kamptee Toll Corridor"],
        riskForecastIndex: 57,
        activePatrols: 60,
        demographics: { literacyRate: 88.39, unemploymentRate: 5.8, populationDensity: 470, povertyRate: 18.2, urbanizationRate: 54.3 }
      },

      // Delhi Districts
      {
        id: "DL_NEW",
        stateId: "DL",
        name: "New Delhi (CP & Central)",
        lat: 28.6304,
        lng: 77.2177,
        crimeIndex: 64,
        safetyIndex: 52,
        outstandingCases: 1980,
        majorHotspotAreas: ["Connaught Place Outer Circle", "Rajpath Crossings", "Pahar Ganj Backalleys"],
        riskForecastIndex: 62,
        activePatrols: 110,
        demographics: { literacyRate: 89.38, unemploymentRate: 7.9, populationDensity: 9300, povertyRate: 7.2, urbanizationRate: 100.0 }
      },
      {
        id: "DL_SOU",
        stateId: "DL",
        name: "South Delhi",
        lat: 28.5621,
        lng: 77.2281,
        crimeIndex: 58,
        safetyIndex: 59,
        outstandingCases: 1220,
        majorHotspotAreas: ["Hauz Khas Social Enclave", "Saket Malls Complex", "Sangam Vihar Fringe"],
        riskForecastIndex: 60,
        activePatrols: 85,
        demographics: { literacyRate: 88.10, unemploymentRate: 8.1, populationDensity: 10900, povertyRate: 8.4, urbanizationRate: 100.0 }
      },
      {
        id: "DL_NOR",
        stateId: "DL",
        name: "North East Delhi",
        lat: 28.6872,
        lng: 77.2842,
        crimeIndex: 78,
        safetyIndex: 35,
        outstandingCases: 2450,
        majorHotspotAreas: ["Seelampur Wholesale Market", "Shahdara Boundary Area", "Dilshad Garden Metro Station"],
        riskForecastIndex: 82,
        activePatrols: 75,
        demographics: { literacyRate: 83.12, unemploymentRate: 9.4, populationDensity: 36150, povertyRate: 16.5, urbanizationRate: 100.0 }
      }
    ];
  }

  private seedNetwork() {
    // 10 nodes depicting an organized Cyber Fraud & Vehicle Theft Syndicate (primarily Bengaluru & Noida)
    this.networkNodes = [
      { id: "sus_arjun", label: "Arjun Rao", type: "suspect", role: "Kingpin", riskScore: 94, associatedCrime: "Bank API Spoofing & Vehicle Lifting Orchestration" },
      { id: "sus_vikas", label: "Vikas 'Bunty' Sharma", type: "suspect", role: "Operator", riskScore: 88, associatedCrime: "SIM Swap Coordination & KYC Spoofing" },
      { id: "sus_priya", label: "Priya Nair", type: "suspect", role: "Mule", riskScore: 72, associatedCrime: "Mule Bank Account Sourcing" },
      { id: "sus_rohit", label: "Rohit 'Kalia' Kumar", type: "suspect", role: "Runner", riskScore: 85, associatedCrime: "Chassis Alteration & Transport" },
      
      { id: "ph_vip_1", label: "+91-98765-43210", type: "phone", riskScore: 90, associatedCrime: "Primary coordination line for burner phones" },
      { id: "ph_vip_2", label: "+91-91234-56789", type: "phone", riskScore: 78, associatedCrime: "KYC registered spoof burner active in Jamtara" },
      
      { id: "veh_bolero", label: "White Bolero (DL-3C-AS-4412)", type: "vehicle", riskScore: 82, associatedCrime: "Linked to heist escapes in Noida & Jaipur" },
      { id: "veh_scorpio", label: "Black Scorpio (KA-03-MR-9080)", type: "vehicle", riskScore: 89, associatedCrime: "Registered owner using stolen identity, spotted in Bengaluru" },
      
      { id: "loc_noida_safe", label: "Noida Sector-62 Safehouse", type: "address", riskScore: 85, associatedCrime: "SIM farm hosting site" },
      { id: "bank_corp", label: "ICICI Corporate A/C (..88219)", type: "bank_account", riskScore: 91, associatedCrime: "Escrow proxy account receiving phishing yields" }
    ];

    // Edges reflecting cross connections between vehicle thefts and cyber crimes
    this.networkEdges = [
      { id: "e1", source: "sus_arjun", target: "sus_vikas", type: "co_arrest", weight: 5, description: "Arrested together in 2024 at Noida Cyber Cell heist" },
      { id: "e2", source: "sus_arjun", target: "ph_vip_1", type: "shared_call", weight: 4, description: "High-frequency calls (35 logs) recorded using encrypted IMEI tracker" },
      { id: "e3", source: "sus_vikas", target: "sus_priya", type: "money_transfer", weight: 4, description: "Transferred ₹4,50,000 to Priya's proxy accounts" },
      { id: "e4", source: "sus_priya", target: "bank_corp", type: "money_transfer", weight: 5, description: "Direct nominee controller of the corporate escrow mule account" },
      { id: "e5", source: "sus_arjun", target: "veh_scorpio", type: "shared_vehicle", weight: 3, description: "Spotted piloting Scorpio at toll Booths near Devanahalli Airport" },
      { id: "e6", source: "sus_rohit", target: "veh_scorpio", type: "shared_vehicle", weight: 5, description: "Caught on CCTV altering chassis stamps inside garage vehicle" },
      { id: "e7", source: "sus_rohit", target: "veh_bolero", type: "shared_vehicle", weight: 4, description: "Drove Bolero to cross state lines for resale" },
      { id: "e8", source: "sus_vikas", target: "loc_noida_safe", type: "shared_location", weight: 4, description: "GPS tracking matched cell-tower overlaps near safehouse coordinates" },
      { id: "e9", source: "ph_vip_2", target: "loc_noida_safe", type: "shared_location", weight: 3, description: "Burner signal registered concurrently within safehouse radius" },
      { id: "e10", source: "sus_vikas", target: "ph_vip_2", type: "shared_call", weight: 5, description: "Incoming call forwarding routes routed directly to phone 2" }
    ];
  }

  private seedHistoricalTrends() {
    // Generate realistic monthly crime fluctuations for India (increasing cybercrime and seasonal theft during festivals like Diwali in Oct/Nov)
    const baselineKA: MonthTrend[] = [
      { month: "Jan 25", theftCases: 1200, cybercrimeCases: 800, fraudCases: 600, violentCases: 300 },
      { month: "Feb 25", theftCases: 1150, cybercrimeCases: 850, fraudCases: 620, violentCases: 290 },
      { month: "Mar 25", theftCases: 1250, cybercrimeCases: 910, fraudCases: 680, violentCases: 310 },
      { month: "Apr 25", theftCases: 1300, cybercrimeCases: 990, fraudCases: 710, violentCases: 320 },
      { month: "May 25", theftCases: 1400, cybercrimeCases: 1100, fraudCases: 750, violentCases: 340 },
      { month: "Jun 25", theftCases: 1350, cybercrimeCases: 1150, fraudCases: 780, violentCases: 350 },
      { month: "Jul 25", theftCases: 1380, cybercrimeCases: 1210, fraudCases: 820, violentCases: 360 },
      { month: "Aug 25", theftCases: 1420, cybercrimeCases: 1300, fraudCases: 850, violentCases: 380 },
      { month: "Sep 25", theftCases: 1490, cybercrimeCases: 1380, fraudCases: 890, violentCases: 390 },
      { month: "Oct 25", theftCases: 1850, cybercrimeCases: 1450, fraudCases: 950, violentCases: 410 }, // Festival surge (Diwali/Dasara)
      { month: "Nov 25", theftCases: 1720, cybercrimeCases: 1520, fraudCases: 990, violentCases: 390 },
      { month: "Dec 25", theftCases: 1500, cybercrimeCases: 1610, fraudCases: 1040, violentCases: 370 },
      { month: "Jan 26", theftCases: 1350, cybercrimeCases: 1750, fraudCases: 1120, violentCases: 320 }, // Cybercrime continues climbing
      { month: "Feb 26", theftCases: 1310, cybercrimeCases: 1840, fraudCases: 1190, violentCases: 310 },
      { month: "Mar 26", theftCases: 1390, cybercrimeCases: 1980, fraudCases: 1250, violentCases: 330 },
      { month: "Apr 26", theftCases: 1420, cybercrimeCases: 2120, fraudCases: 1310, violentCases: 340 },
      { month: "May 26", theftCases: 1510, cybercrimeCases: 2310, fraudCases: 1420, violentCases: 360 },
      { month: "Jun 26", theftCases: 1550, cybercrimeCases: 2450, fraudCases: 1490, violentCases: 370 }
    ];

    this.historicalTrends["KA"] = baselineKA;

    // Generate for other states scaling with population
    this.states.forEach(s => {
      if (s.id !== "KA") {
        const mul = s.id === "DL" ? 1.2 : s.id === "MH" ? 2.1 : s.id === "UP" ? 2.8 : 1.0;
        this.historicalTrends[s.id] = baselineKA.map(t => ({
          month: t.month,
          theftCases: Math.round(t.theftCases * mul * 0.9),
          cybercrimeCases: Math.round(t.cybercrimeCases * mul * (s.id === "DL" ? 1.5 : 0.7)),
          fraudCases: Math.round(t.fraudCases * mul * 0.85),
          violentCases: Math.round(t.violentCases * mul * (s.id === "UP" ? 1.8 : s.id === "KL" ? 0.4 : 1.0))
        }));
      }
    });

    // Populate national average
    const national: MonthTrend[] = [];
    for (let i = 0; i < baselineKA.length; i++) {
      const month = baselineKA[i].month;
      let theft = 0, cyber = 0, fraud = 0, violent = 0;
      Object.keys(this.historicalTrends).forEach(sid => {
        const sTrend = this.historicalTrends[sid][i];
        theft += sTrend.theftCases;
        cyber += sTrend.cybercrimeCases;
        fraud += sTrend.fraudCases;
        violent += sTrend.violentCases;
      });
      national.push({ month, theftCases: theft, cybercrimeCases: cyber, fraudCases: fraud, violentCases: violent });
    }
    this.historicalTrends["national"] = national;
  }

  private seedInitialSOS() {
    this.sosIncidents = [
      {
        id: "SOS_001",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        callerPhone: "+91-98800-41235",
        state: "KA",
        district: "Bengaluru Urban",
        locationDetails: "Opposite Forum Mall petrol bunk, Koramangala",
        lat: 12.9345,
        lng: 77.6101,
        classification: "Women Safety",
        priority: "Critical",
        status: "responder_en_route",
        assignedResource: {
          policeStation: "Koramangala Police Station (0.8 km)",
          hospital: "St. John's Medical College Hospital (1.2 km)",
          distanceKm: 0.8,
          etaMinutes: 4
        }
      },
      {
        id: "SOS_002",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
        callerPhone: "+91-81055-90800",
        state: "KA",
        district: "Bengaluru Urban",
        locationDetails: "Whitefield flyover leading towards Hope Farm",
        lat: 12.9698,
        lng: 77.7499,
        classification: "Road Accident",
        priority: "Critical",
        status: "dispatching"
      },
      {
        id: "SOS_003",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        callerPhone: "+91-94480-11122",
        state: "MH",
        district: "Mumbai City",
        locationDetails: "Dharavi Junction, Near Metro Slabs",
        lat: 19.0380,
        lng: 72.8538,
        classification: "Theft/Burglary",
        priority: "Medium",
        status: "resolved",
        assignedResource: {
          policeStation: "Dharavi Police Station (1.4 km)",
          distanceKm: 1.4,
          etaMinutes: 8
        }
      }
    ];
  }

  private seedInitialFieldIncidents() {
    this.fieldIncidents = [
      {
        id: "FLD_001",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        officerId: "PS_KA_9882",
        officerName: "Sub-Inspector Sandeep Patil",
        district: "Bengaluru Urban",
        latitude: 12.9754,
        longitude: 77.5891,
        category: "CCTV Blindspot Spotted",
        severity: "Low",
        description: "Primary cameras overlooking Majestic underground exit are obstructed by advertising banners. Leads to surveillance gap.",
        actionTaken: "Issued notice to BBMP municipal office to clear visual range within 48 hours."
      },
      {
        id: "FLD_002",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        officerId: "PS_DL_0045",
        officerName: "Inspector Ramesh Kumar",
        district: "North East Delhi",
        latitude: 28.6923,
        longitude: 77.2912,
        category: "Emerging Assembly",
        severity: "High",
        description: "Group of suspected burner distributors assembling around Seelampur Wholesale market block. Unregistered SIM card activation suspected.",
        actionTaken: "Conducted decoy raid. Recovered 45 pre-activated KYC-fraud SIM cards. 2 suspects detained for verification."
      }
    ];
  }

  // API operations
  public getStates(): StateCrimeData[] {
    return this.states;
  }

  public getDistricts(stateId: string): DistrictCrimeData[] {
    return this.districts.filter(d => d.stateId === stateId);
  }

  public getNetwork() {
    return {
      nodes: this.networkNodes,
      edges: this.networkEdges
    };
  }

  public getTrends(scopeId: string): MonthTrend[] {
    return this.historicalTrends[scopeId] || this.historicalTrends["national"];
  }

  public getSOSList(): SOSIncident[] {
    return this.sosIncidents;
  }

  public submitSOS(sosData: Omit<SOSIncident, "id" | "timestamp" | "status" | "assignedResource">): SOSIncident {
    const id = `SOS_${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();
    
    // Auto-calculate realistic nearby safety resources based on Indian GIS bounds
    const distanceKm = parseFloat((0.5 + Math.random() * 3.5).toFixed(1));
    const etaMinutes = Math.round(distanceKm * 3.5);
    
    const assignedResource = {
      policeStation: `Nearest Sector Station (${distanceKm} km)`,
      hospital: sosData.classification === "Road Accident" || sosData.classification === "Assault/Violence" 
        ? `Sanjay Gandhi Emergency Trauma Center (${(distanceKm+1).toFixed(1)} km)`
        : undefined,
      distanceKm,
      etaMinutes
    };

    const newSos: SOSIncident = {
      ...sosData,
      id,
      timestamp,
      status: "triggered",
      assignedResource
    };

    // Unshift to place latest SOS at the top
    this.sosIncidents.unshift(newSos);
    return newSos;
  }

  public updateSOSStatus(id: string, status: SOSIncident["status"]): SOSIncident | null {
    const sos = this.sosIncidents.find(s => s.id === id);
    if (sos) {
      sos.status = status;
      return sos;
    }
    return null;
  }

  public getFieldIncidents(): FieldOfficerIncident[] {
    return this.fieldIncidents;
  }

  public submitFieldIncident(incident: Omit<FieldOfficerIncident, "id" | "timestamp">): FieldOfficerIncident {
    const id = `FLD_${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();
    
    const newIncident: FieldOfficerIncident = {
      ...incident,
      id,
      timestamp
    };

    this.fieldIncidents.unshift(newIncident);
    return newIncident;
  }
}

export const dbInstance = new CrimeScopeDatabase();
