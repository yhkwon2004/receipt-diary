import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Receipt, ReceiptItem, BudgetRule, TableColumn, AppState } from '../types';
import {
  saveProjects,
  loadProjects,
  generateId,
  checkBudgetWarning,
  PROJECT_COLORS,
  PROJECT_ICONS,
} from '../utils/helpers';
import {
  dbFetchProjects,
  dbCreateProject,
  dbUpdateProject,
  dbDeleteProject,
  dbFetchReceipts,
  dbCreateReceipt,
  dbDeleteReceipt,
  onAuthStateChange,
  signOut,
} from '../utils/database';
import { isSupabaseConfigured } from '../utils/supabase';

// ==================== 컨텍스트 타입 ====================
interface AppContextType {
  state: AppState;
  projects: Project[];
  activeProject: Project | null;
  currentUser: any | null;
  isLoading: boolean;

  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;

  addReceipt: (projectId: string, receipt: Omit<Receipt, 'id' | 'createdAt' | 'projectId'>) => Promise<void>;
  deleteReceipt: (projectId: string, receiptId: string) => Promise<void>;
  updateReceipt: (projectId: string, receiptId: string, data: Partial<Receipt>) => void;

  addBudgetRule: (projectId: string, rule: Omit<BudgetRule, 'id'>) => Promise<void>;
  deleteBudgetRule: (projectId: string, ruleId: string) => Promise<void>;

  setView: (view: AppState['activeView']) => void;
  setProcessing: (v: boolean) => void;
  toggleBudgetVisibility: (projectId: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ==================== 프로바이더 ====================
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    projects: [],
    activeProjectId: null,
    activeView: 'home',
    isProcessing: false,
  });

  const useDB = isSupabaseConfigured();

  // ── 인증 상태 감지 ──
  useEffect(() => {
    if (!useDB) {
      // Supabase 없으면 로컬 스토리지 모드
      const loaded = loadProjects();
      setProjects(loaded);
      setIsLoading(false);
      return;
    }

    const unsub = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsLoading(true);
        await loadUserData(user.id);
        setIsLoading(false);
      } else {
        setProjects([]);
        setIsLoading(false);
      }
    });
    return unsub;
    // eslint-disable-next-line
  }, [useDB]);

  // ── 사용자 데이터 로드 ──
  const loadUserData = async (userId: string) => {
    const rawProjects = await dbFetchProjects(userId);
    // 각 프로젝트의 영수증 로드
    const withReceipts = await Promise.all(
      rawProjects.map(async (p) => {
        const receipts = await dbFetchReceipts(p.id);
        const usedAmount = receipts.reduce((s, r) => s + r.totalAmount, 0);
        return { ...p, receipts, usedAmount };
      })
    );
    setProjects(withReceipts);
  };

  // ── 로컬 저장 (DB 없을 때) ──
  useEffect(() => {
    if (!useDB) saveProjects(projects);
  }, [projects, useDB]);

  const activeProject = projects.find(p => p.id === state.activeProjectId) || null;

  // ── 프로젝트 생성 ──
  const createProject = useCallback(async (data: Partial<Project>): Promise<Project> => {
    const newProject: Project = {
      id: generateId(),
      name: data.name || '새 프로젝트',
      description: data.description || '',
      totalBudget: data.totalBudget || 0,
      usedAmount: 0,
      color: data.color || PROJECT_COLORS[0],
      icon: data.icon || PROJECT_ICONS[0],
      createdAt: new Date().toISOString(),
      receipts: [],
      budgetRules: data.budgetRules || [],
      tableColumns: data.tableColumns || [
        { id: generateId(), name: '품목명', type: 'text', required: true },
        { id: generateId(), name: '수량', type: 'number' },
        { id: generateId(), name: '단가', type: 'number' },
        { id: generateId(), name: '합계', type: 'number' },
        { id: generateId(), name: '카테고리', type: 'category' },
        { id: generateId(), name: '비고', type: 'text' },
      ],
      showBudget: true,
    };

    if (useDB && currentUser) {
      const saved = await dbCreateProject(currentUser.id, newProject);
      if (saved) {
        const full = { ...saved, receipts: [], usedAmount: 0 };
        setProjects(prev => [full, ...prev]);
        return full;
      }
    }
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  }, [useDB, currentUser]);

  // ── 프로젝트 수정 ──
  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    if (useDB) await dbUpdateProject(id, data);
  }, [useDB]);

  // ── 프로젝트 삭제 ──
  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setState(prev => ({
      ...prev,
      activeProjectId: prev.activeProjectId === id ? null : prev.activeProjectId,
    }));
    if (useDB) await dbDeleteProject(id);
  }, [useDB]);

  // ── 활성 프로젝트 ──
  const setActiveProject = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeProjectId: id }));
  }, []);

  // ── 영수증 추가 ──
  const addReceipt = useCallback(async (
    projectId: string,
    receiptData: Omit<Receipt, 'id' | 'createdAt' | 'projectId'>
  ) => {
    const itemsWithWarnings: ReceiptItem[] = receiptData.items.map(item => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return item;
      const { warning, message } = checkBudgetWarning(item, projectId, projects);
      return { ...item, warning, warningMessage: message };
    });

    const newReceipt: Receipt = {
      ...receiptData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      projectId,
      items: itemsWithWarnings,
    };

    if (useDB && currentUser) {
      await dbCreateReceipt(currentUser.id, newReceipt);
    }

    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              receipts: [newReceipt, ...p.receipts],
              usedAmount: p.usedAmount + newReceipt.totalAmount,
            }
          : p
      )
    );
  }, [projects, useDB, currentUser]);

  // ── 영수증 삭제 ──
  const deleteReceipt = useCallback(async (projectId: string, receiptId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const r = p.receipts.find(r => r.id === receiptId);
        return {
          ...p,
          receipts: p.receipts.filter(r => r.id !== receiptId),
          usedAmount: p.usedAmount - (r?.totalAmount || 0),
        };
      })
    );
    if (useDB) await dbDeleteReceipt(receiptId);
  }, [useDB]);

  // ── 영수증 수정 (로컬만) ──
  const updateReceipt = useCallback((projectId: string, receiptId: string, data: Partial<Receipt>) => {
    setProjects(prev =>
      prev.map(p =>
        p.id !== projectId ? p : {
          ...p,
          receipts: p.receipts.map(r => r.id === receiptId ? { ...r, ...data } : r),
        }
      )
    );
  }, []);

  // ── 예산 규칙 ──
  const addBudgetRule = useCallback(async (projectId: string, rule: Omit<BudgetRule, 'id'>) => {
    const newRule: BudgetRule = { ...rule, id: generateId() };
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedRules = [...project.budgetRules, newRule];
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, budgetRules: updatedRules } : p
    ));
    if (useDB) await dbUpdateProject(projectId, { budgetRules: updatedRules });
  }, [projects, useDB]);

  const deleteBudgetRule = useCallback(async (projectId: string, ruleId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedRules = project.budgetRules.filter(r => r.id !== ruleId);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, budgetRules: updatedRules } : p
    ));
    if (useDB) await dbUpdateProject(projectId, { budgetRules: updatedRules });
  }, [projects, useDB]);

  // ── 예산 토글 ──
  const toggleBudgetVisibility = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newVal = !project.showBudget;
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, showBudget: newVal } : p
    ));
    if (useDB) await dbUpdateProject(projectId, { showBudget: newVal });
  }, [projects, useDB]);

  // ── 로그아웃 ──
  const handleSignOut = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
    setProjects([]);
    setState(prev => ({ ...prev, activeProjectId: null, activeView: 'home' }));
  }, []);

  const setView = useCallback((view: AppState['activeView']) => {
    setState(prev => ({ ...prev, activeView: view }));
  }, []);

  const setProcessing = useCallback((v: boolean) => {
    setState(prev => ({ ...prev, isProcessing: v }));
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      projects,
      activeProject,
      currentUser,
      isLoading,
      createProject,
      updateProject,
      deleteProject,
      setActiveProject,
      addReceipt,
      deleteReceipt,
      updateReceipt,
      addBudgetRule,
      deleteBudgetRule,
      setView,
      setProcessing,
      toggleBudgetVisibility,
      handleSignOut,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
