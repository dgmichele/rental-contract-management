import React from 'react';
import Card from '../ui/Card'; 
import clsx from 'clsx';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  icon, 
  description, 
  className 
}) => {
  return (
    <Card className={clsx("flex flex-col justify-between h-full min-w-[240px] shadow-sm hover:shadow-md transition-shadow duration-200", className)}>
        {/* Header with Label and Icon */}
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-text-secondary truncate pr-2" title={label}>
              {label}
            </h3>
            {icon && (
              <div className="text-primary text-xl shrink-0 bg-primary/10 p-2 rounded-full">
                {icon}
              </div>
            )}
        </div>
        
        {/* Main Value */}
        <div className="mt-2">
          <span className="text-3xl font-bold text-text-primary truncate block" title={String(value)}>
              {value}
          </span>
        </div>
        
        {/* Optional description/trend */}
        {description && (
           <p className="text-xs text-text-muted mt-2 font-medium">{description}</p>
        )}
    </Card>
  );
};
