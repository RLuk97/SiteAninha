# Loja da Aninha — Frontend + Backend

Sistema de catálogo e vendas com upload de imagens e checkout via WhatsApp.

## Estrutura

- Frontend: `loja-natura/frontend/`
  - Página principal: [`frontend/index.html`](./frontend/index.html) (usa `<base href=\"../\">`)
  - Estilos: [`css/style.css`](./css/style.css)
  - Lógica: [`js/app.js`](./js/app.js)
  - Configurações e dados: [`js/data.js`](./js/data.js)
  - Imagens: [`images/*`](./images)
- Backend: `loja-natura/backend/`
  - API Flask com login e upload
  - Arquivos: [`backend/app.py`](./backend/app.py), [`backend/requirements.txt`](./backend/requirements.txt)

## Executando

1. Backend (porta 5000)
   - Instalar dependências:
     - `pip install -r loja-natura/backend/requirements.txt`
   - Iniciar servidor:
     - `python loja-natura/backend/app.py`
   - Endpoints:
     - `POST /api/upload` — form-data `file: <imagem>`
     - `GET /api/health`
     - `GET /uploads/<filename>`

2. Frontend (porta 8000)
   - Iniciar servidor simples:
     - `cd loja-natura/frontend && python -m http.server 8000`
   - Abrir no navegador:
     - `http://localhost:8000/`

## Fluxos

- Login Admin:
  - Frontend envia para `POST /api/auth/login` e usa fallback offline caso o backend esteja indisponível.
  - Implementação: [`app.js`](./js/app.js#L419-L432)

- Upload de Imagem:
  - Frontend envia o arquivo para `POST /api/upload`.
  - URL pública é retornada e usada no produto.
  - Implementação: [`app.js`](./js/app.js#L690-L703)

- Checkout via WhatsApp:
  - Número configurado: `5592984663068`
  - Implementação: [`app.js`](./js/app.js#L360-L389) e config em [`data.js`](./js/data.js#L104-L111)

## Configurações

- `js/data.js`:
  - `backendBaseUrl`: `http://localhost:5000`
  - `adminUser`: `AnaSantos`
  - `adminPass`: `Asantos1969`
  - `whatsappNumber`: `5592984663068`
  - `deliveryFee`, `freeDeliveryThreshold`

## Observações

- Imagens enviadas ficam em `loja-natura/backend/uploads/` e são servidas por `GET /uploads/<filename>`.
- Para produção, recomenda-se:
  - Rodar backend em servidor WSGI (gunicorn/uwsgi)
  - Armazenar imagens em serviço externo (S3/Cloud Storage)
  - Usar autenticação por token e CORS restrito
