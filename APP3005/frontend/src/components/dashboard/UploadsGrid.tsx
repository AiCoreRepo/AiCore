import { Filter } from "lucide-react";
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                            stats={product.stats}
                            onEdit={() => onEdit(product)}
                            onDelete={() => onDelete(product)}
                        />
                    ))
                )}
            </div>


        </div>
    );
};

export default UploadsGrid;
