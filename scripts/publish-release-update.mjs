import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const runGit = (args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()

const parseVersion = (value) => {
  const match = value.match(/^v?(\d+)\.(\d+)\.(\d+)/)

  if (!match) {
    return null
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

const getReleaseType = (currentVersion, previousVersion) => {
  if (!previousVersion) {
    return 'minor'
  }

  if (currentVersion.major > previousVersion.major) {
    return 'major'
  }

  if (currentVersion.minor > previousVersion.minor) {
    return 'minor'
  }

  return 'patch'
}

const getLatestChangelogSection = (version) => {
  try {
    const changelog = readFileSync('CHANGELOG.md', 'utf8')
    const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const headingPattern = new RegExp(
      `^## .*${escapedVersion}.*$([\\s\\S]*?)(?=^##\\s|\\s*$)`,
      'm'
    )
    const match = changelog.match(headingPattern)

    return match?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const version = packageJson.version
const releaseTag = `v${version}`
const tagsAtHead = runGit(['tag', '--points-at', 'HEAD'])
  .split(/\r?\n/)
  .filter(Boolean)

if (!tagsAtHead.includes(releaseTag)) {
  console.log('[release-update] No release tag on HEAD, skipping Supabase RPC')
  process.exit(0)
}

const currentVersion = parseVersion(version)

if (!currentVersion) {
  throw new Error(`Cannot parse package version: ${version}`)
}

const previousTag = runGit(['tag', '--sort=-v:refname'])
  .split(/\r?\n/)
  .filter((tag) => tag && tag !== releaseTag)
  .find((tag) => parseVersion(tag))
const previousVersion = previousTag ? parseVersion(previousTag) : null
const releaseType = getReleaseType(currentVersion, previousVersion)
const body =
  getLatestChangelogSection(version) ||
  `Вышла новая версия CheckMate ${version}. Откройте раздел обновлений, чтобы посмотреть детали.`
const title = `CheckMate ${version}`
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to publish release notifications'
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const { data, error } = await supabase.rpc('publish_app_update', {
  p_version: version,
  p_type: releaseType,
  p_title: title,
  p_body: body,
})

if (error) {
  console.error('[release-update] Supabase RPC failed:', error)
  throw error
}

console.log('[release-update] Published app update notification:', {
  appUpdateId: data,
  version,
  releaseType,
})
