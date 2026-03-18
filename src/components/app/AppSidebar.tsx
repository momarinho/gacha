import { AlertCircle, History, Settings, User, Map } from "lucide-react";

import type { AppPage } from "../../app/constants";

type AppSidebarProps = {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
};

const menuItems: Array<{
  key: Exclude<AppPage, "draws">;
  label: string;
  icon: typeof User;
}> = [
  { key: "home", label: "Participantes", icon: User },
  { key: "history", label: "Histórico", icon: History },
  { key: "roadmap", label: "Roadmap", icon: Map },
  { key: "guide", label: "Guia", icon: AlertCircle },
  { key: "settings", label: "Config", icon: Settings },
];

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  return (
    <section className="glass-card p-5">
      <h2 className="panel-title">MENU PRINCIPAL</h2>
      <ul className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.key}
              className={`menu-entry ${currentPage === item.key ? "menu-entry-active" : ""}`}
            >
              <button
                type="button"
                onClick={() => onNavigate(item.key)}
                className="flex w-full items-center gap-3 text-left"
              >
                <Icon className="h-4 w-4 text-[var(--color-snes-gold)]" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
