# Release automation

CheckMate uses Conventional Commits, semantic-release, GitHub Actions, and Supabase notifications to publish release updates.

## Commit messages

Use Conventional Commits:

```text
fix: correct modifier saving
fix: repair order transfer [notify]
feat: add menu sections
feat!: change order status model
```

Version and notification rules:

- `fix: correct modifier saving` -> patch release, no user notification.
- `fix: repair order transfer [notify]` -> patch release and user notification.
- `feat: add menu sections` -> minor release and user notification.
- `feat!: change order status model` -> major release and user notification.
- `BREAKING CHANGE:` in a commit footer -> major release and user notification.
- `chore:`, `docs:`, `style:`, and `refactor:` do not notify users. If semantic-release creates no release, the Supabase publish step does nothing.

Patch releases are quiet by default because many fixes are too small or technical for every user. Add `[notify]` only for important fixes users should see.

## GitHub secrets

Add these repository secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`GITHUB_TOKEN` is provided by GitHub Actions automatically.

The service role key is used only in GitHub Actions by `scripts/publish-release-update.mjs`. It must never be added to frontend env files.

## Workflow

The workflow lives at:

```text
.github/workflows/release.yml
```

It runs on:

- push to `main`;
- manual `workflow_dispatch`.

Normal push flow:

```text
npm ci
npm run lint
npx tsc -b
npm run build
npx semantic-release
node scripts/publish-release-update.mjs
```

The publish script calls Supabase only when semantic-release created a release tag on the current commit and the release should notify users:

- `major` -> notify;
- `minor` -> notify;
- `patch` -> notify only if release notes or commit messages contain `[notify]`.

## Manual workflow test

Open GitHub Actions -> Release -> Run workflow.

Inputs:

- `notify_users`: set to `true` to send a test user notification.
- `test_title`: title for the test notification.

Manual mode still runs semantic-release. If semantic-release does not create a release and `notify_users=false`, no Supabase RPC is called. If `notify_users=true`, the script sends a test `patch` notification using the provided title.

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

## Troubleshooting

Workflow does not appear:

- Make sure `.github/workflows/release.yml` exists in the `main` branch.
- GitHub only shows workflows after the workflow file is committed to the default branch.

Workflow does not run after merge:

- Check `on.push.branches` in `.github/workflows/release.yml`; it must include `main`.
- Check that the PR was actually merged into `main`, not another branch.

No user notification after release:

- Check the release type. `fix:` creates a patch release and is quiet by default.
- For important patch releases, include `[notify]` in the commit message.
- Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist in GitHub secrets.
- Check the `Publish release notification` step logs.

Semantic-release creates no release:

- Check commit messages. `chore:`, `docs:`, `style:`, and `refactor:` usually do not create releases.
- Use `fix:`, `feat:`, or `feat!:` according to the change.

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
