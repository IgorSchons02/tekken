import {
  FontSize,
  Radius,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import {
  computeRanking,
  computeStats,
  fetchPartidas,
  fetchTorneios,
  RankingEntry,
  Torneio,
  TournamentStats,
} from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RankingScreen() {
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [selectedTorneio, setSelectedTorneio] = useState<Torneio | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadRanking = useCallback(async (torneioId: number) => {
    setLoadingRanking(true);
    try {
      const partidas = await fetchPartidas(torneioId);
      setRanking(computeRanking(partidas));
      setStats(computeStats(partidas));
    } catch {
      setRanking([]);
      setStats(null);
    } finally {
      setLoadingRanking(false);
      setRefreshing(false);
    }
  }, []);

  const handleSelectTorneio = (torneio: Torneio) => {
    setSelectedTorneio(torneio);
    loadRanking(torneio.id);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  // Torneio selection
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
              <MaterialIcons name="emoji-events" size={32} color={T.secondary} />
              <Text style={styles.headerTitle}>RANKING</Text>
              <Text style={styles.headerSubtitle}>Selecione um torneio para ver o ranking</Text>
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

  // Ranking view
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <View style={styles.container}>
      <FlatList
        data={rest}
        keyExtractor={(item) => item.jogador.nickname}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadRanking(selectedTorneio.id); }}
            tintColor={T.primary}
          />
        }
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { setSelectedTorneio(null); setRanking([]); setStats(null); }}
            >
              <MaterialIcons name="arrow-back" size={20} color={T.primary} />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <MaterialIcons name="emoji-events" size={32} color={T.secondary} />
              <Text style={styles.headerTitle}>RANKING</Text>
              <Text style={styles.headerSubtitle}>{selectedTorneio.titulo}</Text>
            </View>

            {/* Stats */}
            {stats && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.totalPartidas}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: T.success }]}>{stats.partidasFinalizadas}</Text>
                  <Text style={styles.statLabel}>Finalizadas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: T.info }]}>{stats.partidasEmAndamento}</Text>
                  <Text style={styles.statLabel}>Em Andamento</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: T.warning }]}>{stats.partidasPendentes}</Text>
                  <Text style={styles.statLabel}>Pendentes</Text>
                </View>
              </View>
            )}

            {loadingRanking ? (
              <ActivityIndicator size="large" color={T.primary} style={{ marginVertical: Spacing.xxl }} />
            ) : ranking.length === 0 ? (
              <View style={styles.empty}>
                <MaterialIcons name="sports-esports" size={64} color={T.textMuted} />
                <Text style={styles.emptyText}>Nenhuma partida finalizada ainda</Text>
              </View>
            ) : (
              <>
                {/* Podium */}
                {top3.length > 0 && (
                  <View style={styles.podium}>
                    {top3[1] ? <PodiumItem entry={top3[1]} position={2} /> : <View style={styles.podiumSlot} />}
                    {top3[0] ? <PodiumItem entry={top3[0]} position={1} /> : <View style={styles.podiumSlot} />}
                    {top3[2] ? <PodiumItem entry={top3[2]} position={3} /> : <View style={styles.podiumSlot} />}
                  </View>
                )}

                {rest.length > 0 && (
                  <Text style={styles.restLabel}>DEMAIS COMPETIDORES</Text>
                )}
              </>
            )}
          </>
        }
        renderItem={({ item, index }) => <RankRow entry={item} position={index + 4} />}
      />
    </View>
  );
}

function PodiumItem({ entry, position }: { entry: RankingEntry; position: number }) {
  const colors = { 1: T.secondary, 2: "#C0C0C0", 3: "#CD7F32" };
  const color = colors[position as 1 | 2 | 3];
  const isFirst = position === 1;

  return (
    <View style={[styles.podiumSlot, isFirst && { marginTop: -20 }]}>
      {isFirst && (
        <MaterialIcons name="emoji-events" size={36} color={T.secondary} style={{ marginBottom: Spacing.xs }} />
      )}
      <View
        style={[
          styles.podiumAvatar,
          { borderColor: color, width: isFirst ? 72 : 56, height: isFirst ? 72 : 56, borderRadius: isFirst ? 36 : 28 },
        ]}
      >
        <Text style={[styles.podiumAvatarText, { fontSize: isFirst ? FontSize.xxl : FontSize.xl }]}>
          {entry.jogador.nickname[0]}
        </Text>
      </View>
      <Text style={styles.podiumNickname} numberOfLines={1}>{entry.jogador.nickname}</Text>
      <Text style={styles.podiumChar}>{entry.jogador.personagem}</Text>
      <View style={[styles.podiumBase, { backgroundColor: color, height: isFirst ? 80 : position === 2 ? 60 : 45 }]}>
        <Text style={styles.podiumPosition}>{position}</Text>
        <Text style={styles.podiumWins}>{entry.vitorias}V</Text>
      </View>
    </View>
  );
}

function RankRow({ entry, position }: { entry: RankingEntry; position: number }) {
  return (
    <View style={styles.rankRow}>
      <Text style={styles.rankPosition}>{position}</Text>
      <View style={styles.rankAvatar}>
        <Text style={styles.rankAvatarText}>{entry.jogador.nickname[0]}</Text>
      </View>
      <View style={styles.rankInfo}>
        <Text style={styles.rankNickname}>{entry.jogador.nickname}</Text>
        <Text style={styles.rankChar}>{entry.jogador.personagem}</Text>
      </View>
      <View style={styles.rankStatsCol}>
        <View style={styles.rankStatRow}>
          <Text style={styles.rankWinLabel}>V</Text>
          <Text style={styles.rankWinValue}>{entry.vitorias}</Text>
        </View>
        <View style={styles.rankStatRow}>
          <Text style={styles.rankLossLabel}>D</Text>
          <Text style={styles.rankLossValue}>{entry.derrotas}</Text>
        </View>
      </View>
      <View style={styles.winRateContainer}>
        <Text style={styles.winRateValue}>{Math.round(entry.winRate)}%</Text>
        <View style={styles.winRateBar}>
          <View style={[styles.winRateFill, { width: `${entry.winRate}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  content: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  center: { justifyContent: "center", alignItems: "center" },

  // Header
  header: { alignItems: "center", marginBottom: Spacing.xl },
  headerTitle: { fontSize: FontSize.display, fontWeight: "900", color: T.text, letterSpacing: 4, marginTop: Spacing.xs },
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

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, minWidth: "40%", backgroundColor: T.card, borderRadius: Radius.sm,
    padding: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: T.border,
  },
  statValue: { color: T.text, fontSize: FontSize.xl, fontWeight: "800" },
  statLabel: { color: T.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.xs },

  // Podium
  podium: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", marginBottom: Spacing.xl, paddingTop: Spacing.xl },
  podiumSlot: { flex: 1, alignItems: "center" },
  podiumAvatar: { borderWidth: 3, backgroundColor: T.card, justifyContent: "center", alignItems: "center", marginBottom: Spacing.xs },
  podiumAvatarText: { fontWeight: "900", color: T.text },
  podiumNickname: { fontSize: FontSize.sm, fontWeight: "700", color: T.text, textAlign: "center", marginBottom: 2 },
  podiumChar: { fontSize: FontSize.xs, color: T.textMuted, marginBottom: Spacing.xs },
  podiumBase: { width: "85%", borderTopLeftRadius: Radius.sm, borderTopRightRadius: Radius.sm, alignItems: "center", justifyContent: "center", gap: 2 },
  podiumPosition: { fontSize: FontSize.xxl, fontWeight: "900", color: T.textInverse },
  podiumWins: { fontSize: FontSize.xs, fontWeight: "bold", color: T.textInverse, opacity: 0.8 },

  // Rest label
  restLabel: { fontSize: FontSize.sm, fontWeight: "700", color: T.textMuted, letterSpacing: 2, marginBottom: Spacing.md },

  // Rank Row
  rankRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.card,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: T.border,
  },
  rankPosition: { fontSize: FontSize.lg, fontWeight: "900", color: T.textMuted, width: 30, textAlign: "center" },
  rankAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: T.backgroundLight,
    borderWidth: 2, borderColor: T.border, justifyContent: "center", alignItems: "center", marginLeft: Spacing.sm,
  },
  rankAvatarText: { fontSize: FontSize.base, fontWeight: "900", color: T.textSecondary },
  rankInfo: { flex: 1, marginLeft: Spacing.md },
  rankNickname: { fontSize: FontSize.base, fontWeight: "700", color: T.text },
  rankChar: { fontSize: FontSize.sm, color: T.textMuted },
  rankStatsCol: { gap: 2, marginRight: Spacing.md },
  rankStatRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rankWinLabel: { fontSize: FontSize.xs, fontWeight: "bold", color: T.success },
  rankWinValue: { fontSize: FontSize.md, fontWeight: "bold", color: T.success },
  rankLossLabel: { fontSize: FontSize.xs, fontWeight: "bold", color: T.danger },
  rankLossValue: { fontSize: FontSize.md, fontWeight: "bold", color: T.danger },
  winRateContainer: { alignItems: "center", width: 50 },
  winRateValue: { fontSize: FontSize.sm, fontWeight: "bold", color: T.textSecondary, marginBottom: 4 },
  winRateBar: { width: "100%", height: 4, backgroundColor: T.backgroundLight, borderRadius: 2, overflow: "hidden" },
  winRateFill: { height: "100%", backgroundColor: T.primary, borderRadius: 2 },

  // Empty
  empty: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { fontSize: FontSize.base, color: T.textMuted },
});
