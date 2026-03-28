
import React, { useState } from 'react';
import { extractProductData } from '../services/geminiService';
import { createWooProduct } from '../services/wooService';
import { ProductData, WooCommerceConfig } from '../types';
import ProductPreview from './ProductPreview';
import { 
  Link as LinkIcon, 
  Search, 
  Loader2, 
  AlertTriangle, 
  Zap, 
  Camera, 
  Percent,
  Sparkles
} from 'lucide-react';

interface ImporterTabProps {
  onImportSuccess: (product: ProductData) => void;
  wooConfig: WooCommerceConfig;
  prefilledUrl?: string;
  onClearPrefilled?: () => void;
}

const ImporterTab: React.FC<ImporterTabProps> = ({ 
  onImportSuccess, 
  wooConfig, 
  prefilledUrl,
  onClearPrefilled 
}) => {
  const [url, setUrl] = useState(prefilledUrl || '');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProductData | null>(null);

  React.useEffect(() => {
    if (prefilledUrl) {
      setUrl(prefilledUrl);
      // Auto-preview if prefilled
      const triggerPreview = async () => {
        setLoading(true);
        setError(null);
        setPreview(null);
        try {
          const data = await extractProductData(prefilledUrl);
          setPreview(data);
          if (onClearPrefilled) onClearPrefilled();
        } catch (err: any) {
          setError(err.message || "Ocorreu um erro ao extrair os dados.");
        } finally {
          setLoading(false);
        }
      };
      triggerPreview();
    }
  }, [prefilledUrl]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const data = await extractProductData(url);
      setPreview(data);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao extrair os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    if (!wooConfig.url || !wooConfig.consumerKey) {
      setError("Por favor, configure as credenciais do WooCommerce primeiro.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      await createWooProduct(wooConfig, preview);
      onImportSuccess(preview);
      setPreview(null);
      setUrl('');
      alert('Produto importado com sucesso para sua loja WooCommerce!');
    } catch (err: any) {
      setError(`Erro no WooCommerce: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="p-6 md:p-8 bg-gradient-to-r from-yellow-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <h3 className="text-xl font-bold text-slate-800">Extração Automática de Produtos</h3>
            </div>
            {!wooConfig.url && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 animate-pulse">
                WooCommerce Desconectado
              </span>
            )}
          </div>
          <p className="text-slate-500 mb-6 max-w-2xl text-sm">
            Cole a URL do produto ou link de afiliado do Mercado Livre abaixo. Nossa inteligência artificial irá extrair metadados, imagens e preços automaticamente.
          </p>

          <form onSubmit={handlePreview} className="relative group">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-600">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://mercadolivre.com/sec/XXXXXXX"
                  className="block w-full pl-11 pr-4 py-4 rounded-xl border-2 border-slate-100 focus:border-yellow-400 focus:ring-0 outline-none transition-all placeholder:text-slate-300 text-slate-700 shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url}
                className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg ${
                  loading || !url
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Obter Prévia
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      {preview && (
        <ProductPreview 
          data={preview} 
          loading={importing}
          onImport={handleImport} 
          onCancel={() => setPreview(null)} 
        />
      )}

      {!preview && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 opacity-60">
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Sincronia Instantânea</h4>
            <p className="text-xs text-slate-500 mt-1">Conexão direta via API do WooCommerce.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Imagens em HD</h4>
            <p className="text-xs text-slate-500 mt-1">Upload automático das fotos originais.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-3">
              <Percent className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Taxas de Afiliado</h4>
            <p className="text-xs text-slate-500 mt-1">Links de rastreio mantidos intactos.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImporterTab;
