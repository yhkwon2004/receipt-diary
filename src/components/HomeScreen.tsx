import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  formatCurrency,
  calculateUsedAmount,
  calculateRemainingAmount,
} from '../utils/helpers';
import { Plus, Settings, ChevronRight, BookOpen, TrendingUp, LogOut } from 'lucide-react';
import NewProjectModal from './NewProjectModal';

// ==================== 홈 화면 ====================
const HomeScreen: React.FC = () => {
  const { projects, setActiveProject, setView, currentUser, handleSignOut } = useApp();
  const [showNewProject, setShowNewProject] = useState(false);

  const handleProjectClick = (id: string) => {
    setActiveProject(id);
    setView('project');
  };

  // 전체 통계
  const totalBudget = projects.reduce((s, p) => s + p.totalBudget, 0);
  const totalUsed = projects.reduce((s, p) => s + calculateUsedAmount(p), 0);
  const totalRemaining = totalBudget - totalUsed;

  return (
    <div className="home-screen">
      {/* 상단 헤더 */}
      <div className="home-header">
        <div className="home-title">
          <BookOpen size={24} />
          <div>
            <h1>영수증 다이어리</h1>
            <p>{currentUser ? currentUser.email : '로컬 모드'} · {projects.length}개 프로젝트</p>
          </div>
        </div>
        <div style={{display:'flex',gap:4}}>
          {currentUser && (
            <button className="settings-btn" onClick={handleSignOut} title="로그아웃">
              <LogOut size={18} />
            </button>
          )}
          <button className="settings-btn" onClick={() => setView('settings')}>
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* 전체 예산 요약 */}
      {projects.length > 0 && (
        <div className="total-summary-card">
          <div className="summary-icon">
            <TrendingUp size={20} />
          </div>
          <div className="summary-content">
            <div className="summary-label">전체 예산 현황</div>
            <div className="summary-remaining">
              {formatCurrency(totalRemaining)}
              <span className="summary-remaining-label">남음</span>
            </div>
            <div className="summary-used" style={{ color: '#3b82f6' }}>
              -{formatCurrency(totalUsed)} 사용
            </div>
          </div>
          <div className="summary-progress-wrapper">
            {totalBudget > 0 && (
              <div className="summary-progress">
                <div
                  className="summary-progress-bar"
                  style={{
                    width: `${Math.min((totalUsed / totalBudget) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 프로젝트 목록 */}
      <div className="projects-section">
        <div className="section-header">
          <h2>프로젝트</h2>
          <button
            className="add-project-btn"
            onClick={() => setShowNewProject(true)}
          >
            <Plus size={18} />
            새 프로젝트
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">📋</div>
            <h3>프로젝트가 없습니다</h3>
            <p>새 프로젝트를 만들어 영수증을 관리해보세요</p>
            <button
              className="btn-primary"
              onClick={() => setShowNewProject(true)}
            >
              첫 프로젝트 만들기
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => {
              const used = calculateUsedAmount(project);
              const remaining = calculateRemainingAmount(project);
              const percent =
                project.totalBudget > 0
                  ? Math.min((used / project.totalBudget) * 100, 100)
                  : 0;
              const isOver = remaining < 0;
              const hasWarnings = project.receipts.some(r =>
                r.items.some(i => i.warning)
              );

              return (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => handleProjectClick(project.id)}
                  style={{ borderLeftColor: project.color }}
                >
                  <div className="project-card-top">
                    <div
                      className="project-icon-circle"
                      style={{ backgroundColor: project.color + '20' }}
                    >
                      <span style={{ fontSize: 22 }}>{project.icon}</span>
                    </div>
                    <div className="project-info">
                      <div className="project-name">{project.name}</div>
                      {project.description && (
                        <div className="project-desc">{project.description}</div>
                      )}
                      <div className="project-receipt-count">
                        {project.receipts.length}건의 영수증
                      </div>
                    </div>
                    <ChevronRight size={16} className="project-arrow" />
                  </div>

                  <div className="project-budget-row">
                    <div
                      className="project-remaining"
                      style={{ color: isOver ? '#ef4444' : project.color }}
                    >
                      <span className="pr-label">잔여</span>
                      <strong>{formatCurrency(Math.abs(remaining))}</strong>
                      {isOver && <span className="over-label">초과</span>}
                    </div>
                    <div className="project-used" style={{ color: '#3b82f6' }}>
                      -{formatCurrency(used)}
                    </div>
                  </div>

                  {project.totalBudget > 0 && (
                    <div className="project-progress">
                      <div
                        className="project-progress-bar"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: isOver ? '#ef4444' : project.color,
                        }}
                      />
                    </div>
                  )}

                  {hasWarnings && (
                    <div className="project-warning-badge">⚠️ 상한 초과 항목</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 새 프로젝트 모달 */}
      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} />
      )}
    </div>
  );
};

export default HomeScreen;
