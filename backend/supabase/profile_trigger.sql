-- Run this in the Supabase SQL editor.
-- This creates a profile row automatically when a new auth.users record is created.
-- It also ensures a confirmed user can be saved to public.profiles even if the frontend
-- sync has not run yet.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    email,
    full_name,
    avatar_url,
    role,
    bio,
    organization,
    phone,
    location,
    website,
    observations_count,
    verified_count,
    followers_count,
    following_count,
    likes_received,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    coalesce(new.raw_user_meta_data->>'role', 'citizen'),
    null,
    null,
    null,
    null,
    null,
    0,
    0,
    0,
    0,
    0,
    now(),
    now()
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(profiles.full_name, excluded.full_name),
        avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
        role = coalesce(profiles.role, excluded.role),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();
