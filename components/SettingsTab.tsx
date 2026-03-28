
import React, { useState } from 'react';
import { WooCommerceConfig } from '../types';
import { testWooConnection } from '../services/wooService';
import { 
  Handshake, 
  Settings2, 
  Globe, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Plug, 
  Info 
} from 'lucide-react';

interface SettingsTabProps {
  config: WooCommerceConfig;
  onSave: (config: WooCommerceConfig) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<WooCommerceConfig>(config);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [mlConnected, setMlConnected] = useState(false);
  const [testingML, setTestingML] = useState(false);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ML_AUTH_SUCCESS') {
        setMlConnected(true);
        setStatus({ type: 'success', msg: 'Mercado Livre conectado com sucesso!' });
        // Store tokens if needed
        if (event.data.tokens) {
          localStorage.setItem('ml_tokens', JSON.stringify(event.data.tokens));
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectML = async () => {
    try {
      const response = await fetch('/api/auth/ml/url');
      const { url } = await response.json();
      window.open(url, 'ml_oauth', 'width=600,height=700');
    } catch (err) {
      setStatus({ type: 'error', msg: 'Erro ao iniciar autenticação com Mercado Livre.' });
    }
  };

  const handleTestML = async () => {
    setTestingML(true);
    setStatus(null);
    try {
      const response = await fetch('/api/ml/test');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Proxy error response:', errorText);
        setStatus({ type: 'error', msg: `Erro no servidor (${response.status}). Verifique o console.` });
        return;
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        setStatus({ type: 'success', msg: data.message });
      } else {
        setStatus({ type: 'error', msg: data.message || 'Erro desconhecido na API.' });
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setStatus({ type: 'error', msg: `Erro de conexão: ${err.message}` });
    } finally {
      setTestingML(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await testWooConnection(formData);
      setStatus({ type: 'success', msg: 'Conexão estabelecida com sucesso!' });
      onSave(formData);
    } catch (err: any) {
      setStatus({ type: 'error', msg: 'Falha na conexão: Verifique suas credenciais.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Handshake className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-800">Conexão Mercado Livre</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${mlConnected ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                <Handshake className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{mlConnected ? 'Conectado' : 'Não Conectado'}</h4>
                <p className="text-xs text-slate-500">Status da integração oficial</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTestML}
                disabled={testingML}
                className="px-4 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                {testingML ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                Verificar
              </button>
              <button
                onClick={handleConnectML}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${mlConnected ? 'bg-slate-100 text-slate-600 cursor-default' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500 shadow-lg shadow-yellow-400/20'}`}
                disabled={mlConnected}
              >
                {mlConnected ? 'Integrado' : 'Conectar Agora'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-800">Configuração da API WooCommerce</h3>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
              <Globe className="w-4 h-4 text-slate-400" />
              URL da Loja
            </label>
            <input 
              type="text" 
              placeholder="https://sualoja.com.br"
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                <Key className="w-4 h-4 text-slate-400" />
                Consumer Key
              </label>
              <input 
                type="password" 
                placeholder="ck_xxxxxxxx..."
                value={formData.consumerKey}
                onChange={e => setFormData({...formData, consumerKey: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Consumer Secret
              </label>
              <input 
                type="password" 
                placeholder="cs_xxxxxxxx..."
                value={formData.consumerSecret}
                onChange={e => setFormData({...formData, consumerSecret: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
              />
            </div>
          </div>

          {status && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in duration-300 ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {status.msg}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleTest}
              disabled={testing || !formData.url || !formData.consumerKey}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plug className="w-5 h-5" />}
              Testar e Salvar Conexão
            </button>
            <p className="text-[10px] text-slate-400 text-center px-8">
              Certifique-se de que seu site tenha HTTPS habilitado e que você criou a chave em <br/>
              <b>WooCommerce &gt; Configurações &gt; Avançado &gt; API REST</b>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" /> Nota Importante sobre CORS
        </h4>
        <p className="text-xs text-blue-700 leading-relaxed">
          Aplicativos baseados em navegador podem enfrentar restrições de CORS ao chamar a API do WordPress diretamente. 
          Se a conexão falhar, certifique-se de que seu servidor permite requisições desta origem ou utilize um plugin de "CORS Unblocker" no seu WordPress.
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;
