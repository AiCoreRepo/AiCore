import React from 'react';

export interface Option {
    label: string;
    value: string;
}

interface EditableAttributeCardProps {
    label: string;
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void;
    type?: 'text' | 'number' | 'select';
    options?: string[] | Option[];
    unit?: string;
    required?: boolean;
    hasError?: boolean;
    helperText?: string;
}

export const EditableAttributeCard: React.FC<EditableAttributeCardProps> = ({
    label,
    value,
    isEditing,
    onChange,
    type = 'text',
    options = [],
    unit = '',
    required = false,
    hasError = false,
    helperText,
}) => {
    // Helper to get display text for a value when not editing
    const getDisplayValue = () => {
        if (!value) return 'Not specified';

        if (type === 'select' && options.length > 0) {
            // Check if options are objects
            const isObjectOptions = typeof options[0] !== 'string';
            if (isObjectOptions) {
                const found = (options as Option[]).find(opt => opt.value === value);
                return found ? found.label : value;
            }
        }
        return value;
    };

    return (
        <div className={`editable-attribute-card ${hasError ? 'editable-attribute-card-error' : ''}`}>
            <div className="attribute-label-row">
                <div className="attribute-label">{label}</div>
                {required && isEditing && (
                    <span className="attribute-required-pill">Required</span>
                )}
            </div>
            {isEditing ? (
                type === 'select' ? (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={`attribute-input attribute-select ${hasError ? 'attribute-input-error' : ''}`}
                    >
                        <option value="">Select {label}</option>
                        {options.map((option) => {
                            const isString = typeof option === 'string';
                            const optValue = isString ? option : option.value;
                            const optLabel = isString ? option : option.label;
                            return (
                                <option key={optValue} value={optValue}>
                                    {optLabel}
                                </option>
                            );
                        })}
                    </select>
                ) : (
                    <div className="attribute-input-wrapper">
                        <input
                            type={type}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className={`attribute-input ${hasError ? 'attribute-input-error' : ''}`}
                            placeholder={`Enter ${label.toLowerCase()}`}
                        />
                        {unit && <span className="attribute-unit">{unit}</span>}
                    </div>
                )
            ) : (
                <div className="attribute-value">
                    {getDisplayValue()}
                    {unit && value && ` ${unit}`}
                </div>
            )}
            {isEditing && helperText && (
                <p className="attribute-helper-text">{helperText}</p>
            )}
        </div>
    );
};
