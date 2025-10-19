"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Bell,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

interface PrayerTime {
  name: string;
  time: string;
  isActive: boolean;
  isNext: boolean;
}

interface PrayerTimesProps {
  onClose: () => void;
}

// Mock prayer times data (in production, this would come from an API)
const getMockPrayerTimes = (date: Date) => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return [
      { name: "Fajr", time: "05:30", isActive: false, isNext: false },
      { name: "Dhuhr", time: "12:15", isActive: false, isNext: true },
      { name: "Asr", time: "15:45", isActive: false, isNext: false },
      { name: "Maghrib", time: "18:20", isActive: false, isNext: false },
      { name: "Isha", time: "19:45", isActive: false, isNext: false },
    ];
  }
  
  // Mock times for other dates
  return [
    { name: "Fajr", time: "05:32", isActive: false, isNext: false },
    { name: "Dhuhr", time: "12:17", isActive: false, isNext: false },
    { name: "Asr", time: "15:47", isActive: false, isNext: false },
    { name: "Maghrib", time: "18:22", isActive: false, isNext: false },
    { name: "Isha", time: "19:47", isActive: false, isNext: false },
  ];
};

const CALCULATION_METHODS = [
  { id: "mwl", name: "Muslim World League", description: "Most common worldwide" },
  { id: "isna", name: "Islamic Society of North America", description: "Popular in North America" },
  { id: "egypt", name: "Egyptian General Authority", description: "Used in Egypt and Africa" },
  { id: "makkah", name: "Umm al-Qura, Makkah", description: "Saudi Arabia standard" },
  { id: "karachi", name: "University of Islamic Sciences, Karachi", description: "Pakistan standard" },
];

export function PrayerTimes({ onClose }: PrayerTimesProps) {
  const { success, error: showError } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calculationMethod, setCalculationMethod] = useState("mwl");
  const [notifications, setNotifications] = useState({
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load prayer times when date changes
  useEffect(() => {
    setPrayerTimes(getMockPrayerTimes(currentDate));
  }, [currentDate]);

  // Auto-detect location
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by this browser");
      return;
    }

    setIsLoadingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // In production, reverse geocoding would be done here
      setLocation({ city: "New York", country: "USA" });
      success("Location detected successfully");
    } catch (err) {
      showError("Unable to detect location. Please enable location services.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getNextPrayer = () => {
    const now = currentTime;
    const todayTimes = getMockPrayerTimes(now);
    
    for (const prayer of todayTimes) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date(now);
      prayerTime.setHours(hours, minutes, 0, 0);
      
      if (prayerTime > now) {
        return { prayer: prayer.name, time: prayerTime };
      }
    }
    
    // If no prayer found today, return tomorrow's Fajr
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = getMockPrayerTimes(tomorrow);
    const [hours, minutes] = tomorrowTimes[0].time.split(':').map(Number);
    const nextFajr = new Date(tomorrow);
    nextFajr.setHours(hours, minutes, 0, 0);
    
    return { prayer: "Fajr", time: nextFajr };
  };

  const getTimeUntilNext = () => {
    const next = getNextPrayer();
    const diff = next.time.getTime() - currentTime.getTime();
    
    if (diff <= 0) return "Now";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const toggleNotification = (prayer: string) => {
    setNotifications(prev => ({
      ...prev,
      [prayer.toLowerCase()]: !prev[prayer.toLowerCase() as keyof typeof prev]
    }));
  };

  const nextPrayer = getNextPrayer();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prayer Times</h1>
          <p className="text-muted-foreground">
            {location ? `${location.city}, ${location.country}` : "Location not detected"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Prayer Times */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Time & Next Prayer */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Current Time</h2>
                <div className="text-3xl font-bold">{formatTime(currentTime)}</div>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold mb-1">Next Prayer</h2>
                <div className="text-2xl font-bold">{nextPrayer.prayer}</div>
                <div className="text-sm opacity-90">{getTimeUntilNext()}</div>
              </div>
            </div>
            
            {/* Countdown */}
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <div className="text-sm opacity-90 mb-1">Time until {nextPrayer.prayer}</div>
              <div className="text-2xl font-bold">{getTimeUntilNext()}</div>
            </div>
          </div>

          {/* Prayer Times List */}
          <div className="bg-card rounded-lg shadow-md border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Today&apos;s Prayer Times</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
                    {currentDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {prayerTimes.map((prayer, index) => (
                <motion.div
                  key={prayer.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    prayer.isNext
                      ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      prayer.isNext ? "bg-primary-600" : "bg-muted-foreground"
                    }`} />
                    <div>
                      <div className="font-semibold text-foreground">{prayer.name}</div>
                      {prayer.isNext && (
                        <div className="text-xs text-primary-600 font-medium">Next Prayer</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${
                      prayer.isNext ? "text-primary-600" : "text-foreground"
                    }`}>
                      {prayer.time}
                    </div>
                    <button
                      onClick={() => toggleNotification(prayer.name)}
                      className={`p-2 rounded-lg transition-colors ${
                        notifications[prayer.name.toLowerCase() as keyof typeof notifications]
                          ? "bg-primary-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Location</h3>
            </div>
            
            {location ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-foreground">{location.city}, {location.country}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={detectLocation}
                  disabled={isLoadingLocation}
                  className="w-full"
                >
                  {isLoadingLocation ? "Detecting..." : "Update Location"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>Location not detected</span>
                </div>
                <Button
                  onClick={detectLocation}
                  disabled={isLoadingLocation}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  {isLoadingLocation ? "Detecting..." : "Detect Location"}
                </Button>
              </div>
            )}
          </div>

          {/* Calculation Method */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Calculation Method</h3>
            </div>
            
            <div className="space-y-2">
              {CALCULATION_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setCalculationMethod(method.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    calculationMethod === method.id
                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                      : "border-border hover:border-primary-300"
                  }`}
                >
                  <div className="font-medium text-foreground text-sm">{method.name}</div>
                  <div className="text-xs text-muted-foreground">{method.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Notifications</h3>
            </div>
            
            <div className="space-y-2">
              {Object.entries(notifications).map(([prayer, enabled]) => (
                <div key={prayer} className="flex items-center justify-between">
                  <span className="text-sm text-foreground capitalize">{prayer}</span>
                  <button
                    onClick={() => toggleNotification(prayer)}
                    className={`w-8 h-4 rounded-full transition-colors ${
                      enabled ? "bg-primary-600" : "bg-muted"
                    }`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                      enabled ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Calendar */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Monthly View</h3>
            </div>
            
            <Button variant="outline" className="w-full">
              View Monthly Calendar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
