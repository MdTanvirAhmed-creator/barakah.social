"use client";

import { useState } from "react";
import { CompanionWidget } from "@/components/companions/CompanionWidget";
import { SalamModal } from "@/components/companions/SalamModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Mock companion data
const MOCK_COMPANION = {
  id: "demo-123",
  username: "ahmad_seeker",
  full_name: "Ahmad Ibn Abdullah",
  avatar_url: null,
  bio: "Seeking knowledge and righteous companionship. Currently studying Tafsir and Hadith. May Allah guide us all on the straight path.",
  interests: ["Quran", "Hadith", "Tafsir", "Arabic", "Fiqh"],
  beneficial_count: 145,
  location: "London, UK",
  last_active: new Date().toISOString(),
};

export default function CompanionDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        {/* Header */}
        <Link href="/tools">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Companion Widget Demo
          </h1>
          <p className="text-foreground-secondary text-lg">
            Explore all 3 variants of the CompanionWidget component
          </p>
        </div>

        {/* Variant 1: Compact */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              1. Compact Variant
            </h2>
            <p className="text-muted-foreground">
              Perfect for sidebars, dropdowns, and tight spaces (~60px height)
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="max-w-md">
              <CompanionWidget
                companion={MOCK_COMPANION}
                variant="compact"
                compatibilityScore={92}
                connectionStatus="none"
                onSendSalam={() => {
                  setSelectedVariant("compact");
                  setShowModal(true);
                }}
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono text-foreground">
              {'<CompanionWidget variant="compact" compatibilityScore={92} />'}
            </p>
          </div>
        </section>

        {/* Variant 2: Default */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              2. Default Variant
            </h2>
            <p className="text-muted-foreground">
              Best for grids, search results, and discovery pages (~250-300px height)
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="max-w-md">
              <CompanionWidget
                companion={MOCK_COMPANION}
                variant="default"
                mutualHalaqas={["Tafsir Study Circle", "Arabic Learning"]}
                sharedInterests={["Quran", "Hadith", "Tafsir"]}
                compatibilityScore={92}
                connectionStatus="none"
                showActions={true}
                onSendSalam={() => {
                  setSelectedVariant("default");
                  setShowModal(true);
                }}
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono text-foreground">
              {'<CompanionWidget variant="default" mutualHalaqas={[...]} sharedInterests={[...]} />'}
            </p>
          </div>
        </section>

        {/* Variant 3: Detailed */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              3. Detailed Variant
            </h2>
            <p className="text-muted-foreground">
              Ideal for featured matches and profile previews (~400-500px height)
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="max-w-md">
              <CompanionWidget
                companion={MOCK_COMPANION}
                variant="detailed"
                mutualHalaqas={["Tafsir Study Circle", "Arabic Learning", "Seerah Discussion"]}
                sharedInterests={["Quran", "Hadith", "Tafsir", "Arabic", "Fiqh"]}
                compatibilityScore={92}
                connectionStatus="none"
                showActions={true}
                onSendSalam={() => {
                  setSelectedVariant("detailed");
                  setShowModal(true);
                }}
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono text-foreground">
              {'<CompanionWidget variant="detailed" showActions={true} />'}
            </p>
          </div>
        </section>

        {/* Side by Side Comparison */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Side-by-Side Comparison
            </h2>
            <p className="text-muted-foreground">
              See all three variants together
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">COMPACT</p>
              <CompanionWidget
                companion={MOCK_COMPANION}
                variant="compact"
                compatibilityScore={92}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">DEFAULT</p>
              <CompanionWidget
                companion={MOCK_COMPANION}
                variant="default"
                mutualHalaqas={["Tafsir Study"]}
                sharedInterests={["Quran", "Hadith"]}
                compatibilityScore={92}
                showActions={true}
                onSendSalam={() => setShowModal(true)}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">DETAILED</p>
              <CompanionWidget
                companion={MOCK_COMPANION}
                variant="detailed"
                mutualHalaqas={["Tafsir", "Arabic"]}
                sharedInterests={["Quran", "Hadith", "Tafsir"]}
                compatibilityScore={92}
                showActions={true}
                onSendSalam={() => setShowModal(true)}
              />
            </div>
          </div>
        </section>

        {/* Connection Status Demo */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Connection Status States
            </h2>
            <p className="text-muted-foreground">
              Different connection states
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">NOT CONNECTED</p>
              <CompanionWidget
                companion={MOCK_COMPANION}
                variant="default"
                compatibilityScore={92}
                connectionStatus="none"
                showActions={true}
                onSendSalam={() => setShowModal(true)}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">PENDING</p>
              <CompanionWidget
                companion={{...MOCK_COMPANION, username: "pending_user"}}
                variant="default"
                compatibilityScore={88}
                connectionStatus="pending"
                showActions={true}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">CONNECTED</p>
              <CompanionWidget
                companion={{...MOCK_COMPANION, username: "connected_user"}}
                variant="default"
                compatibilityScore={95}
                connectionStatus="connected"
                showActions={true}
                onSendMessage={() => alert("Open chat...")}
              />
            </div>
          </div>
        </section>

        {/* SalamModal Demo */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              SalamModal Component
            </h2>
            <p className="text-muted-foreground">
              Beautiful modal for sending connection requests
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <Button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Open Salam Modal
            </Button>
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Component Features ✨</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">CompanionWidget:</h3>
              <ul className="space-y-1 text-primary-100">
                <li>✅ 3 flexible variants</li>
                <li>✅ Shows mutual context</li>
                <li>✅ Last active indicator</li>
                <li>✅ Compatibility scoring</li>
                <li>✅ Connection status</li>
                <li>✅ Responsive design</li>
                <li>✅ Dark mode support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">SalamModal:</h3>
              <ul className="space-y-1 text-primary-100">
                <li>✅ Beautiful gradient design</li>
                <li>✅ Match explanation</li>
                <li>✅ Message templates</li>
                <li>✅ Islamic etiquette reminder</li>
                <li>✅ Success animation</li>
                <li>✅ Supabase integration</li>
                <li>✅ Duplicate prevention</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Salam Modal */}
      <SalamModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        companion={MOCK_COMPANION}
        matchReason="You both love Tafsir and are active in similar Halaqas"
        sharedInterests={["Quran", "Hadith", "Tafsir"]}
        mutualHalaqas={["Tafsir Study Circle", "Arabic Learning"]}
        compatibilityScore={92}
        onSuccess={() => {
          console.log("Connection request sent!");
          setShowModal(false);
        }}
      />
    </div>
  );
}

