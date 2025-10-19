"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

interface HijriCalendarProps {
  onClose: () => void;
}

interface IslamicDate {
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
  };
  gregorian: {
    day: number;
    month: number;
    year: number;
    monthName: string;
  };
  isImportant?: boolean;
  occasion?: string;
}

interface IslamicEvent {
  id: string;
  name: string;
  hijriDate: { month: number; day: number };
  type: "religious" | "historical" | "cultural";
  description: string;
  isAnnual: boolean;
}

// Mock Islamic events data
const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    id: "1",
    name: "1st Ramadan",
    hijriDate: { month: 9, day: 1 },
    type: "religious",
    description: "Beginning of the holy month of Ramadan",
    isAnnual: true,
  },
  {
    id: "2",
    name: "Laylat al-Qadr",
    hijriDate: { month: 9, day: 27 },
    type: "religious",
    description: "Night of Power - one of the last 10 nights of Ramadan",
    isAnnual: true,
  },
  {
    id: "3",
    name: "Eid al-Fitr",
    hijriDate: { month: 10, day: 1 },
    type: "religious",
    description: "Festival of Breaking the Fast",
    isAnnual: true,
  },
  {
    id: "4",
    name: "Hajj",
    hijriDate: { month: 12, day: 8 },
    type: "religious",
    description: "Annual pilgrimage to Makkah",
    isAnnual: true,
  },
  {
    id: "5",
    name: "Eid al-Adha",
    hijriDate: { month: 12, day: 10 },
    type: "religious",
    description: "Festival of Sacrifice",
    isAnnual: true,
  },
  {
    id: "6",
    name: "Islamic New Year",
    hijriDate: { month: 1, day: 1 },
    type: "religious",
    description: "Beginning of the new Hijri year",
    isAnnual: true,
  },
  {
    id: "7",
    name: "Ashura",
    hijriDate: { month: 1, day: 10 },
    type: "religious",
    description: "Day of Ashura - 10th of Muharram",
    isAnnual: true,
  },
  {
    id: "8",
    name: "Mawlid an-Nabi",
    hijriDate: { month: 3, day: 12 },
    type: "religious",
    description: "Birthday of Prophet Muhammad (PBUH)",
    isAnnual: true,
  },
];

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi&apos; al-awwal", "Rabi&apos; al-thani",
  "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha&apos;ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

const GREGORIAN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Mock conversion functions (in production, use proper Hijri-Gregorian conversion)
const convertToHijri = (gregorianDate: Date): IslamicDate["hijri"] => {
  // Simplified conversion (in production, use proper algorithm)
  const hijriYear = 1445 + Math.floor((gregorianDate.getFullYear() - 2024) * 0.97);
  const hijriMonth = Math.floor(Math.random() * 12) + 1;
  const hijriDay = Math.floor(Math.random() * 30) + 1;
  
  return {
    day: hijriDay,
    month: hijriMonth,
    year: hijriYear,
    monthName: HIJRI_MONTHS[hijriMonth - 1],
  };
};

const convertToGregorian = (hijriDate: { year: number; month: number; day: number }): IslamicDate["gregorian"] => {
  // Simplified conversion (in production, use proper algorithm)
  const gregorianYear = 2024 + Math.floor((hijriDate.year - 1445) / 0.97);
  const gregorianMonth = Math.floor(Math.random() * 12) + 1;
  const gregorianDay = Math.floor(Math.random() * 30) + 1;
  
  return {
    day: gregorianDay,
    month: gregorianMonth,
    year: gregorianYear,
    monthName: GREGORIAN_MONTHS[gregorianMonth - 1],
  };
};

const generateCalendarDays = (year: number, month: number): IslamicDate[] => {
  const days: IslamicDate[] = [];
  const daysInMonth = 30; // Simplified (Hijri months vary)
  
  for (let day = 1; day <= daysInMonth; day++) {
    const hijriDate = { year, month, day, monthName: HIJRI_MONTHS[month - 1] };
    const gregorianDate = convertToGregorian({ year, month, day });
    
    // Check if this date has an important event
    const event = ISLAMIC_EVENTS.find(e => 
      e.hijriDate.month === month && e.hijriDate.day === day
    );
    
    days.push({
      hijri: hijriDate,
      gregorian: gregorianDate,
      isImportant: !!event,
      occasion: event?.name,
    });
  }
  
  return days;
};

export function HijriCalendar({ onClose }: HijriCalendarProps) {
  const { success } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"hijri" | "gregorian">("hijri");
  const [currentHijriYear, setCurrentHijriYear] = useState(1445);
  const [currentHijriMonth, setCurrentHijriMonth] = useState(1);
  const [selectedDate, setSelectedDate] = useState<IslamicDate | null>(null);
  const [calendarDays, setCalendarDays] = useState<IslamicDate[]>([]);

  useEffect(() => {
    setCalendarDays(generateCalendarDays(currentHijriYear, currentHijriMonth));
  }, [currentHijriYear, currentHijriMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (currentHijriMonth === 12) {
        setCurrentHijriMonth(1);
        setCurrentHijriYear(prev => prev + 1);
      } else {
        setCurrentHijriMonth(prev => prev + 1);
      }
    } else {
      if (currentHijriMonth === 1) {
        setCurrentHijriMonth(12);
        setCurrentHijriYear(prev => prev - 1);
      } else {
        setCurrentHijriMonth(prev => prev - 1);
      }
    }
  };

  const exportToCalendar = () => {
    // In production, this would generate a proper calendar file
    success("Calendar exported successfully");
  };

  const getEventColor = (type: IslamicEvent["type"]) => {
    switch (type) {
      case "religious":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "historical":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "cultural":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTodaysEvents = () => {
    const today = new Date();
    const hijriToday = convertToHijri(today);
    return ISLAMIC_EVENTS.filter(event => 
      event.hijriDate.month === hijriToday.month && 
      event.hijriDate.day === hijriToday.day
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hijri Calendar</h1>
          <p className="text-muted-foreground">
            Islamic calendar with important dates and events
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg shadow-md border border-border">
            {/* Calendar Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-xl font-semibold text-foreground">
                    {viewMode === "hijri" 
                      ? `${HIJRI_MONTHS[currentHijriMonth - 1]} ${currentHijriYear}`
                      : `${GREGORIAN_MONTHS[currentHijriMonth - 1]} ${currentHijriYear + 579}`
                    }
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "hijri" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("hijri")}
                  >
                    Hijri
                  </Button>
                  <Button
                    variant={viewMode === "gregorian" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("gregorian")}
                  >
                    Gregorian
                  </Button>
                </div>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const isToday = date.hijri.day === 15 && date.hijri.month === currentHijriMonth; // Mock today
                  
                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => setSelectedDate(date)}
                      className={`relative p-3 text-center rounded-lg transition-all hover:bg-muted ${
                        isToday ? "bg-primary-100 dark:bg-primary-900/20" : ""
                      } ${date.isImportant ? "ring-2 ring-green-500/50" : ""}`}
                    >
                      {/* Day Number */}
                      <div className={`text-sm font-medium ${
                        isToday ? "text-primary-600" : "text-foreground"
                      }`}>
                        {viewMode === "hijri" ? date.hijri.day : date.gregorian.day}
                      </div>
                      
                      {/* Hijri Date (small) */}
                      {viewMode === "gregorian" && (
                        <div className="text-xs text-muted-foreground">
                          {date.hijri.day}
                        </div>
                      )}
                      
                      {/* Event Indicator */}
                      {date.isImportant && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Date */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Today</h3>
            </div>
            
            <div className="space-y-2">
              <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <div className="text-lg font-bold text-primary-600">
                  {convertToHijri(currentDate).day} {convertToHijri(currentDate).monthName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {convertToHijri(currentDate).year} AH
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Today's Events */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Today&apos;s Events</h3>
            </div>
            
            <div className="space-y-2">
              {getTodaysEvents().length > 0 ? (
                getTodaysEvents().map((event) => (
                  <div key={event.id} className={`p-2 rounded-lg text-xs ${getEventColor(event.type)}`}>
                    <div className="font-medium">{event.name}</div>
                    <div className="opacity-75">{event.description}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No special events today
                </div>
              )}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-card rounded-lg shadow-md border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-foreground">Selected Date</h3>
              </div>
              
              <div className="space-y-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-bold text-foreground">
                    {selectedDate.hijri.day} {selectedDate.hijri.monthName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedDate.hijri.year} AH
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  {selectedDate.gregorian.day} {selectedDate.gregorian.monthName} {selectedDate.gregorian.year}
                </div>
                
                {selectedDate.isImportant && (
                  <div className={`p-3 rounded-lg text-sm ${getEventColor("religious")}`}>
                    <div className="font-medium">{selectedDate.occasion}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Upcoming Events</h3>
            </div>
            
            <div className="space-y-2">
              {ISLAMIC_EVENTS.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <div className="text-sm font-medium text-foreground">{event.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.hijriDate.day} {HIJRI_MONTHS[event.hijriDate.month - 1]}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    event.type === "religious" ? "bg-green-500" :
                    event.type === "historical" ? "bg-blue-500" : "bg-purple-500"
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <Button
              onClick={exportToCalendar}
              className="w-full bg-primary-600 hover:bg-primary-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Calendar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
