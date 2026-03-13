import {
  Cloud,
  CloudOff,
  RefreshCw,
  RotateCcw,
  Settings,
  Shuffle,
  ShoppingCart,
} from "lucide-react";

type AppHeaderProps = {
  dbProvider: "sqlite" | "supabase" | null;
  isSyncing: boolean;
  syncError: boolean;
  onOpenShop: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
};

export function AppHeader({
  dbProvider,
  isSyncing,
  syncError,
  onOpenShop,
  onReset,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header className="top-nav px-3 py-2.5 lg:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[2px] border-2 border-[#ae8407] bg-[var(--color-snes-gold)] shadow-[3px_3px_0px_rgba(0,0,0,0.85)]">
            <Shuffle className="h-4.5 w-4.5 text-slate-950" />
          </div>
          <div>
            <h1 className="pixel-text text-[12px] text-[var(--color-snes-gold)] md:text-[15px]">
              DEVGACHA
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
          <button
            onClick={onOpenShop}
            className="top-nav-button-neutral"
            title="Loja do Setor"
          >
            <span className="top-nav-button-icon">
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
            </span>
            <span>Loja</span>
          </button>
          <button
            onClick={onReset}
            className="top-nav-button-danger"
            title="Reset Geral"
          >
            <span className="top-nav-button-icon">
              <RotateCcw className="w-3.5 h-3.5 text-white" />
            </span>
            <span>Reset Geral</span>
          </button>
          <div className="top-nav-button-cloud">
            {isSyncing ? (
              <>
                <span className="top-nav-button-icon">
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                </span>
                <span className="text-yellow-400">Sincronizando</span>
              </>
            ) : syncError ? (
              <>
                <span className="top-nav-button-icon">
                  <CloudOff className="w-3.5 h-3.5 text-red-500" />
                </span>
                <span className="text-red-500">Offline</span>
              </>
            ) : (
              <>
                <span className="top-nav-button-icon">
                  <div className="relative">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                  </div>
                </span>
                <span className="text-emerald-400">
                  Nuvem {dbProvider ? `(${dbProvider})` : ""}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1 text-[var(--color-snes-gold)] hover:rotate-90 transition-transform"
            title="Configurações"
          >
            <Settings className="h-7 w-7" />
          </button>
        </div>
      </div>
    </header>
  );
}
