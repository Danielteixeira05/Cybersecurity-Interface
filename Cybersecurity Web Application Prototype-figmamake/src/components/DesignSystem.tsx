import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X, Search, Upload } from 'lucide-react';

// ── Botões ────────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-md transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    outline: 'border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-700 bg-white',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ── Badges de Estado ──────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const badgeColors: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700 border border-green-200',
  warning: 'bg-amber-100 text-amber-700 border border-amber-200',
  danger: 'bg-red-100 text-red-700 border border-red-200',
  info: 'bg-blue-100 text-blue-700 border border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
  purple: 'bg-purple-100 text-purple-700 border border-purple-200',
};

export function Badge({ variant = 'neutral', children, className = '' }: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return (
    <span className={`badge ${badgeColors[variant]} ${className}`}>{children}</span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', padding = true }: { children: ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 font-display">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Campos de Formulário ──────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>}
      <input
        className={`bg-white border ${error ? 'border-red-400' : 'border-slate-300'} rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-base ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, children, className = '', ...props }: { label?: string; children: ReactNode; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>}
      <select
        className={`bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 transition-base ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, className = '', ...props }: { label?: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>}
      <textarea
        className={`bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 resize-none transition-base ${className}`}
        rows={4}
        {...props}
      />
    </div>
  );
}

// ── Alertas ───────────────────────────────────────────────────────────────────
const alertIcons = { success: CheckCircle, warning: AlertTriangle, danger: AlertCircle, info: Info };
const alertStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function Alert({ type = 'info', title, message, onClose, className = '' }: { type?: 'success' | 'warning' | 'danger' | 'info'; title?: string; message: string; onClose?: () => void; className?: string }) {
  const Icon = alertIcons[type];
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-md border ${alertStyles[type]} ${className}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p className="opacity-90">{message}</p>
      </div>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={14} /></button>}
    </div>
  );
}

// ── Tabela ────────────────────────────────────────────────────────────────────
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide font-mono">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      className={`border-b border-slate-100 table-row-hover ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Td({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <td className={`py-2.5 px-3 text-slate-700 ${mono ? 'font-mono text-xs text-slate-500' : ''}`}>
      {children}
    </td>
  );
}

// ── Separadores (Tabs) ────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-0 border-b border-slate-200 mb-5 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-base border-b-2 -mb-px whitespace-nowrap ${
            active === t.id
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
export function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-mono">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:text-blue-600 transition-base">{item.label}</button>
          ) : (
            <span className="text-slate-600">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ── Paginação ─────────────────────────────────────────────────────────────────
export function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / perPage);
  return (
    <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
      <span>A mostrar {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} de {total}</span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Ant.</Button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-7 h-7 rounded text-xs font-mono ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            {p}
          </button>
        ))}
        <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Próx. →</Button>
      </div>
    </div>
  );
}

// ── Pesquisa ──────────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Pesquisar...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white border border-slate-300 rounded-md pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 w-full focus:border-blue-500 transition-base"
      />
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white border border-slate-200 rounded-xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800 font-display">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-base"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Área de Carregamento de Ficheiros ─────────────────────────────────────────
export function FileUploadArea({ label = 'Arraste ficheiros aqui ou clique para carregar', accept, hint }: { label?: string; accept?: string; hint?: string }) {
  return (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-base cursor-pointer group">
      <Upload size={24} className="mx-auto mb-3 text-slate-400 group-hover:text-blue-500 transition-base" />
      <p className="text-sm text-slate-500">{label}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      <input type="file" accept={accept} className="hidden" />
    </div>
  );
}

// ── Estado de Carregamento ────────────────────────────────────────────────────
export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

// ── Estado Vazio ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={20} className="text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Cartão de Estatística ─────────────────────────────────────────────────────
export function StatCard({ label, value, delta, deltaLabel, icon: Icon, color = 'blue' }: {
  label: string; value: string | number; delta?: string; deltaLabel?: string;
  icon?: React.ElementType; color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-mono mb-2">{label}</p>
          <p className="text-2xl font-bold text-slate-900 font-display">{value}</p>
          {delta && (
            <p className="text-xs text-slate-400 mt-1">
              <span className={delta.startsWith('+') ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{delta}</span>
              {deltaLabel && <span className="ml-1">{deltaLabel}</span>}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  );
}
