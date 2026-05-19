
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { tenantService } from '@/services/tenantService';
import { setCurrentTenantId, getCurrentTenantId } from '@/utils/supabase';
import { toast } from '@/components/ui/use-toast';

interface Tenant {
  id: string;
  name: string;
  description?: string;
  role: 'admin' | 'analyst' | 'viewer';
}

export function TenantSelector() {
  const [open, setOpen] = useState(false);
  const [showNewTenantDialog, setShowNewTenantDialog] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTenantData, setNewTenantData] = useState({ name: '', description: '' });

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const tenantsList = await tenantService.getUserTenants();
        setTenants(tenantsList);
        
        // Select the current tenant from local storage or use the first one
        const currentTenantId = getCurrentTenantId();
        const currentTenant = currentTenantId 
          ? tenantsList.find(t => t.id === currentTenantId) 
          : tenantsList[0];
        
        if (currentTenant) {
          setSelectedTenant(currentTenant);
          setCurrentTenantId(currentTenant.id);
        }
        
      } catch (error) {
        console.error('Failed to load tenants:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tenants. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  const handleTenantChange = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setCurrentTenantId(tenant.id);
    setOpen(false);
    
    // Refresh the page to update data for the new tenant
    window.location.reload();
  };

  const handleCreateTenant = async () => {
    if (!newTenantData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Tenant name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await tenantService.createTenant({
        name: newTenantData.name.trim(),
        description: newTenantData.description.trim() || undefined,
      });

      // Fetch the updated tenant list
      const updatedTenants = await tenantService.getUserTenants();
      setTenants(updatedTenants);

      // Find and select the newly created tenant
      const newTenant = updatedTenants.find(t => t.id === result.id);
      if (newTenant) {
        handleTenantChange(newTenant);
      }

      setShowNewTenantDialog(false);
      setNewTenantData({ name: '', description: '' });

      toast({
        title: 'Success',
        description: 'Tenant created successfully',
      });

    } catch (error) {
      console.error('Failed to create tenant:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tenant. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <Button variant="outline" disabled>Loading tenants...</Button>;
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {selectedTenant ? selectedTenant.name : "Select tenant..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search tenant..." />
            <CommandList>
              <CommandEmpty>No tenant found.</CommandEmpty>
              <CommandGroup>
                {tenants.map((tenant) => (
                  <CommandItem
                    key={tenant.id}
                    value={tenant.name}
                    onSelect={() => handleTenantChange(tenant)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTenant?.id === tenant.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tenant.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowNewTenantDialog(true);
                  }}
                  className="cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Tenant
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewTenantDialog} onOpenChange={setShowNewTenantDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Add a new tenant to manage isolated detection environments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newTenantData.name}
                onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newTenantData.description}
                onChange={(e) => setNewTenantData({ ...newTenantData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewTenantDialog(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTenant}>
              Create Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TenantSelector;
