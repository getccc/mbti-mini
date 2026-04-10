import { View, Text, Image } from "@tarojs/components";
import { Button } from "@nutui/nutui-react-taro";
import { navigateTo } from "@tarojs/taro";
import homeImage from "src/assets/images/home.jpg";
import "./index.less";

function Home() {
  const handleStartMBTI = () => navigateTo({ url: "/pages/test/index" });
  const handleStartSBTI = () => navigateTo({ url: "/pages/sbti-test/index" });

  return (
    <View className="container-home">
      <View className="content">
        <View className="header">
          <Image src={homeImage} className="header-image" mode="aspectFill" />
          <Text className="title">性格测试</Text>
        </View>

        {/* MBTI 区块 */}
        <View className="test-block">
          <Text className="test-block-title">MBTI 职业性格测试</Text>
          <Text className="test-block-desc">
            经典 93 题版本，四个维度，16 种性格类型。
          </Text>
          <View className="btn-box">
            <Button className="start-button" onClick={handleStartMBTI}>
              开始 MBTI 测试
            </Button>
            <Button
              className="record-button"
              onClick={() => navigateTo({ url: "/pages/record/index" })}
            >
              测试记录
            </Button>
          </View>
        </View>

        {/* 分隔线 */}
        <View className="home-divider">
          <View className="divider-line" />
          <Text className="divider-text">或者</Text>
          <View className="divider-line" />
        </View>

        {/* SBTI 区块 */}
        <View className="test-block sbti-block">
          <View className="sbti-new-badge">
            <Text className="sbti-new-text">NEW</Text>
          </View>
          <Text className="test-block-title">SBTI 性格测试</Text>
          <Text className="test-block-desc">
            27 种人格 · 15 维度 · 31 道题。更接地气，更有辨识度。
          </Text>
          <Text className="sbti-types-hint">
            CTRL · BOSS · SEXY · MONK · DEAD · DRUNK…
          </Text>
          <Button className="sbti-start-button" onClick={handleStartSBTI}>
            开始 SBTI 测试
          </Button>
        </View>

        <View className="section notice-section">
          <Text className="section-title">温馨提示</Text>
          <Text className="section-text">
            测试结果仅供娱乐与自我观察，不作为心理诊断依据。
          </Text>
        </View>
      </View>
    </View>
  );
}

export default Home;
