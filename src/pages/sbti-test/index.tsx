import { View, Text } from "@tarojs/components";
import { Button, ConfigProvider } from "@nutui/nutui-react-taro";
import zhCN from "@nutui/nutui-react-taro/dist/locales/zh-CN";
import { useState, useEffect } from "react";
import { setStorageSync, getStorageSync, navigateTo } from "@tarojs/taro";
import dayjs from "dayjs";
import {
  shuffleQuestions,
  buildDynamicList,
  computeSBTIResult,
  SBTIQuestion,
} from "src/utils/sbti";
import "./index.less";

const OPTION_LABELS = ["A", "B", "C", "D"];

function SBTITest() {
  const [questions, setQuestions] = useState<SBTIQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const base = shuffleQuestions();
    setQuestions(base);
    setReady(true);
  }, []);

  if (!ready || questions.length === 0) {
    return (
      <View className="sbti-loading">
        <Text className="sbti-loading-text">正在布置题目...</Text>
      </View>
    );
  }

  // 动态列表（饮酒分支）
  const dynamicList = buildDynamicList(questions, answers);
  const total = dynamicList.length;
  const current: SBTIQuestion = dynamicList[currentIndex];
  const selectedValue = answers[current?.id];
  const progress = ((currentIndex + 1) / total) * 100;

  const handleSelect = (value: number) => {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);

    // 重新计算动态题目列表（饮酒分支可能变长）
    const newList = buildDynamicList(dynamicList, newAnswers);
    if (newList.length !== dynamicList.length) {
      setQuestions(newList);
    }

    // 300ms 后自动跳题 / 完成测试
    setTimeout(() => {
      const isLast = currentIndex >= newList.length - 1;
      if (isLast) {
        const result = computeSBTIResult(newAnswers);
        const record = {
          finalCode: result.finalCode,
          levels: result.levels,
          rawScores: result.rawScores,
          similarity: result.similarity,
          exact: result.exact,
          time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          key: Date.now(),
        };
        setStorageSync("currentSBTIRecord", record);
        const allRecords: typeof record[] = getStorageSync("sbtiRecords") || [];
        setStorageSync("sbtiRecords", [record, ...allRecords]);
        navigateTo({ url: "/pages/sbti-result/index" });
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }, 300);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // 维度标签
  const isSpecial = current?.special;

  return (
    <ConfigProvider locale={zhCN}>
      <View className="sbti-test-container">
        {/* 进度区 */}
        <View className="sbti-progress-card">
          <View className="sbti-progress-info">
            <Text className="sbti-progress-label">
              第 {currentIndex + 1} / {total} 题
            </Text>
            <Text className="sbti-progress-hint">
              正式题固定 31 题，饮酒分支会在命中时额外展开。
            </Text>
          </View>
          <View className="sbti-progress-bar-wrap">
            <View className="sbti-progress-bar">
              <View
                className="sbti-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="sbti-progress-pct">
              {Math.round(progress)}%
            </Text>
          </View>
        </View>

        {/* 题目卡片 */}
        <View className="sbti-question-card">
          {/* 维度标签 */}
          <View className="sbti-dim-tags">
            {isSpecial ? (
              <Text className="sbti-tag sbti-tag-special">补充题</Text>
            ) : current?.dim ? (
              <>
                <Text className="sbti-tag sbti-tag-model">
                  {/* 从维度名推模型 */}
                  {current.dim.startsWith("S")
                    ? "自我模型"
                    : current.dim.startsWith("E")
                    ? "情感模型"
                    : current.dim.startsWith("A") && !current.dim.startsWith("Ac")
                    ? "态度模型"
                    : current.dim.startsWith("Ac")
                    ? "行动驱力模型"
                    : "社交模型"}
                </Text>
                <Text className="sbti-tag sbti-tag-dim">{current.dim}</Text>
              </>
            ) : null}
          </View>

          {/* 题目文字 */}
          <Text className="sbti-question-text">{current?.text}</Text>

          {/* 选项 */}
          <View className="sbti-options">
            {current?.options.map((opt, idx) => {
              const isSelected = selectedValue === opt.value;
              return (
                <Button
                  key={`${current.id}-${opt.value}`}
                  className={`sbti-option-btn${isSelected ? " sbti-option-selected" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <View className="sbti-option-inner">
                    <View
                      className={`sbti-option-label${isSelected ? " sbti-option-label-selected" : ""}`}
                    >
                      <Text>{OPTION_LABELS[idx] || String(idx + 1)}</Text>
                    </View>
                    <Text className="sbti-option-text">{opt.label}</Text>
                  </View>
                </Button>
              );
            })}
          </View>

          {/* 导航按钮：仅保留"上一题" */}
          <View className="sbti-nav">
            <Button
              className="sbti-nav-btn sbti-nav-prev"
              disabled={currentIndex === 0}
              onClick={handlePrev}
            >
              上一题
            </Button>
          </View>
        </View>
      </View>
    </ConfigProvider>
  );
}

export default SBTITest;
