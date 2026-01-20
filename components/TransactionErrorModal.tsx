import { Ionicons } from "@expo/vector-icons";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  message: string;
  onRetry: () => void;
};

export default function TransactionErrorModal({
  visible,
  message,
  onRetry,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle" size={36} color="#EF4444" />
          </View>

          {/* Text */}
          <Text style={styles.title}>Oh no!</Text>
          <Text style={styles.message}>{message}</Text>

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={onRetry}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  message: {
    fontSize: 13.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },

  button: {
    width: "100%",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});