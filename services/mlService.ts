
import { MLCategory, MLProduct } from '../types';

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const tokensRaw = localStorage.getItem('ml_tokens');
  if (tokensRaw) {
    try {
      const tokens = JSON.parse(tokensRaw);
      if (tokens.access_token) {
        headers['Authorization'] = `Bearer ${tokens.access_token}`;
      }
    } catch (e) {
      console.error('Error parsing ML tokens:', e);
    }
  }
  
  return headers;
};

export const getCategories = async (): Promise<MLCategory[]> => {
  try {
    const response = await fetch('/api/ml/categories', {
      headers: getHeaders()
    });
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok || data.status === 'error') {
      const message = data.message || `Erro ${response.status}: Falha ao buscar categorias`;
      console.error('Categories fetch failed:', response.status, message);
      throw new Error(message);
    }
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('Error fetching ML categories:', error);
    throw error;
  }
};

export const getProductsByCategory = async (categoryId: string, limit: number = 10): Promise<MLProduct[]> => {
  try {
    const response = await fetch(`/api/ml/search?category=${categoryId}&limit=${limit}`, {
      headers: getHeaders()
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status === 'error') {
      const message = data.message || `Erro ${response.status}: Falha ao buscar produtos`;
      console.error('Products by category fetch failed:', response.status, message);
      throw new Error(message);
    }
    return Array.isArray(data.results) ? data.results : [];
  } catch (error: any) {
    console.error('Error fetching ML products:', error);
    throw error;
  }
};

export const searchProducts = async (query: string, limit: number = 10): Promise<MLProduct[]> => {
  try {
    const response = await fetch(`/api/ml/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: getHeaders()
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status === 'error') {
      const message = data.message || `Erro ${response.status}: Falha ao realizar busca`;
      console.error('Search fetch failed:', response.status, message);
      throw new Error(message);
    }
    return Array.isArray(data.results) ? data.results : [];
  } catch (error: any) {
    console.error('Error fetching ML products:', error);
    throw error;
  }
};
