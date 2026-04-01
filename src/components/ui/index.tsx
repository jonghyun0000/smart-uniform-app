'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, X, Check, AlertCircle, Loader2 } from 'lucide-react';

// ── 버튼 ──────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary', size = 'md', loading, fullWidth, children, className, disabled, ...props
}: ButtonProps) {
  const base = 'btn-press inline-flex items-center justify-center font-semibold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  const variants = {
    primary: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
    secondary: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = {
    sm: 'h-9 px-4 text-sm gap-1.5',
    md: 'h-12 px-5 text-base gap-2',
    lg: 'h-14 px-6 text-lg gap-2',
    xl: 'h-16 px-6 text-xl gap-3',
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// ── 입력 ──────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <input
        className={cn(
          'h-14 px-4 rounded-2xl border-2 text-base bg-white outline-none transition-all',
          'focus:border-rose-500 focus:ring-4 focus:ring-rose-100',
          error ? 'border-red-400 bg-red-50' : 'border-gray-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── 셀렉트 ──────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <select
        className={cn(
          'h-14 px-4 rounded-2xl border-2 text-base bg-white outline-none transition-all appearance-none',
          'focus:border-rose-500 focus:ring-4 focus:ring-rose-100',
          error ? 'border-red-400' : 'border-gray-200',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

// ── 탑바 ──────────────────────────────────────
interface TopBarProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function TopBar({ title, onBack, rightElement }: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
      {onBack ? (
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
      ) : <div className="w-10" />}
      <h1 className="text-base font-bold text-gray-900">{title}</h1>
      {rightElement ?? <div className="w-10" />}
    </div>
  );
}

// ── 모달 ──────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
          <button onClick={onClose} className="ml-auto w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── 스텝 인디케이터 ──────────────────────────────────────
interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center px-4 py-3 bg-white border-b border-gray-100">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              i < current ? 'bg-rose-600 text-white' :
              i === current ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400' :
              'bg-gray-100 text-gray-400'
            )}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn('text-[10px] mt-1 font-medium', i === current ? 'text-rose-600' : 'text-gray-400')}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('flex-1 h-0.5 mx-1 mb-4', i < current ? 'bg-rose-400' : 'bg-gray-200')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── 수량 선택 ──────────────────────────────────────
interface QuantityPickerProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

export function QuantityPicker({ value, min = 1, max = 99, onChange }: QuantityPickerProps) {
  return (
    <div className="flex items-center gap-0 border-2 border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-11 h-11 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        disabled={value <= min}
      >−</button>
      <span className="w-12 text-center font-bold text-gray-900 text-lg">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-11 h-11 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        disabled={value >= max}
      >+</button>
    </div>
  );
}

// ── 빈 상태 ──────────────────────────────────────
export function EmptyState({ icon, title, desc }: { icon?: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <p className="text-lg font-bold text-gray-400">{title}</p>
      {desc && <p className="text-sm text-gray-300 mt-1">{desc}</p>}
    </div>
  );
}

// ── 상태 뱃지 ──────────────────────────────────────
export function StatusBadge({ status, colorClass }: { status: string; colorClass: string }) {
  return (
    <span className={cn('status-chip', colorClass)}>{status}</span>
  );
}
