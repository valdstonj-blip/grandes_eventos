# 🎖️ Manual Mestre de Desenvolvimento: Dashboard Militar Profissional (V3 - Suprema)

Este documento é o guia definitivo de nível **Sênior / Principal Engineer** projetado para orientar a criação, manutenção e evolução de sistemas de alta prontidão e confiabilidade operacional (EMG PM/3). Ele condensa as melhores práticas aplicadas à arquitetura do seu dashboard.

---

## 1. Arquitetura e Identidade Visual (Design System de Alta Prontidão)

Mapeamento visual rigoroso baseado na doutrina de design utilitário-militar. O objetivo é a **máxima densidade com mínima fadiga cognitiva**.

### A. Paleta de Cores e Hierarquia Tipográfica
*   **Background Base:** `bg-slate-50` (fundo claro ideal para leitura contínua).
*   **Contêineres Principais (Navy):** `#0f172a` (`slate-900`/`slate-950`). Transmite solidez, segurança e estabilidade institucional.
*   **Contraste do Sistema (Sky Blue):** `sky-400` / `sky-500` para destaque técnico e indicadores de status.
*   **Tipografia Híbrida Inteligente:**
    *   Exibições de Status/Prefixos: Letras **MAIÚSCULAS** com `tracking-widest` (ex: `tracking-[0.2em] font-black text-xs`).
    *   Dados Quantitativos: Tipografia Monoespace (`font-mono`) com espessura pesada (`font-black`/`font-extrabold`) para evitar desalinhamento visual de casas numéricas.

### B. O Componente de Tabela "Fiel" (The Sticky Shield)
A tabela deve se comportar como uma folha de cálculo estática, mas com transição fluida:
*   **Contenção Vertical:** Limite de altura fixo (`max-h-[600px]`) envelopado por uma div com `overflow-auto`.
*   **Sticky Header:** O cabeçalho da tabela deve flutuar com `sticky top-0 z-20 bg-slate-900 text-sky-400` para que os rótulos de dados nunca sumam de vista na rolagem.
*   **Sticky Footer (Totalizador Geral):** O rodapé deve usar `sticky bottom-0 z-20 bg-slate-900 border-t border-slate-800` com uma sombra superior discreta para dar a sensação de flutuação, garantindo acessibilidade imediata ao total acumulado em qualquer altura da rolagem.
*   **Hover Interativo Inteligente:** Cada linha (`motion.tr` ou `tr`) deve receber transição suave e destacar itens em `hover:bg-sky-50/70`.

---

## 2. Ecossistema de Sincronização Google Sheets (Offline-First)

Mapeie e processe dados em silos separados de forma desacoplada, utilizando memória volátil secundária como barreira de segurança contra quedas de sinal.

### A. Preparação e Linkagem de Planilhas Independentes
1.  **Modo de Exportação:** Toda e qualquer planilha deve ser publicada individualmente na web (**Arquivo > Compartilhar > Publicar na Web**).
2.  **Formato do Link:** Escolha estritamente o formato **CSV (Valores Separados por Vírgula)** e extraia o hash de identificação (`SHEET_ID`) e o identificador do subpainel (`GID`).
3.  **URLs Dedicadas:** Armazene os links em constantes globais centralizadas no topo do módulo. Exemplo:
    ```typescript
    const G_SHEET_CSV_URL = (id: string, gid: string) => `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    ```

### B. Mecanismo de Cache e Sincronismo (The Resilient Handshake)
*   **Políticas de Retentativa:** Ao engajar em requisições assíncronas do Sheets, o app de ponta deve tentar receber os dados mais novos. Se por ventura ocorrer falha de rede ou timeout (Servidor do Google offline), leia **silenciosamente** os dados indexados pelo `localStorage`.
*   **Badge de Sincronização Inteligente:** Indique de onde vieram os dados carregados usando badges transparentes com animação infinita de pulso (`animate-pulse`). Exiba visualmente a string "ONLINE" em verde se vier de requisição fresca, ou "CACHE LOCAL" em âmbar/cinza com a data e hora em que ocorreu a última coleta bem-sucedida.

---

## 3. Inteligência de Busca, Soma e Normalização (Sem Quebra de Código)

A entrada de dados em planilhas mantidas por humanos é falha por natureza: espaços à esquerda, acentos inesperados e mistura de minúsculas e maiúsculas. O sistema deve tratar essa bagunça internamente.

### A. Algorítmo de Normalização de Chaves
Antes de ler ou processar colunas, use uma função pura para expurgar caracteres especiais, acentos, pontuações e espaçamento indevido dos cabeçalhos. Isso garante o funcionamento dinâmico do sistema mesmo se o operador mudar "Ocorrência " para "Ocorrencia":
```typescript
const normalize = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Limpa acentos
    .trim()
    .replace(/\s+/g, " "); // Colapsa múltiplos espaços em um único espaço comum
};
```

### B. Formulação Acumulativa por Duplo Padrão (Double Pattern Matching)
Para extrair taxas específicas agrupadas (como Faltas no grupo POO vs Faltas no grupo POE), desenvolvemos a busca matricial flexível combinada:
*   **Lógica de Atribuição:** Vasculhe as colunas em busca da existência de DOIS termos simultâneos (ex: `'falta'` e `'poo'`).
*   **Prevenção de Falsos Positivos:** Bloqueie do totalizador colunas identificadoras (como CPF, RG, Número de Matrícula, Hora de Escala) varrendo listas pretas (`blacklist`) de palavras-chave.
*   **Validação de Tipo Dinâmica:** Se o conteúdo da coluna for texto textual descritivo (`"SIM"`, `"X"`, `"S"`), mapeie o peso como `1`. Se o valor puder ser reduzido a um dígito numérico, parses e somas devem ocorrer com o cuidado de ignorar números muito altos (ex: `> 1000`), blindando os totais contra inclusões indevidas de números de Registro Geral (RG) na soma.

---

## 4. Modal de Detalhes de Alta Densidade (O Painel de Auditoria)

O modal de visualização de linha não serve apenas para replicar os dados da tabela, mas para focar e formatar a leitura de ocorrências longas de maneira limpa.

*   **Filtro Antirruído:** No modal, oculte colunas que guardem apenas automação ou controle (Ex: `Email`, `Carimbo de Data/Hora`, `Última Modificação`). Guarde a atenção do oficial estritamente nos dados de combate (Nomes, Quantitativos, Relato de Ocorrência).
*   **Tratamento de Descrições Longas (Textarea Natural):** Textos extensos (relatos de Obras, Ocorrências, Dinâmica do Fato) devem obrigatoriamente usar estilos de texto pré-formatados com a classe `whitespace-pre-wrap font-mono uppercase text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 block w-full`. Isso preserva as quebras de linha que o relator inseriu diretamente no formulário ou na planilha.
*   **Mapeamento em Grid Adaptativo:** Use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` para exibir dados breves em minifichas rotuladas.

---

## 5. Engenharia de PDF Profissional Sem Quebra de Margem

O download de relatório do dashboard precisa seguir as diretrizes formais de documentação do Estado-Maior. Um PDF desalinhado destrói a percepção de seriedade governamental.

*   **A Biblioteca Recomendada:** Sempre utilize `jspdf` integrada à extensão `jspdf-autotable`.
*   **Ajuste de Margem e Quebra Automática:** Use o modo de tabela auto-ajustável (`columnStyles` e `styles: { overflow: 'linebreak' }`). Isso força o motor de renderização a calcular os limites de cada coluna e quebrar as descrições em múltiplas linhas perfeitamente horizontais, em vez de vazarem pelas laterais da impressão.
*   **Definição do Formato Paisagem (`Landscape`):** Se a tabela tiver mais de 4 ou 5 colunas de controle, inicie a instância em modo paisagem (`l`, `pt`, `a4`) para desfrutar da largura máxima oferecida pelo papel A4.
*   **Camada Superior de Estilo:**
    ```typescript
    headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248], fontStyle: 'bold' }
    ```
    Isso desenha cabeçalhos no azul marinho militar com textos em azul celeste para máxima definição e elegância visual.

---

## 6. Correção de Rotas para GitHub Pages (Blank Screen / Trailing Slash Patch)

### O Problema do URL do GitHub Pages (Bypass de 404 de Assets)
Ao implantar aplicativos construídos em React/Vite no GitHub Pages sob repositórios criados em subpastas (ex: `https://seu-usuario.github.io/seu-repositorio`), o navegador muitas vezes tenta carregar recursos a partir do diretório raiz global da conta de hospedagem, resultando em uma incômoda tela em branco e erros `404` nos arquivos estáticos.

### A Solução Estática Baseada em Javascript (Imperativa & Universal)
Para garantir que o usuário não se depare com uma tela em branco caso digite o link sem a barra final (`/`), inserimos este script de auto-resolução no `<head>` do arquivo principal `index.html`. Esta função analisa se o domínio hospeda o aplicativo no ambiente do GitHub Pages e injeta dinamicamente o redirecionamento com a barra final `/` apropriada antes que o restante do pacote JavaScript quebre o caminho absoluto das origens de recursos:

```html
<script>
  (function() {
    var path = window.location.pathname;
    if (window.location.hostname.endsWith('github.io') && !path.endsWith('/') && !path.split('/').pop().includes('.')) {
      window.location.replace(window.location.href + '/');
    }
  })();
</script>
```

Sempre mantenha esta configuração ativa na raiz de desenvolvimento. Ela remove a necessidade de intervenção por parte dos usuários e de redirecionamentos adicionais complexos integrados ao provedor de hospedagem de código estático.

---
**Nota Técnica:** Este manual estabelece um patamar de alta engenharia, garantindo um sistema operacional de blindagem máxima de tráfego, design imponente e integridade matemática impecável para todos os módulos (Ocorrências, Escalas, Faltas e Dispensas).

