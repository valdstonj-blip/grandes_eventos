# 📘 DOCUMENTAÇÃO TÉCNICA FINAL & GUIA OPERACIONAL MESTRE
## Estado-Maior Geral • PM/3 — Grandes Eventos (Operações & Inteligência)

---

## 🏛️ 0. CADEIA DE COMANDO & EQUIPE TÉCNICA OFICIAL (EMG PM/3)

A interface e as assinaturas institucionais seguem a designação em vigor da 3ª Seção do Estado-Maior Geral:

| Função / Posto | Oficial Designado | Atribuição |
| :--- | :--- | :--- |
| **Chefe da PM/3** | **CORONEL CHRISTOPH** | Direção Geral de Operações e Inteligência |
| **Subchefe da PM/3** | **TEN. CORONEL SARMENTO** | Coordenação Operacional e Planejamento Tático |
| **Oficial Encarregado** | **CAPITÃO TRAVAGLIA** | Supervisão de Sistemas, Efetivo e Prontidão |

---

## 🔐 1. AUTENTICAÇÃO, CONTROLE DE ACESSO & GESTÃO DE SENHAS

O sistema possui uma camada de autenticação integrada e persistente para garantir segurança operacional nos terminais de campo e salas de situação.

### 🔑 Credenciais Atuais do Sistema

| Usuário | Senha Padrão | Nível de Acesso | Perfil / Descrição |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`admin`** | **Administrador** | Administrador Geral PM/3 (Acesso irrestrito a relatórios, configurações e dashboards) |
| **`usuario`** | **`123456`** | **Operador** | Operador de Mesa PM/3 (Visualização de dados, filtros e geração de PDF) |

---

### ⚙️ Como Alterar Senhas ou Criar Novos Usuários

Todas as credenciais e validações de login estão centralizadas no arquivo:
📂 `src/components/Login.tsx` (linhas 20 a 42).

#### Passo a Passo para Alteração:
1. Abra o arquivo `src/components/Login.tsx`.
2. Localize a função `handleLogin`:
```typescript
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  // 1. ALTERAR SENHA DO ADMINISTRADOR:
  if (cleanUser === 'admin' && cleanPass === 'SUA_NOVA_SENHA_AQUI') {
    onLogin({
      username: 'admin',
      name: 'Administrador PM/3',
      role: 'admin',
    });
  // 2. ALTERAR SENHA DO OPERADOR:
  } else if (cleanUser === 'operador' && cleanPass === 'SENHA_OPERADOR_2026') {
    onLogin({
      username: 'operador',
      name: 'Operador PM/3',
      role: 'usuario',
    });
  // 3. ADICIONAR NOVO USUÁRIO (EXEMPLO):
  } else if (cleanUser === 'oficial.dia' && cleanPass === 'oficial@2026') {
    onLogin({
      username: 'oficial.dia',
      name: 'Oficial de Dia PM/3',
      role: 'admin',
    });
  } else {
    setError('Usuário ou senha incorretos. Verifique as credenciais.');
  }
};
```
3. A sessão é salva com segurança no `localStorage` do navegador sob a chave `pm3_user_session`, mantendo o operador conectado mesmo se a página for recarregada.
4. O botão **"Sair"** no topo superior direito limpa o token e encerra a sessão imediatamente.

---

## 🏗️ 2. ARQUITETURA GERAL DO PROJETO (DE PONTA A PONTA)

O sistema foi concebido como uma **Single Page Application (SPA)** de alto desempenho, orientada a eventos militares e offline-first:

```
┌──────────────────────────────────────────────────────────────┐
│                      Navegador / Applet                      │
│                                                              │
│  ┌───────────────────────┐        ┌───────────────────────┐  │
│  │   Tela de Autenticação│        │  Menu de Navegação    │  │
│  │   (Login.tsx)         │───────►│  (Layout.tsx)         │  │
│  └───────────────────────┘        └───────────┬───────────┘  │
│                                               │              │
│                 ┌─────────────────────────────┴────────────┐ │
│                 ▼                                          ▼ │
│    ┌───────────────────────────┐         ┌─────────────────┴───────┐
│    │ OcorrenciasDashboard.tsx  │         │FaltasDispensasDashboard │
│    │ • Sincronismo Sheets/CSV  │         │ • Efetivo / Ausências   │
│    │ • KPIs & Gráficos Recharts│         │ • Mapeamento de OPM/CPA │
│    │ • Tabela com Sticky Row   │         │ • Resumo por Fração     │
│    │ • Modal Detalhes Dinâmico │         │ • Relatórios PDF        │
│    │ • Exportação PDF Autotable│         └─────────────────────────┘
│    └─────────────┬─────────────┘                                     │
│                  │                                                   │
│                  ▼                                                   │
│    ┌───────────────────────────┐                                     │
│    │   csvHelper.ts (PapaParse)│                                     │
│    │   + localStorage Cache    │                                     │
│    └─────────────┬─────────────┘                                     │
└──────────────────┼───────────────────────────────────────────────────┘
                   │ Fetch direto
                   ▼
┌──────────────────────────────────────────────────────────────┐
│            Google Sheets (Publicado em Formato CSV)          │
└──────────────────────────────────────────────────────────────┘
```

### Principais Bibliotecas & Tecnologias
- **React 18 + TypeScript:** Tipagem estrita e ciclo de vida otimizado sem re-renders infinitos.
- **Tailwind CSS v4:** Design utilitário militar de alta densidade e legibilidade.
- **Framer Motion (`motion/react`):** Transições fluidas em modais, dropdowns e alertas.
- **Lucide React:** Iconografia tática padronizada.
- **Recharts:** Gráficos de barras interativos e responsivos.
- **PapaParse:** Leitura e sanitização de CSVs brutos em tempo real.
- **jsPDF + AutoTable:** Motor de geração de relatórios formais em PDF com quebra automática de linha.

---

## 🎨 3. DESIGN SYSTEM & IDENTIDADE VISUAL MILITAR (PMERJ / PM/3)

A interface foi projetada para **alta densidade de informação com mínimo cansaço visual** sob luz solar ou ambientes com pouca luz.

### Paleta de Cores Oficial
- **Deep Navy Base (Fundo / Containers):** `#0f172a` (`bg-slate-900`) e `#020617` (`bg-slate-950`).
- **Canvas de Leitura Clara:** `bg-slate-50` para tabelas e dados analíticos.
- **Sky Blue (Destaque & Acentos Táticos):** `text-sky-400`, `bg-sky-500`, `border-sky-500/30`.
- **Emerald Green (Detidos / Sucesso / Online):** `bg-emerald-600`, `text-emerald-400`.
- **Rose Red (Armas / Faltas / Alertas Críticos):** `bg-rose-600`, `text-rose-400`.
- **Amber Gold (Adolescentes / Dispensas / Avisos):** `bg-amber-500`, `text-amber-400`.
- **Cyan / Indigo (Perfurocortantes & Simulacros):** `bg-cyan-500`, `bg-indigo-500`.

### Padrões de Tipografia & Componentes
1. **Badges & Cabeçalhos:** Letras maiúsculas, peso pesado e espaçamento expandido:
   `text-[10px] font-black uppercase tracking-widest`.
2. **Estatísticas e Quantitativos:** Fonte monoespaçada para alinhamento vertical perfeito:
   `font-mono font-black text-xs sm:text-sm`.
3. **Tabela "Sticky Shield":**
   - Cabeçalho flutuante: `sticky top-0 z-20 bg-slate-900 text-sky-300`.
   - Rodapé de totais acumulados flutuante: `sticky bottom-0 z-20 bg-slate-900 text-white shadow-lg`.
   - Linhas com hover suave: `hover:bg-sky-50/70 transition-colors`.

---

## 🛠️ 4. HISTÓRICO DE CORREÇÕES & REFINAMENTOS CRÍTICOS REALIZADOS

Nesta versão foram sanados problemas de negócio e de infraestrutura:

### 1. Correção Lógica de Agregação (Pessoas vs. Materiais)
- **Problema Anterior:** O painel acumulava em uma única soma números de naturezas distintas (ex: 2 adultos presos + 1 arma apreendida = 3 "total", o que gerava inconsistência matemática na tomada de decisão).
- **Solução Implementada:** O cálculo foi estritamente segregado em dois eixos independentes:
  - **`Detidos (Pessoas)`**: Soma exclusiva de `Adultos Presos` + `Adolescentes Apreendidos`.
  - **`Materiais (Armas/Obj.)`**: Soma exclusiva de `Armas de Fogo` + `Perfurocortantes` + `Simulacros`.
  - Os gráficos e tabelas agora exibem colunas e cards distintos com cores táticas separadas.

### 2. Resiliência Offline-First (Cache Local)
- Toda sincronização bem-sucedida armazena os dados em `localStorage` (`cache_ocorrencias` e `cache_faltas`).
- Caso a conexão com a internet caia no meio do evento ou o Google Sheets atinja limites de requisição, o sistema mantém os últimos dados disponíveis na tela sem quebrar a interface.

### 3. Normalização e Sanitização de CSV
- Criação da função `normalize()` que remove acentos, espaços duplos e variações de maiúsculas/minúsculas dos cabeçalhos da planilha (ex: `OPM `, `Opm`, `opm/unidade` são reconhecidos uniformemente).
- Filtragem inteligente de colunas identificadoras (CPF, RG, Matrícula) para evitar somas falsas de números de documentos.

### 4. Arquitetura do Módulo de Faltas & Efetivo Operacional
- **Escopo Exclusivo de Faltas:** Foco estrito em desfalques e policiais ausentes nas escalas de grandes eventos e operações extraordinárias.
- **Parser Inteligente de Militares Faltosos:** Analisa registros com múltiplos nomes/RGs separados por ponto-e-vírgula (`;`) ou quebras de linha na coluna `IDENTIFICAÇÃO DO POLICIAL FALTOSO`, quantificando e separando com precisão cada policial ausente.
- **Doutrina de Local de Apresentação vs. OPM de Origem:**
  - **Unidade Demandante / Local de Apresentação:** Batalhão ou comando que recebeu o formulário e onde o serviço foi desfalcado (ex: `18° BPM`).
  - **Unidade de Origem do Policial:** OPM de lotação administrativa do militar faltoso (ex: `14° BPM`, `16° BPM`).
  - O painel fornece um alternador dinâmico de visualização para os gráficos táticos.
- **Tabela de Informações de Faltas:** Cada militar faltoso é renderizado em cards táticos individuais empilhados, garantindo legibilidade perfeita sem criar linhas infinitas na tela.
- **Relatório PDF Operacional Limpo:** Exportação orientada à ação imediata, sem carimbos desnecessários, com tabela formal consolidada contendo OPM de apresentação, oficial responsável, turno e identificação completa dos faltosos.

---

## 🌐 5. GUIA DE SINCRONIZAÇÃO COM GOOGLE SHEETS

### URLs e Endpoints Oficiais Configurados:

1. **Módulo de Ocorrências (PM/3):**
   - Publicado na Web como CSV.
2. **Módulo de Faltas & Efetivo Operacional:**
   - **URL Publicada Oficial:** `https://docs.google.com/spreadsheets/d/e/2PACX-1vTYtx0hTBc1HWdOieZcs-ywXV-usnc8jHwl8Z6LU1376oj71eaRgT_p1zYix-RvZHIWOQ5F5icxUM9_/pub?output=csv`

Para conectar novas planilhas:

1. No Google Sheets, clique em **Arquivo (File)** > **Compartilhar (Share)** > **Publicar na Web (Publish to the web)**.
2. Selecione a aba desejada (ou documento inteiro).
3. No formato de exportação, escolha estritamente **Valores separados por vírgula (.csv)**.
4. Clique em **Publicar**.
5. Copie o link gerado ou extraia o `SHEET_ID` e o `GID` da URL.

---

## 🚀 6. GUIA DE IMPLANTAÇÃO (GITHUB PAGES & VERCEL)

### Como Fazer Deploy na Vercel:
1. Conecte o repositório no [Vercel Dashboard](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Se usar roteamento SPA, garanta um arquivo `vercel.json` na raiz:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Como Fazer Deploy no GitHub Pages:
1. No arquivo `vite.config.ts`, garanta o caminho relativo base:
```typescript
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
```
2. No GitHub, vá em **Settings > Pages > Build and deployment > Source: GitHub Actions** (ou configure o deploy da branch `gh-pages` com a pasta `dist`).

---

## 🌟 7. "GOLDEN PROMPT" (PROMPT MESTRE PARA NOVOS PROJETOS)

Copie e cole este prompt para recriar novos módulos ou sistemas com o mesmo nível de excelência:

```text
Aja como um Engenheiro de Software Principal especialista na doutrina militar de desenvolvimento de sistemas de alta prontidão (EMG PM/3). Crie uma aplicação completa em React 18, TypeScript, Tailwind CSS e Vite com as seguintes diretrizes estritas:

1. IDENTIDADE VISUAL & DESIGN SYSTEM MILITAR:
- Fundo base em 'bg-slate-50' com contêineres de comando e headers em Deep Navy ('bg-slate-900' / 'bg-slate-950').
- Acentos táticos em Sky Blue ('text-sky-400', 'bg-sky-500/20', 'border-sky-500/30').
- Cores semânticas rígidas: Verde Esmeralda para Pessoas Detidas/Online, Vermelho Rose para Armas/Alertas, Âmbar para Adolescentes/Avisos, Azul Ciano/Índigo para Perfurocortantes e Simulacros.
- Tipografia: Menus e rótulos em MAIÚSCULAS com 'tracking-widest font-black text-xs'. Dados numéricos em 'font-mono font-black'.

2. AUTENTICAÇÃO INTEGRADA:
- Tela de login tática com persistência em localStorage ('pm3_user_session'), perfis 'admin' e 'operador', e logout seguro no header.

3. CONEXÃO COM GOOGLE SHEETS (OFFLINE-FIRST & NORMALIZAÇÃO INTELIGENTE):
- Leitura direta de CSV via PapaParse com fallback para 'localStorage'.
- Função de normalização de strings (remover acentos, pontuações e espaços extras) para mapear colunas com nomes variáveis.
- SEPARAÇÃO CONCEITUAL OBRIGATÓRIA: Nunca somar pessoas com materiais. Agrupar em 'Pessoas Detidas' (Adultos + Adolescentes) e 'Materiais Apreendidos' (Armas + Objetos).

4. TABELAS DE ALTA DENSIDADE (STICKY ROW SECURITY):
- Scroll vertical com 'thead' fixo no topo ('sticky top-0 z-20 bg-slate-900 text-sky-400') e 'tfoot' fixo na base com totais consolidados.
- Modal de Auditoria ao clicar em qualquer linha, formatando relatos extensos com 'whitespace-pre-wrap font-mono uppercase'.

5. RELATÓRIOS FORMAIS EM PDF (jsPDF + AUTOTABLE):
- Exportação em A4 Paisagem ('landscape') com formatação oficial do Estado-Maior, quebra automática de linha ('overflow: linebreak') e divisão limpa entre estatísticas e histórico de relatos.
```

---
**EMG-PM/3 • Grandes Eventos • 2026**
