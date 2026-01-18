import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export const Breadcrumb = ({ items, className = "" }: BreadcrumbProps) => {
    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex items-center gap-2 text-sm">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {item.href && !isLast ? (
                                <Link
                                    to={item.href}
                                    className="transition-colors duration-150 hover:text-gray-900"
                                    style={{
                                        color: '#6B7280',
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    className={isLast ? "font-medium" : ""}
                                    style={{
                                        color: isLast ? '#2C2C2C' : '#6B7280',
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                    aria-current={isLast ? "page" : undefined}
                                >
                                    {item.label}
                                </span>
                            )}

                            {!isLast && (
                                <ChevronRight
                                    className="w-3.5 h-3.5 text-gray-400"
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
