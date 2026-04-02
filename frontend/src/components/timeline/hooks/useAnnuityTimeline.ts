import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import type { Annuity } from '../../../types/contract';

interface UseAnnuityTimelineProps {
  annuities: Annuity[];
  contractStartYear: number;
  contractEndYear: number;
}

export const useAnnuityTimeline = ({
  annuities,
  contractStartYear,
  contractEndYear,
}: UseAnnuityTimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeAnnuityRef = useRef<HTMLDivElement>(null);
  
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Generiamo gli anni e l'annualità target
  const years = useMemo(() => {
    const y: number[] = [];
    for (let year = contractStartYear; year <= contractEndYear; year++) {
      y.push(year);
    }
    return y;
  }, [contractStartYear, contractEndYear]);

  const nextAnnuityYear = useMemo(() => {
    return [...annuities]
      .filter(a => !a.is_paid && a.due_date)
      .sort((a, b) => dayjs(a.due_date).unix() - dayjs(b.due_date).unix())[0]?.year;
  }, [annuities]);

  const today = dayjs();

  // Gestione visibilità dei fade
  const updateFades = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftFade(scrollLeft > 5);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  // Sync scroll e resize
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeAnnuityRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const target = activeAnnuityRef.current;
        const scrollTarget = target.offsetLeft - container.clientWidth / 2 + target.clientWidth / 2;
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
      updateFades();
    }, 150);

    window.addEventListener('resize', updateFades);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateFades);
    };
  }, [updateFades]);

  // Handlers Drag-to-Scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
    updateFades();
  };

  return {
    years,
    nextAnnuityYear,
    today,
    scrollRef,
    activeAnnuityRef,
    showLeftFade,
    showRightFade,
    isDragging,
    updateFades,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onMouseMove: handleMouseMove,
    }
  };
};
