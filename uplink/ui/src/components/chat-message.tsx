interface ChatMessageProps {
    id: number;
    text: string;
    timestamp: string;
    user: {
        name: string;
        avatar: string;
    };
    cameraName?: string;
}

export default function ChatMessage({ text, timestamp, user, cameraName }: ChatMessageProps) {
    return (
        <div className="relative group">
            <div className="relative bg-zinc-900 p-3 text-sm">
                <div className="flex items-start gap-3">
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 border-2 border-accent-foreground bg-zinc-800"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-muted-foreground">{user.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">{timestamp}</span>
                        </div>
                        <p className="text-muted-foreground break-words">{text}</p>
                        {cameraName && (
                            <div className="mt-2 text-xs text-muted-foreground font-mono">
                                Viewing: {cameraName}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}