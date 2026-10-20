export const HABIT_COLORS = {
  orange: { solid: '#E8622C', glow: '232,98,44', tint: '#F3CDB0' },
  yellow: { solid: '#EDB92E', glow: '237,185,46', tint: '#F0DDA6' },
  blue: { solid: '#4A96D2', glow: '74,150,210', tint: '#C3D8E8' },
  lavender: { solid: '#A09CD6', glow: '160,156,214', tint: '#D8D5EC' },
  green: { solid: '#5BAE7C', glow: '91,174,124', tint: '#C9E2D1' },
  pink: { solid: '#E37BA6', glow: '227,123,166', tint: '#F1CFDD' },
}
export const COLOR_NAMES = Object.keys(HABIT_COLORS)
export const colorOf = (name) => HABIT_COLORS[name] || HABIT_COLORS.orange

// Member avatar colors cycle through the same palette
export const memberColor = (index) => HABIT_COLORS[COLOR_NAMES[index % COLOR_NAMES.length]].solid
