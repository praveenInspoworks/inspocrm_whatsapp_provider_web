import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  X,
  Clock,
  ExternalLink
} from 'lucide-react';
import { WorkflowNotification } from '@/services/enhancedWorkflowService';
import { useToast } from '@/hooks/use-toast';

interface WorkflowNotificationCenterProps {
  workflowId?: number;
  onNotificationClick?: (notification: WorkflowNotification) => void;
  className?: string;
}

const WorkflowNotificationCenter: React.FC<WorkflowNotificationCenterProps> = ({
  workflowId,
  onNotificationClick,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Simulate real-time notifications (in real app, this would use WebSockets)
  useEffect(() => {
    const mockNotifications: WorkflowNotification[] = [
      {
        id: 'notif_1',
        type: 'SUCCESS',
        message: 'Purchase Order approved for workflow WF-2024-001',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        read: false,
        actionRequired: true,
        actionUrl: '/procurement/purchase-orders/1'
      },
      {
        id: 'notif_2',
        type: 'WARNING',
        message: 'Quality inspection should be completed within 24 hours of receipt',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        read: false,
        actionRequired: false
      },
      {
        id: 'notif_3',
        type: 'INFO',
        message: 'Workflow WF-2024-001 moved to QUALITY_INSPECTION_COMPLETED',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        read: true,
        actionRequired: false
      },
      {
        id: 'notif_4',
        type: 'ERROR',
        message: 'Invalid transition attempted in workflow WF-2024-002',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        read: false,
        actionRequired: true
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const newNotification: WorkflowNotification = {
        id: `notif_${Date.now()}`,
        type: Math.random() > 0.7 ? 'WARNING' : 'INFO',
        message: `Real-time update for workflow ${workflowId || 'WF-2024-001'}`,
        timestamp: new Date().toISOString(),
        read: false,
        actionRequired: Math.random() > 0.5
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast for new notifications
      toast({
        title: "Workflow Update",
        description: newNotification.message,
        variant: newNotification.type === 'ERROR' ? 'destructive' : 'default'
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [workflowId, toast]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const handleNotificationClick = useCallback((notification: WorkflowNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  }, [markAsRead, onNotificationClick]);

  const getNotificationIcon = (type: WorkflowNotification['type']) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'INFO':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationBadgeVariant = (type: WorkflowNotification['type']) => {
    switch (type) {
      case 'SUCCESS':
        return 'default';
      case 'WARNING':
        return 'secondary';
      case 'ERROR':
        return 'destructive';
      case 'INFO':
      default:
        return 'outline';
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

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
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

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
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
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
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
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-1">
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
                            
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(notification.timestamp)}
                              </div>
                              
                              <Badge 
                                variant={getNotificationBadgeVariant(notification.type)}
                                className="text-xs"
                              >
                                {notification.type}
                              </Badge>
                            </div>
                          </div>

                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
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
                      
                      {index < notifications.length - 1 && (
                        <Separator className="mx-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowNotificationCenter;
