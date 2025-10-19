"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Mail,
  Link as LinkIcon,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Handshake,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

type SettingsSection = "notifications" | "privacy" | "email" | "connected" | "data" | "companions" | "parental" | "account";

export default function SettingsPage() {
  const { success, error: showError } = useToast();
  const [expandedSections, setExpandedSections] = useState<Set<SettingsSection>>(
    new Set(["notifications" as SettingsSection])
  );
  const [settings, setSettings] = useState({
    notifications: {
      posts: true,
      comments: true,
      beneficial: true,
      halaqas: true,
      debates: false,
      newsletters: true,
    },
    privacy: {
      profileVisibility: "public",
      showMadhab: true,
      showLocation: true,
      allowMessages: "everyone",
    },
    email: {
      weeklyDigest: true,
      marketingEmails: false,
      securityAlerts: true,
    },
    companions: {
      canReceiveSalam: "everyone", // "everyone", "halaqas_only", "connections_only", "nobody"
      genderPreference: "any", // "same", "opposite", "any"
      maxCompanions: 50,
      autoDeclineDays: 30,
      suggestionsEnabled: true,
      showAvailabilityStatus: true,
    },
    parental: {
      isMinor: false,
      requireGuardianApproval: false,
      maxCompanionsMinor: 10,
      restrictToAgeRange: 2, // years
      monitorInteractions: true,
      allowedMinorGenders: "same", // "same", "any"
    },
  });

  const toggleSection = (section: SettingsSection) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const updateNotification = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
    success("Notification preference updated");
  };

  const updatePrivacy = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
    success("Privacy setting updated");
  };

  const updateEmail = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: value,
      },
    }));
    success("Email preference updated");
  };

  const updateCompanion = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      companions: {
        ...prev.companions,
        [key]: value,
      },
    }));
    success("Companion preference updated");
  };

  const updateParental = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      parental: {
        ...prev.parental,
        [key]: value,
      },
    }));
    success("Parental control setting updated");
  };

  const handleDataExport = () => {
    success("Your data export has been requested. You'll receive an email with a download link.");
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      showError("Account deletion requires additional verification. Please contact support.");
    }
  };

  const sections = [
    {
      id: "notifications" as const,
      title: "Notification Preferences",
      description: "Choose what you want to be notified about",
      icon: Bell,
      color: "text-blue-600",
    },
    {
      id: "privacy" as const,
      title: "Privacy Settings",
      description: "Control who can see your information",
      icon: Lock,
      color: "text-green-600",
    },
    {
      id: "email" as const,
      title: "Email Preferences",
      description: "Manage email communications",
      icon: Mail,
      color: "text-purple-600",
    },
    {
      id: "companions" as const,
      title: "Companion Preferences",
      description: "Customize your companion connections",
      icon: Handshake,
      color: "text-teal-600",
    },
    {
      id: "parental" as const,
      title: "Parental Controls",
      description: "Manage safety settings for minors",
      icon: Shield,
      color: "text-orange-600",
    },
    {
      id: "connected" as const,
      title: "Connected Accounts",
      description: "Manage third-party connections",
      icon: LinkIcon,
      color: "text-orange-600",
    },
    {
      id: "data" as const,
      title: "Data & Privacy",
      description: "Download or delete your data",
      icon: Download,
      color: "text-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container-custom py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-foreground-secondary">
            Manage your account preferences and privacy
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <section.icon className={`w-6 h-6 ${section.color}`} />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                {expandedSections.has(section.id) ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {expandedSections.has(section.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-border pt-4">
                      {/* Notifications */}
                      {section.id === "notifications" && (
                        <div className="space-y-4">
                          {Object.entries(settings.notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-2">
                              <div>
                                <Label className="capitalize font-medium">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Receive notifications for {key.toLowerCase()}
                                </p>
                              </div>
                              <button
                                onClick={() => updateNotification(key, !value)}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                  value ? "bg-primary-600" : "bg-muted"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                    value ? "translate-x-6" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Privacy */}
                      {section.id === "privacy" && (
                        <div className="space-y-6">
                          <div>
                            <Label className="mb-3 block">Profile Visibility</Label>
                            <div className="space-y-2">
                              {["public", "halaqas", "private"].map((option) => (
                                <button
                                  key={option}
                                  onClick={() => updatePrivacy("profileVisibility", option)}
                                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    settings.privacy.profileVisibility === option
                                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                      : "border-border hover:border-primary-300"
                                  }`}
                                >
                                  <div className="font-medium capitalize">{option}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {option === "public" && "Everyone can view your profile"}
                                    {option === "halaqas" && "Only Halaqa members can view"}
                                    {option === "private" && "Only you can view your profile"}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <Label>Show Madhab Preference</Label>
                            <button
                              onClick={() => updatePrivacy("showMadhab", !settings.privacy.showMadhab)}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                settings.privacy.showMadhab ? "bg-primary-600" : "bg-muted"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                  settings.privacy.showMadhab ? "translate-x-6" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <Label>Show Location</Label>
                            <button
                              onClick={() => updatePrivacy("showLocation", !settings.privacy.showLocation)}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                settings.privacy.showLocation ? "bg-primary-600" : "bg-muted"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                  settings.privacy.showLocation ? "translate-x-6" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Email */}
                      {section.id === "email" && (
                        <div className="space-y-4">
                          {Object.entries(settings.email).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-2">
                              <div>
                                <Label className="capitalize font-medium">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  {key === "weeklyDigest" && "Receive weekly summary of activity"}
                                  {key === "marketingEmails" && "Receive updates and announcements"}
                                  {key === "securityAlerts" && "Important account security notifications"}
                                </p>
                              </div>
                              <button
                                onClick={() => updateEmail(key, !value)}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                  value ? "bg-primary-600" : "bg-muted"
                                }`}
                                disabled={key === "securityAlerts"}
                              >
                                <div
                                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                    value ? "translate-x-6" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Companion Preferences */}
                      {section.id === "companions" && (
                        <div className="space-y-6">
                          <div>
                            <Label className="mb-3 block font-semibold">Who can send you Salam?</Label>
                            <div className="space-y-2">
                              {[
                                { value: "everyone", label: "Everyone", desc: "Anyone can send connection requests" },
                                { value: "halaqas_only", label: "Halaqa Members Only", desc: "Only people from your Halaqas" },
                                { value: "connections_only", label: "Existing Companions Only", desc: "Only your current companions" },
                                { value: "nobody", label: "Nobody", desc: "Disable connection requests" },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => updateCompanion("canReceiveSalam", option.value)}
                                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    settings.companions.canReceiveSalam === option.value
                                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                      : "border-border hover:border-primary-300"
                                  }`}
                                >
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-muted-foreground">{option.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="mb-3 block font-semibold">Gender Preference</Label>
                            <div className="space-y-2">
                              {[
                                { value: "same", label: "Same Gender", desc: "Connect with same gender" },
                                { value: "opposite", label: "Opposite Gender", desc: "Connect with opposite gender" },
                                { value: "any", label: "Any Gender", desc: "Connect with anyone" },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => updateCompanion("genderPreference", option.value)}
                                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    settings.companions.genderPreference === option.value
                                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                      : "border-border hover:border-primary-300"
                                  }`}
                                >
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-muted-foreground">{option.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="mb-3 block font-semibold">Maximum Companions</Label>
                            <div className="flex items-center gap-4">
                              <input
                                type="range"
                                min="5"
                                max="100"
                                value={settings.companions.maxCompanions}
                                onChange={(e) => updateCompanion("maxCompanions", parseInt(e.target.value))}
                                className="flex-1"
                              />
                              <span className="text-lg font-semibold text-primary-600 min-w-[50px] text-right">
                                {settings.companions.maxCompanions}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Limit the number of active companion connections
                            </p>
                          </div>

                          <div>
                            <Label className="mb-3 block font-semibold">Auto-decline Requests After</Label>
                            <div className="flex items-center gap-4">
                              <input
                                type="range"
                                min="7"
                                max="90"
                                step="7"
                                value={settings.companions.autoDeclineDays}
                                onChange={(e) => updateCompanion("autoDeclineDays", parseInt(e.target.value))}
                                className="flex-1"
                              />
                              <span className="text-lg font-semibold text-primary-600 min-w-[80px] text-right">
                                {settings.companions.autoDeclineDays} days
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Pending requests older than this will be automatically declined
                            </p>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <Label className="font-medium">Companion Suggestions</Label>
                              <p className="text-sm text-muted-foreground">Receive daily companion recommendations</p>
                            </div>
                            <button
                              onClick={() => updateCompanion("suggestionsEnabled", !settings.companions.suggestionsEnabled)}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                settings.companions.suggestionsEnabled ? "bg-primary-600" : "bg-muted"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                  settings.companions.suggestionsEnabled ? "translate-x-6" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <Label className="font-medium">Show Availability Status</Label>
                              <p className="text-sm text-muted-foreground">Let others see when you&apos;re available</p>
                            </div>
                            <button
                              onClick={() => updateCompanion("showAvailabilityStatus", !settings.companions.showAvailabilityStatus)}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                settings.companions.showAvailabilityStatus ? "bg-primary-600" : "bg-muted"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                  settings.companions.showAvailabilityStatus ? "translate-x-6" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Parental Controls */}
                      {section.id === "parental" && (
                        <div className="space-y-6">
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              ⚠️ Parental controls help protect minors while they build meaningful connections on the platform.
                            </p>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <Label className="font-medium">This account is for a minor</Label>
                              <p className="text-sm text-muted-foreground">Enable additional safety features</p>
                            </div>
                            <button
                              onClick={() => updateParental("isMinor", !settings.parental.isMinor)}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                settings.parental.isMinor ? "bg-primary-600" : "bg-muted"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                  settings.parental.isMinor ? "translate-x-6" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>

                          {settings.parental.isMinor && (
                            <>
                              <div className="flex items-center justify-between py-2">
                                <div>
                                  <Label className="font-medium">Require Guardian Approval</Label>
                                  <p className="text-sm text-muted-foreground">Guardian must approve each companion request</p>
                                </div>
                                <button
                                  onClick={() => updateParental("requireGuardianApproval", !settings.parental.requireGuardianApproval)}
                                  className={`w-12 h-6 rounded-full transition-colors ${
                                    settings.parental.requireGuardianApproval ? "bg-primary-600" : "bg-muted"
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                      settings.parental.requireGuardianApproval ? "translate-x-6" : "translate-x-0.5"
                                    }`}
                                  />
                                </button>
                              </div>

                              <div>
                                <Label className="mb-3 block font-semibold">Maximum Companions</Label>
                                <div className="flex items-center gap-4">
                                  <input
                                    type="range"
                                    min="1"
                                    max="25"
                                    value={settings.parental.maxCompanionsMinor}
                                    onChange={(e) => updateParental("maxCompanionsMinor", parseInt(e.target.value))}
                                    className="flex-1"
                                  />
                                  <span className="text-lg font-semibold text-primary-600 min-w-[50px] text-right">
                                    {settings.parental.maxCompanionsMinor}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <Label className="mb-3 block font-semibold">Age Range Restriction</Label>
                                <div className="flex items-center gap-4">
                                  <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    value={settings.parental.restrictToAgeRange}
                                    onChange={(e) => updateParental("restrictToAgeRange", parseInt(e.target.value))}
                                    className="flex-1"
                                  />
                                  <span className="text-lg font-semibold text-primary-600 min-w-[120px] text-right">
                                    ±{settings.parental.restrictToAgeRange} years
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Restrict companions to within this age range
                                </p>
                              </div>

                              <div className="flex items-center justify-between py-2">
                                <div>
                                  <Label className="font-medium">Monitor Interactions</Label>
                                  <p className="text-sm text-muted-foreground">Guardian can view companion activity</p>
                                </div>
                                <button
                                  onClick={() => updateParental("monitorInteractions", !settings.parental.monitorInteractions)}
                                  className={`w-12 h-6 rounded-full transition-colors ${
                                    settings.parental.monitorInteractions ? "bg-primary-600" : "bg-muted"
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                      settings.parental.monitorInteractions ? "translate-x-6" : "translate-x-0.5"
                                    }`}
                                  />
                                </button>
                              </div>

                              <div>
                                <Label className="mb-3 block font-semibold">Allowed Genders</Label>
                                <div className="space-y-2">
                                  {[
                                    { value: "same", label: "Same Gender Only", desc: "Connect only with same gender" },
                                    { value: "any", label: "Any Gender", desc: "Connect with anyone" },
                                  ].map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() => updateParental("allowedMinorGenders", option.value)}
                                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                        settings.parental.allowedMinorGenders === option.value
                                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                          : "border-border hover:border-primary-300"
                                      }`}
                                    >
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-sm text-muted-foreground">{option.desc}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Connected Accounts */}
                      {section.id === "connected" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                  <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                  />
                                  <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  />
                                  <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                  />
                                  <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-foreground">Google</div>
                                <div className="text-sm text-muted-foreground">Connected</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Disconnect
                            </Button>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            Connect other accounts to streamline your login experience
                          </p>
                        </div>
                      )}

                      {/* Data & Privacy */}
                      {section.id === "data" && (
                        <div className="space-y-6">
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                  Export Your Data
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                  Download a copy of your posts, comments, and profile information
                                </p>
                                <Button
                                  onClick={handleDataExport}
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Request Data Export
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                  Delete Account
                                </h4>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                                  Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <Button
                                  onClick={handleDeleteAccount}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-300 text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Account
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Save Confirmation */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <Check className="w-4 h-4" />
              <span>All changes are automatically saved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
