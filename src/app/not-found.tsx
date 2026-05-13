import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <span className="text-[120px] font-black leading-none bg-gradient-to-b from-primary/30 to-transparent bg-clip-text text-transparent select-none">
            404
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground px-6 py-3 font-bold text-sm shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
