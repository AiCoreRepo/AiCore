// ============================================
// FESTIVAL CONSTANTS (Frontend Mirror)
// ============================================

export interface Festival {
    key: string;
    label: string;
    month: string;
}

export const FESTIVALS: readonly Festival[] = [
    { key: 'DIWALI', label: 'Diwali', month: 'Oct/Nov' },
    { key: 'HOLI', label: 'Holi', month: 'Mar' },
    { key: 'RAKSHA_BANDHAN', label: 'Raksha Bandhan', month: 'Aug' },
    { key: 'CHRISTMAS', label: 'Christmas', month: 'Dec' },
    { key: 'REPUBLIC_DAY', label: 'Republic Day (26 Jan)', month: 'Jan' },
    { key: 'INDEPENDENCE_DAY', label: 'Independence Day (15 Aug)', month: 'Aug' },
    { key: 'NAVRATRI', label: 'Navratri', month: 'Sep/Oct' },
    { key: 'EID', label: 'Eid', month: 'Varies' },
    { key: 'PONGAL', label: 'Pongal', month: 'Jan' },
    { key: 'ONAM', label: 'Onam', month: 'Aug/Sep' },
    { key: 'NEW_YEAR', label: 'New Year', month: 'Jan' },
    { key: 'VALENTINES_DAY', label: "Valentine's Day", month: 'Feb' },
    { key: 'MAKAR_SANKRANTI', label: 'Makar Sankranti', month: 'Jan' },
    { key: 'BAISAKHI', label: 'Baisakhi', month: 'Apr' },
] as const;

export const FESTIVAL_OPTIONS = FESTIVALS.map(f => ({
    value: f.key,
    label: `${f.label} (${f.month})`,
}));
