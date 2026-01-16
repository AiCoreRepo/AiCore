import { Grid3x3, List } from "lucide-react";

interface ViewToggleProps {
    view: "grid" | "list";
    onChange: (view: "grid" | "list") => void;
    className?: string;
}

export const ViewToggle = ({ view, onChange, className = "" }: ViewToggleProps) => {
    return (
        <div
            className={`inline-flex items-center rounded-lg p-1 ${className}`}
            style={{
                background: '#F5F0E6',
                border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
            role="group"
            aria-label="View toggle"
        >
            <button
                onClick={() => onChange("grid")}
                className={`p-2 rounded-md transition-all duration-200 ${view === "grid" ? "shadow-sm" : ""
                    }`}
                style={{
                    background: view === "grid" ? '#FFFFFF' : 'transparent',
                    color: view === "grid" ? '#2C2C2C' : '#6B7280',
                }}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
            >
                <Grid3x3 className="w-4 h-4" />
            </button>
            <button
                onClick={() => onChange("list")}
                className={`p-2 rounded-md transition-all duration-200 ${view === "list" ? "shadow-sm" : ""
                    }`}
                style={{
                    background: view === "list" ? '#FFFFFF' : 'transparent',
                    color: view === "list" ? '#2C2C2C' : '#6B7280',
                }}
                aria-label="List view"
                aria-pressed={view === "list"}
            >
                <List className="w-4 h-4" />
            </button>
        </div>
    );
};
