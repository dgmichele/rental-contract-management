
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useStats, useExpiringContracts } from '../../hooks/useDashboard';
import { StatsCard } from '../../components/cards/StatsCard';
import { ContractCard } from '../../components/cards/ContractCard';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import { 
  FaFileContract, 
  FaUserTie, 
  FaCalendarDay, 
  FaCalendarWeek, 
  FaMoneyBillWave 
} from 'react-icons/fa';


export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  // Pagination States
  const [pageCurrent, setPageCurrent] = useState(1);
  const [pageNext, setPageNext] = useState(1);

  // Queries
  const statsQuery = useStats();
  
  const expiringCurrentQuery = useExpiringContracts({
    period: 'current',
    page: pageCurrent,
    limit: 12,
  });

  const expiringNextQuery = useExpiringContracts({
    period: 'next',
    page: pageNext,
    limit: 12,
  });

  // Derived Data
  const stats = statsQuery.data;
  
  // Handlers
  const handlePageChangeCurrent = (page: number) => {
    setPageCurrent(page);
    // Scroll to section potentially?
  };

  const handlePageChangeNext = (page: number) => {
    setPageNext(page);
  };

  if (statsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
         <Spinner className="h-12 w-12" />
      </div>
    );
  }

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
             value={`€ ${stats?.totalMonthlyRent?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '0,00'}`}
             icon={<FaMoneyBillWave />}
             className="min-w-[260px] xl:min-w-0"
          />
        </div>
      </section>

      {/* Expiring Contracts - Current Month */}
      <section className="mb-12">
        <h2 className="text-xl font-heading font-bold text-text-title mb-6 flex items-center gap-2">
          Scadenze mese corrente:
          {expiringCurrentQuery.isFetching && <Spinner className="h-4 w-4" />}
        </h2>
        
        {expiringCurrentQuery.isLoading ? (
             <div className="flex justify-center py-10"><Spinner /></div>
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
                        />
                    ))}
                </div>

                {/* Pagination */}
                {expiringCurrentQuery.data?.pagination && (
                    <Pagination
                        currentPage={expiringCurrentQuery.data.pagination.page}
                        totalPages={expiringCurrentQuery.data.pagination.totalPages}
                        onPageChange={handlePageChangeCurrent}
                        className="mt-8"
                    />
                )}
            </>
        )}
      </section>

       {/* Expiring Contracts - Next Month */}
       <section className="mb-8">
        <h2 className="text-xl font-heading font-bold text-text-title mb-6 flex items-center gap-2">
          Scadenze mese successivo:
           {expiringNextQuery.isFetching && <Spinner className="h-4 w-4" />}
        </h2>
        
        {expiringNextQuery.isLoading ? (
             <div className="flex justify-center py-10"><Spinner /></div>
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
                        />
                    ))}
                </div>

                {/* Pagination */}
                {expiringNextQuery.data?.pagination && (
                    <Pagination
                        currentPage={expiringNextQuery.data.pagination.page}
                        totalPages={expiringNextQuery.data.pagination.totalPages}
                        onPageChange={handlePageChangeNext}
                        className="mt-8"
                    />
                )}
            </>
        )}
      </section>
    </div>
  );
}
