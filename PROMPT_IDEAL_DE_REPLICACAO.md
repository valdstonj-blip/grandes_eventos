# 🚀 PROMPT IDEAL: Replicação e Extensão de Dashboards Militares (PM/3)

Este documento foi criado para ser **totalmente independente** de outros arquivos do projeto. Ele serve como o guia definitivo e o **Prompt de Engenharia ("Golden Prompt")** que você pode copiar e colar diretamente em qualquer modelo de Inteligência Artificial para gerar ou alterar sistemas com a mesma identidade de elite, conexões robustas com planilhas e relatórios impecáveis em PDF.

---

## 📋 1. O Prompt Ideal para Geração/Replicação de Módulos (Copie & Cole)

Cole o seguinte prompt na IA quando quiser expandir o sistema com um novo módulo (ex: Logística, Recursos Humanos, Operação X) ou recriar a arquitetura atual:

```text
Aja como um Engenheiro de Software Principal especialista na doutrina militar de desenvolvimento de sistemas. Seu objetivo é criar um módulo de dashboard em React, Vite e Tailwind CSS extremamente polido, resiliente e funcional com as seguintes diretrizes estritas:

1. IDENTIDADE VISUAL MILITAR (DESIGN SYSTEM DE ELITE)
- Background Base: Use um fundo claro limpo e profissional com 'bg-slate-50'.
- Contêineres Principais: Use azul-marinho militar (Navy: Slate-900 / Slate-950) para os headers, rodapés e barras de comando superiores.
- Contraste Técnico: Use azul-celeste (Sky: text-sky-400 / hover:bg-sky-50) para links e rótulos selecionados.
- Tipografia: Menus técnicos, status e badges em MAIÚSCULAS com espaçamento amplo ('tracking-widest' ou 'tracking-wider font-extrabold text-xs'). Números com tipografia Monoespaçada ('font-mono') e peso extraforte ('font-black') para leitura rápida de estatísticas.

2. CONEXÃO COM GOOGLE SHEETS COM PERSISTÊNCIA (OFFLINE-FIRST)
- Conexão Direta por CSV: Desenvolva uma lógica que faça 'fetch' diretamente no link do Google Sheets publicado na web em formato CSV (terminando em 'output=csv&gid=X').
- Resiliência Total de Rede: Se a internet oscilar ou o servidor do Google cair, o sistema deve ler os dados silenciosamente do 'localStorage', garantindo que o operador nunca veja uma tela vazia.
- Badge de Status de Conexão: Exiba um badge visual no canto superior com um indicador animado de pulso ('animate-pulse'). Mostre verde "SINC_OK" (quando os dados forem recém-carregados da rede) ou âmbar "CONTEÚDO EM CACHE" (se houver falha de rede e os dados forem recuperados do cache local), incluindo a informação da última sincronização bem-sucedida.

3. ALGORITMO INTELIGENTE DE SOMA E NORMALIZAÇÃO (PROVA DE FALHAS)
- Planilhas preenchidas manualmente contêm acentos variados ou espaços extras. Implemente uma função pura que normalize as chaves do objeto removendo acentos, caracteres especiais e colapsando espaços.
- Implemente uma soma flexível por correspondência de padrões duplos nas colunas da tabela de dados: ex: somar valores que contenham na coluna a palavra 'falta' E 'poo' para o grupo correspondente, eliminando falsos positivos criados por colunas identificadoras (CPF, RG, Matrícula) por meio de uma lista negra ('blacklist') de palavras-chave.
- Se o campo contiver termos como "X", "SIM", "S", interprete como peso numérico '1'.

4. TABELA MILITAR REFORÇADA (STICKY ROW SECURITY)
- Crie uma tela de dados com scroll vertical interno de altura limitada ('max-h-[550px]') onde o Header de Colunas ('thead') fique flutuando ('sticky top-0 z-20 bg-slate-900 text-sky-400') e o Footer de Totais ('tfoot') fique flutuando na parte inferior ('sticky bottom-0 z-20 bg-slate-900 text-white shadow-lg').
- As linhas da tabela devem ser clicáveis para abrir um Modal de Detalhes Completo em formato de Grid adaptativo.

5. MODAL DE DETALHES DE ALTA DENSIDADE
- O cabeçalho do modal deve manter o design do sistema (Slate-950 com acentos Sky Blue).
- Ocultar Rótulos Administrativos: Exclua informações administrativas irrelevantes (carimbos de tempo, emails de formulário) e dê foco aos dados do fato histórico ou do contingente.
- Dinâmica e Relatos: Campos de relato longo devem utilizar estilos pré-formatados ('whitespace-pre-wrap font-mono uppercase text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 border border-slate-200 rounded-2xl block w-full') para manter a integridade visual original inserida pelo oficial.

6. RELATÓRIOS INDEPENDENTES E LIMPOS EM PDF (jsPDF + AUTOTABLE)
- Adicione um botão para exportar a listagem atual para PDF usando 'jspdf' e 'jspdf-autotable' em formato de paisagem ('l', 'pt', 'a4') para evitar estouro de margens laterais.
- A tabela impressa deve usar as cores oficiais da corporação nos headers ('fillColor: [15, 23, 42]' para Deep Navy, e text-sky-400, com 'alternateRowStyles' usando '#f8fafc').
- Habilite a quebra de linha por célula utilizando 'overflow: linebreak' para evitar perda de descrições e relatos longos nas margens da folha.

7. RESOLUÇÃO AUTOMÁTICA DE TELA EM BRANCO (GITHUB PAGES ROUTING PATCH)
- O index.html do projeto deve conter um script imediato para lidar de forma nativa com redirecionamentos errados de barra final ('trailing-slash') em ambientes do GitHub Pages para evitar carregamento incorreto absoluto dos caminhos de bundle.
```

---

## 🎨 2. Especificação Técnica da Identidade Visual

Nossos dashboards militares devem ser desenvolvidos de forma a transmitir **seriedade e precisão operacional**.

### Guia Rápido de Classes CSS e Cores:
*   **Fundo Geral:** `bg-slate-50`
*   **Barra Superior e Headers:** `bg-slate-900` ou `bg-slate-950`
*   **Cartões de KPI (Destaques):** `bg-white border border-slate-100 shadow-xl rounded-2xl`
*   **Bordas Suaves:** `border border-slate-100` ou `border-slate-200/60`
*   **Indicadores Rápidos (Faltas/Dispensas):**
    *   Faltas POO: Vermelho Intenso (`bg-rose-50 border-rose-100 text-rose-600`) ou laranja vibrante (`bg-orange-50 text-orange-600`).
    *   Dispensas POO/POE: Azul Clássico (`bg-blue-50 text-blue-600`) ou indigo (`bg-indigo-50 border-indigo-100 text-indigo-600`).

---

## 📊 3. Modelo Operacional de Conexão com Planilhas Google

Para integrar uma planilha de dados dinâmicos ao dashboard, siga este protocolo unificado:

```
                  ┌──────────────────────┐
                  │ Google Sheets Online  │
                  └──────────┬───────────┘
                             │
                  (Exportar como CSV na Web)
                             │
                             ▼
                  ┌──────────────────────┐
                  │ URL com "?output=csv"│
                  └──────────┬───────────┘
                             │
           (Fetch seguro com tratamento Offline-First)
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
  [Sucesso de Conexão]                     [Sem Internet / Erro]
  - Converte CSV em JSON Data              - Carrega dados salvos em Cache
  - Atualiza localStorage                  - Exibe badge de ALERTA / OFFLINE
  - Exibe badge flutuante "SINC_OK"        - Carrega última sincronização
```

---

## 📄 4. Engenharia de PDF usando jsPDF Autotable

O gerador do relatório exportável foi projetado para produzir as mesmas folhas de controle militar enviadas aos gabinetes de decisão.

### Propriedades Definidas para Impressão Impecável:
1.  **Modo Paisagem:** Permite apresentar relatos textuais longos e múltiplos dados numéricos lado a lado sem achatar a visualização.
2.  **Acentos de Estilo:**
    *   Cores do Header: `fillColor: [15, 23, 42]` (Militar Navy) que confere forte contraste com as fontes.
    *   Zebra-Striping: `alternateRowStyles: { fillColor: [248, 250, 252] }` para facilitar o acompanhamento visual das linhas do efetivo.
3.  **Quebra Dinâmica de Células:** O script força a autoajustabilidade por coluna. Desta forma, todas as passagens inseridas no campo "Dinâmica" ou "Relato de Ocorrência" são perfeitamente impressas sem truncamento ou vazamento de margem.

---

**Nota de uso:** Mantenha este roteiro isolado de replicação arquivado. Com ele, você poderá restaurar, recriar ou duplicar este painel tático para qualquer unidade militar ou setorial de inteligência do Estado-Maior no futuro com poucos cliques!
