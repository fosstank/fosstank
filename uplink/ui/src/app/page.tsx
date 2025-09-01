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
import { Announcement, Message, pb, Stream } from "@/lib/pocketbase";
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
import TTSPanel from "@/components/tts-panel";
import SFXPanel from "@/components/sfx-panel";
import FosstoyPanel from "@/components/fosstoy-panel";
import PiggyValue from "@/components/piggy-value";
import { STATIC_ASSETS } from "@/lib/static-assets";
import { ClientResponseError } from "pocketbase";
import Image from "next/image";
import TokensPanel from "@/components/tokens-panel";

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [globalViewerCount, setGlobalViewerCount] = useState(0);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [ttsOpen, setTTSOpen] = useState(false);
  const [sfxOpen, setSFXOpen] = useState(false);
  const [fosstoysOpen, setFosstoysOpen] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);
  const [ttsEverOpened, setTTSEverOpened] = useState(false);
  const [sfxEverOpened, setSFXEverOpened] = useState(false);
  const [fosstoysEverOpened, setFosstoysEverOpened] = useState(false);
  const [tokensEverOpened, setTokensEverOpened] = useState(false);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState<number | null>(null);
  const { user, setUser } = useContext(UserContext);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sessionId] = useState<string>(crypto.randomUUID());
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Send heartbeat every 60 seconds
  const heartbeatState = useRef({ user, sessionId, selectedStreamIndex, streams });
  useEffect(() => { heartbeatState.current = { user, sessionId, selectedStreamIndex, streams } }, [user, sessionId, selectedStreamIndex, streams]);
  useEffect(() => {
    const interval = setInterval(() => {
      const state = heartbeatState.current;
      pb.collection("heartbeats").create({
        user: state.user !== null ? state.user.id : '',
        session_id: state.sessionId,
        stream: state.selectedStreamIndex !== null && state.streams[state.selectedStreamIndex] ? state.streams[state.selectedStreamIndex].id : ''
      }).catch((err) => {
        console.error("Failed to send heartbeat:", err);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    pb.collection("streams").getFullList().then(streams => {
      setGlobalViewerCount(streams.reduce((acc, stream) => acc + stream.viewers, 0));
      setStreams(streams);
    }).catch(err => {
      console.error("Failed to fetch streams:", err);
    });
  }, [])

  useEffect(() => {
    const unsubscribe = pb.realtime.subscribe("streams_heartbeat", (e) => {
      const viewers = e.viewers as number;
      const streams = e.streams as Stream[];
      setGlobalViewerCount(viewers);
      setStreams(streams);
    });

    return () => {
      unsubscribe?.then(unsub => unsub());
    };
  }, []);

  const streamMap = useMemo(() => {
    const map = new Map<string, string>();
    streams.forEach((stream) => {
      map.set(stream.id, stream.title);
    });
    return map;
  }, [streams]);

  // TODO: I have the announcements capped at 3 right now, but maybe it's worth
  // setting the overflow to scroll and fetching page by page.
  useEffect(() => {
    pb.collection("announcements").getList(1, 3, { sort: "-created" }).then(announcements => {
      setAnnouncements(announcements.items);
    }).catch((error: ClientResponseError) => {
      toast.error("Failed to fetch announcements: " + error.message);
      console.error("Failed to fetch announcements:", error);
    });
  }, [])

  useEffect(() => {
    const unsubscribe = pb.collection("announcements").subscribe("*", (e) => {
      if (e.action === "create") {
        setAnnouncements(prev => {
          return [e.record, ...prev].slice(0, 3);
        });
      } else if (e.action === "update") {
        setAnnouncements(prev => {
          return prev.map(a => a.id === e.record.id ? e.record : a);
        });
      } else if (e.action === "delete") {
        setAnnouncements(prev => {
          return prev.filter(a => a.id !== e.record.id);
        });
      }
    });

    return () => {
      unsubscribe?.then(unsub => unsub());
    };
  }, [])

  useEffect(() => {
    const unsubscribe = pb.collection("messages").subscribe("*", (e) => {
      if (e.action === "create") {
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
        <div className="w-12 h-12 relative">
          <Image fill={true} src={STATIC_ASSETS["avatar"]} alt="logo" unoptimized />
        </div>
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
            <div className="flex space-x-2">
              <div className="flex flex-col">
                <span className="font-bold">{user.username}</span>
                <button onClick={() => (setTokensOpen(true), setTokensEverOpened(true))} className=" text-yellow-400 hover:text-yellow-300 cursor-pointer">
                  <PiggyValue value={user.balance} />
                </button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="w-12 h-12 relative border-2 border-neutral-600 rounded-sm hover:border-cyan-500 overflow-clip">
                    <Image
                      src={pb.files.getURL(user, user.avatar, { "thumb": "100x100" }) || STATIC_ASSETS["avatar"]}
                      fill={true}
                      alt="Profile Picture"
                      unoptimized
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
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-24 gap-1 h-full">
        {/* Left Column */}
        <div className="col-span-3 flex flex-col gap-1 max-h-screen">
          <Panel>
            <Panel.Header color="blue" className="px-1">
              <Panel.Header.Title text="Announcements" />
            </Panel.Header>
            <Panel.Body>
              <div className=" flex flex-col gap-2 overflow-y-auto">
                {announcements.length > 0 ? (
                  announcements.map((announcement, index) => (
                    <>
                      <div key={announcement.id} className={`p-2 ${index === 0 ? '' : index === 1 ? 'brightness-90' : 'brightness-75'}`}>
                        <h3 className="font-bold mb-1 text-cyan-300">{announcement.title}</h3>
                        <p className="text-sm">{announcement.message}</p>
                        <div className="flex justify-end text-xs font-thin -tracking-[1.5px]">
                          {/* TODO: Format timestamp correctly. Should look like: 8/10/25, 9:00 PM */}
                          <span className="text-muted-foreground">{announcement.created}</span>
                        </div>
                      </div>
                      <hr className="h-0.5 bg-neutral-950"></hr>
                    </>
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-sm p-4">
                    All quiet in the tank...
                  </div>
                )}
              </div>
            </Panel.Body>
          </Panel>
          <PollPanel />
        </div>

        {/* Main Content - Streams */}
        <div className="col-span-16 h-full">
          {selectedStreamIndex !== null ? (
            <HLSPlayer
              src={streams[selectedStreamIndex].url}
              title={streams[selectedStreamIndex].title}
              subtitle={`[ ${streams[selectedStreamIndex].viewers.toLocaleString()} ]`}
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
                  subtitle={`(${stream.viewers.toLocaleString()})`}
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
            <Panel.Header.Subtitle text={`[${globalViewerCount} Online]`} />
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
                    avatar={msg.expand.user.avatar ? pb.files.getURL(msg.expand.user, msg.expand.user.avatar, { "thumb": "100x100" }) : STATIC_ASSETS["avatar"]}
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
              <Button className="px-1" onClick={() => user !== null ? (setTTSOpen(true), setTTSEverOpened(true)) : setIsLoginOpen(true)}>TTS</Button>
              <Button className="px-1" onClick={() => user !== null ? (setSFXOpen(true), setSFXEverOpened(true)) : setIsLoginOpen(true)}>SFX</Button>
              <Button className="px-1" onClick={() => user !== null ? (setFosstoysOpen(true), setFosstoysEverOpened(true)) : setIsLoginOpen(true)}>FOSSTOYS</Button>
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

      {ttsEverOpened && <TTSPanel streams={streams} selectedStreamIndex={selectedStreamIndex} isOpen={ttsOpen} onClose={() => setTTSOpen(false)}></TTSPanel>}
      {sfxEverOpened && <SFXPanel streams={streams} selectedStreamIndex={selectedStreamIndex} isOpen={sfxOpen} onClose={() => setSFXOpen(false)}></SFXPanel>}
      {fosstoysEverOpened && <FosstoyPanel isOpen={fosstoysOpen} onClose={() => setFosstoysOpen(false)}></FosstoyPanel>}
      {tokensEverOpened && <TokensPanel isOpen={tokensOpen} onClose={() => setTokensOpen(false)}></TokensPanel>}
    </div >
  );
}
