import {
  FontSize,
  Radius,
  Shadows,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import { atualizarVencedor } from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PartidaDetalhes() {
  const { id, fase, vencedor: vencedorParam, status, jogador1, jogador2 } =
    useLocalSearchParams();

  const p1 = jogador1 ? JSON.parse(jogador1 as string) : null;
  const p2 = jogador2 ? JSON.parse(jogador2 as string) : null;
  const [vencedor, setVencedor] = useState(vencedorParam as string || "");
  const [updating, setUpdating] = useState(false);

  const statusConfig: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    pendente: { label: "PENDENTE", color: T.warning, icon: "schedule" },
    aguardando: { label: "AGUARDANDO", color: T.warning, icon: "schedule" },
    em_andamento: {
      label: "AO VIVO",
      color: T.info,
      icon: "play-circle-fill",
    },
    finalizado: {
      label: "FINALIZADO",
      color: T.success,
      icon: "check-circle",
    },
  };

  const config = statusConfig[status as string] || statusConfig.pendente;
  const isP1Winner = vencedor === p1?.nickname;
  const isP2Winner = vencedor === p2?.nickname;
  const canSetWinner = !vencedor;

  const handleSetWinner = async (jogador: any) => {
    Alert.alert(
      "Confirmar Vencedor",
      `Deseja definir ${jogador.nickname} como vencedor desta partida?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setUpdating(true);
            try {
              await atualizarVencedor(Number(id), jogador.id);
              setVencedor(jogador.nickname);
              Alert.alert("Sucesso!", `${jogador.nickname} definido como vencedor!`);
            } catch (err: any) {
              Alert.alert("Erro", err?.message || "Nao foi possivel atualizar o vencedor");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: T.background },
          headerTintColor: T.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Phase & Status */}
        <View style={styles.topSection}>
          <Text style={styles.faseText}>{fase}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: config.color + "20" },
            ]}
          >
            <MaterialIcons
              name={config.icon as any}
              size={14}
              color={config.color}
            />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Battle Arena */}
        <View style={styles.arena}>
          {/* Player 1 */}
          <TouchableOpacity
            style={styles.playerColumn}
            disabled={!canSetWinner || updating}
            onPress={() => handleSetWinner(p1)}
            activeOpacity={canSetWinner ? 0.7 : 1}
          >
            <View
              style={[
                styles.bigAvatar,
                isP1Winner && styles.bigAvatarWinner,
                canSetWinner && styles.bigAvatarSelectable,
              ]}
            >
              <Text style={styles.bigAvatarText}>{p1?.nickname?.[0]}</Text>
              {isP1Winner && (
                <View style={styles.crownBadge}>
                  <MaterialIcons
                    name="emoji-events"
                    size={16}
                    color={T.secondary}
                  />
                </View>
              )}
            </View>
            <Text style={styles.playerNickname}>{p1?.nickname}</Text>
            <View style={styles.charBadge}>
              <Text style={styles.charBadgeText}>{p1?.personagem}</Text>
            </View>
            {isP1Winner && (
              <Text style={styles.winnerLabel}>VENCEDOR</Text>
            )}
            {canSetWinner && (
              <View style={styles.selectWinnerHint}>
                <MaterialIcons name="touch-app" size={14} color={T.primary} />
                <Text style={styles.selectWinnerText}>Selecionar</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* VS Center */}
          <View style={styles.vsCenter}>
            <View style={styles.vsCircle}>
              <Text style={styles.vsBigText}>VS</Text>
            </View>
          </View>

          {/* Player 2 */}
          <TouchableOpacity
            style={styles.playerColumn}
            disabled={!canSetWinner || updating}
            onPress={() => handleSetWinner(p2)}
            activeOpacity={canSetWinner ? 0.7 : 1}
          >
            <View
              style={[
                styles.bigAvatar,
                isP2Winner && styles.bigAvatarWinner,
                canSetWinner && styles.bigAvatarSelectable,
              ]}
            >
              <Text style={styles.bigAvatarText}>{p2?.nickname?.[0]}</Text>
              {isP2Winner && (
                <View style={styles.crownBadge}>
                  <MaterialIcons
                    name="emoji-events"
                    size={16}
                    color={T.secondary}
                  />
                </View>
              )}
            </View>
            <Text style={styles.playerNickname}>{p2?.nickname}</Text>
            <View style={styles.charBadge}>
              <Text style={styles.charBadgeText}>{p2?.personagem}</Text>
            </View>
            {isP2Winner && (
              <Text style={styles.winnerLabel}>VENCEDOR</Text>
            )}
            {canSetWinner && (
              <View style={styles.selectWinnerHint}>
                <MaterialIcons name="touch-app" size={14} color={T.primary} />
                <Text style={styles.selectWinnerText}>Selecionar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Set Winner Instruction */}
        {canSetWinner && (
          <View style={styles.instructionCard}>
            <MaterialIcons name="info-outline" size={20} color={T.info} />
            <Text style={styles.instructionText}>
              Toque em um dos jogadores acima para definir o vencedor desta
              partida
            </Text>
          </View>
        )}

        {/* Result Section */}
        <View style={styles.resultSection}>
          {vencedor ? (
            <View style={styles.resultCard}>
              <MaterialIcons
                name="emoji-events"
                size={40}
                color={T.secondary}
              />
              <Text style={styles.resultLabel}>CAMPEAO DA PARTIDA</Text>
              <Text style={styles.resultName}>{vencedor}</Text>
              <View style={styles.resultDivider} />
              <Text style={styles.resultFase}>{fase}</Text>
            </View>
          ) : (
            <View style={styles.resultCard}>
              <MaterialIcons
                name={
                  status === "em_andamento"
                    ? "sports-esports"
                    : "hourglass-empty"
                }
                size={40}
                color={config.color}
              />
              <Text style={styles.resultLabel}>
                {status === "em_andamento"
                  ? "PARTIDA EM ANDAMENTO"
                  : "PARTIDA PENDENTE"}
              </Text>
              <Text style={styles.resultSubtext}>
                {status === "em_andamento"
                  ? "Os jogadores estao em combate!"
                  : "Selecione o vencedor quando a partida terminar"}
              </Text>
            </View>
          )}
        </View>

        {/* Match Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>DETALHES</Text>
          <View style={styles.infoGrid}>
            <InfoItem icon="tag" label="ID da Partida" value={`#${id}`} />
            <InfoItem icon="category" label="Fase" value={fase as string} />
            <InfoItem
              icon="people"
              label="Jogador 1"
              value={`${p1?.nickname} (${p1?.personagem})`}
            />
            <InfoItem
              icon="people"
              label="Jogador 2"
              value={`${p2?.nickname} (${p2?.personagem})`}
            />
            <InfoItem
              icon="flag"
              label="Status"
              value={config.label}
              valueColor={config.color}
            />
            {vencedor ? (
              <InfoItem
                icon="emoji-events"
                label="Vencedor"
                value={vencedor}
                valueColor={T.secondary}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function InfoItem({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoItem}>
      <MaterialIcons name={icon as any} size={18} color={T.textMuted} />
      <View style={styles.infoItemText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[
            styles.infoValue,
            valueColor ? { color: valueColor } : undefined,
          ]}
        >
          {value}
        </Text>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Top
  topSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  faseText: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: T.text,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Arena
  arena: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  playerColumn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.card,
    borderWidth: 3,
    borderColor: T.border,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  bigAvatarWinner: {
    borderColor: T.secondary,
    ...Shadows.gold,
  },
  bigAvatarSelectable: {
    borderColor: T.primary + "60",
    borderStyle: "dashed",
  },
  bigAvatarText: {
    fontSize: FontSize.display,
    fontWeight: "900",
    color: T.text,
  },
  crownBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: T.card,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.secondary,
  },
  playerNickname: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: T.text,
    textAlign: "center",
  },
  charBadge: {
    backgroundColor: T.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: T.border,
  },
  charBadgeText: {
    fontSize: FontSize.xs,
    color: T.textSecondary,
    fontWeight: "600",
  },
  winnerLabel: {
    fontSize: FontSize.xs,
    fontWeight: "900",
    color: T.secondary,
    letterSpacing: 2,
  },
  selectWinnerHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
  },
  selectWinnerText: {
    fontSize: FontSize.xs,
    color: T.primary,
    fontWeight: "600",
  },

  // Instruction
  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: T.info + "10",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: T.info + "30",
  },
  instructionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: T.info,
    lineHeight: 20,
  },

  // VS
  vsCenter: {
    paddingHorizontal: Spacing.sm,
  },
  vsCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.glow,
  },
  vsBigText: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: T.text,
  },

  // Result
  resultSection: {
    marginBottom: Spacing.xl,
  },
  resultCard: {
    backgroundColor: T.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  resultLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: T.textMuted,
    letterSpacing: 3,
  },
  resultName: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: T.secondary,
  },
  resultDivider: {
    width: 40,
    height: 2,
    backgroundColor: T.border,
    marginVertical: Spacing.xs,
  },
  resultFase: {
    fontSize: FontSize.sm,
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultSubtext: {
    fontSize: FontSize.md,
    color: T.textSecondary,
    textAlign: "center",
  },

  // Info
  infoSection: {
    backgroundColor: T.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: T.border,
  },
  infoTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: T.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  infoGrid: {
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoItemText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: FontSize.base,
    color: T.text,
    fontWeight: "600",
    marginTop: 2,
  },
});
