import { motion } from 'framer-motion';
import {
    Heart, Briefcase, BookOpen, DollarSign,
    Users, Star, Flag, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

/* ── categories ── */
export const CATEGORIES = [
    { value: 'health',        label: 'Health',   icon: Heart,      color: '#f43f5e', bg: 'from-rose-500/20 to-pink-500/10' },
    { value: 'career',        label: 'Career',   icon: Briefcase,  color: '#f59e0b', bg: 'from-amber-500/20 to-yellow-500/10' },
    { value: 'learning',      label: 'Learning', icon: BookOpen,   color: '#8b5cf6', bg: 'from-violet-500/20 to-purple-500/10' },
    { value: 'finance',       label: 'Finance',  icon: DollarSign, color: '#10b981', bg: 'from-emerald-500/20 to-green-500/10' },
    { value: 'relationships', label: 'Social',   icon: Users,      color: '#3b82f6', bg: 'from-blue-500/20 to-cyan-500/10' },
    { value: 'personal',      label: 'Personal', icon: Star,       color: '#6366f1', bg: 'from-indigo-500/20 to-violet-500/10' },
    { value: 'other',         label: 'Other',    icon: Flag,       color: '#71717a', bg: 'from-zinc-500/20 to-zinc-600/10' },
];

export const getCat  = v => CATEGORIES.find(c => c.value === v) || CATEGORIES[5];
export const toInput = d => { try { return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; } };
export const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export function timeProg(createdAt, targetDate) {
    if (!targetDate) return null;
    const s = new Date(createdAt).getTime(), e = new Date(targetDate).getTime(), n = Date.now();
    if (e <= s) return null;
    return { pct: Math.min(100, Math.max(0, Math.round(((n - s) / (e - s)) * 100))), daysLeft: Math.ceil((e - n) / 864e5) };
}

/* ── tiny shared UI ── */
export function ProgressRing({ pct, color, size = 60, stroke = 5 }) {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .8s ease' }} />
        </svg>
    );
}

export function Bar({ pct, color }) {
    return (
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: color }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .8, ease: 'easeOut' }} />
        </div>
    );
}

export function TrackBadge({ t, a }) {
    const d = a - t;
    if (d >= 5)  return <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-500/30 rounded-full px-2 py-0.5"><TrendingUp  className="w-2.5 h-2.5" />Ahead</span>;
    if (d <= -10) return <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400   bg-rose-400/10   border border-rose-500/30   rounded-full px-2 py-0.5"><TrendingDown className="w-2.5 h-2.5" />Behind</span>;
    return               <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400  bg-amber-400/10  border border-amber-500/30  rounded-full px-2 py-0.5"><Minus        className="w-2.5 h-2.5" />On track</span>;
}
