import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getCSVData, 
  G_SHEET_CSV_URL 
} from '../lib/csvHelper';
import { 
  Activity, 
  RefreshCw, 
  FileDown, 
  Search,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  Shield,
  X,
  MapPin,
  Map,
  ChevronDown,
  Check
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
  PieChart,
  Pie
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SHEET_ID = '1rAz2R5WNqv4CQehdQbOD_ay9I-A-CFpJwL5NEN8OXzY';
const GID = '1427631463';
const CSV_URL = G_SHEET_CSV_URL(SHEET_ID, GID);

export const OcorrenciasDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOPMs, setSelectedOPMs] = useState<string[]>([]);
  const [isOPMDropdownOpen, setIsOPMDropdownOpen] = useState(false);
  const [selectedLocalForMap, setSelectedLocalForMap] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getCSVData(CSV_URL);
      setData(result);
      // Salva no cache local para carregamento instantâneo no futuro
      localStorage.setItem('cache_ocorrencias', JSON.stringify(result));
      localStorage.setItem('cache_ocorrencias_time', new Date().toISOString());
    } catch (error) {
      console.error('Error loading occurrences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tenta carregar do cache primeiro para ser instantâneo
    const cached = localStorage.getItem('cache_ocorrencias');
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
      } catch (e) {
        console.error("Erro ao ler cache", e);
      }
    }
    fetchData();
  }, []);

  // Helper de normalização global para evitar inconsistências
  const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s/g, '');

  // Lista de OPMs únicas coletadas dinamicamente
  const allOPMs = useMemo(() => {
    const opms = new Set<string>();
    data.forEach(item => {
      const keys = Object.keys(item);
      const opmKey = keys.find(k => {
        const norm = normalizeStr(k);
        return ['opm', 'pca', 'unidade'].some(p => norm.includes(p));
      });
      if (opmKey) {
        const val = String(item[opmKey]).trim().toUpperCase();
        if (val && val !== '-' && val !== 'N/A' && val !== 'PCA') {
          opms.add(val);
        }
      }
    });
    return Array.from(opms).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedOPMs.length > 0) {
        const keys = Object.keys(item);
        const opmKey = keys.find(k => {
          const norm = normalizeStr(k);
          return ['opm', 'pca', 'unidade'].some(p => norm.includes(p));
        });
        if (opmKey) {
          const val = String(item[opmKey]).trim().toUpperCase();
          return selectedOPMs.includes(val);
        }
        return false;
      }
      return true;
    });
  }, [data, selectedOPMs]);

  // Helper para buscar soma total de colunas por padrão
  const getSumByPattern = (pattern: string, dataSource: any[]) => {
    const normalizedPattern = normalizeStr(pattern);

    // Identificadores técnicos que NUNCA devem ser somados como quantidade
    const technicalForbidden = ['rg', 're', 'id', 'cod', 'carimbo', 'timestamp', 'celular', 'opm', 'unidade', 'cpf', 'registro'];

    return dataSource.reduce((acc, item) => {
      const keys = Object.keys(item).filter(k => {
        const normKey = normalizeStr(k);
        // Busca flexível: se a coluna CONTÉM o padrão (ex: 'arma' em 'arma de fogo')
        const hasPattern = normKey.includes(normalizedPattern);
        const isTechnicalId = technicalForbidden.some(p => normKey === p || (normKey.startsWith(p) && !['qtd', 'arma', 'adulto', 'adolescente'].some(q => normKey.includes(q))));
        
        return hasPattern && !isTechnicalId;
      });
      
      let sumForRow = 0;
      keys.forEach(key => {
        const rawValue = String(item[key] || '').trim().toUpperCase();
        if (!rawValue || ['0', '-', 'NAO', 'NÃO', 'NEGATIVO', 'Ñ'].includes(rawValue)) return;

        // Tenta extrair apenas os números (ex: "01 ARMA" -> "01" -> 1)
        const cleanVal = rawValue.replace(/[^0-9]/g, '');
        const numVal = parseInt(cleanVal);
        
        if (!isNaN(numVal) && cleanVal.length > 0) {
          // Filtro de segurança: se for um número plausível (1 a 999), somamos
          if (numVal > 0 && numVal < 1000) {
            sumForRow += numVal;
          }
        } else if (['X', 'SIM', 'S', '1', 'OK'].includes(rawValue)) {
          // Se for uma marcação manual ("X" ou "SIM"), contamos como 1
          sumForRow += 1;
        }
      });
      
      return acc + sumForRow;
    }, 0);
  };

  const totals = useMemo(() => {
    return {
      envio: filteredData.length,
      armas: getSumByPattern('arma', filteredData),
      adultos: getSumByPattern('adulto', filteredData),
      adolescentes: getSumByPattern('adolescente', filteredData),
      perfuro: getSumByPattern('perfuro', filteredData),
      simulacros: getSumByPattern('simulacro', filteredData),
    };
  }, [filteredData]);

  // Totais da Tabela (Sincronizados com o filtro)
  const tableColumnTotals = useMemo(() => {
    if (filteredData.length === 0) return {};
    const keys = Object.keys(filteredData[0]);
    const sums: Record<string, number> = {};
    
    // Cabeçalhos que representam quantidades
    const quantHeaders = ['adulto', 'adolescente', 'arma', 'perfuro', 'simulacro'];

    keys.forEach(key => {
      const normalizedKey = normalizeStr(key);
      const isQuantitative = quantHeaders.some(p => normalizedKey.includes(normalizeStr(p)));
      
      if (!isQuantitative) {
        sums[key] = 0;
        return;
      }

      const total = filteredData.reduce((acc, item) => {
        const rawValue = String(item[key] || '').trim().toUpperCase();
        const numVal = parseInt(rawValue.replace(/[^0-9]/g, ''));
        let valToAdd = 0;
        if (!isNaN(numVal) && numVal < 1000) {
          valToAdd = numVal;
        } else if (['X', 'SIM', 'S', '1'].includes(rawValue)) {
          valToAdd = 1;
        }
        return acc + valToAdd;
      }, 0);
      
      sums[key] = total;
    });
    return sums;
  }, [filteredData]);

  const pieDataArray = useMemo(() => {
    return [
      { label: 'Adultos Presos', val: totals.adultos, color: '#10b981' },
      { label: 'Adolescentes', val: totals.adolescentes, color: '#f59e0b' },
      { label: 'Armas de Fogo', val: totals.armas, color: '#f43f5e' },
      { label: 'Perfurocortantes', val: totals.perfuro, color: '#0ea5e9' },
      { label: 'Simulacros', val: totals.simulacros, color: '#6366f1' },
    ];
  }, [totals]);

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(16);
    doc.text('Relatório de Ocorrências', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

    // 1. Quadro de Resumo Geral
    const summaryRows = [
      ['Total de Envios', String(totals.envio)],
      ['Adultos Presos', String(totals.adultos)],
      ['Adolescentes Apreendidos', String(totals.adolescentes)],
      ['Armas de Fogo', String(totals.armas)],
      ['Objetos Perfurocortantes', String(totals.perfuro)],
      ['Simulacros', String(totals.simulacros)],
    ];

    autoTable(doc, {
      head: [['Título da Categoria', 'Total Acumulado']],
      body: summaryRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // 2. Quadro Detalhado por OPM
    // Lógica para agrupar dados por OPM
    const opmMap: Record<string, any> = {};
    const keys = data.length > 0 ? Object.keys(data[0]) : [];
    
    const getValFromItem = (item: any, patterns: string[]) => {
      const key = Object.keys(item).find(k => {
        const normalizedKey = normalizeStr(k);
        return patterns.some(p => normalizedKey.includes(normalizeStr(p)));
      });
      return key ? String(item[key] || '').trim() : '';
    };

    const getNumFromItem = (item: any, patterns: string[]) => {
      const val = getValFromItem(item, patterns).toUpperCase();
      if (!val || ['0', '-', 'NAO', 'NÃO'].includes(val)) return 0;
      const num = parseInt(val.replace(/[^0-9]/g, ''));
      if (!isNaN(num)) return num;
      if (['X', 'SIM', 'S', '1', 'OK'].includes(val)) return 1;
      return 0;
    };

    filteredData.forEach(item => {
      let opmName = getValFromItem(item, ['opm', 'pca', 'unidade']) || 'N/A';
      opmName = opmName.toUpperCase();
      
      if (!opmMap[opmName]) {
        opmMap[opmName] = { envios: 0, adultos: 0, adol: 0, armas: 0, perf: 0, simul: 0 };
      }
      
      opmMap[opmName].envios += 1;
      opmMap[opmName].adultos += getNumFromItem(item, ['adulto']);
      opmMap[opmName].adol += getNumFromItem(item, ['adolescente']);
      opmMap[opmName].armas += getNumFromItem(item, ['arma']);
      opmMap[opmName].perf += getNumFromItem(item, ['perfuro']);
      opmMap[opmName].simul += getNumFromItem(item, ['simulacro']);
    });

    const opmRows = Object.entries(opmMap).map(([name, stats]) => [
      name,
      String(stats.envios),
      String(stats.adultos),
      String(stats.adol),
      String(stats.armas),
      String(stats.perf),
      String(stats.simul)
    ]);

    doc.setFontSize(12);
    doc.text('Ocorrências Detalhadas por OPM', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      head: [['OPM / POSTO', 'ENVIOS', 'ADULT', 'ADOL', 'ARMA', 'PERF', 'SIMUL']],
      body: opmRows,
      startY: (doc as any).lastAutoTable.finalY + 20,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // Slate 900 para diferenciar
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252] }
      }
    });

    // 3. Detalhamento das Dinâmicas (Relatos)
    const dinamicaRows = filteredData.filter(item => {
      const d = getValFromItem(item, ['dinamica', 'relato', 'historico', 'descricao']);
      return d.length > 5;
    }).map(item => {
      const carimbo = getValFromItem(item, ['carimbo', 'data/hora', 'timestamp']);
      const opm = getValFromItem(item, ['opm', 'pca', 'unidade']) || 'N/A';
      const turno = getValFromItem(item, ['turno', 'dia']) || '';
      const dinamica = getValFromItem(item, ['dinamica', 'relato', 'historico', 'descricao']);
      
      return [
        carimbo.replace(/\s/g, '\n'), // Quebra data e hora
        `${opm}\n${turno}`.trim(),
        dinamica
      ];
    });

    if (dinamicaRows.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('Relato das Dinâmicas (Histórico)', 14, 15);
      
      autoTable(doc, {
        head: [['HORÁRIO', 'OPM / TURNO', 'DESCRIÇÃO DA OCORRÊNCIA / DINÂMICA']],
        body: dinamicaRows,
        startY: 20,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 45 },
          2: { cellWidth: 'auto' }
        }
      });
    }

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('PM/3 Dev.Fiel.26', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save('OCORRENCIAS_PM3_DEV_FIEL.pdf');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-12 h-12 animate-spin text-sky-600" />
        <p className="font-black text-slate-400 tracking-widest uppercase">Sincronizando Dados PM/3...</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase animate-pulse">Aguarde, conectando às planilhas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Search and Action Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col gap-4 relative z-40">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 w-full">
          <div className="relative w-full lg:w-[450px]">
            <button
              onClick={() => setIsOPMDropdownOpen(!isOPMDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500/20 shadow-inner outline-none transition-all text-left font-black tracking-wider uppercase text-xs active:bg-slate-100"
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-4 h-4 text-sky-500 shrink-0" />
                {selectedOPMs.length === 0 ? (
                  <span className="text-slate-500 font-extrabold">Todas as OPMs Ativas</span>
                ) : (
                  <span className="text-sky-600 font-extrabold">
                    {selectedOPMs.length} OPM(s) Selecionada(s)
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOPMDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOPMDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsOPMDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto custom-scrollbar p-3 space-y-1">
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    <span>Selecione as OPMs</span>
                    {selectedOPMs.length > 0 && (
                      <button
                        onClick={() => setSelectedOPMs([])}
                        className="text-rose-500 hover:text-rose-700 transition-colors normal-case text-[10px] font-bold"
                      >
                        Limpar Todas
                      </button>
                    )}
                  </div>
                  {allOPMs.map(opm => {
                    const isSelected = selectedOPMs.includes(opm);
                    return (
                      <button
                        key={opm}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedOPMs(selectedOPMs.filter(o => o !== opm));
                          } else {
                            setSelectedOPMs([...selectedOPMs, opm]);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-left transition-all ${
                          isSelected 
                            ? 'bg-sky-50 text-sky-700 border-l-4 border-l-sky-500' 
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{opm}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-500" />}
                      </button>
                    );
                  })}
                  {allOPMs.length === 0 && (
                    <p className="text-[10px] italic text-slate-400 p-2 text-center uppercase font-bold">Nenhuma OPM encontrada</p>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-2 lg:flex items-center gap-2 w-full lg:w-auto">
            <button 
              onClick={fetchData} 
              className="flex items-center justify-center gap-2 bg-slate-800 text-emerald-400 border border-emerald-500/20 px-3 lg:px-5 py-2.5 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-emerald-500/10 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> 
              Sincronizar
            </button>
            <button 
              onClick={exportPDF} 
              className="flex items-center justify-center gap-2 bg-sky-600 text-white px-3 lg:px-6 py-2.5 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition-all active:scale-95"
            >
              <FileDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> 
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Badge lists for filtered OPMs */}
        {selectedOPMs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center justify-start py-1 px-1 border-t border-slate-100 pt-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Filtros Ativos:</span>
            {selectedOPMs.map(opm => (
              <span 
                key={opm} 
                className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 px-2 py-1 rounded-lg text-[9px] font-black text-sky-700 uppercase tracking-wider"
              >
                {opm}
                <button 
                  onClick={() => setSelectedOPMs(selectedOPMs.filter(o => o !== opm))}
                  className="hover:bg-sky-200 p-0.5 rounded-full transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-sky-600" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 lg:w-48 lg:h-48 bg-sky-50 rounded-full -mr-16 -mt-16 lg:-mr-24 lg:-mt-24 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[9px] lg:text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1 relative z-10">Volume de Envios de Formulários</p>
          <div className="flex items-end gap-3 relative z-10">
            <p className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter">{totals.envio}</p>
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 mb-1 lg:mb-2 uppercase italic tracking-tighter">Registros</p>
          </div>
          <div className="mt-6 flex items-center gap-2 relative z-10">
            <div className="h-1.5 lg:h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 animate-pulse" style={{ width: '100%' }} />
            </div>
            <span className="text-[9px] lg:text-[10px] font-black text-sky-600 uppercase tracking-tighter">Planilha Live</span>
          </div>
        </motion.div>

        <div className="bg-slate-900 p-6 lg:p-8 rounded-3xl text-white flex flex-col justify-between shadow-xl overflow-hidden relative border-b-4 border-b-sky-600">
          <div className="absolute top-0 right-0 opacity-10">
             <Shield className="w-32 h-32 lg:w-40 lg:h-40 -mr-8 -mt-8 lg:-mr-10 lg:-mt-10" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-center">
            <h3 className="text-lg lg:text-2xl font-black uppercase italic tracking-tight mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-sky-400" /> Monitoramento PM/3
            </h3>
            <p className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] leading-relaxed max-w-md">
              Controle técnico operacional de ocorrências e registros em tempo real.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Monitoramento Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Charts Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Resumo Quantitativo de Produtividade</h3>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {pieDataArray.map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4 text-center">{item.label}</p>
              <div className="h-32 w-full relative min-h-[128px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart width={100} height={100}>
                    <Pie
                      data={[{ name: 'Valor', value: item.val }, { name: 'Diferença', value: Math.max(1, totals.envio - item.val) }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={45}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={item.color} />
                      <Cell fill="#f8fafc" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900">{item.val}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Data Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Registro Detalhado de Operações</h3>
              <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Soma de Colunas Disponível no Rodapé</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-slate-600">{filteredData.length} Registros Ativos</span>
          </div>
        </div>
        
        <div className="overflow-auto max-h-[600px] custom-scrollbar shadow-inner bg-white">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 border-b border-slate-800">
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Registro</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">OPM / Responsável</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Local</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Adultos</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Adol.</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Armas</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Perfuro</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Simul.</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Histórico / Dinâmica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic">
              {filteredData.map((item, idx) => {
                const keys = Object.keys(item);
                const getVal = (patterns: string[]) => {
                  const key = keys.find(k => {
                    const normalizedKey = normalizeStr(k);
                    return patterns.some(p => normalizedKey.includes(normalizeStr(p)));
                  });
                  return key ? String(item[key]) : '-';
                };

                const getEmailVal = () => {
                  const emailPatterns = ['email', 'mail'];
                  const key = keys.find(k => {
                    const norm = normalizeStr(k);
                    return emailPatterns.some(p => norm.includes(p));
                  });
                  return key ? String(item[key]) : '-';
                };

                const getLocalVal = () => {
                  const localPatterns = ['local', 'endereco', 'rua', 'bairro', 'zona', 'onde', 'municipio', 'cidade'];
                  const excludePatterns = ['email', 'mail', 'carimbo', 'temp', 'data', 'hora'];
                  
                  const key = keys.find(k => {
                    const norm = normalizeStr(k);
                    const hasLocalKey = localPatterns.some(p => norm.includes(p));
                    const hasExcludeKey = excludePatterns.some(p => norm.includes(p));
                    return hasLocalKey && !hasExcludeKey;
                  });
                  return key ? String(item[key]) : '-';
                };

                const localValue = getLocalVal();

                return (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedRow(item)}
                    className="hover:bg-sky-50/50 transition-all duration-200 cursor-pointer group border-b border-slate-100"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                        {getVal(['dia'])} - {getVal(['turno'])}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {getVal(['carimbo', 'data'])}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-widest">
                        {getVal(['opm', 'pca', 'unidade'])}
                      </div>
                      <div className="text-[9px] text-slate-400 lowercase mt-1 block truncate max-w-[150px]">
                        {getEmailVal()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase">
                      {localValue && localValue !== '-' ? (
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px] font-mono text-slate-500" title={localValue}>
                            {localValue}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLocalForMap(localValue);
                            }}
                            className="p-1.5 bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white border border-sky-100 rounded-lg transition-all active:scale-95 flex items-center justify-center shadow-sm"
                            title="Visualizar Mapa do Local"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-black min-w-[30px] text-center ${getVal(['adulto']) !== '-' && getVal(['adulto']) !== '0' ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200' : 'text-slate-300 font-normal bg-slate-50'}`}>
                        {getVal(['adulto'])}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-black min-w-[30px] text-center ${getVal(['adolescente']) !== '-' && getVal(['adolescente']) !== '0' ? 'bg-amber-100/80 text-amber-800 border border-amber-200' : 'text-slate-300 font-normal bg-slate-50'}`}>
                        {getVal(['adolescente'])}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-black min-w-[30px] text-center ${getVal(['arma']) !== '-' && getVal(['arma']) !== '0' ? 'bg-rose-100/80 text-rose-800 border border-rose-200' : 'text-slate-300 font-normal bg-slate-50'}`}>
                        {getVal(['arma'])}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-black min-w-[30px] text-center ${getVal(['perfuro']) !== '-' && getVal(['perfuro']) !== '0' ? 'bg-sky-100/80 text-sky-800 border border-sky-200' : 'text-slate-300 font-normal bg-slate-50'}`}>
                        {getVal(['perfuro'])}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-black min-w-[30px] text-center ${getVal(['simulacro']) !== '-' && getVal(['simulacro']) !== '0' ? 'bg-indigo-100/80 text-indigo-800 border border-indigo-200' : 'text-slate-300 font-normal bg-slate-50'}`}>
                        {getVal(['simulacro'])}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-600 font-medium leading-relaxed max-w-[300px] bg-slate-50/30 overflow-hidden whitespace-normal border-l border-slate-100">
                      <p className="line-clamp-2 group-hover:line-clamp-none transition-all duration-300" title="Clique para ver relato completo">
                        {getVal(['dinamica', 'vulto', 'interesse', 'resumo'])}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer with Totals */}
            <tfoot className="sticky bottom-0 bg-slate-900 font-black text-white z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <tr>
                <td colSpan={3} className="px-6 py-5 text-xs uppercase tracking-widest text-sky-400 border-t border-slate-800 bg-slate-900">
                  Totais Acumulados da Listagem:
                </td>
                <td className="px-6 py-5 text-center text-sm border-t border-slate-800 bg-slate-800">{totals.adultos}</td>
                <td className="px-6 py-5 text-center text-sm border-t border-slate-800 bg-slate-800">{totals.adolescentes}</td>
                <td className="px-6 py-5 text-center text-sm border-t border-slate-800 bg-slate-800">{totals.armas}</td>
                <td className="px-6 py-5 text-center text-sm border-t border-slate-800 bg-slate-800">{totals.perfuro}</td>
                <td className="px-6 py-5 text-center text-sm border-t border-slate-800 bg-slate-800">{totals.simulacros}</td>
                <td className="border-t border-slate-800 bg-slate-900"></td>
              </tr>
            </tfoot>
          </table>
          {filteredData.length === 0 && (
            <div className="p-24 text-center">
              <div className="inline-block p-6 bg-slate-50 rounded-full mb-4">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhum dado encontrado com os termos de busca.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRow && (() => {
          // Extrai o local do selectedRow de forma dinâmica
          const rowLocalValue = (() => {
            const keys = Object.keys(selectedRow);
            const localPatterns = ['local', 'endereco', 'rua', 'bairro', 'zona', 'onde', 'municipio', 'cidade'];
            const excludePatterns = ['email', 'mail', 'carimbo', 'temp', 'data', 'hora'];
            const key = keys.find(k => {
              const norm = normalizeStr(k);
              const hasLocalKey = localPatterns.some(p => norm.includes(p));
              const hasExcludeKey = excludePatterns.some(p => norm.includes(p));
              return hasLocalKey && !hasExcludeKey;
            });
            return key ? String(selectedRow[key]) : null;
          })();

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-left">
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
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic leading-tight">Detalhamento</h3>
                      <p className="text-sky-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Dados Técnicos</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 max-h-[50vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {Object.entries(selectedRow).map(([key, value]) => (
                      <div key={key} className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm group hover:border-sky-200 transition-all duration-300">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-sky-500 transition-colors uppercase">{key}</p>
                        <p className="text-[12px] sm:text-[13px] font-bold text-slate-800 break-words leading-relaxed">{String(value || 'N/A')}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                  {rowLocalValue && rowLocalValue !== '-' && (
                    <button 
                      onClick={() => {
                        setSelectedLocalForMap(rowLocalValue);
                      }}
                      className="w-full sm:w-auto bg-sky-600 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-sky-700 transition-all active:scale-95 shadow-xl shadow-sky-600/20 flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4 text-cyan-300" />
                      Visualizar Mapa
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedRow(null)}
                    className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-xl sm:rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Map Modal */}
      <AnimatePresence>
        {selectedLocalForMap && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-left">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLocalForMap(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-white w-full max-w-4xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden z-[101] border border-white/20 mt-auto sm:mt-0"
            >
              <div className="bg-slate-900 p-6 sm:p-8 text-white relative">
                <div className="absolute top-0 right-0 p-4 sm:p-6">
                  <button 
                    onClick={() => setSelectedLocalForMap(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="p-3 sm:p-4 bg-sky-500/20 rounded-2xl border border-sky-500/20">
                    <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight italic leading-tight">Mapa Operacional</h3>
                    <p className="text-sky-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Localizador PM/3</p>
                  </div>
                </div>
              </div>
              
              <div className="p-2 bg-slate-950 aspect-[16/10] sm:aspect-[16/9] min-h-[350px] relative">
                <iframe 
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedLocalForMap)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full rounded-2xl border-0 shadow-inner"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              
              <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex justify-between items-center gap-4">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 truncate max-w-sm">
                  {selectedLocalForMap}
                </span>
                <button 
                  onClick={() => setSelectedLocalForMap(null)}
                  className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-xl sm:rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                  Fechar Mapa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

