const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const IconHome = ({ active }) => (
  <svg {...base}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} /></svg>
)
export const IconCamera = ({ active, size = 24 }) => (
  <svg {...base} width={size} height={size}><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" fill={active ? 'currentColor' : 'none'} /><circle cx="12" cy="13" r="3.5" fill={active ? 'var(--ground)' : 'none'} /></svg>
)
export const IconChat = ({ active }) => (
  <svg {...base}><path d="M4 5h16v11H9l-5 4z" fill={active ? 'currentColor' : 'none'} /></svg>
)
export const IconFriends = ({ active }) => (
  <svg {...base}><circle cx="9" cy="9" r="3" fill={active ? 'currentColor' : 'none'} /><path d="M3.5 19c.8-3 2.9-4.5 5.5-4.5s4.7 1.5 5.5 4.5" /><circle cx="16.5" cy="8" r="2.5" /><path d="M16 13.5c2.3.1 3.9 1.5 4.5 4" /></svg>
)
export const IconTrophy = ({ active }) => (
  <svg {...base}><path d="M8 4h8v5a4 4 0 0 1-8 0z" fill={active ? 'currentColor' : 'none'} /><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3" /><path d="M12 13v4M8.5 20h7" /></svg>
)
export const IconBack = () => <svg {...base} strokeWidth={1.8}><path d="M20 12H5M11 6l-6 6 6 6" /></svg>
export const IconArrow = () => <svg {...base} width={20} height={20} strokeWidth={1.8}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
export const IconSend = () => <svg {...base} width={20} height={20} strokeWidth={1.9}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
export const IconCheck = () => <svg {...base} width={14} height={14} viewBox="0 0 14 14" strokeWidth={1.8}><path d="M3 7.2l2.6 2.6L11 4.4" /></svg>
export const IconHeart = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z" /></svg>
)
export const IconPlus = () => <svg {...base} width={20} height={20}><path d="M12 5v14M5 12h14" /></svg>
export const IconClose = () => <svg {...base} width={20} height={20}><path d="M6 6l12 12M18 6L6 18" /></svg>
