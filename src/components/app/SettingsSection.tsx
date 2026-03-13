import { Settings } from "lucide-react";

type SettingsSectionProps = {
  dbProvider: "sqlite" | "supabase" | null;
  isSyncing: boolean;
  syncError: boolean;
  profilesCount: number;
  battleLogsCount: number;
  onResetVisualState: () => void;
  onClearLocalState: () => void;
  onClearScreenLogs: () => void;
};

export function SettingsSection({
  dbProvider,
  isSyncing,
  syncError,
  profilesCount,
  battleLogsCount,
  onResetVisualState,
  onClearLocalState,
  onClearScreenLogs,
}: SettingsSectionProps) {
  return (
    <section className="glass-card flex min-h-[420px] flex-col p-5 lg:min-h-[calc(100vh-170px)] lg:p-6">
      <div className="mb-6 flex items-center justify-between border-b-2 border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Settings className="h-5 w-5 text-[var(--color-snes-gold)]" />
          </div>
          <div>
            <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
              CONFIGURAÇÕES
            </h2>
            <p className="pixel-text mt-2 text-[7px] text-white/55">
              STATUS DO SISTEMA E CONTROLES RÁPIDOS
            </p>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            STATUS
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3">
              <span className="pixel-text text-[7px] text-white/60">
                Banco ativo
              </span>
              <span className="pixel-text text-[7px] text-white">
                {dbProvider || "indefinido"}
              </span>
            </div>
            <div className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3">
              <span className="pixel-text text-[7px] text-white/60">
                Sincronização
              </span>
              <span className="pixel-text text-[7px] text-white">
                {isSyncing ? "sincronizando" : syncError ? "offline" : "ok"}
              </span>
            </div>
            <div className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3">
              <span className="pixel-text text-[7px] text-white/60">
                Participantes
              </span>
              <span className="pixel-text text-[7px] text-white">
                {profilesCount}
              </span>
            </div>
            <div className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3">
              <span className="pixel-text text-[7px] text-white/60">
                Logs na tela
              </span>
              <span className="pixel-text text-[7px] text-white">
                {battleLogsCount}
              </span>
            </div>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            AÇÕES
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={onResetVisualState}
              className="snes-ui-text border-2 border-white bg-red-900/80 px-4 py-3 text-white hover:bg-red-800"
            >
              LIMPAR SORTEIOS DA TELA
            </button>
            <button
              type="button"
              onClick={onClearLocalState}
              className="snes-ui-text border-2 border-white bg-slate-900 px-4 py-3 text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
            >
              LIMPAR ESTADO LOCAL
            </button>
            <button
              type="button"
              onClick={onClearScreenLogs}
              className="snes-ui-text border-2 border-white bg-slate-900 px-4 py-3 text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
            >
              LIMPAR LOGS DA TELA
            </button>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4 xl:col-span-2">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            NOTAS
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Reset Geral limpa apenas vencedores visuais e o estado exibido dos
              sorteios, sem remover participantes.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Limpar estado local apaga apenas o cache visual salvo no
              navegador.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Para limpar dados reais, perfis e histórico do banco, continue
              usando SQL no Supabase.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
