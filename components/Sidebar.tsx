
import React from 'react';
import { AppTab } from '../types';
import { 
  CloudDownload, 
  Compass, 
  History, 
  Settings, 
  ShoppingCart,
  Database
} from 'lucide-react';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: AppTab.IMPORTER, label: 'Importador', icon: CloudDownload },
    { id: AppTab.EXPLORER, label: 'Explorar ML', icon: Compass },
    { id: AppTab.HISTORY, label: 'Histórico', icon: History },
    { id: AppTab.SETTINGS, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden lg:flex shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-yellow-400/20">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">ML Afiliados</h1>
            <span className="text-xs text-slate-400">Importador v1.2</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-yellow-400 text-slate-900 shadow-md font-semibold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-slate-900' : 'group-hover:text-yellow-400 transition-colors'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-3 h-3 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Armazenamento</p>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 w-1/4"></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">12/50 Produtos Importados</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
