
import { WooCommerceConfig, ProductData } from "../types";

/**
 * Normaliza preços do formato brasileiro (ex: 1.299,90) para o padrão decimal da API (1299.90).
 * Lida com símbolos de moeda, espaços, pontos de milhar e vírgulas decimais.
 */
export const normalizePrice = (priceLabel: string): string => {
  if (!priceLabel) return '0.00';
  
  // 1. Limpeza pesada: mantém apenas números, vírgulas e pontos
  let clean = priceLabel.replace(/[R$\s]/g, '').replace(/[^0-9\.,]/g, '');
  
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');

  // 2. Lógica para definir o separador decimal real
  if (lastComma > lastDot) {
    // Padrão BR: Milhar com ponto, decimal com vírgula (ex: 1.299,90)
    // Remove todos os pontos (milhar) e troca a vírgula por ponto (decimal)
    return clean.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Padrão US: Milhar com vírgula, decimal com ponto (ex: 1,299.90)
    // Ou apenas milhar sem centavos no ML (ex: 1.299)
    if (lastComma !== -1) {
      // É 1,299.90 -> remove vírgula
      return clean.replace(/,/g, '');
    }
    
    // É 1.299? No ML, se houver apenas um ponto e 3 casas depois, costuma ser milhar.
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      return clean.replace(/\./g, '');
    }
    
    // Caso contrário, assume que o ponto já é o decimal (ex: 64.10)
    return clean;
  }

  // 3. Caso tenha apenas vírgula (ex: 64,10)
  if (lastComma !== -1 && lastDot === -1) {
    return clean.replace(',', '.');
  }

  // 4. Se não tiver nada, retorna o valor limpo ou zero
  return clean || '0.00';
};

export const createWooProduct = async (config: WooCommerceConfig, product: ProductData) => {
  if (!config.url || !config.consumerKey || !config.consumerSecret) {
    throw new Error("Credenciais do WooCommerce não configuradas.");
  }

  const baseUrl = config.url.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products`;
  const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);

  const decimalPrice = normalizePrice(product.price);

  const payload = {
    name: product.name,
    type: "external",
    status: "publish",
    regular_price: decimalPrice,
    description: product.description,
    short_description: product.installmentInfo ? `<p><strong>Parcelamento:</strong> ${product.installmentInfo}</p>` : "",
    external_url: product.affiliateUrl,
    button_text: "Comprar no Mercado Livre",
    images: product.imageUrl ? [
      {
        src: product.imageUrl,
        name: product.name,
        alt: product.name
      }
    ] : []
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Erro retornado pela API do WooCommerce.");
  }

  return await response.json();
};

export const testWooConnection = async (config: WooCommerceConfig) => {
  const baseUrl = config.url.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=1`;
  const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);

  const response = await fetch(apiUrl, {
    headers: { "Authorization": `Basic ${auth}` }
  });

  if (!response.ok) throw new Error("Conexão falhou. Verifique as credenciais.");
  return true;
};
