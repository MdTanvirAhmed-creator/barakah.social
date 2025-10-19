"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Compass,
  MapPin,
  RotateCcw,
  AlertCircle,
  Check,
  Info,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

interface QiblaCompassProps {
  onClose: () => void;
}

export function QiblaCompass({ onClose }: QiblaCompassProps) {
  const { success, error: showError } = useToast();
  const [orientation, setOrientation] = useState<{
    alpha: number;
    beta: number;
    gamma: number;
  } | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
  } | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const compassRef = useRef<HTMLDivElement>(null);

  // Mock Qibla direction calculation (in production, this would use proper calculation)
  const calculateQiblaDirection = (lat: number, lng: number) => {
    // Kaaba coordinates
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    
    // Simplified calculation (in production, use proper spherical geometry)
    const deltaLng = kaabaLng - lng;
    const y = Math.sin(deltaLng * Math.PI / 180);
    const x = Math.cos(lat * Math.PI / 180) * Math.tan(kaabaLat * Math.PI / 180) - 
              Math.sin(lat * Math.PI / 180) * Math.cos(deltaLng * Math.PI / 180);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Get user location
  const getLocation = async () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by this browser");
      setIsSupported(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;
      const qiblaDir = calculateQiblaDirection(latitude, longitude);
      
      setLocation({ latitude, longitude, city: "Current Location" });
      setQiblaDirection(qiblaDir);
      success("Location detected successfully");
    } catch (err) {
      showError("Unable to detect location. Please enable location services.");
    } finally {
      setIsLoading(false);
    }
  };

  // Request device orientation permission
  const requestOrientationPermission = async () => {
    if (!window.DeviceOrientationEvent) {
      showError("Device orientation is not supported");
      setIsSupported(false);
      return;
    }

    // Check if permission is needed (iOS 13+)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          startOrientationTracking();
        } else {
          showError("Orientation permission denied");
        }
      } catch (err) {
        showError("Failed to request orientation permission");
      }
    } else {
      startOrientationTracking();
    }
  };

  const startOrientationTracking = () => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setOrientation({
          alpha: event.alpha,
          beta: event.beta || 0,
          gamma: event.gamma || 0,
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  };

  const calibrateCompass = () => {
    setIsCalibrated(true);
    success("Compass calibrated successfully");
  };

  const getCurrentHeading = () => {
    if (!orientation || !isCalibrated) return 0;
    return orientation.alpha;
  };

  const getQiblaAngle = () => {
    const currentHeading = getCurrentHeading();
    const qiblaAngle = (qiblaDirection - currentHeading + 360) % 360;
    return qiblaAngle;
  };

  const getDistanceToQibla = () => {
    if (!location) return 0;
    
    // Simplified distance calculation to Kaaba
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    
    const R = 6371; // Earth's radius in km
    const dLat = (kaabaLat - location.latitude) * Math.PI / 180;
    const dLng = (kaabaLng - location.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(location.latitude * Math.PI / 180) * 
              Math.cos(kaabaLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  useEffect(() => {
    // Auto-detect location on component mount
    getLocation();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('deviceorientation', () => {});
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Qibla Compass</h1>
        </div>
        
        <div className="bg-card rounded-lg shadow-md border border-border p-8 text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Device Not Supported
          </h2>
          <p className="text-muted-foreground">
            Your device doesn&apos;t support the features needed for the Qibla compass.
            Please try on a mobile device with orientation sensors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Qibla Compass</h1>
          <p className="text-muted-foreground">
            {location ? `${location.city}` : "Location not detected"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Compass */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-md border border-border p-8">
            {/* Compass Circle */}
            <div className="relative w-80 h-80 mx-auto mb-6">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-8 border-muted">
                {/* Degree Markers */}
                {Array.from({ length: 36 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-4 bg-muted-foreground rounded-full"
                    style={{
                      top: '8px',
                      left: '50%',
                      transformOrigin: '50% 152px',
                      transform: `translateX(-50%) rotate(${i * 10}deg)`,
                    }}
                  />
                ))}
                
                {/* Cardinal Directions */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-lg font-bold text-foreground">
                  N
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-lg font-bold text-foreground">
                  S
                </div>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-bold text-foreground">
                  W
                </div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-bold text-foreground">
                  E
                </div>
              </div>

              {/* Compass Needle */}
              <motion.div
                ref={compassRef}
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: getCurrentHeading() }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <div className="relative">
                  {/* North Pointer */}
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[60px] border-l-transparent border-r-transparent border-b-red-600 absolute -top-8 left-1/2 transform -translate-x-1/2" />
                  {/* South Pointer */}
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[60px] border-l-transparent border-r-transparent border-t-gray-400 absolute -bottom-8 left-1/2 transform -translate-x-1/2" />
                  {/* Center Circle */}
                  <div className="w-6 h-6 bg-white border-2 border-gray-400 rounded-full" />
                </div>
              </motion.div>

              {/* Qibla Indicator */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: getQiblaAngle() }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <div className="relative">
                  {/* Qibla Pointer */}
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[40px] border-l-transparent border-r-transparent border-b-green-600 absolute -top-6 left-1/2 transform -translate-x-1/2" />
                  {/* Qibla Label */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-600 bg-white px-2 py-1 rounded">
                    QIBLA
                  </div>
                </div>
              </motion.div>

              {/* Center Info */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {Math.round(getQiblaAngle())}°
                  </div>
                  <div className="text-xs text-muted-foreground">to Qibla</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={requestOrientationPermission}
                disabled={!location}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Enable Compass
              </Button>
              <Button
                onClick={calibrateCompass}
                variant="outline"
                disabled={!orientation}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Calibrate
              </Button>
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
                  <span className="text-foreground">{location.city}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getLocation}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Detecting..." : "Update Location"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>Location not detected</span>
                </div>
                <Button
                  onClick={getLocation}
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  {isLoading ? "Detecting..." : "Detect Location"}
                </Button>
              </div>
            )}
          </div>

          {/* Qibla Info */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Qibla Information</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Direction:</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(qiblaDirection)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Distance:</span>
                <span className="text-sm font-medium text-foreground">
                  {getDistanceToQibla()} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`text-sm font-medium ${
                  isCalibrated ? "text-green-600" : "text-yellow-600"
                }`}>
                  {isCalibrated ? "Calibrated" : "Needs Calibration"}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-foreground">Instructions</h3>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>1. Enable location services</div>
              <div>2. Allow orientation access</div>
              <div>3. Hold device flat and level</div>
              <div>4. Rotate to align with Qibla</div>
              <div>5. Calibrate if needed</div>
            </div>
          </div>

          {/* Kaaba Info */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="font-semibold mb-2">Kaaba Direction</h3>
            <p className="text-sm opacity-90 mb-3">
              The green pointer shows the direction to the Kaaba in Makkah, Saudi Arabia.
            </p>
            <div className="text-xs opacity-75">
              Coordinates: 21.4225°N, 39.8262°E
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
