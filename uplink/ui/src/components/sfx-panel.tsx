import { useContext, useEffect, useRef, useState } from "react";
import FloatingPanel from "./floating-panel";
import { pb, SFXOption, Stream } from "@/lib/pocketbase";
import PiggyValue from "./piggy-value";
import DropdownMenu from "./dropdown-menu";
import Button from "./button";
import { toast } from "./toaster";
import { UserContext } from "@/app/providers";
import { ClientResponseError } from "pocketbase";

interface SFXPanelProps {
    streams: Stream[];
    selectedStreamIndex?: number | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function SFXPanel({ streams, selectedStreamIndex = null, isOpen, onClose }: SFXPanelProps) {
    const [sfxOptions, setSFXOptions] = useState<SFXOption[]>([])
    const [selectedStream, setSelectedStream] = useState(selectedStreamIndex || null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user, setUser } = useContext(UserContext);

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    useEffect(() => {
        setIsLoading(true);
        pb.collection('sfx_options').getFullList(200).then((options) => {
            options.sort((a, b) => a.cost - b.cost);
            setSFXOptions(options)
            setSelectedOption(options.length > 0 ? 0 : null);
            setIsLoading(false);
        }).catch((error: ClientResponseError) => {
            if (error.isAbort) { return }
            toast.error("Failed to fetch SFX options: " + error)
            console.error("Failed to fetch SFX options:", error);
            onCloseRef.current();
        })
    }, [])

    useEffect(() => {
        setSelectedStream(selectedStreamIndex);
    }, [selectedStreamIndex])

    function validate() {
        if (selectedStream === null) { toast.error("Stream is required."); return false; }
        if (selectedOption === null) { toast.error("SFX option is required."); return false; };
        if (user === null) { toast.error("Must be logged in to send SFX."); return false; }
        if (user.balance < sfxOptions[selectedOption].cost) { toast.error("Insufficient Balance."); return false; };
        return true;
    }

    return (
        <FloatingPanel
            isOpen={isOpen}
            onClose={onClose}
            isLoading={isLoading}
            loadingTitle="SFX"
            loadingMessage="Loading sound effects..."
        >
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold mb-2">Sound Effects</h2>
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
                    options={sfxOptions.map((o) => ({
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
                    const option = sfxOptions[selectedOption];
                    pb.collection('sfx_orders').create({
                        user: user.id,
                        stream: stream.id,
                        option: option.id,
                    }).then(() => {
                        setUser({ ...user, balance: user.balance - option.cost });
                        onClose();
                        toast.success("SFX submitted!");
                    }).catch((error) => {
                        toast.error("Failed to submit SFX: " + error.message);
                        console.error("Failed to submit SFX:", error);
                    })
                }}>Send</Button>
            </div>
        </FloatingPanel>
    );
}