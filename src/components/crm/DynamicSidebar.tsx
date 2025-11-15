// components/crm/DynamicSidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import {
  Users, MessageSquare,
  Building, UserPlus,
  Megaphone, Users2, HelpCircle, Database, Home, Settings, Zap
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
import { useAuth } from "@/hooks/use-auth";

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
  'message-square': MessageSquare,
  'megaphone': Megaphone,
  'home': Home,
  'database': Database,
  'users': Users,
  'building': Building,
  'users-2': Users2,
  'user-plus': UserPlus,
  'settings': Settings,
  'zap': Zap
};

export function DynamicSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const { user } = useAuth();

  // Check if user has admin role
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ADMINISTRATOR');

  // Hardcoded menu structure
  const menuGroups = [
    {

      menuCode: 'DASHBOARD',
      menuName: 'Dashboard',
      description: 'Overview and insights',
      icon: 'home',
      sortOrder: 0,
      accessibleMenus: [
        {
          id: 'dashboard',
          itemCode: 'DASHBOARD',
          itemName: 'Dashboard',
          itemType: 'LINK',
          url: '/',
          icon: 'home',
          sortOrder: 0,
          requiresPermission: 'READ',
          menuCode: 'DASHBOARD',
          menuName: 'Dashboard',
          parentId: null,
          status: 'ACTIVE' as const
        }
      ]
    },
    {
      menuCode: 'WHATSAPP',
      menuName: 'WhatsApp',
      description: 'WhatsApp messaging tools',
      icon: 'message-square',
      sortOrder: 1,
      accessibleMenus: [
        {
          id: 'message-templates',
          itemCode: 'MESSAGE_TEMPLATES',
          itemName: 'Message Templates',
          itemType: 'LINK',
          url: '/whatsapp/templates',
          icon: 'message-square',
          sortOrder: 1,
          requiresPermission: 'READ',
          menuCode: 'WHATSAPP',
          menuName: 'WhatsApp',
          parentId: null,
          status: 'ACTIVE' as const
        },
        {
          id: 'campaigns',
          itemCode: 'CAMPAIGNS',
          itemName: 'Campaigns',
          itemType: 'LINK',
          url: '/campaigns',
          icon: 'megaphone',
          sortOrder: 2,
          requiresPermission: 'READ',
          menuCode: 'WHATSAPP',
          menuName: 'WhatsApp',
          parentId: null,
          status: 'ACTIVE' as const
        },
        {
          id: 'whatsapp-setup',
          itemCode: 'WHATSAPP_SETUP',
          itemName: 'WhatsApp Business Setup',
          itemType: 'LINK',
          url: '/whatsapp/setup',
          icon: 'home',
          sortOrder: 3,
          requiresPermission: 'READ',
          menuCode: 'WHATSAPP',
          menuName: 'WhatsApp',
          parentId: null,
          status: 'ACTIVE' as const
        },
        {
          id: 'api-guide',
          itemCode: 'API_GUIDE',
          itemName: 'API Guide',
          itemType: 'LINK',
          url: '/whatsapp/api-guide',
          icon: 'database',
          sortOrder: 4,
          requiresPermission: 'READ',
          menuCode: 'WHATSAPP',
          menuName: 'WhatsApp',
          parentId: null,
          status: 'ACTIVE' as const
        },
        {
          id: 'webhook',
          itemCode: 'WEBHOOK',
          itemName: 'Webhook',
          itemType: 'LINK',
          url: '/whatsapp/webhook-messages',
          icon: 'zap',
          sortOrder: 5,
          requiresPermission: 'READ',
          menuCode: 'WHATSAPP',
          menuName: 'WhatsApp',
          parentId: null,
          status: 'ACTIVE' as const
        }
      ]
    },
    {
      menuCode: 'CRM',
      menuName: 'CRM',
      description: 'Customer relationship management',
      icon: 'users',
      sortOrder: 2,
      accessibleMenus: [
        {
          id: 'contacts',
          itemCode: 'CONTACTS',
          itemName: 'Contacts',
          itemType: 'LINK',
          url: '/contacts',
          icon: 'users',
          sortOrder: 1,
          requiresPermission: 'READ',
          menuCode: 'CRM',
          menuName: 'CRM',
          parentId: null,
          status: 'ACTIVE' as const
        },
        {
          id: 'companies',
          itemCode: 'COMPANIES',
          itemName: 'Companies',
          itemType: 'LINK',
          url: '/companies',
          icon: 'building',
          sortOrder: 2,
          requiresPermission: 'READ',
          menuCode: 'CRM',
          menuName: 'CRM',
          parentId: null,
          status: 'ACTIVE' as const
        }
      ]
    },
    {
      menuCode: 'SYSTEM',
      menuName: 'System Settings',
      description: 'System administration',
      icon: 'settings',
      sortOrder: 3,
      accessibleMenus: [
        ...(isAdmin ? [{
          id: 'team-members',
          itemCode: 'TEAM_MEMBERS',
          itemName: 'Team Members',
          itemType: 'LINK',
          url: '/team/members',
          icon: 'users-2',
          sortOrder: 1,
          requiresPermission: 'READ',
          menuCode: 'SYSTEM',
          menuName: 'System Settings',
          parentId: null,
          status: 'ACTIVE' as const
        }] : []),
        ...(isAdmin ? [{
          id: 'list-values',
          itemCode: 'LIST_VALUES',
          itemName: 'List Values',
          itemType: 'LINK',
          url: '/masters/list-values',
          icon: 'database',
          sortOrder: 2,
          requiresPermission: 'READ',
          menuCode: 'SYSTEM',
          menuName: 'System Settings',
          parentId: null,
          status: 'ACTIVE' as const
        }] : []),
        {
          id: 'profile',
          itemCode: 'PROFILE',
          itemName: 'Profile',
          itemType: 'LINK',
          url: '/profile',
          icon: 'user-plus',
          sortOrder: 3,
          requiresPermission: 'READ',
          menuCode: 'SYSTEM',
          menuName: 'System Settings',
          parentId: null,
          status: 'ACTIVE' as const
        },
        {
          id: 'change-password',
          itemCode: 'CHANGE_PASSWORD',
          itemName: 'Change Password',
          itemType: 'LINK',
          url: '/change-password',
          icon: 'settings',
          sortOrder: 4,
          requiresPermission: 'READ',
          menuCode: 'SYSTEM',
          menuName: 'System Settings',
          parentId: null,
          status: 'ACTIVE' as const
        }
      ]
    }
  ];

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

        {/* Render menu groups */}
        {menuGroups.map((menuGroup: MenuGroup) => {
          const menuItems = menuGroup.accessibleMenus.filter(item => item.status === 'ACTIVE');

          if (menuItems.length === 0) return null;

          return (
            <SidebarGroup key={menuGroup.menuCode}>
              <SidebarGroupLabel className={`${collapsed ? "sr-only" : "px-0 text-sm font-normal text-gray-600 mb-4"}`}>
                {menuGroup.menuName}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {menuItems
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((item) => {
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
