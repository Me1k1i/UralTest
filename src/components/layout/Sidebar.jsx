import { useDispatch, useSelector } from 'react-redux';
import { PackageSearch, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { WORKPLACES } from '@/config/workplaces.js';
import { selectActiveWorkplace, setActiveWorkplace } from '@/store/workplaceSlice.js';
import './Sidebar.scss';

export default function Sidebar({ collapsed, onToggle }) {
  const dispatch = useDispatch();
  const activeWorkplace = useSelector(selectActiveWorkplace);
  const toggleLabel = collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель';

  return (
    <aside
      id="workplace-sidebar"
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label="Боковая навигация"
    >
      <div className="sidebar__controls">
        <button
          type="button"
          className="btn sidebar__collapse"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          {collapsed
            ? <PanelLeftOpen size={20} strokeWidth={1.7} aria-hidden="true" />
            : <PanelLeftClose size={20} strokeWidth={1.7} aria-hidden="true" />}
        </button>
      </div>
      <nav className="sidebar__navigation" aria-label="Навигация по приложению">
        {WORKPLACES.map((workplace) => {
          const active = activeWorkplace.id === workplace.id;
          return (
            <button
              key={workplace.id}
              type="button"
              className={`sidebar__item${active ? ' sidebar__item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={workplace.title}
              title={collapsed ? workplace.title : undefined}
              onClick={() => dispatch(setActiveWorkplace(workplace.id))}
            >
              <PackageSearch className="sidebar__icon" size={21} strokeWidth={1.7} aria-hidden="true" />
              <span className="sidebar__item-content" aria-hidden={collapsed}>
                <span className="sidebar__item-title">{workplace.title}</span>
                <span className="sidebar__item-description">{workplace.description}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
