import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Animated } from "react-native";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const CustomModalAlert = ({ visible, title, message, onClose }: Props) => {
  const [scale] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 6,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale }],
            width: "85%",
            backgroundColor: "#1C1C1E",
            borderRadius: 20,
            padding: 25,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#fff",
              marginBottom: 10,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#D1D1D6",
              textAlign: "center",
              marginBottom: 25,
              lineHeight: 20,
            }}
          >
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "#34C759",
              paddingVertical: 10,
              paddingHorizontal: 30,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomModalAlert;
