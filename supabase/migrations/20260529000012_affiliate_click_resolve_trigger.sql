-- affiliate_clicks insertトリガ: codeからaffiliate_idを解決して埋める
-- anonからaffiliate_idのみ書ければOKで、codeはhpから受け取ってトリガが解決する

create or replace function public.resolve_affiliate_click()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.affiliate_id is null and new.code is not null then
    select id into new.affiliate_id
    from public.affiliates
    where code = new.code
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_resolve_affiliate_click on public.affiliate_clicks;
create trigger trg_resolve_affiliate_click
  before insert on public.affiliate_clicks
  for each row execute function public.resolve_affiliate_click();
