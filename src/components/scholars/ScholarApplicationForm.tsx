"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  GraduationCap,
  Award,
  Shield,
  Star,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Reference {
  name: string;
  position: string;
  contact: string;
  relationship: string;
}

interface ScholarApplicationData {
  full_name: string;
  email: string;
  phone?: string;
  credentials: string[];
  ijazah_files: File[];
  institution_affiliations: string[];
  areas_of_expertise: string[];
  sample_content: File[];
  references: Reference[];
  bio: string;
  location: string;
  preferred_verification_level: "gold" | "silver" | "bronze" | "student";
}

const VERIFICATION_LEVELS = {
  gold: {
    label: "Gold Scholar",
    description: "Internationally recognized scholars with extensive credentials",
    icon: Star,
    requirements: [
      "PhD in Islamic Studies or related field",
      "Published academic works",
      "International recognition",
      "Teaching experience at university level",
    ],
  },
  silver: {
    label: "Silver Scholar",
    description: "Nationally recognized scholars and university professors",
    icon: Award,
    requirements: [
      "Masters degree in Islamic Studies",
      "University teaching experience",
      "Published works or research",
      "National recognition in field",
    ],
  },
  bronze: {
    label: "Bronze Scholar",
    description: "Local imams and teachers with valid credentials",
    icon: Shield,
    requirements: [
      "Islamic education certification",
      "Local community recognition",
      "Teaching experience",
      "Valid ijazah or certification",
    ],
  },
  student: {
    label: "Student Scholar",
    description: "Advanced students under scholar supervision",
    icon: GraduationCap,
    requirements: [
      "Advanced Islamic studies",
      "Under supervision of recognized scholar",
      "Demonstrated knowledge",
      "Recommendation from teacher",
    ],
  },
};

const EXPERTISE_AREAS = [
  "Quran", "Hadith", "Tafsir", "Fiqh", "Aqeedah", "Seerah", "Arabic",
  "Tajweed", "Islamic History", "Islamic Law", "Sufism", "Comparative Religion",
  "Islamic Economics", "Islamic Education", "Islamic Psychology", "Other"
];

export default function ScholarApplicationForm() {
  const [formData, setFormData] = useState<ScholarApplicationData>({
    full_name: "",
    email: "",
    phone: "",
    credentials: [],
    ijazah_files: [],
    institution_affiliations: [],
    areas_of_expertise: [],
    sample_content: [],
    references: [],
    bio: "",
    location: "",
    preferred_verification_level: "bronze",
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [newCredential, setNewCredential] = useState("");
  const [newInstitution, setNewInstitution] = useState("");
  const [newReference, setNewReference] = useState<Reference>({
    name: "",
    position: "",
    contact: "",
    relationship: "",
  });

  const supabase = createClient();

  const handleInputChange = (field: keyof ScholarApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCredential = () => {
    if (newCredential.trim()) {
      setFormData(prev => ({
        ...prev,
        credentials: [...prev.credentials, newCredential.trim()]
      }));
      setNewCredential("");
    }
  };

  const removeCredential = (index: number) => {
    setFormData(prev => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index)
    }));
  };

  const addInstitution = () => {
    if (newInstitution.trim()) {
      setFormData(prev => ({
        ...prev,
        institution_affiliations: [...prev.institution_affiliations, newInstitution.trim()]
      }));
      setNewInstitution("");
    }
  };

  const removeInstitution = (index: number) => {
    setFormData(prev => ({
      ...prev,
      institution_affiliations: prev.institution_affiliations.filter((_, i) => i !== index)
    }));
  };

  const addReference = () => {
    if (newReference.name.trim() && newReference.position.trim()) {
      setFormData(prev => ({
        ...prev,
        references: [...prev.references, { ...newReference }]
      }));
      setNewReference({ name: "", position: "", contact: "", relationship: "" });
    }
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (field: "ijazah_files" | "sample_content", files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], ...fileArray]
      }));
    }
  };

  const removeFile = (field: "ijazah_files" | "sample_content", index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // In a real implementation, this would submit to the database
      console.log("Submitting scholar application:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Scholar application submitted successfully!");
      
      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        credentials: [],
        ijazah_files: [],
        institution_affiliations: [],
        areas_of_expertise: [],
        sample_content: [],
        references: [],
        bio: "",
        location: "",
        preferred_verification_level: "bronze",
      });
      setCurrentStep(1);
      
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.full_name && formData.email;
      case 2:
        return formData.credentials.length > 0 && formData.institution_affiliations.length > 0;
      case 3:
        return formData.areas_of_expertise.length > 0 && formData.references.length >= 2;
      case 4:
        return formData.bio && formData.location;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Scholar Application Form
        </h1>
        <p className="text-muted-foreground">
          Apply to become a verified scholar and contribute to the Islamic knowledge repository
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? "bg-primary-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step ? "bg-primary-600" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Personal Info</span>
          <span>Credentials</span>
          <span>Expertise</span>
          <span>Final Details</span>
        </div>
      </div>

      {/* Step 1: Personal Information */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biography *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about your Islamic education and experience..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Credentials and Institutions */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Educational Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Add Your Credentials</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCredential}
                    onChange={(e) => setNewCredential(e.target.value)}
                    placeholder="e.g., PhD in Islamic Studies"
                  />
                  <Button onClick={addCredential} disabled={!newCredential.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.credentials.map((cred, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {cred}
                      <button
                        onClick={() => removeCredential(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Institution Affiliations</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newInstitution}
                    onChange={(e) => setNewInstitution(e.target.value)}
                    placeholder="e.g., Al-Azhar University"
                  />
                  <Button onClick={addInstitution} disabled={!newInstitution.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.institution_affiliations.map((inst, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-2">
                      {inst}
                      <button
                        onClick={() => removeInstitution(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Upload Ijazah/Certificates</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload your ijazah, certificates, or diplomas
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("ijazah_files", e.target.files)}
                    className="hidden"
                    id="ijazah-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="ijazah-upload" className="cursor-pointer">
                      Choose Files
                    </label>
                  </Button>
                </div>
                {formData.ijazah_files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.ijazah_files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <button
                          onClick={() => removeFile("ijazah_files", index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 3: Expertise and References */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Areas of Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EXPERTISE_AREAS.map((area) => (
                  <label key={area} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.areas_of_expertise.includes(area)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            areas_of_expertise: [...prev.areas_of_expertise, area]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            areas_of_expertise: prev.areas_of_expertise.filter(a => a !== area)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{area}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>References (Minimum 2 Required)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.references.map((ref, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Reference {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReference(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={ref.name} disabled />
                    </div>
                    <div>
                      <Label>Position</Label>
                      <Input value={ref.position} disabled />
                    </div>
                    <div>
                      <Label>Contact</Label>
                      <Input value={ref.contact} disabled />
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      <Input value={ref.relationship} disabled />
                    </div>
                  </div>
                </div>
              ))}

              <div className="border border-dashed border-border rounded-lg p-4">
                <h4 className="font-medium mb-3">Add New Reference</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newReference.name}
                      onChange={(e) => setNewReference(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Reference name"
                    />
                  </div>
                  <div>
                    <Label>Position</Label>
                    <Input
                      value={newReference.position}
                      onChange={(e) => setNewReference(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Their position/title"
                    />
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <Input
                      value={newReference.contact}
                      onChange={(e) => setNewReference(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder="Email or phone"
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Input
                      value={newReference.relationship}
                      onChange={(e) => setNewReference(prev => ({ ...prev, relationship: e.target.value }))}
                      placeholder="How you know them"
                    />
                  </div>
                </div>
                <Button
                  onClick={addReference}
                  disabled={!newReference.name.trim() || !newReference.position.trim()}
                  className="mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reference
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload sample lectures, articles, or other content
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.mp4,.mp3,.doc,.docx"
                  onChange={(e) => handleFileUpload("sample_content", e.target.files)}
                  className="hidden"
                  id="sample-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="sample-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
              </div>
              {formData.sample_content.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.sample_content.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{file.name}</span>
                      <button
                        onClick={() => removeFile("sample_content", index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 4: Verification Level and Final Details */}
      {currentStep === 4 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Preferred Verification Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(VERIFICATION_LEVELS).map(([key, level]) => {
                  const Icon = level.icon;
                  return (
                    <label
                      key={key}
                      className={`cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                        formData.preferred_verification_level === key
                          ? "border-primary-600 bg-primary-50"
                          : "border-border hover:border-primary-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="verification_level"
                        value={key}
                        checked={formData.preferred_verification_level === key}
                        onChange={(e) => handleInputChange("preferred_verification_level", e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <Icon className="w-6 h-6 text-primary-600 mt-1" />
                        <div>
                          <h3 className="font-semibold">{level.label}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{level.description}</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {level.requirements.map((req, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Name:</strong> {formData.full_name}
                </div>
                <div>
                  <strong>Email:</strong> {formData.email}
                </div>
                <div>
                  <strong>Location:</strong> {formData.location}
                </div>
                <div>
                  <strong>Verification Level:</strong> {VERIFICATION_LEVELS[formData.preferred_verification_level].label}
                </div>
                <div>
                  <strong>Credentials:</strong> {formData.credentials.length} added
                </div>
                <div>
                  <strong>Expertise Areas:</strong> {formData.areas_of_expertise.length} selected
                </div>
                <div>
                  <strong>References:</strong> {formData.references.length} provided
                </div>
                <div>
                  <strong>Files:</strong> {formData.ijazah_files.length + formData.sample_content.length} uploaded
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button
            onClick={nextStep}
            disabled={!isStepValid(currentStep)}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!isStepValid(4) || submitting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
