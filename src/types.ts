/**
 * CrimeScope AI - Client Shared TypeScript Definitions
 */

export interface DemographicCorrelation {
  literacyRate: number;
  unemploymentRate: number;
  populationDensity: number;
  povertyRate: number;
  urbanizationRate: number;
}

export interface StateCrimeData {
  id: string;
  name: string;
  category: "state" | "ut";
  lat: number;
  lng: number;
  crimeIndex: number;
  safetyIndex: number;
  totalCases2025: number;
  majorCrimeType: string;
  riskForecastIndex: number;
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
  riskScore: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: "shared_call" | "shared_vehicle" | "shared_location" | "co_arrest" | "money_transfer";
  weight: number;
  description: string;
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

export interface MonthTrend {
  month: string;
  theftCases: number;
  cybercrimeCases: number;
  fraudCases: number;
  violentCases: number;
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
