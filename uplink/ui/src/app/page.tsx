// Fosstank: 24/7 live streaming platform
// Copyright (C) 2025 Pierre Morrel

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

'use client';
import HLSPlayer from "@/components/hls-player";
import { pb, Stream } from "@/lib/pocketbase";
import { useContext, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InfoPanel from "@/components/info-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatMessage from "@/components/chat-message";
import LoginPanel from "@/components/login";
import { UserContext } from "./providers";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import Panel from "@/components/panel";
import Button from "@/components/button";
import StreamPreview from "@/components/stream-preview";
import { toast } from "@/components/toaster";

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState<number | null>(null);
  const { user, setUser } = useContext(UserContext);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pb.collection("streams").getFullList().then(streams => setStreams(streams))
  }, [])

  const [systemLogs] = useState([
    { id: 1, text: "Tank pressure nominal", timestamp: "18:42:05", type: "system" },
    { id: 2, text: "Temperature within range", timestamp: "18:43:12", type: "system" },
    { id: 3, text: "Flow rate: 125 L/min", timestamp: "18:44:30", type: "system" },
  ]);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Notice some turbulence in tank 2",
      timestamp: new Date(),
      user: {
        name: "Alice Chen",
        avatar: "avatar.jpg"
      },
      cameraName: streams[0]?.title
    },
    {
      id: 2,
      text: "Checking pressure readings",
      timestamp: new Date(),
      user: {
        name: "Bob Smith",
        avatar: "avatar.jpg"
      },
      cameraName: streams[1]?.title
    }
  ]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      text: inputMessage,
      timestamp: new Date(),
      user: {
        name: user?.username || "FIXME: This shouldn't ever happen",
        avatar: "avatar.jpg"
      },
      cameraName: "Kitchen" // For demo, we'll just use the first stream
    }]);
    setInputMessage("");
  };

  return (
    <div className="h-[calc(100vh-(var(--spacing)*4))] flex flex-col gap-1">
      <div className="flex flex-row items-center gap-1 h-12">
        <h1 className="text-3xl font-bold text-center lowercase">
          Fosstank
        </h1>
        <img className="w-12 h-12" src="/avatar.jpg"></img>
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-end">
          {user === null ? (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="hover:bg-cyan-400 hover:text-cyan-900 text-cyan-400 font-bold transition-colors uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              Login
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="flex items-center space-x-2 hover:ring ring-cyan-500">
                  <span className="text-cyan-500 font-bold">
                    {user.username}
                  </span>
                  <img
                    src={user.avatar || "/avatar.jpg"}
                    alt={user.username}
                    className="w-12 h-12 border border-neutral-600 rounded-sm"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    pb.authStore.clear();
                    setUser(null);
                  }}
                  className="text-cyan-500 cursor-pointer"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="grid grid-cols-12 gap-1 h-full">
        {/* Left Column */}
        <div className="col-span-2 flex flex-col gap-1">
          {/* Announcements Panel */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <InfoPanel title="SYSTEM UPDATE" content="New monitoring systems installed in Sector 7" color='cyan' borderLeft />
                <InfoPanel title="MAINTENANCE" content="Scheduled maintenance: July 20, 0200-0400" color='purple' borderLeft />
              </div>
            </CardContent>
          </Card> */}

          {/* Polls Panel */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Active Polls</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card> */}

          {/* Ads Panel */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Sponsored</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <InfoPanel title="FEATURED" content="Advanced Monitoring Solutions - Learn More" color='purple' clickable />
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Main Content - Streams */}
        <div className="col-span-8 h-full">
          {selectedStreamIndex !== null ? (
            <HLSPlayer
              src={streams[selectedStreamIndex].url}
              title={streams[selectedStreamIndex].title}
              subtitle="[ 194 ]"
              autoPlay={true}
              controls={true}
              onLeft={() => setSelectedStreamIndex((i) => i !== null ? ((i - 1) + streams.length) % streams.length : null)}
              onRight={() => setSelectedStreamIndex((i) => i !== null ? ((i + 1) + streams.length) % streams.length : null)}
              onClose={() => setSelectedStreamIndex(null)}
            />
          ) : (
            <div className="h-full grid grid-cols-2 lg:grid-cols-4 gap-2 border border-neutral-600 rounded p-1 bg-neutral-900">
              {streams.map((stream, i) => (
                <StreamPreview
                  key={stream.id}
                  title={stream.title}
                  subtitle="(194)"
                  offline={i > 6}
                  stream={stream}
                  onClick={() => setSelectedStreamIndex(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Chat Column */}
        <Panel className="col-span-2 h-full">
          <Panel.Header color="blue" className="px-1">
            <Panel.Header.Title text="Chat" />
            <Panel.Header.Subtitle text="[124 Online]" />
          </Panel.Header>
          <Panel.Body>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex flex-col h-0 min-h-full overflow-y-auto space-y-1" ref={chatContainerRef}>
                {chatMessages.map(msg => (
                  <ChatMessage
                    key={msg.id}
                    id={msg.id}
                    text={msg.text}
                    timestamp={msg.timestamp}
                    user={msg.user}
                    cameraName={msg.cameraName}
                  />
                ))}
              </div>
            </div>
          </Panel.Body>
          <Panel.Footer className="flex flex-col gap-1">
            <form onSubmit={handleSendMessage} className="w-full">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="w-full p-1 bg-transparent placeholder-zinc-500 placeholder:text-shadow-[2px_2px_0px_rgb(0_0_0/0.75)]"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="hidden"
                disabled={!inputMessage.trim()}
              >
              </button>
            </form>
            <div className="flex gap-1 p-2">
              <Button className="px-1">TTS</Button>
              <Button className="px-1">SFX</Button>
              <Button className="px-1">FOSSTOY</Button>
            </div>
          </Panel.Footer>
        </Panel>
      </div>

      {/* Login Panel */}
      <LoginPanel
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          setIsLoginOpen(false);
        }}
      />
    </div>
  );
}
