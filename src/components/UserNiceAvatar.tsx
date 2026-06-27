import { useMemo } from 'react'
import Avatar, { genConfig } from 'react-nice-avatar'

type UserNiceAvatarProps = {
  seed: string
  size?: number
  className?: string
}

export const UserNiceAvatar = ({
  seed,
  size = 40,
  className,
}: UserNiceAvatarProps) => {
  const config = useMemo(() => genConfig(seed || 'CheckMate'), [seed])

  return (
    <Avatar
      {...config}
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
