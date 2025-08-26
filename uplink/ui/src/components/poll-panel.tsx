import { useEffect, useState } from "react";
import Button from "./button";
import LEDScroller from "./led-scroller";
import Panel from "./panel";
import PollButton from "./poll-button";
import { pb, Poll } from "@/lib/pocketbase";
import { ClientResponseError } from "pocketbase";
import { toast } from "./toaster";


export default function PollPanel() {
    const [poll, setPoll] = useState<Poll | null>(null);

    const fetchPoll = () => {
        pb.collection("polls").getFirstListItem("", { sort: "-created" }).then(poll => {
            setPoll(poll);
        }).catch((error: ClientResponseError) => {
            toast.error("Failed to fetch poll: " + error.message);
            console.error("Failed to fetch poll:", error);
        });
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
                                <PollButton key={index} progress={progress}>
                                    <span>{option}</span>
                                    <span className="ml-1 ">({optionVotes} votes)</span>
                                </PollButton>
                            );
                        })}
                        <Button className="w-min px-2 mx-auto" color="gray">Vote</Button>
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