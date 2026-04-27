import React from 'react';
import { NumberPicker } from './NumberPicker';
import { translations } from '../locales/translations';

interface DateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  label: string;
  language: 'ar' | 'fr' | 'en';
  prefix?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, label, language, prefix = 'dt' }) => {
  const t = translations[language];
  const date = new Date(value || new Date().toISOString());
  const isValid = !isNaN(date.getTime());
  
  const year = isValid ? date.getFullYear() : new Date().getFullYear();
  const month = isValid ? date.getMonth() + 1 : 1;
  const day = isValid ? date.getDate() : 1;
  const hour = isValid ? date.getHours() : 0;
  const minute = isValid ? date.getMinutes() : 0;

  const updateDate = (y: number, m: number, d: number, h: number, mi: number) => {
    const newDate = new Date(y, m - 1, d, h, mi);
    // Correctly handling timezone offset to keep date consistent
    const offset = newDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(newDate.getTime() - offset);
    onChange(adjustedDate.toISOString().slice(0, 16));
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">{label}</label>
      <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <NumberPicker label={t.year} value={year} min={2020} max={2030} format={(v) => (v % 100).toString().padStart(2, '0')} onChange={(v) => updateDate(v, month, day, hour, minute)} />
          <NumberPicker label={t.month} value={month} min={1} max={12} onChange={(v) => updateDate(year, v, day, hour, minute)} />
          <NumberPicker label={t.day} value={day} min={1} max={31} onChange={(v) => updateDate(year, month, v, hour, minute)} />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800">
          <NumberPicker label={t.hour} value={hour} min={0} max={23} onChange={(v) => updateDate(year, month, day, v, minute)} />
          <NumberPicker label={t.minute} value={minute} min={0} max={59} onChange={(v) => updateDate(year, month, day, hour, v)} />
        </div>
      </div>
    </div>
  );
};
