import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Authentication Error
          </h1>
          <p className="text-foreground-secondary">
            We couldn&apos;t complete the authentication process.
          </p>
          {/* The specific reason, when there is one. A person who cannot sign
              in deserves better than a guess about expired links. */}
          {reason && (
            <p className="text-sm text-muted-foreground border-s-2 border-border ps-3 text-start">
              {reason}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full bg-primary-600 hover:bg-primary-700">
            <Link href="/login">Try Again</Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}

