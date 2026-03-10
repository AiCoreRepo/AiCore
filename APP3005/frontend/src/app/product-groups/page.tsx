import React, { useState, useEffect } from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import { ProductGroupTree } from "@/components/product-groups/ProductGroupTree";
import { ProductGroupFormModal } from "@/components/product-groups/ProductGroupFormModal";
import { useToast } from "@/hooks/use-toast";
import { LuxeAlertDialog } from "@/components/common/dialog/LuxeAlertDialog";
import { Search, Plus, LayoutDashboard, Shirt, Upload, Ticket, BarChart3, Settings, Menu, FolderTree } from "lucide-react";
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

    const navLinks = [
        { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/creator-dashboard" },
        { label: "My Wardrobe", icon: <Shirt size={20} />, href: "/wardrobe" },
        { label: "Groupings", icon: <FolderTree size={20} />, href: "/product-groups" },
        { label: "Bulk Upload", icon: <Upload size={20} />, href: "/bulk-upload" },
        { label: "My Coupons", icon: <Ticket size={20} />, href: "/creator-coupons" },
        { label: "Analytics", icon: <BarChart3 size={20} />, href: "/analytics" },
        { label: "Settings", icon: <Settings size={20} />, href: "/settings" },
    ];

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
            <LuxeSidebar user={user} navLinks={navLinks} />
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
                        {/* Dramatic Luxury Header - Refined & More Compact */}
                        <div className="relative group p-8 md:p-12 rounded-[2rem] bg-[#121212] text-white shadow-2xl overflow-hidden border border-white/10">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-luxury-gold/15 rounded-full blur-[100px] -mr-32 -mt-16 group-hover:bg-luxury-gold/25 transition-all duration-1000" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-[60px] -ml-12 -mb-12" />
                            <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-luxury-gold/5" />

                            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-8">
                                <div className="space-y-4 text-center sm:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-luxury-gold text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                        Architect
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-none">
                                        Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-white to-luxury-gold animate-gradient-x underline decoration-luxury-gold/30 decoration-offset-4">Collections</span>
                                    </h1>
                                    <p className="text-white/50 max-w-md text-base md:text-lg font-medium leading-relaxed italic">
                                        Design your boutique's hierarchy with clinical precision.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center sm:items-end gap-4">
                                    <button
                                        onClick={handleCreate}
                                        className="px-8 py-4 rounded-xl bg-luxury-gold text-black font-black text-lg transition-all shadow-[0_15px_40px_rgba(212,175,55,0.2)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.4)] hover:-translate-y-1 active:scale-95 flex items-center gap-2 group/btn"
                                    >
                                        <Plus size={20} strokeWidth={4} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                                        New Collection
                                    </button>
                                    <div className="flex items-center gap-6 text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span>Total: {flatGroups.length}</span>
                                        <div className="w-1 h-1 rounded-full bg-luxury-gold/40" />
                                        <span>Status: Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Control Bar - More balanced scale */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-2">
                            <div className="relative w-full sm:w-[380px] group transform transition-all duration-300 focus-within:translate-x-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-luxury-gold transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search collections..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:border-luxury-gold transition-all shadow-md font-bold text-luxury-charcoal placeholder:text-stone-300 text-base"
                                />
                                {searchQuery && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white bg-luxury-gold px-2 py-1 rounded-lg">
                                        {filteredGroups.length} FOUND
                                    </div>
                                )}
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
