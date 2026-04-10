import { View, Text, Image } from "@tarojs/components";
import { Button, ConfigProvider } from "@nutui/nutui-react-taro";
import zhCN from "@nutui/nutui-react-taro/dist/locales/zh-CN";
import { useEffect, useState } from "react";
import { getStorageSync, navigateTo } from "@tarojs/taro";
import {
  getSBTIType,
  getDimExplanations,
  SBTILevel,
  SBTIRecord,
  SBTITypeInfo,
} from "src/utils/sbti";
import sbtiTypes from "src/assets/data/sbti-types.json";
import "./index.less";

// 维度分组
const MODEL_GROUPS = [
  { title: "自我模型", dims: ["S1", "S2", "S3"] },
  { title: "情感模型", dims: ["E1", "E2", "E3"] },
  { title: "态度模型", dims: ["A1", "A2", "A3"] },
  { title: "行动驱力模型", dims: ["Ac1", "Ac2", "Ac3"] },
  { title: "社交模型", dims: ["So1", "So2", "So3"] },
];

const LEVEL_LABEL: Record<SBTILevel, string> = { H: "高", M: "中", L: "低" };
const LEVEL_CLASS: Record<SBTILevel, string> = {
  H: "level-h",
  M: "level-m",
  L: "level-l",
};

function SBTIResult() {
  const [record, setRecord] = useState<SBTIRecord | null>(null);
  const [typeInfo, setTypeInfo] = useState<SBTITypeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const r: SBTIRecord = getStorageSync("currentSBTIRecord");
    if (r) {
      setRecord(r);
      const info = getSBTIType(r.finalCode);
      setTypeInfo(info);
      setTimeout(() => setLoading(false), 600);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <View className="sbti-result-loading">
        <View className="sbti-spinner" />
        <Text className="sbti-loading-text">正在分析...</Text>
      </View>
    );
  }

  if (!record || !typeInfo) {
    return (
      <View className="sbti-result-loading">
        <Text className="sbti-loading-text">暂无结果，请先完成测试</Text>
        <Button
          onClick={() => navigateTo({ url: "/pages/sbti-test/index" })}
          className="sbti-btn-primary"
        >
          去测试
        </Button>
      </View>
    );
  }

  const dimMeta = sbtiTypes.dimensionMeta as Record<string, { name: string; model: string }>;
  const dimExp = getDimExplanations();

  return (
    <ConfigProvider locale={zhCN}>
      <View className="sbti-result-page">
        {/* 头部：图片 + 类型 */}
        <View className="sbti-result-header">
          {!imgError ? (
            <Image
              src={typeInfo.image}
              className="sbti-type-image"
              mode="aspectFill"
              onError={() => setImgError(true)}
            />
          ) : (
            <View className="sbti-type-image-fallback">
              <Text className="sbti-type-image-code">{typeInfo.code}</Text>
            </View>
          )}
          <View className="sbti-type-info">
            <Text className="sbti-type-code">{typeInfo.code}</Text>
            <Text className="sbti-type-cn">{typeInfo.cn}</Text>
            <Text className="sbti-type-intro">{typeInfo.intro}</Text>
          </View>
          {/* 匹配度 */}
          <View className="sbti-similarity">
            <Text className="sbti-similarity-num">{record.similarity}%</Text>
            <Text className="sbti-similarity-label">
              匹配度 · 精准命中 {record.exact}/15 维
            </Text>
          </View>
        </View>

        {/* 人格描述 */}
        <View className="sbti-card">
          <Text className="sbti-card-title">人格速写</Text>
          <Text className="sbti-card-desc">{typeInfo.desc}</Text>
        </View>

        {/* 十五维指纹 */}
        <View className="sbti-card">
          <Text className="sbti-card-title">十五维指纹</Text>
          {MODEL_GROUPS.map((group) => (
            <View key={group.title} className="sbti-model-group">
              <Text className="sbti-model-title">{group.title}</Text>
              {group.dims.map((dim) => {
                const level = record.levels[dim] as SBTILevel;
                const meta = dimMeta[dim];
                const exp = dimExp[dim]?.[level] || "";
                return (
                  <View key={dim} className="sbti-dim-row">
                    <View className="sbti-dim-left">
                      <Text className="sbti-dim-name">{meta?.name || dim}</Text>
                      <Text className="sbti-dim-exp">{exp}</Text>
                    </View>
                    <View className={`sbti-level-badge ${LEVEL_CLASS[level]}`}>
                      <Text className="sbti-level-text">{LEVEL_LABEL[level]}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* 操作按钮 */}
        <View className="sbti-result-actions">
          <Button
            className="sbti-btn-primary"
            onClick={() => navigateTo({ url: "/pages/sbti-test/index" })}
          >
            再次测试
          </Button>
          <Button
            className="sbti-btn-secondary"
            onClick={() => navigateTo({ url: "/pages/home/index" })}
          >
            返回首页
          </Button>
        </View>
      </View>
    </ConfigProvider>
  );
}

export default SBTIResult;
