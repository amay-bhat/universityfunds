CREATE TABLE "allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"category" text NOT NULL,
	"pct" numeric(6, 3) NOT NULL,
	"basis" text DEFAULT 'actual' NOT NULL,
	"source_label" text,
	"source_id" text NOT NULL,
	CONSTRAINT "allocations_school_id_fiscal_year_category_unique" UNIQUE("school_id","fiscal_year","category")
);
--> statement-breakpoint
CREATE TABLE "benchmark_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"series" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"return_pct" numeric(6, 3) NOT NULL,
	"source_id" text NOT NULL,
	CONSTRAINT "benchmark_returns_series_fiscal_year_unique" UNIQUE("series","fiscal_year")
);
--> statement-breakpoint
CREATE TABLE "endowment_returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"return_pct" numeric(6, 3),
	"market_value_usd_millions" numeric(12, 2),
	"return_source_id" text,
	"market_value_source_id" text,
	CONSTRAINT "endowment_returns_school_id_fiscal_year_unique" UNIQUE("school_id","fiscal_year")
);
--> statement-breakpoint
CREATE TABLE "proxy_mappings" (
	"category" text PRIMARY KEY NOT NULL,
	"etf_ticker" text NOT NULL,
	"etf_name" text NOT NULL,
	"rationale" text NOT NULL,
	"honesty_note" text NOT NULL,
	"source_id" text
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"manager_name" text,
	"website" text
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"publisher" text,
	"url" text,
	"document_type" text NOT NULL,
	"page" text,
	"accessed_date" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmark_returns" ADD CONSTRAINT "benchmark_returns_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endowment_returns" ADD CONSTRAINT "endowment_returns_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endowment_returns" ADD CONSTRAINT "endowment_returns_return_source_id_sources_id_fk" FOREIGN KEY ("return_source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endowment_returns" ADD CONSTRAINT "endowment_returns_market_value_source_id_sources_id_fk" FOREIGN KEY ("market_value_source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proxy_mappings" ADD CONSTRAINT "proxy_mappings_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;