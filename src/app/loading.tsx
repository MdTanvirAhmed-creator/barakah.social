import { GirihLoader } from "@/components/ui/girih";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <GirihLoader size="lg" />
    </div>
  );
}
