interface ButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export default function Button({ children, className, onClick }: ButtonProps) {
    return (
        <button onClick={onClick} className={`${className} text-shadow-[2px_2px_0px_rgb(0_0_0/0.75)] border border-neutral-600 hover:border-yellow-300 hover:text-yellow-300 rounded transition-colors`}>
            {children}
        </button>
    );
}