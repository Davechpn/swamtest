import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useNotification } from "@/context/notifications";
import {
  Button,
  Text,
  TextInput,
  Divider,
  ActivityIndicator,
} from "react-native-paper";

export default function HomeScreen() {
  const router = useRouter();
  const { notification, expoPushToken, error } = useNotification();
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function extractToken(pushToken: string) {
    const match = pushToken.match(/\[(.*?)\]/);
    return match ? match[1] : null;
  }

  function handleSubmit() {
    let updatedData = { ...deviceInfo, userName };
    sendDeviceInfo(updatedData);
  }

  async function sendDeviceInfo(data: any) {
    setLoading(true); // Start loading
    try {
      const response = await fetch(
        "https://us-central1-starfish-e7a17.cloudfunctions.net/sendMessage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Success:", result.message);

        if (result.deviceInfo?.userName && !isSent) {
          setUserName(result.deviceInfo.userName);
        }

        setIsSent(true);
      } else {
        console.error("Failed to send device info");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (expoPushToken && !isSent) {
      const deviceData = {
        pushToken: expoPushToken,
        deviceId: extractToken(expoPushToken),
        brand: Device.brand,
        deviceName: Device.modelName,
        userName: userName || undefined,
      };
      setDeviceInfo(deviceData);
      sendDeviceInfo(deviceData);
    }
  }, [expoPushToken]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/bg1.jpg")}
          style={styles.logo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Swarm Test </ThemedText>
      </ThemedView>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Enter your name (optional)</Text>
        <TextInput
          placeholder="Your Name"
          value={userName}
          mode="outlined"
          onChangeText={(text) => {
            setUserName(text);
            setIsSent(false);
          }}
        />

        <Button
          mode="contained"
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator animating={true} color="white" />
          ) : (
            "Submit"
          )}
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="contained"
          style={styles.button}
          onPress={() => router.push("/map")}
        >
          View Map
        </Button>

        <Button
          mode="contained"
          style={styles.button}
          onPress={() => router.push("/notifications")}
        >
          Test Notifications
        </Button>
      </View>

      <Text style={styles.label}>Latest notification:</Text>
      {notification?.request.content && (
        <View>
          <ThemedText style={styles.notif}>
            Title: {notification?.request.content.title}
          </ThemedText>
          <ThemedText style={styles.notif}>
            Body: {notification?.request.content.body}
          </ThemedText>
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputContainer: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  divider: {
    marginBottom: 12,
    marginTop: 24,
  },
  button: {
    marginTop: 12,
  },
  notif: {
    fontSize: 12,
    marginLeft: 12,
  },
  logo: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
