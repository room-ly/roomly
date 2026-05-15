-- ログイン試行回数追跡テーブル
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  ip_address text
);

CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);

-- 古いレコードを自動削除（24時間経過）
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE attempted_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_cleanup_login_attempts
  AFTER INSERT ON public.login_attempts
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_login_attempts();

-- RLSは無効（サーバーサイドのservice_roleでのみ操作するため）
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- service_roleのみアクセス可
CREATE POLICY "service_role_only" ON public.login_attempts
  FOR ALL USING (auth.role() = 'service_role');
