import React, { useRef } from 'react';
import { DateWheelPicker } from './DateWheelPicker';
import { DatePicker } from './DatePicker';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: 'text' | 'number' | 'date';
  step?: string;
  prevValue?: string;
  className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  label, value, onChange, type = "text", step, prevValue, className = "" 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  if (type === 'date') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex justify-between items-end px-1">
          <label className="text-sm font-bold text-slate-600">{label}</label>
          {prevValue && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              前回: {prevValue}
            </span>
          )}
        </div>
        {/* Use Wheel Picker for Dates */}
        <DateWheelPicker 
            value={value} 
            onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex justify-between items-end px-1">
        <label className="text-sm font-bold text-slate-600">{label}</label>
        {prevValue && (
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            前回: {prevValue}
          </span>
        )}
      </div>
      <div className="relative flex gap-2">
        <input
          ref={inputRef}
          type={type}
          step={step}
          // スマホで数値キーボードを表示させる設定
          inputMode={type === 'number' ? 'decimal' : undefined}
          enterKeyHint="done"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onWheel={(e) => type === 'number' && (e.target as HTMLElement).blur()}
          className={`w-full h-12 rounded-lg border border-slate-200 bg-white text-lg text-slate-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-slate-300 px-4`}
        />
      </div>
    </div>
  );
};

interface ToggleProps {
  label: string;
  value: string;
  onChange: (val: any) => void;
  options?: string[];
}

export const Toggle: React.FC<ToggleProps> = ({ 
  label, value, onChange, options = ['ON', 'OFF'] 
}) => {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
      <span className="font-bold text-slate-700">{label}</span>
      <div className="flex bg-slate-100 p-1 rounded-lg">
        {options.map((opt) => {
          const isActive = value === opt;
          let activeClass = 'bg-blue-600 text-white shadow-sm';
          
          // Red/Alert Colors (Active/Warning)
          if (['ON', '良', '異常', 'あり'].includes(opt)) {
            activeClass = 'bg-rose-500 text-white shadow-sm';
          }
          // Green/Safe Colors (Inactive/Normal)
          if (['OFF', '不可', '正常', 'なし'].includes(opt)) {
            activeClass = 'bg-emerald-500 text-white shadow-sm';
          }

          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                isActive ? activeClass : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface SwitchRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({ label, checked, onChange }) => {
  return (
    <div className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0">
      <span className="font-bold text-slate-700 text-base">{label}</span>
      <button 
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
};

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = "" }) => (
  <div className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {title && (
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center border-l-4 border-blue-600 pl-3 -ml-5">
        {title}
      </h3>
    )}
    {children}
  </div>
);