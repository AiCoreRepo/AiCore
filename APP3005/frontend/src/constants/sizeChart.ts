export interface SizeDetails {
    size: string;
    chest?: string;
    waist?: string;
    hip?: string;
    length?: string;
    shoulder?: string;
    sleeve?: string;
}

export interface SizeChart {
    category: string;
    unit: string;
    sizes: SizeDetails[];
}

export const SIZE_CHARTS: Record<string, SizeChart> = {
    'mens-shirt': {
        category: "Men's Shirt",
        unit: 'inches',
        sizes: [
            { size: 'S', chest: '38', waist: '32', length: '28', shoulder: '17', sleeve: '24' },
            { size: 'M', chest: '40', waist: '34', length: '29', shoulder: '18', sleeve: '24.5' },
            { size: 'L', chest: '42', waist: '36', length: '30', shoulder: '19', sleeve: '25' },
            { size: 'XL', chest: '44', waist: '38', length: '31', shoulder: '20', sleeve: '25.5' },
            { size: 'XXL', chest: '46', waist: '40', length: '32', shoulder: '21', sleeve: '26' },
        ],
    },
    'mens-tshirt': {
        category: "Men's T-Shirt",
        unit: 'inches',
        sizes: [
            { size: 'S', chest: '36', length: '26', shoulder: '16' },
            { size: 'M', chest: '38', length: '27', shoulder: '17' },
            { size: 'L', chest: '40', length: '28', shoulder: '18' },
            { size: 'XL', chest: '42', length: '29', shoulder: '19' },
            { size: 'XXL', chest: '44', length: '30', shoulder: '20' },
        ],
    },
    'mens-pants': {
        category: "Men's Pants",
        unit: 'inches',
        sizes: [
            { size: '28', waist: '28', hip: '36', length: '40' },
            { size: '30', waist: '30', hip: '38', length: '40' },
            { size: '32', waist: '32', hip: '40', length: '41' },
            { size: '34', waist: '34', hip: '42', length: '41' },
            { size: '36', waist: '36', hip: '44', length: '42' },
            { size: '38', waist: '38', hip: '46', length: '42' },
        ],
    },
    'womens-top': {
        category: "Women's Top",
        unit: 'inches',
        sizes: [
            { size: 'XS', chest: '32', waist: '26', length: '25', shoulder: '14' },
            { size: 'S', chest: '34', waist: '28', length: '26', shoulder: '14.5' },
            { size: 'M', chest: '36', waist: '30', length: '27', shoulder: '15' },
            { size: 'L', chest: '38', waist: '32', length: '28', shoulder: '15.5' },
            { size: 'XL', chest: '40', waist: '34', length: '29', shoulder: '16' },
            { size: 'XXL', chest: '42', waist: '36', length: '30', shoulder: '16.5' },
        ],
    },
    'womens-dress': {
        category: "Women's Dress",
        unit: 'inches',
        sizes: [
            { size: 'XS', chest: '32', waist: '26', hip: '36', length: '36' },
            { size: 'S', chest: '34', waist: '28', hip: '38', length: '37' },
            { size: 'M', chest: '36', waist: '30', hip: '40', length: '38' },
            { size: 'L', chest: '38', waist: '32', hip: '42', length: '39' },
            { size: 'XL', chest: '40', waist: '34', hip: '44', length: '40' },
            { size: 'XXL', chest: '42', waist: '36', hip: '46', length: '41' },
        ],
    },
    'womens-pants': {
        category: "Women's Pants",
        unit: 'inches',
        sizes: [
            { size: '26', waist: '26', hip: '36', length: '38' },
            { size: '28', waist: '28', hip: '38', length: '38' },
            { size: '30', waist: '30', hip: '40', length: '39' },
            { size: '32', waist: '32', hip: '42', length: '39' },
            { size: '34', waist: '34', hip: '44', length: '40' },
            { size: '36', waist: '36', hip: '46', length: '40' },
        ],
    },
    default: {
        category: 'Standard Sizes',
        unit: 'inches',
        sizes: [
            { size: 'XS', chest: '32-34' },
            { size: 'S', chest: '34-36' },
            { size: 'M', chest: '36-38' },
            { size: 'L', chest: '38-40' },
            { size: 'XL', chest: '40-42' },
            { size: 'XXL', chest: '42-44' },
        ],
    },
};

export function getSizeChart(category?: string): SizeChart {
    if (!category) return SIZE_CHARTS.default;

    const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');
    return SIZE_CHARTS[normalizedCategory] || SIZE_CHARTS.default;
}

export function getAvailableSizes(category?: string): string[] {
    const chart = getSizeChart(category);
    return chart.sizes.map(s => s.size);
}
