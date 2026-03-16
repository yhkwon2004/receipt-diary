import React, { useState } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { parseFile } from '../utils/fileParser';
import { useApp } from '../store/AppContext';
import {
  PROJECT_COLORS,
  PROJECT_ICONS,
  DEFAULT_CATEGORIES,
  generateId,
} from '../utils/helpers';
import { BudgetRule, TableColumn } from '../types';

interface NewProjectModalProps {
  onClose: () => void;
}

// ==================== 새 프로젝트 생성 모달 ====================
const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose }) => {
  const { createProject, setActiveProject, setView } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [icon, setIcon] = useState(PROJECT_ICONS[0]);

  // 예산 규칙
  const [budgetRules, setBudgetRules] = useState<Omit<BudgetRule, 'id'>[]>([]);
  const [ruleCategory, setRuleCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [ruleMax, setRuleMax] = useState('');

  // 테이블 컬럼
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([
    { id: generateId(), name: '품목명', type: 'text', required: true },
    { id: generateId(), name: '수량', type: 'number' },
    { id: generateId(), name: '단가', type: 'number' },
    { id: generateId(), name: '합계', type: 'number' },
    { id: generateId(), name: '카테고리', type: 'category' },
    { id: generateId(), name: '비고', type: 'text' },
  ]);
  const [fileError, setFileError] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // ── 예산 규칙 추가 ──
  const addRule = () => {
    if (!ruleMax || isNaN(Number(ruleMax))) return;
    setBudgetRules(prev => [
      ...prev,
      { category: ruleCategory, maxAmount: Number(ruleMax) },
    ]);
    setRuleMax('');
  };

  const removeRule = (idx: number) => {
    setBudgetRules(prev => prev.filter((_, i) => i !== idx));
  };

  // ── 파일에서 컬럼 불러오기 ──
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoadingFile(true);
    setFileError('');
    try {
      const { columns } = await parseFile(file);
      setTableColumns(columns);
    } catch (err: any) {
      setFileError(err.message);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // ── 컬럼 수정 ──
  const updateColumn = (id: string, field: keyof TableColumn, value: any) => {
    setTableColumns(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeColumn = (id: string) => {
    setTableColumns(prev => prev.filter(c => c.id !== id));
  };

  const addColumn = () => {
    setTableColumns(prev => [
      ...prev,
      { id: generateId(), name: '새 항목', type: 'text' },
    ]);
  };

  // ── 완료 ──
  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject({
      name: name.trim(),
      description: description.trim(),
      totalBudget: Number(totalBudget) || 0,
      color,
      icon,
      budgetRules: budgetRules.map(r => ({ ...r, id: generateId() })),
      tableColumns,
    });
    setActiveProject(project.id);
    setView('project');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content new-project-modal">
        {/* 헤더 */}
        <div className="modal-header">
          <h2>새 프로젝트</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="step-indicator">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* STEP 1: 기본 정보 */}
        {step === 1 && (
          <div className="step-content">
            <h3>기본 정보</h3>

            {/* 아이콘 & 색상 선택 */}
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
              <label>프로젝트명 *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="예: 2024년 연구비"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>설명</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="프로젝트 설명 (선택)"
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
                placeholder="예: 5000000"
                className="form-input"
                min="0"
              />
            </div>
          </div>
        )}

        {/* STEP 2: 예산 규칙 */}
        {step === 2 && (
          <div className="step-content">
            <h3>예산 규칙 설정</h3>
            <p className="step-desc">
              카테고리별 최대 금액을 설정하면 초과 시 경고가 표시됩니다.
            </p>

            <div className="rule-input-row">
              <select
                value={ruleCategory}
                onChange={e => setRuleCategory(e.target.value)}
                className="form-select"
              >
                <option value="전체">전체 (모든 항목)</option>
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
              <button className="btn-add-rule" onClick={addRule}>
                <Plus size={16} />
              </button>
            </div>

            <div className="rules-list">
              {budgetRules.length === 0 ? (
                <div className="empty-rules">
                  규칙을 추가하면 상한 초과 시 경고가 표시됩니다
                </div>
              ) : (
                budgetRules.map((rule, idx) => (
                  <div key={idx} className="rule-item">
                    <AlertTriangle size={14} className="rule-icon" />
                    <span className="rule-category">{rule.category}</span>
                    <span className="rule-amount-display">
                      {rule.maxAmount.toLocaleString()}원 이하
                    </span>
                    <button className="del-rule-btn" onClick={() => removeRule(idx)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 3: 표 구조 설정 */}
        {step === 3 && (
          <div className="step-content">
            <h3>표 구조 설정</h3>
            <p className="step-desc">
              엑셀/CSV 파일에서 불러오거나 직접 열을 추가하세요.
            </p>

            {/* 파일 불러오기 */}
            <label className="file-import-btn">
              {isLoadingFile ? '불러오는 중...' : '📂 엑셀/CSV에서 불러오기'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileImport}
                disabled={isLoadingFile}
              />
            </label>
            {fileError && (
              <div className="error-msg">
                <AlertTriangle size={14} />
                {fileError}
              </div>
            )}

            {/* 컬럼 목록 */}
            <div className="columns-list">
              {tableColumns.map(col => (
                <div key={col.id} className="column-item">
                  <input
                    type="text"
                    value={col.name}
                    onChange={e => updateColumn(col.id, 'name', e.target.value)}
                    className="col-name-input"
                    placeholder="열 이름"
                  />
                  <select
                    value={col.type}
                    onChange={e => updateColumn(col.id, 'type', e.target.value)}
                    className="col-type-select"
                  >
                    <option value="text">텍스트</option>
                    <option value="number">숫자</option>
                    <option value="date">날짜</option>
                    <option value="category">카테고리</option>
                  </select>
                  <button
                    className="del-col-btn"
                    onClick={() => removeColumn(col.id)}
                    disabled={col.required}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button className="add-col-btn" onClick={addColumn}>
              <Plus size={14} />
              열 추가
            </button>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="modal-footer">
          {step > 1 && (
            <button
              className="btn-secondary"
              onClick={() => setStep(prev => (prev - 1) as any)}
            >
              이전
            </button>
          )}
          {step < 3 ? (
            <button
              className="btn-primary"
              onClick={() => setStep(prev => (prev + 1) as any)}
              disabled={step === 1 && !name.trim()}
            >
              다음
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              프로젝트 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
