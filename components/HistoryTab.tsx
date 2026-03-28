
import React from 'react';
import { ImportRecord } from '../types';
import { 
  PackageOpen, 
  Trash2, 
  ExternalLink, 
  MoreVertical, 
  Download,
  CheckCircle2
} from 'lucide-react';

interface HistoryTabProps {
  history: ImportRecord[];
  onDelete: (id: string) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history, onDelete }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <PackageOpen className="w-10 h-10 opacity-20" />
        </div>
        <h3 className="text-lg font-medium">Nenhuma importação encontrada</h3>
        <p className="text-sm mt-1">Comece extraindo alguns produtos na aba Importador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{history.length} Importações Recentes</span>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          <Download className="w-3 h-3" />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
            <div className="h-48 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-6 relative">
              <img src={item.imageUrl} alt={item.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onDelete(item.id)}
                  className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 shadow-sm border border-red-50 transition-all hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-2 h-2" />
                  Publicado
                </span>
                <span className="text-[10px] text-slate-400">{new Date(item.importedAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <h4 className="font-bold text-slate-800 line-clamp-2 mb-3 leading-snug">{item.name}</h4>
              
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">{item.currency} {item.price}</span>
                <div className="flex gap-1">
                   <a 
                    href={item.affiliateUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTab;
