import React from 'react';
import { X } from 'lucide-react';
import { SizeChart } from '@/constants/sizeChart';

interface SizeChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    sizeChart: SizeChart;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({ isOpen, onClose, sizeChart }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Size Chart - {sizeChart.category}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close size chart"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-auto">
                    <p className="text-sm text-gray-600 mb-4">
                        All measurements are in {sizeChart.unit}. For the best fit, measure yourself and compare with the size chart below.
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        Size
                                    </th>
                                    {sizeChart.sizes[0].chest && (
                                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            Chest
                                        </th>
                                    )}
                                    {sizeChart.sizes[0].waist && (
                                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            Waist
                                        </th>
                                    )}
                                    {sizeChart.sizes[0].hip && (
                                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            Hip
                                        </th>
                                    )}
                                    {sizeChart.sizes[0].length && (
                                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            Length
                                        </th>
                                    )}
                                    {sizeChart.sizes[0].shoulder && (
                                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            Shoulder
                                        </th>
                                    )}
                                    {sizeChart.sizes[0].sleeve && (
                                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            Sleeve
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {sizeChart.sizes.map((size, index) => (
                                    <tr key={size.size} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                                            {size.size}
                                        </td>
                                        {size.chest && (
                                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                                                {size.chest}
                                            </td>
                                        )}
                                        {size.waist && (
                                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                                                {size.waist}
                                            </td>
                                        )}
                                        {size.hip && (
                                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                                                {size.hip}
                                            </td>
                                        )}
                                        {size.length && (
                                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                                                {size.length}
                                            </td>
                                        )}
                                        {size.shoulder && (
                                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                                                {size.shoulder}
                                            </td>
                                        )}
                                        {size.sleeve && (
                                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                                                {size.sleeve}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* How to Measure */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">How to Measure:</h3>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• <strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
                            <li>• <strong>Waist:</strong> Measure around your natural waistline, keeping the tape comfortably loose.</li>
                            <li>• <strong>Hip:</strong> Measure around the fullest part of your hips.</li>
                            <li>• <strong>Length:</strong> Measure from the highest point of the shoulder to the desired length.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
