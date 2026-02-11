import React, { useState, useEffect } from 'react';
import Wheel from './Wheel';
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface DateWheelPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
}

export const DateWheelPicker: React.FC<DateWheelPickerProps> = ({ value, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial date
  const parseDate = (dateStr: string) => {
    if (!dateStr) {
        const now = new Date();
        return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    // Validation
    if (!y || !m || !d) {
        const now = new Date();
        return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
    }
    return { y, m, d };
  };

  const { y, m, d } = parseDate(value);
  
  const [selectedYear, setSelectedYear] = useState(y);
  const [selectedMonth, setSelectedMonth] = useState(m);
  const [selectedDay, setSelectedDay] = useState(d);

  // Sync state if prop changes externally (and not currently open/editing to prevent jumps)
  useEffect(() => {
    const current = parseDate(value);
    setSelectedYear(current.y);
    setSelectedMonth(current.m);
    setSelectedDay(current.d);
  }, [value]);

  // Generate ranges
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i); // Current year +/- 10
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Dynamic days based on year/month
  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const maxDays = getDaysInMonth(selectedYear, selectedMonth);
  
  // If selected day exceeds max days (e.g. going from Jan 31 to Feb), clamp it
  useEffect(() => {
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
      updateDateString(selectedYear, selectedMonth, maxDays);
    }
  }, [selectedMonth, selectedYear, maxDays]);

  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  const updateDateString = (y: number, m: number, d: number) => {
    const yStr = y.toString();
    const mStr = m.toString().padStart(2, '0');
    const dStr = d.toString().padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
  };

  const handleYearChange = (val: number) => {
    setSelectedYear(val);
    updateDateString(val, selectedMonth, selectedDay);
  };

  const handleMonthChange = (val: number) => {
    setSelectedMonth(val);
    // Logic to clamp day is handled by useEffect, but we pass current day here for immediate string update
    // The useEffect will fire next render if correction is needed
    const newMaxDays = getDaysInMonth(selectedYear, val);
    const newDay = selectedDay > newMaxDays ? newMaxDays : selectedDay;
    updateDateString(selectedYear, val, newDay);
  };

  const handleDayChange = (val: number) => {
    setSelectedDay(val);
    updateDateString(selectedYear, selectedMonth, val);
  };

  const formatYear = (val: number) => `${val}年`;
  const formatMonth = (val: number) => `${val}月`;
  const formatDay = (val: number) => `${val}日`;

  const toggleOpen = () => setIsOpen(!isOpen);

  // Formatted display text
  const displayValue = `${selectedYear}年 ${selectedMonth}月 ${selectedDay}日`;

  return (
    <div className={`w-full ${className}`}>
        {/* Trigger Button */}
        <button
            type="button"
            onClick={toggleOpen}
            className={`w-full h-12 flex items-center justify-between px-4 rounded-lg border bg-white shadow-sm transition-all outline-none ${
                isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
            <div className="flex items-center gap-3 text-lg text-slate-800">
                <CalendarIcon size={20} className="text-blue-600" />
                <span className="font-medium font-mono">{displayValue}</span>
            </div>
            <div className="text-slate-400">
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </button>

        {/* Expandable Wheel Area using CSS Grid for dynamic height transition */}
        <div 
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out bg-white border-x border-b border-slate-100 rounded-b-lg shadow-inner ${
                isOpen ? 'grid-rows-[1fr] opacity-100 mt-[-4px] pt-2' : 'grid-rows-[0fr] opacity-0 border-none'
            }`}
        >
            <div className="overflow-hidden min-h-0">
                {/* Reduced bottom padding from pb-4 to pb-1 to pull content up */}
                <div className="flex justify-center items-center px-2 pb-1">
                    {/* Year */}
                    <div className="flex-[1.2] min-w-0">
                        <Wheel 
                            items={years} 
                            selected={selectedYear} 
                            onSelect={handleYearChange} 
                            formatItem={formatYear}
                        />
                    </div>
                    
                    {/* Month */}
                    <div className="flex-1 min-w-0">
                        <Wheel 
                            items={months} 
                            selected={selectedMonth} 
                            onSelect={handleMonthChange} 
                            formatItem={formatMonth}
                        />
                    </div>

                    {/* Day */}
                    <div className="flex-1 min-w-0">
                        <Wheel 
                            items={days} 
                            selected={selectedDay} 
                            onSelect={handleDayChange} 
                            formatItem={formatDay}
                        />
                    </div>
                </div>
                
                {/* Ensure padding is valid (pb-8) AND respect iPhone safe area */}
                <div className="flex justify-end px-4 pb-8 safe-area-bottom">
                    <button 
                        type="button" 
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-bold text-blue-600 px-6 py-2 bg-blue-50 rounded-full active:bg-blue-100 border border-blue-100 shadow-sm"
                    >
                        完了
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};