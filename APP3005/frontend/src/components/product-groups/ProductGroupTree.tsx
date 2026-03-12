import React, { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Plus, Edit2, Trash2, FolderPlus, FolderTree, Package, Layers } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ProductGroup } from "@/lib/api";
import { useSidebar } from "@/context/SidebarContext";

import { useNavigate } from "react-router-dom";

interface GroupNodeProps {
    node: ProductGroup;
    level: number;
    onEdit: (group: ProductGroup) => void;
    onAddChild: (parentId: string) => void;
    onDelete: (group: ProductGroup) => void;
}

const GroupNode = ({ node, level, onEdit, onAddChild, onDelete }: GroupNodeProps) => {
    const { isMobile } = useSidebar();
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(level < 1);
    const hasChildren = node.children_groups && node.children_groups.length > 0;
    const productCount = node._count?.products || 0;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    // Modern, minimal indentation
    const indentation = level * (isMobile ? 16 : 24);

    return (
        <div className="w-full relative">
            {/* Indentation guide lines */}
            {level > 0 && Array.from({ length: level }).map((_, i) => (
                <div 
                    key={i} 
                    className="absolute top-0 bottom-0 border-l border-stone-100 z-0" 
                    style={{ left: `${i * (isMobile ? 16 : 24) + 20}px` }} 
                />
            ))}

            <div
                className={`group/row relative z-10 flex items-center justify-between py-2 sm:py-2.5 pr-2 sm:pr-4 rounded-lg transition-colors border border-transparent hover:bg-white hover:border-stone-200 hover:shadow-sm cursor-pointer ${level === 0 ? 'bg-stone-50/50 mb-1' : 'mb-0.5'}`}
                style={{ marginLeft: `${indentation}px` }}
                onClick={() => navigate(`/product-groups/${node.group_id}`)}
            >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pl-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                        className={`w-6 h-6 shrink-0 flex items-center justify-center rounded transition-colors ${hasChildren ? 'text-stone-400 hover:bg-stone-200 hover:text-stone-700' : 'text-transparent pointer-events-none'}`}
                    >
                        {hasChildren && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                    </button>

                    <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-md ${level === 0 ? 'bg-luxury-charcoal/5 text-luxury-charcoal' : 'bg-stone-100 text-stone-500'}`}>
                        {hasChildren ? (
                            <Folder size={16} className={isExpanded ? "fill-current opacity-20" : ""} />
                        ) : (
                            <Layers size={16} />
                        )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className={`truncate font-medium ${level === 0 ? 'text-luxury-charcoal text-sm' : 'text-stone-700 text-sm'}`}>
                                {node.name}
                            </span>
                            {productCount > 0 && (
                                <span className="shrink-0 px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded text-[10px] font-medium flex items-center gap-1 border border-stone-200/50">
                                    {productCount} items
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 relative z-20" onClick={(e) => e.stopPropagation()}>
                    {/* Desktop Actions - Show on hover */}
                    {!isMobile && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <button
                                onClick={() => onAddChild(node.group_id)}
                                className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Add sub-collection"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={() => onEdit(node)}
                                className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit collection"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(node)}
                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete collection"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}

                    {/* Mobile Dropdown Menu or Fallback */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={`p-1.5 text-stone-400 hover:text-luxury-charcoal hover:bg-stone-100 rounded-md transition-colors ${!isMobile && 'opacity-0 group-hover/row:opacity-100'}`}>
                                <MoreVertical size={16} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1.5 bg-white border-stone-200 shadow-xl rounded-xl">
                            <DropdownMenuItem onClick={() => onAddChild(node.group_id)} className="rounded-md p-2 cursor-pointer focus:bg-stone-50">
                                <Plus size={14} className="mr-2 text-emerald-600" />
                                <span className="font-medium text-sm">Add nested</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(node)} className="rounded-md p-2 cursor-pointer focus:bg-stone-50">
                                <Edit2 size={14} className="mr-2 text-blue-600" />
                                <span className="font-medium text-sm">Edit details</span>
                            </DropdownMenuItem>
                            <div className="h-px bg-stone-100 my-1 mx-1" />
                            <DropdownMenuItem onClick={() => onDelete(node)} className="rounded-md p-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                <Trash2 size={14} className="mr-2" />
                                <span className="font-medium text-sm">Delete collection</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="w-full relative">
                    {node.children_groups.map((child: ProductGroup) => (
                        <GroupNode
                            key={child.group_id}
                            node={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onAddChild={onAddChild}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface ProductGroupTreeProps {
    groups: ProductGroup[];
    onEdit: (group: ProductGroup) => void;
    onAddChild: (parentId: string) => void;
    onDelete: (group: ProductGroup) => void;
}

export const ProductGroupTree = ({ groups, onEdit, onAddChild, onDelete }: ProductGroupTreeProps) => {
    if (!groups || groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-10 bg-white rounded-[3rem] border-2 border-dashed border-luxury-gold/20 shadow-xl group">
                <div className="w-28 h-28 bg-gradient-to-br from-luxury-gold/15 to-white rounded-[2rem] flex items-center justify-center mb-10 border border-luxury-gold/10 text-luxury-gold group-hover:rotate-12 transition-transform duration-700 shadow-lg">
                    <FolderTree size={56} />
                </div>
                <h3 className="text-4xl font-serif font-black text-luxury-charcoal mb-4 tracking-tight">Establish Your Legacy</h3>
                <p className="text-stone-500 text-center max-w-lg mb-12 leading-relaxed text-xl font-medium">
                    Your collection deserves an architecture as refined as the products themselves. Create your first grouping to begin organizing your luxury inventory.
                </p>
                <button
                    onClick={() => onAddChild("")}
                    className="px-12 py-5 bg-luxury-gold text-white rounded-2xl hover:bg-luxury-gold/90 transition-all font-black text-xl flex items-center gap-4 shadow-2xl shadow-luxury-gold/40 hover:-translate-y-2 active:scale-95"
                >
                    <Plus size={28} strokeWidth={4} />
                    Begin Creating
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-2 sm:p-4">
                <div className="space-y-1">
                    {groups.map((group) => (
                        <GroupNode
                            key={group.group_id}
                            node={group}
                            level={0}
                            onEdit={onEdit}
                            onAddChild={onAddChild}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
