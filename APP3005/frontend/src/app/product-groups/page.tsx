import React, { useState, useEffect } from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import { ProductGroupTree } from "@/components/product-groups/ProductGroupTree";
import { ProductGroupFormModal } from "@/components/product-groups/ProductGroupFormModal";
import { useToast } from "@/hooks/use-toast";
import { LuxeAlertDialog } from "@/components/common/dialog/LuxeAlertDialog";
import { creatorNavLinks } from "@/components/creator/creatorNavLinks";
import { Search, Plus, Menu } from "lucide-react";
import { getProfile, getCreatorGroups, deleteProductGroup, type ProductGroup } from "@/lib/api";
import LuxeSidebar from "@/components/common/LuxeSidebar";
import { useSidebar } from "@/context/SidebarContext";

const flattenGroups = (groups: ProductGroup[], result: ProductGroup[] = []) => {
    for (const group of groups) {
        result.push(group);
        if (group.children_groups && group.children_groups.length > 0) {
            flattenGroups(group.children_groups, result);
        }
    }
    return result;
};

const ProductGroupsPage: React.FC = () => {
    const { sidebarWidth, toggleSidebar, isMobile } = useSidebar();
    const { toast } = useToast();
    
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [flatGroups, setFlatGroups] = useState<ProductGroup[]>([]);
    const [filteredGroups, setFilteredGroups] = useState<ProductGroup[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<string>("");
    
    // Delete state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<ProductGroup | null>(null);

    const [user, setUser] = useState({
        name: "Loading...",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        role: "Creator",
        subtitle: "",
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [profile, groupsData] = await Promise.all([
                getProfile(),
                getCreatorGroups()
            ]);
            
            setUser({
                name: profile.name || profile.store_name || "Creator",
                avatar: profile.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
                role: profile.role || "Creator",
                subtitle: profile.subtitle || "",
            });

            const data: ProductGroup[] = groupsData || [];
            setGroups(data);
            setFlatGroups(flattenGroups(data));
            setFilteredGroups(data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredGroups(groups);
            return;
        }

        const query = searchQuery.toLowerCase();
        
        // Recursive filter function to handle nested structures
        const filterTree = (nodes: ProductGroup[]): ProductGroup[] => {
            return nodes.reduce((acc: ProductGroup[], node: ProductGroup) => {
                const matches = node.name.toLowerCase().includes(query) || 
                              (node.description && node.description.toLowerCase().includes(query)) ||
                              node.slug.toLowerCase().includes(query);
                
                let filteredChildren: ProductGroup[] = [];
                if (node.children_groups && node.children_groups.length > 0) {
                    filteredChildren = filterTree(node.children_groups);
                }

                if (matches || filteredChildren.length > 0) {
                    acc.push({
                        ...node,
                        children_groups: filteredChildren
                    });
                }
                return acc;
            }, []);
        };

        setFilteredGroups(filterTree(groups));
    }, [searchQuery, groups]);

    const handleCreate = () => {
        setEditingGroup(null);
        setSelectedParentId("");
        setIsModalOpen(true);
    };

    const handleEdit = (group: ProductGroup) => {
        setEditingGroup(group);
        setSelectedParentId(group.parent_id || "");
        setIsModalOpen(true);
    };

    const handleAddChild = (parentId: string) => {
        setEditingGroup(null);
        setSelectedParentId(parentId);
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (group: ProductGroup) => {
        setGroupToDelete(group);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!groupToDelete) return;

        try {
            await deleteProductGroup(groupToDelete.group_id);
            toast({
                title: "✅ Deleted",
                description: "Grouping was successfully deleted.",
            });
            fetchData();
        } catch (error: any) {
            toast({
                title: "❌ Delete Failed",
                description: error.message || "Could not delete grouping.",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setGroupToDelete(null);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)' }}>
            <LuxeSidebar user={user} navLinks={creatorNavLinks} />
            <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: sidebarWidth }}>
                <div className="min-h-screen p-4 md:p-10">
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="mb-6 p-3 text-luxury-charcoal bg-white/80 backdrop-blur-md border border-luxury-gold/20 rounded-2xl shadow-sm transition-all active:scale-95"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                    
                    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        {/* Clean, Modern Header Area */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-stone-200">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-serif font-black text-luxury-charcoal tracking-tight">
                                        Product Collections
                                    </h1>
                                    <div className="flex items-center gap-3 px-3 py-1 bg-stone-100/80 rounded-lg text-xs font-bold text-stone-500 uppercase tracking-wider">
                                        <span>Total {flatGroups.length}</span>
                                        <div className="w-1 h-1 rounded-full bg-stone-300" />
                                        <span className="text-emerald-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</span>
                                    </div>
                                </div>
                                <p className="text-stone-500 font-medium text-sm">
                                    Organize and manage your boutique's product hierarchy.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative w-full md:w-64 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-luxury-charcoal transition-colors w-4 h-4" />
                                    <input 
                                        type="text" 
                                        placeholder="Search collections..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-luxury-charcoal focus:ring-1 focus:ring-luxury-charcoal transition-all text-sm font-medium text-luxury-charcoal placeholder:text-stone-400 shadow-sm"
                                    />
                                    {searchQuery && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-luxury-charcoal bg-stone-100 px-1.5 py-0.5 rounded">
                                            {filteredGroups.length}
                                        </div>
                                    )}
                                </div>
                                
                                <button
                                    onClick={handleCreate}
                                    className="shrink-0 px-4 py-2 bg-luxury-charcoal text-white rounded-lg hover:bg-black transition-colors font-bold text-sm shadow-sm active:scale-95 flex items-center gap-2"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    Create Node
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center py-32 space-y-6">
                                <div className="w-12 h-12 rounded-full border-3 border-luxury-gold/10 border-t-luxury-gold animate-spin" />
                                <span className="text-luxury-gold font-serif text-xl font-black italic tracking-widest animate-pulse">Rendering Boutique...</span>
                            </div>
                        ) : (
                            <div className="px-1 pb-16">
                                <ProductGroupTree 
                                    groups={filteredGroups} 
                                    onEdit={handleEdit} 
                                    onAddChild={handleAddChild} 
                                    onDelete={handleDeleteRequest} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ProductGroupFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={fetchData}
                initialData={editingGroup ? { ...editingGroup, parent_id: selectedParentId } : { parent_id: selectedParentId }}
                availableParents={flatGroups}
            />

            {/* Delete Confirmation */}
            {groupToDelete && (
                <LuxeAlertDialog
                    isOpen={isDeleteDialogOpen}
                    setIsOpen={setIsDeleteDialogOpen}
                    title="Dissolve Grouping?"
                    description={`You are about to dissolve "${groupToDelete.name}". Associated items will remain preserved in your inventory, and nested collections will be gracefully promoted. Proceed with caution.`}
                    actionLabel="Dissolve"
                    cancelLabel="Retain"
                    onAction={handleDeleteConfirm}
                    variant="destructive"
                    trigger={<div className="hidden" />}
                />
            )}
        </div>
    );
};

export default ProductGroupsPage;
