CREATE TYPE "public"."statut_partie" AS ENUM('en_cours', 'terminee', 'abandonnee');--> statement-breakpoint
CREATE TABLE "joueur" (
	"id_joueur" uuid PRIMARY KEY NOT NULL,
	"pseudo" varchar(16) NOT NULL,
	"date_creation" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "joueur" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "niveau" (
	"id_niveau" smallint PRIMARY KEY NOT NULL,
	"numero" smallint NOT NULL,
	"nom" varchar(40) NOT NULL,
	CONSTRAINT "niveau_numero_unique" UNIQUE("numero"),
	CONSTRAINT "niveau_numero_check" CHECK ("niveau"."numero" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "niveau" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "partie" (
	"id_partie" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_joueur" uuid NOT NULL,
	"id_niveau" smallint NOT NULL,
	"id_version" smallint NOT NULL,
	"date_debut" timestamp with time zone DEFAULT now() NOT NULL,
	"date_fin" timestamp with time zone,
	"statut" "statut_partie" DEFAULT 'en_cours' NOT NULL,
	"score_final" integer,
	"meilleur_combo" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "partie_dates_check" CHECK ("partie"."date_fin" is null or "partie"."date_fin" >= "partie"."date_debut"),
	CONSTRAINT "partie_score_check" CHECK (("partie"."statut" = 'terminee') = ("partie"."score_final" is not null)),
	CONSTRAINT "partie_score_positive_check" CHECK ("partie"."score_final" is null or "partie"."score_final" >= 0)
);
--> statement-breakpoint
ALTER TABLE "partie" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "version_regles" (
	"id_version" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "version_regles_id_version_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"nom" varchar(40) NOT NULL,
	"duree_partie_secondes" integer NOT NULL,
	CONSTRAINT "version_regles_nom_unique" UNIQUE("nom"),
	CONSTRAINT "version_regles_duree_check" CHECK ("version_regles"."duree_partie_secondes" > 0)
);
--> statement-breakpoint
ALTER TABLE "version_regles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "joueur" ADD CONSTRAINT "joueur_id_joueur_users_id_fk" FOREIGN KEY ("id_joueur") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partie" ADD CONSTRAINT "partie_id_joueur_joueur_id_joueur_fk" FOREIGN KEY ("id_joueur") REFERENCES "public"."joueur"("id_joueur") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partie" ADD CONSTRAINT "partie_id_niveau_niveau_id_niveau_fk" FOREIGN KEY ("id_niveau") REFERENCES "public"."niveau"("id_niveau") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partie" ADD CONSTRAINT "partie_id_version_version_regles_id_version_fk" FOREIGN KEY ("id_version") REFERENCES "public"."version_regles"("id_version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "joueur_pseudo_lower_idx" ON "joueur" USING btree (lower("pseudo"));--> statement-breakpoint
CREATE INDEX "partie_classement_idx" ON "partie" USING btree ("id_niveau","score_final" DESC NULLS LAST) WHERE "partie"."statut" = 'terminee';--> statement-breakpoint
CREATE INDEX "partie_joueur_idx" ON "partie" USING btree ("id_joueur");--> statement-breakpoint
-- Seed: the 5 levels (id = numero) and the first rules version. Names and duration are placeholders.
INSERT INTO "niveau" ("id_niveau", "numero", "nom") VALUES
	(1, 1, 'Niveau 1'),
	(2, 2, 'Niveau 2'),
	(3, 3, 'Niveau 3'),
	(4, 4, 'Niveau 4'),
	(5, 5, 'Niveau 5');--> statement-breakpoint
INSERT INTO "version_regles" ("nom", "duree_partie_secondes") VALUES ('v1', 180);
