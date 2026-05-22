# 📘 Documentação Técnica e Guia de Prompts - Versão 2.0 (PONTO DE BASE)

Este documento detalha o estado final do sistema **ESTADO MAIOR GERAL PM/3 - Show Shakira 2026**.

## 1. Arquitetura de Sincronização
O sistema funciona 100% no lado do cliente (SPA - Single Page Application).
- **Dados:** Processa CSV bruto do Google Sheets.
- **Cache:** Utiliza `localStorage` para garantir que o dashboard não fique vazio enquanto a nova sincronização é processada.

## 2. Refinamentos Mobile (Design Cirúrgico)
O dashboard foi adaptado para uso em campo por policiais via smartphone:
- **Abreviaturas Inteligentes:** No celular, "Estado Maior Geral PM/3" torna-se "EMG-PM/3" para evitar quebra de layout.
- **Controles Compactos:** Botões de busca e ação agora utilizam grids de 2 colunas e ícones menores em telas pequenas.
- **Modais Full-Screen:** Em celulares, os modais de detalhes ocupam a parte inferior da tela, facilitando o toque com o polegar.

## 3. Gestão de Dados em Massa (Tabelas Fixas)
Para suportar o alto volume de registros durante o evento:
- **Scroll Infinito:** Adicionamos barras de rolagem vertical (`max-h-[600px]`) nas tabelas.
- **Sticky Header/Footer:** O cabeçalho (nomes das colunas) e o rodapé (totais acumulados) permanecem fixos enquanto o usuário rola a lista de dados.
- **Estilização:** Tabelas em modo itálico para facilitar a leitura rápida de dados técnicos, com cabeçalhos em Slate 900 (Azul Marinho) e texto em Sky 400.

## 4. Lógica de Busca e Identidade
- **Ocorrências:** A tabela principal foca no "Email" (identificador de envio) e "PCA" (Posto de Controle), deixando o detalhamento de RG/Posto/Guerra para o Modal de Detalhes.
- **Faltas/Dispensas:** Sincronização automática de efetivo com contagem visual através de "badges" coloridos (Vermelho para Faltas, Indigo para Dispensas).

## 5. Relatórios Gerenciais (PDF Analítico)
A exportação de PDF evoluiu para um modelo de inteligência de dados:

### A. Aba de Ocorrências
- **Página 1 (Produtividade):** Mantém o resumo quantitativo geral e a tabela de produtividade por PCA (Posto de Controle).
- **Página 2 (Dinâmicas):** Uma nova seção dedicada aos relatos históricos.
- **Logística de Exibição:** Utilizamos uma tabela de 3 colunas (Data/Hora, PCA/Turno e Dinâmica). O horário é extraído do "Carimbo de Data/Hora" e formatado com quebras de linha para economizar espaço horizontal.

### B. Aba de Ausências
- **Filtro Inteligente:** Diferente do dashboard, o PDF de ausências ignora registros onde os valores são zero. Ele lista apenas o efetivo que possui faltas ou dispensas confirmadas.
- **Detalhamento Consolidado:** Criamos uma coluna de "Motivo / Observação" que varre campos de texto da planilha em busca de justificativas, unindo-as em um único parágrafo por policial ausente.

## 6. Identidade Visual e Design System (UI/UX)
O sistema segue um padrão de **High-Density Dashboard** (Alta Densidade de Dados), focado em legibilidade em ambientes sob estresse:

- **Paleta de Cores (Tailwind CSS):**
  - **Background:** `bg-slate-950` (Azul Profundo - Fundo principal).
  - **Cards/Tabelas:** `bg-slate-900/40` com bordas `border-white/5`.
  - **Identidade de Dados:** Cabeçalhos em Azul Marinho (`Slate 900`) e textos técnicos em Sky 400.
  - **Status:** Emerald para sistemas ativos e Rose/Amber para alertas operacionais.
- **Interatividade:**
  - **Modais:** Transições suaves usando `framer-motion` para foco total na informação detalhada.
  - **Filtros:** Busca em tempo real que varre todas as colunas dinamicamente.
  - **Sinalizador:** Efeito `pulse` no ícone de monitoramento para feedback visual de sincronização.

## 🚀 Guia de Clonagem e Reutilização
Para criar novos sistemas baseados nesta arquitetura para outras planilhas, com foco em produtividade e design de alta densidade, consulte os manuais específicos:
- **`GUIA_REUTILIZACAO.md`**: Guia básico de publicação de planilhas.
- **`GUIA_REUTILIZACAO_V2.md`**: Guia avançado com o **Prompt Mestre** e especificações de Design System.

---
## 🛠 Detalhes de Implementação (PDF & Tech)
- **Biblioteca:** Utiliza `jsPDF` v2.5+ e `jspdf-autotable`.
- **Tratamento de Texto Longo:** Implementada a propriedade `overflow: 'linebreak'` nas colunas de Dinâmica e Observações, garantindo que relatos extensos não saiam das bordas do documento.
- **Formatação de Datas:** O sistema limpa automaticamente o excesso de espaços no 'Carimbo de Data/Hora' para permitir que o horário fique legível mesmo em colunas estreitas.
- **Filtros de Exportação:** Lógica personalizada que remove registros com valores zerados (Faltas/Dispensas) para gerar documentos curtos e acionáveis.

---
**PM/3 - Dev.Fiel.26**
