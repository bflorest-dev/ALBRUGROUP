import React, { useState, useEffect, useRef } from 'react';
import './DatePicker.css';

interface DatePickerProps {
  value: string;
  onChange: (v: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelected(d);
        setDisplayDate(d);
      }
    }
  }, [value]);

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstWeekday = (y: number, m: number) => new Date(y, m, 1).getDay();

  const changeMonth = (offset: number) => {
    const d = new Date(displayDate);
    d.setMonth(d.getMonth() + offset);
    setDisplayDate(d);
  };

  const changeYear = (offset: number) => {
    const d = new Date(displayDate);
    d.setFullYear(d.getFullYear() + offset);
    setDisplayDate(d);
  };

  const chooseDate = (day: number) => {
    const d = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    setSelected(d);
    setOpen(false);
    onChange(d.toISOString().split('T')[0]);
  };

  const renderCalendar = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const total = daysInMonth(year, month);
    const start = firstWeekday(year, month);
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < start; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }
    for (let d = 1; d <= total; d++) {
      const isSel = selected &&
        selected.getFullYear() === year &&
        selected.getMonth() === month &&
        selected.getDate() === d;
      cells.push(
        <div
          key={d}
          className={`calendar-cell${isSel ? ' selected' : ''}`}
          onClick={() => chooseDate(d)}
        >
          {d}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="datepicker-container" ref={containerRef}>
      <input
        className="datepicker-input"
        readOnly
        value={selected ? selected.toISOString().split('T')[0] : ''}
        onClick={() => setOpen(!open)}
        placeholder="YYYY-MM-DD"
      />
      {open && (
        <div className="calendar-popup">
          <div className="calendar-header">
            <button onClick={() => changeYear(-1)}>&laquo;</button>
          <button onClick={() => changeMonth(-1)}>&lt;</button>
            <span className="calendar-title">
              {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          <button onClick={() => changeMonth(1)}>&gt;</button>
          <button onClick={() => changeYear(1)}>&raquo;</button>
          </div>
          <div className="calendar-grid">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(w => (
              <div key={w} className="calendar-cell header">{w}</div>
            ))}
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
