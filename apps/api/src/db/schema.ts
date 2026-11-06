import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// Only what the leaderboard needs. Recipes, ingredients and orders stay in the game config.
// Row Level Security is enabled with no policy on every table: the tables are closed to
// Supabase's public roles, and the API connects with the owner role, which bypasses RLS.

export const statutPartie = pgEnum("statut_partie", ["en_cours", "terminee", "abandonnee"]);

/** Game profile of a Supabase Auth user (email and password live in auth.users). */
export const joueur = pgTable(
  "joueur",
  {
    idJoueur: uuid("id_joueur")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    pseudo: varchar("pseudo", { length: 16 }).notNull(),
    dateCreation: timestamp("date_creation", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("joueur_pseudo_lower_idx").on(sql`lower(${t.pseudo})`)],
).enableRLS();

export const niveau = pgTable(
  "niveau",
  {
    // Same value as `numero`: the level id used by the API is the primary key.
    idNiveau: smallint("id_niveau").primaryKey(),
    numero: smallint("numero").notNull().unique(),
    nom: varchar("nom", { length: 40 }).notNull(),
  },
  (t) => [check("niveau_numero_check", sql`${t.numero} between 1 and 5`)],
).enableRLS();

export const versionRegles = pgTable(
  "version_regles",
  {
    idVersion: smallint("id_version").primaryKey().generatedAlwaysAsIdentity(),
    nom: varchar("nom", { length: 40 }).notNull().unique(),
    dureePartieSecondes: integer("duree_partie_secondes").notNull(),
  },
  (t) => [check("version_regles_duree_check", sql`${t.dureePartieSecondes} > 0`)],
).enableRLS();

export const partie = pgTable(
  "partie",
  {
    idPartie: uuid("id_partie").primaryKey().defaultRandom(),
    idJoueur: uuid("id_joueur")
      .notNull()
      .references(() => joueur.idJoueur, { onDelete: "cascade" }),
    idNiveau: smallint("id_niveau")
      .notNull()
      .references(() => niveau.idNiveau),
    idVersion: smallint("id_version")
      .notNull()
      .references(() => versionRegles.idVersion),
    dateDebut: timestamp("date_debut", { withTimezone: true }).notNull().defaultNow(),
    dateFin: timestamp("date_fin", { withTimezone: true }),
    statut: statutPartie("statut").notNull().default("en_cours"),
    scoreFinal: integer("score_final"),
    meilleurCombo: smallint("meilleur_combo").notNull().default(0),
  },
  (t) => [
    check("partie_dates_check", sql`${t.dateFin} is null or ${t.dateFin} >= ${t.dateDebut}`),
    check("partie_score_check", sql`(${t.statut} = 'terminee') = (${t.scoreFinal} is not null)`),
    check("partie_score_positive_check", sql`${t.scoreFinal} is null or ${t.scoreFinal} >= 0`),
    index("partie_classement_idx")
      .on(t.idNiveau, t.scoreFinal.desc())
      .where(sql`${t.statut} = 'terminee'`),
    index("partie_joueur_idx").on(t.idJoueur),
    // A player has at most one game in progress.
    uniqueIndex("partie_en_cours_uniq")
      .on(t.idJoueur)
      .where(sql`${t.statut} = 'en_cours'`),
  ],
).enableRLS();
