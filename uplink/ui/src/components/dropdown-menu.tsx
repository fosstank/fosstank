

import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';


interface DropdownMenuProps {
    options: {
        row: React.ReactNode
    }[];
    selected: number | null;
    onSelect: (index: number) => void;
}

// FIXME: Dropdown will not scroll when contents extend off the screen.

export default function DropdownMenu({ options, selected = null, onSelect }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // FIXME: Get this dropdown to close when clicking outside of it.
    // The fight between onClick and onBlur is a pain.
    return (
        <div className="relative w-96" onKeyDown={handleKeyDown}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex gap-2 items-center rounded-t-xs ${!isOpen ? "rounded-b-xs" : ""} w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700`}
                id="options-menu"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <div className="flex-1" >
                    {selected !== null ? options[selected].row : ""}
                </div>
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </button>

            {isOpen && (
                <div className="absolute w-full z-20">
                    <div className="fixed w-96 bg-neutral-800 rounded-b-xs overflow-clip" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {options.map((option, index) => (
                            <button
                                key={index}
                                className="w-full flex gap-2 px-4 py-2 hover:bg-neutral-700"
                                role="menuitem"
                                onClick={() => {
                                    setIsOpen(false);
                                    onSelect(index);
                                }}
                            >
                                <div className="flex-1">
                                    {option.row}
                                </div>
                                <ChevronDown className="h-5 w-5 invisible" aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div >
    );
}