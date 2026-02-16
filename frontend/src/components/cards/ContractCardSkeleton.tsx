import React from 'react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

export const ContractCardSkeleton: React.FC = () => {
    return (
        <Card className="h-full flex flex-col relative">
            {/* Action Icons Placeholder */}
            <div className="absolute top-1.5 right-1.5 flex gap-1">
                <Skeleton className="h-8 w-8 rounded-full shadow-sm" />
                <Skeleton className="h-8 w-8 rounded-full shadow-sm" />
                <Skeleton className="h-8 w-8 rounded-full shadow-sm" />
            </div>

            {/* Header / Owner */}
            <div className="flex items-center gap-3 mb-3 mt-6">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 overflow-hidden">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                </div>
            </div>

            {/* Address */}
            <Skeleton className="h-8 w-full mb-4 rounded" />

            {/* Expiry */}
             <Skeleton className="h-16 w-full mb-4 rounded-lg" />

            {/* Financials / Rent */}
            <div className="flex gap-3 mb-4 mt-auto">
                <Skeleton className="h-12 flex-1 rounded" />
                <Skeleton className="h-12 flex-1 rounded" />
            </div>

            {/* Action Button */}
            <Skeleton className="h-10 w-full mt-2 rounded" />
        </Card>
    );
};
