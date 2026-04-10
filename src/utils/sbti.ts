import sbtiData from "src/assets/data/sbti-questions.json";
import sbtiTypes from "src/assets/data/sbti-types.json";

export type SBTILevel = "H" | "M" | "L";

export type SBTIQuestion = {
  id: string;
  dim?: string;
  special?: boolean;
  kind?: string;
  text: string;
  options: { label: string; value: number }[];
};

export type SBTIRecord = {
  finalCode: string;
  levels: Record<string, SBTILevel>;
  rawScores: Record<string, number>;
  similarity: number;
  exact: number;
  time: string;
  key: number;
};

export type SBTITypeInfo = {
  code: string;
  cn: string;
  slug: string;
  intro: string;
  image: string;
  special: boolean;
  desc: string;
};

// Fisher-Yates 洗牌
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 生成随机题序：30道标准题随机排列，将 drink_gate_q1 随机插入
export function shuffleQuestions(): SBTIQuestion[] {
  const standard = shuffle(sbtiData.questions as SBTIQuestion[]);
  const special = sbtiData.specialQuestions as SBTIQuestion[];
  const gateQ = special[0]; // drink_gate_q1
  const insertPos = Math.floor(Math.random() * (standard.length + 1));
  const result = [...standard];
  result.splice(insertPos, 0, gateQ);
  return result;
}

// 根据作答情况动态追加饮酒分支题
export function buildDynamicList(
  base: SBTIQuestion[],
  answers: Record<string, number>
): SBTIQuestion[] {
  const special = sbtiData.specialQuestions as SBTIQuestion[];
  const gateQ = special[0];
  const triggerQ = special[1]; // drink_gate_q2
  const gateIdx = base.findIndex((q) => q.id === gateQ.id);
  if (gateIdx === -1) return base;

  // 如果 drink_gate_q1 答了 3（饮酒），且 drink_gate_q2 还不在列表里
  if (
    answers[gateQ.id] === 3 &&
    !base.find((q) => q.id === triggerQ.id)
  ) {
    const next = [...base];
    next.splice(gateIdx + 1, 0, triggerQ);
    return next;
  }
  // 如果改选了非饮酒，移除 drink_gate_q2
  if (
    answers[gateQ.id] !== 3 &&
    base.find((q) => q.id === triggerQ.id)
  ) {
    return base.filter((q) => q.id !== triggerQ.id);
  }
  return base;
}

// 计算各维度原始分
function calcRawScores(answers: Record<string, number>): Record<string, number> {
  const scores: Record<string, number> = {};
  const dimOrder = sbtiData.dimensionOrder;
  dimOrder.forEach((dim) => { scores[dim] = 0; });

  (sbtiData.questions as SBTIQuestion[]).forEach((q) => {
    if (q.dim && answers[q.id] !== undefined) {
      scores[q.dim] = (scores[q.dim] || 0) + answers[q.id];
    }
  });
  return scores;
}

// 分数 → 评级
function scoreToLevel(score: number): SBTILevel {
  if (score <= 3) return "L";
  if (score === 4) return "M";
  return "H";
}

const levelVal: Record<string, number> = { L: 1, M: 2, H: 3 };

// 计算 SBTI 结果
export function computeSBTIResult(answers: Record<string, number>): {
  finalCode: string;
  levels: Record<string, SBTILevel>;
  rawScores: Record<string, number>;
  similarity: number;
  exact: number;
} {
  const dimOrder = sbtiData.dimensionOrder;
  const rawScores = calcRawScores(answers);
  const levels: Record<string, SBTILevel> = {};
  dimOrder.forEach((dim) => {
    levels[dim] = scoreToLevel(rawScores[dim] || 0);
  });

  const actualVec = dimOrder.map((d) => levelVal[levels[d]]);

  // 与所有 normalTypes 比较
  const ranked = sbtiTypes.normalTypes.map((t) => {
    const patternChars = t.pattern.replace(/-/g, "").split("");
    const patternVec = patternChars.map((c) => levelVal[c] || 1);
    let distance = 0;
    let exact = 0;
    for (let i = 0; i < dimOrder.length; i++) {
      const diff = Math.abs(actualVec[i] - patternVec[i]);
      distance += diff;
      if (diff === 0) exact++;
    }
    const similarity = Math.max(0, Math.round((1 - distance / 30) * 100));
    return { code: t.code, distance, exact, similarity };
  });

  ranked.sort((a, b) =>
    a.distance !== b.distance
      ? a.distance - b.distance
      : b.exact !== a.exact
      ? b.exact - a.exact
      : b.similarity - a.similarity
  );

  const best = ranked[0];
  let finalCode = best.code;

  // 特殊逻辑：饮酒触发
  if (answers[sbtiData.drunkTriggerQuestionId] === sbtiData.drunkTriggerValue) {
    finalCode = "DRUNK";
  } else if (best.similarity < 60) {
    finalCode = "HHHH";
  }

  return {
    finalCode,
    levels,
    rawScores,
    similarity: best.similarity,
    exact: best.exact,
  };
}

// 获取人格详情
export function getSBTIType(code: string): SBTITypeInfo | null {
  const types = sbtiTypes.types as Record<string, SBTITypeInfo>;
  return types[code] || null;
}

// 获取维度元信息
export function getDimensionMeta() {
  return sbtiTypes.dimensionMeta as Record<
    string,
    { name: string; model: string }
  >;
}

// 获取维度解释
export function getDimExplanations() {
  return sbtiTypes.dimExplanations as Record<
    string,
    Record<SBTILevel, string>
  >;
}

export const dimensionOrder = sbtiData.dimensionOrder;
