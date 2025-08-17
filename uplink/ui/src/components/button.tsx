type Color = 'blue' | 'red' | 'green' | 'yellow' | 'gray';
const ColorMap: Record<Color, string> = {
    blue: 'hover:text-blue-300 hover:border-blue-300',
    red: 'hover:text-red-300 hover:border-red-300',
    green: 'hover:text-green-300 hover:border-green-300',
    yellow: 'hover:text-yellow-300 hover:border-yellow-300',
    gray: 'hover:border-neutral-300',
};

interface ButtonProps {
    children: React.ReactNode;
    className?: string;
    color?: Color;
    onClick?: () => void;
}

export default function Button({ children, className, color = 'yellow', onClick }: ButtonProps) {
    return (
        <button onClick={onClick} className={`${className} border border-neutral-600 ${ColorMap[color]} rounded transition-colors`}>
            {children}
        </button>
    );
}