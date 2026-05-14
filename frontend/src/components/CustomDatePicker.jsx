import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CustomDatePicker({ value, onChange, label, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const selectDate = (day) => {
    const selected = new Date(currentYear, currentMonth, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const isDateDisabled = (day) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    return checkDate < today;
  };

  const isSelected = (day) => {
    if (!value) return false;
    const selected = new Date(value);
    return selected.getDate() === day && selected.getMonth() === currentMonth && selected.getFullYear() === currentYear;
  };

  const isToday = (day) => {
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block font-bold mb-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`neo-input flex items-center justify-between cursor-pointer ${isOpen ? 'shadow-neo-md -translate-y-0.5' : ''}`}
      >
        <span className={value ? 'font-bold' : 'text-brand-muted'}>
          {value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Select Date'}
        </span>
        <CalendarIcon size={18} className="text-brand-primary" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-full mt-2 z-50 bg-white border-3 border-brand-dark shadow-neo-lg w-72 p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth} className="p-1 hover:bg-brand-bg border-2 border-brand-dark transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <div className="font-black uppercase text-sm">
                  {MONTHS[currentMonth]} {currentYear}
                </div>
                <button type="button" onClick={nextMonth} className="p-1 hover:bg-brand-bg border-2 border-brand-dark transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-brand-muted uppercase">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`} />)}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const disabled = isDateDisabled(day);
                  const selected = isSelected(day);
                  const current = isToday(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDate(day)}
                      className={`
                        h-8 text-xs font-bold border-2 transition-all
                        ${disabled ? 'text-gray-300 border-transparent cursor-not-allowed' : 'border-brand-dark hover:bg-brand-accent'}
                        ${selected ? 'bg-brand-primary text-white' : 'bg-white'}
                        ${current && !selected ? 'text-brand-primary underline decoration-2' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t-2 border-brand-dark/10 flex justify-between">
                <button 
                  type="button" 
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className="text-[10px] font-bold uppercase underline text-red-500"
                >
                  Clear
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] font-bold uppercase underline"
                >
                  Close
                </button>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="text-brand-primary text-sm mt-1">⚠ {error}</p>}
    </div>
  );
}
