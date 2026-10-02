import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { LeaderboardEntry, Profile } from "@chopchop/shared";
import type { createDb } from "./db/client.js";
import { joueur, partie, versionRegles } from "./db/schema.js";

export type GameStatus = "en_cours" | "terminee" | "abandonnee";

export interface Game {
  id: string;
  userId: string;
  levelId: number;
  status: GameStatus;
  startedAt: Date;
  /** Length of the game according to its rules version. */
  ruleDurationMs: number;
}

export interface Repository {
  getProfile(userId: string): Promise<Profile | null>;
  /** Creates or renames the profile of a user. */
  saveProfile(userId: string, pseudo: string): Promise<"saved" | "pseudo_taken">;
  /**
   * Starts a game with the latest rules version. The user must have a profile.
   * A game still in progress for this user is abandoned: a player has at most one open game.
   */
  startGame(userId: string, levelId: number, startedAt: Date): Promise<Game>;
  getGame(gameId: string): Promise<Game | null>;
  /** Ends a game in progress. Returns null if it is not (or no longer) in progress. */
  finishGame(input: {
    gameId: string;
    userId: string;
    score: number;
    bestCombo: number;
    finishedAt: Date;
  }): Promise<{ rank: number; durationMs: number } | null>;
  abandonGame(gameId: string, userId: string, at: Date): Promise<boolean>;
  top(levelId: number, limit: number): Promise<LeaderboardEntry[]>;
}

type Db = ReturnType<typeof createDb>["db"];

/** Game duration in whole milliseconds, computed in SQL so that ranking is consistent everywhere. */
const durationMs = (p: typeof partie) =>
  sql<number>`(extract(epoch from (${p.dateFin} - ${p.dateDebut})) * 1000)::int`;

const UNIQUE_VIOLATION = "23505";
function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === UNIQUE_VIOLATION || e?.cause?.code === UNIQUE_VIOLATION;
}

export function createRepository(db: Db): Repository {
  const loadGame = async (gameId: string): Promise<Game | null> => {
    const [row] = await db
      .select({ p: partie, dureeSecondes: versionRegles.dureePartieSecondes })
      .from(partie)
      .innerJoin(versionRegles, eq(versionRegles.idVersion, partie.idVersion))
      .where(eq(partie.idPartie, gameId));
    if (!row) return null;
    return {
      id: row.p.idPartie,
      userId: row.p.idJoueur,
      levelId: row.p.idNiveau,
      status: row.p.statut,
      startedAt: row.p.dateDebut,
      ruleDurationMs: row.dureeSecondes * 1000,
    };
  };

  return {
    async getProfile(userId) {
      const [row] = await db.select().from(joueur).where(eq(joueur.idJoueur, userId));
      return row ? { id: row.idJoueur, pseudo: row.pseudo } : null;
    },

    async saveProfile(userId, pseudo) {
      try {
        await db
          .insert(joueur)
          .values({ idJoueur: userId, pseudo })
          .onConflictDoUpdate({ target: joueur.idJoueur, set: { pseudo } });
        return "saved";
      } catch (err) {
        if (isUniqueViolation(err)) return "pseudo_taken";
        throw err;
      }
    },

    async startGame(userId, levelId, startedAt) {
      const gameId = await db.transaction(async (tx) => {
        await tx
          .update(partie)
          .set({ statut: "abandonnee", dateFin: startedAt })
          .where(and(eq(partie.idJoueur, userId), eq(partie.statut, "en_cours")));
        const [row] = await tx
          .insert(partie)
          .values({
            idJoueur: userId,
            idNiveau: levelId,
            idVersion: sql`(select max(id_version) from version_regles)`,
            dateDebut: startedAt,
          })
          .returning({ id: partie.idPartie });
        if (!row) throw new Error("Insert returned no row");
        return row.id;
      });
      const game = await loadGame(gameId);
      if (!game) throw new Error("Game not found after insert");
      return game;
    },

    getGame: loadGame,

    async finishGame({ gameId, userId, score, bestCombo, finishedAt }) {
      // One transaction: if computing the rank fails, the game stays in progress and can be retried.
      return db.transaction(async (tx) => {
        const updated = await tx
          .update(partie)
          .set({ statut: "terminee", dateFin: finishedAt, scoreFinal: score, meilleurCombo: bestCombo })
          .where(and(eq(partie.idPartie, gameId), eq(partie.idJoueur, userId), eq(partie.statut, "en_cours")))
          .returning({ id: partie.idPartie });
        if (updated.length === 0) return null;

        // Same ordering as `top`: score desc, then duration asc, then oldest first, then id.
        const result = await tx.execute<{ duration_ms: number; rank: number }>(sql`
          with me as (
            select id_partie, id_niveau, score_final, date_fin,
                   (extract(epoch from (date_fin - date_debut)) * 1000)::int as duree_ms
            from partie where id_partie = ${gameId}
          )
          select me.duree_ms as duration_ms,
                 1 + (
                   select count(*)::int from partie p
                   where p.id_niveau = me.id_niveau and p.statut = 'terminee' and p.id_partie <> me.id_partie
                     and (
                       p.score_final > me.score_final
                       or (p.score_final = me.score_final
                           and (extract(epoch from (p.date_fin - p.date_debut)) * 1000)::int < me.duree_ms)
                       or (p.score_final = me.score_final
                           and (extract(epoch from (p.date_fin - p.date_debut)) * 1000)::int = me.duree_ms
                           and (p.date_fin < me.date_fin
                                or (p.date_fin = me.date_fin and p.id_partie < me.id_partie)))
                     )
                 ) as rank
          from me
        `);
        const row = result.rows[0];
        if (!row) throw new Error("Rank query returned no row");
        return { rank: Number(row.rank), durationMs: Number(row.duration_ms) };
      });
    },

    async abandonGame(gameId, userId, at) {
      const updated = await db
        .update(partie)
        .set({ statut: "abandonnee", dateFin: at })
        .where(and(eq(partie.idPartie, gameId), eq(partie.idJoueur, userId), eq(partie.statut, "en_cours")))
        .returning({ id: partie.idPartie });
      return updated.length > 0;
    },

    async top(levelId, limit) {
      const duration = durationMs(partie);
      const rows = await db
        .select({
          pseudo: joueur.pseudo,
          score: partie.scoreFinal,
          duration,
          finishedAt: partie.dateFin,
        })
        .from(partie)
        .innerJoin(joueur, eq(joueur.idJoueur, partie.idJoueur))
        .where(and(eq(partie.idNiveau, levelId), eq(partie.statut, "terminee")))
        .orderBy(desc(partie.scoreFinal), asc(duration), asc(partie.dateFin), asc(partie.idPartie))
        .limit(limit);
      return rows.map((r, i) => ({
        rank: i + 1,
        pseudo: r.pseudo,
        score: r.score ?? 0,
        durationMs: Number(r.duration),
        finishedAt: (r.finishedAt ?? new Date(0)).toISOString(),
      }));
    },
  };
}
