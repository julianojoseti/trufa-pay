# TrufaPay Casamento Online

Versão evoluída da POC com:

- Login
- Modo demo/local sem Firebase
- Preparado para Firebase Authentication
- Preparado para Firestore Database
- Dashboard da meta do casamento
- Histórico de vendas
- Controle de clientes
- Sabores e estoque
- Cobrança por WhatsApp
- Exportação CSV

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse a URL mostrada no terminal, normalmente:

```bash
http://localhost:5173
```

## Login no modo demo

```text
E-mail: admin@trufapay.com
Senha: 123456
```

## Ativar Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication com Email/Senha.
3. Crie o Firestore Database.
4. Copie `.env.example` para `.env`.
5. Preencha as variáveis com as chaves do seu app web Firebase.
6. Rode novamente:

```bash
npm run dev
```

## Publicar no Vercel

1. Suba o projeto para o GitHub.
2. Importe no Vercel.
3. Configure as variáveis de ambiente do Firebase no Vercel.
4. Faça o deploy.

## Observação importante

Sem configurar Firebase, o sistema funciona em modo demo/local usando o navegador. Com Firebase configurado, os dados ficam online e podem ser acessados por mais de um dispositivo.
