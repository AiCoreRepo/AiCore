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

interface GroupNodeProps {
    node: ProductGroup;
    level: number;
    onEdit: (group: ProductGroup) => void;
    onAddChild: (parentId: string) => void;
    onDelete: (group: ProductGroup) => void;
}

const GroupNode = ({ node, level, onEdit, onAddChild, onDelete }: GroupNodeProps) => {
    const { isMobile } = useSidebar();
    const [isExpanded, setIsExpanded] = useState(level < 1); // Expand top level by default
    const hasChildren = node.children_groups && node.children_groups.length > 0;
    const productCount = node._count?.products || 0;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    // More decent, balanced card design
    const cardBaseStyle = level === 0 
        ? "bg-white border-stone-100 shadow-lg shadow-stone-200/40 mb-4 py-4" 
        : "bg-white/90 border-stone-100 hover:border-luxury-gold/20 my-2 py-3";

    const leftBorderWidth = level === 0 ? "border-l-4" : "border-l-2";
    
    // Responsive indentation: less on mobile
    const indentation = isMobile ? level * 16 : level * 28;

    return (
        <div className="w-full">
            <div
                className={`flex items-center justify-between px-4 sm:px-6 rounded-xl transition-all duration-300 group border ${cardBaseStyle} ${leftBorderWidth} border-l-luxury-gold relative overflow-hidden`}
                style={{ marginLeft: `${indentation}px` }}
            >
                {/* Subtle sheen for top level */}
                {level === 0 && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-gold/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                )}
                
                <div className="flex items-center gap-3 sm:gap-5 cursor-pointer flex-1 relative z-10" onClick={toggleExpand}>
                    <button
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${hasChildren ? 'bg-stone-50 hover:bg-luxury-gold/10 text-stone-600 hover:text-luxury-gold border border-stone-100' : 'text-stone-300 pointer-events-none'}`}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-200" />
                        )}
                    </button>

                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${isExpanded ? 'bg-luxury-gold text-white' : 'bg-stone-50 text-luxury-gold border border-stone-100'}`}>
                        {hasChildren ? (
                            isExpanded ? <FolderOpen size={22} /> : <Folder size={22} />
                        ) : (
                            <Layers size={22} />
                        )}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className={`font-serif leading-tight font-bold text-luxury-charcoal tracking-tight truncate ${level === 0 ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
                                {node.name}
                            </h2>
                            <span className="text-[10px] bg-stone-50 text-stone-400 px-2 py-0.5 rounded-md font-mono font-bold border border-stone-100 uppercase tracking-tighter">
                                {node.slug}
                            </span>
                            {productCount > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-luxury-gold/5 rounded-md text-[10px] text-luxury-gold font-bold border border-luxury-gold/5">
                                    <Package size={10} />
                                    {productCount}
                                </div>
                            )}
                        </div>
                        {node.description && (
                            <p className="text-xs text-stone-500 line-clamp-1 max-w-lg font-medium opacity-80">
                                {node.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 relative z-10 ml-2">
                    {!isMobile && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddChild(node.group_id); }}
                            className="px-3 py-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all active:scale-95 font-bold text-[11px] flex items-center gap-1.5"
                            title="Add subgroup"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Add Inner
                        </button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-2 text-stone-400 hover:text-luxury-gold hover:bg-luxury-gold/5 rounded-lg transition-all focus:outline-none">
                                <MoreVertical size={18} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white border-luxury-gold/20 shadow-xl rounded-xl">
                            <DropdownMenuItem onClick={() => onEdit(node)} className="rounded-lg p-2 cursor-pointer focus:bg-luxury-gold/5 focus:text-luxury-gold">
                                <Edit2 size={16} className="mr-2.5 text-stone-400" />
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">Edit Collection</span>
                                </div>
                            </DropdownMenuItem>
                            {isMobile && (
                                <DropdownMenuItem onClick={() => onAddChild(node.group_id)} className="rounded-lg p-2 cursor-pointer focus:bg-emerald-50 focus:text-emerald-600">
                                    <FolderPlus size={16} className="mr-2.5 text-stone-400" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">Create Subgroup</span>
                                    </div>
                                </DropdownMenuItem>
                            )}
                            <div className="h-px bg-stone-100 my-1.5 mx-1" />
                            <DropdownMenuItem onClick={() => onDelete(node)} className="rounded-lg p-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                <Trash2 size={16} className="mr-2.5" />
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">Dissolve Group</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="w-full relative mt-1">
                    {/* Strong Connection lines - simplified for decent look */}
                    <div
                        className="absolute top-[-10px] bottom-6 border-l-2 border-luxury-gold/10"
                        style={{ left: `${indentation + 14}px` }}
                    />
                    {node.children_groups.map((child: ProductGroup) => (
                        <div key={child.group_id} className="relative">
                            <div 
                                className="absolute top-6 w-4 h-px bg-luxury-gold/10"
                                style={{ left: `${indentation + 14}px` }}
                            />
                            <GroupNode
                                node={child}
                                level={level + 1}
                                onEdit={onEdit}
                                onAddChild={onAddChild}
                                onDelete={onDelete}
                            />
                        </div>
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
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="space-y-6">
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
    );
};
