-- 部屋ステータス自動同期が論理削除（voided）契約を「アクティブ」とみなさないよう修正する。
--
-- 背景:
--   契約を論理削除すると status は 'active' のまま voided_at だけが立つ。
--   _recalc_unit_status は status='active' の存在だけで occupied 判定していたため、
--   voided 契約が残る部屋がいつまでも occupied になり、空室一覧・稼働率から漏れていた。
--   has_active 判定に voided_at IS NULL を足して、生きている契約だけを数える。
--
-- trg_sync_unit_status は contracts の UPDATE でも発火するので、voided_at を立てる
-- UPDATE のたびに本関数が呼ばれ、部屋ステータスが正しく vacant へ戻る。

CREATE OR REPLACE FUNCTION public._recalc_unit_status(p_unit_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  has_active boolean;
  current_status text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.contracts
    WHERE unit_id = p_unit_id AND status = 'active'
      AND voided_at IS NULL   -- 論理削除（取り消し）済みの契約は数えない
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
$function$;
