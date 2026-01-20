import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SignupSuccessModal({ visible, onClose }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* CHECK ICON */}
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>

          {/* TEXT */}
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.message}>
            Your account has been successfully created!
          </Text>

          {/* BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              onClose();          // close modal
              router.replace("/"); // ✅ GO TO LOGIN (index.tsx)
            }}
          >
            <Text style={styles.buttonText}>Back to Login</Text>
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
    paddingHorizontal: 20,
  },

  modalBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },

  button: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
