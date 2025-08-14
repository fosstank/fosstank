import Button from "./button";
import LEDScroller from "./led-scroller";
import Panel from "./panel";
import PollButton from "./poll-button";


type PanelProps = {
    className?: string;
    title?: string;
    question: string;
    option1: string;
    option2: string;
}

export default function PollPanel({ className = '', title, question, option1, option2 }: PanelProps) {
    return (

        <Panel>
            <Panel.Header color="blue" className="px-1">
                <Panel.Header.Title text={title || "Poll"} />
            </Panel.Header>
            <Panel.Body className="p-1 gap-1">
                <LEDScroller text={question}></LEDScroller>
                <PollButton progress={24}><span>{option1}</span></PollButton>
                <PollButton progress={76}><span>{option2}</span></PollButton>
                <Button className="w-min px-2 mx-auto" color="gray">Vote</Button>
            </Panel.Body>
        </Panel>
    );
}