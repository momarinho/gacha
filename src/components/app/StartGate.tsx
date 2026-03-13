import { useState } from "react";

type StartGateProps = {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (password: string) => Promise<void> | void;
};

export function StartGate({
  isSubmitting,
  error,
  onSubmit,
}: StartGateProps) {
  const [started, setStarted] = useState(false);
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="start-gate-shell w-full max-w-3xl">
        <div className="start-gate-frame">
          <div className="text-center">
            <p className="snes-ui-text text-[1.1rem] text-white/70">
              DEVGACHA SECURITY SYSTEM
            </p>
            <h1 className="pixel-text mt-6 text-[16px] text-[var(--color-snes-gold)] md:text-[22px]">
              PRESS START
            </h1>
            <p className="pixel-text mt-6 text-[8px] leading-6 text-white/55">
              ACESSO RESTRITO AO SETOR.
              <br />
              INSIRA A SENHA PARA CONTINUAR.
            </p>
          </div>

          {!started ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="start-gate-button"
              >
                START
              </button>
            </div>
          ) : (
            <form
              className="mx-auto mt-10 max-w-md space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await onSubmit(password);
              }}
            >
              <label className="block">
                <span className="snes-ui-text mb-2 block text-[1rem] text-white/80">
                  SENHA DE ACESSO
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="start-gate-input"
                  placeholder="••••••••"
                  autoFocus
                />
              </label>

              {error ? (
                <div className="snes-ui-text border-2 border-red-300 bg-red-950/60 px-4 py-3 text-[1rem] text-red-100">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || password.trim().length === 0}
                  className="start-gate-button disabled:rpg-button-disabled"
                >
                  {isSubmitting ? "VALIDANDO..." : "ENTRAR"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStarted(false);
                    setPassword("");
                  }}
                  className="start-gate-button-secondary"
                >
                  VOLTAR
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
