'use client';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <button
        onClick={onGetStarted}
        className="px-8 py-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
      >
        Enter
      </button>
    </div>
  );
}
