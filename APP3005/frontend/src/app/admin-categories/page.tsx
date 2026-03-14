import React, { useState, useEffect } from "react";
import { Loader2, FolderTree, Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { useToast } from "@/components/ui/use-toast";
import { getAdminCategories, deleteCategory, deleteSubCategory, type Category } from "@/lib/api";
import { CategoryModal } from "@/components/admin/categories/CategoryModal";

const AdminCategoriesPage = () => {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<any>(null); // null means create new category
    const [modalParentId, setModalParentId] = useState<string | null>(null);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const data = await getAdminCategories();
            setCategories(data);
        } catch (error: any) {
            toast({
                title: "Error fetching categories",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateCategory = () => {
        setModalParentId(null);
        setModalData(null);
        setIsModalOpen(true);
    };

    const handleCreateSubCategory = (categoryId: string) => {
        setModalParentId(categoryId);
        setModalData(null);
        setIsModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setModalParentId(null);
        setModalData(category);
        setIsModalOpen(true);
    };

    const handleEditSubCategory = (categoryId: string, subcategory: any) => {
        setModalParentId(categoryId);
        setModalData(subcategory);
        setIsModalOpen(true);
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete category "${name}"? This will delete all its subcategories.`)) return;
        try {
            await deleteCategory(id);
            toast({ title: "Category deleted" });
            fetchCategories();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteSubCategory = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete subcategory "${name}"?`)) return;
        try {
            await deleteSubCategory(id);
            toast({ title: "SubCategory deleted" });
            fetchCategories();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex">
            {/* Sidebar */}
            <Sidebar />

            <main className="flex-1 ml-0 md:ml-[280px] p-4 md:p-8 max-w-full overflow-x-hidden transition-all">
                <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-24 text-neutral-200">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                        <div className="relative z-10">
                            <h1 className="text-3xl md:text-4xl font-serif text-white mb-2 tracking-wide font-light">Categories</h1>
                            <p className="text-neutral-400 text-sm md:text-lg">Manage top-level categories and subcategories</p>
                        </div>
                        <button
                            onClick={handleCreateCategory}
                            className="relative z-10 w-full md:w-auto px-6 py-3 bg-[#D4AF37] text-neutral-950 font-medium rounded-xl hover:bg-[#F3E5AB] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                        >
                            <Plus className="w-5 h-5" />
                            New Category
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-16 text-center">
                            <FolderTree className="w-16 h-16 text-neutral-600 mx-auto mb-6" />
                            <h3 className="text-2xl text-white font-serif mb-3">No Categories Yet</h3>
                            <p className="text-neutral-400 max-w-md mx-auto mb-8">
                                Categories help creators organize their products. Start by creating your first category.
                            </p>
                            <button
                                onClick={handleCreateCategory}
                                className="px-6 py-3 bg-neutral-800 text-white font-medium rounded-xl hover:bg-neutral-700 transition-colors inline-flex items-center gap-2 border border-neutral-700 hover:border-neutral-600"
                            >
                                <Plus className="w-5 h-5" />
                                Create Your First Category
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {categories.map((category) => (
                                <div key={category.category_id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                    <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                                        <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
                                            <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                                <FolderTree className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg md:text-xl font-medium text-white flex flex-wrap items-center gap-2 md:gap-3">
                                                    <span className="truncate">{category.name}</span>
                                                    {!category.is_active && (
                                                        <span className="px-2 py-0.5 text-xs bg-red-500/10 text-red-400 rounded-md border border-red-500/20 whitespace-nowrap">Inactive</span>
                                                    )}
                                                </h3>
                                                {category.description && (
                                                    <p className="text-neutral-400 text-xs md:text-sm mt-1 line-clamp-2 md:line-clamp-none">{category.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0 ml-12 md:ml-0">
                                            <button
                                                onClick={() => handleCreateSubCategory(category.category_id)}
                                                className="px-3 py-1.5 md:px-4 md:py-2 bg-neutral-800 text-neutral-300 text-xs md:text-sm rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-700 flex-1 md:flex-none text-center"
                                            >
                                                Add Subcategory
                                            </button>
                                            <div className="flex bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                                                <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="p-1.5 md:p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-md transition-all"
                                                    title="Edit Category"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category.category_id, category.name)}
                                                    className="p-1.5 md:p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded-md transition-all"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {category.subcategories && category.subcategories.length > 0 && (
                                        <div className="p-3 md:p-4 pl-6 md:pl-12 bg-neutral-950/50">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                                {category.subcategories.map((sub) => (
                                                    <div key={sub.sub_category_id} className="bg-neutral-900 border border-neutral-800 p-3 md:p-4 rounded-lg flex items-center justify-between group hover:border-neutral-700 transition-colors">
                                                        <div className="min-w-0 pr-2">
                                                            <h4 className="text-white text-sm md:text-base font-medium flex items-center gap-2 truncate">
                                                                <span className="truncate">{sub.name}</span>
                                                                {!sub.is_active && (
                                                                    <span className="w-2 h-2 flex-shrink-0 rounded-full bg-red-400" title="Inactive" />
                                                                )}
                                                            </h4>
                                                            <p className="text-neutral-500 text-xs mt-1 truncate">{sub.slug}</p>
                                                        </div>
                                                        <div className="flex opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <button
                                                                onClick={() => handleEditSubCategory(category.category_id, sub)}
                                                                className="p-1.5 md:p-2 text-neutral-400 hover:text-white transition-colors"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSubCategory(sub.sub_category_id, sub.name)}
                                                                className="p-1.5 md:p-2 text-neutral-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal */}
                <CategoryModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onSuccess={fetchCategories}
                    initialData={modalData}
                    parentId={modalParentId}
                />
            </main>
        </div>
    );
};

export default AdminCategoriesPage;
