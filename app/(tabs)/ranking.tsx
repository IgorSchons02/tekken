import {
  FontSize,
  Radius,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import { computeRanking, fetchPartidas, RankingEntry } from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function RankingScreen() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const partidas = await fetchPartidas();
      setRanking(computeRanking(partidas));
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
              <MaterialIcons name="emoji-events" size={32} color={T.secondary} />
              <Text style={styles.headerTitle}>RANKING</Text>
              <Text style={styles.headerSubtitle}>
                Classificacao do torneio
              </Text>
            </View>

            {/* Podium */}
            {top3.length > 0 && (
              <View style={styles.podium}>
                {/* 2nd Place */}
                {top3[1] ? (
                  <PodiumItem entry={top3[1]} position={2} />
                ) : (
                  <View style={styles.podiumSlot} />
                )}
                {/* 1st Place */}
                {top3[0] ? (
                  <PodiumItem entry={top3[0]} position={1} />
                ) : (
                  <View style={styles.podiumSlot} />
                )}
                {/* 3rd Place */}
                {top3[2] ? (
                  <PodiumItem entry={top3[2]} position={3} />
                ) : (
                  <View style={styles.podiumSlot} />
                )}
              </View>
            )}

            {rest.length > 0 && (
              <Text style={styles.restLabel}>DEMAIS COMPETIDORES</Text>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <RankRow entry={item} position={index + 4} />
        )}
        ListEmptyComponent={
          top3.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons
                name="sports-esports"
                size={64}
                color={T.textMuted}
              />
              <Text style={styles.emptyText}>
                Nenhuma partida finalizada ainda
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function PodiumItem({
  entry,
  position,
}: {
  entry: RankingEntry;
  position: number;
}) {
  const colors = {
    1: T.secondary,
    2: "#C0C0C0",
    3: "#CD7F32",
  };
  const color = colors[position as 1 | 2 | 3];
  const isFirst = position === 1;

  return (
    <View
      style={[
        styles.podiumSlot,
        isFirst && { marginTop: -20 },
      ]}
    >
      {isFirst && (
        <MaterialIcons
          name="emoji-events"
          size={36}
          color={T.secondary}
          style={{ marginBottom: Spacing.xs }}
        />
      )}
      <View
        style={[
          styles.podiumAvatar,
          {
            borderColor: color,
            width: isFirst ? 72 : 56,
            height: isFirst ? 72 : 56,
            borderRadius: isFirst ? 36 : 28,
          },
        ]}
      >
        <Text
          style={[
            styles.podiumAvatarText,
            { fontSize: isFirst ? FontSize.xxl : FontSize.xl },
          ]}
        >
          {entry.jogador.nickname[0]}
        </Text>
      </View>
      <Text
        style={styles.podiumNickname}
        numberOfLines={1}
      >
        {entry.jogador.nickname}
      </Text>
      <Text style={styles.podiumChar}>{entry.jogador.personagem}</Text>
      <View
        style={[
          styles.podiumBase,
          {
            backgroundColor: color,
            height: isFirst ? 80 : position === 2 ? 60 : 45,
          },
        ]}
      >
        <Text style={styles.podiumPosition}>{position}</Text>
        <Text style={styles.podiumWins}>{entry.vitorias}V</Text>
      </View>
    </View>
  );
}

function RankRow({
  entry,
  position,
}: {
  entry: RankingEntry;
  position: number;
}) {
  return (
    <View style={styles.rankRow}>
      <Text style={styles.rankPosition}>{position}</Text>
      <View style={styles.rankAvatar}>
        <Text style={styles.rankAvatarText}>
          {entry.jogador.nickname[0]}
        </Text>
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
        <Text style={styles.winRateValue}>
          {Math.round(entry.winRate)}%
        </Text>
        <View style={styles.winRateBar}>
          <View
            style={[styles.winRateFill, { width: `${entry.winRate}%` }]}
          />
        </View>
      </View>
    </View>
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
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSize.display,
    fontWeight: "900",
    color: T.text,
    letterSpacing: 4,
    marginTop: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSize.md,
    color: T.textMuted,
    marginTop: Spacing.xs,
  },

  // Podium
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  podiumSlot: {
    flex: 1,
    alignItems: "center",
  },
  podiumAvatar: {
    borderWidth: 3,
    backgroundColor: T.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  podiumAvatarText: {
    fontWeight: "900",
    color: T.text,
  },
  podiumNickname: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: T.text,
    textAlign: "center",
    marginBottom: 2,
  },
  podiumChar: {
    fontSize: FontSize.xs,
    color: T.textMuted,
    marginBottom: Spacing.xs,
  },
  podiumBase: {
    width: "85%",
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  podiumPosition: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: T.textInverse,
  },
  podiumWins: {
    fontSize: FontSize.xs,
    fontWeight: "bold",
    color: T.textInverse,
    opacity: 0.8,
  },

  // Rest label
  restLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: T.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },

  // Rank Row
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  rankPosition: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: T.textMuted,
    width: 30,
    textAlign: "center",
  },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.backgroundLight,
    borderWidth: 2,
    borderColor: T.border,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  rankAvatarText: {
    fontSize: FontSize.base,
    fontWeight: "900",
    color: T.textSecondary,
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
  rankStatsCol: {
    gap: 2,
    marginRight: Spacing.md,
  },
  rankStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rankWinLabel: {
    fontSize: FontSize.xs,
    fontWeight: "bold",
    color: T.success,
  },
  rankWinValue: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: T.success,
  },
  rankLossLabel: {
    fontSize: FontSize.xs,
    fontWeight: "bold",
    color: T.danger,
  },
  rankLossValue: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: T.danger,
  },
  winRateContainer: {
    alignItems: "center",
    width: 50,
  },
  winRateValue: {
    fontSize: FontSize.sm,
    fontWeight: "bold",
    color: T.textSecondary,
    marginBottom: 4,
  },
  winRateBar: {
    width: "100%",
    height: 4,
    backgroundColor: T.backgroundLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  winRateFill: {
    height: "100%",
    backgroundColor: T.primary,
    borderRadius: 2,
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
