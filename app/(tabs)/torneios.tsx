import {
  FontSize,
  Radius,
  Shadows,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import {
  BracketParticipante,
  criarParticipante,
  criarTorneio,
  fetchPersonagens,
  fetchTorneios,
  gerarBracket,
  Participante,
  Personagem,
  Torneio,
} from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TorneiosScreen() {
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [personagens, setPersonagens] = useState<Personagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [selectedTorneio, setSelectedTorneio] = useState<Torneio | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([fetchTorneios(), fetchPersonagens()]);
      setTorneios(t);
      setPersonagens(p);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={torneios}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={T.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>TORNEIOS</Text>
            <Text style={styles.headerSubtitle}>
              Gerencie os torneios do campeonato
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color={T.text} />
              <Text style={styles.createButtonText}>NOVO TORNEIO</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TorneioCard
            torneio={item}
            onGerarBracket={() => {
              setSelectedTorneio(item);
              setShowBracketModal(true);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="emoji-events" size={64} color={T.textMuted} />
            <Text style={styles.emptyText}>Nenhum torneio criado ainda</Text>
            <Text style={styles.emptySubtext}>
              Crie um torneio para comecar!
            </Text>
          </View>
        }
      />

      {/* Create Tournament Modal */}
      <CreateTorneioModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          loadData();
        }}
      />

      {/* Generate Bracket Modal */}
      {selectedTorneio && (
        <GerarBracketModal
          visible={showBracketModal}
          torneio={selectedTorneio}
          personagens={personagens}
          onClose={() => {
            setShowBracketModal(false);
            setSelectedTorneio(null);
          }}
          onGenerated={() => {
            setShowBracketModal(false);
            setSelectedTorneio(null);
            loadData();
          }}
        />
      )}
    </View>
  );
}

// ─── Torneio Card ────────────────────────────────────────

function TorneioCard({
  torneio,
  onGerarBracket,
}: {
  torneio: Torneio;
  onGerarBracket: () => void;
}) {
  const inicio = new Date(torneio.data_inicio);
  const fim = new Date(torneio.data_final);
  const now = new Date();
  const isActive = now >= inicio && now <= fim;
  const isPast = now > fim;

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{torneio.titulo}</Text>
          <Text style={styles.cardDate}>
            {inicio.toLocaleDateString("pt-BR")} -{" "}
            {fim.toLocaleDateString("pt-BR")}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isActive
                ? T.success + "20"
                : isPast
                  ? T.textMuted + "20"
                  : T.warning + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              {
                color: isActive ? T.success : isPast ? T.textMuted : T.warning,
              },
            ]}
          >
            {isActive ? "ATIVO" : isPast ? "ENCERRADO" : "FUTURO"}
          </Text>
        </View>
      </View>

      <View style={styles.prizeRow}>
        <MaterialIcons name="paid" size={18} color={T.secondary} />
        <Text style={styles.prizeText}>
          R$ {torneio.premio.toLocaleString("pt-BR")}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.bracketButton}
        onPress={onGerarBracket}
        activeOpacity={0.7}
      >
        <MaterialIcons name="account-tree" size={18} color={T.primary} />
        <Text style={styles.bracketButtonText}>GERAR BRACKET</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Create Tournament Modal ─────────────────────────────

function CreateTorneioModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [premio, setPremio] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!titulo || !premio || !dataInicio || !dataFinal) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    setSaving(true);
    try {
      await criarTorneio({
        titulo,
        data_inicio: new Date(dataInicio).toISOString(),
        data_final: new Date(dataFinal).toISOString(),
        premio: Number(premio),
      });
      Alert.alert("Sucesso!", "Torneio criado com sucesso");
      setTitulo("");
      setPremio("");
      setDataInicio("");
      setDataFinal("");
      onCreated();
    } catch {
      Alert.alert("Erro", "Nao foi possivel criar o torneio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>NOVO TORNEIO</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={T.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>TITULO</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Campeonato Tekken 8"
              placeholderTextColor={T.textMuted}
              value={titulo}
              onChangeText={setTitulo}
            />

            <Text style={styles.fieldLabel}>PREMIO (R$)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 1000"
              placeholderTextColor={T.textMuted}
              keyboardType="numeric"
              value={premio}
              onChangeText={setPremio}
            />

            <Text style={styles.fieldLabel}>DATA INICIO (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 2026-04-10"
              placeholderTextColor={T.textMuted}
              value={dataInicio}
              onChangeText={setDataInicio}
            />

            <Text style={styles.fieldLabel}>DATA FINAL (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 2026-04-20"
              placeholderTextColor={T.textMuted}
              value={dataFinal}
              onChangeText={setDataFinal}
            />

            <TouchableOpacity
              style={[styles.submitButton, saving && { opacity: 0.5 }]}
              onPress={handleCreate}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {saving ? "CRIANDO..." : "CRIAR TORNEIO"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Generate Bracket Modal ──────────────────────────────

interface BracketEntry {
  participanteNome: string;
  personagemId: number | null;
}

function GerarBracketModal({
  visible,
  torneio,
  personagens,
  onClose,
  onGenerated,
}: {
  visible: boolean;
  torneio: Torneio;
  personagens: Personagem[];
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [entries, setEntries] = useState<BracketEntry[]>([
    { participanteNome: "", personagemId: null },
    { participanteNome: "", personagemId: null },
  ]);
  const [saving, setSaving] = useState(false);
  const [selectingCharFor, setSelectingCharFor] = useState<number | null>(null);

  const addEntry = () => {
    setEntries([...entries, { participanteNome: "", personagemId: null }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 2) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateName = (index: number, nome: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], participanteNome: nome };
    setEntries(updated);
  };

  const selectChar = (index: number, personagemId: number) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], personagemId };
    setEntries(updated);
    setSelectingCharFor(null);
  };

  const handleGenerate = async () => {
    const invalid = entries.some(
      (e) => !e.participanteNome.trim() || !e.personagemId
    );
    if (invalid) {
      Alert.alert("Erro", "Preencha nome e personagem de todos os participantes");
      return;
    }

    setSaving(true);
    try {
      // Create participants first, then generate bracket
      const createdParticipants: Participante[] = [];
      for (const entry of entries) {
        const p = await criarParticipante(entry.participanteNome.trim());
        createdParticipants.push(p);
      }

      const bracketParticipantes: BracketParticipante[] =
        createdParticipants.map((p, i) => ({
          id: p.id,
          personagem_id: entries[i].personagemId!,
        }));

      await gerarBracket(torneio.id, bracketParticipantes);
      Alert.alert("Sucesso!", "Bracket gerado com sucesso");
      setEntries([
        { participanteNome: "", personagemId: null },
        { participanteNome: "", personagemId: null },
      ]);
      onGenerated();
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Nao foi possivel gerar o bracket");
    } finally {
      setSaving(false);
    }
  };

  const getCharName = (id: number | null) => {
    if (!id) return "Selecionar";
    return personagens.find((p) => p.id === id)?.nome || "???";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { maxHeight: "90%" }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>GERAR BRACKET</Text>
              <Text style={styles.modalSubtitle}>{torneio.titulo}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={T.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Character selection overlay */}
          {selectingCharFor !== null ? (
            <View style={styles.charSelectOverlay}>
              <Text style={styles.charSelectTitle}>ESCOLHA O PERSONAGEM</Text>
              <FlatList
                data={personagens}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.charOption}
                    onPress={() => selectChar(selectingCharFor, item.id)}
                  >
                    <Text style={styles.charOptionText}>{item.nome}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.charCancelButton}
                onPress={() => setSelectingCharFor(null)}
              >
                <Text style={styles.charCancelText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.bracketHint}>
                Minimo 2 participantes. Adicione jogadores e selecione seus
                personagens.
              </Text>

              {entries.map((entry, index) => (
                <View key={index} style={styles.entryRow}>
                  <View style={styles.entryNumber}>
                    <Text style={styles.entryNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.entryFields}>
                    <TextInput
                      style={styles.entryInput}
                      placeholder="Nome do jogador"
                      placeholderTextColor={T.textMuted}
                      value={entry.participanteNome}
                      onChangeText={(text) => updateName(index, text)}
                    />
                    <TouchableOpacity
                      style={styles.charSelectButton}
                      onPress={() => setSelectingCharFor(index)}
                    >
                      <MaterialIcons name="face" size={16} color={T.textMuted} />
                      <Text
                        style={[
                          styles.charSelectText,
                          entry.personagemId ? { color: T.text } : null,
                        ]}
                        numberOfLines={1}
                      >
                        {getCharName(entry.personagemId)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {entries.length > 2 && (
                    <TouchableOpacity
                      onPress={() => removeEntry(index)}
                      style={styles.removeButton}
                    >
                      <MaterialIcons name="close" size={18} color={T.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addEntryButton}
                onPress={addEntry}
              >
                <MaterialIcons name="add" size={20} color={T.primary} />
                <Text style={styles.addEntryText}>ADICIONAR JOGADOR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, saving && { opacity: 0.5 }]}
                onPress={handleGenerate}
                disabled={saving}
                activeOpacity={0.8}
              >
                <MaterialIcons name="account-tree" size={20} color={T.text} />
                <Text style={styles.submitButtonText}>
                  {saving ? "GERANDO..." : "GERAR BRACKET"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.display,
    fontWeight: "900",
    color: T.text,
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: FontSize.md,
    color: T.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  createButton: {
    flexDirection: "row",
    backgroundColor: T.primary,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    alignSelf: "flex-start",
    ...Shadows.md,
  },
  createButtonText: {
    color: T.text,
    fontWeight: "900",
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },

  // Card
  card: {
    backgroundColor: T.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardActive: {
    borderColor: T.success,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: T.text,
  },
  cardDate: {
    fontSize: FontSize.sm,
    color: T.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
  },
  prizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    backgroundColor: T.backgroundLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  prizeText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: T.secondary,
  },
  bracketButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: T.primary,
  },
  bracketButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: T.primary,
    letterSpacing: 1,
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: T.textMuted,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: FontSize.md,
    color: T.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: T.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: T.text,
    letterSpacing: 2,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: T.textMuted,
    marginTop: 2,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: T.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  modalInput: {
    backgroundColor: T.backgroundLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: T.text,
    borderWidth: 1,
    borderColor: T.border,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: T.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  submitButtonText: {
    color: T.text,
    fontWeight: "900",
    fontSize: FontSize.base,
    letterSpacing: 1,
  },

  // Bracket modal
  bracketHint: {
    fontSize: FontSize.sm,
    color: T.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  entryNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  entryNumberText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: T.textMuted,
  },
  entryFields: {
    flex: 1,
    gap: Spacing.xs,
  },
  entryInput: {
    backgroundColor: T.backgroundLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: T.text,
    borderWidth: 1,
    borderColor: T.border,
  },
  charSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: T.backgroundLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: T.border,
  },
  charSelectText: {
    fontSize: FontSize.sm,
    color: T.textMuted,
    flex: 1,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  addEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: T.primary + "40",
    borderStyle: "dashed",
  },
  addEntryText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: T.primary,
    letterSpacing: 1,
  },

  // Character select overlay
  charSelectOverlay: {
    flex: 1,
    padding: Spacing.lg,
  },
  charSelectTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: T.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  charOption: {
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  charOptionText: {
    fontSize: FontSize.base,
    color: T.text,
  },
  charCancelButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  charCancelText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: T.textMuted,
    letterSpacing: 1,
  },
});
