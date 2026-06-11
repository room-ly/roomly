-- デモを触った担当者が決済者にRoomlyを共有した操作のログ。
-- 「共有モーダルを開いた」「Roomlyからメール送信」「自分で送る用にコピー」を記録する。
-- demo_clicks と同じ思想（サーバー側で確実に記録、GA4ブロック対策）。

CREATE TABLE IF NOT EXISTS "public"."demo_share_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project" "text" DEFAULT 'roomly'::"text" NOT NULL,
    -- action: 'open'（モーダルを開いた）/ 'email_sent'（Roomlyから送信）/ 'copied'（自分で送る用にコピー）
    "action" "text" NOT NULL,
    -- メール送信時のみ。決済者アドレスはハッシュ等せず保存（社内リード把握のため）
    "recipient_email" "text" DEFAULT ''::"text",
    "ip" "text" DEFAULT ''::"text",
    "country" "text" DEFAULT ''::"text",
    "region" "text" DEFAULT ''::"text",
    "city" "text" DEFAULT ''::"text",
    "user_agent" "text" DEFAULT ''::"text",
    "referrer" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "demo_share_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."demo_share_events" OWNER TO "postgres";

ALTER TABLE "public"."demo_share_events" ENABLE ROW LEVEL SECURITY;

-- anon/authenticated からの INSERT を許可（API は service_role 経由だが demo_clicks に揃える）
CREATE POLICY "anon_insert_demo_share_events" ON "public"."demo_share_events"
    FOR INSERT TO "anon" WITH CHECK (true);
CREATE POLICY "authenticated_insert_demo_share_events" ON "public"."demo_share_events"
    FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "authenticated_select_demo_share_events" ON "public"."demo_share_events"
    FOR SELECT TO "authenticated" USING (true);

GRANT ALL ON TABLE "public"."demo_share_events" TO "anon";
GRANT ALL ON TABLE "public"."demo_share_events" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_share_events" TO "service_role";

CREATE INDEX IF NOT EXISTS "demo_share_events_created_at_idx"
    ON "public"."demo_share_events" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "demo_share_events_action_idx"
    ON "public"."demo_share_events" ("action");
