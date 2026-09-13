import React, { useState } from 'react';
import { useProjectSchedule } from '../../hooks/useProjectSchedule';
import { useMobileView } from '../../context/MobileViewContext';
import { DisciplineBadge } from '../common/DisciplineBadge';
import { StatusBadge } from '../common/StatusBadge';
import { DisciplineType } from '../../types/nexus';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Flame,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
  Clock,
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
      <div className="flex items-center justify-center h-full p-8 text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        Loading L5/L6 Schedule Baseline...
      </div>
    );
  }

  return (
    <div id="schedule-tracking-screen" className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] sm:text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                Work Breakdown Structure (L5/L6)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              Planned vs. Verified Actuals
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs font-mono bg-slate-800 text-slate-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border border-slate-700 shrink-0">
            {project?.baselineVersion}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 max-w-7xl mx-auto w-full space-y-3 sm:space-y-4 flex-1">
        {/* KPI Metrics Strip */}
        <div className={`grid gap-2.5 ${isMobileView ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total L5/L6 Activities
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 font-mono">
              {scheduleStats.total}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {scheduleStats.completed} verified completed
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Overall Progress
            </span>
            <div className="text-lg sm:text-xl font-bold text-blue-600 mt-0.5 font-mono">
              {project?.overallProgressPct}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${project?.overallProgressPct}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-500 shrink-0" />
              Critical Path Tasks
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 font-mono">
              {scheduleStats.criticalPathCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Zero float tolerance</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              Delayed / Halted
            </span>
            <div className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5 font-mono">
              {scheduleStats.delayedCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Avg variance: +{scheduleStats.averageVarianceDays}d
            </div>
          </div>
        </div>

        {/* Filter, Search, and View Mode Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5">
          {/* Top row: Search input & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search WBS, activity, tag..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              />
            </div>

            {/* Card vs Table toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Discipline Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
            {disciplines.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDiscipline(d)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                  selectedDiscipline === d
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d === 'ALL' ? 'All Disciplines' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Card View (Mobile-First Default) */}
        {viewMode === 'cards' ? (
          <div className="space-y-2.5">
            {filteredActivities.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                No L5/L6 activities found matching current search.
              </div>
            ) : (
              filteredActivities.map((act) => {
                const isDelayed = act.varianceDays > 0;
                return (
                  <div
                    key={act.id}
                    id={`schedule-card-${act.id}`}
                    className={`bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5 transition-all ${
                      act.isCriticalPath ? 'border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                    {/* Header Row: WBS Code, Critical Path, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs border border-blue-200">
                          {act.wbsCode}
                        </span>
                        {act.isCriticalPath && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-rose-600" /> CP
                          </span>
                        )}
                        <DisciplineBadge discipline={act.discipline} />
                      </div>
                      <StatusBadge status={act.status} />
                    </div>

                    {/* Activity Name */}
                    <div className="text-xs font-bold text-slate-900">
                      {act.name}
                    </div>

                    {/* Location & Tag */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{act.location}</span>
                      </div>
                      {act.equipmentTag && (
                        <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          Tag: {act.equipmentTag}
                        </span>
                      )}
                    </div>

                    {/* Planned vs Actual Dates Box */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans uppercase">
                          Planned Window
                        </span>
                        <span className="text-slate-700">
                          {act.plannedStart.slice(5)} → {act.plannedEnd.slice(5)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-sans">
                          ({act.baselineDurationDays}d duration)
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans uppercase">
                          Verified Actual
                        </span>
                        {act.actualStart ? (
                          <span className={act.actualEnd ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'}>
                            {act.actualStart.slice(5)} {act.actualEnd ? `→ ${act.actualEnd.slice(5)}` : '(Active)'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not started</span>
                        )}
                        <div className="mt-0.5">
                          {isDelayed ? (
                            <span className="text-rose-700 font-bold bg-rose-50 px-1 py-0.2 rounded text-[10px] border border-rose-200">
                              +{act.varianceDays}d delay
                            </span>
                          ) : act.status === 'COMPLETED' ? (
                            <span className="text-emerald-700 font-bold text-[10px]">
                              On Time
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">0d float</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="font-semibold text-slate-800">
                          Progress: {act.progressPct}%
                        </span>
                        {act.plannedQuantity && (
                          <span className="text-[10px] text-slate-500">
                            {act.installedQuantity || 0}/{act.plannedQuantity} {act.unitOfMeasure}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            act.progressPct === 100
                              ? 'bg-emerald-500'
                              : isDelayed
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
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
          /* Table View (with horizontal scroll to prevent squishing) */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">WBS / Activity</th>
                    <th className="py-2.5 px-3">Discipline</th>
                    <th className="py-2.5 px-3">Location & Tag</th>
                    <th className="py-2.5 px-3">Planned</th>
                    <th className="py-2.5 px-3">Verified Actual</th>
                    <th className="py-2.5 px-3">Variance</th>
                    <th className="py-2.5 px-3">Progress</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No L5/L6 activities found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act) => {
                      const isDelayed = act.varianceDays > 0;
                      return (
                        <tr
                          key={act.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            act.isCriticalPath ? 'border-l-4 border-l-rose-500' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                                {act.wbsCode}
                              </span>
                              {act.isCriticalPath && (
                                <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1 rounded flex items-center">
                                  CP
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-slate-900 mt-0.5 max-w-xs truncate">
                              {act.name}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <DisciplineBadge discipline={act.discipline} />
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800 truncate max-w-[120px]">
                              {act.location}
                            </div>
                            {act.equipmentTag && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Tag: {act.equipmentTag}
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[10px]">
                            <div>{act.plannedStart}</div>
                            <div className="text-slate-400">to {act.plannedEnd}</div>
                          </td>

                          <td className="py-2.5 px-3 font-mono text-[10px]">
                            {act.actualStart ? (
                              <div>
                                <div className="text-slate-900 font-semibold">{act.actualStart}</div>
                                {act.actualEnd ? (
                                  <div className="text-emerald-700 font-semibold">
                                    End: {act.actualEnd}
                                  </div>
                                ) : (
                                  <div className="text-amber-600">Active...</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not started</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-mono">
                            {isDelayed ? (
                              <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px] border border-rose-200">
                                +{act.varianceDays}d
                              </span>
                            ) : act.status === 'COMPLETED' ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                                On Time
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">0d</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 min-w-[100px]">
                            <div className="text-[10px] font-mono mb-1 font-semibold text-slate-800">
                              {act.progressPct}%
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  act.progressPct === 100
                                    ? 'bg-emerald-500'
                                    : isDelayed
                                    ? 'bg-amber-500'
                                    : 'bg-blue-600'
                                }`}
                                style={{ width: `${act.progressPct}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right">
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
