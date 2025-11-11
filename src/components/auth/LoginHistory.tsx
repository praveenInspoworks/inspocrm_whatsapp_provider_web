import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Calendar,
  MapPin,
  Monitor,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";

interface LoginHistoryRecord {
  id: number;
  adminUserId?: number;
  username: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  loginStatus: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  createdAt: string;
  profileUrl?: string;
}

interface LoginHistorySummary {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  lastLoginTime?: string;
}

export function LoginHistory() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([]);
  const [summary, setSummary] = useState<LoginHistorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Load login history based on authenticated user ID
  const loadLoginHistory = async () => {
    setIsLoading(true);
    try {
      // Check user role and use appropriate endpoint
      const isAdmin = user?.roles?.some(role => role === 'ADMIN' || role === 'SUPER_ADMIN');

      // Use admin endpoint for admin users, member endpoint for regular users
      const endpoint = isAdmin
        ? `/api/v1/admin/login-history/my-history?page=${currentPage}&size=${pageSize}`
        : `/api/v1/member/login-history/my-history?page=${currentPage}&size=${pageSize}`;

      const response = await apiService.get(endpoint);

      // Handle different response formats
      let loginHistoryData = [];
      if (Array.isArray(response)) {
        loginHistoryData = response;
      } else if (response && Array.isArray(response.data)) {
        loginHistoryData = response.data;
      } else if (response && Array.isArray(response.content)) {
        loginHistoryData = response.content;
      } else if (response && response.loginHistory) {
        loginHistoryData = response.loginHistory;
      } else {
        loginHistoryData = [];
      }

      setLoginHistory(loginHistoryData);
    } catch (error: any) {
      console.error('Failed to load login history:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load login history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load login summary
  const loadLoginSummary = async () => {
    setIsLoadingSummary(true);
    try {
      // Use the correct endpoint based on user role
      const isAdmin = user?.roles?.some(role => role === 'ADMIN' || role === 'SUPER_ADMIN');
      const endpoint = isAdmin ?
        '/api/v1/admin/login-history/summary' :
        '/api/v1/member/login-history/summary';

      const response = await apiService.get(endpoint);
      setSummary(response);
    } catch (error: any) {
      console.error('Failed to load login summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadLoginHistory();
    loadLoginSummary();
  }, [currentPage, searchTerm, statusFilter, dateFilter]);

  // Filter login history based on search term
  const filteredHistory = loginHistory.filter(record => {
    const matchesSearch = searchTerm === "" ||
      record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.ipAddress.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || record.loginStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    return status === 'SUCCESS' ? (
      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
        <AlertCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "Active";

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes

    if (duration < 60) {
      return `${duration}m`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes("Mobile")) return "Mobile";
    if (userAgent.includes("Tablet")) return "Tablet";
    return "Desktop";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Logins</p>
                  <p className="text-2xl font-bold">{summary.totalLogins}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{summary.successfulLogins}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{summary.failedLogins}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
                  <p className="text-2xl font-bold">{summary.uniqueUsers}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Login History
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadLoginHistory}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by username or IP address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading login history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Login History</h3>
              <p className="text-muted-foreground">
                No login records found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{record.username}</p>
                            {record.sessionId && (
                              <p className="text-xs text-muted-foreground">
                                Session: {record.sessionId.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.loginStatus)}
                        {record.loginStatus === 'FAILED' && record.failureReason && (
                          <p className="text-xs text-red-600 mt-1">
                            {record.failureReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDateTime(record.loginTime)}</p>
                          {record.logoutTime && (
                            <p className="text-xs text-muted-foreground">
                              Logout: {formatDateTime(record.logoutTime)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDuration(record.loginTime, record.logoutTime)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{record.ipAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{getDeviceInfo(record.userAgent)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {record.ipAddress.startsWith('192.168.') || record.ipAddress.startsWith('10.') ?
                            'Local Network' :
                            record.ipAddress.startsWith('172.') ?
                              'Private Network' :
                              'External'
                          }
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {filteredHistory.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredHistory.length} of {summary?.totalLogins || 0} records
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={filteredHistory.length < pageSize}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary && summary.failedLogins > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Alert:</strong> {summary.failedLogins} failed login attempts detected.
                Review your security settings and consider enabling two-factor authentication.
              </AlertDescription>
            </Alert>
          )}

          {summary && summary.lastLoginTime && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Last successful login: {formatDateTime(summary.lastLoginTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Average session: {summary.averageSessionDuration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <span>Active users: {summary.uniqueUsers}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
