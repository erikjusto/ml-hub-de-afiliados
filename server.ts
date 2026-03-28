
import express from 'express';
import cors from 'cors';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
// vite imported dynamically in development
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/ml/test', async (req, res) => {
    const appId = process.env.ML_APP_ID;
    const secretKey = process.env.ML_SECRET_KEY;
    const authHeader = req.headers['authorization'];
    
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.mercadolivre.com.br/',
        'Cache-Control': 'no-cache'
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch('https://api.mercadolibre.com/sites/MLB/categories', { headers });
      
      if (response.ok) {
        const data = await response.json();
        res.json({ 
          status: 'success', 
          message: 'Conexão com API do Mercado Livre estabelecida com sucesso!',
          categoriesCount: data.length,
          env: {
            appIdSet: !!appId,
            secretKeySet: !!secretKey
          }
        });
      } else {
        // Even if ML returns 403, we return 200 with an error object to avoid frontend proxy issues
        res.json({ 
          status: 'error', 
          message: 'O Mercado Livre bloqueou a requisição anônima (403).',
          details: 'Isso é comum em servidores de nuvem. Por favor, use o botão "Conectar com Mercado Livre" para autenticar sua conta e liberar o acesso.'
        });
      }
    } catch (error: any) {
      res.json({ 
        status: 'error', 
        message: 'Falha de rede ao conectar com o Mercado Livre',
        details: error.message 
      });
    }
  });

  // Proxy for Mercado Livre to include App ID if available
  app.get('/api/ml/search', async (req, res) => {
    const { q, category, limit = 10 } = req.query;
    const authHeader = req.headers['authorization'];
    const query = q || 'mais vendidos';
    let url = `https://api.mercadolibre.com/sites/MLB/search?limit=${limit}`;
    if (query) url += `&q=${encodeURIComponent(query as string)}`;
    if (category) url += `&category=${category}`;
    
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.mercadolivre.com.br/',
        'Origin': 'https://www.mercadolivre.com.br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'dnt': '1'
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(url, { headers });
      
      // If we get a 403 but we have an auth header, it might be an expired token
      if (response.status === 403 && authHeader) {
        return res.status(403).json({ 
          status: 'error',
          message: 'Sua sessão com o Mercado Livre expirou. Por favor, conecte-se novamente.',
          results: []
        });
      }

      if (!response.ok) {
        const status = response.status;
        // Return 200 with error payload for 403 to bypass some strict proxy filters
        // and allow the frontend to show the "Connect" button gracefully
        return res.status(status === 403 ? 200 : status).json({ 
          status: 'error',
          code: status,
          message: status === 403 ? 'Acesso bloqueado pelo Mercado Livre. Conecte sua conta para liberar a busca.' : 'Erro na API do Mercado Livre',
          results: []
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('ML Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch from ML', results: [] });
    }
  });

  app.get('/api/ml/categories', async (req, res) => {
    const authHeader = req.headers['authorization'];
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.mercadolivre.com.br/',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site'
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch('https://api.mercadolibre.com/sites/MLB/categories', { headers });
      
      if (!response.ok) {
        return res.status(response.status === 403 ? 200 : response.status).json({
          status: 'error',
          code: response.status,
          message: 'Falha ao buscar categorias'
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Gemini AI - Product Extraction
  app.post('/api/gemini/extract', async (req, res) => {
    const { url } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });

    try {
      // Resolve short URLs (meli.la, mercadolivre.com/sec, etc.) to full product URL
      let resolvedUrl = url;
      const shortDomains = ['meli.la', 'mercadolivre.com/sec', 'mercadolibre.com/sec'];
      const isShortUrl = shortDomains.some(d => url.includes(d));
      
      if (isShortUrl) {
        try {
          console.log('Resolving short URL:', url);
          const redirectRes = await fetch(url, { 
            method: 'HEAD', 
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            }
          });
          resolvedUrl = redirectRes.url || url;
          console.log('Resolved URL:', resolvedUrl);
        } catch (e) {
          console.warn('Could not resolve short URL, using original:', url);
        }
      }

      // Extract ML Item ID from URL if possible (MLB-XXXXXXXXX or MLB/XXXXXXXXX)
      const mlbMatch = resolvedUrl.match(/MLB[-\/]?(\d+)/i);
      let mlApiData: any = null;

      if (mlbMatch) {
        const itemId = `MLB${mlbMatch[1]}`;
        console.log('Found ML Item ID:', itemId);
        try {
          const apiRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
            headers: { 'User-Agent': 'ML-App/2.0', 'Accept': 'application/json' }
          });
          if (apiRes.ok) {
            mlApiData = await apiRes.json();
            console.log('Got ML API data for:', mlApiData.title);
          }
        } catch (e) {
          console.warn('ML API item fetch failed, falling back to Gemini:', e);
        }
      }

      // If we got data from ML API directly, use it (faster + more accurate)
      if (mlApiData) {
        const price = mlApiData.price ? mlApiData.price.toString().replace('.', ',') : '0,00';
        const imageUrl = mlApiData.pictures?.[0]?.secure_url || mlApiData.thumbnail?.replace('-I.jpg', '-O.jpg') || '';
        
        return res.json({
          name: mlApiData.title || 'Produto Mercado Livre',
          price: price,
          currency: mlApiData.currency_id === 'BRL' ? 'R$' : mlApiData.currency_id || 'R$',
          installmentInfo: '',
          description: mlApiData.attributes?.map((a: any) => `${a.name}: ${a.value_name}`).join('\n').slice(0, 500) || 'Descrição extraída via API.',
          imageUrl: imageUrl,
          affiliateUrl: url,
        });
      }

      // Fallback: Use Gemini AI with Google Search
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Aja como um scraper de elite especializado no Mercado Livre. Analise minuciosamente a URL: ${resolvedUrl}
        
        INSTRUÇÕES DE EXTRAÇÃO CRÍTICAS:

        1. PREÇO PRINCIPAL (VALOR ATUAL):
           - Localize o container de preço principal (geralmente .ui-pdp-price__main-container).
           - Extraia a fração (.andes-money-amount__fraction) e os centavos (.andes-money-amount__cents).
           - IMPORTANTE: Se o valor for 1.299 e os centavos 90, o resultado deve ser "1.299,90". Nunca ignore os centavos.
        
        2. PARCELAMENTO (NOVO PADRÃO):
           - Procure especificamente pelo elemento com id="pricing_price_subtitle".
           - Dentro dele, capture o texto completo. Exemplo: "18x R$ 7,60 com Linha de Crédito".
        
        3. IMAGEM EM ALTA RESOLUÇÃO (HD):
           - Localize a imagem principal do produto.
           - Você DEVE converter o sufixo final (antes da extensão) para "-O". 
           - Exemplo: "...-F.webp" torna-se "...-O.webp" ou "...-O.jpg".

        4. DESCRIÇÃO:
           - Extraia os dados técnicos principais de forma concisa e profissional.

        Retorne estritamente este JSON:
        {
          "name": "Título Completo do Produto",
          "price": "VALOR_COM_CENTAVOS (ex: 1.299,90)",
          "currency": "R$",
          "installmentInfo": "TEXTO_COMPLETO_DO_PARCELAMENTO",
          "description": "Resumo das especificações técnicas",
          "imageUrl": "URL_DA_IMAGEM_CONVERTIDA_PARA_HD"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.STRING },
              currency: { type: Type.STRING },
              installmentInfo: { type: Type.STRING },
              description: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
            },
            required: ['name', 'price', 'imageUrl']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      res.json({
        name: data.name || 'Produto Mercado Livre',
        price: data.price || '0,00',
        currency: data.currency || 'R$',
        installmentInfo: data.installmentInfo || '',
        description: data.description || 'Descrição não extraída.',
        imageUrl: data.imageUrl || '',
        affiliateUrl: url,
      });

    } catch (error: any) {
      console.error('Gemini Extraction API Error:', error?.message || error);
      console.error('Full error:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: `Falha ao processar: ${error?.message || 'Erro desconhecido no backend.'}` });
    }
  });

  // Mercado Livre OAuth Endpoints
  app.get('/api/auth/ml/url', (req, res) => {
    const appId = (process.env.ML_APP_ID || '').trim();
    
    if (!appId) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'ML_APP_ID não configurado. Adicione no arquivo .env' 
      });
    }

    // Use APP_URL from env or fallback to request headers
    // For localhost, default to http instead of https
    const host = req.get('host') || 'localhost:3000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const defaultProto = isLocalhost ? 'http' : 'https';
    const baseUrl = process.env.APP_URL || `${req.headers['x-forwarded-proto'] || defaultProto}://${host}`;
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/auth/ml/callback`;
    
    const params = new URLSearchParams({
      client_id: appId,
      response_type: 'code',
      redirect_uri: redirectUri,
    });
    
    // Using the generic auth URL which is more robust
    const authUrl = `https://auth.mercadolivre.com.br/authorization?${params}`;
    console.log('Generated ML Auth URL:', authUrl);
    res.json({ url: authUrl });
  });

  // Mercado Livre Notification Callback (Webhooks)
  app.post('/api/ml/notifications', (req, res) => {
    const notification = req.body;
    console.log('ML Notification Received:', notification);
    res.status(200).send('OK');
  });

  app.get(['/auth/ml/callback', '/auth/ml/callback/'], async (req, res) => {
    const { code } = req.query;
    const appId = (process.env.ML_APP_ID || '').trim();
    const secretKey = (process.env.ML_SECRET_KEY || '').trim();
    
    // Use APP_URL from env or fallback to request headers
    // For localhost, default to http instead of https
    const host = req.get('host') || 'localhost:3000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const defaultProto = isLocalhost ? 'http' : 'https';
    const baseUrl = process.env.APP_URL || `${req.headers['x-forwarded-proto'] || defaultProto}://${host}`;
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/auth/ml/callback`;

    if (!code) {
      return res.status(400).send('No code provided');
    }

    try {
      const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: appId || '',
          client_secret: secretKey || '',
          code: code as string,
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await response.json();
      
      // In a real app, we'd store these in a session or database.
      // For this demo, we'll just send a success message back to the opener.
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'ML_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticação com Mercado Livre concluída com sucesso! Esta janela fechará automaticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('ML OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Vite middleware for development
  // Runs only if not in Vercel. Vercel automatically runs Vite to serve the frontend.
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    import('vite').then(({ createServer }) => {
      createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then(vite => {
        app.use(vite.middlewares);
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`Server running on http://localhost:${PORT}`);
        });
      });
    });
  } else if (process.env.VERCEL !== '1') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Production Server running on http://localhost:${PORT}`);
    });
  }

export default app;
