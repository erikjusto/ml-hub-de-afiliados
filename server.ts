
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then(vite => {
      app.use(vite.middlewares);
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
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
