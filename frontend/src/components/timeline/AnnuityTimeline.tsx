import React from "react";
import clsx from "clsx";
import dayjs from "dayjs";
import type { Annuity } from '../../types/contract';
import { 
  FaCheck
} from 'react-icons/fa';
import { useAnnuityTimeline } from "./hooks/useAnnuityTimeline";

interface AnnuityTimelineProps {
  annuities: Annuity[];
  contractStartYear: number;
  contractEndYear: number;
  isMobileScrollable?: boolean;
}

export const AnnuityTimeline: React.FC<AnnuityTimelineProps> = ({
  annuities,
  contractStartYear,
  contractEndYear,
  isMobileScrollable = false,
}) => {
  const {
    years,
    nextAnnuityYear,
    focusYear,
    today,
    scrollRef,
    activeAnnuityRef,
    showLeftFade,
    showRightFade,
    updateFades,
    dragHandlers
  } = useAnnuityTimeline({
    annuities,
    contractStartYear,
    contractEndYear,
  });

  return (
    <div className="relative w-full py-3 group">
      {/* Sfumatura Fade Sinistra */}
      <div className={clsx(
        "absolute left-0 top-0 bottom-0 w-24 z-20 pointer-events-none transition-opacity duration-300",
        !isMobileScrollable && "hidden md:block",
        "bg-linear-to-r from-bg-card via-bg-card/50 to-transparent",
        showLeftFade ? "opacity-100" : "opacity-0"
      )} />

      {/* Sfumatura Fade Destra */}
      <div className={clsx(
        "absolute right-0 top-0 bottom-0 w-24 z-20 pointer-events-none transition-opacity duration-300",
        !isMobileScrollable && "hidden md:block",
        "bg-linear-to-l from-bg-card via-bg-card/50 to-transparent",
        showRightFade ? "opacity-100" : "opacity-0"
      )} />

      {/* Container Scrollabile */}
      <div 
        ref={scrollRef}
        onScroll={updateFades}
        {...dragHandlers}
        className={clsx(
          "w-full overflow-x-auto md:overflow-x-auto no-scrollbar py-8",
          "cursor-grab active:cursor-grabbing select-none"
        )}
      >
        <div className={clsx(
          "relative flex px-6 md:px-20",
          isMobileScrollable ? "flex-row min-w-max" : "flex-col md:flex-row md:min-w-max"
        )}>
          
          {/* Linea Verticale (mobile) */}
          {!isMobileScrollable && (
            <div className="absolute left-[44px] top-8 bottom-8 w-[2px] bg-border md:hidden" />
          )}

          {years.map((year) => {
            const annuity = annuities.find((a) => a.year === year);
            let isPaid = false;
            let dueDate = "";
            const isStart = year === contractStartYear;
            const isEnd = year === contractEndYear;

            if (annuity) {
              isPaid = annuity.is_paid;
              dueDate = dayjs(annuity.due_date).format("DD/MM/YYYY");
            } else if (isStart) {
              isPaid = true;
            } else if (isEnd) {
              isPaid = false;
            }

            let expireSoon = false;
            let expired = false;
            if (!isPaid && annuity && annuity.due_date) {
              const expireDate = dayjs(annuity.due_date);
              const daysLeft = expireDate.diff(today, "day");
              if (daysLeft < 0) expired = true;
              else if (daysLeft <= 60) expireSoon = true;
            }

            const isNext = year === nextAnnuityYear;
            const isTarget = year === focusYear;

            return (
              <div
                key={year}
                ref={isTarget ? activeAnnuityRef : null}
                className={clsx(
                  "relative flex z-10 flex-none",
                  isMobileScrollable 
                    ? "flex-col items-center w-[140px] md:w-[220px] mb-0" 
                    : "flex-row items-start md:flex-col md:items-center w-full md:w-[220px] mb-10 md:mb-0 last:mb-0"
                )}
              >
                {/* Linea orizzontale */}
                <div className={clsx(
                  "absolute left-0 right-0 h-[2px] bg-border z-0",
                  isMobileScrollable ? "top-[20px] md:top-[24px]" : "hidden md:block md:top-[24px]"
                )} 
                  style={{ 
                    left: isStart ? '50%' : '0', 
                    right: isEnd ? '50%' : '0' 
                  }} 
                />

                {/* Pallino */}
                <div
                  className={clsx(
                    "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 bg-bg-main shrink-0 transition-all duration-300 relative z-10",
                    isPaid ? "border-primary bg-primary" : "border-border text-border",
                    isNext && "border-orange-500 shadow-lg animate-pulse-ring"
                  )}
                >
                  {isPaid ? (
                    <FaCheck className="text-bg-main text-lg"/>
                  ) : (
                    <div className={clsx(
                      "w-4 h-4 md:w-5 md:h-5 rounded-full transition-colors duration-300",
                      isNext ? "bg-orange-500 scale-110" : "bg-transparent"
                    )} />
                  )}
                </div>

                {/* Contenuto Testuale */}
                <div className={clsx(
                  "flex flex-col w-full",
                  isMobileScrollable 
                    ? "items-center text-center mt-3 md:mt-6" 
                    : "ml-4 md:ml-0 md:mt-6 items-start md:items-center text-left md:text-center"
                )}>
                  <div className={clsx(
                    "flex flex-col md:flex-row md:justify-center items-center gap-1 md:gap-2"
                  )}>
                    <span
                      className={clsx(
                        "font-bold text-lg md:text-xl transition-colors duration-300",
                        isPaid ? "text-text-title" : (expired ? "text-error" : (isNext ? "text-orange-600" : "text-text-body")),
                      )}
                    >
                      {year}
                    </span>
                    {expireSoon && (
                      <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] border border-orange-200 whitespace-nowrap">
                        ⚠️ scade a breve
                      </span>
                    )}
                    {expired && (
                      <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] border border-red-200 whitespace-nowrap">
                        ⚠️ scaduta
                      </span>
                    )}
                  </div>

                  <div className={clsx(
                    "flex flex-col gap-0.5 mt-1",
                    isMobileScrollable ? "items-center" : "md:items-center"
                  )}>
                    {isStart && (
                      <span className="text-text-subtle text-[10px] uppercase tracking-widest font-bold">Apertura</span>
                    )}
                    {isEnd && (
                      <span className="text-text-subtle text-[10px] uppercase tracking-widest font-bold">
                        Scadenza naturale
                      </span>
                    )}
                    {dueDate && (
                      <span className="text-text-body text-[10px] md:text-xs font-medium">
                        Scadenza: {dueDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
