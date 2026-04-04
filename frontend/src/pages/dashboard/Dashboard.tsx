import { type RefObject } from 'react';
import { useDashboardLogic } from './hooks/useDashboardLogic';
import { StatsCard } from '../../components/cards/StatsCard';
import { ContractCard } from '../../components/cards/ContractCard';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import { StatsCardSkeleton } from '../../components/cards/StatsCardSkeleton';
import { ContractCardSkeleton } from '../../components/cards/ContractCardSkeleton';
import { 
  FaFileContract, 
  FaUserTie, 
  FaCalendarDay, 
  FaCalendarWeek, 
  FaMoneyBillWave 
} from 'react-icons/fa';
import { formatCurrency } from '../../utils/format';

export default function Dashboard() {
  const {
    user,
    setPageCurrent,
    setPageNext,
    currentSectionRef,
    nextSectionRef,
    statsQuery,
    expiringCurrentQuery,
    expiringNextQuery,
    stats
  } = useDashboardLogic();
  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 pt-8"> {/* Added horizontal and top padding */}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-title">
          Ciao {user?.name} 😊
        </h1>
        <p className="text-text-body mt-2">
          Ecco una panoramica dei tuoi contratti.
        </p>
      </div>

      {/* Stats Section */}
      <section className="mb-12">
        <div className="flex gap-4 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 xl:mx-0 px-4 sm:px-6 lg:px-8 xl:px-0 xl:grid xl:grid-cols-5 xl:overflow-visible pb-4 no-scrollbar">
          {statsQuery.isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                label="Totale contratti"
                value={stats?.totalContracts || 0}
                icon={<FaFileContract />}
                className="min-w-[260px] xl:min-w-0"
              />
              <StatsCard
                label="Totale proprietari"
                value={stats?.totalOwners || 0}
                icon={<FaUserTie />}
                className="min-w-[260px] xl:min-w-0"
              />
              <StatsCard
                label="Scadenze mese corrente"
                value={stats?.expiringContractsCurrentMonth || 0}
                icon={<FaCalendarDay />}
                className="min-w-[260px] xl:min-w-0"
              />
              <StatsCard
                label="Scadenze mese successivo"
                value={stats?.expiringContractsNextMonth || 0}
                icon={<FaCalendarWeek />}
                className="min-w-[260px] xl:min-w-0"
              />
              <StatsCard
                label="Totale canoni mensili"
                value={formatCurrency(stats?.totalMonthlyRent)}
                icon={<FaMoneyBillWave />}
                className="min-w-[260px] xl:min-w-0"
              />
            </>
          )}
        </div>
      </section>

      {/* Expiring Contracts - Current Month */}
      <section className="mb-12">
        <h2 ref={currentSectionRef} className="text-xl font-heading font-bold text-text-title mb-6 flex items-center gap-2">
          Scadenze mese corrente:
          {expiringCurrentQuery.isFetching && <Spinner className="h-4 w-4" />}
        </h2>
        
        {expiringCurrentQuery.isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                 {[...Array(4)].map((_, i) => <ContractCardSkeleton key={i} />)}
             </div>
        ) : expiringCurrentQuery.isError ? (
             <div className="text-error">Errore nel caricamento delle scadenze.</div>
        ) : expiringCurrentQuery.data?.data.length === 0 ? (
             <p className="text-text-muted">✅ Nessuna scadenza prevista per questo mese.</p>
        ) : (
            <>
                {/* 
                  Grid Layout: 
                  Mobile: 1 col (default)
                  Tablet: 2 cols (md)
                  Desktop: 4 cols (lg -> xl?? User said "desktop: 3 righe e 4 colonne". Usually lg is desktop. Let's use lg:grid-cols-4)
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {expiringCurrentQuery.data?.data.map((item) => (
                        <ContractCard
                            key={`${item.contract.id}-${item.expiryType}-${item.expiryDate}`} // Unique key composition
                            contract={item.contract}
                            expiryType={item.expiryType}
                            expiryDate={item.expiryDate}
                            annuityYear={item.annuityYear}
                            notificationStatus={item.notificationStatus}
                        />
                    ))}
                </div>

                {/* Pagination */}
                {expiringCurrentQuery.data?.pagination && (
                    <Pagination
                        currentPage={expiringCurrentQuery.data.pagination.page}
                        totalPages={expiringCurrentQuery.data.pagination.totalPages}
                        onPageChange={setPageCurrent}
                        scrollTargetRef={currentSectionRef as RefObject<HTMLElement>}
                        className="mt-8"
                    />
                )}
            </>
        )}
      </section>

       {/* Expiring Contracts - Next Month */}
       <section>
        <h2 ref={nextSectionRef} className="text-xl font-heading font-bold text-text-title mb-6 flex items-center gap-2">
          Scadenze mese successivo:
           {expiringNextQuery.isFetching && <Spinner className="h-4 w-4" />}
        </h2>
        
        {expiringNextQuery.isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                 {[...Array(4)].map((_, i) => <ContractCardSkeleton key={i} />)}
             </div>
        ) : expiringNextQuery.isError ? (
             <div className="text-error">Errore nel caricamento delle scadenze.</div>
        ) : expiringNextQuery.data?.data.length === 0 ? (
             <p className="text-text-muted">✅ Nessuna scadenza prevista per il prossimo mese.</p>
        ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {expiringNextQuery.data?.data.map((item) => (
                         <ContractCard
                            key={`${item.contract.id}-${item.expiryType}-${item.expiryDate}`} 
                            contract={item.contract}
                            expiryType={item.expiryType}
                            expiryDate={item.expiryDate}
                            annuityYear={item.annuityYear}
                            notificationStatus={item.notificationStatus}
                        />
                    ))}
                </div>

                {/* Pagination */}
                {expiringNextQuery.data?.pagination && (
                    <Pagination
                        currentPage={expiringNextQuery.data.pagination.page}
                        totalPages={expiringNextQuery.data.pagination.totalPages}
                        onPageChange={setPageNext}
                        scrollTargetRef={nextSectionRef as RefObject<HTMLElement>}
                        className="mt-8"
                    />
                )}
            </>
        )}
      </section>
    </div>
  );
}
