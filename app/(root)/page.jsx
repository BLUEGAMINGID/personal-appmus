"use client";
import Card from "@/components/music-player/card";

export default function Home() {
  return (
    <main className="w-full h-screen bg-black overflow-hidden">
      <Card fullScreen={true} />
    </main>
  );
}
