'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { Check, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Shared helpers                                                            */
/* -------------------------------------------------------------------------- */

export interface ComboOption {
  value: string;
  label: string;
}

/** Custom (not in master data) values are stored as `new:<label>` so they can
 *  never be confused with numeric master-data ids. */
export const NEW_PREFIX = 'new:';
export const isNewValue = (v: string) => v.startsWith(NEW_PREFIX);
export const stripNew = (v: string) => (isNewValue(v) ? v.slice(NEW_PREFIX.length) : v);

/** Splits a mixed list of values into numeric master-data ids and custom names. */
export function splitIdsAndNames(values: string[] | undefined) {
  const ids: number[] = [];
  const names: string[] = [];
  for (const v of values || []) {
    if (isNewValue(v)) {
      const name = stripNew(v).trim();
      if (name && !names.some((n) => n.toLowerCase() === name.toLowerCase())) names.push(name);
    } else {
      const n = Number(v);
      if (Number.isInteger(n) && n > 0 && !ids.includes(n)) ids.push(n);
    }
  }
  return { ids, names };
}

const FOCUSABLE_SELECTOR = [
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'button[role="combobox"]:not([disabled])',
  'button[role="checkbox"]:not([disabled])',
].join(',');

/** Moves focus to the next field of the same form, in DOM (visual) order, so no
 *  field in the middle is ever skipped. */
export function focusNextField(from: HTMLElement) {
  const form = from.closest('form');
  if (!form) return;
  const fields = Array.from(form.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === from
  );
  const index = fields.indexOf(from);
  const next = index >= 0 ? fields[index + 1] : undefined;
  if (next) {
    next.focus();
    if (next instanceof HTMLInputElement && next.type === 'text') next.select?.();
  }
}

/** Put on the <form onKeyDown>. Enter inside a text/number input moves to the
 *  next field instead of submitting the form. Textareas (new line) and buttons
 *  (activate) keep their normal behaviour. */
export function handleEnterAsTab(e: ReactKeyboardEvent<HTMLFormElement>) {
  if (e.key !== 'Enter' || e.defaultPrevented || e.nativeEvent.isComposing) return;
  const target = e.target as HTMLElement;
  if (target.tagName !== 'INPUT') return;
  const type = (target as HTMLInputElement).type;
  if (['submit', 'button', 'checkbox', 'radio', 'file'].includes(type)) return;
  e.preventDefault();
  focusNextField(target);
}

/* -------------------------------------------------------------------------- */
/*  Styling                                                                   */
/* -------------------------------------------------------------------------- */

type Accent = 'blue' | 'indigo';

const ACCENT: Record<Accent, { chip: string; chipX: string; row: string; box: string; custom: string; tick: string }> = {
  blue: {
    chip: 'bg-blue-100 text-blue-800',
    chipX: 'hover:bg-blue-300/50',
    row: 'bg-blue-50 text-blue-700',
    box: 'bg-blue-50/50 border-blue-100',
    custom: 'text-blue-600 bg-blue-50/60',
    tick: 'bg-blue-600 border-blue-600',
  },
  indigo: {
    chip: 'bg-indigo-50 text-indigo-700',
    chipX: 'hover:bg-indigo-200/50',
    row: 'bg-indigo-50/70 text-indigo-700',
    box: 'bg-slate-50/60 border-slate-100',
    custom: 'text-indigo-600 bg-indigo-50/60',
    tick: 'bg-indigo-600 border-indigo-600',
  },
};

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 h-10 pr-10 ' +
  'focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm ' +
  'disabled:opacity-50 disabled:bg-slate-100/50 disabled:cursor-not-allowed';

/* -------------------------------------------------------------------------- */
/*  Core (shared keyboard / dropdown behaviour)                               */
/* -------------------------------------------------------------------------- */

interface Row {
  key: string;
  value: string;
  label: string;
  selected?: boolean;
  custom?: boolean;
}

interface CoreProps {
  multiple: boolean;
  rows: Row[];
  moreCount?: number;
  inputValue: string;
  /** True when the user has typed a filter, so the best match is pre-highlighted. */
  autoHighlight: boolean;
  onInputChange: (text: string) => void;
  onPick: (row: Row) => void;
  chips?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  showSearchIcon?: boolean;
  accent: Accent;
  id?: string;
  emptyText?: string;
  className?: string;
  onBlurCommit?: () => void;
  onBackspaceEmpty?: () => void;
}

function ComboboxCore({
  multiple,
  rows,
  moreCount = 0,
  inputValue,
  autoHighlight,
  onInputChange,
  onPick,
  chips,
  placeholder,
  disabled,
  loading,
  showSearchIcon,
  accent,
  id,
  emptyText = 'No matches found',
  className,
  onBlurCommit,
  onBackspaceEmpty,
}: CoreProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const a = ACCENT[accent];

  // Typing highlights the best match so Enter picks it; otherwise nothing is
  // highlighted and Enter simply moves on to the next field.
  useEffect(() => {
    setActive(autoHighlight ? 0 : -1);
  }, [inputValue, autoHighlight]);

  const activeIndex = rows.length === 0 ? -1 : Math.min(active, rows.length - 1);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const pick = (row: Row) => {
    onPick(row);
    if (multiple) {
      setActive(-1);
      inputRef.current?.focus();
    } else {
      setOpen(false);
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (rows.length) setActive(activeIndex + 1 >= rows.length ? 0 : activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (rows.length) setActive(activeIndex <= 0 ? rows.length - 1 : activeIndex - 1);
        break;
      case 'Enter': {
        // Always handled here so the form is never submitted by Enter.
        e.preventDefault();
        const row = open && activeIndex >= 0 ? rows[activeIndex] : undefined;
        if (row) {
          pick(row);
          if (!multiple) focusNextField(e.currentTarget);
        } else {
          setOpen(false);
          focusNextField(e.currentTarget);
        }
        break;
      }
      case 'Escape':
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
        break;
      case 'Backspace':
        if (multiple && !inputValue && onBackspaceEmpty) onBackspaceEmpty();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn('space-y-1.5', className)}
      onBlur={(e) => {
        if (rootRef.current && !rootRef.current.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          onBlurCommit?.();
        }
      }}
    >
      {chips}
      <div className="relative">
        {showSearchIcon && (
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            onInputChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(INPUT_CLASS, showSearchIcon ? 'pl-10' : 'pl-3.5')}
        />
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-transform',
            open && 'rotate-180'
          )}
        />

        {open && !disabled && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1"
            onMouseDown={(e) => e.preventDefault()}
          >
            {loading ? (
              <li className="flex items-center justify-center p-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </li>
            ) : rows.length === 0 ? (
              <li className="px-3.5 py-2.5 text-xs font-medium text-slate-400">{emptyText}</li>
            ) : (
              rows.map((row, index) => {
                const isActive = index === activeIndex;
                if (row.custom) {
                  return (
                    <li
                      key={row.key}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={false}
                      data-active={isActive}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => pick(row)}
                      className={cn(
                        'cursor-pointer px-3.5 py-2.5 text-xs font-bold border-t border-slate-100 flex items-center justify-between transition-colors',
                        a.custom,
                        isActive && 'ring-1 ring-inset ring-slate-200'
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Add &quot;{row.label}&quot;
                      </span>
                      <span className="bg-white/70 text-[10px] font-bold rounded-full px-2 py-0.5">Custom</span>
                    </li>
                  );
                }
                return (
                  <li
                    key={row.key}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={Boolean(row.selected)}
                    data-active={isActive}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick(row)}
                    className={cn(
                      'cursor-pointer px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 transition-colors',
                      row.selected ? a.row + ' font-bold' : 'text-slate-700',
                      isActive && !row.selected && 'bg-slate-50',
                      isActive && row.selected && 'brightness-95'
                    )}
                  >
                    <span className="truncate">{row.label}</span>
                    {multiple ? (
                      <span
                        className={cn(
                          'h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all',
                          row.selected ? a.tick + ' text-white' : 'border-slate-300 bg-white'
                        )}
                      >
                        {row.selected && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                    ) : (
                      row.selected && <Check className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </li>
                );
              })
            )}
            {!loading && moreCount > 0 && (
              <li className="px-3.5 py-2 text-[11px] font-semibold text-slate-400 border-t border-slate-100">
                +{moreCount} more — keep typing to narrow the list
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Multi-select (chips + searchable list, stays open while picking)          */
/* -------------------------------------------------------------------------- */

interface MultiProps {
  options: ComboOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Allow typing a value that is not in `options`. */
  allowCustom?: boolean;
  /** Turns typed text into the stored value (default: `new:<text>`). */
  createValue?: (label: string) => string;
  accent?: Accent;
  maxVisible?: number;
  /** Show nothing until the user types (useful for very large lists). */
  requireQuery?: boolean;
  disabled?: boolean;
  loading?: boolean;
  showSearchIcon?: boolean;
  id?: string;
  emptyText?: string;
  className?: string;
}

export function MultiSelectCombobox({
  options,
  value,
  onChange,
  placeholder,
  allowCustom = true,
  createValue = (label) => `${NEW_PREFIX}${label}`,
  accent = 'indigo',
  maxVisible = 100,
  requireQuery = false,
  disabled,
  loading,
  showSearchIcon,
  id,
  emptyText,
  className,
}: MultiProps) {
  const [query, setQuery] = useState('');
  const a = ACCENT[accent];

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? stripNew(v);

  const { rows, moreCount } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (requireQuery && !q) return { rows: [] as Row[], moreCount: 0 };

    const matches = options.filter((o) => !q || o.label.toLowerCase().includes(q));
    const shown = matches.slice(0, maxVisible);
    const list: Row[] = shown.map((o) => ({
      key: o.value,
      value: o.value,
      label: o.label,
      selected: value.includes(o.value),
    }));

    const exists =
      options.some((o) => o.label.toLowerCase() === q) ||
      value.some((v) => (options.find((o) => o.value === v)?.label ?? stripNew(v)).toLowerCase() === q);
    if (allowCustom && q && !exists) {
      const text = query.trim();
      list.push({ key: '__custom__', value: createValue(text), label: text, custom: true });
    }
    return { rows: list, moreCount: Math.max(0, matches.length - shown.length) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, value, query, requireQuery, maxVisible, allowCustom]);

  const toggle = (row: Row) => {
    onChange(value.includes(row.value) ? value.filter((v) => v !== row.value) : [...value, row.value]);
    setQuery('');
  };

  const chips =
    value.length > 0 ? (
      <div className={cn('flex flex-wrap gap-1.5 p-2 border rounded-xl', a.box)}>
        {value.map((v) => (
          <span
            key={v}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full py-1 px-2.5 text-xs font-bold shadow-sm',
              a.chip
            )}
          >
            {labelOf(v)}
            {isNewValue(v) && <span className="text-[9px] font-extrabold uppercase opacity-60">new</span>}
            <button
              type="button"
              aria-label={`Remove ${labelOf(v)}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(value.filter((item) => item !== v))}
              className={cn('rounded-full p-0.5', a.chipX)}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    ) : null;

  return (
    <ComboboxCore
      multiple
      rows={rows}
      moreCount={moreCount}
      inputValue={query}
      autoHighlight={query.trim() !== ''}
      onInputChange={setQuery}
      onPick={toggle}
      chips={chips}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      showSearchIcon={showSearchIcon}
      accent={accent}
      id={id}
      className={className}
      emptyText={requireQuery && !query.trim() ? 'Type to search…' : emptyText}
      onBackspaceEmpty={() => value.length && onChange(value.slice(0, -1))}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Single value with suggestions (job title, state, city, locality)          */
/* -------------------------------------------------------------------------- */

interface SuggestProps {
  options: ComboOption[];
  /** Text shown in the input. */
  value: string;
  onValueChange: (text: string) => void;
  /** Called when a listed option is chosen. */
  onSelect: (option: ComboOption) => void;
  /** Called when the "Add …" row is chosen (defaults to just keeping the text). */
  onCustom?: (text: string) => void;
  allowCustom?: boolean;
  /** Label of the currently selected option, so reopening shows the full list. */
  selectedLabel?: string;
  /** Runs when focus leaves the control (after the list closed). */
  onBlurCommit?: () => void;
  placeholder?: string;
  accent?: Accent;
  maxVisible?: number;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  emptyText?: string;
  className?: string;
}

export function SuggestInput({
  options,
  value,
  onValueChange,
  onSelect,
  onCustom,
  allowCustom = true,
  selectedLabel,
  onBlurCommit,
  placeholder,
  accent = 'blue',
  maxVisible = 100,
  disabled,
  loading,
  id,
  emptyText,
  className,
}: SuggestProps) {
  const query = selectedLabel !== undefined && value === selectedLabel ? '' : value.trim();
  const q = query.toLowerCase();

  const { rows, moreCount } = useMemo(() => {
    const matches = options
      .filter((o) => !q || o.label.toLowerCase().includes(q))
      .sort((x, y) => Number(y.label.toLowerCase() === q) - Number(x.label.toLowerCase() === q));
    const shown = matches.slice(0, maxVisible);
    const list: Row[] = shown.map((o) => ({
      key: o.value,
      value: o.value,
      label: o.label,
      selected: selectedLabel !== undefined && o.label === selectedLabel,
    }));
    const exact = options.some((o) => o.label.toLowerCase() === q);
    if (allowCustom && q && !exact) {
      list.push({ key: '__custom__', value: query, label: query, custom: true });
    }
    return { rows: list, moreCount: Math.max(0, matches.length - shown.length) };
  }, [options, q, query, maxVisible, allowCustom, selectedLabel]);

  const handlePick = (row: Row) => {
    if (row.custom) {
      if (onCustom) onCustom(row.label);
      else onValueChange(row.label);
      return;
    }
    const option = options.find((o) => o.value === row.value);
    if (option) onSelect(option);
  };

  return (
    <ComboboxCore
      multiple={false}
      rows={rows}
      moreCount={moreCount}
      inputValue={value}
      autoHighlight={query !== ''}
      onInputChange={onValueChange}
      onPick={handlePick}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      accent={accent}
      id={id}
      className={className}
      emptyText={emptyText}
      onBlurCommit={onBlurCommit}
    />
  );
}