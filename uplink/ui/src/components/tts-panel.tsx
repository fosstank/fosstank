import { useContext, useEffect, useRef, useState } from "react";
import FloatingPanel from "./floating-panel";
import { pb, Stream, TTSOption } from "@/lib/pocketbase";
import PiggyValue from "./piggy-value";
import DropdownMenu from "./dropdown-menu";
import Button from "./button";
import { toast } from "./toaster";
import { UserContext } from "@/app/providers";
import { ClientResponseError } from "pocketbase";

interface TTSPanelProps {
    streams: Stream[];
    selectedStreamIndex?: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function TTSPanel({ streams, selectedStreamIndex = null, isOpen, onClose }: TTSPanelProps) {
    const [ttsOptions, setTTSOptions] = useState<TTSOption[]>([])
    const [ttsMessage, setTTSMessage] = useState("");
    const [selectedStream, setSelectedStream] = useState(selectedStreamIndex || null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user, setUser } = useContext(UserContext);

    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose }, [onClose]);
    useEffect(() => {
        setIsLoading(true);
        pb.collection('tts_options').getFullList().then((options) => {
            options.sort((a, b) => a.cost - b.cost);
            setTTSOptions(options)
            setSelectedOption(options.length > 0 ? 0 : null);
            setIsLoading(false);
        }).catch((error: ClientResponseError) => {
            if (error.isAbort) { return }
            toast.error("Failed to fetch TTS options: " + error);
            console.error("Failed to fetch TTS options:", error);
            onCloseRef.current();
        })
    }, [])

    useEffect(() => {
        setSelectedStream(selectedStreamIndex);
    }, [selectedStreamIndex])

    function validate() {
        if (!ttsMessage.trim()) { toast.error("Message is required."); return false; }
        if (ttsMessage.trim().length > 255) { toast.error("Message exceeds maximum length."); return false; }
        if (selectedStream === null) { toast.error("Stream is required."); return false; }
        if (selectedOption === null) { toast.error("TTS option is required."); return false; };
        if (user === null) { toast.error("Must be logged in to send TTS."); return false; }
        if (user.balance < ttsOptions[selectedOption].cost) { toast.error("Insufficient Balance."); return false; };
        return true;
    }

    return (
        <FloatingPanel
            isOpen={isOpen}
            onClose={onClose}
            isLoading={isLoading}
            loadingTitle="TTS"
            loadingMessage="Loading voices..."
        >
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold mb-2">Text-to-Speech</h2>
                <textarea
                    value={ttsMessage}
                    onChange={(e) => setTTSMessage(e.target.value)}
                    className="w-full h-48 p-1 bg-transparent placeholder-zinc-500 placeholder:text-shadow-[2px_2px_0px_rgb(0_0_0/0.75)]"
                    placeholder="Type a message..."
                    minLength={1}
                    maxLength={255}
                />
                <DropdownMenu
                    selected={selectedStream}
                    onSelect={(index) => setSelectedStream(index)}
                    options={streams.map((s) => ({
                        row: (
                            <span className="block text-left">{s.title}</span>
                        )
                    }))}
                />
                <DropdownMenu
                    selected={selectedOption}
                    onSelect={(index) => setSelectedOption(index)}
                    options={ttsOptions.map((o) => ({
                        row: (
                            <div className="flex items-center">
                                <span className="flex-1 text-left">{o.title}</span>
                                <PiggyValue className="text-zinc-400" value={o.cost} />
                            </div>
                        )
                    }))}
                />
                <Button onClick={() => {
                    if (!validate() || user === null || selectedStream === null || selectedOption === null) return;
                    const stream = streams[selectedStream];
                    const option = ttsOptions[selectedOption];
                    pb.collection('tts_orders').create({
                        user: user.id,
                        stream: stream.id,
                        option: option.id,
                        message: ttsMessage,
                    }).then(() => {
                        setTTSMessage("");
                        setUser({ ...user, balance: user.balance - option.cost });
                        onClose();
                        toast.success("TTS submitted!");
                    }).catch((error) => {
                        toast.error("Failed to submit TTS: " + error.message);
                        console.error("Failed to submit TTS:", error);
                    })
                }}>Send</Button>
            </div>
        </FloatingPanel>
    );
}