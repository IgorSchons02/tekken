import {
  FontSize,
  Radius,
  Shadows,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import {
  criarParticipante,
  criarPersonagensMultiplos,
  fetchPersonagens,
  Participante,
  Personagem,
} from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type TabMode = "personagens" | "participantes";

export default function CadastroScreen() {
  const [tab, setTab] = useState<TabMode>("personagens");
  const [personagens, setPersonagens] = useState<Personagem[]>([]);
  const [participantesCriados, setParticipantesCriados] = useState<Participante[]>([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [carregando, setCarregando] = useState(false);

  // Personagens form (multiplos)
  const [nomesPersonagens, setNomesPersonagens] = useState("");

  // Participante form
  const [nomeParticipante, setNomeParticipante] = useState("");

  const loadPersonagens = useCallback(async () => {
    try {
      const data = await fetchPersonagens();
      setPersonagens(data);
    } catch {
      // silently fail
    } finally {
      setLoadingChars(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPersonagens();
    }, [loadPersonagens])
  );

  // POST /personagens-multiplos
  const salvarPersonagens = async () => {
    const nomes = nomesPersonagens
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (nomes.length === 0) {
      Alert.alert("Erro", "Informe pelo menos um nome (um por linha).");
      return;
    }
    setCarregando(true);
    try {
      const criados = await criarPersonagensMultiplos(nomes);
      Alert.alert("Sucesso!", `${Array.isArray(criados) ? criados.length : nomes.length} personagem(ns) criado(s)!`);
      setNomesPersonagens("");
      loadPersonagens();
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Nao foi possivel criar os personagens.");
    } finally {
      setCarregando(false);
    }
  };

  // POST /participantes
  const salvarParticipante = async () => {
    if (!nomeParticipante.trim()) {
      Alert.alert("Erro", "Preencha o nome do participante!");
      return;
    }
    setCarregando(true);
    try {
      const created = await criarParticipante(nomeParticipante.trim());
      Alert.alert("Sucesso!", `Participante "${created.nome}" criado (ID: ${created.id})`);
      setParticipantesCriados((prev) => [...prev, created]);
      setNomeParticipante("");
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Nao foi possivel criar o participante.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: T.background }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="person-add" size={40} color={T.primary} />
          </View>
          <Text style={styles.titulo}>CADASTRO</Text>
          <Text style={styles.subtitulo}>
            Personagens e participantes para o torneio
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, tab === "personagens" && styles.tabButtonActive]}
            onPress={() => setTab("personagens")}
          >
            <MaterialIcons
              name="sports-martial-arts"
              size={18}
              color={tab === "personagens" ? T.text : T.textMuted}
            />
            <Text style={[styles.tabButtonText, tab === "personagens" && styles.tabButtonTextActive]}>
              PERSONAGENS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === "participantes" && styles.tabButtonActive]}
            onPress={() => setTab("participantes")}
          >
            <MaterialIcons
              name="person"
              size={18}
              color={tab === "participantes" ? T.text : T.textMuted}
            />
            <Text style={[styles.tabButtonText, tab === "participantes" && styles.tabButtonTextActive]}>
              PARTICIPANTES
            </Text>
          </TouchableOpacity>
        </View>

        {/* Personagens Tab */}
        {tab === "personagens" && (
          <View style={styles.form}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Criar Personagens em Massa</Text>
              <Text style={styles.formDescription}>
                Informe os nomes dos personagens, um por linha.
              </Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                placeholder={"Jin Kazama\nKazuya Mishima\nLars Alexandersson\nReina\nVictor Chevalier"}
                placeholderTextColor={T.textMuted}
                value={nomesPersonagens}
                onChangeText={setNomesPersonagens}
              />
              <TouchableOpacity
                style={[styles.botao, carregando && styles.botaoDisabled]}
                onPress={salvarPersonagens}
                disabled={carregando}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={carregando ? "hourglass-empty" : "add-circle"}
                  size={22}
                  color={T.text}
                />
                <Text style={styles.botaoTexto}>
                  {carregando ? "SALVANDO..." : "CRIAR PERSONAGENS"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lista de personagens existentes — GET /personagens */}
            <View style={styles.listSection}>
              <Text style={styles.listTitle}>
                PERSONAGENS CADASTRADOS ({personagens.length})
              </Text>
              {loadingChars ? (
                <ActivityIndicator size="small" color={T.primary} style={{ marginTop: Spacing.md }} />
              ) : personagens.length === 0 ? (
                <Text style={styles.listEmpty}>
                  Nenhum personagem cadastrado ainda
                </Text>
              ) : (
                <View style={styles.charGrid}>
                  {personagens.map((p) => (
                    <View key={p.id} style={styles.charChip}>
                      <Text style={styles.charChipId}>#{p.id}</Text>
                      <Text style={styles.charChipName}>{p.nome}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Participantes Tab */}
        {tab === "participantes" && (
          <View style={styles.form}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Cadastrar Participante</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={20} color={T.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nome do participante"
                  placeholderTextColor={T.textMuted}
                  value={nomeParticipante}
                  onChangeText={setNomeParticipante}
                />
              </View>

              {nomeParticipante.trim() && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>PRE-VISUALIZACAO</Text>
                  <View style={styles.previewContent}>
                    <View style={styles.previewAvatar}>
                      <Text style={styles.previewAvatarText}>
                        {nomeParticipante[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewNickname}>{nomeParticipante}</Text>
                      <Text style={styles.previewChar}>Novo participante</Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.botao, carregando && styles.botaoDisabled]}
                onPress={salvarParticipante}
                disabled={carregando}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={carregando ? "hourglass-empty" : "how-to-reg"}
                  size={22}
                  color={T.text}
                />
                <Text style={styles.botaoTexto}>
                  {carregando ? "SALVANDO..." : "CRIAR PARTICIPANTE"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Participantes criados na sessao */}
            {participantesCriados.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>
                  CRIADOS NESTA SESSAO ({participantesCriados.length})
                </Text>
                <View style={styles.charGrid}>
                  {participantesCriados.map((p) => (
                    <View key={p.id} style={styles.charChip}>
                      <Text style={styles.charChipId}>#{p.id}</Text>
                      <Text style={styles.charChipName}>{p.nome}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingVertical: 60, paddingHorizontal: Spacing.md },

  // Header
  header: { alignItems: "center", marginBottom: Spacing.lg },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.card, borderWidth: 2, borderColor: T.primary,
    justifyContent: "center", alignItems: "center", marginBottom: Spacing.md,
    ...Shadows.glow,
  },
  titulo: { fontSize: FontSize.xxl, fontWeight: "900", color: T.text, letterSpacing: 3 },
  subtitulo: { fontSize: FontSize.md, color: T.textMuted, marginTop: Spacing.xs, textAlign: "center" },

  // Tab
  tabRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  tabButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.xs, paddingVertical: Spacing.sm + 4, borderRadius: Radius.md,
    backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
  },
  tabButtonActive: { backgroundColor: T.primary, borderColor: T.primary },
  tabButtonText: { fontSize: FontSize.xs, fontWeight: "700", color: T.textMuted, letterSpacing: 1 },
  tabButtonTextActive: { color: T.text },

  // Form
  form: { gap: Spacing.lg },
  formCard: {
    backgroundColor: T.card, borderRadius: Radius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: T.border, gap: Spacing.sm,
  },
  formTitle: { fontSize: FontSize.lg, fontWeight: "700", color: T.text },
  formDescription: { fontSize: FontSize.sm, color: T.textSecondary, marginBottom: Spacing.xs },
  endpointHint: { color: T.textMuted, fontSize: FontSize.xs, fontFamily: "monospace" },

  textArea: {
    backgroundColor: T.backgroundLight, borderRadius: Radius.sm, padding: Spacing.md,
    color: T.text, fontSize: FontSize.md, minHeight: 120, textAlignVertical: "top",
    borderWidth: 1, borderColor: T.border,
  },

  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.backgroundLight, borderRadius: Radius.md,
    borderWidth: 1, borderColor: T.border, overflow: "hidden",
  },
  inputIcon: { paddingLeft: Spacing.md },
  input: { flex: 1, padding: Spacing.md, fontSize: FontSize.base, color: T.text },

  // Preview
  previewCard: {
    backgroundColor: T.backgroundLight, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: T.primary + "40",
  },
  previewLabel: { fontSize: FontSize.xs, color: T.textMuted, letterSpacing: 2, fontWeight: "700", marginBottom: Spacing.sm },
  previewContent: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  previewAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: T.primary,
    justifyContent: "center", alignItems: "center",
  },
  previewAvatarText: { fontSize: FontSize.xl, fontWeight: "900", color: T.text },
  previewInfo: { flex: 1 },
  previewNickname: { fontSize: FontSize.lg, fontWeight: "700", color: T.text },
  previewChar: { fontSize: FontSize.sm, color: T.textMuted },

  // Button
  botao: {
    flexDirection: "row", backgroundColor: T.primary, padding: Spacing.md + 2,
    borderRadius: Radius.md, alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, ...Shadows.md,
  },
  botaoDisabled: { opacity: 0.5 },
  botaoTexto: { color: T.text, fontWeight: "900", fontSize: FontSize.base, letterSpacing: 1 },

  // List
  listSection: {
    backgroundColor: T.card, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: T.border,
  },
  listTitle: { fontSize: FontSize.xs, fontWeight: "700", color: T.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  listEmpty: { fontSize: FontSize.md, color: T.textMuted, textAlign: "center", paddingVertical: Spacing.lg },
  charGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  charChip: {
    flexDirection: "row", alignItems: "center", gap: Spacing.xs,
    backgroundColor: T.backgroundLight, paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2, borderRadius: Radius.full,
    borderWidth: 1, borderColor: T.border,
  },
  charChipId: { fontSize: FontSize.xs, color: T.primary, fontWeight: "700" },
  charChipName: { fontSize: FontSize.sm, color: T.text, fontWeight: "600" },
});
