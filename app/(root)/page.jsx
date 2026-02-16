"use client";
import { useState } from "react";
import Card from "@/components/music-player/card";
import Chat from "@/components/Chat";

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <main className="w-full h-screen bg-black overflow-hidden">
      <Card fullScreen={true} onOpenChat={() => setChatOpen(true)} />
      <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </main>
  );
}
