import { useState, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useStats, useExpiringContracts } from '../../../hooks/useDashboard';

export const useDashboardLogic = () => {
  const user = useAuthStore((state) => state.user);

  const [pageCurrent, setPageCurrent] = useState(1);
  const [pageNext, setPageNext] = useState(1);

  const currentSectionRef = useRef<HTMLHeadingElement>(null);
  const nextSectionRef = useRef<HTMLHeadingElement>(null);

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

  const stats = statsQuery.data;

  return {
    user,
    pageCurrent,
    setPageCurrent,
    pageNext,
    setPageNext,
    currentSectionRef,
    nextSectionRef,
    statsQuery,
    expiringCurrentQuery,
    expiringNextQuery,
    stats
  };
};
