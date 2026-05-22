# 🛠️ Snippets de Produção: Componentes de Elite (EMG PM/3)

Este arquivo contém o código-fonte isolado e otimizado dos componentes e algoritmos mais críticos do sistema, pronto para ser copiado, colado e adaptado a novos projetos da suíte.

---

## 1. Badge "Registros Ativos" (Com Animação de Pulso)
Ideal para indicar que o sistema está conectado aos servidores, filtrado com sucesso e computando dados em tempo de execução.

```tsx
<div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
  <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
    {filteredData.length} Registros Ativos
  </span>
</div>
```

---

## 2. A Tabela "Fiel" (Com Cabeçalho e Rodapé Fixos - Sticky)
Esta estrutura garante que os títulos de colunas e as somas matemáticas totais fiquem fixados no painel de visualização enquanto o usuário rola o conteúdo.

```tsx
<div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl">
  {/* Header de Controle */}
  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200">
        <FileText className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Painel Estatístico</h3>
    </div>
    {/* Badge de Prontidão */}
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span className="text-[10px] font-black text-emerald-700 tracking-wider uppercase">SINC_OK</span>
    </div>
  </div>

  {/* Vetor de Rolagem Limitado */}
  <div className="overflow-auto max-h-[500px] custom-scrollbar shadow-inner bg-white">
    <table className="w-full text-left border-separate border-spacing-0">
      <thead className="sticky top-0 z-20">
        <tr className="bg-slate-900">
          <th className="px-6 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest bg-slate-900 border-b border-slate-800">Elemento OPM</th>
          <th className="px-6 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest bg-slate-900 border-b border-slate-800 text-center">Faltas POO</th>
          <th className="px-6 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest bg-slate-900 border-b border-slate-800 text-center">Faltas POE</th>
        </tr>
      </thead>
      
      <tbody className="divide-y divide-slate-100">
        {filteredData.map((item, idx) => (
          <tr 
            key={idx} 
            onClick={() => handleSelection(item)}
            className="hover:bg-sky-50/60 transition-colors cursor-pointer group"
          >
            <td className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase">{item.unidade || "Não Identificado"}</td>
            <td className="px-6 py-4 text-[11px] font-mono font-bold text-center text-slate-900">{item.faltas_poo || 0}</td>
            <td className="px-6 py-4 text-[11px] font-mono font-bold text-center text-slate-900">{item.faltas_poe || 0}</td>
          </tr>
        ))}
      </tbody>

      {/* Rodapé Totalizador Fixo */}
      <tfoot className="sticky bottom-0 bg-slate-900 font-black text-white z-20 shadow-[0_-4px_6px_rgba(0,0,0,0.15)]">
        <tr>
          <td className="px-6 py-5 text-xs uppercase tracking-widest text-sky-400 border-t border-slate-800 bg-slate-900">
            TOTAL CONSOLIDADO:
          </td>
          <td className="px-6 py-5 text-center text-sm border-t border-slate-800 bg-slate-850 font-mono text-emerald-400">
            {totalPoo}
          </td>
          <td className="px-6 py-5 text-center text-sm border-t border-slate-800 bg-slate-850 font-mono text-emerald-400">
            {totalPoe}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>
```

---

## 3. Lógica Resiliente de Sincronização & Cache Local (localStorage)
Ideal para garantir o acesso ininterrupto do efetivo aos dados operacionais mesmo sob completa queda de conectividade externa.

```typescript
// Assinatura única para controle isolado de cookies e localStorage
const STORAGE_KEY = 'DADOS_OPERACIONAIS_EMG_PM3';

export const syncSheetsDatabase = async (csvUrl: string) => {
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error("Falha de rede ao consultar planilha");
    
    const csvContent = await response.text();
    const rows = parseCSVToRows(csvContent); // Retorna Array de Objetos JSON
    
    const payload = {
      data: rows,
      lastUpdate: new Date().toISOString()
    };
    
    // Escrita atômica na persistência local
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { data: rows, origin: 'net', timestamp: payload.lastUpdate };
  } catch (error) {
    console.warn("⚠️ Ambiente Offline. Recuperando contingência local...");
    const cache = localStorage.getItem(STORAGE_KEY);
    if (cache) {
      const parsed = JSON.parse(cache);
      return { data: parsed.data, origin: 'cache', timestamp: parsed.lastUpdate };
    }
    return { data: [], origin: 'vazio', timestamp: null };
  }
};
```

---

## 4. Normalização e Soma de Colunas com Dupla Validação (Pattern Sum)
Essencial para ler planilhas preenchidas manualmente. Mapeia cabeçalhos ignorando acentos ou espaços e executa a lógica de soma condicional.

```typescript
// 1. Normalizador Estrito de Chaves e Caracteres
export const normalizeHeader = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Expulsa acentos
    .trim()
    .replace(/\s+/g, " "); // Colapsa espaçamento indevido
};

// 2. Acumulador Avançado por Correspondência Dupla (ex: "falta" + "poo")
export const calculateDoublePatternSum = (
  colPatternA: string, 
  colPatternB: string, 
  dataset: any[]
): number => {
  const normA = normalizeHeader(colPatternA);
  const normB = normalizeHeader(colPatternB);

  return dataset.reduce((totalAccumulated, row) => {
    // Localiza colunas elegíveis
    const matchingColumns = Object.keys(row).filter(key => {
      const normKey = normalizeHeader(key);
      
      // Blacklist de colunas textuais para evitar falso positivo
      const isForbiddenText = ['email', 'nome', 'guerra', 'posto', 'grad', 'obs', 'carimbo', 'timestamp', 'celular', 'data', 'hora', 'local', 'endereco', 'dinamica', 'historico', 'relato'].some(p => normKey.includes(p));
      const isForbiddenId = ['rg', 're', 'id', 'repm', 'unidade', 'opm', 'cod', 'cpf'].some(p => normKey === p || (normKey.startsWith(p) && !['qtd', 'falta', 'disp'].some(q => normKey.includes(q))));
      
      return normKey.includes(normA) && normKey.includes(normB) && !isForbiddenText && !isForbiddenId;
    });

    let sumForRow = 0;
    matchingColumns.forEach(key => {
      const valueRaw = String(row[key] || '').trim().toUpperCase();
      if (!valueRaw || ['0', '-', 'NAO', 'NÃO', 'NEGATIVO', 'Ñ'].includes(valueRaw)) return;

      const cleanDigits = valueRaw.replace(/[^0-9]/g, '');
      const numConverted = parseInt(cleanDigits);

      if (!isNaN(numConverted) && cleanDigits.length > 0) {
        if (numConverted > 0 && numConverted < 1000) { // Protege contra estouros de RGs inseridos no campo numérico
          sumForRow += numConverted;
        }
      } else if (['X', '1', 'SIM', 'S', 'OK', 'FALTOU', 'DISPENSADO'].includes(valueRaw)) {
        sumForRow += 1; // Registros unitários baseados em marcacao textual simples
      }
    });

    return totalAccumulated + sumForRow;
  }, 0);
};
```

---

## 5. Exportação PDF em Alta Resolução (Orientação Paisagem)
Configurações essenciais para evitar cortes de texto horizontais em relatórios com textos longos ou colunas densas.

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const triggerPdfReport = (filteredRecords: any[], titleText: string) => {
  // Inicializa em modo Paisagem ('l'), medido em pontos ('pt'), formato padrão A4
  const doc = new jsPDF('l', 'pt', 'a4'); 

  // Configurações Estéticas do Relatório Militar
  autoTable(doc, {
    head: [['OPM / UNIDADE', 'TIPO DE REGISTRO', 'EFETIVO COMPROMETIDO', 'DESCRIÇÃO COMPLETA']],
    body: filteredRecords.map(item => [
      String(item.unidade || '').toUpperCase(),
      String(item.tipo_registro || '').toUpperCase(),
      String(item.quantidade || '0'),
      String(item.relato_descricao || 'Sem observações registradas.')
    ]),
    styles: { 
      fontSize: 8, 
      font: 'helvetica',
      overflow: 'linebreak' // Quebra textos longos automaticamente em novas linhas
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 100 },
      2: { cellWidth: 80, halign: 'center' },
      3: { cellWidth: 'auto' } // Coluna textual expande para ocupar o papel disponível
    },
    headStyles: { 
      fillColor: [15, 23, 42],     // Navy Militar (#0f172a)
      textColor: [56, 189, 248],   // Sky Accent (#38bdf8)
      fontStyle: 'bold' 
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252]   // Slate 50 (#f8fafc)
    },
    margin: { top: 70, bottom: 40 },
    didDrawPage: (data) => {
      // Título e Rodapé Estáticos da Corporação
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("ESTADO MAIOR GERAL PM/3 - COORDENAÇÃO DE GRANDES EVENTOS", data.settings.margin.left, 40);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 20);
    }
  });

  doc.save(`RELATORIO_ESTRATEGICO_${Date.now()}.pdf`);
};
```

---

## 6. O Script do Cabeçalho `index.html` para Redirecionamento Estático
Evita a tela branca instantânea no GitHub Pages e repara erros de carregamento absoluto em ambientes de subpastas automaticamente.

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ESTADO MAIOR GERAL PM/3</title>
  
  <!-- GitHub Pages Trailing Slash Self-Resolution Script -->
  <script>
    (function() {
      var path = window.location.pathname;
      if (window.location.hostname.endsWith('github.io') && !path.endsWith('/') && !path.split('/').pop().includes('.')) {
        window.location.replace(window.location.href + '/');
      }
    })();
  </script>
</head>
```

---
**EMG PM/3 - Desenvolvido para servir e proteger a informação.**

