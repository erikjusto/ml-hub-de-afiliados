
import React, { useState } from 'react';
import { ProductData } from '../types';
import { normalizePrice } from '../services/wooService';
import { 
  Image as ImageIcon, 
  Copy, 
  Check, 
  X, 
  CreditCard, 
  AlignLeft, 
  ExternalLink, 
  CloudUpload, 
  Pencil,
  Loader2
} from 'lucide-react';

interface ProductPreviewProps {
  data: ProductData;
  loading?: boolean;
  onImport: () => void;
  onCancel: () => void;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ data, loading, onImport, onCancel }) => {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const decimalPrice = normalizePrice(data.price);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row h-full">
        {/* Galeria de Imagens com Fallback */}
        <div className="md:w-2/5 p-6 bg-slate-50 border-r border-slate-100 flex flex-col items-center">
          <div className="relative group w-full aspect-square rounded-xl overflow-hidden shadow-inner bg-white border border-slate-200 flex items-center justify-center mb-6">
            {data.imageUrl && !imageError ? (
              <img 
                src={data.imageUrl} 
                alt={data.name} 
                onError={() => setImageError(true)}
                className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-300 p-8 text-center">
                <ImageIcon className="w-16 h-16 mb-4" />
                <span className="text-xs font-bold uppercase tracking-tighter">Imagem em HD não pôde ser carregada</span>
              </div>
            )}
            <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">
              Alta Resolução
            </div>
          </div>

          {/* URL da Imagem - Visualização Técnica */}
          <div className="w-full space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">URL da Imagem Capturada</h4>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-3 shadow-sm group/url">
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-blue-600 truncate font-mono select-all">
                  {data.imageUrl || "URL não encontrada"}
                </p>
              </div>
              <button 
                onClick={() => copyToClipboard(data.imageUrl)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-500 transition-all hover:bg-blue-50"
                title="Copiar URL da Imagem"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Detalhes do Conteúdo */}
        <div className="md:w-3/5 p-6 md:p-8 flex flex-col">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-2xl font-bold text-slate-800 leading-tight">{data.name}</h2>
              <button 
                onClick={onCancel}
                disabled={loading}
                className="text-slate-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-30 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Preço Extraído</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {data.currency} {data.price}
                </span>
              </div>
              
              <div className="h-10 w-[1px] bg-slate-200 hidden sm:block"></div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-blue-400 uppercase">Valor para o WooCommerce</span>
                <span className="text-xl font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                  {decimalPrice}
                </span>
              </div>
            </div>

            {data.installmentInfo && (
              <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 w-fit">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs font-semibold">{data.installmentInfo}</span>
              </div>
            )}
          </div>

          <div className="mb-6 flex-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-yellow-400" /> Descrição do Produto
            </h4>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-40 overflow-y-auto">
               <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {data.description || "Nenhuma descrição técnica extraída."}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Produto pronto para sincronização
              </span>
              <a href={data.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1">
                Ver original <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onImport}
                disabled={loading}
                className={`flex-[2] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] ${
                  loading ? 'bg-slate-400 shadow-none cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-5 h-5" />
                    Sincronizar com WooCommerce
                  </>
                )}
              </button>
              <button 
                className="flex-1 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                title="Revisar Dados"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
