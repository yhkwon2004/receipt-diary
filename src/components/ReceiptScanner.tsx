import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader, AlertTriangle } from 'lucide-react';
import { analyzeReceipt } from '../utils/openai';
import { ReceiptItem } from '../types';
import { generateId, formatCurrency, DEFAULT_CATEGORIES } from '../utils/helpers';

interface ReceiptScannerProps {
  projectId: string;
  categories?: string[];
  budgetRules?: { category: string; maxAmount: number }[];
  onConfirm: (data: {
    storeName: string;
    date: string;
    items: ReceiptItem[];
    totalAmount: number;
    imageUrl?: string;
  }) => void;
  onCancel: () => void;
}

// ==================== 영수증 스캐너 컴포넌트 ====================
const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  projectId,
  categories = DEFAULT_CATEGORIES,
  budgetRules = [],
  onConfirm,
  onCancel,
}) => {
  const [step, setStep] = useState<'capture' | 'preview' | 'result' | 'edit'>('capture');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    storeName: string;
    date: string;
    items: ReceiptItem[];
    totalAmount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ── 이미지 선택 처리 ──
  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setStep('preview');
    setError('');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  // ── AI 분석 ──
  const handleAnalyze = async () => {
    if (!imageFile) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const data = await analyzeReceipt(imageFile, categories);
      // 경고 체크
      const itemsWithWarnings = data.items.map(item => {
        const rule = budgetRules.find(
          r => r.category === item.category || r.category === '전체'
        );
        if (rule && item.totalPrice > rule.maxAmount) {
          return {
            ...item,
            warning: true,
            warningMessage: `${rule.category} 상한(${formatCurrency(rule.maxAmount)}) 초과`,
          };
        }
        return item;
      });
      setResult({ ...data, items: itemsWithWarnings });
      setStep('result');
    } catch (e: any) {
      setError(e.message || '분석 실패');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── 항목 편집 ──
  const updateItem = (id: string, field: keyof ReceiptItem, value: any) => {
    if (!result) return;
    const updated = result.items.map(item => {
      if (item.id !== id) return item;
      const newItem = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        newItem.totalPrice = Number(newItem.quantity) * Number(newItem.unitPrice);
      }
      return newItem;
    });
    const newTotal = updated.reduce((s, i) => s + i.totalPrice, 0);
    setResult({ ...result, items: updated, totalAmount: newTotal });
  };

  const deleteItem = (id: string) => {
    if (!result) return;
    const updated = result.items.filter(i => i.id !== id);
    const newTotal = updated.reduce((s, i) => s + i.totalPrice, 0);
    setResult({ ...result, items: updated, totalAmount: newTotal });
  };

  const addItem = () => {
    if (!result) return;
    const newItem: ReceiptItem = {
      id: generateId(),
      name: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: '기타',
      warning: false,
      warningMessage: '',
    };
    setResult({ ...result, items: [...result.items, newItem] });
  };

  // ==================== 렌더링 ====================
  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        {/* 헤더 */}
        <div className="scanner-header">
          <h2>영수증 스캔</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: 이미지 선택 */}
        {step === 'capture' && (
          <div className="capture-step">
            <div className="capture-options">
              {/* 카메라 촬영 */}
              <button
                className="capture-btn camera-btn"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={40} />
                <span>카메라 촬영</span>
                <span className="capture-desc">실시간으로 영수증 찍기</span>
              </button>

              {/* 갤러리에서 선택 */}
              <button
                className="capture-btn gallery-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={40} />
                <span>갤러리에서 선택</span>
                <span className="capture-desc">저장된 사진 불러오기</span>
              </button>
            </div>

            {/* 수동 입력 */}
            <button
              className="manual-btn"
              onClick={() => {
                const emptyResult = {
                  storeName: '',
                  date: new Date().toISOString().split('T')[0],
                  items: [
                    {
                      id: generateId(),
                      name: '',
                      quantity: 1,
                      unitPrice: 0,
                      totalPrice: 0,
                      category: '기타',
                      warning: false,
                      warningMessage: '',
                    },
                  ],
                  totalAmount: 0,
                };
                setResult(emptyResult);
                setStep('result');
              }}
            >
              직접 입력하기
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* STEP 2: 미리보기 & 분석 */}
        {step === 'preview' && (
          <div className="preview-step">
            <div className="image-preview-container">
              <img src={imagePreview} alt="영수증" className="receipt-preview-img" />
            </div>
            {error && (
              <div className="error-msg">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            <div className="preview-actions">
              <button className="btn-secondary" onClick={() => setStep('capture')}>
                다시 찍기
              </button>
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader size={16} className="spin" />
                    AI 분석 중...
                  </>
                ) : (
                  'AI로 분석하기'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 결과 편집 */}
        {step === 'result' && result && (
          <div className="result-step">
            {/* 기본 정보 */}
            <div className="result-header-info">
              <div className="info-row">
                <label>가게명</label>
                <input
                  type="text"
                  value={result.storeName}
                  onChange={e => setResult({ ...result, storeName: e.target.value })}
                  placeholder="가게명 입력"
                />
              </div>
              <div className="info-row">
                <label>날짜</label>
                <input
                  type="date"
                  value={result.date}
                  onChange={e => setResult({ ...result, date: e.target.value })}
                />
              </div>
            </div>

            {/* 항목 테이블 */}
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>품목</th>
                    <th>수량</th>
                    <th>단가</th>
                    <th>합계</th>
                    <th>카테고리</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map(item => (
                    <tr
                      key={item.id}
                      className={item.warning ? 'warning-row' : ''}
                    >
                      <td>
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateItem(item.id, 'name', e.target.value)}
                          placeholder="품목명"
                          className="table-input"
                        />
                        {item.warning && (
                          <div className="warning-badge">
                            <AlertTriangle size={12} />
                            {item.warningMessage}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                          className="table-input num-input"
                          min="1"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="table-input num-input"
                          min="0"
                        />
                      </td>
                      <td className="amount-cell">
                        {item.totalPrice.toLocaleString()}
                      </td>
                      <td>
                        <select
                          value={item.category}
                          onChange={e => updateItem(item.id, 'category', e.target.value)}
                          className="table-select"
                        >
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="del-item-btn"
                          onClick={() => deleteItem(item.id)}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 항목 추가 */}
            <button className="add-item-btn" onClick={addItem}>
              + 항목 추가
            </button>

            {/* 합계 */}
            <div className="total-row">
              <span>총 합계</span>
              <span className="total-amount">
                {formatCurrency(result.totalAmount)}
              </span>
            </div>

            {/* 액션 버튼 */}
            <div className="result-actions">
              <button
                className="btn-secondary"
                onClick={() => imageFile ? setStep('preview') : setStep('capture')}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={() =>
                  onConfirm({
                    ...result,
                    imageUrl: imagePreview || undefined,
                  })
                }
              >
                저장하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptScanner;
