'use client';
import HLSPlayer from "@/components/hls-player";
import { Stream, TypedPocketBase } from "@/lib/pocketbase";
import PocketBase from 'pocketbase';
import { useEffect, useState } from "react";
import Panel from "@/components/panel";
import InfoPanel from "@/components/info-panel";

const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase;

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  useEffect(() => {
    pb.collection("streams").getFullList().then(streams => setStreams(streams))
  }, [])

  const [activeTab, setActiveTab] = useState<'log' | 'chat'>('log');

  const [systemLogs] = useState([
    { id: 1, text: "Tank pressure nominal", timestamp: "18:42:05", type: "system" },
    { id: 2, text: "Temperature within range", timestamp: "18:43:12", type: "system" },
    { id: 3, text: "Flow rate: 125 L/min", timestamp: "18:44:30", type: "system" },
  ]);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Notice some turbulence in tank 2",
      timestamp: "18:41:00",
      user: {
        name: "Alice Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"
      },
      cameraName: streams[0]?.name
    },
    {
      id: 2,
      text: "Checking pressure readings",
      timestamp: "18:41:30",
      user: {
        name: "Bob Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob"
      },
      cameraName: streams[1]?.name
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");

  // Simulated current user
  const currentUser = {
    name: "Test User",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser"
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
      user: currentUser,
      cameraName: streams[0]?.name // For demo, we'll just use the first stream
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
            <Panel title="Announcements">
              <div className="space-y-3">
                <InfoPanel title="SYSTEM UPDATE" content="New monitoring systems installed in Sector 7" color='cyan' borderLeft />
                <InfoPanel title="MAINTENANCE" content="Scheduled maintenance: July 20, 0200-0400" color='purple' borderLeft />
              </div>
            </Panel>

            {/* Polls Panel */}
            <Panel title="Active Polls">
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
            </Panel>

            {/* Ads Panel */}
            <Panel title="Sponsored">
              <div className="space-y-3">
                <InfoPanel title="FEATURED" content="Advanced Monitoring Solutions - Learn More" color='purple' clickable />
              </div>
            </Panel>
          </div>

          {/* Main Content - Streams */}
          <div className="flex-1">
            <Panel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {streams.map(stream => (
                  <HLSPlayer
                    key={stream.id}
                    autoPlay
                    controls={false}
                    src={`/streams/${stream.id}/${stream.id}.m3u8`}
                  />
                ))}
              </div>
            </Panel>
          </div>

          {/* Chat Column */}
          <div className="w-96">
            <Panel className="h-full">
              <div className="flex flex-col h-full">
                {/* Tabs */}
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setActiveTab('log')}
                    className={`text-sm font-bold uppercase tracking-wider transition-colors
                      ${activeTab === 'log'
                        ? 'text-cyan-500 [text-shadow:0_0_10px_theme(colors.cyan.500/40)]'
                        : 'text-zinc-500 hover:text-zinc-400'
                      }`}
                  >
                    System Log
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`text-sm font-bold uppercase tracking-wider transition-colors
                      ${activeTab === 'chat'
                        ? 'text-cyan-500 [text-shadow:0_0_10px_theme(colors.cyan.500/40)]'
                        : 'text-zinc-500 hover:text-zinc-400'
                      }`}
                  >
                    Messages
                  </button>
                </div>

                {/* System Log Content */}
                {activeTab === 'log' && (
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[calc(100vh-15rem)]">
                    {systemLogs.map(msg => (
                      <InfoPanel
                        key={msg.id}
                        title={msg.timestamp}
                        content={msg.text}
                        color='cyan'
                      />
                    ))}
                  </div>
                )}

                {/* Chat Messages Content */}
                {activeTab === 'chat' && (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[calc(100vh-15rem)]">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className="relative group">
                          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-sm blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative bg-zinc-900 p-3 text-sm">
                            <div className="flex items-start gap-3">
                              <img
                                src={msg.user.avatar}
                                alt={msg.user.name}
                                className="w-8 h-8 rounded-full bg-zinc-800"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-medium text-zinc-300">{msg.user.name}</span>
                                  <span className="font-mono text-xs text-zinc-500">{msg.timestamp}</span>
                                </div>
                                <p className="text-zinc-300 break-words">{msg.text}</p>
                                {msg.cameraName && (
                                  <div className="mt-2 text-xs text-cyan-500/70 font-mono">
                                    Viewing: {msg.cameraName}
                                  </div>
                                )}
                              </div>
                            </div>
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
                  </>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
