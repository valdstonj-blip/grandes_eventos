# 🎖️ Manual Mestre de Desenvolvimento: Dashboard Militar Professional

Este documento é um guia de nível **Sênior** projetado para orientar a criação e evolução de sistemas de alta prontidão e confiabilidade, utilizando o padrão visual e técnico do EMG PM/3.

---

## 1. Arquitetura e Identidade Visual (Design System)

Um sistema militar exige **densidade de informação** sem perder a **clareza**. O design deve transmitir autoridade e organização.

### A. Paleta de Cores e Tipografia
*   **Background Geral:** `bg-slate-50` (Transmite limpeza e foco).
*   **Acentos Navy (Autoridade):** `#0f172a` (Slate 900) para Header e Footer.
*   **Cards de Dados:** `bg-white` com `shadow-xl` e bordas sutis `border-slate-200`.
*   **Tipografia:** Letras MAIÚSCULAS com `tracking-widest` para rótulos técnicos. Números em `font-black` para rápida leitura de estatísticas.

### B. O Componente de Tabela "Fiel"
A tabela deve ser tratada como um banco de dados visual:
*   **Sticky Header:** O cabeçalho deve estar sempre visível (`sticky top-0`). Use `bg-slate-900` e texto `sky-400` para contraste.
*   **Sticky Footer:** O rodapé de totais deve "flutuar" no final da rolagem (`sticky bottom-0`) usando `bg-slate-900` e `text-white` para destacar a soma final.
*   **Interatividade:** Cada linha deve ser um `motion.tr` com `hover:bg-sky-50`. O clique deve disparar um Modal de detalhes.

---

## 2. Ecossistema de Dados: Sincronização Google Sheets

O maior erro em sistemas de dashboards é a dependência de um banco de dados complexo quando uma planilha resolve.

### A. Preparação da Planilha (A Raiz da Verdade)
1.  **Publicação:** A planilha Google DEVE ser publicada via **Arquivo > Compartilhar > Publicar na Web**.
2.  **Formato:** Escolha **Valores Separados por Vírgula (.csv)**.
3.  **Link Direto:** O link deve terminar em `output=csv`. Este é o link que o sistema consumirá.

### B. Lógica de Sincronização (Sync & Persistence)
*   **Fetch Robusto:** O sistema deve buscar o CSV, converter em JSON e salvar no `localStorage`. Isso garante que, se a internet falhar ou a planilha estiver fora do ar, o usuário veja os **últimos dados carregados**.
*   **Tratamento de Strings:** Planilhas manuais têm erros (espaços extras, acentos). Use uma função de "Limpeza de Chaves" para transformar `Qtd. Armas ` em `armas`. Isso evita que o código quebre por causa de um espaço.
*   **Badge de Status:** Implemente um badge visual (ex: `Registros Ativos`) com uma animação de "pulso" (`animate-pulse`) em verde, indicando que a conexão com a planilha está viva.

---

## 3. Inteligência de Soma e Normalização

Não mapeie colunas pelo nome exato. Crie uma lógica que procure padrões:
*   **Regra de Soma:** Varra as colunas. Se o nome contiver "Qtd", "Total", "Adulto" ou "Arma", e o valor for um número válido (menor que um limite razoável, ex: 1000, para evitar somar RGs/CPFs), adicione ao acumulador.
*   **Campos de Texto:** Colunas que contenham "Dinâmica", "Relato" ou "Observação" devem ser tratadas como texto longo e exibidas com `whitespace-pre-wrap` para manter a formatação original do usuário.

---

## 4. Modal de Detalhes (High Density)

O modal não deve apenas repetir a linha, mas expandir a informação.
*   **Grid Adaptativo:** Use um grid de 2 colunas para campos curtos (Datas, IDs) e 1 coluna total para campos longos (Relatos).
*   **Foco Visual:** O cabeçalho do modal deve ser `bg-slate-950` com ícone em `sky-400` para manter a identidade.

---

## 5. Engenharia de PDF Professional

O PDF é o documento de exportação oficial. Ele deve ser impecável.
*   **Biblioteca:** Utilize `jspdf` com `jspdf-autotable`.
*   **Cabeçalho Oficial:** Insira o Brasão ou o nome da Unidade centralizado.
*   **Formatação de Tabela:**
    *   Use cores alternadas nas linhas (`alternateRowStyles`).
    *   Células com números devem ter `halign: 'center'`.
    *   Textos longos devem usar a propriedade `columnStyles` para definir uma largura máxima e permitir a quebra de linha automática.
*   **Rodapé de Página:** Adicione data/hora da geração e numeração de páginas (`Página X de Y`).

---

## 6. O Prompt de Criação Perfeito (Engenharia de Prompt)

Para que a IA gere um sistema com este nível de detalhe, copie e cole este comando:

> "Construa um Dashboard Profissional com a seguinte estrutura:
> 1. **Layout Militar:** Use Navy (#0f172a) nos containers principais e Slate 50 no fundo.
> 2. **Sincronização:** Implemente um `fetch` para CSV do Google Sheets com persistência em `localStorage`. Adicione um botão 'Sincronizar' com ícone de Refresh.
> 3. **Tabela Avançada:** Crie uma tabela com `max-h-[600px]`, cabeçalho e rodapé de totais FIXOS (sticky). As linhas devem ser clicáveis para abrir um Modal de Detalhes em Grid.
> 4. **Filtro Inteligente:** Adicione um campo de busca que filtre todas as colunas simultaneamente.
> 5. **Exportação PDF:** Configure `jspdf-autotable` para gerar um relatório profissional com cabeçalho da Unidade e totais de produtividade destacados.
> 6. **Visual:** Use ícones da biblioteca `lucide-react` e animações da `motion/react` para transições suaves."

---
**Nota Técnica:** Este manual deve ser seguido como base para qualquer novo módulo (Faltas, Ocorrências, Logística), garantindo que todos os aplicativos da sua suíte pareçam ter sido feitos pela mesma equipe de elite.
