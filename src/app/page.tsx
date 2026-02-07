import FlowerGame from '@/components/FlowerGame';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-gray-900">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600 rounded-full blur-[150px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <FlowerGame />
      </div>
    </main>
  );
}
