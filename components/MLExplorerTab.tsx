
import React, { useState, useEffect } from 'react';
import { getCategories, getProductsByCategory, searchProducts } from '../services/mlService';
import { MLCategory, MLProduct } from '../types';
import { Search, Compass, Filter, Loader2, PackageOpen, ExternalLink, Import, AlertTriangle } from 'lucide-react';

interface MLExplorerTabProps {
  onSelectProduct: (url: string) => void;
}

const MLExplorerTab: React.FC<MLExplorerTabProps> = ({ onSelectProduct }) => {
  const [categories, setCategories] = useState<MLCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInitialData = async () => {
    const tokens = localStorage.getItem('ml_tokens');
    
    // If no tokens, don't even try to fetch (it will fail with 403 anyway)
    // Just show the "Connect" state
    if (!tokens) {
      setError('403: Conecte sua conta para explorar produtos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cats = await getCategories();
      setCategories(cats);
      
      // Fetch trending products by default
      const trending = await searchProducts('mais vendidos', 10);
      setProducts(trending);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar dados iniciais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Listen for ML OAuth tokens from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ML_AUTH_SUCCESS' && event.data.tokens) {
        localStorage.setItem('ml_tokens', JSON.stringify(event.data.tokens));
        setError(null);
        // Reload data now that we have tokens
        fetchInitialData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchTerm('');
    setError(null);
    if (!categoryId) {
      setLoading(true);
      try {
        const trending = await searchProducts('mais vendidos', 10);
        setProducts(trending);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar produtos em destaque.');
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const results = await getProductsByCategory(categoryId, 10);
      setProducts(results);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar produtos desta categoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedCategory('');
    try {
      const results = await searchProducts(searchTerm, 10);
      setProducts(results);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar a busca.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectML = async () => {
    try {
      const response = await fetch('/api/auth/ml/url');
      const { url } = await response.json();
      window.open(url, 'ml_oauth', 'width=600,height=700');
    } catch (err) {
      setError('Erro ao iniciar autenticação.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Compass className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-slate-800">Explorar Mercado Livre</h3>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
              <Filter className="w-3 h-3" />
              Filtrar por Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-yellow-400 outline-none transition-all text-slate-700 bg-slate-50 appearance-none cursor-pointer"
            >
              <option value="">Mais Vendidos (Geral)</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
              <Search className="w-3 h-3" />
              Pesquisar Produtos
            </label>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: iPhone 15, Notebook..."
                className="w-full p-3 pr-12 rounded-xl border-2 border-slate-100 focus:border-yellow-400 outline-none transition-all text-slate-700 bg-slate-50"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-yellow-600 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-medium">Carregando produtos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-bold text-lg mb-2">Acesso Bloqueado</p>
          <p className="text-red-500 text-sm mb-6 max-w-md mx-auto">
            {error.includes('403') 
              ? 'O Mercado Livre bloqueou o acesso anônimo. Para liberar a busca de produtos, você precisa conectar sua conta oficial.' 
              : error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={handleConnectML}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-yellow-400/20"
            >
              Conectar com Mercado Livre
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.isArray(products) && products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
            >
              <div className="aspect-square bg-slate-50 relative overflow-hidden">
                <img 
                  src={product.thumbnail.replace('-I.jpg', '-O.jpg')} 
                  alt={product.title}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-100">
                    {product.condition === 'new' ? 'Novo' : 'Usado'}
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 min-h-[2.5rem]">
                  {product.title}
                </h4>
                
                <div className="mt-auto">
                  <div className="text-lg font-bold text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.currency_id }).format(product.price)}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => onSelectProduct(product.permalink)}
                      className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                    >
                      <Import className="w-4 h-4" />
                      Importar
                    </button>
                    <a
                      href={product.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                      title="Ver no Mercado Livre"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center text-slate-400">
              <div className="flex justify-center mb-4">
                <PackageOpen className="w-16 h-16" />
              </div>
              <p className="font-medium text-lg">Nenhum produto encontrado.</p>
              <p className="text-sm">Selecione uma categoria ou pesquise acima para encontrar ofertas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MLExplorerTab;
