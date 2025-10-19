"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Video,
  BookOpen,
  Languages,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Save,
  Eye,
  Send,
  X,
  Plus,
  Minus,
  Type,
  Palette,
  Link2,
  ImageIcon,
  FileCode,
  BookOpenCheck,
  Globe,
  Target,
  Tag,
  Calendar,
  User,
  Hash,
  Search,
  Filter,
  Settings,
  HelpCircle,
  Info,
  AlertCircle,
  CheckCircle,
  Zap,
  Star,
  Heart,
  ThumbsUp,
  MessageCircle,
  Share,
  Bookmark,
  Flag,
  Shield,
  Lock,
  Unlock,
  Archive,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit,
  EyeOff,
  Maximize,
  Minimize,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Diamond,
  Hexagon,
  Octagon,
  Pentagon,
  Star as StarIcon,
  Heart as HeartIcon,
  Zap as ZapIcon,
  Target as TargetIcon,
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
  Snail as SnailIcon,
  Starfish,
  SeaUrchin,
  Coral,
  Seaweed,
  Algae,
  Moss,
  Fern,
  Bamboo,
  Cactus as CactusIcon,
  PalmTree as PalmTreeIcon,
  TreePine as TreePineIcon,
  TreeDeciduous as TreeDeciduousIcon,
  Flower as FlowerIcon,
  Leaf as LeafIcon,
  Sprout as SproutIcon,
  Seedling as SeedlingIcon,
  Cactus as CactusIcon2,
  PalmTree as PalmTreeIcon2,
  TreePine as TreePineIcon2,
  TreeDeciduous as TreeDeciduousIcon2,
  Flower as FlowerIcon2,
  Leaf as LeafIcon2,
  Sprout as SproutIcon2,
  Seedling as SeedlingIcon2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ContentEditorProps {
  content?: any;
  onSave?: (content: any) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

interface QuranicVerse {
  surah: string;
  ayah: number;
  text: string;
  translation: string;
}

interface Hadith {
  collection: string;
  number: string;
  text: string;
  narrator: string;
  grade: string;
}

const QURANIC_VERSES: QuranicVerse[] = [
  {
    surah: "Al-Fatiha",
    ayah: 1,
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful."
  },
  {
    surah: "Al-Fatiha",
    ayah: 2,
    text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    translation: "All praise is due to Allah, Lord of the worlds."
  },
  {
    surah: "Al-Fatiha",
    ayah: 3,
    text: "الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "The Entirely Merciful, the Especially Merciful."
  },
  {
    surah: "Al-Fatiha",
    ayah: 4,
    text: "مَالِكِ يَوْمِ الدِّينِ",
    translation: "Sovereign of the Day of Recompense."
  },
  {
    surah: "Al-Fatiha",
    ayah: 5,
    text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    translation: "It is You we worship and You we ask for help."
  },
  {
    surah: "Al-Fatiha",
    ayah: 6,
    text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    translation: "Guide us to the straight path."
  },
  {
    surah: "Al-Fatiha",
    ayah: 7,
    text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    translation: "The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray."
  }
];

const HADITH_COLLECTIONS: Hadith[] = [
  {
    collection: "Sahih Bukhari",
    number: "1",
    text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    narrator: "Umar ibn al-Khattab",
    grade: "Sahih"
  },
  {
    collection: "Sahih Muslim",
    number: "1",
    text: "مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ",
    narrator: "Aisha",
    grade: "Sahih"
  },
  {
    collection: "Sunan Abu Dawood",
    number: "1",
    text: "إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا",
    narrator: "Abu Hurairah",
    grade: "Hasan"
  }
];

const ARABIC_FONTS = [
  { name: "Amiri", value: "Amiri, serif" },
  { name: "Scheherazade", value: "Scheherazade, serif" },
  { name: "Noto Naskh Arabic", value: "Noto Naskh Arabic, serif" },
  { name: "Arabic Typesetting", value: "Arabic Typesetting, serif" },
  { name: "Traditional Arabic", value: "Traditional Arabic, serif" },
];

const CONTENT_TEMPLATES = [
  {
    name: "Article Template",
    content: `# [Article Title]

## Introduction
[Brief introduction to the topic]

## Main Content
[Main body of the article with detailed information]

## Conclusion
[Summary and key takeaways]

## References
- [Reference 1]
- [Reference 2]`
  },
  {
    name: "Quranic Study Template",
    content: `# [Surah Name] - [Ayah Number]

## Arabic Text
[Arabic verse here]

## Translation
[English translation]

## Tafsir
[Detailed explanation and commentary]

## Key Lessons
- [Lesson 1]
- [Lesson 2]
- [Lesson 3]

## Related Verses
- [Related verse 1]
- [Related verse 2]`
  },
  {
    name: "Hadith Study Template",
    content: `# [Hadith Title]

## Arabic Text
[Arabic hadith text]

## Translation
[English translation]

## Narrator
[Name of the narrator]

## Grade
[Authenticity grade]

## Explanation
[Detailed explanation of the hadith]

## Key Lessons
- [Lesson 1]
- [Lesson 2]
- [Lesson 3]`
  }
];

export default function ContentEditor({ content, onSave, onClose, isOpen = true }: ContentEditorProps) {
  const [editorContent, setEditorContent] = useState(content || {
    title: "",
    type: "article",
    category: "",
    tags: [],
    language: "en",
    targetAudience: "beginner",
    content: "",
    seoTitle: "",
    seoDescription: "",
    featuredImage: "",
    status: "draft"
  });

  const [activeTab, setActiveTab] = useState<"content" | "seo" | "preview" | "settings">("content");
  const [showQuranicVerses, setShowQuranicVerses] = useState(false);
  const [showHadith, setShowHadith] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [arabicFont, setArabicFont] = useState(ARABIC_FONTS[0].value);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [textDirection, setTextDirection] = useState<"ltr" | "rtl">("ltr");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (editorContent.content) {
      const words = editorContent.content.split(/\s+/).filter(word => word.length > 0).length;
      const chars = editorContent.content.length;
      const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words per minute
      
      setWordCount(words);
      setCharCount(chars);
      setReadingTime(readingTime);
    }
  }, [editorContent.content]);

  const handleSave = async () => {
    try {
      if (onSave) {
        onSave(editorContent);
      }
      toast.success("Content saved successfully");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    }
  };

  const handleInsertQuranicVerse = (verse: QuranicVerse) => {
    const verseText = `
<div class="quranic-verse" style="font-family: ${arabicFont}; direction: rtl; text-align: right; margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-right: 4px solid #28a745; border-radius: 4px;">
  <div style="font-size: 1.2em; line-height: 1.8; margin-bottom: 0.5rem;">${verse.text}</div>
  <div style="font-size: 0.9em; color: #666; font-style: italic;">${verse.translation}</div>
  <div style="font-size: 0.8em; color: #888; margin-top: 0.5rem;">${verse.surah} ${verse.ayah}</div>
</div>`;

    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const div = document.createElement('div');
        div.innerHTML = verseText;
        range.deleteContents();
        range.insertNode(div.firstChild!);
        selection.removeAllRanges();
      }
    }
  };

  const handleInsertHadith = (hadith: Hadith) => {
    const hadithText = `
<div class="hadith" style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
  <div style="font-family: ${arabicFont}; direction: rtl; text-align: right; font-size: 1.1em; line-height: 1.6; margin-bottom: 0.5rem;">${hadith.text}</div>
  <div style="font-size: 0.9em; color: #666; margin-bottom: 0.5rem;">${hadith.narrator}</div>
  <div style="font-size: 0.8em; color: #888;">
    <span style="background: #e9ecef; padding: 0.2rem 0.4rem; border-radius: 3px; margin-right: 0.5rem;">${hadith.collection}</span>
    <span style="background: #e9ecef; padding: 0.2rem 0.4rem; border-radius: 3px;">${hadith.grade}</span>
  </div>
</div>`;

    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const div = document.createElement('div');
        div.innerHTML = hadithText;
        range.deleteContents();
        range.insertNode(div.firstChild!);
        selection.removeAllRanges();
      }
    }
  };

  const handleApplyTemplate = (template: any) => {
    setEditorContent(prev => ({
      ...prev,
      content: template.content
    }));
    setShowTemplates(false);
  };

  const handleFormatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInsertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      handleFormatText("createLink", url);
    }
  };

  const handleInsertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const img = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; margin: 1rem 0; border-radius: 4px;" />`;
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const div = document.createElement('div');
          div.innerHTML = img;
          range.deleteContents();
          range.insertNode(div.firstChild!);
          selection.removeAllRanges();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-card rounded-lg shadow-xl border border-border w-full max-w-7xl ${
          isFullscreen ? "h-screen" : "max-h-[90vh]"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Content Editor
              </h2>
              <p className="text-sm text-muted-foreground">
                Create and edit Islamic content with Arabic support
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          {[
            { id: "content", label: "Content", icon: FileText },
            { id: "seo", label: "SEO", icon: Target },
            { id: "preview", label: "Preview", icon: Eye },
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

        <div className="flex h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-border bg-muted/30 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Content Type
                </label>
                <select
                  value={editorContent.type}
                  onChange={(e) => setEditorContent(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="book">Book</option>
                  <option value="translation">Translation</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <Input
                  value={editorContent.title}
                  onChange={(e) => setEditorContent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter content title"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <Input
                  value={editorContent.category}
                  onChange={(e) => setEditorContent(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Aqeedah, Fiqh, Quran"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Language
                </label>
                <select
                  value={editorContent.language}
                  onChange={(e) => setEditorContent(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                  <option value="ur">Urdu</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target Audience
                </label>
                <select
                  value={editorContent.targetAudience}
                  onChange={(e) => setEditorContent(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Quick Insert Tools */}
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Quick Insert</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuranicVerses(!showQuranicVerses)}
                  >
                    <BookOpenCheck className="w-4 h-4 mr-1" />
                    Quran
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHadith(!showHadith)}
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Hadith
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInsertLink}
                  >
                    <Link2 className="w-4 h-4 mr-1" />
                    Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInsertImage}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFormatText("insertCode")}
                  >
                    <FileCode className="w-4 h-4 mr-1" />
                    Code
                  </Button>
                </div>
              </div>

              {/* Quranic Verses */}
              {showQuranicVerses && (
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Quranic Verses</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {QURANIC_VERSES.map((verse, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleInsertQuranicVerse(verse)}
                        className="w-full justify-start text-xs"
                      >
                        {verse.surah} {verse.ayah}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hadith Collections */}
              {showHadith && (
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Hadith Collections</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {HADITH_COLLECTIONS.map((hadith, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleInsertHadith(hadith)}
                        className="w-full justify-start text-xs"
                      >
                        {hadith.collection} {hadith.number}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates */}
              {showTemplates && (
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Templates</h4>
                  <div className="space-y-1">
                    {CONTENT_TEMPLATES.map((template, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyTemplate(template)}
                        className="w-full justify-start text-xs"
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-foreground mb-2">Statistics</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Words:</span>
                    <span>{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span>{charCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reading time:</span>
                    <span>{readingTime} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("bold")}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("italic")}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("underline")}
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </Button>
              </div>

              <div className="w-px h-6 bg-border mx-2" />

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("insertUnorderedList")}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("insertOrderedList")}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("formatBlock", "blockquote")}
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </Button>
              </div>

              <div className="w-px h-6 bg-border mx-2" />

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("justifyLeft")}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("justifyCenter")}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("justifyRight")}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFormatText("justifyFull")}
                  title="Justify"
                >
                  <AlignJustify className="w-4 h-4" />
                </Button>
              </div>

              <div className="w-px h-6 bg-border mx-2" />

              <div className="flex items-center gap-1">
                <select
                  value={arabicFont}
                  onChange={(e) => setArabicFont(e.target.value)}
                  className="px-2 py-1 text-xs border border-border rounded bg-background"
                >
                  {ARABIC_FONTS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="px-2 py-1 text-xs border border-border rounded bg-background"
                >
                  <option value={12}>12px</option>
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={18}>18px</option>
                  <option value={20}>20px</option>
                  <option value={24}>24px</option>
                </select>
                <select
                  value={textDirection}
                  onChange={(e) => setTextDirection(e.target.value as any)}
                  className="px-2 py-1 text-xs border border-border rounded bg-background"
                >
                  <option value="ltr">LTR</option>
                  <option value="rtl">RTL</option>
                </select>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-4">
              {activeTab === "content" && (
                <div
                  ref={editorRef}
                  contentEditable
                  className="w-full h-full p-4 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{
                    fontFamily: editorContent.language === "ar" ? arabicFont : "inherit",
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    direction: textDirection,
                  }}
                  onInput={(e) => {
                    const content = e.currentTarget.innerHTML;
                    setEditorContent(prev => ({ ...prev, content }));
                  }}
                  dangerouslySetInnerHTML={{ __html: editorContent.content }}
                />
              )}

              {activeTab === "seo" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SEO Title
                    </label>
                    <Input
                      value={editorContent.seoTitle}
                      onChange={(e) => setEditorContent(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="SEO optimized title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SEO Description
                    </label>
                    <Textarea
                      value={editorContent.seoDescription}
                      onChange={(e) => setEditorContent(prev => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="SEO meta description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Featured Image URL
                    </label>
                    <Input
                      value={editorContent.featuredImage}
                      onChange={(e) => setEditorContent(prev => ({ ...prev, featuredImage: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              )}

              {activeTab === "preview" && (
                <div className="w-full h-full border border-border rounded-md bg-background p-4 overflow-y-auto">
                  <div
                    className="prose max-w-none"
                    style={{
                      fontFamily: editorContent.language === "ar" ? arabicFont : "inherit",
                      direction: textDirection,
                    }}
                    dangerouslySetInnerHTML={{ __html: editorContent.content }}
                  />
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Arabic Font
                    </label>
                    <select
                      value={arabicFont}
                      onChange={(e) => setArabicFont(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    >
                      {ARABIC_FONTS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Font Size
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground">{fontSize}px</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Line Height
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.1"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground">{lineHeight}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Text Direction
                    </label>
                    <select
                      value={textDirection}
                      onChange={(e) => setTextDirection(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="ltr">Left to Right</option>
                      <option value="rtl">Right to Left</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
