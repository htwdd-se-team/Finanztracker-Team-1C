export default function Home() {
  return (
    <div className="flex justify-center items-center px-4 min-h-screen">
      <div className="text-center">
        <h1 className="mb-6 font-bold text-foreground text-6xl md:text-8xl tracking-tight">
          <span className="bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-transparent">
            FinApp
          </span>
        </h1>
        <p className="mx-auto max-w-2xl font-light text-muted-foreground text-xl md:text-2xl leading-relaxed">
          The smartest way to manage your finances and build your wealth
        </p>
        <div className="mt-8">
          <div className="inline-block bg-muted backdrop-blur-sm px-6 py-2 border border-border rounded-full">
            <span className="text-muted-foreground text-sm">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
