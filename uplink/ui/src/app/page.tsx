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
import { Message, pb, Stream, User } from "@/lib/pocketbase";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import ChatMessage from "@/components/chat-message";
import LoginPanel from "@/components/login";
import { UserContext } from "./providers";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import Panel from "@/components/panel";
import Button from "@/components/button";
import StreamPreview from "@/components/stream-preview";
import { toast } from "@/components/toaster";
import PollPanel from "@/components/poll-panel";
import { PiggyBank } from "lucide-react";
import TTSPanel from "@/components/tts-panel";
import SFXPanel from "@/components/sfx-panel";
import FosstoyPanel from "@/components/fosstoy-panel";
import PiggyValue from "@/components/piggy-value";

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [ttsOpen, setTTSOpen] = useState(false);
  const [sfxOpen, setSFXOpen] = useState(false);
  const [fosstoysOpen, setFosstoysOpen] = useState(false);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState<number | null>(null);
  const { user, setUser } = useContext(UserContext);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pb.collection("streams").getFullList().then(streams => {
      setStreams(streams);
    }).catch(err => {
      console.error("Failed to fetch streams:", err);
    });
  }, [])

  const streamMap = useMemo(() => {
    const map = new Map<string, string>();
    streams.forEach((stream) => {
      map.set(stream.id, stream.title);
    });
    return map;
  }, [streams]);

  useEffect(() => {
    const unsubscribe = pb.collection("messages").subscribe("*", (e) => {
      if (e.action === "create") {
        console.log(streamMap);
        e.record.user = e.record.expand.user.username;
        setChatMessages(prev => {
          return [...prev, e.record];
        });
      }
    }, { expand: "user" });

    return () => {
      unsubscribe?.then(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    if (!user) {
      toast.warning("You must be logged in to send messages");
      return;
    }

    pb.collection("messages").create({
      content: inputMessage,
      user: user.id,
      stream: selectedStreamIndex !== null ? streams[selectedStreamIndex].id : "",
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }).then(() => {
      setInputMessage("");
    }).catch(err => {
      console.error(err);
      toast.error("Failed to send message: " + err.message);
    });
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
                <div className="flex space-x-2 hover:ring ring-cyan-500">
                  <div className="flex flex-col">
                    <span className="font-bold">{user.username}</span>
                    <PiggyValue value={user.balance} />
                  </div>
                  <img
                    src={pb.files.getURL(user, user.avatar, { "thumb": "100x100" }) || "/avatar.jpg"}
                    alt="Profile Picture"
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
      <div className="grid grid-cols-24 gap-1 h-full">
        {/* Left Column */}
        <div className="col-span-3 flex flex-col gap-1">
          <Panel>
            <Panel.Header color="blue" className="px-1">
              <Panel.Header.Title text="Happening Now" />
            </Panel.Header>
            <Panel.Body>
              <p className="p-2">Jason exits the cell</p>
            </Panel.Body>
          </Panel>
          <PollPanel
            question="Who will exit the cell next?"
            option1="Mike"
            option2="Sean"
          />
        </div>

        {/* Main Content - Streams */}
        <div className="col-span-16 h-full">
          {selectedStreamIndex !== null ? (
            <HLSPlayer
              src={streams[selectedStreamIndex].url}
              title={streams[selectedStreamIndex].title}
              subtitle="[ 194 ]"
              autoPlay={true}
              controls={streams[selectedStreamIndex].url !== ""}
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
        <Panel className="col-span-5 h-full">
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
                    content={msg.content}
                    created={msg.created}
                    username={msg.user}
                    avatar={msg.expand.user.avatar ? pb.files.getURL(msg.expand.user, msg.expand.user.avatar, { "thumb": "100x100" }) : "/avatar.jpg"}
                    stream={streamMap.get(msg.stream) || ""}
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
                minLength={1}
                maxLength={180}
              />
              <button
                type="submit"
                className="hidden"
                disabled={!inputMessage.trim()}
              >
              </button>
            </form>
            <div className="flex gap-1 p-2">
              <Button className="px-1" onClick={() => user !== null ? setTTSOpen(true) : setIsLoginOpen(true)}>TTS</Button>
              <Button className="px-1" onClick={() => user !== null ? setSFXOpen(true) : setIsLoginOpen(true)}>SFX</Button>
              <Button className="px-1" onClick={() => user !== null ? setFosstoysOpen(true) : setIsLoginOpen(true)}>FOSSTOY</Button>
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

      <TTSPanel streams={streams} selectedStreamIndex={selectedStreamIndex} isOpen={ttsOpen} onClose={() => setTTSOpen(false)}></TTSPanel>
      <SFXPanel isOpen={sfxOpen} onClose={() => setSFXOpen(false)}></SFXPanel>
      <FosstoyPanel isOpen={fosstoysOpen} onClose={() => setFosstoysOpen(false)}></FosstoyPanel>
    </div>
  );
}
