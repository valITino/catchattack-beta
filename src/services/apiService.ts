
/**
 * Re-export all service modules
 */
export { emulationService } from './emulationService';
export { rulesService } from './rulesService';
export { siemService } from './siemService';
export { scheduleService } from './scheduleService';
export { statusService } from './statusService';
export { tenantService } from './tenantService';
export { aiService } from './aiService';
export { backendService } from './backendService';

/**
 * For backward compatibility, export all services under a single namespace
 * This allows existing code to continue using apiService.x without breaking changes
 * but is deprecated and should be replaced with direct imports of the specific services
 * @deprecated Use individual service modules instead
 */
import { emulationService } from './emulationService';
import { rulesService } from './rulesService';
import { siemService } from './siemService';
import { scheduleService } from './scheduleService';
import { statusService } from './statusService';
import { tenantService } from './tenantService';
import { aiService } from './aiService';
import { backendService } from './backendService';

export const apiService = {
  ...emulationService,
  ...rulesService,
  ...siemService,
  ...scheduleService,
  ...statusService,
  ...tenantService,
  ...aiService,
  ...backendService,
};
