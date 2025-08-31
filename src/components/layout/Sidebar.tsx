
import { useState } from "react";
import { CheckCircleIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, ChartBarIcon, HomeIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface SidebarProps {
  jobs: any[];
  onSelectJob: (jobId: string) => void;
  onSettings: () => void;
  onLogout: () => void;
  onNavigate: (section: 'dashboard' | 'history' | 'stats') => void;
  user: any;
  activeSection: string;
}

export default function Sidebar({ jobs, onSelectJob, onSettings, onLogout, onNavigate, user, activeSection }: SidebarProps) {
  const [historyExpanded, setHistoryExpanded] = useState(false);

  return (
    <aside className="w-72 h-screen bg-gradient-to-b from-primary/90 to-blue-900 shadow-xl flex flex-col justify-between fixed left-0 top-0 z-30">
      {/* Top: User info and navigation */}
      <div>
        <div className="flex flex-col items-center gap-2 py-8 border-b border-white/10">
          <UserCircleIcon className="h-14 w-14 text-white/80 drop-shadow" />
          <span className="text-white font-semibold text-lg tracking-wide">{user?.email || 'Usuario'}</span>
        </div>
        
        {/* Navigation Menu */}
        <nav className="px-4 pt-6">
          <div className="space-y-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeSection === 'dashboard' 
                  ? 'bg-white/20 text-white border border-white/30' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button
              onClick={() => onNavigate('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeSection === 'stats' 
                  ? 'bg-white/20 text-white border border-white/30' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChartBarIcon className="h-5 w-5" />
              <span className="font-medium">Estadísticas</span>
            </button>
            
            <div>
              <button
                onClick={() => {
                  setHistoryExpanded(!historyExpanded);
                  if (!historyExpanded) onNavigate('history');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === 'history' 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-medium">Historial</span>
                {historyExpanded ? 
                  <ChevronDownIcon className="h-4 w-4 ml-auto" /> : 
                  <ChevronRightIcon className="h-4 w-4 ml-auto" />
                }
              </button>
              
              {historyExpanded && (
                <div className="mt-2 ml-4 mr-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {jobs.length === 0 ? (
                    <div className="p-3 text-white/50 text-sm">Sin archivos aún</div>
                  ) : (
                    <ul className="space-y-1">
                      {jobs.map(job => (
                        <li
                          key={job.id}
                          className="rounded-lg px-3 py-2 transition-colors duration-150 cursor-pointer bg-white/0 hover:bg-white/10 group border border-transparent hover:border-white/20"
                          onClick={() => onSelectJob(job.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full border-2 border-white/40 ${job.status === 'completed' ? 'bg-green-400' : job.status === 'failed' ? 'bg-red-400' : 'bg-yellow-300'}`} />
                            <span className="font-medium text-xs truncate text-white/90 group-hover:text-white max-w-[140px]">
                              {job.title || 'Sin título'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
      {/* Bottom: Settings and logout */}
      <div className="px-4 py-6 border-t border-white/10 flex flex-col gap-3">
        <button
          onClick={onSettings}
          className="flex items-center gap-3 text-white/80 hover:text-blue-200 font-medium px-3 py-2 rounded transition-colors duration-150 hover:bg-white/10"
        >
          <Cog6ToothIcon className="h-5 w-5" /> Ajustes
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-white/80 hover:text-red-300 font-medium px-3 py-2 rounded transition-colors duration-150 hover:bg-white/10"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Salir
        </button>
      </div>
    </aside>
  );
}
