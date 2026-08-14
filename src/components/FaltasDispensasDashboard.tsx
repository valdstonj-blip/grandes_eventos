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
  X,
  Filter,
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
  LabelList
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYtx0hTBc1HWdOieZcs-ywXV-usnc8jHwl8Z6LU1376oj71eaRgT_p1zYix-RvZHIWOQ5F5icxUM9_/pub?output=csv';

export const FaltasDispensasDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCPAs, setSelectedCPAs] = useState<string[]>([]);
  const [isCPADropdownOpen, setIsCPADropdownOpen] = useState(false);
  const [selectedOPMs, setSelectedOPMs] = useState<string[]>([]);
  const [isOPMDropdownOpen, setIsOPMDropdownOpen] = useState(false);
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

  // Helper para deduzir CPA a partir de um item
  const getItemCPA = (item: any) => {
    const keys = Object.keys(item);
    
    // 1. Procurar coluna específica de CPA, comando ou intermediário
    const cpaKey = keys.find(k => {
      const norm = normalize(k);
      return ['cpa', 'comando', 'intermediario', 'comando de policiamento de area', 'comando de policiamento de área'].some(p => norm.includes(p)) && !norm.includes('carimbo');
    });
    
    if (cpaKey && item[cpaKey]) {
      const val = String(item[cpaKey]).trim().toUpperCase();
      if (val && val !== '-' && val !== 'N/A') {
        return val;
      }
    }

    // 2. Tentar deduzir a partir da OPM/unidade
    const opmKey = keys.find(k => {
      const norm = normalize(k);
      return ['opm', 'pca', 'unidade'].some(p => norm.includes(p));
    });
    
    if (opmKey && item[opmKey]) {
      const opmVal = String(item[opmKey]).trim().toUpperCase();
      const match = opmVal.match(/(\d+)/);
      if (match) {
        const bpmNum = parseInt(match[1], 10);
        // Mapeamento oficial aproximado da PMERJ
        if ([2, 3, 4, 5, 6, 19, 23, 31].includes(bpmNum)) return '1º CPA';
        if ([9, 14, 18, 27, 40, 41].includes(bpmNum)) return '2º CPA';
        if ([15, 20, 21, 24, 34, 39, 42].includes(bpmNum)) return '3º CPA';
        if ([7, 12, 25, 35].includes(bpmNum)) return '4º CPA';
        if ([10, 28, 33, 37].includes(bpmNum)) return '5º CPA';
        if ([8, 29, 32, 36].includes(bpmNum)) return '6º CPA';
        if ([11, 26, 30, 38].includes(bpmNum)) return '7º CPA';
      }
      
      if (opmVal.includes('CPA') || opmVal.includes('C.P.A.')) {
        return opmVal;
      }
    }
    
    return 'OUTROS';
  };

  // Lista de CPAs únicas coletadas dinamicamente
  const allCPAs = useMemo(() => {
    const cpas = new Set<string>();
    data.forEach(item => {
      const cpa = getItemCPA(item);
      if (cpa) {
        cpas.add(cpa);
      }
    });
    return Array.from(cpas).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 999;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 999;
      return numA - numB;
    });
  }, [data]);

  // Lista de OPMs filhas dependentes das CPAs selecionadas
  const availableOPMs = useMemo(() => {
    const opms = new Set<string>();
    data.forEach(item => {
      if (selectedCPAs.length > 0) {
        const itemCPA = getItemCPA(item);
        if (!selectedCPAs.includes(itemCPA)) {
          return;
        }
      }
      
      const keys = Object.keys(item);
      const opmKey = keys.find(k => {
        const norm = normalize(k);
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
  }, [data, selectedCPAs]);

  // Sincroniza a seleção das OPMs quando o CPA selecionado muda
  useEffect(() => {
    if (selectedCPAs.length > 0) {
      setSelectedOPMs(prev => prev.filter(opm => availableOPMs.includes(opm)));
    }
  }, [selectedCPAs, availableOPMs]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Filtrar por CPA
      if (selectedCPAs.length > 0) {
        const itemCPA = getItemCPA(item);
        if (!selectedCPAs.includes(itemCPA)) {
          return false;
        }
      }
      
      // 2. Filtrar por OPM
      if (selectedOPMs.length > 0) {
        const keys = Object.keys(item);
        const opmKey = keys.find(k => {
          const norm = normalize(k);
          return ['opm', 'pca', 'unidade'].some(p => norm.includes(p));
        });
        if (opmKey) {
          const val = String(item[opmKey]).trim().toUpperCase();
          if (!selectedOPMs.includes(val)) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    });
  }, [data, selectedCPAs, selectedOPMs]);

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

  // Helper para extrair lista de militares faltosos limpa
  const parseFaltososList = (text: string): string[] => {
    if (!text) return [];
    const clean = String(text).trim();
    if (!clean || ['0', '-', 'NADA', 'NENHUM', 'SEM FALTAS', 'NÃO HOUVE', 'NAO HOUVE', 'NEGATIVO', 'SEM ALTERACAO', 'SEM ALTERAÇÃO'].includes(clean.toUpperCase())) {
      return [];
    }
    // Divide por ';' ou quebra de linha
    return clean
      .split(/;|\n/)
      .map(s => s.trim().replace(/^,|,$/g, ''))
      .filter(s => s.length > 2 && !['0', '-', 'NENHUM'].includes(s.toUpperCase()));
  };

  // Helper para extrair a OPM de origem de um texto de faltoso (ex: "1° SGT JOSÉ RG:99999 14° BPM")
  const extractOriginOPM = (text: string): string => {
    const match = text.match(/(?:(?:RG:?\s*\d+\s+)|(?:\b))((?:\d+°?\s*BPM)|(?:UP\/PM)|(?:BP\w+)|(?:CPA)|(?:BOPE)|(?:BAC)|(?:GAM)|(?:BPTUR)|(?:BPRV)|(?:CME)|(?:COE))\b/i);
    if (match && match[1]) {
      return match[1].toUpperCase().replace(/\s+/g, ' ');
    }
    const matchGenericBpm = text.match(/(\d+°?\s*BPM)/i);
    if (matchGenericBpm) {
      return matchGenericBpm[1].toUpperCase();
    }
    return 'NÃO ESPECIFICADA';
  };

  // Helper para contar policiais faltosos
  const countFaltososInRow = (item: any): number => {
    const keys = Object.keys(item);

    // 1. Procurar coluna de texto de identificação de faltosos
    const faltosoKey = keys.find(k => {
      const norm = normalize(k);
      return norm.includes('identificacao') || norm.includes('faltoso') || norm.includes('relacao');
    });

    if (faltosoKey && item[faltosoKey]) {
      const list = parseFaltososList(item[faltosoKey]);
      if (list.length > 0) {
        return list.length;
      }
    }

    // 2. Procurar coluna de quantidade de falta
    const qtdKey = keys.find(k => {
      const norm = normalize(k);
      return (norm.includes('qtd') || norm.includes('quantidade')) && norm.includes('falta');
    });

    if (qtdKey && item[qtdKey]) {
      const val = parseInt(String(item[qtdKey]).replace(/[^0-9]/g, ''));
      if (!isNaN(val) && val > 0) {
        return val;
      }
    }

    return 0;
  };

  const totals = useMemo(() => {
    const totalFaltosos = filteredData.reduce((acc, item) => acc + countFaltososInRow(item), 0);
    return {
      faltas: totalFaltosos,
      total: filteredData.length
    };
  }, [filteredData]);

  // Faltas por Unidade Demandante (Local de Apresentação / OPM Informante)
  const opmDemandanteData = useMemo(() => {
    const map: Record<string, { opm: string; faltas: number; envios: number }> = {};
    filteredData.forEach(item => {
      const keys = Object.keys(item);
      const opmKey = keys.find(k => {
        const norm = normalize(k);
        return ['opm', 'pca', 'unidade'].some(p => norm.includes(p));
      });
      const opmVal = (opmKey && item[opmKey]) ? String(item[opmKey]).trim().toUpperCase() : 'OUTROS';
      if (!map[opmVal]) {
        map[opmVal] = { opm: opmVal, faltas: 0, envios: 0 };
      }
      map[opmVal].envios += 1;
      map[opmVal].faltas += countFaltososInRow(item);
    });
    return Object.values(map).sort((a, b) => b.faltas - a.faltas || b.envios - a.envios);
  }, [filteredData]);

  // Faltas por Unidade de Origem do Militar Faltoso
  const opmOrigemData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach(item => {
      const keys = Object.keys(item);
      const faltosoKey = keys.find(k => {
        const norm = normalize(k);
        return norm.includes('identificacao') || norm.includes('faltoso') || norm.includes('relacao');
      });
      if (faltosoKey && item[faltosoKey]) {
        const list = parseFaltososList(item[faltosoKey]);
        list.forEach(f => {
          const origin = extractOriginOPM(f);
          map[origin] = (map[origin] || 0) + 1;
        });
      }
    });

    const entries = Object.entries(map).map(([opm, count]) => ({
      opm,
      faltas: count
    }));
    return entries.sort((a, b) => b.faltas - a.faltas);
  }, [filteredData]);

  // Totais da Tabela - Soma APENAS colunas quantitativas reais de faltas
  const tableColumnTotals = useMemo(() => {
    if (filteredData.length === 0) return {};
    const keys = Object.keys(filteredData[0]);
    const sums: Record<string, number> = {};
    
    keys.forEach(key => {
      const normKey = normalize(key);
      
      // Filtros de segurança
      const isForbiddenText = ['email', 'nome', 'guerra', 'posto', 'grad', 'obs', 'carimbo', 'timestamp', 'celular', 'data', 'hora', 'local', 'endereco', 'dinamica', 'historico', 'relato'].some(p => normKey.includes(p));
      const isForbiddenId = ['rg', 're', 'id', 'repm', 'unidade', 'opm', 'cod', 'cpf'].some(p => normKey === p || (normKey.startsWith(p) && !['qtd', 'falta'].some(q => normKey.includes(q))));
      
      const isQuantity = normKey.includes('quantidade') || 
                        normKey.includes('qtd') || 
                        normKey.includes('falta');

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

  const [chartViewMode, setChartViewMode] = useState<'demandante' | 'origem'>('demandante');

  const barData = useMemo(() => {
    const colors = ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7', '#34d399', '#f97316', '#e11d48'];
    const activeList = chartViewMode === 'demandante' ? opmDemandanteData : opmOrigemData;
    
    return activeList.slice(0, 8).map((item, idx) => ({
      name: item.opm,
      value: item.faltas,
      color: colors[idx % colors.length]
    }));
  }, [chartViewMode, opmDemandanteData, opmOrigemData]);

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('RELATÓRIO OPERACIONAL DE FALTAS', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 21);

    // 1. Quadro de Totais (Quick View)
    autoTable(doc, {
      head: [['Indicador Operacional', 'Quantitativo']],
      body: [
        ['Formulários / Registros Transmitidos', String(totals.total)],
        ['Total de Policiais Faltosos Registrados', String(totals.faltas)],
      ],
      startY: 26,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: 'center', fontStyle: 'bold', textColor: [225, 29, 72] } }
    });

    // 2. Detalhamento de Faltas
    const detailedRows: any[] = [];
    
    // Identificar colunas dinamicamente
    const colKeys = data[0] ? Object.keys(data[0]) : [];
    const nameCol = colKeys.find(k => normalize(k).includes('nome') || normalize(k).includes('guerra') || normalize(k).includes('escala')) || '';
    const postCol = colKeys.find(k => normalize(k).includes('posto') || normalize(k).includes('grad')) || '';
    const opmCol = colKeys.find(k => normalize(k).includes('opm') || normalize(k).includes('unidade')) || '';
    const turnoCol = colKeys.find(k => normalize(k).includes('turno') || normalize(k).includes('horario') || normalize(k).includes('dia')) || '';
    const faltosoCol = colKeys.find(k => normalize(k).includes('identificacao') || normalize(k).includes('faltoso') || normalize(k).includes('relacao')) || '';

    filteredData.forEach(item => {
      const faltasQtd = countFaltososInRow(item);
      const faltososText = faltosoCol && item[faltosoCol] ? String(item[faltosoCol]).trim() : '';
      
      // Só entra no relatório se houver falta registrada
      if (faltasQtd > 0 || (faltososText && !['0', '-', 'NADA', 'NENHUM', 'SEM FALTAS'].includes(faltososText.toUpperCase()))) {
        const responsavel = `${item[postCol] || ''} ${item[nameCol] || ''}`.trim();
        const opmDemandante = item[opmCol] || 'N/A';
        const turno = item[turnoCol] || 'N/A';
        
        detailedRows.push([
          opmDemandante,
          responsavel || 'N/A',
          turno,
          `${faltasQtd} Falta(s)`,
          faltososText || 'Identificação não detalhada.'
        ]);
      }
    });

    if (detailedRows.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Tabela Detalhada de Informações de Faltas', 14, (doc as any).lastAutoTable.finalY + 10);

      autoTable(doc, {
        head: [['OPM Apresentação', 'Oficial / Responsável', 'Turno / Horário', 'Qtd', 'Identificação do Policial Faltoso (Origem/RG)']],
        body: detailedRows,
        startY: (doc as any).lastAutoTable.finalY + 14,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold' },
          1: { cellWidth: 32 },
          2: { cellWidth: 32 },
          3: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [225, 29, 72] },
          4: { cellWidth: 'auto' }
        }
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Nenhuma falta registrada no período selecionado.', 14, (doc as any).lastAutoTable.finalY + 15);
    }

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('PMERJ / EMG PM/3 - Relatório de Controle de Faltas', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`RELATORIO_FALTAS_PM3_${new Date().toISOString().split('T')[0]}.pdf`);
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col gap-4 relative z-40 animate-fade-in">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 w-full">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-[650px]">
            {/* CPA Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => {
                  setIsCPADropdownOpen(!isCPADropdownOpen);
                  setIsOPMDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500/20 shadow-inner outline-none transition-all text-left font-black tracking-wider uppercase text-xs active:bg-slate-100"
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-4 h-4 text-sky-500 shrink-0" />
                  {selectedCPAs.length === 0 ? (
                    <span className="text-slate-500 font-extrabold">Todos os Comandos (CPA)</span>
                  ) : (
                    <span className="text-sky-600 font-extrabold">
                      {selectedCPAs.length} CPA(s)
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isCPADropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCPADropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsCPADropdownOpen(false)} 
                  />
                  <div className="absolute left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                      <span>Selecione os CPAs</span>
                      {selectedCPAs.length > 0 && (
                        <button
                          onClick={() => setSelectedCPAs([])}
                          className="text-rose-500 hover:text-rose-700 transition-colors normal-case text-[10px] font-bold"
                        >
                          Limpar Todos
                        </button>
                      )}
                    </div>
                    {allCPAs.map(cpa => {
                      const isSelected = selectedCPAs.includes(cpa);
                      return (
                        <button
                          key={cpa}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCPAs(selectedCPAs.filter(c => c !== cpa));
                            } else {
                              setSelectedCPAs([...selectedCPAs, cpa]);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-left transition-all ${
                            isSelected 
                              ? 'bg-sky-50 text-sky-700 border-l-4 border-l-sky-500' 
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span>{cpa}</span>
                          {isSelected && <Check className="w-4 h-4 text-sky-500" />}
                        </button>
                      );
                    })}
                    {allCPAs.length === 0 && (
                      <p className="text-[10px] italic text-slate-400 p-2 text-center uppercase font-bold">Nenhum CPA encontrado</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* OPM Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => {
                  setIsOPMDropdownOpen(!isOPMDropdownOpen);
                  setIsCPADropdownOpen(false);
                }}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500/20 shadow-inner outline-none transition-all text-left font-black tracking-wider uppercase text-xs active:bg-slate-100"
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-4 h-4 text-sky-500 shrink-0" />
                  {selectedOPMs.length === 0 ? (
                    <span className="text-slate-500 font-extrabold">Todas as OPMs Ativas</span>
                  ) : (
                    <span className="text-sky-600 font-extrabold">
                      {selectedOPMs.length} OPM(s)
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
                    {availableOPMs.map(opm => {
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
                    {availableOPMs.length === 0 && (
                      <p className="text-[10px] italic text-slate-400 p-2 text-center uppercase font-bold">Nenhuma OPM encontrada</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:flex items-center gap-2 w-full lg:w-auto">
            {(selectedCPAs.length > 0 || selectedOPMs.length > 0) && (
              <button 
                onClick={() => { setSelectedCPAs([]); setSelectedOPMs([]); }}
                className="col-span-2 lg:col-span-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200/60 px-3 lg:px-5 py-2.5 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-rose-100/70 transition-all shadow-sm active:scale-95 w-full lg:w-auto z-10 animate-fade-in"
              >
                <X className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-rose-500" /> 
                Limpar Filtros
              </button>
            )}
            <button 
              onClick={fetchData} 
              className="flex items-center justify-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-3 lg:px-5 py-2.5 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm active:scale-95 w-full lg:w-auto z-10"
            >
              <RefreshCw className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> 
              Sincronizar
            </button>
            <button 
              onClick={exportPDF} 
              className="flex items-center justify-center gap-2 bg-slate-900 text-white px-3 lg:px-6 py-2.5 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95 w-full lg:w-auto z-10"
            >
              <FileDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> 
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Badge lists for filtered CPAs and OPMs */}
        {(selectedCPAs.length > 0 || selectedOPMs.length > 0) && (
          <div className="flex flex-wrap gap-1.5 items-center justify-start py-1 px-1 border-t border-slate-100 pt-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Filtros Ativos:</span>
            
            {/* CPAs Badges */}
            {selectedCPAs.map(cpa => (
              <span 
                key={cpa} 
                className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[9px] font-black text-sky-400 uppercase tracking-wider"
              >
                CPA: {cpa}
                <button 
                  onClick={() => setSelectedCPAs(selectedCPAs.filter(c => c !== cpa))}
                  className="hover:bg-slate-800 p-0.5 rounded-full transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-sky-400" />
                </button>
              </span>
            ))}

            {/* OPMs Badges */}
            {selectedOPMs.map(opm => (
              <span 
                key={opm} 
                className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-lg text-[9px] font-black text-sky-700 uppercase tracking-wider"
              >
                OPM: {opm}
                <button 
                  onClick={() => setSelectedOPMs(selectedOPMs.filter(o => o !== opm))}
                  className="hover:bg-sky-200 p-0.5 rounded-full transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-sky-700" />
                </button>
              </span>
            ))}

            {/* General dynamic clear card */}
            <button
               onClick={() => { setSelectedCPAs([]); setSelectedOPMs([]); }}
               className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200/50 hover:bg-rose-100 px-2.5 py-1 rounded-lg text-[9px] font-black text-rose-700 uppercase tracking-wider transition-all active:scale-95 cursor-pointer ml-auto"
            >
               <X className="w-2.5 h-2.5" />
               Limpar Todos
            </button>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1 relative z-10">Formulários Transmitidos</p>
          <div className="flex items-end gap-3 relative z-10">
            <p className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">{totals.total}</p>
            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Envios</p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-3 relative z-10">Registros de serviço recebidos da mesa operacional.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white p-6 lg:p-7 rounded-3xl border border-rose-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 relative z-10">Total de Policiais Faltosos</p>
          <div className="flex items-end gap-3 relative z-10">
            <p className="text-4xl lg:text-5xl font-black text-rose-600 tracking-tighter">{totals.faltas}</p>
            <p className="text-[10px] font-bold text-rose-400 mb-1 uppercase tracking-wider">Militares Ausentes</p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-3 relative z-10">Efetivo que não compareceu ao ponto de apresentação.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 relative z-10">OPMs com Desfalque</p>
          <div className="flex items-end gap-3 relative z-10">
            <p className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">
              {opmDemandanteData.filter(o => o.faltas > 0).length}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Unidades</p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-3 relative z-10">Locais de serviço com registros ativos de ausência.</p>
        </motion.div>
      </div>

      {/* Charts Section with Tactical Context */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          {/* Chart Header & Mode Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {chartViewMode === 'demandante' 
                    ? 'Distribuição de Faltas por Unidade Demandante (Local de Apresentação)' 
                    : 'Distribuição de Faltas por Unidade de Origem do Militar'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 ml-3.5">
                {chartViewMode === 'demandante'
                  ? 'Exibe onde o serviço foi desfalcado (unidade que solicitou o reforço operacional)'
                  : 'Exibe o batalhão de lotação do policial militar que não compareceu'}
              </p>
            </div>

            {/* Toggle View Mode */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
              <button
                onClick={() => setChartViewMode('demandante')}
                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${
                  chartViewMode === 'demandante'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Local de Apresentação
              </button>
              <button
                onClick={() => setChartViewMode('origem')}
                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${
                  chartViewMode === 'origem'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OPM de Origem do Militar
              </button>
            </div>
          </div>

          {/* Tactical Context Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-start gap-3.5 shadow-md">
            <Shield className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-black text-sky-300 uppercase tracking-wider text-[11px]">
                Nota Operacional da 3ª Seção (EMG PM/3):
              </p>
              <p className="text-slate-300 leading-relaxed font-normal">
                A unidade informante (ex: <strong className="text-white font-bold">18° BPM</strong>) indica o <strong className="text-sky-300">Local de Apresentação</strong> onde o militar escalado deveria ter se apresentado. Os policiais ausentes pertencem a <strong className="text-amber-300">Unidades de Origem</strong> (ex: <span className="underline decoration-amber-400">14° BPM</span>, <span className="underline decoration-amber-400">16° BPM</span>), responsáveis administrativas pelo militar.
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-64 min-h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} width={500} height={300}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} domain={[0, 'dataMax + 1']} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [`${val} Policial(is) Faltoso(s)`, chartViewMode === 'demandante' ? 'Desfalque no Posto' : 'Origem da Falta']}
                />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={36}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ fill: '#0f172a', fontSize: 11, fontWeight: 800 }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Table: Tabela de Informações de Faltas */}
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-rose-500 rounded-full" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tabela de Informações de Faltas</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-medium ml-4 mt-0.5">
              Registros detalhados de faltas transmitidos pelas unidades operacionais ({filteredData.length} registros)
            </p>
          </div>
        </div>
        
        <div className="overflow-auto max-h-[620px] custom-scrollbar shadow-inner bg-white">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 border-b border-slate-800">
                {data[0] && Object.keys(data[0]).map((header) => (
                  <th key={header} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-sky-400 whitespace-nowrap bg-slate-900 border-b border-slate-800">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedRow(item)}
                  className="hover:bg-sky-50/40 transition-all group cursor-pointer border-b border-slate-50"
                >
                  {data[0] && Object.keys(data[0]).map((key, vIdx) => {
                    const value = item[key];
                    const normKey = normalize(key);
                    const isFaltosoCol = normKey.includes('identificacao') || normKey.includes('faltoso') || normKey.includes('relacao');
                    const isLongText = normKey.includes('obs') || normKey.includes('motivo') || normKey.includes('justif') || normKey.includes('desc');
                    
                    // Renderização especial e elegante da coluna de Identificação do Policial Faltoso
                    if (isFaltosoCol) {
                      const faltososList = parseFaltososList(String(value || ''));
                      
                      return (
                        <td key={vIdx} className="px-6 py-3.5 min-w-[280px] max-w-[440px]">
                          {faltososList.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {faltososList.map((militar, mIdx) => (
                                <div 
                                  key={mIdx}
                                  className="bg-rose-50/90 border border-rose-200/80 rounded-xl px-3 py-2 text-[11px] text-slate-800 font-medium leading-snug shadow-xs flex items-start gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                                  <div className="flex-1 break-words font-semibold">
                                    {militar}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-bold uppercase italic">
                              {String(value || 'Sem Faltas')}
                            </span>
                          )}
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={vIdx} 
                        className={`px-6 py-4 text-[11px] font-bold text-slate-600 group-hover:text-slate-900 ${isLongText ? 'max-w-[240px] truncate' : 'whitespace-nowrap'}`}
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
                  <td key={i} className="px-6 py-4 text-[10px] uppercase tracking-widest text-sky-400 border-t border-slate-800 bg-slate-900">
                    {i === 0 ? 'TOTAIS GERAIS' : (tableColumnTotals[key] > 0 ? <span className="text-white text-sm font-black">{tableColumnTotals[key]}</span> : '-')}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
          {filteredData.length === 0 && (
            <div className="p-20 text-center">
              <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum registro localizado com os filtros selecionados.</p>
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
