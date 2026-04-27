import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberPickerProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  format?: (value: number) => string;
}

export const NumberPicker: React.FC<NumberPickerProps> = ({ value, min, max, onChange, label, format }) => {
  const increment = () => onChange(value >= max ? min : value + 1);
  const decrement = () => onChange(value <= min ? max : value - 1);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
      <div className="flex flex-col items-center bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <button onClick={increment} className="p-1 text-zinc-400 hover:text-white transition-colors">
          <ChevronUp size={16} />
        </button>
        <div className="w-12 py-1 text-center font-mono text-lg font-bold text-white tabular-nums border-y border-zinc-800">
          {format ? format(value) : value.toString().padStart(2, '0')}
        </div>
        <button onClick={decrement} className="p-1 text-zinc-400 hover:text-white transition-colors">
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
};
