import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-10 px-3.5 pr-10 bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 rounded-xl text-sm text-neutral-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 dark:focus:border-brand/50 transition-all duration-200 disabled:bg-neutral-50 dark:disabled:bg-neutral-800/30 disabled:text-neutral-400 backdrop-blur-sm',
              error && 'border-red-300 dark:border-red-500/50',
              className,
            )}
            aria-invalid={!!error}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium" role="alert">{error}</p>}
        {helperText && !error && <p className="text-xs text-neutral-400">{helperText}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
