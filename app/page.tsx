import { Hero } from "@/components/sections/hero";
import { Skills } from "@/components/sections/skills";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-16">
      <div className="container px-4 mx-auto">
        <Hero />
        <Skills />
      </div>
    </main>
  );
}