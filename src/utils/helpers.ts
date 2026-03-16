import { Project, Receipt, ReceiptItem } from '../types';

// ==================== 로컬 스토리지 유틸리티 ====================

const STORAGE_KEY = 'receipt_manager_data';

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('저장 실패:', e);
  }
};

export const loadProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// ==================== ID 생성 ====================
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ==================== 날짜 포맷 ====================
export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

// ==================== 예산 계산 ====================
export const calculateUsedAmount = (project: Project): number => {
  return project.receipts.reduce((total, receipt) => total + receipt.totalAmount, 0);
};

export const calculateRemainingAmount = (project: Project): number => {
  return project.totalBudget - calculateUsedAmount(project);
};

// ==================== 경고 체크 ====================
export const checkBudgetWarning = (
  item: ReceiptItem,
  projectId: string,
  projects: Project[]
): { warning: boolean; message: string } => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return { warning: false, message: '' };

  for (const rule of project.budgetRules) {
    if (
      item.category === rule.category ||
      rule.category === '전체'
    ) {
      if (item.totalPrice > rule.maxAmount) {
        return {
          warning: true,
          message: `${rule.category} 상한(${formatCurrency(rule.maxAmount)}) 초과`,
        };
      }
    }
  }
  return { warning: false, message: '' };
};

// ==================== 프로젝트 색상 팔레트 ====================
export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
];

export const PROJECT_ICONS = [
  '📁', '💼', '🏗️', '📊', '🎯', '🚀', '💡', '🔬', '🎨', '📱',
  '🏢', '🛒', '✈️', '🍽️', '🏠', '📚', '🎵', '⚽', '💊', '🌱',
];

// ==================== 영수증 합산 ====================
export const sumReceiptItems = (items: ReceiptItem[]): number => {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
};

// ==================== 카테고리 목록 ====================
export const DEFAULT_CATEGORIES = [
  '식비', '교통비', '숙박비', '업무비', '재료비',
  '인건비', '장비비', '통신비', '기타',
];
