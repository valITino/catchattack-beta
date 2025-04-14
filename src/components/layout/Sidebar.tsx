
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Shield,
  FileCode,
  AlertTriangle,
  MonitorDot,
  Settings,
  Zap,
  Code2,
  Network,
  GitBranch,
  PlaySquare
} from 'lucide-react';

export type SidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  collapsed?: boolean;
  setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Sidebar = ({ className, collapsed, setCollapsed }: SidebarProps) => {
  const navItems = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/'
    },
    {
      name: 'Detection Center',
      icon: <Shield className="h-5 w-5" />,
      path: '/detection'
    },
    {
      name: 'Rules',
      icon: <FileCode className="h-5 w-5" />,
      path: '/rules'
    },
    {
      name: 'Incidents',
      icon: <AlertTriangle className="h-5 w-5" />,
      path: '/incidents'
    },
    {
      name: 'SIEM Integration',
      icon: <MonitorDot className="h-5 w-5" />,
      path: '/siem'
    },
    {
      name: 'Emulation',
      icon: <PlaySquare className="h-5 w-5" />,
      path: '/emulation'
    },
    {
      name: 'Sigma Generator',
      icon: <Code2 className="h-5 w-5" />,
      path: '/sigma'
    },
    {
      name: 'Infrastructure',
      icon: <Network className="h-5 w-5" />,
      path: '/infrastructure'
    },
    {
      name: 'Automation',
      icon: <Zap className="h-5 w-5" />,
      path: '/automation'
    },
    {
      name: 'Marketplace',
      icon: <GitBranch className="h-5 w-5" />,
      path: '/marketplace'
    },
    {
      name: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings'
    },
  ];

  return (
    <div className={cn('pb-12 h-full', className, collapsed ? 'w-16' : 'w-64')}>
      <div className="space-y-4 py-4">
        <div className="py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center py-2 px-3 mx-3 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    'transition-all'
                  )
                }
              >
                {item.icon}
                {!collapsed && <span className="ml-3 flex-1">{item.name}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
