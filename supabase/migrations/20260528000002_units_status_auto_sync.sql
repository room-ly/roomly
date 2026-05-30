-- 区画の status を契約から自動導出する
-- active な契約があれば occupied、無ければ vacant
-- ただし reserved/maintenance は契約と無関係な状態なので、その値を持っている区画は触らない

CREATE OR REPLACE FUNCTION public.sync_unit_status_from_contracts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_unit_id uuid;
  has_active boolean;
  current_status text;
BEGIN
  -- 対象の unit_id を決定（INSERT/UPDATE は NEW、DELETE は OLD）
  IF TG_OP = 'DELETE' THEN
    target_unit_id := OLD.unit_id;
  ELSE
    target_unit_id := NEW.unit_id;
    -- UPDATE で unit_id が変わった場合は旧 unit も再評価
    IF TG_OP = 'UPDATE' AND OLD.unit_id <> NEW.unit_id THEN
      PERFORM public._recalc_unit_status(OLD.unit_id);
    END IF;
  END IF;

  PERFORM public._recalc_unit_status(target_unit_id);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public._recalc_unit_status(p_unit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_active boolean;
  current_status text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.contracts
    WHERE unit_id = p_unit_id AND status = 'active'
  ) INTO has_active;

  SELECT status INTO current_status FROM public.units WHERE id = p_unit_id;

  -- reserved / maintenance はユーザーが意図的に設定する値なので保護する
  IF current_status IN ('reserved', 'maintenance') THEN
    RETURN;
  END IF;

  UPDATE public.units
  SET status = CASE WHEN has_active THEN 'occupied' ELSE 'vacant' END,
      updated_at = now()
  WHERE id = p_unit_id
    AND status IS DISTINCT FROM CASE WHEN has_active THEN 'occupied' ELSE 'vacant' END;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_unit_status ON public.contracts;
CREATE TRIGGER trg_sync_unit_status
AFTER INSERT OR UPDATE OR DELETE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.sync_unit_status_from_contracts();

-- API から RPC 呼び出しできるように権限付与
GRANT EXECUTE ON FUNCTION public._recalc_unit_status(uuid) TO authenticated;

-- 既存データの整合を取る
DO $$
DECLARE
  u record;
BEGIN
  FOR u IN SELECT id FROM public.units WHERE status NOT IN ('reserved', 'maintenance') LOOP
    PERFORM public._recalc_unit_status(u.id);
  END LOOP;
END;
$$;
