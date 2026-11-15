import { useState } from 'react';

export const useCalendar = (initialDate: Date = new Date()) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [viewDate, setViewDate] = useState<Date>(initialDate);

  return {
    selectedDate,
    viewDate,
    setSelectedDate,
    setViewDate,
  };
};
