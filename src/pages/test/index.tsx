import { View, Text } from "@tarojs/components";
import { Button, ConfigProvider } from "@nutui/nutui-react-taro";
import zhCN from "@nutui/nutui-react-taro/dist/locales/zh-CN";
import { getStorageSync, navigateTo, setStorageSync } from "@tarojs/taro";
import { useState } from "react";
import mbtiQuestions from "src/assets/data/mbti.json";
import "./index.less";
import genRecordItem from "src/utils/genRecordItem";

type MBTIQuestion = {
  question: string;
  choice_a: { value: string; text: string };
  choice_b: { value: string; text: string };
};

type Answer = {
  questionIndex: number;
  value: string;
};

const OPTION_LABELS = ["A", "B"];

function Test() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const currentQuestion: MBTIQuestion = mbtiQuestions[currentQuestionIndex];
  const total = mbtiQuestions.length;
  const progress = ((currentQuestionIndex + 1) / total) * 100;

  const getCurrentAnswer = () => {
    const a = answers.find((a) => a.questionIndex === currentQuestionIndex);
    return a ? a.value : null;
  };

  const handleChoose = (value: string) => {
    const newAnswers = [...answers];
    const idx = newAnswers.findIndex((a) => a.questionIndex === currentQuestionIndex);
    if (idx !== -1) {
      newAnswers[idx].value = value;
    } else {
      newAnswers.push({ questionIndex: currentQuestionIndex, value });
    }
    setAnswers(newAnswers);

    // 300ms 后自动跳题 / 完成
    setTimeout(() => {
      if (currentQuestionIndex < total - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        calculateMBTIResult(newAnswers);
      }
    }, 300);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const calculateMBTIResult = (answers: Answer[]) => {
    const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    answers.forEach((a) => { counts[a.value as keyof typeof counts]++; });
    const result = [
      counts.E > counts.I ? "E" : "I",
      counts.S > counts.N ? "S" : "N",
      counts.T > counts.F ? "T" : "F",
      counts.J > counts.P ? "J" : "P",
    ].join("");
    const record = genRecordItem(result);
    setStorageSync("currentShowTestRecord", record);
    const testRecords = getStorageSync("testRecords") || [];
    setStorageSync("testRecords", [record, ...testRecords]);
    navigateTo({ url: "/pages/result/index" });
  };

  const currentAnswer = getCurrentAnswer();

  const choices = [
    { label: "A", value: currentQuestion.choice_a.value, text: currentQuestion.choice_a.text },
    { label: "B", value: currentQuestion.choice_b.value, text: currentQuestion.choice_b.text },
  ];

  return (
    <ConfigProvider locale={zhCN}>
      <View className="container-index">
        <View className="content">
          {/* 进度卡片 */}
          <View className="progress-card">
            <View className="progress-info">
              <Text className="progress-text">
                问题 {currentQuestionIndex + 1} / {total}
              </Text>
              <Text className="progress-sub">共 {total} 道题，答完自动跳题</Text>
            </View>
            <View className="progress-bar-wrap">
              <View className="progress-bar">
                <View className="progress-fill" style={{ width: `${progress}%` }} />
              </View>
              <Text className="progress-pct">{Math.round(progress)}%</Text>
            </View>
          </View>

          {/* 题目卡片 */}
          <View className="card">
            <Text className="question-tag">MBTI 测试</Text>
            <Text className="question-text">{currentQuestion.question}</Text>

            <View className="choices">
              {choices.map((choice) => {
                const isSelected = currentAnswer === choice.value;
                return (
                  <Button
                    key={choice.value}
                    className={`choice-button${isSelected ? " selected" : ""}`}
                    onClick={() => handleChoose(choice.value)}
                  >
                    <View className="choice-inner">
                      <View className={`choice-label${isSelected ? " selected" : ""}`}>
                        <Text>{choice.label}</Text>
                      </View>
                      <Text className="choice-text">{choice.text}</Text>
                    </View>
                  </Button>
                );
              })}
            </View>

            {/* 仅保留上一题 */}
            <View className="navigation">
              <Button
                className="nav-button"
                disabled={currentQuestionIndex === 0}
                onClick={handlePrevious}
              >
                上一题
              </Button>
            </View>
          </View>
        </View>
      </View>
    </ConfigProvider>
  );
}

export default Test;
