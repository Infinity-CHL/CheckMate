import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Camera, ChevronRight, Eye, EyeOff, LogOut } from 'lucide-react'

import { UserNiceAvatar } from '@/components/UserNiceAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/useAuth'
import { pushNotificationsApi } from '@/features/notifications/api/pushNotificationsApi'
import { useUnreadNotificationsCount } from '@/features/notifications/hooks/useUnreadNotificationsCount'
import { supabase } from '@/shared/api/supabase'

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  waiter: 'Официант',
}

const gradeLabels: Record<string, string> = {
  intern: 'Стажёр',
  assistant: 'Помощник официанта',
  junior: 'Новичок',
  professional: 'Профессионал',
  expert_mentor: 'Эксперт-наставник',
}

const fallbackNames = [
  'Быстрый Поднос',
  'Ловкий Заказ',
  'Чёткий Официант',
  'Мастер Сервиса',
  'Капитан Столов',
]

const splitFullName = (fullName: string | null | undefined) => {
  const trimmedName = fullName?.trim() ?? ''
  const [firstName = '', ...lastNameParts] = trimmedName.split(' ')

  return {
    firstName,
    lastName: lastNameParts.join(' '),
  }
}

const buildFullName = (firstName: string, lastName: string) =>
  `${firstName.trim()} ${lastName.trim()}`.trim()

const getStableIndex = (value: string, length: number) => {
  const hash = Array.from(value).reduce(
    (currentHash, char) => currentHash + char.charCodeAt(0),
    0
  )

  return hash % length
}

const getLabel = (
  value: string | null | undefined,
  labels: Record<string, string>,
  fallback = 'Не указан'
) => {
  if (!value) {
    return fallback
  }

  return labels[value] ?? value
}

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  placeholder: string
  isVisible: boolean
  setIsVisible: Dispatch<SetStateAction<boolean>>
  onChange: (value: string) => void
}

const PasswordField = ({
  id,
  label,
  value,
  placeholder,
  isVisible,
  setIsVisible,
  onChange,
}: PasswordFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 pr-11"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2"
        onClick={() => setIsVisible((currentValue) => !currentValue)}
        aria-label={isVisible ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
)

export const ProfilePage = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const initialName = splitFullName(profile?.full_name)

  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(initialName.firstName)
  const [lastName, setLastName] = useState(initialName.lastName)
  const [savedFullName, setSavedFullName] = useState(profile?.full_name ?? '')
  const [savedAvatarUrl, setSavedAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>('default')
  const [isPushSubscribed, setIsPushSubscribed] = useState(false)
  const [isPushSaving, setIsPushSaving] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  useEffect(() => {
    if (!avatarPreview) {
      return
    }

    return () => {
      URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  useEffect(() => {
    const supported = pushNotificationsApi.isPushSupported()

    setIsPushSupported(supported)

    if (!supported) {
      return
    }

    setPushPermission(pushNotificationsApi.getNotificationPermission())

    pushNotificationsApi
      .getExistingSubscription()
      .then((subscription) => setIsPushSubscribed(Boolean(subscription)))
      .catch((err) => {
        console.error('ProfilePage getExistingSubscription error:', err)
      })
  }, [])

  const fallbackName = useMemo(() => {
    const seed = user?.id || user?.email || 'CheckMate'

    return fallbackNames[getStableIndex(seed, fallbackNames.length)]
  }, [user?.email, user?.id])

  const displayName = savedFullName.trim() || fallbackName
  const email = user?.email ?? 'Почта не указана'
  const role = getLabel(profile?.role, roleLabels)
  const grade = getLabel(profile?.grade, gradeLabels, 'Новичок')
  const avatarSeed = user?.id || user?.email || savedFullName.trim() || fallbackName
  const avatarImageUrl = avatarPreview ?? savedAvatarUrl
  const { count: unreadNotificationsCount } = useUnreadNotificationsCount(
    user?.id
  )

  const resetEditState = () => {
    const currentName = splitFullName(savedFullName)

    setFirstName(currentName.firstName)
    setLastName(currentName.lastName)
    setAvatarFile(null)
    setAvatarPreview(null)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
  }

  const handleEdit = () => {
    resetEditState()
    setMessage(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    resetEditState()
    setIsEditing(false)
  }

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) {
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      return
    }

    const nextFullName = buildFullName(firstName, lastName)
    const currentEmail = user.email ?? ''
    const shouldChangePassword =
      Boolean(oldPassword) || Boolean(newPassword) || Boolean(confirmPassword)

    setError(null)
    setMessage(null)

    if (!firstName.trim()) {
      setError('Укажите имя')
      return
    }

    if (shouldChangePassword) {
      if (!currentEmail) {
        setError('Не удалось проверить текущую почту')
        return
      }

      if (!oldPassword) {
        setError('Введите старый пароль')
        return
      }

      if (newPassword.length < 6) {
        setError('Новый пароль должен быть не короче 6 символов')
        return
      }

      if (newPassword !== confirmPassword) {
        setError('Пароли не совпадают')
        return
      }
    }

    setIsSaving(true)

    let nextAvatarUrl = savedAvatarUrl

    if (avatarFile) {
      const avatarPath = `${user.id}/avatar-${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, avatarFile, {
          contentType: avatarFile.type,
        })

      if (uploadError) {
        console.error('Avatar upload error:', uploadError)
        setError('Не удалось загрузить аватар')
        setIsSaving(false)
        return
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarPath)

      nextAvatarUrl = data.publicUrl
    }

    if (shouldChangePassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: oldPassword,
      })

      if (signInError) {
        console.error('Password verification error:', signInError)
        setError('Старый пароль указан неверно')
        setIsSaving(false)
        return
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (passwordError) {
        console.error('Password update error:', passwordError)
        setError('Не удалось сменить пароль')
        setIsSaving(false)
        return
      }
    }

    const shouldUpdateProfile =
      nextFullName !== (profile?.full_name ?? '') || nextAvatarUrl !== savedAvatarUrl

    if (shouldUpdateProfile) {
      const { data, error: profileError } = await supabase
        .from('users')
        .update({
          full_name: nextFullName,
          avatar_url: nextAvatarUrl || null,
        })
        .eq('id', user.id)
        .select('full_name, avatar_url')
        .maybeSingle()

      if (profileError) {
        console.error('Profile update error:', profileError)
        setError('Не удалось сохранить профиль')
        setIsSaving(false)
        return
      }

      setSavedFullName(data?.full_name ?? nextFullName)
      setSavedAvatarUrl(data?.avatar_url ?? nextAvatarUrl)
    }

    setAvatarFile(null)
    setAvatarPreview(null)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setIsSaving(false)
    setIsEditing(false)
    setMessage('Изменения сохранены')
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleEnablePush = async () => {
    if (!user) {
      return
    }

    try {
      setIsPushSaving(true)
      setPushError(null)
      await pushNotificationsApi.subscribeToPush(user.id)
      setPushPermission(pushNotificationsApi.getNotificationPermission())
      setIsPushSubscribed(true)
    } catch (err) {
      console.error('ProfilePage handleEnablePush error:', err)
      setPushPermission(pushNotificationsApi.getNotificationPermission())
      setPushError(
        err instanceof Error
          ? err.message
          : 'Не удалось включить push-уведомления'
      )
    } finally {
      setIsPushSaving(false)
    }
  }

  const handleDisablePush = async () => {
    if (!user) {
      return
    }

    try {
      setIsPushSaving(true)
      setPushError(null)
      await pushNotificationsApi.unsubscribeFromPush(user.id)
      setIsPushSubscribed(false)
      setPushPermission(pushNotificationsApi.getNotificationPermission())
    } catch (err) {
      console.error('ProfilePage handleDisablePush error:', err)
      setPushError(
        err instanceof Error
          ? err.message
          : 'Не удалось отключить push-уведомления'
      )
    } finally {
      setIsPushSaving(false)
    }
  }

  const isAppleMobile =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true))
  const shouldShowIosHint =
    isAppleMobile && (!isPushSupported || !isStandalone)

  return (
    <div className="container mx-auto p-4">
      <div className="mx-auto grid max-w-2xl gap-4">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg">Сотрудник</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form className="space-y-5" onSubmit={handleSave}>
                <div className="flex justify-center">
                  <div className="relative h-28 w-28">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-muted">
                      {avatarImageUrl ? (
                        <img
                          src={avatarImageUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserNiceAvatar seed={avatarSeed} size={112} />
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      className="absolute bottom-0 left-1/2 h-11 w-11 -translate-x-1/2 translate-y-1/3 rounded-full shadow-md"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Загрузить аватар"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleAvatarChange(event.target.files?.[0])}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-3">
                  <Badge variant="secondary">{role}</Badge>
                  <Badge variant="outline">{grade}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Имя *</Label>
                    <Input
                      id="first_name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Имя"
                      className="min-h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Фамилия</Label>
                    <Input
                      id="last_name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Фамилия"
                      className="min-h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Почта</Label>
                  <p className="min-h-11 rounded-xl border border-input/80 bg-background/70 px-2.5 py-3 text-sm text-muted-foreground shadow-sm">
                    {email}
                  </p>
                </div>

                <div className="grid gap-3">
                  <PasswordField
                    id="old_password"
                    label="Старый пароль"
                    value={oldPassword}
                    placeholder="Текущий пароль"
                    isVisible={showOldPassword}
                    setIsVisible={setShowOldPassword}
                    onChange={setOldPassword}
                  />
                  <PasswordField
                    id="new_password"
                    label="Новый пароль"
                    value={newPassword}
                    placeholder="Минимум 6 символов"
                    isVisible={showNewPassword}
                    setIsVisible={setShowNewPassword}
                    onChange={setNewPassword}
                  />
                  <PasswordField
                    id="confirm_password"
                    label="Повтор нового пароля"
                    value={confirmPassword}
                    placeholder="Повторите новый пароль"
                    isVisible={showConfirmPassword}
                    setIsVisible={setShowConfirmPassword}
                    onChange={setConfirmPassword}
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="submit"
                    className="min-h-11 w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 text-center">
                <div className="flex justify-center">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {savedAvatarUrl ? (
                      <img
                        src={savedAvatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserNiceAvatar seed={avatarSeed} size={112} />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">{role}</Badge>
                  <Badge variant="outline">{grade}</Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-lg font-semibold">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>

                {message && (
                  <p className="text-sm text-muted-foreground">{message}</p>
                )}

                {profile?.role === 'admin' && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11 w-full"
                    onClick={() => navigate('/admin/employees')}
                  >
                    Управление сотрудниками
                  </Button>
                )}

                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 rounded-3xl border border-white/70 bg-white/80 px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/60"
                  onClick={() => navigate('/notifications')}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Bell className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      Уведомления
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Личные события и обновления приложения
                    </span>
                  </span>
                  {unreadNotificationsCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {unreadNotificationsCount > 99
                        ? '99+'
                        : unreadNotificationsCount}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>

                <div className="rounded-3xl border border-white/70 bg-white/80 px-4 py-3 text-left shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Bell className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        Push-уведомления
                      </p>
                      {!isPushSupported ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Браузер не поддерживает push-уведомления
                        </p>
                      ) : pushPermission === 'denied' ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Уведомления заблокированы в настройках браузера
                        </p>
                      ) : pushPermission === 'granted' && isPushSubscribed ? (
                        <p className="mt-1 text-xs text-green-700">
                          Уведомления включены
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Получайте уведомления о переданных заказах даже вне приложения
                        </p>
                      )}

                      {shouldShowIosHint && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          На iPhone добавьте приложение на экран Домой, затем откройте его как приложение и включите уведомления.
                        </p>
                      )}

                      {pushError && (
                        <p className="mt-2 text-xs text-red-600">{pushError}</p>
                      )}

                      {isPushSupported &&
                        pushPermission !== 'denied' &&
                        (pushPermission === 'granted' && isPushSubscribed ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-3 min-h-10 rounded-2xl"
                            disabled={isPushSaving}
                            onClick={handleDisablePush}
                          >
                            {isPushSaving ? 'Отключение...' : 'Отключить'}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            className="mt-3 min-h-10 rounded-2xl"
                            disabled={isPushSaving}
                            onClick={handleEnablePush}
                          >
                            {isPushSaving
                              ? 'Включение...'
                              : 'Включить уведомления'}
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    className="min-h-11 w-full"
                    onClick={handleEdit}
                  >
                    Редактировать профиль
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти из аккаунта
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
