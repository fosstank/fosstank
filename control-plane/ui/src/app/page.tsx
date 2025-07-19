'use client';
import HLSPlayer from "@/components/hls-player";
import { Stream, TypedPocketBase } from "@/lib/pocketbase";
import PocketBase from 'pocketbase';
import { useEffect, useState } from "react";

const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase;

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  useEffect(() => {
    pb.collection("streams").getFullList().then(streams => setStreams(streams))
  }, [])

  const [messages, setMessages] = useState([
    { id: 1, text: "Tank pressure nominal", timestamp: "18:42:05", type: "system" },
    { id: 2, text: "Temperature within range", timestamp: "18:43:12", type: "system" },
    { id: 3, text: "Flow rate: 125 L/min", timestamp: "18:44:30", type: "system" },
  ]);

  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessages(prev => [...prev, {
      id: Date.now(),
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
      type: "user"
    }]);
    setInputMessage("");
  };

  return (
    <div className="min-h-screen bg-zinc-950 [background-image:repeating-linear-gradient(45deg,#18181b_25%,transparent_25%,transparent_75%,#18181b_75%,#18181b),repeating-linear-gradient(45deg,#18181b_25%,#09090b_25%,#09090b_75%,#18181b_75%,#18181b)] [background-position:0_0,10px_10px] [background-size:20px_20px] p-4">
      <div className="max-w-[1920px] mx-auto">
        <div className="relative mb-8">
          <h1 className="text-5xl font-bold text-center text-cyan-500 uppercase tracking-wider py-4 border-y border-cyan-950 bg-zinc-950/80 [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 mix-blend-overlay"></span>
            Fosstank Control Plane
          </h1>
        </div>
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="w-80 space-y-6">
            {/* Announcements Panel */}
            <div className="bg-zinc-950/80 border border-zinc-800/50 shadow-inner shadow-black p-4">
              <h2 className="text-cyan-500 font-bold mb-4 uppercase tracking-wider [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">
                Announcements
              </h2>
              <div className="space-y-3">
                <div className="bg-zinc-900 p-3 text-zinc-300 text-sm border-l-2 border-cyan-500/50">
                  <div className="text-cyan-500/90 text-xs mb-1">SYSTEM UPDATE</div>
                  <p>New monitoring systems installed in Sector 7</p>
                </div>
                <div className="bg-zinc-900 p-3 text-zinc-300 text-sm border-l-2 border-purple-500/50">
                  <div className="text-purple-500/90 text-xs mb-1">MAINTENANCE</div>
                  <p>Scheduled maintenance: July 20, 0200-0400</p>
                </div>
              </div>
            </div>

            {/* Polls Panel */}
            <div className="bg-zinc-950/80 border border-zinc-800/50 shadow-inner shadow-black p-4">
              <h2 className="text-cyan-500 font-bold mb-4 uppercase tracking-wider [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">
                Active Polls
              </h2>
              <div className="space-y-4">
                <div className="bg-zinc-900 p-3">
                  <p className="text-zinc-300 text-sm mb-2">Preferred monitoring schedule?</p>
                  <div className="space-y-2">
                    <button className="w-full text-left text-xs bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-800/80 hover:text-cyan-500/90 transition-colors">
                      □ 4-hour rotations
                    </button>
                    <button className="w-full text-left text-xs bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-800/80 hover:text-cyan-500/90 transition-colors">
                      □ 6-hour rotations
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ads Panel */}
            <div className="bg-zinc-950/80 border border-zinc-800/50 shadow-inner shadow-black p-4">
              <h2 className="text-cyan-500 font-bold mb-4 uppercase tracking-wider [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">
                Sponsored
              </h2>
              <div className="space-y-3">
                <div className="bg-zinc-900 p-3 text-zinc-300 text-sm border border-zinc-800 hover:border-cyan-500/20 transition-colors cursor-pointer">
                  <div className="text-purple-500/90 text-xs mb-1">FEATURED</div>
                  <p>Advanced Monitoring Solutions - Learn More</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Streams */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-zinc-950/80 border border-zinc-800/50 shadow-inner shadow-black">
              {streams.map(stream => (
                <div key={stream.id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                  <div className="transform transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                    <div className="relative">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/25 to-purple-500/25 rounded-sm blur-[2px]"></div>
                      <HLSPlayer
                        autoPlay
                        controls={false}
                        className="aspect-video relative"
                        src={`/streams/${stream.id}/${stream.id}.m3u8`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Column */}
          <div className="w-96 bg-zinc-950/80 border border-zinc-800/50 shadow-inner shadow-black p-4 flex flex-col">
            <h2 className="text-cyan-500 font-bold mb-4 uppercase tracking-wider [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">System Log</h2>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[calc(100vh-15rem)]">
              {messages.map(msg => (
                <div key={msg.id} className="relative group">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-sm blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-zinc-900 p-3 text-sm">
                    <div className={`font-mono text-xs mb-1 ${msg.type === 'system' ? 'text-cyan-500/90' : 'text-purple-500/90'}`}>
                      {msg.timestamp}
                    </div>
                    <div className="text-zinc-300">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="w-full bg-zinc-900 text-zinc-300 px-4 py-2 pr-12 rounded-sm border border-zinc-800 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 placeholder-zinc-600"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-400 focus:outline-none disabled:opacity-50"
                disabled={!inputMessage.trim()}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
