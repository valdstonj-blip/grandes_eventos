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
  Building2,
  Users,
  MapPin,
  Map,
  ChevronDown,
  Check,
  Clock,
  Calendar
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
  Pie,
  LabelList
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PUBLISHED_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRyoV-aJYD3NfKQlfl_t6cEQJ3_1UlZ1CmbLTy2MyCGym8Q4yTPA7OLPVTt3m7z_R0B9w6ik0WfCvbO/pub?output=csv';

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-2xl text-white text-xs z-50">
        <p className="font-black text-sky-400 mb-2 border-b border-slate-800 pb-1.5 uppercase tracking-wider">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-6 font-bold text-[11px]">
              <span className="flex items-center gap-2" style={{ color: entry.fill || entry.color }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill || entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono text-white text-sm font-black">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const OcorrenciasDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCPAs, setSelectedCPAs] = useState<string[]>([]);
  const [isCPADropdownOpen, setIsCPADropdownOpen] = useState(false);
  const [selectedOPMs, setSelectedOPMs] = useState<string[]>([]);
  const [isOPMDropdownOpen, setIsOPMDropdownOpen] = useState(false);
  const [selectedTurnos, setSelectedTurnos] = useState<string[]>([]);
  const [isTurnoDropdownOpen, setIsTurnoDropdownOpen] = useState(false);
  const [selectedLocalForMap, setSelectedLocalForMap] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('cache_ocorrencias');
      localStorage.removeItem('cache_ocorrencias_time');
      const timeParam = new Date().getTime();
      const fetchUrl = `${PUBLISHED_CSV_URL}&_t=${timeParam}`;
      let result = await getCSVData<any>(fetchUrl);
      if (!result || result.length === 0) {
        result = await getCSVData<any>(PUBLISHED_CSV_URL);
      }
      setData(result || []);
    } catch (error) {
      console.error('Error loading occurrences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper de normalização global para evitar inconsistências
  const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s/g, '');

  // Helper para deduzir CPA a partir de um item
  const getItemCPA = (item: any) => {
    if (!item || typeof item !== 'object') return 'OUTROS';
    const keys = Object.keys(item);
    
    // 1. Procurar coluna específica de CPA, comando ou intermediário
    const cpaKey = keys.find(k => {
      const norm = normalizeStr(k);
      return (
        norm.includes('cpa') || 
        norm.includes('intermediario') || 
        (norm.includes('comando') && !norm.includes('carimbo'))
      );
    });
    
    if (cpaKey && item[cpaKey]) {
      const val = String(item[cpaKey]).trim().toUpperCase();
      if (val && val !== '-' && val !== 'N/A' && val !== 'NULL') {
        const numMatch = val.match(/(\d+)/);
        if (numMatch) {
          return `${numMatch[1]}º CPA`;
        }
        return val;
      }
    }

    // 2. Tentar deduzir a partir da OPM/unidade se CPA vier em branco
    const opmKey = keys.find(k => {
      const norm = normalizeStr(k);
      return ['opm', 'unidade'].some(p => norm.includes(p));
    });
    
    if (opmKey && item[opmKey]) {
      const opmVal = String(item[opmKey]).trim().toUpperCase();
      const match = opmVal.match(/(\d+)/);
      if (match) {
        const bpmNum = parseInt(match[1], 10);
        if ([2, 3, 4, 5, 6, 19, 23, 31].includes(bpmNum)) return '1º CPA';
        if ([9, 14, 18, 27, 40, 41].includes(bpmNum)) return '2º CPA';
        if ([15, 20, 21, 24, 34, 39, 42].includes(bpmNum)) return '3º CPA';
        if ([7, 12, 25, 35].includes(bpmNum)) return '4º CPA';
        if ([10, 28, 33, 37].includes(bpmNum)) return '5º CPA';
        if ([8, 29, 32, 36].includes(bpmNum)) return '6º CPA';
        if ([11, 26, 30, 38].includes(bpmNum)) return '7º CPA';
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
  }, [data, selectedCPAs]);

  // Sincroniza a seleção das OPMs quando o CPA selecionado muda
  useEffect(() => {
    if (selectedCPAs.length > 0) {
      setSelectedOPMs(prev => prev.filter(opm => availableOPMs.includes(opm)));
    }
  }, [selectedCPAs, availableOPMs]);

  // Helper para extrair o Turno de um item
  const getItemTurno = (item: any) => {
    if (!item || typeof item !== 'object') return 'NÃO INFORMADO';
    const keys = Object.keys(item);
    const key = keys.find(k => {
      const norm = normalizeStr(k);
      return norm.includes('turno');
    });
    if (key && item[key]) {
      const val = String(item[key]).trim().toUpperCase();
      if (val && val !== '-' && val !== 'N/A' && val !== 'NULL') return val;
    }
    const timeKey = keys.find(k => {
      const norm = normalizeStr(k);
      return norm.includes('carimbo') || norm.includes('timestamp') || norm.includes('hora');
    });
    if (timeKey && item[timeKey]) {
      const raw = String(item[timeKey]);
      const match = raw.match(/(\d{1,2}):\d{2}/);
      if (match) {
        const hour = parseInt(match[1], 10);
        if (hour >= 6 && hour < 12) return 'MANHÃ (06h-12h)';
        if (hour >= 12 && hour < 18) return 'TARDE (12h-18h)';
        if (hour >= 18 && hour < 24) return 'NOITE (18h-24h)';
        return 'MADRUGADA (00h-06h)';
      }
    }
    return 'NÃO INFORMADO';
  };

  // Helper para extrair Dia/Data de um item
  const getItemDia = (item: any) => {
    if (!item || typeof item !== 'object') return 'OUTROS';
    const keys = Object.keys(item);
    const key = keys.find(k => {
      const norm = normalizeStr(k);
      return (norm.includes('dia') || norm.includes('data')) && !norm.includes('carimbo') && !norm.includes('timestamp');
    });
    if (key && item[key]) {
      const val = String(item[key]).trim().toUpperCase();
      if (val && val !== '-' && val !== 'N/A' && val !== 'NULL') return val;
    }
    const timeKey = keys.find(k => {
      const norm = normalizeStr(k);
      return norm.includes('carimbo') || norm.includes('timestamp') || norm.includes('data');
    });
    if (timeKey && item[timeKey]) {
      const raw = String(item[timeKey]);
      const match = raw.match(/(\d{1,2}[\/\.-]\d{1,2}(?:[\/\.-]\d{2,4})?)/);
      if (match) return match[1];
    }
    return 'OUTROS';
  };

  // Listas para os seletores
  const allTurnos = useMemo(() => {
    const turnos = new Set<string>();
    data.forEach(item => {
      const t = getItemTurno(item);
      if (t) turnos.add(t);
    });
    return Array.from(turnos).sort();
  }, [data]);

  const allDias = useMemo(() => {
    const dias = new Set<string>();
    data.forEach(item => {
      const d = getItemDia(item);
      if (d) dias.add(d);
    });
    return Array.from(dias).sort();
  }, [data]);

  // Lista de todas as OPMs para referência inicial se necessário
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
          const norm = normalizeStr(k);
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

      // 3. Filtrar por Turno / Dia / Horário
      if (selectedTurnos.length > 0) {
        const itemTurno = getItemTurno(item);
        if (!selectedTurnos.includes(itemTurno)) {
          return false;
        }
      }

      return true;
    });
  }, [data, selectedCPAs, selectedOPMs, selectedTurnos]);

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

  const vultoCount = useMemo(() => {
    return filteredData.filter(item => {
      const keys = Object.keys(item);
      const vKey = keys.find(k => normalizeStr(k).includes('vulto'));
      if (!vKey) return false;
      const val = String(item[vKey] || '').toUpperCase();
      return val.includes('SIM') || val === 'S' || val === '1';
    }).length;
  }, [filteredData]);

  const activeOPMsCount = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach(item => {
      const keys = Object.keys(item);
      const opmKey = keys.find(k => {
        const norm = normalizeStr(k);
        return norm.includes('opm') || norm.includes('unidade');
      });
      if (opmKey && item[opmKey]) {
        const val = String(item[opmKey]).trim().toUpperCase();
        if (val && val !== '-' && val !== 'N/A') {
          set.add(val);
        }
      }
    });
    return set.size;
  }, [filteredData]);

  const opmSubmissionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach(item => {
      const keys = Object.keys(item);
      const k = keys.find(key => {
        const norm = normalizeStr(key);
        return norm.includes('opm') || norm.includes('unidade');
      });
      let opm = k ? String(item[k] || '').trim().toUpperCase() : 'N/A';
      if (!opm || opm === '-') opm = 'N/A';
      map[opm] = (map[opm] || 0) + 1;
    });
    return Object.entries(map)
      .map(([opm, count]) => ({ opm, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const getItemSumByPatterns = (patterns: string[], item: any) => {
    const keys = Object.keys(item);
    const technicalForbidden = ['rg', 're', 'id', 'cod', 'carimbo', 'timestamp', 'celular', 'opm', 'unidade', 'cpf', 'registro'];

    const matchedKeys = keys.filter(k => {
      const normKey = normalizeStr(k);
      const hasPattern = patterns.some(p => normKey.includes(normalizeStr(p)));
      const isTechnicalId = technicalForbidden.some(f => normKey === f || (normKey.startsWith(f) && !['qtd', 'arma', 'adulto', 'adolescente', 'perfuro', 'simulacro'].some(q => normKey.includes(q))));
      return hasPattern && !isTechnicalId;
    });

    let sum = 0;
    matchedKeys.forEach(key => {
      const rawValue = String(item[key] || '').trim().toUpperCase();
      if (!rawValue || ['0', '-', 'NAO', 'NÃO', 'NEGATIVO', 'Ñ'].includes(rawValue)) return;

      const cleanVal = rawValue.replace(/[^0-9]/g, '');
      const numVal = parseInt(cleanVal);
      
      if (!isNaN(numVal) && cleanVal.length > 0) {
        if (numVal > 0 && numVal < 1000) {
          sum += numVal;
        }
      } else if (['X', 'SIM', 'S', '1', 'OK'].includes(rawValue)) {
        sum += 1;
      }
    });

    return sum;
  };

  const opmBarData = useMemo(() => {
    const map: Record<string, { opm: string; adultos: number; adolescentes: number; armas: number; perfuro: number; simulacros: number; total: number }> = {};

    filteredData.forEach(item => {
      const keys = Object.keys(item);
      const opmKey = keys.find(k => {
        const norm = normalizeStr(k);
        return ['opm', 'pca', 'unidade'].some(p => norm.includes(p));
      });

      let opm = opmKey ? String(item[opmKey] || '').trim().toUpperCase() : 'N/A';
      if (!opm || opm === '-') opm = 'N/A';

      const adultos = getItemSumByPatterns(['adulto'], item);
      const adolescentes = getItemSumByPatterns(['adolescente'], item);
      const armas = getItemSumByPatterns(['arma'], item);
      const perfuro = getItemSumByPatterns(['perfuro'], item);
      const simulacros = getItemSumByPatterns(['simulacro'], item);

      if (!map[opm]) {
        map[opm] = { opm, adultos: 0, adolescentes: 0, armas: 0, perfuro: 0, simulacros: 0, total: 0 };
      }

      map[opm].adultos += adultos;
      map[opm].adolescentes += adolescentes;
      map[opm].armas += armas;
      map[opm].perfuro += perfuro;
      map[opm].simulacros += simulacros;
      map[opm].total += (adultos + adolescentes + armas + perfuro + simulacros);
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total || a.opm.localeCompare(b.opm));
  }, [filteredData]);

  const turnoBarData = useMemo(() => {
    const map: Record<string, { turno: string; envios: number; adultos: number; adolescentes: number; armas: number; perfuro: number; simulacros: number; total: number }> = {};

    filteredData.forEach(item => {
      const turno = getItemTurno(item);
      const adultos = getItemSumByPatterns(['adulto'], item);
      const adolescentes = getItemSumByPatterns(['adolescente'], item);
      const armas = getItemSumByPatterns(['arma'], item);
      const perfuro = getItemSumByPatterns(['perfuro'], item);
      const simulacros = getItemSumByPatterns(['simulacro'], item);

      if (!map[turno]) {
        map[turno] = { turno, envios: 0, adultos: 0, adolescentes: 0, armas: 0, perfuro: 0, simulacros: 0, total: 0 };
      }

      map[turno].envios += 1;
      map[turno].adultos += adultos;
      map[turno].adolescentes += adolescentes;
      map[turno].armas += armas;
      map[turno].perfuro += perfuro;
      map[turno].simulacros += simulacros;
      map[turno].total += (adultos + adolescentes + armas + perfuro + simulacros);
    });

    return Object.values(map).sort((a, b) => b.envios - a.envios);
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
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 21);

    // Resumo de Filtros Aplicados
    const activeFiltersList = [
      selectedCPAs.length > 0 ? `CPAs: ${selectedCPAs.join(', ')}` : null,
      selectedOPMs.length > 0 ? `OPMs: ${selectedOPMs.join(', ')}` : null,
      selectedTurnos.length > 0 ? `Dia/Turno/Horário: ${selectedTurnos.join(', ')}` : null,
    ].filter(Boolean);

    const filterStr = activeFiltersList.length > 0 ? `Filtros: ${activeFiltersList.join(' | ')}` : 'Filtros: Todos os Registros';
    doc.setFontSize(8);
    doc.setTextColor(2, 132, 199);
    doc.text(filterStr, 14, 26);
    doc.setTextColor(0);

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

    // 3. Distribuição por Turno e Horário
    const turnoRows = turnoBarData.map(t => [
      t.turno,
      String(t.envios),
      String(t.adultos),
      String(t.adolescentes),
      String(t.armas),
      String(t.perfuro),
      String(t.simulacros)
    ]);

    if (turnoRows.length > 0) {
      doc.setFontSize(12);
      doc.text('Distribuição por Turno Operacional', 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        head: [['TURNO / PERÍODO', 'ENVIOS', 'ADULT', 'ADOL', 'ARMA', 'PERF', 'SIMUL']],
        body: turnoRows,
        startY: (doc as any).lastAutoTable.finalY + 20,
        theme: 'grid',
        headStyles: { fillColor: [14, 116, 144] }, // Cyan 700
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [240, 249, 255] }
        }
      });
    }

    // 4. Detalhamento das Dinâmicas (Relatos)
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
        <div className="flex flex-col gap-3 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {/* CPA Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsCPADropdownOpen(!isCPADropdownOpen);
                  setIsOPMDropdownOpen(false);
                  setIsTurnoDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500/20 shadow-inner outline-none transition-all text-left font-black tracking-wider uppercase active:bg-slate-100"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  {selectedCPAs.length === 0 ? (
                    <span className="text-slate-500 font-extrabold truncate">Todos os CPAs</span>
                  ) : (
                    <span className="text-sky-600 font-extrabold truncate">
                      {selectedCPAs.length} CPA(s)
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isCPADropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCPADropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsCPADropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                      <span>Selecione os CPAs</span>
                      {selectedCPAs.length > 0 && (
                        <button onClick={() => setSelectedCPAs([])} className="text-rose-500 hover:text-rose-700 transition-colors text-[10px] font-bold">
                          Limpar
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
                            isSelected ? 'bg-sky-50 text-sky-700 border-l-4 border-l-sky-500' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span>{cpa}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* OPM Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsOPMDropdownOpen(!isOPMDropdownOpen);
                  setIsCPADropdownOpen(false);
                  setIsTurnoDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500/20 shadow-inner outline-none transition-all text-left font-black tracking-wider uppercase active:bg-slate-100"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  {selectedOPMs.length === 0 ? (
                    <span className="text-slate-500 font-extrabold truncate">Todas OPMs</span>
                  ) : (
                    <span className="text-sky-600 font-extrabold truncate">
                      {selectedOPMs.length} OPM(s)
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOPMDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOPMDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsOPMDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                      <span>Selecione as OPMs</span>
                      {selectedOPMs.length > 0 && (
                        <button onClick={() => setSelectedOPMs([])} className="text-rose-500 hover:text-rose-700 transition-colors text-[10px] font-bold">
                          Limpar
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
                            isSelected ? 'bg-sky-50 text-sky-700 border-l-4 border-l-sky-500' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span>{opm}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Dia / Turno / Horário Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsTurnoDropdownOpen(!isTurnoDropdownOpen);
                  setIsCPADropdownOpen(false);
                  setIsOPMDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500/20 shadow-inner outline-none transition-all text-left font-black tracking-wider uppercase active:bg-slate-100"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  {selectedTurnos.length === 0 ? (
                    <span className="text-slate-500 font-extrabold truncate">Dia / Turno / Horário</span>
                  ) : (
                    <span className="text-sky-600 font-extrabold truncate">
                      {selectedTurnos.length} Dia/Turno/Horário
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isTurnoDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTurnoDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsTurnoDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                      <span>Selecione Dia / Turno / Horário</span>
                      {selectedTurnos.length > 0 && (
                        <button onClick={() => setSelectedTurnos([])} className="text-rose-500 hover:text-rose-700 transition-colors text-[10px] font-bold">
                          Limpar
                        </button>
                      )}
                    </div>
                    {allTurnos.map(turno => {
                      const isSelected = selectedTurnos.includes(turno);
                      return (
                        <button
                          key={turno}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTurnos(selectedTurnos.filter(t => t !== turno));
                            } else {
                              setSelectedTurnos([...selectedTurnos, turno]);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-left transition-all ${
                            isSelected ? 'bg-sky-50 text-sky-700 border-l-4 border-l-sky-500' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span>{turno}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-2 w-full pt-1">
            {(selectedCPAs.length > 0 || selectedOPMs.length > 0 || selectedTurnos.length > 0) && (
              <button 
                onClick={() => { setSelectedCPAs([]); setSelectedOPMs([]); setSelectedTurnos([]); }}
                className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200/60 px-4 py-2 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-rose-100/70 transition-all shadow-sm active:scale-95"
              >
                <X className="w-3.5 h-3.5 text-rose-500" /> 
                Limpar Todos os Filtros
              </button>
            )}
            <button 
              onClick={fetchData} 
              className="flex items-center justify-center gap-2 bg-slate-800 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-emerald-500/10 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 
              Sincronizar
            </button>
            <button 
              onClick={exportPDF} 
              className="flex items-center justify-center gap-2 bg-sky-600 text-white px-5 py-2 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition-all active:scale-95"
            >
              <FileDown className="w-3.5 h-3.5" /> 
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Badge lists for active filters */}
        {(selectedCPAs.length > 0 || selectedOPMs.length > 0 || selectedTurnos.length > 0) && (
          <div className="flex flex-wrap gap-1.5 items-center justify-start py-1 px-1 border-t border-slate-100 pt-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Filtros Ativos:</span>
            
            {/* CPAs Badges */}
            {selectedCPAs.map(cpa => (
              <span key={cpa} className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[9px] font-black text-sky-400 uppercase tracking-wider">
                CPA: {cpa}
                <button onClick={() => setSelectedCPAs(selectedCPAs.filter(c => c !== cpa))} className="hover:bg-slate-800 p-0.5 rounded-full transition-colors">
                  <X className="w-2.5 h-2.5 text-sky-400" />
                </button>
              </span>
            ))}

            {/* OPMs Badges */}
            {selectedOPMs.map(opm => (
              <span key={opm} className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-lg text-[9px] font-black text-sky-700 uppercase tracking-wider">
                OPM: {opm}
                <button onClick={() => setSelectedOPMs(selectedOPMs.filter(o => o !== opm))} className="hover:bg-sky-200 p-0.5 rounded-full transition-colors">
                  <X className="w-2.5 h-2.5 text-sky-700" />
                </button>
              </span>
            ))}

            {/* Turnos Badges */}
            {selectedTurnos.map(turno => (
              <span key={turno} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[9px] font-black text-amber-700 uppercase tracking-wider">
                Dia/Turno/Horário: {turno}
                <button onClick={() => setSelectedTurnos(selectedTurnos.filter(t => t !== turno))} className="hover:bg-amber-200 p-0.5 rounded-full transition-colors">
                  <X className="w-2.5 h-2.5 text-amber-700" />
                </button>
              </span>
            ))}

            <button
              onClick={() => { setSelectedCPAs([]); setSelectedOPMs([]); setSelectedTurnos([]); }}
              className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200/50 hover:bg-rose-100 px-2.5 py-1 rounded-lg text-[9px] font-black text-rose-700 uppercase tracking-wider transition-all active:scale-95"
            >
              <X className="w-2.5 h-2.5" />
              Limpar Todos
            </button>
          </div>
        )}
      </div>

      {/* Redesigned Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Volume de Envios com separação por OPM */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-sky-600 uppercase tracking-wider">Volume de Formulários</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totals.envio}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Registros Total</span>
          </div>
          <div className="space-y-1 my-1 max-h-[85px] overflow-y-auto pr-0.5">
            {opmSubmissionCounts.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold uppercase">Sem registros</p>
            ) : (
              opmSubmissionCounts.map(item => (
                <div key={item.opm} className="flex justify-between items-center text-[10px] font-extrabold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-150">
                  <span className="text-sky-800 font-black uppercase">{item.opm}:</span>
                  <span className="font-mono text-slate-900 font-black">{item.count} envio(s)</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase">
            <span>Envios por OPM</span>
            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live OK
            </span>
          </div>
        </motion.div>

        {/* Card 2: Detenções de Pessoas (Adultos e Adolescentes) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Detenções de Pessoas</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totals.adultos + totals.adolescentes}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Detidos Total</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-black uppercase text-slate-600">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-extrabold">
              Adultos: {totals.adultos}
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-extrabold">
              Adolesc: {totals.adolescentes}
            </span>
          </div>
        </motion.div>

        {/* Card 3: Apreensão de Materiais (Armas, Perfuro, Simulacros) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Apreensão de Armas & Materiais</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totals.armas + totals.perfuro + totals.simulacros}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Itens Apreendidos</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[8.5px] font-black uppercase text-slate-600 flex-wrap">
            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-extrabold">
              Armas: {totals.armas}
            </span>
            <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 font-extrabold">
              Perfuro: {totals.perfuro}
            </span>
            <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-extrabold">
              Simul: {totals.simulacros}
            </span>
          </div>
        </motion.div>

        {/* Card 4: Qualificação por OPM (Apenas Presos e Armas) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Qualificação por OPM</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5 my-1 max-h-[85px] overflow-y-auto pr-0.5">
            {opmBarData.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold uppercase py-2">Sem dados</p>
            ) : (
              opmBarData.map(o => (
                <div key={o.opm} className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-150 text-[10px] font-extrabold text-slate-800">
                  <span className="text-sky-800 font-black uppercase">{o.opm}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[9px] font-black">
                      {o.adultos + o.adolescentes} Presos
                    </span>
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-900 rounded text-[9px] font-black">
                      {o.armas + o.perfuro + o.simulacros} Armas
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase">
            <span>Presos e Armas por OPM</span>
            <span className="text-indigo-600 font-extrabold">{opmBarData.length} OPM(s)</span>
          </div>
        </motion.div>
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

      {/* OPM Bar Chart Section (before Detailed Records Table) */}
      <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-sky-400 shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Quantitativo Operacional por OPM
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Adultos Presos, Adolescentes, Armas, Perfurocortantes e Simulacros
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Adultos
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Adol.
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Armas
            </span>
            <span className="flex items-center gap-1.5 text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" /> Perfuro
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Simulacros
            </span>
          </div>
        </div>

        {opmBarData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
            Nenhum dado encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-[380px] w-full pt-2">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={opmBarData} margin={{ top: 25, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="opm" 
                    tick={{ fontSize: 10, fontWeight: '800', fill: '#475569' }} 
                    interval={0} 
                    angle={-30} 
                    textAnchor="end" 
                    height={70} 
                  />
                  <YAxis tick={{ fontSize: 10, fontWeight: '700', fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="adultos" name="Adultos Presos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="adultos" position="top" formatter={(val: any) => (Number(val) > 0 ? val : '')} style={{ fontSize: 10, fontWeight: '900', fill: '#059669' }} />
                  </Bar>
                  <Bar dataKey="adolescentes" name="Adolescentes Apreendidos" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="adolescentes" position="top" formatter={(val: any) => (Number(val) > 0 ? val : '')} style={{ fontSize: 10, fontWeight: '900', fill: '#d97706' }} />
                  </Bar>
                  <Bar dataKey="armas" name="Armas de Fogo" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="armas" position="top" formatter={(val: any) => (Number(val) > 0 ? val : '')} style={{ fontSize: 10, fontWeight: '900', fill: '#e11d48' }} />
                  </Bar>
                  <Bar dataKey="perfuro" name="Perfurocortantes" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="perfuro" position="top" formatter={(val: any) => (Number(val) > 0 ? val : '')} style={{ fontSize: 10, fontWeight: '900', fill: '#0284c7' }} />
                  </Bar>
                  <Bar dataKey="simulacros" name="Simulacros" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="simulacros" position="top" formatter={(val: any) => (Number(val) > 0 ? val : '')} style={{ fontSize: 10, fontWeight: '900', fill: '#4f46e5' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Numeric Summary per OPM */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
              {opmBarData.map(o => (
                <div key={o.opm} className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all">
                  <div className="font-black text-slate-900 text-xs uppercase mb-1 flex justify-between items-center">
                    <span>{o.opm}</span>
                    <span className="text-[9px] font-mono text-slate-400">{o.total} total</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                    {o.adultos > 0 && <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{o.adultos} Presos</span>}
                    {o.adolescentes > 0 && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{o.adolescentes} Adol.</span>}
                    {o.armas > 0 && <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">{o.armas} Armas</span>}
                    {o.perfuro > 0 && <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">{o.perfuro} Perfuro</span>}
                    {o.simulacros > 0 && <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">{o.simulacros} Simul.</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Temporal Analysis Chart: Dia / Turno / Horário */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              Distribuição Temporal (Dia / Turno / Horário)
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Análise comparativa completa de envios, prisões, apreensões e materiais recolhidos por período
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
            <span className="flex items-center gap-1.5 text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 inline-block" /> Envios
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Adultos Presos
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Adolescentes
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Armas de Fogo
            </span>
            <span className="flex items-center gap-1.5 text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" /> Perfurocortantes
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Simulacros
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-50/50 p-4 rounded-xl border border-slate-200">
          {turnoBarData.length === 0 ? (
            <p className="text-[10px] text-slate-400 font-bold text-center py-12 uppercase">Sem dados registrados para este período</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={turnoBarData} margin={{ top: 20, right: 15, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="turno" tick={{ fontSize: 9, fontWeight: '800', fill: '#475569' }} interval={0} angle={-10} textAnchor="end" />
                  <YAxis tick={{ fontSize: 9, fontWeight: '700', fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="envios" name="Envios" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={22}>
                    <LabelList dataKey="envios" position="top" style={{ fontSize: 9, fontWeight: '900', fill: '#0369a1' }} />
                  </Bar>
                  <Bar dataKey="adultos" name="Adultos Presos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="adolescentes" name="Adolescentes" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="armas" name="Armas de Fogo" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="perfuro" name="Perfurocortantes" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="simulacros" name="Simulacros" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
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
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Carimbo</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Dia/Turno</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Policial / Agente</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Comando (CPA)</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">OPM</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Email</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800">Local</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-900 border-b border-slate-800">Vulto?</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Adultos</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Adol.</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Armas</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Perfuro</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase text-center whitespace-nowrap bg-slate-800/50 border-b border-slate-800">Simul.</th>
                <th className="px-6 py-5 text-[10px] font-black tracking-[0.15em] text-sky-400 uppercase whitespace-nowrap bg-slate-900 border-b border-slate-800 w-[360px] min-w-[320px]">Dinâmica da Ocorrência</th>
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

                const getDiaTurnoVal = () => {
                  const combinedKey = keys.find(k => {
                    const norm = normalizeStr(k);
                    return norm.includes('dia') && norm.includes('turno');
                  });
                  if (combinedKey) {
                    return String(item[combinedKey]);
                  }
                  
                  const diaKey = keys.find(k => {
                    const norm = normalizeStr(k);
                    return norm.includes('dia') && !norm.includes('turno');
                  });
                  const turnoKey = keys.find(k => {
                    const norm = normalizeStr(k);
                    return norm.includes('turno') && !norm.includes('dia');
                  });
                  
                  if (diaKey && turnoKey) {
                    return `${item[diaKey]} - ${item[turnoKey]}`;
                  } else if (diaKey) {
                    return String(item[diaKey]);
                  } else if (turnoKey) {
                    return String(item[turnoKey]);
                  }
                  
                  return getVal(['dia', 'turno']);
                };

                const getPolicialVal = () => {
                  const posto = getVal(['posto', 'graduac']);
                  const nome = getVal(['guerra', 'nome']);
                  const rg = getVal(['rg']);
                  
                  const parts = [];
                  if (posto && posto !== '-') parts.push(posto);
                  if (nome && nome !== '-') parts.push(nome);
                  if (rg && rg !== '-') parts.push(`(RG: ${rg})`);
                  
                  return parts.length > 0 ? parts.join(' ') : '-';
                };

                const getOPMComandoVal = () => {
                  const opm = getVal(['opm', 'unidade']);
                  const comando = getVal(['comando', 'intermediario', 'cpa']);
                  if (opm !== '-' && comando !== '-' && opm !== comando) {
                    return `${opm} (${comando})`;
                  }
                  return opm !== '-' ? opm : (comando !== '-' ? comando : '-');
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

                const getVultoVal = () => {
                  const vPatterns = ['vulto', 'interesse', 'houve'];
                  const vKey = keys.find(k => {
                    const norm = normalizeStr(k);
                    return vPatterns.some(p => norm.includes(p)) && !norm.includes('dinamica') && !norm.includes('relato') && !norm.includes('descricao');
                  });
                  if (vKey && item[vKey]) {
                    const raw = String(item[vKey]).trim().toUpperCase();
                    if (raw.includes('SIM') || raw === 'S' || raw === '1') return 'SIM';
                    if (raw.includes('NAO') || raw.includes('NÃO') || raw === 'N' || raw === '0') return 'NÃO';
                    return raw;
                  }
                  return '-';
                };

                const getDinamicaVal = () => {
                  const dinamicaPatterns = ['dinamica', 'relato', 'historico', 'sintese', 'descricao', 'narrativa', 'detalhe', 'fato', 'resumo'];
                  const excludePatterns = ['houve', 'vulto', 'interesse', 'email', 'carimbo', 'data', 'hora', 'local', 'endereco', 'cpf', 'rg', 'telefone', 'posto', 'nome', 'guerra', 'opm', 'unidade', 'cpa'];

                  // Prioridade 1: Chave contendo termos de narrativa e SEM padrões de campos booleanos/técnicos
                  let dKey = keys.find(k => {
                    const norm = normalizeStr(k);
                    const matchesD = dinamicaPatterns.some(p => norm.includes(p));
                    const isEx = excludePatterns.some(p => norm.includes(p));
                    return matchesD && !isEx;
                  });

                  // Prioridade 2: Chave contendo termos de narrativa
                  if (!dKey) {
                    dKey = keys.find(k => {
                      const norm = normalizeStr(k);
                      return dinamicaPatterns.some(p => norm.includes(p));
                    });
                  }

                  // Prioridade 3: Procura por campo com texto longo do registro
                  if (!dKey) {
                    dKey = keys.find(k => {
                      const norm = normalizeStr(k);
                      const val = String(item[k] || '').trim();
                      const isSystem = excludePatterns.some(p => norm.includes(p));
                      return !isSystem && val.length > 20 && !['SIM', 'NÃO', 'NAO', '-'].includes(val.toUpperCase());
                    });
                  }

                  if (dKey && item[dKey]) {
                    const val = String(item[dKey]).trim();
                    if (val && val !== '-') return val;
                  }
                  return '-';
                };

                const localValue = getLocalVal();
                const vultoVal = getVultoVal();
                const dinamicaVal = getDinamicaVal();

                return (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedRow(item)}
                    className="hover:bg-sky-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 text-[11px] font-mono text-slate-400">
                      {getVal(['carimbo', 'data'])}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase">
                      {getDiaTurnoVal()}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase">
                      {getPolicialVal()}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-black text-sky-800 uppercase">
                      <span className="inline-block px-2.5 py-1 bg-sky-100 text-sky-900 rounded-lg text-[10px] font-black tracking-wide border border-sky-300 shadow-sm">
                        {getItemCPA(item)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-extrabold text-slate-800 uppercase">
                      {getVal(['opm', 'unidade'])}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-semibold text-slate-600 lowercase">
                      {getEmailVal()}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-700 font-bold uppercase">
                      {localValue && localValue !== '-' ? localValue : <span className="text-slate-400 font-mono">-</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black">
                      {vultoVal.includes('SIM') ? (
                        <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider border border-rose-200">
                          SIM
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {vultoVal !== '-' ? vultoVal : 'NÃO'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black bg-emerald-50/30 text-emerald-700">{getVal(['adulto'])}</td>
                    <td className="px-6 py-4 text-center text-xs font-black bg-amber-50/30 text-amber-700">{getVal(['adolescente'])}</td>
                    <td className="px-6 py-4 text-center text-xs font-black bg-rose-50/30 text-rose-700">{getVal(['arma'])}</td>
                    <td className="px-6 py-4 text-center text-xs font-black bg-sky-50/30 text-sky-700">{getVal(['perfuro'])}</td>
                    <td className="px-6 py-4 text-center text-xs font-black bg-indigo-50/30 text-indigo-700">{getVal(['simulacro'])}</td>
                    <td className="p-3 w-[360px] min-w-[320px] max-w-[400px] bg-slate-50/50 border-l border-slate-200 align-top">
                      <div className="max-h-[96px] overflow-y-auto custom-scrollbar p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:border-sky-300 transition-colors">
                        <p className="text-[11px] text-slate-800 font-semibold leading-relaxed break-words whitespace-pre-wrap not-italic">
                          {dinamicaVal}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer with Totals */}
            <tfoot className="sticky bottom-0 bg-slate-900 font-black text-white z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <tr>
                <td colSpan={8} className="px-6 py-5 text-xs uppercase tracking-widest text-sky-400 border-t border-slate-800 bg-slate-900">
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
    </div>
  );
};

