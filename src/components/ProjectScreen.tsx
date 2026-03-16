import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  formatCurrency,
  formatDate,
  calculateUsedAmount,
  calculateRemainingAmount,
  DEFAULT_CATEGORIES,
} from '../utils/helpers';
import {
  ArrowLeft,
  Plus,
  Settings,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  BarChart2,
} from 'lucide-react';
import ReceiptScanner from './ReceiptScanner';
import ReceiptCard from './ReceiptCard';
import BudgetDisplay from './BudgetDisplay';
import ProjectSettingsModal from './ProjectSettingsModal';

// ==================== 프로젝트 상세 화면 ====================
const ProjectScreen: React.FC = () => {
  const {
    activeProject,
    setView,
    setActiveProject,
    addReceipt,
    deleteReceipt,
    toggleBudgetVisibility,
  } = useApp();

  const [showScanner, setShowScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [showStats, setShowStats] = useState(false);

  if (!activeProject) {
    return (
      <div className="empty-project">
        <p>프로젝트를 선택해주세요</p>
        <button onClick={() => setView('home')}>홈으로</button>
      </div>
    );
  }

  const usedAmount = calculateUsedAmount(activeProject);
  const remainingAmount = calculateRemainingAmount(activeProject);

  // 영수증 필터 & 정렬
  let filteredReceipts = activeProject.receipts;
  if (filterCategory !== '전체') {
    filteredReceipts = filteredReceipts.filter(r =>
      r.items.some(i => i.category === filterCategory)
    );
  }
  filteredReceipts = [...filteredReceipts].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return b.totalAmount - a.totalAmount;
  });

  // 카테고리별 통계
  const categoryStats: Record<string, number> = {};
  activeProject.receipts.forEach(r => {
    r.items.forEach(item => {
      categoryStats[item.category || '기타'] =
        (categoryStats[item.category || '기타'] || 0) + item.totalPrice;
    });
  });

  const totalWarnings = activeProject.receipts.reduce(
    (n, r) => n + r.items.filter(i => i.warning).length,
    0
  );

  return (
    <div className="project-screen">
      {/* 상단 바 */}
      <div
        className="project-topbar"
        style={{ background: `linear-gradient(135deg, ${activeProject.color}dd, ${activeProject.color}99)` }}
      >
        <button
          className="back-btn"
          onClick={() => {
            setActiveProject(null);
            setView('home');
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="project-title-area">
          <span className="project-icon">{activeProject.icon}</span>
          <div>
            <h2>{activeProject.name}</h2>
            {activeProject.description && (
              <p className="project-desc-top">{activeProject.description}</p>
            )}
          </div>
        </div>
        <button className="settings-icon-btn" onClick={() => setShowSettings(true)}>
          <Settings size={20} />
        </button>
      </div>

      {/* 예산 표시 카드 */}
      <div className="budget-card" style={{ borderColor: activeProject.color }}>
        <BudgetDisplay
          totalBudget={activeProject.totalBudget}
          usedAmount={usedAmount}
          showBudget={activeProject.showBudget}
          onToggle={() => toggleBudgetVisibility(activeProject.id)}
          color={activeProject.color}
        />

        {/* 경고 배지 */}
        {totalWarnings > 0 && (
          <div className="warnings-badge">
            <AlertTriangle size={14} />
            상한 초과 {totalWarnings}건
          </div>
        )}
      </div>

      {/* 통계 토글 */}
      <div className="stats-toggle-bar">
        <button
          className="stats-toggle-btn"
          onClick={() => setShowStats(s => !s)}
        >
          <BarChart2 size={16} />
          카테고리별 통계
          {showStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 카테고리 통계 */}
      {showStats && (
        <div className="category-stats">
          {Object.entries(categoryStats).map(([cat, amount]) => {
            const rule = activeProject.budgetRules.find(r => r.category === cat);
            const isOver = rule && amount > rule.maxAmount;
            return (
              <div key={cat} className={`stat-item ${isOver ? 'over' : ''}`}>
                <span className="stat-category">{cat}</span>
                <span className={`stat-amount ${isOver ? 'over-amount' : ''}`}>
                  {formatCurrency(amount)}
                  {isOver && <AlertTriangle size={12} />}
                </span>
                {rule && (
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${Math.min((amount / rule.maxAmount) * 100, 100)}%`,
                        backgroundColor: isOver ? '#ef4444' : activeProject.color,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {Object.keys(categoryStats).length === 0 && (
            <div className="no-stats">영수증을 추가하면 통계가 표시됩니다</div>
          )}
        </div>
      )}

      {/* 영수증 추가 버튼 */}
      <div className="add-receipt-bar">
        <div className="filter-row">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="전체">전체 카테고리</option>
            {DEFAULT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="filter-select"
          >
            <option value="date">최신순</option>
            <option value="amount">금액순</option>
          </select>
        </div>
        <button
          className="add-receipt-btn"
          style={{ backgroundColor: activeProject.color }}
          onClick={() => setShowScanner(true)}
        >
          <Plus size={20} />
          영수증 추가
        </button>
      </div>

      {/* 영수증 목록 */}
      <div className="receipts-list">
        {filteredReceipts.length === 0 ? (
          <div className="empty-receipts">
            <div className="empty-emoji">🧾</div>
            <p>영수증을 추가해보세요</p>
            <button
              className="btn-primary"
              style={{ backgroundColor: activeProject.color }}
              onClick={() => setShowScanner(true)}
            >
              <Plus size={16} />
              첫 영수증 추가
            </button>
          </div>
        ) : (
          filteredReceipts.map(receipt => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              project={activeProject}
              onDelete={() => deleteReceipt(activeProject.id, receipt.id)}
            />
          ))
        )}
      </div>

      {/* 영수증 스캐너 */}
      {showScanner && (
        <ReceiptScanner
          projectId={activeProject.id}
          categories={DEFAULT_CATEGORIES}
          budgetRules={activeProject.budgetRules}
          onConfirm={data => {
            addReceipt(activeProject.id, data);
            setShowScanner(false);
          }}
          onCancel={() => setShowScanner(false)}
        />
      )}

      {/* 프로젝트 설정 모달 */}
      {showSettings && (
        <ProjectSettingsModal
          project={activeProject}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default ProjectScreen;
