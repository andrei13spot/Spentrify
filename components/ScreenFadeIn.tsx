import { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function ScreenFadeIn({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(350).springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
