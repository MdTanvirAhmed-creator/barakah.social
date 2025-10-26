"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  FileText,
  Video,
  BookOpen,
  Languages,
  File,
  FileSpreadsheet,
  FileJson,
  Youtube,
  Link,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Zap,
  Target,
  Filter,
  Search,
  Settings,
  Play,
  Pause,
  Square,
  RotateCcw,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share,
  ExternalLink,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Tag,
  Calendar,
  User,
  Hash,
  HelpCircle,
  Shield,
  Lock,
  Unlock,
  Archive,
  Star,
  Heart,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Flag,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Sparkles,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Flame,
  Snowflake,
  Thermometer,
  Umbrella,
  TreePine,
  TreeDeciduous,
  Flower,
  Leaf,
  Sprout,
  Seedling,
  Cactus,
  PalmTree,
  Mountain,
  Waves,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Squirrel,
  Butterfly,
  Bee,
  Ant,
  Spider,
  Ladybug,
  Dragonfly,
  Firefly,
  Snail,
  Turtle,
  Frog,
  Lizard,
  Snake,
  Mouse,
  Hamster,
  GuineaPig,
  Hedgehog,
  Fox,
  Wolf,
  Bear,
  Lion,
  Tiger,
  Elephant,
  Giraffe,
  Zebra,
  Horse,
  Cow,
  Pig,
  Sheep,
  Goat,
  Chicken,
  Duck,
  Goose,
  Turkey,
  Peacock,
  Owl,
  Eagle,
  Hawk,
  Falcon,
  Parrot,
  Toucan,
  Flamingo,
  Penguin,
  Seal,
  Whale,
  Dolphin,
  Shark,
  Octopus,
  Jellyfish,
  Crab,
  Lobster,
  Shrimp,
  Clam,
  Oyster,
  Starfish,
  SeaUrchin,
  Coral,
  Seaweed,
  Algae,
  Moss,
  Fern,
  Bamboo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ImportJob {
  id: string;
  name: string;
  type: "csv" | "json" | "youtube" | "pdf" | "bulk";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  totalItems: number;
  processedItems: number;
  errors: number;
  warnings: number;
  createdAt: string;
  completedAt?: string;
  errorLog?: string[];
  settings?: ImportSettings;
}

interface ImportSettings {
  autoTag: boolean;
  duplicateDetection: boolean;
  qualityCheck: boolean;
  autoApprove: boolean;
  defaultCategory: string;
  defaultLanguage: string;
  targetAudience: "beginner" | "intermediate" | "advanced";
  batchSize: number;
  delayBetweenBatches: number;
}

interface ImportTemplate {
  name: string;
  description: string;
  icon: any;
  fields: string[];
  sampleData: any[];
}

const IMPORT_TYPES = {
  csv: { icon: FileSpreadsheet, label: "CSV File", color: "text-green-600", bgColor: "bg-green-50" },
  json: { icon: FileJson, label: "JSON File", color: "text-blue-600", bgColor: "bg-blue-50" },
  youtube: { icon: Youtube, label: "YouTube Playlist", color: "text-red-600", bgColor: "bg-red-50" },
  pdf: { icon: File, label: "PDF Documents", color: "text-purple-600", bgColor: "bg-purple-50" },
  bulk: { icon: Upload, label: "Bulk Upload", color: "text-orange-600", bgColor: "bg-orange-50" },
};

const IMPORT_TEMPLATES: ImportTemplate[] = [
  {
    name: "Articles Template",
    description: "Import articles with title, content, author, and metadata",
    icon: FileText,
    fields: ["title", "content", "author", "category", "tags", "language", "targetAudience"],
    sampleData: [
      {
        title: "Sample Article Title",
        content: "Sample article content...",
        author: "Author Name",
        category: "Category",
        tags: "tag1,tag2,tag3",
        language: "en",
        targetAudience: "intermediate"
      }
    ]
  },
  {
    name: "Videos Template",
    description: "Import video content with links, titles, and descriptions",
    icon: Video,
    fields: ["title", "description", "videoUrl", "author", "category", "tags", "language"],
    sampleData: [
      {
        title: "Sample Video Title",
        description: "Sample video description",
        videoUrl: "https://example.com/video",
        author: "Author Name",
        category: "Category",
        tags: "tag1,tag2,tag3",
        language: "en"
      }
    ]
  },
  {
    name: "Books Template",
    description: "Import book recommendations with metadata",
    icon: BookOpen,
    fields: ["title", "author", "description", "category", "tags", "language", "isbn"],
    sampleData: [
      {
        title: "Sample Book Title",
        author: "Author Name",
        description: "Sample book description",
        category: "Category",
        tags: "tag1,tag2,tag3",
        language: "en",
        isbn: "978-0000000000"
      }
    ]
  },
  {
    name: "Translations Template",
    description: "Import translated content with source and target languages",
    icon: Languages,
    fields: ["title", "content", "originalLanguage", "targetLanguage", "translator", "category"],
    sampleData: [
      {
        title: "Sample Translation Title",
        content: "Sample translated content...",
        originalLanguage: "ar",
        targetLanguage: "en",
        translator: "Translator Name",
        category: "Category"
      }
    ]
  }
];

export default function BulkImportTool({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<"upload" | "templates" | "jobs" | "settings">("upload");
  const [selectedType, setSelectedType] = useState<"csv" | "json" | "youtube" | "pdf" | "bulk">("csv");
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    autoTag: true,
    duplicateDetection: true,
    qualityCheck: true,
    autoApprove: false,
    defaultCategory: "General",
    defaultLanguage: "en",
    targetAudience: "beginner",
    batchSize: 10,
    delayBetweenBatches: 1000,
  });
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      parseFile(file);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      let data: any[] = [];

      if (selectedType === "csv") {
        data = parseCSV(text);
      } else if (selectedType === "json") {
        data = JSON.parse(text);
      }

      setPreviewData(data.slice(0, 5)); // Show first 5 rows
      validateData(data);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file");
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    return data.filter(row => Object.values(row).some(v => v !== ''));
  };

  const validateData = (data: any[]) => {
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push("No data found in file");
    }

    if (selectedTemplate) {
      const requiredFields = selectedTemplate.fields;
      const missingFields = requiredFields.filter(field => 
        !data[0] || !data[0][field]
      );
      
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      }
    }

    setValidationErrors(errors);
  };

  const handleStartImport = async () => {
    try {
      setProcessing(true);
      
      const job: ImportJob = {
        id: Date.now().toString(),
        name: uploadedFile?.name || `Import ${selectedType.toUpperCase()}`,
        type: selectedType,
        status: "processing",
        progress: 0,
        totalItems: previewData.length,
        processedItems: 0,
        errors: 0,
        warnings: 0,
        createdAt: new Date().toISOString(),
        settings: importSettings,
      };

      setImportJobs(prev => [job, ...prev]);

      // Simulate import process
      for (let i = 0; i < job.totalItems; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setImportJobs(prev => 
          prev.map(j => 
            j.id === job.id 
              ? { 
                  ...j, 
                  processedItems: i + 1,
                  progress: Math.round(((i + 1) / job.totalItems) * 100)
                }
              : j
          )
        );
      }

      // Mark as completed
      setImportJobs(prev => 
        prev.map(j => 
          j.id === job.id 
            ? { 
                ...j, 
                status: "completed" as any,
                completedAt: new Date().toISOString()
              }
            : j
        )
      );

      toast.success("Import completed successfully");
      setUploadedFile(null);
      setPreviewData([]);
      setValidationErrors([]);
    } catch (error) {
      console.error("Error during import:", error);
      toast.error("Import failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleYouTubeImport = async () => {
    if (!youtubeUrl) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    try {
      setProcessing(true);
      
      const job: ImportJob = {
        id: Date.now().toString(),
        name: `YouTube Playlist Import`,
        type: "youtube",
        status: "processing",
        progress: 0,
        totalItems: 0,
        processedItems: 0,
        errors: 0,
        warnings: 0,
        createdAt: new Date().toISOString(),
        settings: importSettings,
      };

      setImportJobs(prev => [job, ...prev]);

      // Simulate YouTube import
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setImportJobs(prev => 
        prev.map(j => 
          j.id === job.id 
            ? { 
                ...j, 
                status: "completed" as any,
                totalItems: 25,
                processedItems: 25,
                progress: 100,
                completedAt: new Date().toISOString()
              }
            : j
        )
      );

      toast.success("YouTube playlist imported successfully");
      setYoutubeUrl("");
    } catch (error) {
      console.error("Error importing YouTube playlist:", error);
      toast.error("YouTube import failed");
    } finally {
      setProcessing(false);
    }
  };

  const handlePDFImport = async () => {
    if (pdfFiles.length === 0) {
      toast.error("Please select PDF files");
      return;
    }

    try {
      setProcessing(true);
      
      const job: ImportJob = {
        id: Date.now().toString(),
        name: `PDF Import (${pdfFiles.length} files)`,
        type: "pdf",
        status: "processing",
        progress: 0,
        totalItems: pdfFiles.length,
        processedItems: 0,
        errors: 0,
        warnings: 0,
        createdAt: new Date().toISOString(),
        settings: importSettings,
      };

      setImportJobs(prev => [job, ...prev]);

      // Simulate PDF processing
      for (let i = 0; i < pdfFiles.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setImportJobs(prev => 
          prev.map(j => 
            j.id === job.id 
              ? { 
                  ...j, 
                  processedItems: i + 1,
                  progress: Math.round(((i + 1) / pdfFiles.length) * 100)
                }
              : j
          )
        );
      }

      setImportJobs(prev => 
        prev.map(j => 
          j.id === job.id 
            ? { 
                ...j, 
                status: "completed" as any,
                completedAt: new Date().toISOString()
              }
            : j
        )
      );

      toast.success("PDF files processed successfully");
      setPdfFiles([]);
    } catch (error) {
      console.error("Error processing PDF files:", error);
      toast.error("PDF processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = (template: ImportTemplate) => {
    const csvContent = [
      template.fields.join(','),
      ...template.sampleData.map(row => 
        template.fields.map(field => row[field] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(' ', '_')}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-lg shadow-xl border border-border w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50">
              <Upload className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Bulk Import Tool
              </h2>
              <p className="text-sm text-muted-foreground">
                Import content from various sources
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <XCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          {[
            { id: "upload", label: "Upload", icon: Upload },
            { id: "templates", label: "Templates", icon: FileText },
            { id: "jobs", label: "Import Jobs", icon: Clock },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id as any)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              {/* Import Type Selection */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Select Import Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(IMPORT_TYPES).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type as any)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedType === type
                            ? `${config.bgColor} ${config.color} border-2`
                            : "border-border hover:border-primary-200"
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${config.color}`} />
                        <p className="text-sm font-medium">{config.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Upload */}
              {selectedType === "csv" || selectedType === "json" ? (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Upload File</h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      Drop your {selectedType.toUpperCase()} file here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={selectedType === "csv" ? ".csv" : ".json"}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Choose File
                    </Button>
                    {uploadedFile && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-foreground">
                          {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedType === "youtube" ? (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">YouTube Playlist</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        YouTube URL
                      </label>
                      <Input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/playlist?list=..."
                      />
                    </div>
                    <Button onClick={handleYouTubeImport} disabled={processing || !youtubeUrl}>
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Importing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4" />
                          Import Playlist
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              ) : selectedType === "pdf" ? (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">PDF Documents</h3>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">
                        Select PDF files to process
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => setPdfFiles(Array.from(e.target.files || []))}
                        className="hidden"
                        id="pdf-upload"
                      />
                      <Button onClick={() => document.getElementById('pdf-upload')?.click()}>
                        Choose PDFs
                      </Button>
                      {pdfFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {pdfFiles.map((file, index) => (
                            <div key={index} className="p-2 bg-muted rounded text-sm">
                              {file.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button onClick={handlePDFImport} disabled={processing || pdfFiles.length === 0}>
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4" />
                          Process PDFs
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Data Preview */}
              {previewData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Data Preview</h3>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(previewData[0] || {}).map((key) => (
                              <th key={key} className="px-4 py-2 text-left text-sm font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, index) => (
                            <tr key={index} className="border-t border-border">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 text-sm">
                                  {String(value).substring(0, 50)}
                                  {String(value).length > 50 && "..."}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Validation Errors</h4>
                  <ul className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Import Actions */}
              {previewData.length > 0 && validationErrors.length === 0 && (
                <div className="flex items-center gap-3">
                  <Button onClick={handleStartImport} disabled={processing}>
                    {processing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Start Import
                      </div>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setUploadedFile(null);
                    setPreviewData([]);
                    setValidationErrors([]);
                  }}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Import Templates</h3>
                <p className="text-muted-foreground mb-6">
                  Download templates to see the required format for importing content
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {IMPORT_TEMPLATES.map((template, index) => {
                    const Icon = template.icon;
                    return (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            {template.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {template.description}
                          </p>
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-foreground mb-2">Required Fields:</h4>
                            <div className="flex flex-wrap gap-1">
                              {template.fields.map((field) => (
                                <Badge key={field} variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadTemplate(template)}
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Template
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Import Jobs Tab */}
          {activeTab === "jobs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Import Jobs</h3>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <div className="space-y-4">
                {importJobs.map((job) => {
                  const typeConfig = IMPORT_TYPES[job.type];
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <TypeIcon className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{job.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {job.type.toUpperCase()} • {job.totalItems} items
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={
                            job.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                            job.status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            job.status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }>
                            {job.status}
                          </Badge>
                        </div>

                        {job.status === "processing" && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                              <span>Progress</span>
                              <span>{job.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {job.processedItems} of {job.totalItems} items processed
                              {job.errors > 0 && ` • ${job.errors} errors`}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                          {job.completedAt && (
                            <span>Completed: {new Date(job.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Import Settings</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Default Category
                      </label>
                      <Input
                        value={importSettings.defaultCategory}
                        onChange={(e) => setImportSettings(prev => ({ ...prev, defaultCategory: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Default Language
                      </label>
                      <select
                        value={importSettings.defaultLanguage}
                        onChange={(e) => setImportSettings(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="en">English</option>
                        <option value="ar">Arabic</option>
                        <option value="ur">Urdu</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Target Audience
                      </label>
                      <select
                        value={importSettings.targetAudience}
                        onChange={(e) => setImportSettings(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Batch Size
                      </label>
                      <Input
                        type="number"
                        value={importSettings.batchSize}
                        onChange={(e) => setImportSettings(prev => ({ ...prev, batchSize: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Processing Options</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importSettings.autoTag}
                          onChange={(e) => setImportSettings(prev => ({ ...prev, autoTag: e.target.checked }))}
                        />
                        <span className="text-sm">Auto-generate tags using AI</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importSettings.duplicateDetection}
                          onChange={(e) => setImportSettings(prev => ({ ...prev, duplicateDetection: e.target.checked }))}
                        />
                        <span className="text-sm">Detect and handle duplicates</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importSettings.qualityCheck}
                          onChange={(e) => setImportSettings(prev => ({ ...prev, qualityCheck: e.target.checked }))}
                        />
                        <span className="text-sm">Perform quality checks</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importSettings.autoApprove}
                          onChange={(e) => setImportSettings(prev => ({ ...prev, autoApprove: e.target.checked }))}
                        />
                        <span className="text-sm">Auto-approve high-quality content</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
