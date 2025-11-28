import { Settings2, Filter } from "lucide-react";
import ProductCard from "./ProductCard";

interface UploadsGridProps {
    uploads: any[];
    onEdit: (product: any) => void;
    onDelete: (product: any) => void;
}

const UploadsGrid = ({ uploads, onEdit, onDelete }: UploadsGridProps) => {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">Uploads</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Collection Gallery</span>
                    <Filter size={18} />
                </div>
            </div>

            <div className="grid grid-cols-6 gap-4">
                {uploads.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No products uploaded yet.
                    </div>
                ) : (
                    uploads.map((product, index) => (
                        <ProductCard
                            key={index}
                            image={product.image}
                            images={product.images}
                            title={product.name}
                            tags={product.tags}
                            revenue={product.price} // Using price as revenue placeholder as per original design
                            status={product.status}
                            isNew={product.isNew}
                            onEdit={() => onEdit(product)}
                            onDelete={() => onDelete(product)}
                        />
                    ))
                )}
            </div>

            <div className="flex justify-end mt-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <Settings2 size={18} />
                    <span>Customize Dashboard</span>
                </button>
            </div>
        </div>
    );
};

export default UploadsGrid;
