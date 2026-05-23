import React from "react";

// Beautiful custom premium SVGs for body shapes to perfectly match the soft luxury gold theme
export const HourglassIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4 H17 C15 7, 14 10, 13 12 C14 14, 15 17, 17 20 H7 C9 17, 10 14, 11 12 C10 10, 9 7, 7 4 Z" fillOpacity="0.12" />
  </svg>
);

export const PearIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 4 H15 C14 7, 13 10, 13 12 C14 14, 16.5 17, 18 20 H6 C7.5 17, 10 14, 11 12 C11 10, 10 7, 9 4 Z" fillOpacity="0.12" />
  </svg>
);

export const AppleIconComponent = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 4 H15 C14.5 7, 17 10, 17 12 C17 14, 14.5 17, 13.5 20 H10.5 C9.5 17, 7 14, 7 12 C7 10, 9.5 7, 9 4 Z" fillOpacity="0.12" />
  </svg>
);

export const RectangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 4 H16.5 C16 8, 16 16, 16.5 20 H7.5 C8 16, 8 8, 7.5 4 Z" fillOpacity="0.12" />
  </svg>
);

export const InvertedTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4 H19 C17 7, 14.5 10, 14 12 C13.5 14, 13.5 17, 13.5 20 H10.5 C10.5 17, 10.5 14, 10 12 C9.5 10, 7 7, 5 4 Z" fillOpacity="0.12" />
  </svg>
);

export const AthleticIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4 H18 C16.5 7, 15 9, 14 11 C13.5 12, 14.5 15, 15 16 C15.5 17, 15 19, 15 20 H9 C9 19, 8.5 17, 9 16 C9.5 15, 10.5 12, 10 11 C9 9, 7.5 7, 6 4 Z" fillOpacity="0.12" />
  </svg>
);

export const BODY_SHAPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  HOURGLASS: HourglassIcon,
  PEAR: PearIcon,
  APPLE: AppleIconComponent,
  RECTANGLE: RectangleIcon,
  INVERTED_TRIANGLE: InvertedTriangleIcon,
  ATHLETIC: AthleticIcon,
};
