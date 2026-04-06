export function extractAvailableFilters(products: any[]) {
  const categories = new Set<string>();
  const brands = new Set<string>();
  const sizes = new Set<string>();
  const colors = new Set<string>();
  const bodyShapes = new Set<string>();
  const skinTones = new Set<string>();
  let hasInStock = false;
  let hasOutOfStock = false;

  products.forEach(p => {
    if (p.category) categories.add(p.category);
    if (p.creator?.store_name) brands.add(p.creator.store_name);
    
    const meta = p.metadata as any;
    if (meta && meta.size) {
      String(meta.size).split(',').forEach(s => sizes.add(s.trim()));
    }
    if (meta && meta.color) {
      String(meta.color).split(',').forEach(c => colors.add(c.trim()));
    }

    if (p.body_shapes && Array.isArray(p.body_shapes)) {
      p.body_shapes.forEach(b => bodyShapes.add(b));
    }

    if (p.skin_tones && Array.isArray(p.skin_tones)) {
      p.skin_tones.forEach(s => skinTones.add(s));
    }
    
    if (p.inventory_count > 0) {
      hasInStock = true;
    } else {
      hasOutOfStock = true;
    }
  });

  const availability: string[] = [];
  if (hasInStock) availability.push('In Stock');
  if (hasOutOfStock) availability.push('Out of Stock');

  return {
    categories: Array.from(categories).sort(),
    brands: Array.from(brands).sort(),
    bodyShapes: Array.from(bodyShapes).sort(),
    skinTones: Array.from(skinTones).sort(),
    sizes: Array.from(sizes),
    colors: Array.from(colors).sort(),
    ratings: [], // Missing in DB schema
    discounts: [], // Missing in DB schema
    availability
  };
}
