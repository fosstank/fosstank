import { PiggyBank } from "lucide-react";


export default function PiggyValue({ value, className }: { value: number, className?: string }) {
    return (
        <div className={`${className} flex items-end justify-end`}>
            <PiggyBank className="w-3 h-3"></PiggyBank>
            <span className="leading-[0.895] -tracking-[0.1em] font-light">{value.toLocaleString()}</span>
        </div>
    );
}