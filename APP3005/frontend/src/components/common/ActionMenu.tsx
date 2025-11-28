import React from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionMenuProps {
    onEdit?: () => void;
    onDelete?: () => void;
    className?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ onEdit, onDelete, className }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={`p-1 text-muted-foreground hover:text-foreground outline-none transition-colors ${className}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical size={18} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-card border-muted-foreground/20">
                {onEdit && (
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="cursor-pointer hover:bg-muted focus:bg-muted"
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                )}
                {onEdit && onDelete && <DropdownMenuSeparator className="bg-muted-foreground/20" />}
                {onDelete && (
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
