import { useContext, useEffect, useMemo, useState } from "react";
import Button from "./button";
import LEDScroller from "./led-scroller";
import Panel from "./panel";
import PollButton from "./poll-button";
import { pb, Poll } from "@/lib/pocketbase";
import { ClientResponseError } from "pocketbase";
import { toast } from "./toaster";
import { UserContext } from "@/app/providers";


export default function PollPanel() {
    const [poll, setPoll] = useState<Poll | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [voteTokens, setVoteTokens] = useState("1");
    const { user, setUser } = useContext(UserContext);

    const fetchPoll = () => {
        pb.collection("polls").getFirstListItem("", { sort: "-created" }).then(poll => {
            setPoll(poll);
        }).catch((error: ClientResponseError) => {
            toast.error("Failed to fetch poll: " + error.message);
            console.error("Failed to fetch poll:", error);
        });
    }

    const vote = async () => {
        if (user === null) {
            toast.error("You must be logged in to vote.");
            return;
        }
        if (!poll || selectedOption === null) return;

        const tokenCount = parseInt(voteTokens);
        if (isNaN(tokenCount) || tokenCount < 1) {
            toast.error("Please enter a valid number of tokens.");
            return;
        }

        if (user.balance < tokenCount) {
            toast.error("Insufficient tokens.");
            return;
        }

        try {
            const updatedVotes = { ...poll.votes };
            updatedVotes[selectedOption] = (updatedVotes[selectedOption]) + tokenCount;

            await pb.collection("poll_votes").create({
                user: user.id,
                poll: poll.id,
                option: selectedOption,
                tokens: tokenCount,
            });

            setUser({ ...user, balance: user.balance - tokenCount });
            setSelectedOption(null);
            setVoteTokens("1");
            toast.success(`${tokenCount} vote${tokenCount > 1 ? 's' : ''} submitted!`);
        } catch (error: any) {
            toast.error("Failed to vote: " + error.message);
            console.error("Failed to vote:", error);
        }
    }

    useEffect(() => {
        fetchPoll();
    }, [])

    useEffect(() => {
        const unsubscribe = pb.collection("polls").subscribe("*", (e) => {
            if (e.action === "create" || e.action === "update") {
                setPoll(e.record);
            } else if (e.action === "delete") {
                fetchPoll();
            }
        });

        return () => {
            unsubscribe?.then(unsub => unsub());
        };
    }, [])

    const pollWinners = useMemo(() => {
        if (!poll || !poll.closed) return null;
        let highestVotes = 0;
        let winners: number[] = [];
        poll.votes.forEach((voteCount, index) => {
            if (voteCount > highestVotes) {
                highestVotes = voteCount;
                winners = [index];
            } else if (voteCount === highestVotes) {
                winners.push(index);
            }
        })
        return winners;
    }, [poll]);

    return (
        <Panel>
            <Panel.Header color="blue" className="px-1">
                <Panel.Header.Title text="Poll" />
            </Panel.Header>
            <Panel.Body className="p-1 gap-1">
                {poll !== null ? (
                    <>
                        <LEDScroller text={poll.question}></LEDScroller>
                        {poll.options.map((option, index) => {
                            const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b, 0);
                            const optionVotes = poll.votes[index] || 0;
                            const progress = totalVotes === 0 ? 0 : Math.round((optionVotes / totalVotes) * 100);
                            return (
                                <PollButton
                                    key={index}
                                    title={option}
                                    votes={optionVotes}
                                    progress={progress}
                                    disabled={poll.closed}
                                    selected={poll.closed ? pollWinners?.includes(index) : selectedOption === index}
                                    onMouseDown={() => setSelectedOption(index)}
                                ></PollButton>
                            );
                        })}
                        {!poll.closed && selectedOption !== null && (
                            <div className="flex items-center gap-2 mx-auto">
                                <label className="text-sm text-gray-400">Tokens:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={voteTokens}
                                    onChange={(e) => setVoteTokens(e.target.value)}
                                    className="w-16 px-2 py-1 text-sm bg-neutral-800 border border-neutral-600 rounded-xs text-white focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                        )}
                        {!poll.closed && (
                            <Button
                                className="w-min px-2 mx-auto"
                                color="gray"
                                onClick={vote}
                            >
                                Vote
                            </Button>
                        )}
                    </>
                ) : (
                    <div className="text-center text-gray-400 text-sm p-4">
                        No one asked for your opinion...
                    </div>
                )}
            </Panel.Body>
        </Panel>
    );
}