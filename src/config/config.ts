
/**
 * Centralized configuration settings with better organization and TypeScript typing
 */

// Types for configuration objects
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

interface FeatureFlags {
  aiRuleGeneration: boolean;
  siemIntegration: boolean;
  emulationEngine: boolean;
  advancedAnalytics: boolean;
}

interface UiConfig {
  theme: {
    defaultMode: 'light' | 'dark';
    primaryColor: string;
    allowUserCustomization: boolean;
  };
  navigation: {
    sidebarCollapsedDefault: boolean;
  };
  tooltips: {
    enabled: boolean;
    delay: number;
  };
}

interface SiemConfig {
  supportedPlatforms: Array<{
    id: string;
    name: string;
    logo: string;
  }>;
  defaultRetryAttempts: number;
  connectionTimeout: number;
}

interface AiConfig {
  ruleGeneration: {
    minConfidenceScore: number;
    model: string;
    maxGenerationsPerRequest: number;
  };
  anomalyDetection: {
    threshold: number;
    useHistoricalData: boolean;
  };
}

// Base API URL for backend requests
export const API_CONFIG: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3
};

// Feature flags
export const FEATURES: FeatureFlags = {
  aiRuleGeneration: true,
  siemIntegration: true,
  emulationEngine: true,
  advancedAnalytics: import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS === 'true' || false
};

// UI Configuration
export const UI_CONFIG: UiConfig = {
  theme: {
    defaultMode: 'dark',
    primaryColor: 'cyber-primary',
    allowUserCustomization: true
  },
  navigation: {
    sidebarCollapsedDefault: false
  },
  tooltips: {
    enabled: true,
    delay: 300
  }
};

// SIEM Platform Configuration
export const SIEM_CONFIG: SiemConfig = {
  supportedPlatforms: [
    { id: 'elastic', name: 'Elasticsearch', logo: 'elastic.svg' },
    { id: 'splunk', name: 'Splunk', logo: 'splunk.svg' },
    { id: 'sentinel', name: 'Microsoft Sentinel', logo: 'sentinel.svg' },
    { id: 'qradar', name: 'IBM QRadar', logo: 'qradar.svg' }
  ],
  defaultRetryAttempts: 3,
  connectionTimeout: 30000 // ms
};

// AI Model Configuration
export const AI_CONFIG: AiConfig = {
  ruleGeneration: {
    minConfidenceScore: 0.7,
    model: 'advanced',
    maxGenerationsPerRequest: 10
  },
  anomalyDetection: {
    threshold: 0.85,
    useHistoricalData: true
  }
};

// Testing mode flag
export const TESTING_MODE = import.meta.env.VITE_TESTING_MODE === 'true';

// Export a default config object with all settings
export default {
  API: API_CONFIG,
  FEATURES,
  UI: UI_CONFIG,
  SIEM: SIEM_CONFIG,
  AI: AI_CONFIG,
  TESTING_MODE
};
