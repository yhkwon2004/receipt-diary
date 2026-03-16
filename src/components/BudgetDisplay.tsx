import React from 'react';
import { formatCurrency } from '../utils/helpers';

interface BudgetDisplayProps {
  totalBudget: number;
  usedAmount: number;
  showBudget: boolean;
  onToggle: () => void;
  color: string;
}

// ==================== 예산 표시 컴포넌트 ====================
const BudgetDisplay: React.FC<BudgetDisplayProps> = ({
  totalBudget,
  usedAmount,
  showBudget,
  onToggle,
  color,
}) => {
  const remaining = totalBudget - usedAmount;
  const usagePercent = totalBudget > 0 ? Math.min((usedAmount / totalBudget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  return (
    <div className="budget-display">
      {/* 잔여 금액 (항상 표시, 굵게) */}
      <div className="remaining-amount" style={{ color: isOverBudget ? '#ef4444' : color }}>
        <span className="remaining-label">잔여</span>
        <span className="remaining-value">
          {isOverBudget ? '초과 ' : ''}{formatCurrency(Math.abs(remaining))}
        </span>
      </div>

      {/* 사용 금액 (파란 마이너스 표시) */}
      <div className="used-amount">
        <span className="used-minus" style={{ color: '#3b82f6' }}>-</span>
        <span className="used-value" style={{ color: '#3b82f6' }}>
          {formatCurrency(usedAmount)}
        </span>
      </div>

      {/* 원금 토글 */}
      <button className="budget-toggle" onClick={onToggle}>
        {showBudget ? (
          <span className="budget-original">
            총 예산: {formatCurrency(totalBudget)}
            <span className="toggle-icon">▼</span>
          </span>
        ) : (
          <span className="budget-hidden">
            총 예산 보기 <span className="toggle-icon">▶</span>
          </span>
        )}
      </button>

      {/* 프로그레스 바 */}
      <div className="budget-progress">
        <div
          className="budget-progress-bar"
          style={{
            width: `${usagePercent}%`,
            backgroundColor: isOverBudget ? '#ef4444' : color,
          }}
        />
      </div>
      <div className="budget-percent">
        {usagePercent.toFixed(1)}% 사용
      </div>
    </div>
  );
};

export default BudgetDisplay;
