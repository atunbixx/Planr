create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from my_new_schema.user_profiles
    where "userId" = uid::text
      and role::text in ('OWNER','ADMIN','SUPPORT','MODERATOR')
  );
$$;
