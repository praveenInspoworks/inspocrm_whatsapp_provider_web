// components/crm/DynamicSidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3, Users, Target, CheckSquare, MessageSquare, Settings,
  Building, TrendingUp, Calendar, FileText, UserPlus, GitBranch,
  Quote, DollarSign, Phone, Mail, Activity, FolderOpen, Bell,
  Search, Sliders, UsersIcon, Shield, Wand2, Volume2, Megaphone,
  Users2, PenTool, HelpCircle, Database, Menu, Home
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { useMenuAccess } from "@/hooks/useMenuAccess";

// Types for the menu system
interface MenuItem {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: string;
  url: string;
  icon: string;
  sortOrder: number;
  requiresPermission: string;
  menuCode: string;
  menuName: string;
  parentId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface MenuGroup {
  menuCode: string;
  menuName: string;
  description?: string;
  icon: string;
  sortOrder: number;
  accessibleMenus: MenuItem[];
}

// Icon mapping for dynamic menu items
const iconMap = {
  'bar-chart-3': BarChart3,
  'users': Users,
  'target': Target,
  'check-square': CheckSquare,
  'message-square': MessageSquare,
  'building': Building,
  'trending-up': TrendingUp,
  'calendar': Calendar,
  'file-text': FileText,
  'user-plus': UserPlus,
  'git-branch': GitBranch,
  'quote': Quote,
  'dollar-sign': DollarSign,
  'phone': Phone,
  'mail': Mail,
  'activity': Activity,
  'folder-open': FolderOpen,
  'bell': Bell,
  'sliders': Sliders,
  'users-icon': UsersIcon,
  'shield': Shield,
  'wand-2': Wand2,
  'volume-2': Volume2,
  'megaphone': Megaphone,
  'users-2': Users2,
  'pen-tool': PenTool,
  'database': Database,
  'menu': Menu,
  'home': Home
};

export function DynamicSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const { userMenu, isLoading, getMenuItemsByGroup } = useMenuAccess();

  // Menu group labels mapping
  const menuGroupLabels: Record<string, string> = {
    'MAIN_NAV': 'Main Navigation',
    'SALES': 'Sales Pipeline',
    'COMMUNICATIONS': 'Communications',
    'AI_MARKETING': 'AI Marketing',
    'SOCIAL_MEDIA': 'Social Media',
    'BUSINESS_INTEL': 'Business Intelligence',
    'ADMINISTRATION': 'Administration',
    'MASTERS': 'Masters Data'
  };

  if (isLoading) {
    return (
      <Sidebar className={`${collapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 transition-all duration-300 font-sans`}>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 transition-all duration-300 font-sans`} collapsible="icon">
      {/* Logo Header */}
      <div className="px-6 py-8">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-xl text-gray-900 leading-tight">INSPOCRM</h1>
              <p className="text-sm text-gray-600 font-normal">Enterprise</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      <SidebarContent className="px-6 py-2 space-y-8">
        {/* Current Location Indicator */}
        {!collapsed && location.pathname !== '/' && (
          <div className="px-3 py-2 bg-blue-50 border-l-4 border-blue-600 rounded-r-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">
                Current: {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>
        )}

        {/* Render menu groups dynamically */}
        {userMenu?.map((menuGroup: MenuGroup) => {
          const menuItems = getMenuItemsByGroup(menuGroup.menuCode);

          if (menuItems.length === 0) return null;

          return (
            <SidebarGroup key={menuGroup.menuCode}>
              <SidebarGroupLabel className={`${collapsed ? "sr-only" : "px-0 text-sm font-normal text-gray-600 mb-4"}`}>
                {menuGroupLabels[menuGroup.menuCode] || menuGroup.menuName}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {menuItems
                    .sort((a: MenuItem, b: MenuItem) => a.sortOrder - b.sortOrder)
                    .map((item: MenuItem) => {
                      const IconComponent = iconMap[item.icon as keyof typeof iconMap] || HelpCircle;

                      return (
                        <SidebarMenuItem key={item.itemCode}>
                          <SidebarMenuButton asChild className="p-0">
                            <NavLink
                              to={item.url}
                              end
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-normal transition-all duration-200 relative ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 shadow-sm'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <div className="flex items-center justify-center w-5 h-5">
                                    <IconComponent className="w-5 h-5" />
                                  </div>
                                  {!collapsed && (
                                    <div className="flex items-center justify-between flex-1">
                                      <span className="text-base font-normal">{item.itemName}</span>
                                      {/* Active indicator dot */}
                                      {isActive && (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* Show message if no menus available */}
        {userMenu?.length === 0 && !isLoading && (
          <div className="px-6 py-4 text-center text-gray-500">
            <p className="text-sm">No menu items available</p>
            <p className="text-xs">Contact administrator for access</p>
          </div>
        )}
      </SidebarContent>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-normal text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer">
          <div className="flex items-center justify-center w-5 h-5">
            <HelpCircle className="w-5 h-5" />
          </div>
          {!collapsed && <span>Help</span>}
        </div>
      </div>
    </Sidebar>
  );
}
