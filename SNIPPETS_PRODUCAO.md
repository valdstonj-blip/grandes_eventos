# 🛠️ Snippets de Produção: Componentes de Elite (EMG PM/3)

Este arquivo contém o código fonte isolado dos componentes mais críticos do sistema, pronto para ser copiado e colado em novos projetos.

---

## 1. Badge "Registros Ativos" (Com Animação de Pulso)
Ideal para indicar que o sistema está conectado e os dados estão filtrados.

```tsx
<div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
  <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
    {filteredData.length} Registros Ativos
  </span>
</div>
```

---

## 2. A Tabela "Fiel" (Com Cabeçalho e Rodapé Fixos)
Esta estrutura garante que os títulos e as somas nunca sumam da tela.

```tsx
<div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl">
  {/* Header da Tabela */}
  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200">
        <FileText className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Registro Detalhado</h3>
    </div>
    {/* Insira aqui o Badge de Registros Ativos */}
  </div>

  {/* Container de Rolagem */}
  <div className="overflow-auto max-h-[600px] custom-scrollbar shadow-inner bg-white">
    <table className="w-full text-left border-separate border-spacing-0">
      <thead className="sticky top-0 z-20">
        <tr className="bg-slate-900">
          <th className="px-6 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest bg-slate-900 border-b border-slate-800">Coluna 1</th>
          <th className="px-6 py-5 text-[10px] font-black text-sky-400 uppercase tracking-widest bg-slate-900 border-b border-slate-800">Coluna 2</th>
          {/* Adicione mais cabeçalhos aqui */}
        </tr>
      </thead>
      
      <tbody className="divide-y divide-slate-100">
        {data.map((item, idx) => (
          <tr key={idx} className="hover:bg-sky-50 transition-colors cursor-pointer group">
            <td className="px-6 py-4 text-[11px] font-mono text-slate-400">{item.campo1}</td>
            <td className="px-6 py-4 text-[11px] font-bold text-slate-900">{item.campo2}</td>
          </tr>
        ))}
      </tbody>

      {/* Rodapé de Totais Fixo */}
      <tfoot className="sticky bottom-0 bg-slate-900 font-black text-white z-20 shadow-[0_-4px_6px_rgba(0,0,0,0.1)]">
        <tr>
          <td colSpan={1} className="px-6 py-5 text-xs uppercase tracking-widest text-sky-400 border-t border-slate-800 bg-slate-900">
            TOTAIS ACUMULADOS:
          </td>
          <td className="px-6 py-5 text-center text-sm border-t border-slate-800 bg-slate-800">
            {valorTotal}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>
```

---

## 3. Lógica de Sincronização e Cache (localStorage)
O "pulo do gato" para o sistema nunca falhar.

```typescript
// Chave única para evitar conflitos entre sistemas
const STORAGE_KEY = 'DADOS_SISTEMA_PM3';

const syncData = async (csvUrl: string) => {
  try {
    const response = await fetch(csvUrl);
    const text = await response.text();
    // Converta CSV para JSON (Use uma biblioteca ou helper)
    const json = parseCSV(text); 
    
    // Salva no Navegador
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data: json,
      lastUpdate: new Date().toISOString()
    }));
    
    return json;
  } catch (error) {
    console.warn("Falha na sincronização. Carregando cache local...");
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached).data : [];
  }
};
```

---

## 4. Exportação PDF com Alta Qualidade (jsPDF)
Configuração ideal para manter as fontes e cores legíveis.

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const exportToPDF = (results) => {
  const doc = new jsPDF('l', 'pt', 'a4'); // 'l' = Paisagem

  // Configuração Visual do Relatório
  autoTable(doc, {
    head: [['COLUNA 1', 'COLUNA 2', 'TOTAL']],
    body: results.map(row => [row.c1, row.c2, row.total]),
    styles: { fontSize: 8, font: 'helvetica' },
    headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248] }, // Navy e Sky Blue
    alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate 50
    margin: { top: 60 },
    didDrawPage: (data) => {
      // Cabeçalho da Unidade
      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text("EMG PM/3 - RELATÓRIO ESTRATÉGICO", data.settings.margin.left, 40);
    }
  });

  doc.save('Relatorio_PM3.pdf');
};
```

---
**EMG PM/3 - Desenvolvido para servir e proteger a informação.**
