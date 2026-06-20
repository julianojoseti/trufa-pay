# TrufaPay Casamento

## Objetivo
Manter paridade de versão entre ambiente local, Git e Vercel para evitar conflitos.

## Regras de versão
- Node: 22.x
- npm: 10.x
- Dependências travadas em versões exatas no package.json
- Instalação sempre com npm ci

## Rodar local
1. npm ci
2. npm run dev

## Fluxo único de release
1. Desenvolver em branch local
2. Rodar npm ci e npm run build
3. Commitar mudanças de código
4. Fazer push para main
5. Deixar a Vercel publicar a partir do commit da main

## Política de deploy
- Evitar deploy manual com npx vercel --prod quando o objetivo for manter rastreabilidade exata com Git.
- A referência oficial de produção deve ser sempre o commit que está na main.
