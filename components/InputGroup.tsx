
import React from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => (
  <div className="group relative inline-block ml-2 align-middle">
    <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 w-64 rounded-md bg-slate-800 p-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
      {text}
      <div className="absolute top-full left-1/2 -mt-1 -ml-1 border-4 border-transparent border-t-slate-800" />
    </div>
  </div>
);

interface InputGroupProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  tooltip?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  unit = "€", 
  tooltip
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(',', '.');
    const numericValue = parseFloat(val);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    } else if (val === "") {
      onChange(0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative rounded-md shadow-sm">
        <input
          type="text"
          inputMode="decimal"
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={handleChange}
          onFocus={handleFocus}
          className="block w-full rounded-md border-slate-300 pl-3 pr-10 py-2 text-slate-900 bg-white ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-slate-500 sm:text-sm">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export const TextInputGroup: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  tooltip?: string;
}> = ({ label, value, onChange, placeholder, tooltip }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
      {label}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    <div className="relative rounded-md shadow-sm">
        <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-md border-slate-300 pl-3 pr-3 py-2 text-slate-900 bg-white ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
    </div>
  </div>
);

export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; tooltip?: string }> = ({ label, checked, onChange, tooltip }) => (
  <div className="flex items-center justify-between mb-4 py-2">
    <span className="text-sm font-medium text-slate-700 flex items-center">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
    </span>
    <button
      type="button"
      className={`${
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);

export const SelectGroup: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  tooltip?: string;
}> = ({ label, value, onChange, options, tooltip }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
            {label}
            {tooltip && <Tooltip text={tooltip} />}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-slate-900 bg-white ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);
