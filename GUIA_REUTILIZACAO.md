# ♻️ Guia de Reutilização: Clonando o Sistema para Novos Projetos

Este guia ensina como replicar a arquitetura deste sistema (Sem Banco de Dados + Google Sheets) para qualquer outro tipo de controle operacional.

## 1. O Conceito "Database-less"
A maior vantagem deste projeto é a **independência de backend**. Para criar um novo sistema, você só precisa de uma nova Planilha Google publicada como CSV.

## 2. Preparação da Nova Planilha
Para que a inteligência de soma automática funcione em qualquer planilha, siga esta regra de nomenclatura de colunas:

| Tipo de Dado | Sugestão de Nome da Coluna | Comportamento do Sistema |
| :--- | :--- | :--- |
| **Quantitativo** | `Qtd_Presos`, `Quantidade_Faltas`, `Num_Armas` | O sistema identifica "Qtd" ou "Num" e soma automaticamente. |
| **Identificação** | `Nome`, `Posto`, `RG`, `RE`, `ID` | O sistema identifica "RG", "ID" ou "Nome" e **bloqueia** a soma (evita somar RGs). |
| **Relato/Texto** | `Dinamica`, `Historico`, `Observacoes` | O sistema permite texto longo com quebra de linha no PDF. |
| **Localização** | `Posto`, `PCA`, `Setor`, `Unidade` | O sistema usa para agrupar a produtividade no relatório. |

## 3. Como Criar o Novo Sistema (Passo a Passo)

### Passo 1: Publicação dos Dados
1. No Google Sheets: `Arquivo > Compartilhar > Publicar na Web`.
2. Escolha a aba específica e mude o formato para **Valores separados por vírgula (.csv)**.
3. Copie o Link gerado.

### Passo 2: Alinhamento de Identidade (Prompt para IA)
Use este prompt para que a IA gere o novo sistema mantendo a qualidade visual:

> "Crie um novo módulo de Dashboard seguindo o padrão visual 'Professional Military' do EMG PM/3:
> 1. **Cores:** Fundo Slate 50, Cabeçalhos e Rodapés Navy (#0f172a), Cards Brancos com bordas Slate 200.
> 2. **Lógica de Dados:** Consuma o CSV [URL_DO_LIN_CSV].
> 3. **Inteligência:** Use a função de normalização de strings para somar apenas colunas que contenham 'Qtd', 'Total', 'Arma', 'Adulto' ou 'Adolescente', ignorando campos técnicos como 'RG', 'CPF' ou IDs longos.
> 4. **Tabelas:** Design Clean com cabeçalhos fixos Navy (bg-slate-900) e linhas clicáveis em Sky-50 ao hover.
> 5. **PDF:** Gere um relatório profissional agrupado, garantindo alta densidade de informação."

## 4. Mantendo a Consistência Visual
Para que o novo sistema pareça uma "suíte" de aplicativos da sua unidade:
- **Tema:** Light Mode Profissional. Utilize `slate-50` para o corpo e `bg-white` para cards.
- **Header/Footer:** Use Navy (#0f172a) para passar seriedade militar.
- **Títulos:** Use sempre letras MAIÚSCULAS para categorias principais com `tracking-widest`.
- **Ícones:** Use a biblioteca `lucide-react`.
- **Badges:** Use badges coloridos para status.

## 5. Checklist de Migração
- [ ] Atualizar a URL do CSV no código.
- [ ] Mudar o nome do projeto no `metadata.json`.
- [ ] Alterar o texto da "Assinatura" no rodapé do PDF (`doc.text('SUA UNIDADE', ...)`).
- [ ] Verificar se as colunas de "Dinamica" estão sendo capturadas pelo filtro de busca.

---
**Desenvolvido para: Estado Maior Geral - PM/3**
*Estratégia, Tecnologia e Operações.*
