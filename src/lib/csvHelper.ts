import Papa from 'papaparse';

export const formatGoogleSheetUrl = (urlOrId: string, gid: string = '0'): string => {
  if (!urlOrId) return '';
  // Preserve published Google Sheets CSV links
  if (urlOrId.includes('/pub') || urlOrId.includes('output=csv') || urlOrId.includes('/d/e/')) {
    return urlOrId;
  }
  if (urlOrId.includes('docs.google.com/spreadsheets')) {
    const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      const gidMatch = urlOrId.match(/[?&]gid=([0-9]+)/);
      const finalGid = gidMatch ? gidMatch[1] : gid;
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${finalGid}`;
    }
  }
  // If it's just an ID
  return `https://docs.google.com/spreadsheets/d/${urlOrId}/export?format=csv&gid=${gid}`;
};

export const getCSVData = async <T>(url: string): Promise<T[]> => {
  try {
    const formattedUrl = formatGoogleSheetUrl(url);
    let response = await fetch(formattedUrl);
    let csvString = await response.text();
    
    // Check if Google returned an HTML error/login page instead of CSV
    if (csvString.trim().startsWith('<!DOCTYPE') || csvString.trim().startsWith('<html')) {
      console.warn('Google Sheets returned HTML instead of CSV, attempting fallback export URL...');
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const fallbackUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=0`;
        response = await fetch(fallbackUrl);
        csvString = await response.text();
      }
    }
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          // Filter out rows that are completely empty or missing required fields
          const cleanData = (results.data as any[]).filter(row => {
            if (!row || typeof row !== 'object') return false;
            const values = Object.values(row).map(v => String(v || '').trim());
            return values.some(v => v.length > 0);
          });
          resolve(cleanData as T[]);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return [];
  }
};

export const G_SHEET_CSV_URL = (idOrUrl: string, gid: string = '0') => 
  formatGoogleSheetUrl(idOrUrl, gid);

