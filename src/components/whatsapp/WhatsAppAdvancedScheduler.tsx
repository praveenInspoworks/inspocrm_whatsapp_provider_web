import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock, Send, Repeat, Zap,
  Globe, Moon, Sun, Coffee, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleData {
  scheduleType: 'immediate' | 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  sendDate?: Date;
  sendTime?: string;
  timezone?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };
  businessHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  smartTiming?: {
    enabled: boolean;
    optimizeForOpens: boolean;
    avoidWeekends: boolean;
  };
}

interface WhatsAppAdvancedSchedulerProps {
  onScheduleChange: (scheduleData: ScheduleData) => void;
  initialSchedule?: ScheduleData;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC', offset: '+00:00' },
  { value: 'America/New_York', label: 'Eastern Time', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time', offset: '-08:00' },
  { value: 'Europe/London', label: 'London', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris', offset: '+01:00' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'India (Kolkata)', offset: '+05:30' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+10:00' }
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' }
];

const BUSINESS_HOURS_PRESETS = [
  { label: 'Standard Business Hours', startTime: '09:00', endTime: '17:00', days: [1, 2, 3, 4, 5] },
  { label: 'Extended Hours', startTime: '08:00', endTime: '18:00', days: [1, 2, 3, 4, 5] },
  { label: '24/7 Support', startTime: '00:00', endTime: '23:59', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekend Only', startTime: '10:00', endTime: '16:00', days: [0, 6] }
];

export function WhatsAppAdvancedScheduler({
  onScheduleChange,
  initialSchedule
}: WhatsAppAdvancedSchedulerProps): JSX.Element {
  const [scheduleData, setScheduleData] = useState<ScheduleData>(
    initialSchedule || {
      scheduleType: 'immediate',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      businessHours: {
        enabled: false,
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5]
      },
      smartTiming: {
        enabled: false,
        optimizeForOpens: true,
        avoidWeekends: false
      }
    }
  );

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  useEffect(() => {
    onScheduleChange(scheduleData);
  }, [scheduleData, onScheduleChange]);

  const handleScheduleTypeChange = (type: ScheduleData['scheduleType']) => {
    setScheduleData(prev => ({
      ...prev,
      scheduleType: type,
      sendDate: type === 'immediate' ? undefined : prev.sendDate,
      sendTime: type === 'immediate' ? undefined : (prev.sendTime || '09:00')
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setScheduleData(prev => ({
        ...prev,
        sendDate: date
      }));
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    setScheduleData(prev => ({
      ...prev,
      sendTime: time
    }));
  };

  const handleRecurrenceChange = (field: string, value: any) => {
    setScheduleData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        [field]: value
      }
    }));
  };

  const handleBusinessHoursChange = (field: string, value: any) => {
    setScheduleData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [field]: value
      }
    }));
  };

  const handleSmartTimingChange = (field: string, value: any) => {
    setScheduleData(prev => ({
      ...prev,
      smartTiming: {
        ...prev.smartTiming,
        [field]: value
      }
    }));
  };

  const applyBusinessHoursPreset = (preset: typeof BUSINESS_HOURS_PRESETS[0]) => {
    setScheduleData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        startTime: preset.startTime,
        endTime: preset.endTime,
        daysOfWeek: preset.days
      }
    }));
  };

  const renderImmediateScheduling = () => (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Send Immediately</h3>
            <p className="text-sm text-green-700">Messages will be sent right after approval</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>No scheduling delay</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Direct delivery to WhatsApp</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Real-time delivery tracking</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOneTimeScheduling = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Schedule for Specific Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Select Time</Label>
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Timezone Selection */}
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select
            value={scheduleData.timezone}
            onValueChange={(value) => setScheduleData(prev => ({ ...prev, timezone: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label} (UTC{tz.offset})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Schedule Preview */}
        {selectedDate && selectedTime && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-900">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  Scheduled for: {format(selectedDate, "PPP")} at {selectedTime} ({scheduleData.timezone})
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );

  const renderRecurringScheduling = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="w-5 h-5" />
          Recurring Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency Selection */}
        <div className="space-y-4">
          <Label>Frequency</Label>
          <RadioGroup
            value={scheduleData.recurrence?.frequency || 'weekly'}
            onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
              handleRecurrenceChange('frequency', value)
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily">Daily</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">Weekly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly">Monthly</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Send Time</Label>
            <Input
              type="time"
              value={scheduleData.sendTime || '09:00'}
              onChange={(e) => setScheduleData(prev => ({ ...prev, sendTime: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Interval (every X)</Label>
            <Select
              value={scheduleData.recurrence?.interval?.toString() || '1'}
              onValueChange={(value) => handleRecurrenceChange('interval', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {scheduleData.recurrence?.frequency === 'daily' ? 'day(s)' :
                           scheduleData.recurrence?.frequency === 'weekly' ? 'week(s)' : 'month(s)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Days of Week (for weekly) */}
        {scheduleData.recurrence?.frequency === 'weekly' && (
          <div className="space-y-3">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={scheduleData.recurrence?.daysOfWeek?.includes(day.value) || false}
                    onCheckedChange={(checked) => {
                      const currentDays = scheduleData.recurrence?.daysOfWeek || [];
                      const newDays = checked
                        ? [...currentDays, day.value]
                        : currentDays.filter(d => d !== day.value);
                      handleRecurrenceChange('daysOfWeek', newDays);
                    }}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                    {day.short}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* End Date */}
        <div className="space-y-2">
          <Label>End Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !scheduleData.recurrence?.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduleData.recurrence?.endDate
                  ? format(scheduleData.recurrence.endDate, "PPP")
                  : "No end date"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduleData.recurrence?.endDate}
                onSelect={(date) => handleRecurrenceChange('endDate', date)}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );

  const renderBusinessHours = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Business Hours Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="business-hours"
            checked={scheduleData.businessHours?.enabled || false}
            onCheckedChange={(checked) => handleBusinessHoursChange('enabled', checked)}
          />
          <Label htmlFor="business-hours" className="text-sm font-medium">
            Send only during business hours
          </Label>
        </div>

        {scheduleData.businessHours?.enabled && (
          <>
            {/* Business Hours Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {BUSINESS_HOURS_PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyBusinessHoursPreset(preset)}
                    className="justify-start text-left h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{preset.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {preset.startTime} - {preset.endTime} ({preset.days.length} days)
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Business Hours */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={scheduleData.businessHours.startTime}
                    onChange={(e) => handleBusinessHoursChange('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={scheduleData.businessHours.endTime}
                    onChange={(e) => handleBusinessHoursChange('endTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Active Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`business-day-${day.value}`}
                        checked={scheduleData.businessHours?.daysOfWeek?.includes(day.value) || false}
                        onCheckedChange={(checked) => {
                          const currentDays = scheduleData.businessHours?.daysOfWeek || [];
                          const newDays = checked
                            ? [...currentDays, day.value]
                            : currentDays.filter(d => d !== day.value);
                          handleBusinessHoursChange('daysOfWeek', newDays);
                        }}
                      />
                      <Label htmlFor={`business-day-${day.value}`} className="text-sm">
                        {day.short}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderSmartTiming = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Smart Timing Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="smart-timing"
            checked={scheduleData.smartTiming?.enabled || false}
            onCheckedChange={(checked) => handleSmartTimingChange('enabled', checked)}
          />
          <Label htmlFor="smart-timing" className="text-sm font-medium">
            Enable smart timing optimization
          </Label>
        </div>

        {scheduleData.smartTiming?.enabled && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="optimize-opens"
                checked={scheduleData.smartTiming.optimizeForOpens || false}
                onCheckedChange={(checked) => handleSmartTimingChange('optimizeForOpens', checked)}
              />
              <Label htmlFor="optimize-opens" className="text-sm">
                Optimize for best response times
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="avoid-weekends"
                checked={scheduleData.smartTiming.avoidWeekends || false}
                onCheckedChange={(checked) => handleSmartTimingChange('avoidWeekends', checked)}
              />
              <Label htmlFor="avoid-weekends" className="text-sm">
                Avoid sending on weekends
              </Label>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Sun className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm">Smart Timing Benefits</h4>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• Higher response rates during optimal hours</li>
                    <li>• Better engagement with personalized timing</li>
                    <li>• Automatic adjustment for time zones</li>
                    <li>• Learning from past campaign performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Schedule Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>When should we send this WhatsApp campaign?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={scheduleData.scheduleType}
            onValueChange={handleScheduleTypeChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="immediate" id="immediate" />
              <Label htmlFor="immediate" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Send Immediately</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Messages go out right after approval</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="once" id="once" />
              <Label htmlFor="once" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Schedule Once</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Send at a specific date and time</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Daily Recurring</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Send every day at the same time</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Weekly Recurring</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Send on specific days each week</p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      {scheduleData.scheduleType === 'immediate' && renderImmediateScheduling()}
      {scheduleData.scheduleType === 'once' && renderOneTimeScheduling()}
      {(scheduleData.scheduleType === 'daily' || scheduleData.scheduleType === 'weekly' || scheduleData.scheduleType === 'monthly') && renderRecurringScheduling()}

      {/* Advanced Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderBusinessHours()}
        {renderSmartTiming()}
      </div>

      {/* Schedule Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">Schedule Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                {scheduleData.scheduleType === 'immediate' ? 'Immediate Send' :
                 scheduleData.scheduleType === 'once' ? 'One-time Schedule' :
                 `${scheduleData.scheduleType.charAt(0).toUpperCase() + scheduleData.scheduleType.slice(1)} Recurring`}
              </Badge>
              {scheduleData.timezone && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  <Globe className="w-3 h-3 mr-1" />
                  {TIMEZONES.find(tz => tz.value === scheduleData.timezone)?.label || scheduleData.timezone}
                </Badge>
              )}
            </div>

            {scheduleData.businessHours?.enabled && (
              <div className="flex items-center gap-2 text-sm text-green-800">
                <Briefcase className="w-4 h-4" />
                <span>Business Hours: {scheduleData.businessHours.startTime} - {scheduleData.businessHours.endTime}</span>
              </div>
            )}

            {scheduleData.smartTiming?.enabled && (
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Zap className="w-4 h-4" />
                <span>Smart Timing Enabled</span>
              </div>
            )}

            {scheduleData.sendDate && scheduleData.sendTime && (
              <div className="flex items-center gap-2 text-sm text-purple-800">
                <Clock className="w-4 h-4" />
                <span>
                  Next Send: {format(scheduleData.sendDate, "PPP")} at {scheduleData.sendTime}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
