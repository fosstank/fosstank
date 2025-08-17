import FloatingPanel from "./floating-panel";

interface FosstoyPanelProps {
    isOpen: boolean;
    onClose: () => void;
}


export default function FosstoyPanel({ isOpen, onClose }: FosstoyPanelProps) {
    return (
        <FloatingPanel isOpen={isOpen} onClose={onClose}>
            <h2 className="text-lg font-semibold mb-2">Fosstoys</h2>
            <p className="text-sm text-gray-400">This feature is under development.</p>
        </FloatingPanel>
    );
}