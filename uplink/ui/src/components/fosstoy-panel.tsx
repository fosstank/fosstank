import { useContext, useEffect, useState } from "react";
import FloatingPanel from "./floating-panel";
import { FosstoyOption, pb } from "@/lib/pocketbase";
import PiggyValue from "./piggy-value";
import DropdownMenu from "./dropdown-menu";
import Button from "./button";
import { toast } from "./toaster";
import { UserContext } from "@/app/providers";

interface FosstoyPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FosstoyPanel({ isOpen, onClose }: FosstoyPanelProps) {
    const [fosstoyOptions, setFosstoyOptions] = useState<FosstoyOption[]>([])
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const { user, setUser } = useContext(UserContext);
    useEffect(() => {
        pb.collection('fosstoy_options').getFullList(200).then((options) => {
            options.sort((a, b) => a.cost - b.cost);
            setFosstoyOptions(options)
            setSelectedOption(options.length > 0 ? 0 : null);
        }).catch((error) => {
            console.error("Failed to fetch fosstoy options:", error);
        })
    }, [])

    function validate() {
        if (selectedOption === null) { toast.error("Fosstoy option is required."); return false; };
        if (user === null) { toast.error("Must be logged in to send fosstoys."); return false; }
        if (user.balance < fosstoyOptions[selectedOption].cost) { toast.error("Insufficient Balance."); return false; };
        return true;
    }

    return (
        <FloatingPanel isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold mb-2">Fosstoys</h2>
                {/* <DropdownMenu
                    selected={selectedStream}
                    onSelect={(index) => setSelectedStream(index)}
                    options={streams.map((s) => ({
                        row: (
                            <span className="block text-left">{s.title}</span>
                        )
                    }))}
                /> */}
                <DropdownMenu
                    selected={selectedOption}
                    onSelect={(index) => setSelectedOption(index)}
                    options={fosstoyOptions.map((o) => ({
                        row: (
                            <div className="flex items-center">
                                <span className="flex-1 text-left">{o.title}</span>
                                <PiggyValue className="text-zinc-400" value={o.cost} />
                            </div>
                        )
                    }))}
                />
                <Button onClick={() => {
                    if (!validate() || user === null || selectedOption === null) return;
                    const option = fosstoyOptions[selectedOption];
                    pb.collection('fosstoy_orders').create({
                        user: user.id,
                        option: option.id,
                    }).then(() => {
                        setUser({ ...user, balance: user.balance - option.cost });
                        onClose();
                        toast.success("Fosstoy submitted!");
                    }).catch((error) => {
                        toast.error("Failed to submit Fosstoy: " + error.message);
                        console.error("Failed to submit Fosstoy:", error);
                    })
                }}>Send</Button>
            </div>
        </FloatingPanel>
    );
}