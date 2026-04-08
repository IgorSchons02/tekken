import {
  FontSize,
  Radius,
  Shadows,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import {
  computeRanking,
  computeStats,
  fetchPartidas,
  fetchTorneios,
  Partida,
  sortPartidas,
  Torneio,
} from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const [matchData, tornData] = await Promise.all([
        fetchPartidas(),
        fetchTorneios(),
      ]);
      setPartidas(matchData);
      setTorneios(tornData);
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

  const stats = computeStats(partidas);
  const sorted = sortPartidas(partidas);
  const emDestaque = sorted.find(
    (p) => p.status === "em_andamento" || p.status === "pendente" || p.status === "aguardando"
  );
  const activeTorneio = torneios.length > 0 ? torneios[0] : null;
  const ranking = computeRanking(partidas).slice(0, 3);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
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
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>TEKKEN 8</Text>
        <Text style={styles.headerTitle}>TORNEIO</Text>
        <View style={styles.headerLine} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatCard
          icon="sports-esports"
          value={stats.totalPartidas}
          label="Partidas"
          color={T.primary}
        />
        <StatCard
          icon="people"
          value={stats.totalJogadores}
          label="Jogadores"
          color={T.secondary}
        />
        <StatCard
          icon="emoji-events"
          value={stats.partidasFinalizadas}
          label="Finalizadas"
          color={T.success}
        />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.sectionLabel}>PROGRESSO DO TORNEIO</Text>
          <Text style={styles.progressPercent}>
            {stats.totalPartidas > 0
              ? Math.round(
                  (stats.partidasFinalizadas / stats.totalPartidas) * 100
                )
              : 0}
            %
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  stats.totalPartidas > 0
                    ? `${(stats.partidasFinalizadas / stats.totalPartidas) * 100}%`
                    : "0%",
              },
            ]}
          />
        </View>
        <View style={styles.progressLegend}>
          <LegendItem
            color={T.success}
            label={`${stats.partidasFinalizadas} finalizadas`}
          />
          <LegendItem
            color={T.info}
            label={`${stats.partidasEmAndamento} em andamento`}
          />
          <LegendItem
            color={T.warning}
            label={`${stats.partidasPendentes} pendentes`}
          />
        </View>
      </View>

      {/* Active Tournament */}
      {activeTorneio && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TORNEIO ATIVO</Text>
          <TouchableOpacity
            style={styles.torneioCard}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/torneios" as any)}
          >
            <View style={styles.torneioHeader}>
              <MaterialIcons name="emoji-events" size={24} color={T.secondary} />
              <Text style={styles.torneioTitle}>{activeTorneio.titulo}</Text>
            </View>
            <View style={styles.torneioInfo}>
              <View style={styles.torneioInfoItem}>
                <MaterialIcons name="calendar-today" size={14} color={T.textMuted} />
                <Text style={styles.torneioInfoText}>
                  {new Date(activeTorneio.data_inicio).toLocaleDateString("pt-BR")} - {new Date(activeTorneio.data_final).toLocaleDateString("pt-BR")}
                </Text>
              </View>
              <View style={styles.torneioInfoItem}>
                <MaterialIcons name="paid" size={14} color={T.secondary} />
                <Text style={[styles.torneioInfoText, { color: T.secondary }]}>
                  R$ {activeTorneio.premio.toLocaleString("pt-BR")}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Featured Match */}
      {emDestaque && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PARTIDA EM DESTAQUE</Text>
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/partida",
                params: {
                  ...emDestaque,
                  jogador1: JSON.stringify(emDestaque.jogador1),
                  jogador2: JSON.stringify(emDestaque.jogador2),
                },
              })
            }
          >
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{emDestaque.fase}</Text>
            </View>
            <View style={styles.featuredVersus}>
              <View style={styles.featuredPlayer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {emDestaque.jogador1.nickname[0]}
                  </Text>
                </View>
                <Text style={styles.featuredNickname}>
                  {emDestaque.jogador1.nickname}
                </Text>
                <Text style={styles.featuredChar}>
                  {emDestaque.jogador1.personagem}
                </Text>
              </View>
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        emDestaque.status === "em_andamento"
                          ? T.info
                          : T.warning,
                    },
                  ]}
                />
                <Text style={styles.statusLabel}>
                  {emDestaque.status === "em_andamento"
                    ? "AO VIVO"
                    : "EM BREVE"}
                </Text>
              </View>
              <View style={styles.featuredPlayer}>
                <View style={[styles.avatarCircle, { borderColor: T.secondary }]}>
                  <Text style={styles.avatarText}>
                    {emDestaque.jogador2.nickname[0]}
                  </Text>
                </View>
                <Text style={styles.featuredNickname}>
                  {emDestaque.jogador2.nickname}
                </Text>
                <Text style={styles.featuredChar}>
                  {emDestaque.jogador2.personagem}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Top 3 Ranking */}
      {ranking.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TOP JOGADORES</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/ranking")}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {ranking.map((entry, index) => (
            <View key={entry.jogador.nickname} style={styles.rankItem}>
              <View
                style={[
                  styles.rankBadge,
                  {
                    backgroundColor:
                      index === 0
                        ? T.secondary
                        : index === 1
                          ? "#C0C0C0"
                          : "#CD7F32",
                  },
                ]}
              >
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankNickname}>
                  {entry.jogador.nickname}
                </Text>
                <Text style={styles.rankChar}>
                  {entry.jogador.personagem}
                </Text>
              </View>
              <View style={styles.rankStats}>
                <Text style={styles.rankWins}>{entry.vitorias}W</Text>
                <Text style={styles.rankLosses}>{entry.derrotas}L</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACESSO RAPIDO</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/partidas")}
          >
            <MaterialIcons name="sports-esports" size={28} color={T.primary} />
            <Text style={styles.actionLabel}>Partidas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/torneios" as any)}
          >
            <MaterialIcons name="emoji-events" size={28} color={T.secondary} />
            <Text style={styles.actionLabel}>Torneios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/cadastro")}
          >
            <MaterialIcons name="person-add" size={28} color={T.success} />
            <Text style={styles.actionLabel}>Cadastro</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <MaterialIcons name={icon as any} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: T.primary,
    letterSpacing: 6,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: FontSize.hero,
    fontWeight: "900",
    color: T.text,
    letterSpacing: 4,
    marginTop: Spacing.xs,
  },
  headerLine: {
    width: 60,
    height: 3,
    backgroundColor: T.primary,
    marginTop: Spacing.md,
    borderRadius: 2,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: T.border,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Progress
  progressSection: {
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: T.border,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  progressPercent: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: T.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: T.backgroundLight,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: T.primary,
    borderRadius: Radius.full,
  },
  progressLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: T.textSecondary,
  },

  // Section
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: T.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: FontSize.md,
    color: T.primary,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },

  // Torneio
  torneioCard: {
    backgroundColor: T.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: T.secondary + "40",
  },
  torneioHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  torneioTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: T.text,
    flex: 1,
  },
  torneioInfo: {
    gap: Spacing.xs,
  },
  torneioInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  torneioInfoText: {
    fontSize: FontSize.sm,
    color: T.textSecondary,
  },

  // Featured Match
  featuredCard: {
    backgroundColor: T.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: T.primary,
    ...Shadows.glow,
  },
  featuredBadge: {
    alignSelf: "center",
    backgroundColor: T.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  featuredBadgeText: {
    color: T.text,
    fontSize: FontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  featuredVersus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredPlayer: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.backgroundLight,
    borderWidth: 2,
    borderColor: T.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: T.text,
  },
  featuredNickname: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: T.text,
    textAlign: "center",
  },
  featuredChar: {
    fontSize: FontSize.xs,
    color: T.textMuted,
  },
  vsContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  vsText: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: T.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.xs,
  },
  statusLabel: {
    fontSize: FontSize.xs,
    color: T.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  // Ranking
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rankNumber: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: T.textInverse,
  },
  rankInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  rankNickname: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: T.text,
  },
  rankChar: {
    fontSize: FontSize.sm,
    color: T.textMuted,
  },
  rankStats: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  rankWins: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: T.success,
  },
  rankLosses: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: T.danger,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    color: T.textSecondary,
    fontWeight: "600",
  },
});
