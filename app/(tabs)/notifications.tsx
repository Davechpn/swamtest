import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Checkbox,
  Button,
  Text,
  TextInput,
  ActivityIndicator,
} from "react-native-paper";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ThemedText } from "@/components/ThemedText";

export default function MapScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevices, setSelectedDevices] = useState(new Set());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const bottomSheetRef = useRef<any>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "75%"], []);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setSheetIndex(-1);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleCheckboxToggle = (deviceId: string) => {
    setSelectedDevices((prevSelected) => {
      const updatedSet = new Set(prevSelected);
      if (updatedSet.has(deviceId)) {
        updatedSet.delete(deviceId);
      } else {
        updatedSet.add(deviceId);
      }
      return updatedSet;
    });
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "devices"), (snapshot) => {
      const deviceData: any[] = [];
      snapshot.forEach((doc) => {
        deviceData.push({ ...doc.data(), id: doc.id });
      });
      setDevices(deviceData);
    });
    return () => unsubscribe();
  }, []);

  const handleSendPress = async () => {
    setIsLoading(true);

    const payload = Array.from(selectedDevices).map((deviceId) => ({
      to: deviceId,
      title,
      body,
    }));
    console.log("ddd", payload);
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("Notification sent successfully");
        bottomSheetRef.current.close();
      } else {
        console.error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPress = () => {
    Keyboard.dismiss();
    setSheetIndex(1);
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <GestureHandlerRootView style={styles.container}>
        <ThemedText type="subtitle">Send A Push Notification</ThemedText>
        <TextInput
          label="Enter Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Enter Body"
          value={body}
          onChangeText={setBody}
          mode="outlined"
          multiline
          style={[styles.input, styles.bodyInput]}
        />
        <Button mode="contained" onPress={handleOpenPress}>
          Select Recipients
        </Button>

        <BottomSheet
          snapPoints={snapPoints}
          ref={bottomSheetRef}
          index={sheetIndex}
          style={styles.bottomSheetContainer}
          onChange={(index) => setSheetIndex(index)}
          backdropComponent={BottomSheetBackdrop}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Recipients</Text>
            <Button
              onPress={handleSendPress}
              mode="contained"
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#888" /> : "Send"}
            </Button>
          </View>
          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 80 }}>
            {devices.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemContainer}
                onPress={() => handleCheckboxToggle(item.pushToken)}
              >
                <Image
                  source={{ uri: "https://via.placeholder.com/50" }}
                  style={styles.avatar}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.userName}>
                    {item.userName || "Anonymous"}
                  </Text>
                  <Text style={styles.deviceInfo}>
                    {item.brand} - {item.deviceName}
                  </Text>
                </View>
                <Checkbox
                  status={
                    selectedDevices.has(item.pushToken)
                      ? "checked"
                      : "unchecked"
                  }
                  onPress={() => handleCheckboxToggle(item.pushToken)}
                />
              </TouchableOpacity>
            ))}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  bottomSheetContainer: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    marginTop: 12,
    marginBottom: 12,
  },
  bodyInput: {
    height: 100,
    textAlignVertical: "top",
    marginBottom: 24,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deviceInfo: {
    fontSize: 14,
    color: "#666",
  },
});
