export const AVATAR_COLOR_POOL = [
  '#e6a532', '#228be6', '#7950f2', '#12b886', '#e64980',
  '#f76707', '#15aabf', '#82c91e', '#be4bdb', '#4263eb',
  '#fd7e14', '#20c997', '#d6336c', '#1098ad', '#5c940d',
  '#9c36b5', '#2b8a3e', '#e8590c', '#1c7ed6', '#ae3ec9',
  '#0ca678', '#f06595', '#3b5bdb', '#66a80f', '#e03131',
  '#0c8599', '#845ef7', '#2f9e44', '#c2255c', '#1971c2',
  '#7048e8', '#099268', '#f03e3e', '#1864ab', '#862e9c',
  '#37b24d', '#d9480f', '#4dabf7', '#9775fa', '#38d9a9',
  '#ff6b6b', '#3bc9db', '#a9e34b', '#da77f2', '#fcc419',
  '#748ffc', '#63e6be', '#ff8787', '#66d9e8', '#c0eb75',
]

const FALLBACK_COLOR = '#868e96'

export function getAvatarColor(colorSlot: number | null | undefined): string {
  if (colorSlot == null) return FALLBACK_COLOR
  return AVATAR_COLOR_POOL[colorSlot % AVATAR_COLOR_POOL.length]
}

export function getInitials(
  firstName?: string,
  lastName?: string,
  email?: string,
): string {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase()
  }
  if (firstName && firstName.length >= 2) {
    return firstName.slice(0, 2).toUpperCase()
  }
  if (email && email.length >= 2) {
    return email.slice(0, 2).toUpperCase()
  }
  return ''
}
