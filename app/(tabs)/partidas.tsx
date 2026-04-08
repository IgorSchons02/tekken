import {
  FontSize,
  Radius,
  Shadows,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import { fetchPartidas, Partida, sortPartidas } from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link, useFocusEffect } from "expo-router";
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

const FASES = [
  "Todas",
  "Final",
  "Semifinal",
  "Quartas de Final",
  "Oitavas de Final",
  "Repescagem",
  "Disputa de 3º Lugar",
];

const STATUS_FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "em_andamento", label: "Ao Vivo" },
  { key: "pendente", label: "Pendentes" },
  { key: "aguardando", label: "Aguardando" },
  { key: "finalizado", label: "Finalizados" },
];

export default function PartidasTab() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [faseFilter, setFaseFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("todos");

  const loadData = useCallback(async () => {
    try {
      const data = await fetchPartidas();
      setPartidas(sortPartidas(data));
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

  const filtered = partidas.filter((p) => {
    if (faseFilter !== "Todas" && p.fase !== faseFilter) return false;
    if (statusFilter !== "todos" && p.status !== statusFilter) return false;
    return true;
  });

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
        data={filtered}
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
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>PARTIDAS</Text>
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
                  style={[
                    styles.filterChip,
                    statusFilter === item.key && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter(item.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === item.key && styles.filterChipTextActive,
                    ]}
                  >
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
                  style={[
                    styles.phaseChip,
                    faseFilter === item && styles.phaseChipActive,
                  ]}
                  onPress={() => setFaseFilter(item)}
                >
                  <Text
                    style={[
                      styles.phaseChipText,
                      faseFilter === item && styles.phaseChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </>
        }
        renderItem={({ item }) => <PartidaCard partida={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons
              name="sports-esports"
              size={64}
              color={T.textMuted}
            />
            <Text style={styles.emptyText}>Nenhuma partida encontrada</Text>
          </View>
        }
      />
    </View>
  );
}

function PartidaCard({ partida }: { partida: Partida }) {
  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pendente: { label: "PENDENTE", color: T.warning, icon: "schedule" },
    aguardando: { label: "AGUARDANDO", color: T.warning, icon: "schedule" },
    em_andamento: { label: "AO VIVO", color: T.info, icon: "play-circle-fill" },
    finalizado: { label: "FINALIZADO", color: T.success, icon: "check-circle" },
  };

  const config = statusConfig[partida.status] || statusConfig.pendente;
  const isLive = partida.status === "em_andamento";

  return (
    <Link
      href={{
        pathname: "/partida",
        params: {
          id: partida.id,
          fase: partida.fase,
          status: partida.status,
          vencedor: partida.vencedor || "",
          jogador1: JSON.stringify(partida.jogador1),
          jogador2: JSON.stringify(partida.jogador2),
        },
      }}
      asChild
    >
      <TouchableOpacity
        style={[
          styles.card,
          isLive && styles.cardLive,
        ]}
        activeOpacity={0.7}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.faseBadge}>
            <Text style={styles.faseBadgeText}>{partida.fase}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color + "20" }]}>
            <MaterialIcons
              name={config.icon as any}
              size={12}
              color={config.color}
            />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Players */}
        <View style={styles.playersRow}>
          {/* Player 1 */}
          <View style={styles.playerSide}>
            <View
              style={[
                styles.playerAvatar,
                partida.vencedor === partida.jogador1.nickname &&
                  styles.playerAvatarWinner,
              ]}
            >
              <Text style={styles.playerAvatarText}>
                {partida.jogador1.nickname[0]}
              </Text>
            </View>
            <Text style={styles.playerNickname} numberOfLines={1}>
              {partida.jogador1.nickname}
            </Text>
            <Text style={styles.playerChar}>
              {partida.jogador1.personagem}
            </Text>
          </View>

          {/* VS */}
          <View style={styles.vsSection}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Player 2 */}
          <View style={styles.playerSide}>
            <View
              style={[
                styles.playerAvatar,
                partida.vencedor === partida.jogador2.nickname &&
                  styles.playerAvatarWinner,
              ]}
            >
              <Text style={styles.playerAvatarText}>
                {partida.jogador2.nickname[0]}
              </Text>
            </View>
            <Text style={styles.playerNickname} numberOfLines={1}>
              {partida.jogador2.nickname}
            </Text>
            <Text style={styles.playerChar}>
              {partida.jogador2.personagem}
            </Text>
          </View>
        </View>

        {/* Winner */}
        {partida.vencedor && (
          <View style={styles.winnerBar}>
            <MaterialIcons name="emoji-events" size={16} color={T.secondary} />
            <Text style={styles.winnerText}>{partida.vencedor}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );
}

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
    marginBottom: Spacing.md,
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
  },

  // Filters
  filterRow: {
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  filterChipActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    color: T.textSecondary,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: T.text,
  },
  phaseChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: T.border,
  },
  phaseChipActive: {
    borderColor: T.secondary,
    backgroundColor: T.secondary + "15",
  },
  phaseChipText: {
    fontSize: FontSize.xs,
    color: T.textMuted,
    fontWeight: "600",
  },
  phaseChipTextActive: {
    color: T.secondary,
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
  cardLive: {
    borderColor: T.info,
    ...Shadows.md,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  faseBadge: {
    backgroundColor: T.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  faseBadgeText: {
    fontSize: FontSize.xs,
    color: T.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Players
  playersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerSide: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.backgroundLight,
    borderWidth: 2,
    borderColor: T.border,
    justifyContent: "center",
    alignItems: "center",
  },
  playerAvatarWinner: {
    borderColor: T.secondary,
    ...Shadows.gold,
  },
  playerAvatarText: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: T.text,
  },
  playerNickname: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: T.text,
    textAlign: "center",
  },
  playerChar: {
    fontSize: FontSize.xs,
    color: T.textMuted,
  },
  vsSection: {
    paddingHorizontal: Spacing.md,
  },
  vsText: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: T.primary,
  },

  // Winner
  winnerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  winnerText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: T.secondary,
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: T.textMuted,
  },
});
