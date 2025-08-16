import FloatingPanelContainer from "./floating-panel";

interface TTSPanelProps {
    isOpen: boolean;
    onClose: () => void;
}


export default function TTSPanel({ isOpen, onClose }: TTSPanelProps) {
    return (
        <FloatingPanelContainer isOpen={isOpen} onClose={onClose}>
            <h2 className="text-lg font-semibold mb-2">Text-to-Speech</h2>
            <p className="text-sm text-gray-400">This feature is under development.</p>
        </FloatingPanelContainer>
    );
}