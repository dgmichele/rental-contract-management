import React from "react";
import clsx from "clsx";
import dayjs from "dayjs";
import type { Annuity } from '../../types/contract';
import { 
  FaCheck
} from 'react-icons/fa';

interface AnnuityTimelineProps {
  annuities: Annuity[];
  contractStartYear: number;
  contractEndYear: number;
}

export const AnnuityTimeline: React.FC<AnnuityTimelineProps> = ({
  annuities,
  contractStartYear,
  contractEndYear,
}) => {
  // Generiamo tutti gli anni tra l'inizio e la fine del contratto
  const years: number[] = [];
  for (let year = contractStartYear; year <= contractEndYear; year++) {
    years.push(year);
  }

  const today = dayjs();
  
  // Trova l'annualità non pagata più imminente (la prima nel tempo)
  const nextAnnuityYear = [...annuities]
    .filter(a => !a.is_paid && a.due_date)
    .sort((a, b) => dayjs(a.due_date).unix() - dayjs(b.due_date).unix())[0]?.year;

  return (
    <div className="w-full py-6">
      <div className="relative flex flex-col md:flex-row md:justify-between w-full max-w-4xl mx-auto">
        {/* Linea Verticale (mobile) */}
        <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-border md:hidden" />

        {/* Linea Orizzontale (desktop) */}
        <div className="absolute top-[19px] left-[20px] right-[20px] h-[2px] bg-border hidden md:block z-0" />

        {years.map((year) => {
          // Cerchiamo l'annualità corrispondente
          const annuity = annuities.find((a) => a.year === year);

          let isPaid = false;
          let dueDate = "";
          const isStart = year === contractStartYear;
          const isEnd = year === contractEndYear;

          if (annuity) {
            isPaid = annuity.is_paid;
            dueDate = dayjs(annuity.due_date).format("DD/MM/YYYY");
          } else if (isStart) {
            // L'anno di apertura è di default pagato
            isPaid = true;
          } else if (isEnd) {
             // L'anno di scadenza non ha una "scadenza annualità" solitamente
             isPaid = false;
          }

          // Controllo "scade a breve" se meno di 60 giorni
          let expireSoon = false;
          if (!isPaid && annuity && annuity.due_date) {
            const expireDate = dayjs(annuity.due_date);
            const daysLeft = expireDate.diff(today, "day");
            if (daysLeft >= 0 && daysLeft <= 60) {
              expireSoon = true;
            }
          }

          const isNext = year === nextAnnuityYear;

          return (
            <div
              key={year}
              className="relative flex flex-row md:flex-col items-start md:items-center mb-8 md:mb-0 last:mb-0 z-10 basis-0 grow md:grow-0"
            >
              {/* Pallino */}
              <div
                className={clsx(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 bg-bg-main shrink-0 transition-all duration-300 relative",
                  isPaid ? "border-primary bg-primary" : "border-border text-border",
                  isNext && "border-orange-500 shadow-lg animate-pulse-ring"
                )}
              >
                {isPaid ? (
                  <span className=""><FaCheck className="text-bg-main"/></span>
                ) : (
                  <div className={clsx(
                    "w-4 h-4 rounded-full transition-colors duration-300",
                    isNext ? "bg-orange-500 scale-110" : "bg-transparent"
                  )} />
                )}
              </div>

              {/* Contenuto Testuale */}
              <div className="ml-4 md:ml-0 md:mt-4 flex flex-col items-start md:items-center w-full">
                <div className="flex flex-wrap md:justify-center items-center gap-2">
                  <span
                    className={clsx(
                      "font-bold text-lg transition-colors duration-300",
                      isPaid ? "text-text-title" : (isNext ? "text-orange-600" : "text-text-body"),
                    )}
                  >
                    {year}
                  </span>
                  {expireSoon && (
                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs border border-orange-200 whitespace-nowrap">
                      ⚠️ scade a breve
                    </span>
                  )}
                </div>

                {isStart && (
                  <span className="text-text-subtle text-sm text-center">Apertura</span>
                )}
                {isEnd && (
                  <span className="text-text-subtle text-sm text-center">
                    Scadenza naturale
                  </span>
                )}
                {dueDate && (
                  <span className="text-text-body text-sm mt-1 text-center font-medium">
                    Scadenza: {dueDate}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
