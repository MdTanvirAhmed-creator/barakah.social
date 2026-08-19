import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Search, Shield, Heart, Star, ArrowRight, Globe, MessageCircle, BookMarked, LogIn, UserPlus } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export default function Home() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col">
      {/* Navigation Header */}
      <header className="bg-background-secondary/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl font-bold text-foreground">Barakah.Social</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/feed" className="text-foreground-secondary hover:text-foreground px-3 py-2 rounded-md text-sm font-medium">
                Feed
              </Link>
              <Link href="/knowledge" className="text-foreground-secondary hover:text-foreground px-3 py-2 rounded-md text-sm font-medium">
                Knowledge
              </Link>
              <Link href="/halaqas" className="text-foreground-secondary hover:text-foreground px-3 py-2 rounded-md text-sm font-medium">
                Halaqas
              </Link>
              <Link href="/search" className="text-foreground-secondary hover:text-foreground px-3 py-2 rounded-md text-sm font-medium">
                Search
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Welcome to <span className="text-accent-strong">Barakah.Social</span>
            </h1>
            <p className="text-xl text-foreground-secondary mb-8 max-w-3xl mx-auto">
              A modern Islamic social platform for meaningful connections, knowledge sharing, and spiritual growth.
            </p>
          </div>

          {/* Main Navigation Cards. The cards' titles are h3, so this
              section needs its own h2 — otherwise the outline jumps h1 -> h3
              and screen-reader users lose a level. Visually redundant beside
              the cards, so it is available to assistive tech only. */}
          <h2 className="sr-only">Explore Barakah.Social</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent-strong" />
                  Community
                </CardTitle>
                <CardDescription>
                  Connect with like-minded individuals and build meaningful relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/feed">
                  <Button className="w-full">
                    Explore Community
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent-strong" />
                  Knowledge Hub
                </CardTitle>
                <CardDescription>
                  Access curated Islamic content, learning paths, and scholarly resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/knowledge">
                  <Button className="w-full">
                    Browse Knowledge
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-accent-strong" />
                  Halaqas
                </CardTitle>
                <CardDescription>
                  Join study circles and engage in meaningful discussions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/halaqas">
                  <Button className="w-full">
                    Find Halaqas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Authentication Section */}
          <div className="mb-12">
            {/* A section heading, so it must be h2: jumping h1 -> h3 breaks
                the outline screen-reader users navigate by. */}
            <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <GoogleAuthButton mode="signin" className="w-full sm:w-auto" />
              <Link href="/login">
                <Button variant="outline" className="w-full sm:w-auto">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Access Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/feed">
              <Button size="lg" variant="default">
                <Globe className="mr-2 h-5 w-5" />
                Main Feed
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </Link>
            <Link href="/profile">
              <Button size="lg" variant="outline">
                <Heart className="mr-2 h-5 w-5" />
                My Profile
              </Button>
            </Link>
            <Link href="/tools/companions">
              <Button size="lg" variant="outline">
                <Users className="mr-2 h-5 w-5" />
                Companions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-500/15 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-accent-strong" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verified Content</h3>
              <p className="text-foreground-secondary">Scholarly reviewed and community-verified Islamic content</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500/15 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookMarked className="h-8 w-8 text-accent-strong" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Learning Paths</h3>
              <p className="text-foreground-secondary">Structured learning journeys for spiritual growth</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500/15 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-accent-strong" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Companion System</h3>
              <p className="text-foreground-secondary">Find study companions and accountability partners</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-500/15 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-secondary-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Personalized Feed</h3>
              <p className="text-foreground-secondary">AI-powered content recommendations tailored to you</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

