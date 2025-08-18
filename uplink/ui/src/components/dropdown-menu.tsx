import { ChevronDown } from 'lucide-react';
import React, { useState, useRef } from 'react';


interface DropdownMenuProps {
    options: {
        row: React.ReactNode
    }[];
    selected: number | null;
    onSelect: (index: number) => void;
    disabled?: boolean;
}

export default function DropdownMenu({ options, selected = null, onSelect, disabled = false }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const computedDisabled = disabled || options.length === 1;

    return (
        <div
            className="relative w-96"
            ref={dropdownRef}
            tabIndex={0}
            onBlur={(e) => {
                if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
                    setIsOpen(false);
                }
            }}
        >
            <button
                onMouseDown={() => { if (!computedDisabled) setIsOpen(!isOpen); }}
                disabled={computedDisabled}
                className={`flex gap-2 items-center rounded-t-xs ${!isOpen ? "rounded-b-xs" : ""} w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 ${computedDisabled ? 'brightness-75 cursor-not-allowed' : ''}`}
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
                    <div className="fixed w-96 bg-neutral-800 rounded-b-xs overflow-y-auto max-h-64" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {options.map((option, index) => {
                            if (selected === 0 && index === 0) return null; // if the first option is selected, don't show it in the dropdown
                            return (
                                <button
                                    key={index}
                                    className="w-full flex gap-2 px-4 py-2 hover:bg-neutral-700"
                                    role="menuitem"
                                    onMouseDown={() => { setIsOpen(false); onSelect(index); }}
                                >
                                    <div className="flex-1">
                                        {option.row}
                                    </div>
                                    <ChevronDown className="h-5 w-5 invisible" aria-hidden="true" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div >
    );
}