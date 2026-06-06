import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';

export interface InlineEditProps {
  value: string | number;
  type: 'text' | 'number' | 'currency' | 'date' | 'select';
  options?: { label: string; value: string }[];
  onSave: (newValue: string | number) => Promise<void>;
  onCancel?: () => void;
  validate?: (value: string) => string | null;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  type,
  options = [],
  onSave,
  onCancel,
  validate,
  placeholder,
  editable = true,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'number' || type === 'currency') {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, type]);

  const displayValue = (): string => {
    if (value === undefined || value === null || value === '') return placeholder || '-';
    if (type === 'currency') return formatCurrency(Number(value));
    return String(value);
  };

  const handleStartEdit = () => {
    if (!editable) return;
    setEditValue(type === 'currency' ? String(value || '') : String(value ?? ''));
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const val = editValue.trim();
    if (val === String(value ?? '')) {
      setIsEditing(false);
      return;
    }

    if (validate) {
      const err = validate(val);
      if (err) {
        setError(err);
        return;
      }
    }

    let finalValue: string | number = val;
    if (type === 'number' || type === 'currency') {
      const num = Number(val);
      if (isNaN(num)) {
        setError('请输入有效数字');
        return;
      }
      finalValue = num;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(finalValue);
      setJustSaved(true);
      setIsEditing(false);
      setTimeout(() => setJustSaved(false), 1500);
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ''));
    setError(null);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group relative flex items-center gap-1 min-w-[40px] px-1 py-0.5 rounded',
          editable && 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800',
          justSaved && 'bg-emerald-50 dark:bg-emerald-900/20',
          className
        )}
        onClick={handleStartEdit}
        title={editable ? '点击编辑' : undefined}
      >
        <span className={cn(
          'text-sm',
          justSaved ? 'text-emerald-600' : 'text-neutral-900 dark:text-white'
        )}>
          {displayValue()}
        </span>
        {editable && (
          <Pencil className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </div>
    );
  }

  const commonInputClasses = cn(
    'w-full text-sm px-2 py-0.5 rounded border bg-white dark:bg-neutral-800',
    error
      ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
      : 'border-brand/50 focus:border-brand dark:border-brand/50',
    'focus:outline-none focus:ring-2 focus:ring-brand/20',
    'text-neutral-900 dark:text-white'
  );

  return (
    <div className="relative inline-flex items-center gap-1 min-w-[60px]" onClick={e => e.stopPropagation()}>
      {type === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={commonInputClasses}
          disabled={saving}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <div className="relative">
          {type === 'currency' && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">¥</span>
          )}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type === 'number' || type === 'currency' ? 'number' : type === 'date' ? 'date' : 'text'}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setError(null);
            }}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              commonInputClasses,
              type === 'currency' && 'pl-5',
              type === 'number' || type === 'currency' ? 'w-[100px]' : type === 'date' ? 'w-[140px]' : 'min-w-[120px]'
            )}
            disabled={saving}
            step={type === 'number' || type === 'currency' ? 'any' : undefined}
            min={type === 'number' || type === 'currency' ? 0 : undefined}
          />
        </div>
      )}

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
          title="保存"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
          title="取消"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="absolute left-0 -bottom-5 text-xs text-red-500 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

export default InlineEdit;
