import { formatDate } from '@/shared/lib/formatters';

export function getScheduleSearchDate(selectedDate: Date, viewDate: Date) {
  const isSelectedMonth =
    selectedDate.getFullYear() === viewDate.getFullYear() &&
    selectedDate.getMonth() === viewDate.getMonth();
  return isSelectedMonth
    ? formatDate(selectedDate, 'YYYY-MM-DD')
    : formatDate(viewDate, 'YYYY-MM');
}
