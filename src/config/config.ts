
/**
 * Centralized configuration settings
 * In a real environment, these would typically be loaded from environment variables
 */

// Base API URL for backend requests
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Feature flags
export const FEATURES = {
  AI_RULE_GENERATION: true,
  SIEM_INTEGRATION: true,
  EMULATION_ENGINE: true,
  ADVANCED_ANALYTICS: false // Example of a feature still in development
};

// UI Configuration
export const UI_CONFIG = {
  THEME: {
    DEFAULT_MODE: 'dark',
    PRIMARY_COLOR: 'cyber-primary',
    ALLOW_USER_CUSTOMIZATION: true
  },
  NAVIGATION: {
    SIDEBAR_COLLAPSED_DEFAULT: false
  },
  TOOLTIPS: {
    ENABLED: true,
    DELAY: 300
  }
};

// SIEM Platform Configuration
export const SIEM_CONFIG = {
  SUPPORTED_PLATFORMS: [
    { id: 'elastic', name: 'Elasticsearch', logo: 'elastic.svg' },
    { id: 'splunk', name: 'Splunk', logo: 'splunk.svg' },
    { id: 'sentinel', name: 'Microsoft Sentinel', logo: 'sentinel.svg' },
    { id: 'qradar', name: 'IBM QRadar', logo: 'qradar.svg' }
  ],
  DEFAULT_RETRY_ATTEMPTS: 3,
  CONNECTION_TIMEOUT: 30000 // ms
};

// AI Model Configuration
export const AI_CONFIG = {
  RULE_GENERATION: {
    MIN_CONFIDENCE_SCORE: 0.7,
    MODEL: 'advanced',
    MAX_GENERATIONS_PER_REQUEST: 10
  },
  ANOMALY_DETECTION: {
    THRESHOLD: 0.85,
    USE_HISTORICAL_DATA: true
  }
};

export const TESTING_MODE = import.meta.env.VITE_TESTING_MODE === 'true';

// Export a default config object with all settings
export default {
  API_BASE_URL,
  FEATURES,
  UI_CONFIG,
  SIEM_CONFIG,
  AI_CONFIG,
  TESTING_MODE
};
