
import { MLProduct } from './types';

export const getCategories = async (): Promise<any[]> => {
  try {
    const response = await fetch('https://api.mercadolibre.com/sites/MLB/categories', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching ML categories:', error);
    return [];
  }
};

async function main() {
  const categories = await getCategories();
  console.log(JSON.stringify(categories.slice(0, 5), null, 2));
}

main();
