import Papa from 'papaparse';

export const getCSVData = async <T>(url: string): Promise<T[]> => {
  try {
    const response = await fetch(url);
    const csvString = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as T[]);
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

export const G_SHEET_CSV_URL = (id: string, gid: string) => 
  `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
