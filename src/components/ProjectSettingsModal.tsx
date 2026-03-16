import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Project, BudgetRule } from '../types';
import {
  X,
  Trash2,
  Plus,
  AlertTriangle,
  Save,
} from 'lucide-react';
import {
  PROJECT_COLORS,
  PROJECT_ICONS,
  DEFAULT_CATEGORIES,
  generateId,
  formatCurrency,
} from '../utils/helpers';

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
}

// ==================== 프로젝트 설정 모달 ====================
const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  onClose,
}) => {
  const { updateProject, deleteProject, addBudgetRule, deleteBudgetRule, setView, setActiveProject } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'budget' | 'danger'>('general');
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [totalBudget, setTotalBudget] = useState(String(project.totalBudget));
  const [color, setColor] = useState(project.color);
  const [icon, setIcon] = useState(project.icon);

  const [ruleCategory, setRuleCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [ruleMax, setRuleMax] = useState('');

  const handleSave = () => {
    updateProject(project.id, {
      name,
      description,
      totalBudget: Number(totalBudget) || 0,
      color,
      icon,
    });
    onClose();
  };

  const handleAddRule = () => {
    if (!ruleMax || isNaN(Number(ruleMax))) return;
    addBudgetRule(project.id, {
      category: ruleCategory,
      maxAmount: Number(ruleMax),
    });
    setRuleMax('');
  };

  const handleDelete = () => {
    if (window.confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?\n모든 영수증 데이터가 삭제됩니다.`)) {
      deleteProject(project.id);
      setActiveProject(null);
      setView('home');
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal">
        {/* 헤더 */}
        <div className="modal-header">
          <h2>프로젝트 설정</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 탭 */}
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            일반
          </button>
          <button
            className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            예산 규칙
          </button>
          <button
            className={`tab-btn danger-tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            위험
          </button>
        </div>

        {/* 일반 설정 */}
        {activeTab === 'general' && (
          <div className="settings-content">
            {/* 아이콘 & 색상 */}
            <div className="icon-color-picker">
              <div className="selected-icon" style={{ backgroundColor: color }}>
                {icon}
              </div>
              <div className="picker-options">
                <div className="color-row">
                  {PROJECT_COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-dot ${color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <div className="icon-row">
                  {PROJECT_ICONS.map(ic => (
                    <button
                      key={ic}
                      className={`icon-btn ${icon === ic ? 'selected' : ''}`}
                      onClick={() => setIcon(ic)}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>프로젝트명</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>설명</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="form-textarea"
                rows={2}
              />
            </div>
            <div className="form-group">
              <label>총 예산 (원)</label>
              <input
                type="number"
                value={totalBudget}
                onChange={e => setTotalBudget(e.target.value)}
                className="form-input"
                min="0"
              />
            </div>

            <button className="btn-primary save-btn" onClick={handleSave}>
              <Save size={16} />
              저장
            </button>
          </div>
        )}

        {/* 예산 규칙 */}
        {activeTab === 'budget' && (
          <div className="settings-content">
            <h3>카테고리별 상한 설정</h3>

            <div className="rule-input-row">
              <select
                value={ruleCategory}
                onChange={e => setRuleCategory(e.target.value)}
                className="form-select"
              >
                <option value="전체">전체</option>
                {DEFAULT_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                value={ruleMax}
                onChange={e => setRuleMax(e.target.value)}
                placeholder="상한 금액"
                className="form-input rule-amount"
                min="0"
              />
              <button className="btn-add-rule" onClick={handleAddRule}>
                <Plus size={16} />
              </button>
            </div>

            <div className="rules-list">
              {project.budgetRules.length === 0 ? (
                <div className="empty-rules">설정된 규칙이 없습니다</div>
              ) : (
                project.budgetRules.map(rule => (
                  <div key={rule.id} className="rule-item">
                    <AlertTriangle size={14} className="rule-icon" />
                    <span className="rule-category">{rule.category}</span>
                    <span className="rule-amount-display">
                      {formatCurrency(rule.maxAmount)} 이하
                    </span>
                    <button
                      className="del-rule-btn"
                      onClick={() => deleteBudgetRule(project.id, rule.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 위험 구역 */}
        {activeTab === 'danger' && (
          <div className="settings-content danger-zone">
            <div className="danger-header">
              <AlertTriangle size={20} />
              <h3>위험 구역</h3>
            </div>
            <p className="danger-desc">
              아래 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
            </p>
            <button className="delete-project-btn" onClick={handleDelete}>
              <Trash2 size={16} />
              프로젝트 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSettingsModal;
