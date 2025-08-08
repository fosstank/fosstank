'use client';

interface PanelProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export default function Panel({ children, title, className = '' }: PanelProps) {
    return (
        <div className={`bg-zinc-950/80 border border-zinc-800/50 shadow-inner shadow-black p-4 ${className}`}>
            {title && (
                <h2 className="text-cyan-500 font-bold mb-4 uppercase tracking-wider [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">
                    {title}
                </h2>
            )}
            {children}
        </div>
    );
}
