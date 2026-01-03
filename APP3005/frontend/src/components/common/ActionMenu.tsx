import React from "react";
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react";
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
    onViewDetails?: () => void;
    className?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ onEdit, onDelete, onViewDetails, className }) => {
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
            <DropdownMenuContent align="end" className="w-48 bg-[#1c1917] backdrop-blur-sm border border-luxury-gold/20 shadow-xl rounded-xl p-1">
                {onViewDetails && (
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails();
                        }}
                        className="cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        <span>See Details</span>
                    </DropdownMenuItem>
                )}
                {onViewDetails && (onEdit || onDelete) && <DropdownMenuSeparator className="bg-luxury-gold/10 my-1" />}
                {onEdit && (
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="cursor-pointer text-stone-300 focus:text-luxury-gold focus:bg-luxury-gold/10 rounded-lg my-0.5"
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                )}
                {onEdit && onDelete && <DropdownMenuSeparator className="bg-luxury-gold/10 my-1" />}
                {onDelete && (
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10 rounded-lg my-0.5"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
