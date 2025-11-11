import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  X,
  Clock,
  ExternalLink,
  Settings,
  Filter,
  Zap,
  Shield,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { 
  globalNotificationService, 
  GlobalNotification, 
  NotificationFilter 
} from '@/services/globalNotificationService';
import { useToast } from '@/hooks/use-toast';

interface GlobalNotificationCenterProps {
  className?: string;
  compact?: boolean;
}

const GlobalNotificationCenter: React.FC<GlobalNotificationCenterProps> = ({
  className = '',
  compact = false
}) => {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Load notifications
  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications = globalNotificationService.getNotifications();
      const unread = globalNotificationService.getUnreadCount();
      setNotifications(allNotifications);
      setUnreadCount(unread);
    };

    // Initial load
    loadNotifications();

    // Subscribe to changes
    const unsubscribe = globalNotificationService.subscribe(loadNotifications);

    return unsubscribe;
  }, []);

  // Get filtered notifications based on active tab
  const getFilteredNotifications = useCallback(() => {
    const filter: NotificationFilter = {};
    
    switch (activeTab) {
      case 'unread':
        filter.unreadOnly = true;
        break;
      case 'workflow':
        filter.category = 'WORKFLOW';
        break;
      case 'system':
        filter.category = 'SYSTEM';
        break;
      case 'performance':
        filter.category = 'PERFORMANCE';
        break;
      case 'critical':
        filter.priority = 'CRITICAL';
        break;
    }

    return globalNotificationService.getNotifications(filter);
  }, [activeTab]);

  const filteredNotifications = getFilteredNotifications();

  const markAsRead = useCallback((notificationId: string) => {
    globalNotificationService.markAsRead(notificationId);
    toast({
      title: "Notification marked as read",
      variant: "default"
    });
  }, [toast]);

  const markAllAsRead = useCallback(() => {
    const filter: NotificationFilter = {};
    if (activeTab === 'unread') filter.unreadOnly = true;
    if (activeTab === 'workflow') filter.category = 'WORKFLOW';
    if (activeTab === 'system') filter.category = 'SYSTEM';
    if (activeTab === 'performance') filter.category = 'PERFORMANCE';
    if (activeTab === 'critical') filter.priority = 'CRITICAL';

    globalNotificationService.markAllAsRead(filter);
    toast({
      title: "All notifications marked as read",
      variant: "default"
    });
  }, [activeTab, toast]);

  const handleNotificationClick = useCallback((notification: GlobalNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  }, [markAsRead]);

  const getNotificationIcon = (type: GlobalNotification['type']) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'WORKFLOW':
        return <Zap className="h-4 w-4 text-blue-600" />;
      case 'SYSTEM':
        return <Settings className="h-4 w-4 text-gray-600" />;
      case 'INFO':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: GlobalNotification['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: GlobalNotification['category']) => {
    switch (category) {
      case 'WORKFLOW':
        return <Zap className="h-3 w-3" />;
      case 'SYSTEM':
        return <Settings className="h-3 w-3" />;
      case 'PERFORMANCE':
        return <TrendingUp className="h-3 w-3" />;
      case 'SECURITY':
        return <Shield className="h-3 w-3" />;
      case 'MAINTENANCE':
        return <Wrench className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        {/* Compact Notification Bell */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Compact Notification Panel */}
        {isOpen && (
          <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm">Notifications</CardTitle>
                  <CardDescription className="text-xs">
                    {unreadCount} unread
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-64">
                {filteredNotifications.slice(0, 5).map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.read ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {index < Math.min(filteredNotifications.length, 5) - 1 && (
                      <Separator className="mx-3" />
                    )}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Full Notification Bell */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Full Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {filteredNotifications.some(n => !n.read) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mx-4 mb-4">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
                <TabsTrigger value="workflow" className="text-xs">Workflow</TabsTrigger>
                <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
                <TabsTrigger value="critical" className="text-xs">Critical</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <ScrollArea className="h-96">
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredNotifications.map((notification, index) => (
                        <div key={notification.id}>
                          <div
                            className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                              !notification.read ? 'bg-muted/30' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                    {notification.title}
                                  </p>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {notification.actionRequired && (
                                      <Badge variant="destructive" className="text-xs">
                                        Action Required
                                      </Badge>
                                    )}
                                    {notification.actionUrl && (
                                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatTimestamp(notification.timestamp)}
                                  </div>
                                  
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getPriorityColor(notification.priority)}`}
                                  >
                                    {notification.priority}
                                  </Badge>

                                  <div className="flex items-center gap-1">
                                    {getCategoryIcon(notification.category)}
                                    <span className="text-xs text-muted-foreground">
                                      {notification.category}
                                    </span>
                                  </div>

                                  {notification.module && (
                                    <Badge variant="secondary" className="text-xs">
                                      {notification.module}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0 mt-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {index < filteredNotifications.length - 1 && (
                            <Separator className="mx-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalNotificationCenter;
