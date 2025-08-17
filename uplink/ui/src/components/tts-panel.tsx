import { useEffect, useState } from "react";
import FloatingPanel from "./floating-panel";
import { pb, TTSOption } from "@/lib/pocketbase";
import PiggyValue from "./piggy-value";
import DropdownMenu from "./dropdown-menu";

interface TTSPanelProps {
    isOpen: boolean;
    onClose: () => void;
}


export default function TTSPanel({ isOpen, onClose }: TTSPanelProps) {
    const [ttsOptions, setTTSOptions] = useState<TTSOption[]>([])
    useEffect(() => {
        pb.collection('tts_options').getFullList(200).then((options) => {
            setTTSOptions(options)
        }).catch((error) => {
            console.error("Failed to fetch TTS options:", error);
        })
    }, [])

    return (
        <FloatingPanel isOpen={isOpen} onClose={onClose}>
            <h2 className="text-lg font-semibold mb-2">Text-to-Speech</h2>
            <div className="flex flex-col">
                {ttsOptions.map((option) => (
                    <div key={option.id} className="flex items-center justify-between mb-2">
                        <span className="text-sm">{option.title}</span>
                        <PiggyValue className="text-zinc-400" value={option.cost} />
                    </div>
                ))}
            </div>
            <DropdownMenu options={ttsOptions.map((o) => ({
                row: (
                    <div className="flex items-center">
                        <span className="flex-1 text-left">{o.title}</span>
                        <PiggyValue className="text-zinc-400" value={o.cost} />
                    </div>
                )
            }))} />
        </FloatingPanel>
    );
}