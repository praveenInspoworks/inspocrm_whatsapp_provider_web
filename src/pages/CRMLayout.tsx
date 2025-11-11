import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DynamicSidebar } from "@/components/crm/DynamicSidebar";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Bell, User, Search, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState, useRef } from "react";
import { UserProfile } from "@/components/auth/UserProfile";
import { useAuth, useTabSync } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import OnboardingNotification from "@/components/ui/OnboardingNotification";
import { OnboardingCompletionPopup } from "@/components/onboarding/OnboardingCompletionPopup";
import AIOnboardingBot from "@/components/onboarding/AIOnboardingBot";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export default function CRMLayout() {
  const { user, onboardingStatus, showOnboardingPopup, setShowOnboardingPopup, checkOnboardingStatus } = useAuth();
  const { activeTabsCount, isMultipleTabs } = useTabSync(); // Initialize tab synchronization
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Sample notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Lead Assigned',
      message: 'A new lead "Acme Corp" has been assigned to you',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false
    },
    {
      id: '2',
      title: 'Deal Won',
      message: 'Congratulations! You closed the deal with "Tech Solutions"',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: '3',
      title: 'Meeting Reminder',
      message: 'You have a meeting with "Global Industries" in 15 minutes',
      type: 'warning',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      read: true
    }
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    document.title = "INSPOCRM";
  }, []);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DynamicSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card shadow-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search everything..."
                  className="pl-10 w-80"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              
              {/* Notification Bell with Dropdown */}
              <div className="relative" ref={notificationRef}>
                <Button variant="ghost" size="sm" className="relative" onClick={handleBellClick}>
                  <Bell className="h-4 w-4" />
                  {getUnreadCount() > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {getUnreadCount()}
                    </Badge>
                  )}
                </Button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {getUnreadCount() > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs"
                          >
                            Mark all as read
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50/50' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className={`text-sm font-medium ${
                                    !notification.read ? 'text-foreground' : 'text-muted-foreground'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatTimeAgo(notification.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate('/notifications')}
                        >
                          View all notifications
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <UserProfile />
            </div>
          </header>

          {/* Onboarding Notification */}
          {/* <div className="px-6 py-4 bg-background border-b border-border">
            <OnboardingNotification />
          </div> */}

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>

        {/* Onboarding Popup */}
        {user && !onboardingStatus?.isOnboardingComplete && (
          <OnboardingCompletionPopup
            isOpen={showOnboardingPopup}
            onClose={() => setShowOnboardingPopup(false)}
            onComplete={() => {
              setShowOnboardingPopup(false);
              checkOnboardingStatus(); // Refresh status
            }}
          />
        )}

        {/* AI Onboarding Bot - Handled internally by the component */}
        <AIOnboardingBot />
      </div>
    </SidebarProvider>
  );
}
