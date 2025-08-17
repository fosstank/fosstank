import { X } from "lucide-react";
import Panel from "./panel";


interface FloatingPanelProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
}

export default function FloatingPanel({ children, isOpen, onClose }: FloatingPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-20 flex items-center justify-center">
            <div className="relative">
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 p-1 hover:cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-5 h-5"></X>
                </button>
                <Panel>
                    <Panel.Body className="bg-neutral-900 p-2">
                        {children}
                    </Panel.Body>
                </Panel>
            </div>
        </div>
    );
}