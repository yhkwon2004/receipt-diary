import * as XLSX from 'xlsx';
import { TableColumn } from '../types';
import { generateId } from './helpers';

// ==================== 엑셀 파일 파싱 ====================
export const parseExcelFile = (file: File): Promise<{
  columns: TableColumn[];
  sampleData: Record<string, any>[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length === 0) {
          reject(new Error('파일이 비어있습니다.'));
          return;
        }

        // 첫 행을 헤더로 사용
        const headers: string[] = jsonData[0].map((h: any) => String(h || '').trim());
        const sampleData = jsonData.slice(1, 4).map((row: any[]) => {
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] ?? '';
          });
          return obj;
        });

        const columns: TableColumn[] = headers
          .filter(h => h !== '')
          .map(h => ({
            id: generateId(),
            name: h,
            type: detectColumnType(h),
          }));

        resolve({ columns, sampleData });
      } catch (err) {
        reject(new Error('파일 읽기 실패: ' + err));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 오류'));
    reader.readAsArrayBuffer(file);
  });
};

// ==================== 한글(.hwp) 파일 - 기본 파싱 ====================
export const parseHwpFile = (file: File): Promise<{
  columns: TableColumn[];
  sampleData: Record<string, any>[];
}> => {
  return new Promise((resolve, reject) => {
    // HWP는 직접 파싱이 복잡하므로 기본 안내 메시지
    // 실제로는 hwp.js 같은 라이브러리 필요
    reject(new Error('HWP 파일은 현재 제한적으로 지원됩니다. 엑셀(.xlsx, .xls) 또는 CSV 파일을 사용해주세요.'));
  });
};

// ==================== 열 타입 감지 ====================
const detectColumnType = (headerName: string): TableColumn['type'] => {
  const lowerName = headerName.toLowerCase();
  if (lowerName.includes('날짜') || lowerName.includes('date') || lowerName.includes('일자')) {
    return 'date';
  }
  if (
    lowerName.includes('금액') ||
    lowerName.includes('가격') ||
    lowerName.includes('price') ||
    lowerName.includes('amount') ||
    lowerName.includes('수량') ||
    lowerName.includes('단가')
  ) {
    return 'number';
  }
  if (lowerName.includes('분류') || lowerName.includes('카테고리') || lowerName.includes('category')) {
    return 'category';
  }
  return 'text';
};

// ==================== CSV 파싱 ====================
export const parseCsvFile = (file: File): Promise<{
  columns: TableColumn[];
  sampleData: Record<string, any>[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length === 0) {
          reject(new Error('파일이 비어있습니다.'));
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const sampleData = lines.slice(1, 4).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
          return obj;
        });

        const columns: TableColumn[] = headers
          .filter(h => h !== '')
          .map(h => ({
            id: generateId(),
            name: h,
            type: detectColumnType(h),
          }));

        resolve({ columns, sampleData });
      } catch (err) {
        reject(new Error('CSV 파싱 실패: ' + err));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 오류'));
    reader.readAsText(file, 'UTF-8');
  });
};

// ==================== 파일 타입에 따른 파서 선택 ====================
export const parseFile = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcelFile(file);
  } else if (ext === 'csv') {
    return parseCsvFile(file);
  } else if (ext === 'hwp') {
    return parseHwpFile(file);
  } else {
    return Promise.reject(new Error('지원하지 않는 파일 형식입니다. (.xlsx, .xls, .csv 지원)'));
  }
};
