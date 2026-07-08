alter table public.notifications
  add column if not exists app_update_id uuid references public.app_updates(id) on delete set null;

alter table public.app_updates
  add column if not exists notification_sent_at timestamptz;

create or replace function public.publish_app_update(
  p_version text,
  p_type text,
  p_title text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app_update_id uuid;
  v_has_users_is_active boolean;
begin
  insert into public.app_updates (
    title,
    body,
    version,
    type,
    is_published,
    published_at,
    notification_sent_at
  )
  values (
    p_title,
    p_body,
    p_version,
    p_type,
    true,
    now(),
    now()
  )
  returning id into v_app_update_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'is_active'
  )
  into v_has_users_is_active;

  if v_has_users_is_active then
    execute $sql$
      insert into public.notifications (
        recipient_id,
        actor_id,
        type,
        title,
        body,
        order_id,
        table_number,
        payload,
        app_update_id
      )
      select
        u.id,
        null,
        'app_update',
        $1,
        $2,
        null,
        null,
        jsonb_build_object(
          'version', $3,
          'type', $4,
          'app_update_id', $5,
          'url', '/notifications'
        ),
        $5
      from public.users u
      where coalesce(u.is_active, true) = true
    $sql$
    using p_title, p_body, p_version, p_type, v_app_update_id;
  else
    insert into public.notifications (
      recipient_id,
      actor_id,
      type,
      title,
      body,
      order_id,
      table_number,
      payload,
      app_update_id
    )
    select
      u.id,
      null,
      'app_update',
      p_title,
      p_body,
      null,
      null,
      jsonb_build_object(
        'version', p_version,
        'type', p_type,
        'app_update_id', v_app_update_id,
        'url', '/notifications'
      ),
      v_app_update_id
    from public.users u;
  end if;

  return v_app_update_id;
end;
$$;

revoke all on function public.publish_app_update(text, text, text, text) from public;
grant execute on function public.publish_app_update(text, text, text, text) to service_role;
