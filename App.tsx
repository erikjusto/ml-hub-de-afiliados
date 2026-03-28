
import React, { useState, useEffect } from 'react';
import { AppTab, ProductData, ImportRecord, WooCommerceConfig } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ImporterTab from './components/ImporterTab';
import MLExplorerTab from './components/MLExplorerTab';
import HistoryTab from './components/HistoryTab';
import SettingsTab from './components/SettingsTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.IMPORTER);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [prefilledUrl, setPrefilledUrl] = useState<string>('');
  
  // Inicializamos com a URL e as chaves fornecidas pelo usuário
  const [wooConfig, setWooConfig] = useState<WooCommerceConfig>({
    url: import.meta.env.VITE_WOO_URL || '',
    consumerKey: import.meta.env.VITE_WOO_CK || '',
    consumerSecret: import.meta.env.VITE_WOO_CS || ''
  });

  // Load history and config from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('ml_import_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedConfig = localStorage.getItem('ml_woo_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Mantemos as configurações se o localStorage já tiver dados salvos
      setWooConfig(prev => ({
        ...prev,
        ...parsed
      }));
    }
  }, []);

  const handleSaveConfig = (newConfig: WooCommerceConfig) => {
    setWooConfig(newConfig);
    localStorage.setItem('ml_woo_config', JSON.stringify(newConfig));
  };

  const addToHistory = (product: ProductData) => {
    const newRecord: ImportRecord = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      importedAt: new Date().toISOString(),
      status: 'published'
    };
    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('ml_import_history', JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('ml_import_history', JSON.stringify(updatedHistory));
  };

  const handleSelectProduct = (url: string) => {
    setPrefilledUrl(url);
    setActiveTab(AppTab.IMPORTER);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTab={activeTab} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === AppTab.IMPORTER && (
            <ImporterTab 
              onImportSuccess={addToHistory} 
              wooConfig={wooConfig} 
              prefilledUrl={prefilledUrl}
              onClearPrefilled={() => setPrefilledUrl('')}
            />
          )}
          {activeTab === AppTab.EXPLORER && (
            <MLExplorerTab onSelectProduct={handleSelectProduct} />
          )}
          {activeTab === AppTab.HISTORY && (
            <HistoryTab history={history} onDelete={deleteFromHistory} />
          )}
          {activeTab === AppTab.SETTINGS && (
            <SettingsTab config={wooConfig} onSave={handleSaveConfig} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
