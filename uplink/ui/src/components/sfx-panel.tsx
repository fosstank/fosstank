import FloatingPanelContainer from "./floating-panel";

interface SFXPanelProps {
    isOpen: boolean;
    onClose: () => void;
}


export default function SFXPanel({ isOpen, onClose }: SFXPanelProps) {
    return (
        <FloatingPanelContainer isOpen={isOpen} onClose={onClose}>
            <h2 className="text-lg font-semibold mb-2">Sound Effects</h2>
            <p className="text-sm text-gray-400">This feature is under development.</p>
        </FloatingPanelContainer>
    );
}