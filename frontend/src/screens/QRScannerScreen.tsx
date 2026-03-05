import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const QR_SIZE = width * 0.7;

const QRScannerScreen = ({ navigation, route }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scannedRef = useRef(false);
  const cameraRef = useRef<any>(null);

  // Solicitar permisos al montar el componente
  useEffect(() => {
    if (permission === null) {
      // Still loading
      return;
    }

    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Limpiar estado cuando se va
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      scannedRef.current = false;
      setScanned(false);
    });

    return unsubscribe;
  }, [navigation]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <MaterialCommunityIcons
            name="camera"
            size={64}
            color="#1E90FF"
            style={styles.icon}
          />
          <Text style={styles.title}>Permiso de Cámara Requerido</Text>
          <Text style={styles.description}>
            Necesitamos acceso a tu cámara para escanear códigos QR en
            cargadores.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Otorgar Permiso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: any) => {
    if (scannedRef.current) return;

    scannedRef.current = true;
    setScanned(true);

    try {
      if (!data || typeof data !== "string" || data.trim().length === 0) {
        Alert.alert("QR Inválido", "El código QR no contiene datos válidos");
        scannedRef.current = false;
        setScanned(false);
        return;
      }

      const charger = route.params?.charger;
      const chargerId = route.params?.chargerId || `qr_${Date.now()}`;

      navigation.navigate("ChargingDetail", {
        charger,
        chargerId,
        qrScanned: true,
        scannedQRData: data,
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo procesar el código QR");
      scannedRef.current = false;
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera fills the entire container */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        ref={cameraRef}
        facing="back"
        autofocus="on"
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Overlay positioned absolutely on top */}
      <View
        style={[StyleSheet.absoluteFillObject, styles.overlay]}
        pointerEvents="none"
      >
        <View style={styles.topOverlay} />
        <View style={styles.middleContainer}>
          <View style={styles.sideOverlay} />
          <View style={[styles.frame, { width: QR_SIZE, height: QR_SIZE }]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          <Text style={styles.text}>Alinea el código QR dentro del marco</Text>
        </View>
      </View>

      {/* Buttons on top */}
      {scanned && (
        <TouchableOpacity
          style={styles.rescalButton}
          onPress={() => {
            scannedRef.current = false;
            setScanned(false);
          }}
        >
          <Text style={styles.rescalButtonText}>Escanear de Nuevo</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  overlay: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  topOverlay: {
    flex: 0.2,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomOverlay: {
    flex: 0.2,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
  },
  middleContainer: {
    flex: 0.6,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  frame: {
    borderColor: "#1E90FF",
    borderWidth: 2,
    justifyContent: "space-between",
    alignItems: "space-between",
  },
  corner: {
    width: 30,
    height: 30,
    borderColor: "#1E90FF",
    borderWidth: 3,
    position: "absolute",
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 20,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 12,
    borderRadius: 24,
  },
  rescalButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#1E90FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  rescalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default QRScannerScreen;
