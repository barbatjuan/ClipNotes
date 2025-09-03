import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CheckCircleIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, ChartBarIcon, HomeIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface SidebarProps {
  jobs: any[];
  onSelectJob: (jobId: string) => void;
  onSettings: () => void;
  onLogout: () => void;
  onNavigate: (section: 'dashboard' | 'history' | 'stats') => void;
  user: any;
  activeSection: string;
  activeJobId?: string;
}

export default function Sidebar({ jobs, onSelectJob, onSettings, onLogout, onNavigate, user, activeSection, activeJobId }: SidebarProps) {
  const [historyExpanded, setHistoryExpanded] = useState(true);

  // Keep history dropdown open when a job is selected (e.g., after navigation to /jobs/[id])
  useEffect(() => {
    if (activeJobId) {
      setHistoryExpanded(true);
    }
  }, [activeJobId]);

  // Group jobs by month for the recent list
  type Group = { key: string; label: string; items: any[] };
  const groupedByMonth: Group[] = useMemo(() => {
    if (!Array.isArray(jobs)) return [];
    const sorted = [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const map = new Map<string, Group>();
    for (const job of sorted) {
      const d = new Date(job.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // e.g., 2025-09
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      if (!map.has(key)) {
        map.set(key, { key, label, items: [] });
      }
      map.get(key)!.items.push(job);
    }
    return Array.from(map.values());
  }, [jobs]);

  // Track which month groups are open; open the most recent by default
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (groupedByMonth.length === 0) return;
    setOpenMonths(prev => {
      // Keep existing states, open the first group if not set
      const next = { ...prev };
      const firstKey = groupedByMonth[0].key;
      if (next[firstKey] === undefined) next[firstKey] = true;
      return next;
    });
  }, [groupedByMonth]);

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-80 h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 shadow-soft-2xl flex flex-col justify-between fixed left-0 top-0 z-30 border-r border-secondary-700/50">
      {/* Top: User info and navigation */}
      <div className="flex-1">
        {/* User Profile Section */}
        <div className="p-6 border-b border-secondary-700/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserCircleIcon className="h-12 w-12 text-primary-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-secondary-900"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{user?.email || 'Usuario'}</h3>
              <p className="text-secondary-400 text-xs">Plan Activo</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          <div className="text-xs font-semibold text-secondary-400 uppercase tracking-wider px-3 py-2">
            Navegación
          </div>
          
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              activeSection === 'dashboard'
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30 shadow-glow'
                : 'text-secondary-300 hover:text-white hover:bg-secondary-800/50'
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
            {activeSection === 'dashboard' && (
              <div className="ml-auto w-2 h-2 bg-primary-400 rounded-full"></div>
            )}
          </button>
          
          <button
            onClick={() => onNavigate('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              activeSection === 'stats'
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30 shadow-glow'
                : 'text-secondary-300 hover:text-white hover:bg-secondary-800/50'
            }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            <span className="font-medium">Estadísticas</span>
            {activeSection === 'stats' && (
              <div className="ml-auto w-2 h-2 bg-primary-400 rounded-full"></div>
            )}
          </button>
          
          <div>
            <button
              onClick={() => {
                setHistoryExpanded(!historyExpanded);
                if (!historyExpanded) onNavigate('history');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                activeSection === 'history'
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30 shadow-glow'
                  : 'text-secondary-300 hover:text-white hover:bg-secondary-800/50'
              }`}
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-medium">Historial</span>
              <div className="ml-auto flex items-center gap-2">
                {activeSection === 'history' && (
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                )}
                {historyExpanded ? 
                  <ChevronDownIcon className="h-4 w-4 transition-transform" /> : 
                  <ChevronRightIcon className="h-4 w-4 transition-transform" />
                }
              </div>
            </button>
            
            {historyExpanded && (
              <div className="mt-3 ml-4 mr-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                <div className="text-xs font-semibold text-secondary-400 uppercase tracking-wider px-3 py-2 mb-2">
                  Archivos Recientes
                </div>
                {jobs.length === 0 ? (
                  <div className="p-4 text-secondary-500 text-sm text-center bg-secondary-800/30 rounded-lg border border-secondary-700/30">
                    Sin archivos aún
                  </div>
                ) : (
                  <div className="space-y-1 mr-1">
                    {/* Group by month */}
                    {(() => {
                      const groups = groupedByMonth;
                      return groups.map(({ key, label, items }, idx) => (
                        <div key={key} className="mb-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleMonth(key); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-secondary-300 hover:text-white bg-secondary-800/30 hover:bg-secondary-700/40 rounded-lg border border-secondary-700/30"
                          >
                            <span className="capitalize">{label}</span>
                            <span className="text-secondary-500">{openMonths[key] ? '▾' : '▸'}</span>
                          </button>
                          {openMonths[key] && (
                            <ul className="mt-1 space-y-2">
                              {items.map(job => (
                                <li key={job.id}>
                                  <Link
                                    href={`/jobs/${job.id}`}
                                    prefetch
                                    className={`block rounded-lg px-3 py-3 transition-all duration-200 group border ${
                                      job.id === activeJobId
                                        ? 'bg-primary-600/20 border-primary-500/40 hover:bg-primary-600/25'
                                        : 'bg-secondary-800/30 border-secondary-700/30 hover:bg-secondary-700/50 hover:border-secondary-600/50'
                                    }`}
                                    onClick={(e) => { e.stopPropagation(); }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${
                                        job.status === 'completed' ? 'bg-success-400' : 
                                        job.status === 'failed' ? 'bg-danger-400' : 
                                        'bg-warning-400'
                                      }`} />
                                      <span className={`font-medium text-xs truncate max-w-[180px] ${job.id === activeJobId ? 'text-white' : 'text-secondary-200 group-hover:text-white'}`}>
                                        {job.title || 'Sin título'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-secondary-500 mt-1 truncate">
                                      {new Date(job.created_at).toLocaleDateString()}
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
      
      {/* Bottom: Settings and logout */}
      <div className="p-4 border-t border-secondary-700/30 space-y-2">
        <button
          onClick={onSettings}
          className="w-full flex items-center gap-3 text-secondary-300 hover:text-white font-medium px-4 py-3 rounded-xl transition-all duration-200 hover:bg-secondary-800/50 group"
        >
          <Cog6ToothIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Ajustes</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 text-danger-400 hover:text-danger-300 font-medium px-4 py-3 rounded-xl transition-all duration-200 hover:bg-danger-500/10 group"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}
