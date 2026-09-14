import { Calendar, CheckSquare, Mic, ShieldAlert, Sparkles, type LucideIcon } from 'lucide-react';

export type ActiveTabType = 'CAPTURE' | 'REVIEW' | 'SCHEDULE' | 'MEMORY' | 'AUDIT';

export const NAV_ITEMS: Array<{
  id: ActiveTabType;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  { id: 'CAPTURE', label: 'Capture', hint: 'Field report', icon: Mic },
  { id: 'REVIEW', label: 'Review', hint: 'Governance queue', icon: CheckSquare },
  { id: 'SCHEDULE', label: 'Schedule', hint: 'Planned vs actual', icon: Calendar },
  { id: 'MEMORY', label: 'Memory', hint: 'Verified history', icon: Sparkles },
  { id: 'AUDIT', label: 'Audit', hint: 'Immutable ledger', icon: ShieldAlert },
];
