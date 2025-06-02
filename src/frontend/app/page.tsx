export default function Home() {
  return (
    <div className="flex justify-center items-center px-4 min-h-screen">
      <div className="text-center">
        <h1 className="mb-6 font-bold text-white text-6xl md:text-8xl tracking-tight">
          <span className="bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 text-transparent">
            FinApp
          </span>
        </h1>
        <p className="mx-auto max-w-2xl font-light text-gray-300 text-xl md:text-2xl leading-relaxed">
          The smartest way to manage your finances and build your wealth
        </p>
        <div className="mt-8">
          <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-2 border border-white/20 rounded-full">
            <span className="text-gray-300 text-sm">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
