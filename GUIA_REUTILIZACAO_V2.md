# 🚀 Guia de Reutilização V2.0 - Engenharia de Prompt e Design

Este guia é um **Ponto de Restauração e Clonagem**. Ele contém o "Prompt Mestre" para criar um novo sistema idêntico a este, mas com dados de planilhas diferentes.

## 1. O Prompt Mestre para Próximo Sistema
Copie e cole o texto abaixo para criar um novo sistema com a mesma alma visual e funcional:

> **"INSTRUÇÃO DE CLONAGEM DE SISTEMA OPERACIONAL PM/3:**
> Preciso criar um Dashboard Operacional Profissional focado em [NOME DO SEU NOVO PROJETO]. 
> 
> **ESTRUTURA TÉCNICA:**
> 1. **Framework:** React + Tailwind CSS + Vite.
> 2. **Sincronização:** Use o modelo 'Database-less'. Consuma dados de duas URLs de Google Sheets (Publicadas como CSV).
> 3. **Estado:** Utilize Context API para gerenciar os dados e `localStorage` para cache persistente (evitar tela branca).
> 
> **IDENTIDADE VISUAL (Siga Rigorosamente):**
> - **Fundo Geral:** `bg-slate-50` (Clean/Professional).
> - **Cards e Tabelas:** `bg-white` com bordas sutis `border-slate-200`.
> - **Cores de Texto:** Títulos em `Slate 900`, acentos em `Sky 600`.
> - **Cabeçalhos e Rodapés:** Azul Marinho Militar (`#0f172a`).
> - **Animações:** Use `motion` (framer-motion) para entrada de cards e abertura de modais.
> 
> **COMPORTAMENTO DAS PLANILHAS (Dados Dinâmicos):**
> - O sistema deve ser 'Agnóstico a Colunas'. Ele deve ler os nomes das colunas da planilha e:
>   - **Somar Automaticamente:** Colunas que contenham "Qtd", "Quantidade" ou "Total" (ignorando palavras como "ID", "RG", "RE").
>   - **Exibir Detalhes:** Criar uma tabela dinâmica onde o clique na linha abre um Modal com TODOS os campos daquela linha.
> 
> **REGRAS PARA O PDF (Relatório Profissional):**
> - Gere um PDF com a biblioteca `jspdf` e `jspdf-autotable`.
> - **Página 1:** Totais acumulados e Produtividade agrupada por uma coluna chave (ex: Local ou PCA).
> - **Página 2:** Listagem de relatos/históricos em formato de 3 colunas (Horário/Carimbo, Localização, e Dinâmica da Ocorrência). Use `overflow: linebreak`.
> 
> **ASSINATURA:**
> No rodapé de todas as páginas do PDF e no dashboard, inclua: 'PM/3 Dev.Fiel.26'."

## 2. Padrão de Cores (Design System)
Para manter o estilo "Dashboard de Alta Densidade", utilize sempre estas referências:

| Elemento | Classe Tailwind | Efeito Especial |
| :--- | :--- | :--- |
| **Fundo de Página** | `bg-slate-50` | Fundo claro e limpo para facilitar a leitura. |
| **Cards de Dados** | `bg-white` | Com `shadow-xl` e `border-slate-200`. |
| **Pulsing Light** | `animate-ping` | Use uma `div` redonda verde para indicar sistema ONLINE. |
| **Header/Footer** | `bg-[#0f172a]` | Tom Navy profissional do EMG PM/3. |

## 3. Lógica de Sincronização e Cache
Ao iniciar o novo sistema, o código deve primeiro verificar o `localStorage`:
1. Se houver dado salvo, exibe instantaneamente.
2. Em seguida, dispara o `fetch()` para o Google Sheets.
3. Ao receber os dados novos, limpa o estado antigo e atualiza a tela e o cache.
*Isso garante que o usuário nunca veja o dashboard "zerado".*

## 4. Otimização para Mobile (Campo)
- Em telas pequenas (`sm`), tabelas devem ter `overflow-x-auto`.
- O título do sistema deve ser abreviado automaticamente (ex: EMG-PM/3 em vez de Estado Maior Geral).
- Os botões (Exportar, Sincronizar) devem virar grid de 2 colunas para facilitar o clique.

---
**PONTO DE BASE PARA REUTILIZAÇÃO**
*Mantenha esta estrutura para garantir que todos os seus dashboards falem a mesma língua visual.*
