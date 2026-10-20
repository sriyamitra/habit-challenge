import { NavLink } from 'react-router-dom'
import { IconHome, IconCamera, IconChat, IconFriends, IconTrophy } from './Icons'

const TABS = [
  { to: '', end: true, label: 'Challenge', Icon: IconHome },
  { to: 'checkin', label: 'Check-in', Icon: IconCamera },
  { to: 'chat', label: 'Chat', Icon: IconChat },
  { to: 'friends', label: 'Friends', Icon: IconFriends },
  { to: 'wager', label: 'Wager', Icon: IconTrophy },
]

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Challenge sections">
      {TABS.map(({ to, end, label, Icon }) => (
        <NavLink key={label} to={to} end={end} className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
          {({ isActive }) => (
            <>
              <Icon active={isActive} />
              <span className="mono">{label.toUpperCase()}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
