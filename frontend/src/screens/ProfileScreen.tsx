import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { ThemeMode, useTheme } from "../context/ThemeContext";

const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { mode, setMode, colors, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  const themeOptions: { key: ThemeMode; label: string; icon: string }[] = [
    { key: "light", label: "Claro", icon: "white-balance-sunny" },
    { key: "dark", label: "Oscuro", icon: "moon-waning-crescent" },
    { key: "system", label: "Sistema", icon: "cellphone" },
  ];

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // Aquí se integraría con el servicio de actualización de perfil
      // await authService.updateProfile({ name, email, phone });
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        onPress: () => {},
      },
      {
        text: "Cerrar Sesión",
        onPress: async () => {
          try {
            setLoading(true);
            await signOut();
          } catch (error) {
            Alert.alert("Error", "No se pudo cerrar sesión");
          } finally {
            setLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Mi Perfil
        </Text>
      </View>

      <View style={styles.content}>
        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isDark ? "#2A3A50" : "#f0f0f0" },
            ]}
          >
            <MaterialCommunityIcons
              name="account"
              size={64}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textTertiary }]}>
            {user?.email}
          </Text>
        </View>

        {/* Profile Info */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Información Personal
            </Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Nombre"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Teléfono"
                placeholderTextColor={colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { backgroundColor: colors.border },
                  ]}
                  onPress={() => setIsEditing(false)}
                  disabled={loading}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: colors.text }]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Nombre
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.name}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Email
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.email}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Teléfono
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.phone || "No registrado"}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Miembro desde
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {new Date(user?.createdAt || "").toLocaleDateString("es-AR")}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Stats */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Estadísticas
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={28}
                color={colors.warning}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                125.5
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                kWh Cargados
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="cash"
                size={28}
                color={colors.success}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                $312
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Gastados
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="counter"
                size={28}
                color={colors.primary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>8</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Cargas
              </Text>
            </View>
          </View>
        </View>

        {/* Theme Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Apariencia
          </Text>
          <View style={styles.themeSelector}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      mode === option.key
                        ? isDark
                          ? "#1A3A5C"
                          : "#E3F2FD"
                        : colors.inputBg,
                    borderColor:
                      mode === option.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setMode(option.key)}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={24}
                  color={
                    mode === option.key ? colors.primary : colors.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color:
                        mode === option.key
                          ? colors.primary
                          : colors.textSecondary,
                      fontWeight: mode === option.key ? "700" : "500",
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {mode === option.key && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Preferencias
          </Text>

          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="bell"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notificaciones
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="lock"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Seguridad
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="help-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Ayuda
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.card, borderColor: colors.danger },
          ]}
          onPress={handleSignOut}
          disabled={loading}
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={colors.danger}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.logoutButtonText, { color: colors.danger }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingTitle: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f44336",
  },
  logoutButtonText: {
    color: "#f44336",
    fontWeight: "600",
  },
  themeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 12,
  },
  spacer: {
    height: 20,
  },
});

export default ProfileScreen;
