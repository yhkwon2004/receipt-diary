import React, { useState } from 'react';
import { Receipt, Project } from '../types';
import { formatDate, formatCurrency } from '../utils/helpers';
import { ChevronDown, ChevronRight, AlertTriangle, Trash2, Image } from 'lucide-react';

interface ReceiptCardProps {
  receipt: Receipt;
  project: Project;
  onDelete: () => void;
}

// ==================== 영수증 카드 컴포넌트 ====================
const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, project, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const hasWarning = receipt.items.some(i => i.warning);

  return (
    <div className={`receipt-card ${hasWarning ? 'has-warning' : ''}`}>
      {/* 카드 헤더 */}
      <div className="receipt-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="receipt-card-left">
          <div className="receipt-date">{formatDate(receipt.date)}</div>
          <div className="receipt-store">{receipt.storeName}</div>
          <div className="receipt-item-count">{receipt.items.length}개 항목</div>
        </div>
        <div className="receipt-card-right">
          {hasWarning && (
            <div className="warning-indicator">
              <AlertTriangle size={14} />
            </div>
          )}
          <div className="receipt-amount" style={{ color: '#3b82f6' }}>
            -{formatCurrency(receipt.totalAmount)}
          </div>
          <div className="expand-icon">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </div>
      </div>

      {/* 펼쳐진 상세 내용 */}
      {expanded && (
        <div className="receipt-card-body">
          {/* 이미지 토글 */}
          {receipt.imageUrl && (
            <div className="receipt-image-toggle">
              <button
                className="image-toggle-btn"
                onClick={() => setShowImage(s => !s)}
              >
                <Image size={14} />
                {showImage ? '이미지 숨기기' : '원본 이미지 보기'}
              </button>
              {showImage && (
                <img
                  src={receipt.imageUrl}
                  alt="영수증"
                  className="receipt-image"
                />
              )}
            </div>
          )}

          {/* 항목 테이블 */}
          <div className="receipt-items-table">
            <table>
              <thead>
                <tr>
                  {project.tableColumns.map(col => (
                    <th key={col.id}>{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipt.items.map(item => (
                  <tr key={item.id} className={item.warning ? 'warning-row' : ''}>
                    <td>
                      {item.name}
                      {item.warning && (
                        <span className="warning-tag">
                          <AlertTriangle size={10} />
                          {item.warningMessage}
                        </span>
                      )}
                    </td>
                    <td className="num">{item.quantity}</td>
                    <td className="num">{item.unitPrice.toLocaleString()}</td>
                    <td className="num amount">{item.totalPrice.toLocaleString()}</td>
                    <td>
                      <span className="category-tag">{item.category}</span>
                    </td>
                    {project.tableColumns.length > 5 && (
                      <td>{item.note || ''}</td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="total-label">합계</td>
                  <td className="total-value" style={{ color: '#3b82f6' }}>
                    {receipt.totalAmount.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 삭제 버튼 */}
          <div className="receipt-card-footer">
            <button className="delete-receipt-btn" onClick={onDelete}>
              <Trash2 size={14} />
              영수증 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptCard;
