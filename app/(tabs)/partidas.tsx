import {
  FontSize,
  Radius,
  Shadows,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import {
  atualizarVencedor,
  fetchPartidas,
  fetchTorneios,
  Partida,
  sortPartidas,
  Torneio,
} from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATUS_FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "em_andamento", label: "Ao Vivo" },
  { key: "pendente", label: "Pendentes" },
  { key: "aguardando", label: "Aguardando" },
  { key: "concluido", label: "Finalizados" },
];

const FASES = [
  "Todas",
  "Final",
  "Semifinal",
  "Quartas de Final",
  "Oitavas de Final",
  "Repescagem",
  "Disputa de 3º Lugar",
];

export default function PartidasScreen() {
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [selectedTorneio, setSelectedTorneio] = useState<Torneio | null>(null);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPartidas, setLoadingPartidas] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [faseFilter, setFaseFilter] = useState("Todas");

  const loadTorneios = useCallback(async () => {
    try {
      const data = await fetchTorneios();
      setTorneios(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!selectedTorneio) loadTorneios();
    }, [loadTorneios, selectedTorneio])
  );

  const loadPartidas = useCallback(async (torneioId: number) => {
    setLoadingPartidas(true);
    try {
      const data = await fetchPartidas(torneioId);
      setPartidas(sortPartidas(data));
    } catch (e: any) {
      Alert.alert("Erro", e.message);
      setPartidas([]);
    } finally {
      setLoadingPartidas(false);
      setRefreshing(false);
    }
  }, []);

  const handleSelectTorneio = (torneio: Torneio) => {
    setSelectedTorneio(torneio);
    setStatusFilter("todos");
    setFaseFilter("Todas");
    loadPartidas(torneio.id);
  };

  const handleSetVencedor = async (partida: Partida, jogador: typeof partida.jogador1) => {
    const confirmado = Platform.OS === "web"
      ? window.confirm(`Deseja definir ${jogador.nickname} como vencedor desta partida?`)
      : await new Promise<boolean>((resolve) =>
          Alert.alert(
            "Confirmar Vencedor",
            `Deseja definir ${jogador.nickname} como vencedor desta partida?`,
            [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Confirmar", onPress: () => resolve(true) },
            ]
          )
        );

    if (!confirmado) return;

    try {
      await atualizarVencedor(partida.id, jogador.id);
      if (Platform.OS === "web") {
        window.alert(`${jogador.nickname} definido como vencedor!`);
      } else {
        Alert.alert("Sucesso!", `${jogador.nickname} definido como vencedor!`);
      }
      if (selectedTorneio) loadPartidas(selectedTorneio.id);
    } catch (e: any) {
      if (Platform.OS === "web") {
        window.alert(`Erro: ${e.message}`);
      } else {
        Alert.alert("Erro", e.message);
      }
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pendente: { label: "PENDENTE", color: T.warning, icon: "schedule" },
    aguardando: { label: "AGUARDANDO", color: T.warning, icon: "schedule" },
    em_andamento: { label: "AO VIVO", color: T.info, icon: "play-circle-fill" },
    finalizado: { label: "FINALIZADO", color: T.success, icon: "check-circle" },
    concluido: { label: "FINALIZADO", color: T.success, icon: "check-circle" },
  };

  const filtered = partidas.filter((p) => {
    if (statusFilter !== "todos" && p.status !== statusFilter) return false;
    if (faseFilter !== "Todas" && p.fase !== faseFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  // Torneio selection screen
  if (!selectedTorneio) {
    return (
      <View style={styles.container}>
        <FlatList
          data={torneios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTorneios(); }} tintColor={T.primary} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>PARTIDAS</Text>
              <Text style={styles.headerSubtitle}>Selecione um torneio para ver as partidas</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.torneioItem} onPress={() => handleSelectTorneio(item)} activeOpacity={0.7}>
              <MaterialIcons name="emoji-events" size={22} color={T.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.torneioName}>{item.titulo}</Text>
                <Text style={styles.torneioDate}>{new Date(item.data_inicio).toLocaleDateString("pt-BR")}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={T.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="emoji-events" size={64} color={T.textMuted} />
              <Text style={styles.emptyText}>Nenhum torneio disponivel</Text>
            </View>
          }
        />
      </View>
    );
  }

  // Partidas view
  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadPartidas(selectedTorneio.id); }}
            tintColor={T.primary}
          />
        }
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { setSelectedTorneio(null); setPartidas([]); }}
            >
              <MaterialIcons name="arrow-back" size={20} color={T.primary} />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.headerTitle}>{selectedTorneio.titulo}</Text>
              <Text style={styles.headerSubtitle}>
                {partidas.length} confrontos no torneio
              </Text>
            </View>

            {/* Status Filter */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={STATUS_FILTERS}
              keyExtractor={(item) => item.key}
              style={styles.filterRow}
              contentContainerStyle={{ gap: Spacing.sm }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === item.key && styles.filterChipActive]}
                  onPress={() => setStatusFilter(item.key)}
                >
                  <Text style={[styles.filterChipText, statusFilter === item.key && styles.filterChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* Phase Filter */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FASES}
              keyExtractor={(item) => item}
              style={styles.filterRow}
              contentContainerStyle={{ gap: Spacing.sm }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.phaseChip, faseFilter === item && styles.phaseChipActive]}
                  onPress={() => setFaseFilter(item)}
                >
                  <Text style={[styles.phaseChipText, faseFilter === item && styles.phaseChipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </>
        }
        renderItem={({ item: partida }) => {
          const config = statusConfig[partida.status] || statusConfig.pendente;
          const isLive = partida.status === "em_andamento";
          const canSetWinner = !partida.vencedor;

          return (
            <View style={[styles.card, isLive && styles.cardLive]}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.faseBadge}>
                  <Text style={styles.faseBadgeText}>{partida.fase}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.color + "20" }]}>
                  <MaterialIcons name={config.icon as any} size={12} color={config.color} />
                  <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>

              {/* Players */}
              <View style={styles.playersRow}>
                <TouchableOpacity
                  style={[styles.playerSide, partida.vencedor === partida.jogador1.nickname && styles.playerWinner]}
                  disabled={!canSetWinner}
                  onPress={() => handleSetVencedor(partida, partida.jogador1)}
                >
                  <View style={[styles.playerAvatar, partida.vencedor === partida.jogador1.nickname && styles.playerAvatarWinner]}>
                    <Text style={styles.playerAvatarText}>{partida.jogador1.nickname[0]}</Text>
                  </View>
                  <Text style={styles.playerNickname} numberOfLines={1}>{partida.jogador1.nickname}</Text>
                  <Text style={styles.playerChar}>{partida.jogador1.personagem}</Text>
                  {partida.vencedor === partida.jogador1.nickname && (
                    <MaterialIcons name="emoji-events" size={16} color={T.secondary} />
                  )}
                </TouchableOpacity>

                <View style={styles.vsSection}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                <TouchableOpacity
                  style={[styles.playerSide, partida.vencedor === partida.jogador2.nickname && styles.playerWinner]}
                  disabled={!canSetWinner}
                  onPress={() => handleSetVencedor(partida, partida.jogador2)}
                >
                  <View style={[styles.playerAvatar, partida.vencedor === partida.jogador2.nickname && styles.playerAvatarWinner]}>
                    <Text style={styles.playerAvatarText}>{partida.jogador2.nickname[0]}</Text>
                  </View>
                  <Text style={styles.playerNickname} numberOfLines={1}>{partida.jogador2.nickname}</Text>
                  <Text style={styles.playerChar}>{partida.jogador2.personagem}</Text>
                  {partida.vencedor === partida.jogador2.nickname && (
                    <MaterialIcons name="emoji-events" size={16} color={T.secondary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Winner bar or hint */}
              {partida.vencedor ? (
                <View style={styles.winnerBar}>
                  <MaterialIcons name="emoji-events" size={16} color={T.secondary} />
                  <Text style={styles.winnerText}>{partida.vencedor}</Text>
                </View>
              ) : (
                <Text style={styles.tapHint}>
                  Toque em um jogador para definir o vencedor
                </Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          loadingPartidas ? (
            <ActivityIndicator size="large" color={T.primary} style={{ marginTop: Spacing.xxl }} />
          ) : (
            <View style={styles.empty}>
              <MaterialIcons name="sports-esports" size={64} color={T.textMuted} />
              <Text style={styles.emptyText}>Nenhuma partida encontrada</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  content: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  center: { justifyContent: "center", alignItems: "center" },

  // Header
  header: { marginBottom: Spacing.md },
  headerTitle: { fontSize: FontSize.display, fontWeight: "900", color: T.text, letterSpacing: 4 },
  headerSubtitle: { fontSize: FontSize.md, color: T.textMuted, marginTop: Spacing.xs },
  endpointHint: { color: T.textMuted, fontSize: FontSize.xs, fontFamily: "monospace", marginTop: 2 },

  // Back
  backBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.md },
  backText: { color: T.primary, fontSize: FontSize.md, fontWeight: "600" },

  // Torneio selection
  torneioItem: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: T.card, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: T.border,
  },
  torneioName: { color: T.text, fontSize: FontSize.base, fontWeight: "600" },
  torneioDate: { color: T.textMuted, fontSize: FontSize.sm },

  // Filters
  filterRow: { marginBottom: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, backgroundColor: T.card,
    borderWidth: 1, borderColor: T.border,
  },
  filterChipActive: { backgroundColor: T.primary, borderColor: T.primary },
  filterChipText: { fontSize: FontSize.sm, color: T.textSecondary, fontWeight: "600" },
  filterChipTextActive: { color: T.text },
  phaseChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full, borderWidth: 1, borderColor: T.border,
  },
  phaseChipActive: { borderColor: T.secondary, backgroundColor: T.secondary + "15" },
  phaseChipText: { fontSize: FontSize.xs, color: T.textMuted, fontWeight: "600" },
  phaseChipTextActive: { color: T.secondary },

  // Card
  card: {
    backgroundColor: T.card, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: T.border,
  },
  cardLive: { borderColor: T.info, ...Shadows.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  faseBadge: { backgroundColor: T.backgroundLight, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  faseBadgeText: { fontSize: FontSize.xs, color: T.textSecondary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: "700", letterSpacing: 0.5 },

  // Players
  playersRow: { flexDirection: "row", alignItems: "center" },
  playerSide: { flex: 1, alignItems: "center", gap: Spacing.xs },
  playerWinner: { opacity: 1 },
  playerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: T.backgroundLight,
    borderWidth: 2, borderColor: T.border, justifyContent: "center", alignItems: "center",
  },
  playerAvatarWinner: { borderColor: T.secondary, ...Shadows.gold },
  playerAvatarText: { fontSize: FontSize.lg, fontWeight: "900", color: T.text },
  playerNickname: { fontSize: FontSize.md, fontWeight: "700", color: T.text, textAlign: "center" },
  playerChar: { fontSize: FontSize.xs, color: T.textMuted },
  vsSection: { paddingHorizontal: Spacing.md },
  vsText: { fontSize: FontSize.lg, fontWeight: "900", color: T.primary },

  // Winner
  winnerBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.xs, marginTop: Spacing.md, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  winnerText: { fontSize: FontSize.md, fontWeight: "700", color: T.secondary },
  tapHint: {
    color: T.textMuted, fontSize: FontSize.xs, textAlign: "center",
    marginTop: Spacing.sm, fontStyle: "italic", fontFamily: "monospace",
  },

  // Empty
  empty: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { fontSize: FontSize.base, color: T.textMuted },
});
