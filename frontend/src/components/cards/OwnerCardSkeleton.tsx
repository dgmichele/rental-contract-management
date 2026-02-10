import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

/**
 * Skeleton loader per la OwnerCard.
 * Riproduce il layout della card originale per un caricamento fluido.
 */
export default function OwnerCardSkeleton() {
  return (
    <Card className="flex flex-col relative h-full shadow-sm">
      {/* Action Icons Placeholder */}
      <div className="absolute top-3 right-3 flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Header Placeholder */}
      <div className="mb-4 mt-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="w-full">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="space-y-3 mb-6 grow">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Button Placeholder */}
      <div className="mt-auto pt-2">
        <Skeleton className="h-10 w-full rounded" />
      </div>
    </Card>
  );
}

