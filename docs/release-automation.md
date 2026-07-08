# Release automation

CheckMate uses Conventional Commits, semantic-release, GitHub Actions, and Supabase notifications to publish user-facing release updates.

## Commit messages

Use Conventional Commits:

```text
fix: correct modifier saving
feat: add universal modifiers
feat!: change order status model
```

Version rules:

- `fix: ...` creates a patch release, for example `0.3.1`.
- `feat: ...` creates a minor release, for example `0.4.0`.
- `feat!: ...` or a `BREAKING CHANGE:` footer creates a major release, for example `1.0.0`.
- `chore:`, `docs:`, `style:`, and `refactor:` do not create a user release unless semantic-release determines they should.

## GitHub secrets

Add these repository secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`GITHUB_TOKEN` is provided by GitHub Actions automatically.

The service role key is used only in GitHub Actions by `scripts/publish-release-update.mjs`. It must never be added to frontend env files.

## Flow

On push to `main`, `.github/workflows/release.yml` runs:

```text
npm ci
npm run lint
npx tsc -b
npm run build
npx semantic-release
node scripts/publish-release-update.mjs
```

If semantic-release creates a new tag for the current commit, the script calls:

```sql
select public.publish_app_update(
  p_version := '0.3.0',
  p_type := 'minor',
  p_title := 'CheckMate 0.3.0',
  p_body := 'Release notes...'
);
```

The RPC inserts a row into `public.app_updates` and one `public.notifications` row for each user. Existing Web Push delivery works from the `notifications` insert.

## Manual RPC check

Run in Supabase SQL editor:

```sql
select public.publish_app_update(
  p_version := '0.0.0-test',
  p_type := 'patch',
  p_title := 'CheckMate 0.0.0-test',
  p_body := 'Тестовое уведомление релиза'
);
```

Then open `/notifications` and check:

- the personal notification appears in `Личные`;
- the update appears in `Обновления`;
- unread badges update in Profile and bottom navigation.

## Rollback if a wrong notification was sent

Find the update:

```sql
select id, version, title, created_at
from public.app_updates
order by created_at desc;
```

Hide it from the updates tab:

```sql
update public.app_updates
set is_published = false
where id = 'APP_UPDATE_ID';
```

Optionally mark generated notifications as read:

```sql
update public.notifications
set read_at = now()
where app_update_id = 'APP_UPDATE_ID'
  and read_at is null;
```
