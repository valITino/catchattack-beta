
import React from 'react';
import { Building } from 'lucide-react';
import TenantSelector from '@/components/tenant/TenantSelector';

export function TenantHeader() {
  return (
    <div className="flex items-center space-x-2">
      <Building className="h-5 w-5 text-cyber-primary" />
      <span className="text-sm font-medium">Tenant:</span>
      <TenantSelector />
    </div>
  );
}

export default TenantHeader;
