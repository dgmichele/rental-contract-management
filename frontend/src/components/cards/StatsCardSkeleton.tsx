
import React from 'react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

export const StatsCardSkeleton: React.FC = () => {
    return (
        <Card className="flex flex-col justify-between h-full min-w-[240px] p-4 shadow-sm">
            {/* Header / Label and Icon */}
            <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            </div>

            {/* Main Value */}
            <div className="mt-2">
                <Skeleton className="h-9 w-24 rounded" />
            </div>
        </Card>
    );
};
