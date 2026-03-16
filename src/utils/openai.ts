import OpenAI from 'openai';
import { ReceiptItem } from '../types';
import { generateId } from './helpers';

// ==================== OpenAI 클라이언트 초기화 ====================
const getOpenAIClient = (): OpenAI => {
  // 1순위: localStorage에 저장된 키 (설정 화면에서 입력)
  // 2순위: 환경변수
  const apiKey =
    localStorage.getItem('openai_api_key') ||
    process.env.REACT_APP_OPENAI_API_KEY ||
    'dummy_key';

  const baseURL =
    localStorage.getItem('openai_base_url') ||
    process.env.REACT_APP_OPENAI_BASE_URL ||
    'https://www.genspark.ai/api/llm_proxy/v1';

  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });
};

// ==================== 이미지 → Base64 변환 ====================
const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ==================== 영수증 OCR 분석 ====================
export const analyzeReceipt = async (
  imageFile: File,
  categories: string[]
): Promise<{
  storeName: string;
  date: string;
  items: ReceiptItem[];
  totalAmount: number;
}> => {
  const client = getOpenAIClient();
  const base64Image = await imageToBase64(imageFile);
  const categoryList = categories.join(', ');

  const prompt = `이 영수증 이미지를 분석하여 다음 JSON 형식으로 정확하게 반환해주세요. 반드시 유효한 JSON만 반환하고 다른 텍스트는 포함하지 마세요.

{
  "storeName": "가게명",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "name": "상품명",
      "quantity": 수량(숫자),
      "unitPrice": 단가(숫자, 원 단위),
      "totalPrice": 합계금액(숫자, 원 단위),
      "category": "카테고리(${categoryList} 중 가장 적합한 것)"
    }
  ],
  "totalAmount": 총금액(숫자, 원 단위)
}

주의사항:
- 금액은 숫자만 (쉼표, 원 기호 없이)
- 날짜가 없으면 오늘 날짜 사용
- 카테고리는 항목 내용에 맞게 선택
- 수량이 불명확하면 1로 설정
- 이미지가 불명확해도 최선을 다해 분석`;

  const response = await client.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: base64Image },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content || '{}';

  let parsed: any;
  try {
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // JSON 파싱 실패 시 기본 구조 반환
    throw new Error('영수증 분석에 실패했습니다. 이미지를 다시 확인하고 시도해주세요.');
  }

  const items: ReceiptItem[] = (parsed.items || []).map((item: any) => ({
    id: generateId(),
    name: item.name || '항목',
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    totalPrice: Number(item.totalPrice) || 0,
    category: item.category || '기타',
    warning: false,
    warningMessage: '',
  }));

  return {
    storeName: parsed.storeName || '알 수 없는 가게',
    date: parsed.date || new Date().toISOString().split('T')[0],
    items,
    totalAmount:
      Number(parsed.totalAmount) ||
      items.reduce((s, i) => s + i.totalPrice, 0),
  };
};
