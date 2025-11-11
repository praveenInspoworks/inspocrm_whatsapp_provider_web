import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Settings, LogOut, Shield, Key, Monitor, Camera, Edit, Building, Mail, Phone, Calendar, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useAuth, useTabSync } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export function UserProfile() {
  const { user, logout } = useAuth();
  const { activeTabsCount, isMultipleTabs } = useTabSync();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animatedElements, setAnimatedElements] = useState<Array<{id: number, x: number, y: number, delay: number, icon: string}>>([]);

  // Generate floating business-themed elements
  useEffect(() => {
    const elements = [];
    const icons = ['Sparkles', 'TrendingUp', 'Zap', 'Building'];

    for (let i = 0; i < 8; i++) {
      elements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        icon: icons[Math.floor(Math.random() * icons.length)]
      });
    }
    setAnimatedElements(elements);
  }, []);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/");
    }
  };

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleProfileSettings = () => {
    navigate("/profile?tab=onboarding");
  };

  const handleSystemSettings = () => {
    navigate("/settings");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPrimaryRole = () => {
    return user.roles && user.roles.length > 0 ? user.roles[0] : 'USER';
  };

  const isAdmin = () => {
    return user.roles && user.roles.includes('ADMIN');
  };

  // Render icon based on string name
  const renderIcon = (iconName: string) => {
    const iconProps = { className: "w-4 h-4 text-indigo-400 opacity-60" };
    switch (iconName) {
      case 'Sparkles': return <Sparkles {...iconProps} />;
      case 'TrendingUp': return <TrendingUp {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'Building': return <Building {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
    }
  };

  return (
    <div className="relative">
      {/* Animated Background Elements */}
      {isMenuOpen && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-40">
          {animatedElements.map((element) => (
            <div
              key={element.id}
              className="absolute animate-pulse"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                animationDelay: `${element.delay}s`,
                animationDuration: '3s',
              }}
            >
              {renderIcon(element.icon)}
            </div>
          ))}
        </div>
      )}

      <DropdownMenu onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-indigo-400 transition-all duration-300">
                <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 text-white text-sm font-bold">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              {/* Profile Picture Edit Indicator */}
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-3 h-3 text-white" />
              </div>
              {/* Online Status Indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 p-0 shadow-2xl border-0 bg-white/95 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-300"
          align="end"
          forceMount
        >
          {/* Profile Header Card */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 rounded-t-lg">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-4 ring-white/20">
                  <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white hover:bg-gray-50 shadow-lg"
                  onClick={() => navigate("/profile")}
                >
                  <Edit className="w-4 h-4 text-indigo-600" />
                </Button>
              </div>
              <div className="flex-1 text-white">
                <h3 className="text-xl font-bold">{user.fullName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {getPrimaryRole()}
                  </Badge>
                  {isMultipleTabs && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-100 border-blue-300/30 text-xs">
                      <Monitor className="w-3 h-3 mr-1" />
                      {activeTabsCount} tabs
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.phone}</span>
              </div>
            )}
            {user.departmentName && (
              <div className="flex items-center space-x-3 text-sm">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.position} • {user.departmentName}</span>
              </div>
            )}
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Last login: Today</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Menu Items */}
          <div className="p-2">
            <DropdownMenuItem
              onClick={handleProfileSettings}
              className="rounded-lg hover:bg-indigo-50 transition-colors duration-200"
            >
              <User className="mr-3 h-4 w-4 text-indigo-600" />
              <span className="font-medium">View Full Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleChangePassword}
              className="rounded-lg hover:bg-indigo-50 transition-colors duration-200"
            >
              <Key className="mr-3 h-4 w-4 text-indigo-600" />
              <span className="font-medium">Security Settings</span>
            </DropdownMenuItem>
            {isMultipleTabs && (
              <DropdownMenuItem disabled className="rounded-lg text-xs text-muted-foreground">
                <Monitor className="mr-3 h-4 w-4" />
                <span>Cross-tab sync active</span>
              </DropdownMenuItem>
            )}
            {isAdmin() && (
              <DropdownMenuItem
                onClick={handleSystemSettings}
                className="rounded-lg hover:bg-indigo-50 transition-colors duration-200"
              >
                <Settings className="mr-3 h-4 w-4 text-indigo-600" />
                <span className="font-medium">System Administration</span>
              </DropdownMenuItem>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Logout */}
          <div className="p-2">
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg hover:bg-red-50 text-red-600 focus:text-red-600 transition-colors duration-200"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-medium">Sign Out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
