'use client';
import HLSPlayer from "@/components/hls-player";
import { pb, Stream } from "@/lib/pocketbase";
import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InfoPanel from "@/components/info-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatMessage from "@/components/chat-message";
import LoginPanel from "@/components/login";
import { UserContext } from "./providers";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user, setUser } = useContext(UserContext);

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
      timestamp: "18:41:00",
      user: {
        name: "Alice Chen",
        avatar: "avatar.jpg"
      },
      cameraName: streams[0]?.name
    },
    {
      id: 2,
      text: "Checking pressure readings",
      timestamp: "18:41:30",
      user: {
        name: "Bob Smith",
        avatar: "avatar.jpg"
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
      <div className="flex flex-row items-center mb-4 border-cyan-950 bg-zinc-950/80 border-y-1">
        <div className="flex-1"></div>
        <h1 className="text-5xl font-bold text-center text-cyan-500 uppercase [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">
          Fosstank
        </h1>
        <div className="flex-1 flex justify-end pr-4">
          {user === null ? (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="hover:bg-cyan-400 hover:text-cyan-900 text-cyan-400 font-bold p-4 transition-colors uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              Login
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-4 hover:bg-black">
                <div className="flex items-center space-x-2">
                  <img
                    src={user.avatar || "avatar.jpg"}
                    alt={user.username}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="text-cyan-500 font-bold">
                    {user.username}
                  </span>
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
      <div className="flex gap-6">
        {/* Left Column */}
        <div className="w-80 space-y-6">
          {/* Announcements Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <InfoPanel title="SYSTEM UPDATE" content="New monitoring systems installed in Sector 7" color='cyan' borderLeft />
                <InfoPanel title="MAINTENANCE" content="Scheduled maintenance: July 20, 0200-0400" color='purple' borderLeft />
              </div>
            </CardContent>
          </Card>

          {/* Polls Panel */}
          <Card>
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
          </Card>

          {/* Ads Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Sponsored</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <InfoPanel title="FEATURED" content="Advanced Monitoring Solutions - Learn More" color='purple' clickable />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Streams */}
        <div className="flex-1">
          <Card>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Chat Column */}
        <Card className="h-full w-96">
          <CardContent>
            <Tabs defaultValue="logs" className="">
              <TabsList>
                <TabsTrigger value="logs">System Log</TabsTrigger>
                <TabsTrigger value="chat">Messages</TabsTrigger>
              </TabsList>
              <TabsContent value="logs">
                {/* System Log Content */}
                <div className="grid grid-cols-1 overflow-y-auto space-y-3 mb-4 max-h-[calc(100vh-15rem)]">
                  {systemLogs.map(msg => (
                    <InfoPanel
                      key={msg.id}
                      title={msg.timestamp}
                      content={msg.text}
                      color='cyan'
                    />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="chat">
                {/* Chat Messages Content */}
                <div className="max-h-full">
                  <div className="h-full flex flex-col justify-end overflow-y-autos space-y-1">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
