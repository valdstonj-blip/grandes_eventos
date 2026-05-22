import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getCSVData, 
  G_SHEET_CSV_URL 
} from '../lib/csvHelper';
import { 
  Users, 
  RefreshCw, 
  FileDown, 
  Search,
  Shield,
  Activity,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SHEET_ID = '1xx9LLSI1R71LhhPtmiqpbnl0Ofdn3BAyLhEhamF1-No';
const GID = '63164403';
const CSV_URL = G_SHEET_CSV_URL(SHEET_ID, GID);

export const FaltasDispensasDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  // Helper to normalize strings (remove accents and spaces)
  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s/g, '');

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getCSVData(CSV_URL);
      setData(result);
      localStorage.setItem('cache_faltas', JSON.stringify(result));
    } catch (error) {
      console.error('Error loading faltas/dispensas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem('cache_faltas');
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
      } catch (e) {}
    }
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  // Helper para buscar soma total de colunas por padrão (ex: 'falta', 'dispensa')
  const getSumByPattern = (pattern: string, dataSource: any[]) => {
    const normalizedPattern = normalize(pattern);
    
    return dataSource.reduce((acc, item) => {
      const keys = Object.keys(item).filter(k => {
        const normKey = normalize(k);
        
        // Colunas terminantemente proibidas de somar (texto/identificadores)
        const isForbiddenText = ['email', 'nome', 'guerra', 'posto', 'grad', 'obs', 'carimbo', 'timestamp', 'celular', 'data', 'hora', 'local', 'endereco', 'dinamica', 'historico', 'relato'].some(p => normKey.includes(p));
        const isForbiddenId = ['rg', 're', 'id', 'repm', 'unidade', 'opm', 'cod', 'cpf'].some(p => normKey === p || (normKey.startsWith(p) && !['qtd', 'falta', 'disp'].some(q => normKey.includes(q))));
        
        // Padrão de busca (falta/disp/poe/etc)
        const isDispSearch = pattern === 'dispensa';
        const matchesPattern = isDispSearch 
          ? (normKey.includes('disp') || normKey.includes('dispensa')) 
          : normKey.includes(normalizedPattern);
        
        // Se for um padrão de quantidade válido e NÃO for uma das colunas proibidas de texto
        return matchesPattern && !isForbiddenText && !isForbiddenId;
      });
      
      let sumForRow = 0;
      keys.forEach(key => {
        const rawValue = String(item[key] || '').trim().toUpperCase();
        if (!rawValue || ['0', '-', 'NAO', 'NÃO', 'NEGATIVO', 'Ñ'].includes(rawValue)) return;

        const cleanVal = rawValue.replace(/[^0-9]/g, '');
        const numVal = parseInt(cleanVal);
        
        if (!isNaN(numVal) && cleanVal.length > 0) {
          if (numVal > 0 && numVal < 1000) {
            sumForRow += numVal;
          }
        } else if (['X', '1', 'SIM', 'S', 'OK'].includes(rawValue)) {
          sumForRow += 1;
        }
      });
      return acc + sumForRow;
    }, 0);
  };

  const getSumByDoublePatterns = (pattern1: string, pattern2: string, dataSource: any[]) => {
    const p1 = normalize(pattern1);
    const p2 = normalize(pattern2);
    
    return dataSource.reduce((acc, item) => {
      const keys = Object.keys(item).filter(k => {
        const normKey = normalize(k);
        
        // Colunas proibidas de somar (texto/identificadores)
        const isForbiddenText = ['email', 'nome', 'guerra', 'posto', 'grad', 'obs', 'carimbo', 'timestamp', 'celular', 'data', 'hora', 'local', 'endereco', 'dinamica', 'historico', 'relato'].some(p => normKey.includes(p));
        const isForbiddenId = ['rg', 're', 'id', 'repm', 'unidade', 'opm', 'cod', 'cpf'].some(p => normKey === p || (normKey.startsWith(p) && !['qtd', 'falta', 'disp'].some(q => normKey.includes(q))));
        
        return normKey.includes(p1) && normKey.includes(p2) && !isForbiddenText && !isForbiddenId;
      });
      
      let sumForRow = 0;
      keys.forEach(key => {
        const rawValue = String(item[key] || '').trim().toUpperCase();
        if (!rawValue || ['0', '-', 'NAO', 'NÃO', 'NEGATIVO', 'Ñ'].includes(rawValue)) return;

        const cleanVal = rawValue.replace(/[^0-9]/g, '');
        const numVal = parseInt(cleanVal);
        
        if (!isNaN(numVal) && cleanVal.length > 0) {
          if (numVal > 0 && numVal < 1000) {
            sumForRow += numVal;
          }
        } else if (['X', '1', 'SIM', 'S', 'OK'].includes(rawValue)) {
          sumForRow += 1;
        }
      });
      return acc + sumForRow;
    }, 0);
  };

  const totals = useMemo(() => {
    return {
      faltas: getSumByPattern('falta', filteredData),
      dispensas: getSumByPattern('dispensa', filteredData),
      total: filteredData.length
    };
  }, [filteredData]);

  // Totais Detalhados POO / POE
  const detailedTotals = useMemo(() => {
    return {
      faltasPoo: getSumByDoublePatterns('falta', 'poo', filteredData),
      faltasPoe: getSumByDoublePatterns('falta', 'poe', filteredData),
      dispensasPoo: getSumByDoublePatterns('disp', 'poo', filteredData),
      dispensasPoe: getSumByDoublePatterns('disp', 'poe', filteredData),
    };
  }, [filteredData]);

  // Totais da Tabela - Soma APENAS colunas quantitativas reais
  const tableColumnTotals = useMemo(() => {
    if (filteredData.length === 0) return {};
    const keys = Object.keys(filteredData[0]);
    const sums: Record<string, number> = {};
    
    keys.forEach(key => {
      const normKey = normalize(key);
      
      // Filtros de segurança
      const isForbiddenText = ['email', 'nome', 'guerra', 'posto', 'grad', 'obs', 'carimbo', 'timestamp', 'celular', 'data', 'hora', 'local', 'endereco', 'dinamica', 'historico', 'relato'].some(p => normKey.includes(p));
      const isForbiddenId = ['rg', 're', 'id', 'repm', 'unidade', 'opm', 'cod', 'cpf'].some(p => normKey === p || (normKey.startsWith(p) && !['qtd', 'falta', 'disp'].some(q => normKey.includes(q))));
      
      const isQuantity = normKey.includes('quantidade') || 
                        normKey.includes('qtd') || 
                        normKey.includes('falta') || 
                        normKey.includes('disp') ||
                        normKey.includes('poe');

      // Se for texto proibido OU não for uma coluna de quantidade, não soma
      if (isForbiddenText || isForbiddenId || !isQuantity) {
        sums[key] = 0;
        return;
      }

      const total = filteredData.reduce((acc, item) => {
        const rawValue = String(item[key] || '').trim().toUpperCase();
        if (!rawValue || ['0', '-', 'NAO', 'NÃO', 'NEGATIVO', 'Ñ'].includes(rawValue)) return acc;

        const cleanVal = rawValue.replace(/[^0-9]/g, '');
        const numVal = parseInt(cleanVal);
        let valToAdd = 0;
        
        if (!isNaN(numVal) && cleanVal.length > 0) {
          if (numVal > 0 && numVal < 1000) valToAdd = numVal;
        } else if (['X', 'SIM', 'S', '1', 'OK'].includes(rawValue)) {
          valToAdd = 1;
        }
        
        return acc + valToAdd;
      }, 0);
      sums[key] = total;
    });
    return sums;
  }, [filteredData]);

  const barData = useMemo(() => {
    return [
      { name: 'Faltas POO', value: detailedTotals.faltasPoo, color: '#f43f5e' },
      { name: 'Faltas POE', value: detailedTotals.faltasPoe, color: '#f97316' },
      { name: 'Dispensas POO', value: detailedTotals.dispensasPoo, color: '#6366f1' },
      { name: 'Dispensas POE', value: detailedTotals.dispensasPoe, color: '#3b82f6' },
    ];
  }, [detailedTotals]);

    const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('RELATÓRIO DE AUSÊNCIAS - EMG PM/3', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 21);

    // 1. Quadro de Totais (Quick View)
    autoTable(doc, {
      head: [['Resumo Operacional', 'Quantitativo']],
      body: [
        ['Total de Formulários Enviados', String(totals.total)],
        ['Total de Faltas Registradas', String(totals.faltas)],
        ['Total de Dispensas', String(totals.dispensas)],
      ],
      startY: 28,
      theme: 'striped',
      headStyles: { fillColor: [2, 132, 199], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } }
    });

    // 2. Detalhamento de Ausências (Apenas Faltas > 0 ou Dispensas > 0)
    const detailedRows: any[] = [];
    
    // Identificar colunas dinamicamente
    const colKeys = data[0] ? Object.keys(data[0]) : [];
    const nameCol = colKeys.find(k => normalize(k).includes('nome') || normalize(k).includes('guerra')) || '';
    const postCol = colKeys.find(k => normalize(k).includes('posto') || normalize(k).includes('grad')) || '';
    const faltaCol = colKeys.find(k => normalize(k).includes('falta')) || '';
    const dispensaCol = colKeys.find(k => normalize(k).includes('dispensa')) || '';
    const obsCols = colKeys.filter(k => {
      const n = normalize(k);
      return n.includes('obs') || n.includes('motivo') || n.includes('justif');
    });

    filteredData.forEach(item => {
      const fVal = parseInt(String(item[faltaCol] || 0).replace(/[^0-9]/g, '')) || 0;
      const dVal = parseInt(String(item[dispensaCol] || 0).replace(/[^0-9]/g, '')) || 0;
      
      // Só entra no relatório se houver ausência registrada (F > 0 ou D > 0)
      if (fVal > 0 || dVal > 0) {
        const nomeCompleto = `${item[postCol] || ''} ${item[nameCol] || ''}`.trim();
        const ausencias = [];
        if (fVal > 0) ausencias.push(`${fVal} Falta(s)`);
        if (dVal > 0) ausencias.push(`${dVal} Dispensa(s)`);
        
        let observacao = '';
        obsCols.forEach(col => {
          const val = String(item[col] || '').trim();
          if (val.length > 0) {
            observacao += (observacao ? ' | ' : '') + `${col}: ${val}`;
          }
        });

        detailedRows.push([
          nomeCompleto || 'N/A',
          ausencias.join(' / '),
          observacao || 'Nenhuma observação detalhada.'
        ]);
      }
    });

    if (detailedRows.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Detalhamento de Ausências', 14, (doc as any).lastAutoTable.finalY + 12);

      autoTable(doc, {
        head: [['Efetivo', 'Qtd (F/D)', 'Motivo / Observação']],
        body: detailedRows,
        startY: (doc as any).lastAutoTable.finalY + 16,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 'auto' }
        }
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Sem ausências (faltas/dispensas) críticas registradas no período.', 14, (doc as any).lastAutoTable.finalY + 15);
    }

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('PM/3 Dev.Fiel.26 - Relatório de Ausências', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`RELATORIO_AUSENCIAS_PM3_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-slate-300" />
        <p className="font-bold text-slate-400 tracking-widest uppercase text-xs">Carregando Dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Search and Action Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar registros..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 lg:flex items-center gap-2 w-full lg:w-auto">
          <button 
            onClick={fetchData} 
            className="flex items-center justify-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-3 lg:px-5 py-2.5 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> 
            Sincronizar
          </button>
          <button 
            onClick={exportPDF} 
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-3 lg:px-6 py-2.5 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95"
          >
            <FileDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> 
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 lg:w-48 lg:h-48 bg-sky-50 rounded-full -mr-16 -mt-16 lg:-mr-24 lg:-mt-24 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[9px] lg:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1 relative z-10">Volume de Envios de Formulários</p>
          <div className="flex items-end gap-3 relative z-10">
            <p className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter">{totals.total}</p>
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 mb-1 lg:mb-2 uppercase italic tracking-tighter">Registros</p>
          </div>
          <div className="mt-6 flex items-center gap-4 relative z-10">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-rose-500" />
                <span className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-tight text-rose-600">Faltas: {totals.faltas}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-indigo-500" />
                <span className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-tight text-indigo-600">Dispensas: {totals.dispensas}</span>
             </div>
          </div>
        </motion.div>

        <div className="bg-slate-900 p-6 lg:p-8 rounded-3xl text-white flex flex-col justify-between shadow-xl overflow-hidden relative border-b-4 border-b-emerald-600">
          <div className="absolute top-0 right-0 opacity-10">
             <Shield className="w-32 h-32 lg:w-40 lg:h-40 -mr-8 -mt-8 lg:-mr-10 lg:-mt-10" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-center">
            <h3 className="text-lg lg:text-2xl font-black uppercase italic tracking-tight mb-2 flex items-center gap-2">
               <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400" /> Monitoramento
            </h3>
            <p className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] leading-relaxed max-w-md">
              Controle de faltas e dispensas.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Sincronizado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Distribuição de Ausências</h3>
             <div className="flex items-center gap-4">
               {barData.map((d, i) => (
                 <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                   {d.name.toUpperCase()}
                 </div>
               ))}
             </div>
           </div>
           <div className="h-64 min-h-[256px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} width={500} height={300}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} domain={[0, 'dataMax + 2']} allowDecimals={false} />
                 <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                 <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                   {barData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      style={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} 
                    />
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-1 h-5 bg-sky-500 rounded-full" />
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Listagem de Efetivo (Operacional)</h3>
          </div>
        </div>
        
        <div className="overflow-auto max-h-[600px] custom-scrollbar shadow-inner bg-white">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 border-b border-slate-800">
                {data[0] && Object.keys(data[0]).map((header) => (
                  <th key={header} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-sky-400 whitespace-nowrap bg-slate-900 border-b border-slate-800">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic">
              {filteredData.map((item, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedRow(item)}
                  className="hover:bg-sky-50/50 transition-all group cursor-pointer border-b border-slate-50"
                >
                  {data[0] && Object.keys(data[0]).map((key, vIdx) => {
                    const value = item[key];
                    const normKey = normalize(key);
                    const isLongText = normKey.includes('obs') || normKey.includes('motivo') || normKey.includes('justif') || normKey.includes('desc');
                    
                    return (
                      <td 
                        key={vIdx} 
                        className={`px-6 py-4 text-[11px] font-bold text-slate-600 group-hover:text-slate-900 ${isLongText ? 'max-w-[250px] truncate' : 'whitespace-nowrap'}`}
                        title={isLongText ? String(value || '') : undefined}
                      >
                        {String(value || '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-900 font-black text-white z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <tr>
                {data[0] && Object.keys(data[0]).map((key, i) => (
                  <td key={i} className="px-6 py-5 text-[10px] uppercase tracking-widest text-sky-400 border-t border-slate-800 bg-slate-900">
                    {i === 0 ? 'TOTAIS GERAIS' : (tableColumnTotals[key] > 0 ? <span className="text-white text-sm">{tableColumnTotals[key]}</span> : '-')}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
          {filteredData.length === 0 && (
            <div className="p-24 text-center">
              <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm italic">Nenhum registro localizado com os critérios informados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRow(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden z-[101] border border-white/20 mt-auto sm:mt-0"
            >
              <div className="bg-slate-900 p-6 sm:p-8 text-white relative">
                <div className="absolute top-0 right-0 p-4 sm:p-6">
                  <button 
                    onClick={() => setSelectedRow(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="p-3 sm:p-4 bg-sky-500/20 rounded-2xl border border-sky-500/20">
                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic leading-tight">Detalhamento</h3>
                    <p className="text-sky-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Dados Completos</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {Object.entries(selectedRow).map(([key, value]) => (
                    <div key={key} className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm group hover:border-sky-200 transition-all duration-300">
                      <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-hover:text-sky-500 transition-colors uppercase">{key}</p>
                      <p className="text-[12px] sm:text-[13px] font-bold text-slate-800 break-words leading-relaxed">{String(value || 'N/A')}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedRow(null)}
                  className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-xl sm:rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
