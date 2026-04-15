import {
  FontSize,
  Radius,
  Shadows,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import {
  BracketParticipante,
  criarTorneio,
  fetchParticipantesTorneio,
  fetchPersonagens,
  fetchPersonagensTorneio,
  fetchTorneios,
  gerarBracket,
  Participante,
  Personagem,
  Torneio,
} from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [selectedTorneio, setSelectedTorneio] = useState<Torneio | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Detail data
  const [participantesTorneio, setParticipantesTorneio] = useState<Participante[]>([]);
  const [personagensTorneio, setPersonagensTorneio] = useState<Personagem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const t = await fetchTorneios();
      setTorneios(t);
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

  const handleOpenDetail = async (torneio: Torneio) => {
    setSelectedTorneio(torneio);
    setShowDetail(true);
    setLoadingDetail(true);
    try {
      const [p, c] = await Promise.all([
        fetchParticipantesTorneio(torneio.id).catch(() => [] as Participante[]),
        fetchPersonagensTorneio(torneio.id).catch(() => [] as Personagem[]),
      ]);
      setParticipantesTorneio(p);
      setPersonagensTorneio(c);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  // Detail view
  if (showDetail && selectedTorneio) {
    const t = selectedTorneio;
    const inicio = new Date(t.data_inicio);
    const fim = new Date(t.data_final);

    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => handleOpenDetail(t)}
              tintColor={T.primary}
            />
          }
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { setShowDetail(false); setSelectedTorneio(null); }}
          >
            <MaterialIcons name="arrow-back" size={20} color={T.primary} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>{t.titulo}</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="calendar-today" size={16} color={T.textMuted} />
              <Text style={styles.detailValue}>
                {inicio.toLocaleDateString("pt-BR")} - {fim.toLocaleDateString("pt-BR")}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="paid" size={16} color={T.secondary} />
              <Text style={[styles.detailValue, { color: T.secondary, fontWeight: "700" }]}>
                R$ {t.premio.toLocaleString("pt-BR")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bracketActionBtn}
            onPress={() => setShowBracketModal(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-tree" size={20} color={T.text} />
            <Text style={styles.bracketActionBtnText}>GERAR BRACKET</Text>
          </TouchableOpacity>

          {loadingDetail ? (
            <ActivityIndicator size="small" color={T.primary} style={{ marginTop: Spacing.lg }} />
          ) : (
            <>
              {/* Participantes do torneio — GET /torneios/:id/participantes */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  PARTICIPANTES ({participantesTorneio.length})
                </Text>
                {participantesTorneio.length === 0 ? (
                  <Text style={styles.detailEmpty}>Nenhum participante (bracket nao gerado)</Text>
                ) : (
                  participantesTorneio.map((p) => (
                    <View key={p.id} style={styles.detailListItem}>
                      <Text style={styles.detailListId}>#{p.id}</Text>
                      <Text style={styles.detailListName}>{p.nome}</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Personagens do torneio — GET /torneios/:id/personagens */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  PERSONAGENS ({personagensTorneio.length})
                </Text>
                {personagensTorneio.length === 0 ? (
                  <Text style={styles.detailEmpty}>Nenhum personagem neste torneio</Text>
                ) : (
                  <View style={styles.charGrid}>
                    {personagensTorneio.map((p) => (
                      <View key={p.id} style={styles.charChip}>
                        <Text style={styles.charChipId}>#{p.id}</Text>
                        <Text style={styles.charChipName}>{p.nome}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Bracket Modal */}
        <GerarBracketModal
          visible={showBracketModal}
          torneio={t}
          onClose={() => setShowBracketModal(false)}
          onGenerated={() => {
            setShowBracketModal(false);
            handleOpenDetail(t);
            loadData();
          }}
        />
      </View>
    );
  }

  // List view
  return (
    <View style={styles.container}>
      <FlatList
        data={torneios}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
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
            onPress={() => handleOpenDetail(item)}
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
            <Text style={styles.emptySubtext}>Crie um torneio para comecar!</Text>
          </View>
        }
      />

      {/* Create Tournament Modal */}
      <CreateTorneioModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { setShowCreateModal(false); loadData(); }}
      />

      {/* Bracket Modal (from list) */}
      {selectedTorneio && !showDetail && (
        <GerarBracketModal
          visible={showBracketModal}
          torneio={selectedTorneio}
          onClose={() => { setShowBracketModal(false); setSelectedTorneio(null); }}
          onGenerated={() => { setShowBracketModal(false); setSelectedTorneio(null); loadData(); }}
        />
      )}
    </View>
  );
}

// ─── Torneio Card ────────────────────────────────────────

function TorneioCard({
  torneio,
  onPress,
  onGerarBracket,
}: {
  torneio: Torneio;
  onPress: () => void;
  onGerarBracket: () => void;
}) {
  const inicio = new Date(torneio.data_inicio);
  const fim = new Date(torneio.data_final);
  const now = new Date();
  const isActive = now >= inicio && now <= fim;
  const isPast = now > fim;

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{torneio.titulo}</Text>
          <Text style={styles.cardDate}>
            {inicio.toLocaleDateString("pt-BR")} - {fim.toLocaleDateString("pt-BR")}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isActive ? T.success + "20" : isPast ? T.textMuted + "20" : T.warning + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              { color: isActive ? T.success : isPast ? T.textMuted : T.warning },
            ]}
          >
            {isActive ? "ATIVO" : isPast ? "ENCERRADO" : "FUTURO"}
          </Text>
        </View>
      </View>

      <View style={styles.prizeRow}>
        <MaterialIcons name="paid" size={18} color={T.secondary} />
        <Text style={styles.prizeText}>R$ {torneio.premio.toLocaleString("pt-BR")}</Text>
      </View>

      <TouchableOpacity
        style={styles.bracketButton}
        onPress={(e) => { e.stopPropagation(); onGerarBracket(); }}
        activeOpacity={0.7}
      >
        <MaterialIcons name="account-tree" size={18} color={T.primary} />
        <Text style={styles.bracketButtonText}>GERAR BRACKET</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Create Tournament Modal — POST /torneios ───────────

function CreateTorneioModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  dayAfter.setHours(20, 0, 0, 0);

  const [titulo, setTitulo] = useState("");
  const [premio, setPremio] = useState("");
  const [dataInicio, setDataInicio] = useState(tomorrow);
  const [dataFinal, setDataFinal] = useState(dayAfter);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState<"inicio" | "final" | null>(null);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(null);
    if (event.type === "dismissed" || !selectedDate) return;

    if (showPicker === "inicio") {
      setDataInicio(selectedDate);
      if (selectedDate >= dataFinal) {
        const newFinal = new Date(selectedDate);
        newFinal.setDate(newFinal.getDate() + 1);
        setDataFinal(newFinal);
      }
    } else {
      setDataFinal(selectedDate);
    }
  };

  const handleCreate = async () => {
    if (!titulo || !premio) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }
    const now = new Date();
    if (dataInicio < now) {
      Alert.alert("Erro", "A data de inicio nao pode estar no passado");
      return;
    }
    if (dataFinal <= dataInicio) {
      Alert.alert("Erro", "A data final deve ser posterior a data de inicio");
      return;
    }
    setSaving(true);
    try {
      await criarTorneio({
        titulo,
        data_inicio: dataInicio.toISOString(),
        data_final: dataFinal.toISOString(),
        premio: Number(premio),
      });
      Alert.alert("Sucesso!", "Torneio criado com sucesso");
      setTitulo("");
      setPremio("");
      setDataInicio(tomorrow);
      setDataFinal(dayAfter);
      onCreated();
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Nao foi possivel criar o torneio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>NOVO TORNEIO</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={T.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>TITULO</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Campeonato Tekken 8" placeholderTextColor={T.textMuted} value={titulo} onChangeText={setTitulo} />

            <Text style={styles.fieldLabel}>PREMIO (R$)</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: 1000" placeholderTextColor={T.textMuted} keyboardType="numeric" value={premio} onChangeText={setPremio} />

            <Text style={styles.fieldLabel}>DATA INICIO</Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={dataInicio.toISOString().split("T")[0]}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const d = new Date(e.target.value + "T10:00:00");
                  if (!isNaN(d.getTime())) {
                    setDataInicio(d);
                    if (d >= dataFinal) {
                      const newFinal = new Date(d);
                      newFinal.setDate(newFinal.getDate() + 1);
                      setDataFinal(newFinal);
                    }
                  }
                }}
                style={{
                  backgroundColor: T.backgroundLight,
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 16,
                  width: "100%",
                  colorScheme: "dark",
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPicker("inicio")}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="calendar-today" size={20} color={T.primary} />
                  <Text style={styles.dateButtonText}>{formatDate(dataInicio)}</Text>
                  <MaterialIcons name="edit" size={16} color={T.textMuted} />
                </TouchableOpacity>
                {showPicker === "inicio" && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={dataInicio}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      minimumDate={new Date()}
                      onChange={handleDateChange}
                      themeVariant="dark"
                      accentColor={T.primary}
                    />
                    {Platform.OS === "ios" && (
                      <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowPicker(null)}>
                        <Text style={styles.pickerDoneText}>OK</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}

            <Text style={styles.fieldLabel}>DATA FINAL</Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={dataFinal.toISOString().split("T")[0]}
                min={new Date(dataInicio.getTime() + 86400000).toISOString().split("T")[0]}
                onChange={(e) => {
                  const d = new Date(e.target.value + "T20:00:00");
                  if (!isNaN(d.getTime())) setDataFinal(d);
                }}
                style={{
                  backgroundColor: T.backgroundLight,
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 16,
                  width: "100%",
                  colorScheme: "dark",
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPicker("final")}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="event" size={20} color={T.secondary} />
                  <Text style={styles.dateButtonText}>{formatDate(dataFinal)}</Text>
                  <MaterialIcons name="edit" size={16} color={T.textMuted} />
                </TouchableOpacity>
                {showPicker === "final" && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={dataFinal}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      minimumDate={new Date(dataInicio.getTime() + 86400000)}
                      onChange={handleDateChange}
                      themeVariant="dark"
                      accentColor={T.primary}
                    />
                    {Platform.OS === "ios" && (
                      <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowPicker(null)}>
                        <Text style={styles.pickerDoneText}>OK</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, saving && { opacity: 0.5 }]}
              onPress={handleCreate}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>{saving ? "CRIANDO..." : "CRIAR TORNEIO"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Generate Bracket Modal — POST /torneios/:id/gerar-bracket ──

interface BracketEntry {
  participanteId: string;
  personagemId: number | null;
}

function GerarBracketModal({
  visible,
  torneio,
  onClose,
  onGenerated,
}: {
  visible: boolean;
  torneio: Torneio;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [entries, setEntries] = useState<BracketEntry[]>([
    { participanteId: "", personagemId: null },
    { participanteId: "", personagemId: null },
  ]);
  const [personagens, setPersonagens] = useState<Personagem[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectingCharFor, setSelectingCharFor] = useState<number | null>(null);
  const [loadingChars, setLoadingChars] = useState(false);

  // Load personagens when modal opens
  React.useEffect(() => {
    if (visible) {
      setLoadingChars(true);
      fetchPersonagens()
        .then(setPersonagens)
        .catch(() => {})
        .finally(() => setLoadingChars(false));
    }
  }, [visible]);

  const addEntry = () => {
    setEntries([...entries, { participanteId: "", personagemId: null }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 2) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateId = (index: number, id: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], participanteId: id };
    setEntries(updated);
  };

  const selectChar = (index: number, personagemId: number) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], personagemId };
    setEntries(updated);
    setSelectingCharFor(null);
  };

  const handleGenerate = async () => {
    const invalid = entries.some((e) => !e.participanteId.trim() || !e.personagemId);
    if (invalid) {
      Alert.alert("Erro", "Preencha ID do participante e personagem de todos os jogadores");
      return;
    }

    setSaving(true);
    try {
      const bracketParticipantes: BracketParticipante[] = entries.map((e) => ({
        id: Number(e.participanteId),
        personagem_id: e.personagemId!,
      }));

      await gerarBracket(torneio.id, bracketParticipantes);
      Alert.alert("Sucesso!", "Bracket gerado com sucesso");
      setEntries([
        { participanteId: "", personagemId: null },
        { participanteId: "", personagemId: null },
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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

          {selectingCharFor !== null ? (
            <View style={styles.charSelectOverlay}>
              <Text style={styles.charSelectTitle}>ESCOLHA O PERSONAGEM</Text>
              {loadingChars ? (
                <ActivityIndicator size="small" color={T.primary} />
              ) : (
                <FlatList
                  data={personagens}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.charOption} onPress={() => selectChar(selectingCharFor, item.id)}>
                      <Text style={styles.charOptionId}>#{item.id}</Text>
                      <Text style={styles.charOptionText}>{item.nome}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
              <TouchableOpacity style={styles.charCancelButton} onPress={() => setSelectingCharFor(null)}>
                <Text style={styles.charCancelText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.bracketHint}>
                Informe o ID do participante (ja cadastrado) e selecione o personagem.
                Minimo 2 jogadores.
              </Text>

              {entries.map((entry, index) => (
                <View key={index} style={styles.entryRow}>
                  <View style={styles.entryNumber}>
                    <Text style={styles.entryNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.entryFields}>
                    <TextInput
                      style={styles.entryInput}
                      placeholder="ID do participante"
                      placeholderTextColor={T.textMuted}
                      keyboardType="numeric"
                      value={entry.participanteId}
                      onChangeText={(text) => updateId(index, text)}
                    />
                    <TouchableOpacity
                      style={styles.charSelectButton}
                      onPress={() => setSelectingCharFor(index)}
                    >
                      <MaterialIcons name="face" size={16} color={T.textMuted} />
                      <Text
                        style={[styles.charSelectText, entry.personagemId ? { color: T.text } : null]}
                        numberOfLines={1}
                      >
                        {getCharName(entry.personagemId)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {entries.length > 2 && (
                    <TouchableOpacity onPress={() => removeEntry(index)} style={styles.removeButton}>
                      <MaterialIcons name="close" size={18} color={T.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addEntryButton} onPress={addEntry}>
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
                <Text style={styles.submitButtonText}>{saving ? "GERANDO..." : "GERAR BRACKET"}</Text>
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
  container: { flex: 1, backgroundColor: T.background },
  content: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  center: { justifyContent: "center", alignItems: "center" },

  // Header
  header: { marginBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize.display, fontWeight: "900", color: T.text, letterSpacing: 4 },
  headerSubtitle: { fontSize: FontSize.md, color: T.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  endpointHint: { color: T.textMuted, fontSize: FontSize.xs, fontFamily: "monospace", marginTop: 2 },
  createButton: {
    flexDirection: "row", backgroundColor: T.primary, paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg, borderRadius: Radius.md, alignItems: "center",
    justifyContent: "center", gap: Spacing.sm, alignSelf: "flex-start", ...Shadows.md,
  },
  createButtonText: { color: T.text, fontWeight: "900", fontSize: FontSize.sm, letterSpacing: 1 },

  // Card
  card: {
    backgroundColor: T.card, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: T.border,
  },
  cardActive: { borderColor: T.success },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.lg, fontWeight: "700", color: T.text },
  cardDate: { fontSize: FontSize.sm, color: T.textMuted, marginTop: 2 },
  statusPill: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  statusPillText: { fontSize: FontSize.xs, fontWeight: "700", letterSpacing: 1 },
  prizeRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.md,
    backgroundColor: T.backgroundLight, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.sm,
  },
  prizeText: { fontSize: FontSize.lg, fontWeight: "700", color: T.secondary },
  bracketButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2, borderRadius: Radius.md, borderWidth: 1, borderColor: T.primary,
  },
  bracketButtonText: { fontSize: FontSize.sm, fontWeight: "700", color: T.primary, letterSpacing: 1 },

  // Empty
  empty: { alignItems: "center", paddingVertical: Spacing.xxl * 2, gap: Spacing.md },
  emptyText: { fontSize: FontSize.lg, color: T.textMuted, fontWeight: "600" },
  emptySubtext: { fontSize: FontSize.md, color: T.textMuted },

  // Back button
  backBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.md },
  backText: { color: T.primary, fontSize: FontSize.md, fontWeight: "600" },

  // Detail
  detailCard: {
    backgroundColor: T.card, borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: T.border,
  },
  detailTitle: { fontSize: FontSize.xl, fontWeight: "900", color: T.text, marginBottom: Spacing.md },
  detailRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  detailValue: { color: T.text, fontSize: FontSize.md },
  bracketActionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: T.accent, borderRadius: Radius.md, padding: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.lg, ...Shadows.md,
  },
  bracketActionBtnText: { color: T.text, fontSize: FontSize.base, fontWeight: "900", letterSpacing: 1 },
  detailSection: {
    backgroundColor: T.card, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: T.border,
  },
  detailSectionTitle: { fontSize: FontSize.xs, fontWeight: "700", color: T.textMuted, letterSpacing: 2, marginBottom: Spacing.xs },
  detailEmpty: { color: T.textMuted, fontSize: FontSize.md, textAlign: "center", paddingVertical: Spacing.md },
  detailListItem: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  detailListId: { color: T.primary, fontSize: FontSize.sm, fontFamily: "monospace", fontWeight: "700" },
  detailListName: { color: T.text, fontSize: FontSize.md, flex: 1 },
  charGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  charChip: {
    flexDirection: "row", alignItems: "center", gap: Spacing.xs,
    backgroundColor: T.backgroundLight, paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2, borderRadius: Radius.full,
    borderWidth: 1, borderColor: T.border,
  },
  charChipId: { fontSize: FontSize.xs, color: T.primary, fontWeight: "700" },
  charChipName: { fontSize: FontSize.sm, color: T.text, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: T.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: "80%" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: "900", color: T.text, letterSpacing: 2 },
  modalSubtitle: { fontSize: FontSize.sm, color: T.textMuted, marginTop: 2 },
  modalBody: { padding: Spacing.lg },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: "700", color: T.textMuted, letterSpacing: 2, marginBottom: Spacing.xs, marginTop: Spacing.md },
  modalInput: {
    backgroundColor: T.backgroundLight, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: FontSize.base, color: T.text, borderWidth: 1, borderColor: T.border,
  },
  submitButton: {
    flexDirection: "row", backgroundColor: T.primary, paddingVertical: Spacing.md,
    borderRadius: Radius.md, alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.md,
  },
  submitButtonText: { color: T.text, fontWeight: "900", fontSize: FontSize.base, letterSpacing: 1 },

  // Date picker
  dateButton: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: T.backgroundLight, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: T.border,
  },
  dateButtonText: { flex: 1, fontSize: FontSize.base, color: T.text, fontWeight: "600" },
  pickerContainer: {
    backgroundColor: T.backgroundLight, borderRadius: Radius.md,
    marginTop: Spacing.xs, overflow: "hidden", borderWidth: 1, borderColor: T.border,
  },
  pickerDoneBtn: {
    alignItems: "center", paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  pickerDoneText: { color: T.primary, fontWeight: "700", fontSize: FontSize.md, letterSpacing: 1 },

  // Bracket modal
  bracketHint: { fontSize: FontSize.sm, color: T.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  entryRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md, gap: Spacing.sm },
  entryNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.backgroundLight, justifyContent: "center", alignItems: "center" },
  entryNumberText: { fontSize: FontSize.sm, fontWeight: "700", color: T.textMuted },
  entryFields: { flex: 1, gap: Spacing.xs },
  entryInput: {
    backgroundColor: T.backgroundLight, borderRadius: Radius.sm, padding: Spacing.sm + 2,
    fontSize: FontSize.md, color: T.text, borderWidth: 1, borderColor: T.border,
  },
  charSelectButton: {
    flexDirection: "row", alignItems: "center", gap: Spacing.xs,
    backgroundColor: T.backgroundLight, borderRadius: Radius.sm, padding: Spacing.sm + 2,
    borderWidth: 1, borderColor: T.border,
  },
  charSelectText: { fontSize: FontSize.sm, color: T.textMuted, flex: 1 },
  removeButton: { padding: Spacing.xs },
  addEntryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, paddingVertical: Spacing.sm + 4, borderRadius: Radius.md,
    borderWidth: 1, borderColor: T.primary + "40", borderStyle: "dashed",
  },
  addEntryText: { fontSize: FontSize.sm, fontWeight: "700", color: T.primary, letterSpacing: 1 },

  // Char select overlay
  charSelectOverlay: { flex: 1, padding: Spacing.lg },
  charSelectTitle: { fontSize: FontSize.sm, fontWeight: "700", color: T.textMuted, letterSpacing: 2, marginBottom: Spacing.md },
  charOption: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  charOptionId: { fontSize: FontSize.xs, color: T.primary, fontWeight: "700", fontFamily: "monospace" },
  charOptionText: { fontSize: FontSize.base, color: T.text },
  charCancelButton: { paddingVertical: Spacing.md, alignItems: "center", marginTop: Spacing.sm },
  charCancelText: { fontSize: FontSize.sm, fontWeight: "700", color: T.textMuted, letterSpacing: 1 },
});
