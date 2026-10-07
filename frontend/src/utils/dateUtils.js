/**
 * Utility functions for date calculations in the Alumni CRM Analytics Dashboard
 */

/**
 * Format a Date object or date string into YYYY-MM-DD ISO date string
 * @param {Date|string|number} date 
 * @returns {string} Formatted YYYY-MM-DD
 */
export const formatDateToISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates the date range from the Last Council Meeting of the preceding month to the present date.
 * Definition of Council Meeting Date: 4th week of the preceding calendar month (specifically the 4th Friday).
 * 
 * @param {Date|string} [referenceDate=new Date()] - Reference date (defaults to current date).
 * @param {number} [dayOfWeek=5] - Day of week (0=Sunday, 1=Monday, ..., 5=Friday). Defaults to 5 (Friday).
 * @returns {{ startDate: Date, endDate: Date, startDateISO: string, endDateISO: string }}
 */
export const getLastCouncilMeetingDateRange = (referenceDate = new Date(), dayOfWeek = 5) => {
  const ref = new Date(referenceDate);
  const currentYear = ref.getFullYear();
  const currentMonth = ref.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

  // Preceding calendar month
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Find the 4th target day (e.g. 4th Friday or 4th Monday) of the preceding month
  let targetDayCount = 0;
  let councilDate = null;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  for (let day = 1; day <= daysInPrevMonth; day++) {
    const testDate = new Date(prevYear, prevMonth, day);
    if (testDate.getDay() === dayOfWeek) {
      targetDayCount++;
      if (targetDayCount === 4) {
        councilDate = testDate;
        break;
      }
    }
  }

  // Fallback to 4th week date (24th of previous month) if not found
  if (!councilDate) {
    councilDate = new Date(prevYear, prevMonth, 24);
  }

  const startDate = councilDate;
  const endDate = new Date(ref);

  return {
    startDate,
    endDate,
    startDateISO: formatDateToISO(startDate),
    endDateISO: formatDateToISO(endDate)
  };
};
