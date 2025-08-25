import { useContext, useEffect, useState } from "react";
import FloatingPanel from "./floating-panel";
import { FosstoyOption, FosstoyOrder, Participant, pb, Season } from "@/lib/pocketbase";
import PiggyValue from "./piggy-value";
import DropdownMenu from "./dropdown-menu";
import Button from "./button";
import { toast } from "./toaster";
import { UserContext } from "@/app/providers";
import { ClientResponseError } from "pocketbase";

interface FosstoyPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FosstoyPanel({ isOpen, onClose }: FosstoyPanelProps) {
    const [fosstoyOptions, setFosstoyOptions] = useState<FosstoyOption[]>([])
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
    const [message, setMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const { user, setUser } = useContext(UserContext);

    useEffect(() => {
        const loadOptionsAndParticipants = async () => {
            setIsLoading(true);

            let loadedOptions: FosstoyOption[] = [];
            let loadedSeason: Season | null = null;
            let loadedParticipants: Participant[] = [];


            try {
                // Load options and season in parallel
                [loadedOptions, loadedSeason] = await Promise.all([
                    pb.collection('fosstoy_options').getFullList(),
                    pb.collection('seasons').getFirstListItem("", { sort: "-created" })
                ]);
                loadedOptions.sort((a, b) => a.cost - b.cost);
            } catch (error: unknown) {
                const clientError = error as ClientResponseError;
                if (clientError.isAbort) { return }

                toast.error("Loading data failed: " + clientError.message);
                console.error("Loading data failed: ", clientError);
                onClose();
                return;
            }

            try {
                loadedParticipants = await pb.collection('participants').getFullList({
                    filter: `seasons ~ "${loadedSeason.id}"`
                });
            } catch (error: unknown) {
                const clientError = error as ClientResponseError;
                if (clientError.isAbort) { return }

                toast.error("Failed to load participants: " + clientError.message);
                console.error("Failed to fetch participants:", clientError);
                onClose();
                return;
            }

            setFosstoyOptions(loadedOptions);
            setParticipants(loadedParticipants);

            // Set defaults once both are loaded
            if (loadedOptions.length > 0) {
                setSelectedOption(0);
                if (loadedParticipants.length > 0) {
                    setSelectedParticipants(Array(loadedOptions[0].participant_count).fill(0));
                }
            }
            setIsLoading(false);
        };

        loadOptionsAndParticipants();
    }, [])

    function validate() {
        if (selectedOption === null) { toast.error("Fosstoy option is required."); return false; };
        if (user === null) { toast.error("Must be logged in to send fosstoys."); return false; }
        if (user.balance < fosstoyOptions[selectedOption].cost) { toast.error("Insufficient Balance."); return false; };
        if (fosstoyOptions[selectedOption].participant_count !== selectedParticipants.length) {
            toast.error(`Selected ${selectedParticipants.length} participants, ${fosstoyOptions[selectedOption].participant_count} required for ${fosstoyOptions[selectedOption].title}.`);
            return false;
        }
        if (fosstoyOptions[selectedOption].message_required && message.length === 0) {
            toast.error("Message is required.");
            return false;
        }
        return true;
    }

    if (!isOpen) {
        return null;
    }

    return (
        <FloatingPanel
            isOpen={isOpen}
            onClose={onClose}
            isLoading={isLoading}
            loadingTitle="Fosstoys"
            loadingMessage="Loading fosstoys..."
        >
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold mb-2">Fosstoys</h2>
                <DropdownMenu
                    selected={selectedOption}
                    onSelect={(index) => {
                        setSelectedOption(index);
                        setSelectedParticipants(participants.length > 0 ? Array(fosstoyOptions[index].participant_count).fill(0) : []);
                    }}
                    options={fosstoyOptions.map((o) => ({
                        row: (
                            <div className="flex items-center">
                                <span className="text-left">{o.title}</span>
                                <span className="flex-1 text-zinc-500 text-xs text-left px-2">{o.description}</span>
                                <PiggyValue className="text-zinc-400" value={o.cost} />
                            </div>
                        )
                    }))}
                />
                {selectedOption !== null && Array.from({ length: fosstoyOptions[selectedOption].participant_count }).map((_, i) => (
                    <DropdownMenu
                        key={i}
                        selected={selectedParticipants[i] !== undefined ? selectedParticipants[i] : null}
                        onSelect={(index) => {
                            const newSelectedParticipants = [...selectedParticipants];
                            newSelectedParticipants[i] = index;
                            setSelectedParticipants(newSelectedParticipants);
                        }}
                        options={participants.map((p) => ({
                            row: (
                                <div className="flex items-center">
                                    <span className="text-left">{p.name}</span>
                                    <span className="flex-1 text-zinc-500 text-xs text-left px-2">{p.nickname}</span>
                                </div>
                            )
                        }))}
                    />
                ))
                }
                {selectedOption !== null && fosstoyOptions[selectedOption].message_required && (
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-48 p-1 bg-transparent placeholder-zinc-500 placeholder:text-shadow-[2px_2px_0px_rgb(0_0_0/0.75)]"
                        placeholder="Type a message..."
                        minLength={1}
                        maxLength={255}
                    />
                )}
                <Button onClick={() => {
                    if (!validate() || user === null || selectedOption === null) return;
                    const option = fosstoyOptions[selectedOption];
                    pb.collection('fosstoy_orders').create({
                        user: user.id,
                        option: option.id,
                        participants: option.participant_count > 0 ? selectedParticipants.map(i => participants[i].id) : [],
                        ...option.message_required && { message: message },
                    }).then(() => {
                        setUser({ ...user, balance: user.balance - option.cost });
                        setMessage("");
                        onClose();
                        toast.success("Fosstoy submitted!");
                    }).catch((error: ClientResponseError) => {
                        toast.error("Failed to submit Fosstoy: " + error.message);
                        console.error("Failed to submit Fosstoy:", error);
                    })
                }}>Send</Button>
            </div>
        </FloatingPanel>
    );
}