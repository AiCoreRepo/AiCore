import React from 'react';

interface EditableAttributeCardProps {
    label: string;
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void;
    type?: 'text' | 'number' | 'select';
    options?: string[];
    unit?: string;
}

export const EditableAttributeCard: React.FC<EditableAttributeCardProps> = ({
    label,
    value,
    isEditing,
    onChange,
    type = 'text',
    options = [],
    unit = '',
}) => {
    return (
        <div className="editable-attribute-card">
            <div className="attribute-label">{label}</div>
            {isEditing ? (
                type === 'select' ? (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="attribute-input attribute-select"
                    >
                        <option value="">Select {label}</option>
                        {options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="attribute-input-wrapper">
                        <input
                            type={type}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="attribute-input"
                            placeholder={`Enter ${label.toLowerCase()}`}
                        />
                        {unit && <span className="attribute-unit">{unit}</span>}
                    </div>
                )
            ) : (
                <div className="attribute-value">
                    {value || 'Not specified'}
                    {unit && value && ` ${unit}`}
                </div>
            )}
        </div>
    );
};
