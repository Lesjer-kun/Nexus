import React, { useState } from 'react';
import { useProjectSchedule } from '../../hooks/useProjectSchedule';
import { useMobileView } from '../../context/MobileViewContext';
import { DisciplineBadge } from '../common/DisciplineBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ScreenHeader } from '../layout/ScreenHeader';
import { DisciplineType } from '../../types/nexus';
import {
  AlertTriangle,
  Calendar,
  Filter,
  Flame,
  LayoutGrid,
  MapPin,
  Search,
  Table as TableIcon,
} from 'lucide-react';

export const ScheduleTrackingScreen: React.FC = () => {
  const {
    project,
    selectedDiscipline,
    setSelectedDiscipline,
    searchQuery,
    setSearchQuery,
    filteredActivities,
    scheduleStats,
    isLoading,
  } = useProjectSchedule();

  const { isMobileView } = useMobileView();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const disciplines: Array<DisciplineType | 'ALL'> = [
    'ALL',
    'Piping',
    'Civil',
    'Mechanical / Rotating',
    'Electrical',
    'Instrumentation',
    'HSE',
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted">
        <div className="mr-2 h-6 w-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
        Loading L5/L6 baseline…
      </div>
    );
  }

  return (
    <div id="schedule-tracking-screen" className="nexus-scroll flex h-full flex-col overflow-y-auto bg-paper">
      <ScreenHeader
        icon={Calendar}
        eyebrow="Work breakdown (L5/L6)"
        title="Planned vs verified actuals"
        trailing={
          <span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-[10px] text-muted sm:text-xs">
            {project?.baselineVersion}
          </span>
        }
      />

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div className={`grid gap-2.5 ${isMobileView ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {[
            {
              label: 'Activities',
              value: scheduleStats.total,
              hint: `${scheduleStats.completed} completed`,
            },
            {
              label: 'Progress',
              value: `${project?.overallProgressPct}%`,
              hint: null,
              bar: project?.overallProgressPct,
            },
            {
              label: 'Critical path',
              value: scheduleStats.criticalPathCount,
              hint: 'Zero float',
              icon: <Flame className="h-3 w-3 text-rose-500" />,
            },
            {
              label: 'Delayed / halted',
              value: scheduleStats.delayedCount,
              hint: `Avg +${scheduleStats.averageVarianceDays}d`,
              icon: <AlertTriangle className="h-3 w-3 text-amber-500" />,
              accent: 'text-amber-800',
            },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-line bg-panel p-3">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {kpi.icon}
                {kpi.label}
              </span>
              <div className={`mt-0.5 font-mono text-xl font-bold ${kpi.accent || 'text-ink'}`}>{kpi.value}</div>
              {kpi.bar != null && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-ember" style={{ width: `${kpi.bar}%` }} />
                </div>
              )}
              {kpi.hint && <div className="mt-0.5 text-[10px] text-muted">{kpi.hint}</div>}
            </div>
          ))}
        </div>

        <div className="space-y-2.5 rounded-xl border border-line bg-panel p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search WBS, activity, tag…"
                className="w-full rounded-lg border border-line bg-white py-1.5 pr-3 pl-8 text-xs text-ink focus:border-ember focus:ring-2 focus:ring-ember/25 focus:outline-none"
              />
            </div>
            <div className="flex shrink-0 items-center rounded-lg border border-line bg-paper p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Card View"
                className={`rounded-md p-1.5 ${viewMode === 'cards' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`rounded-md p-1.5 ${viewMode === 'table' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
              >
                <TableIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter className="ml-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
            {disciplines.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDiscipline(d)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedDiscipline === d ? 'bg-ink text-paper' : 'bg-paper text-ink-2 hover:bg-line'
                }`}
              >
                {d === 'ALL' ? 'All disciplines' : d}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div className="space-y-2.5">
            {filteredActivities.length === 0 ? (
              <div className="rounded-xl border border-line bg-panel p-8 text-center text-xs text-muted">
                No L5/L6 activities match this search.
              </div>
            ) : (
              filteredActivities.map((act) => {
                const isDelayed = act.varianceDays > 0;
                return (
                  <div
                    key={act.id}
                    id={`schedule-card-${act.id}`}
                    className={`space-y-2.5 rounded-xl border border-line bg-panel p-3 ${
                      act.isCriticalPath ? 'border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded border border-ember/20 bg-orange-50 px-1.5 py-0.5 font-mono text-xs font-bold text-ember-dark">
                          {act.wbsCode}
                        </span>
                        {act.isCriticalPath && (
                          <span className="flex items-center gap-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                            <Flame className="h-3 w-3" /> CP
                          </span>
                        )}
                        <DisciplineBadge discipline={act.discipline} />
                      </div>
                      <StatusBadge status={act.status} />
                    </div>
                    <div className="text-xs font-bold text-ink">{act.name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {act.location}
                      </div>
                      {act.equipmentTag && (
                        <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px]">Tag: {act.equipmentTag}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-paper p-2 font-mono text-[11px]">
                      <div>
                        <span className="block font-sans text-[10px] uppercase text-muted">Planned</span>
                        <span className="text-ink-2">
                          {act.plannedStart.slice(5)} → {act.plannedEnd.slice(5)}
                        </span>
                        <div className="font-sans text-[10px] text-muted">({act.baselineDurationDays}d)</div>
                      </div>
                      <div>
                        <span className="block font-sans text-[10px] uppercase text-muted">Verified</span>
                        {act.actualStart ? (
                          <span className={act.actualEnd ? 'font-bold text-emerald-800' : 'font-bold text-amber-800'}>
                            {act.actualStart.slice(5)} {act.actualEnd ? `→ ${act.actualEnd.slice(5)}` : '(active)'}
                          </span>
                        ) : (
                          <span className="text-muted italic">Not started</span>
                        )}
                        <div className="mt-0.5">
                          {isDelayed ? (
                            <span className="rounded border border-rose-200 bg-rose-50 px-1 text-[10px] font-bold text-rose-800">
                              +{act.varianceDays}d delay
                            </span>
                          ) : act.status === 'COMPLETED' ? (
                            <span className="text-[10px] font-bold text-emerald-800">On time</span>
                          ) : (
                            <span className="text-[10px] text-muted">0d float</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
                        <span className="font-semibold text-ink">{act.progressPct}%</span>
                        {act.plannedQuantity && (
                          <span className="text-[10px] text-muted">
                            {act.installedQuantity || 0}/{act.plannedQuantity} {act.unitOfMeasure}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full rounded-full ${
                            act.progressPct === 100 ? 'bg-emerald-600' : isDelayed ? 'bg-amber-500' : 'bg-ember'
                          }`}
                          style={{ width: `${act.progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-panel">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-paper text-[10px] font-semibold tracking-wider text-muted uppercase">
                    <th className="px-3 py-2.5">WBS / Activity</th>
                    <th className="px-3 py-2.5">Discipline</th>
                    <th className="px-3 py-2.5">Location & tag</th>
                    <th className="px-3 py-2.5">Planned</th>
                    <th className="px-3 py-2.5">Verified</th>
                    <th className="px-3 py-2.5">Variance</th>
                    <th className="px-3 py-2.5">Progress</th>
                    <th className="px-3 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink-2">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted">
                        No L5/L6 activities match this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act) => {
                      const isDelayed = act.varianceDays > 0;
                      return (
                        <tr
                          key={act.id}
                          className={`hover:bg-paper/80 ${act.isCriticalPath ? 'border-l-4 border-l-rose-500' : ''}`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <span className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-ember-dark">
                                {act.wbsCode}
                              </span>
                              {act.isCriticalPath && (
                                <span className="rounded bg-rose-100 px-1 text-[9px] font-bold text-rose-800">CP</span>
                              )}
                            </div>
                            <div className="mt-0.5 max-w-xs truncate font-semibold text-ink">{act.name}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <DisciplineBadge discipline={act.discipline} />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="max-w-[120px] truncate font-medium text-ink">{act.location}</div>
                            {act.equipmentTag && (
                              <span className="font-mono text-[10px] text-muted">Tag: {act.equipmentTag}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[10px] text-muted">
                            <div>{act.plannedStart}</div>
                            <div>to {act.plannedEnd}</div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[10px]">
                            {act.actualStart ? (
                              <div>
                                <div className="font-semibold text-ink">{act.actualStart}</div>
                                {act.actualEnd ? (
                                  <div className="font-semibold text-emerald-800">End: {act.actualEnd}</div>
                                ) : (
                                  <div className="text-amber-800">Active…</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted italic">Not started</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            {isDelayed ? (
                              <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                                +{act.varianceDays}d
                              </span>
                            ) : act.status === 'COMPLETED' ? (
                              <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800">
                                On time
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted">0d</span>
                            )}
                          </td>
                          <td className="min-w-[100px] px-3 py-2.5">
                            <div className="mb-1 font-mono text-[10px] font-semibold text-ink">{act.progressPct}%</div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-line">
                              <div
                                className={`h-full rounded-full ${
                                  act.progressPct === 100 ? 'bg-emerald-600' : isDelayed ? 'bg-amber-500' : 'bg-ember'
                                }`}
                                style={{ width: `${act.progressPct}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <StatusBadge status={act.status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
