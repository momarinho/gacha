import React, { useState, useEffect } from "react";
import { Flag, ThumbsUp, Plus, Map } from "lucide-react";
import { RoadmapItem, Profile } from "../../types";
import { api } from "../../services/api";

interface Props {
  profiles: Profile[];
}

export function RoadmapSection({ profiles }: Props) {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<RoadmapItem["status"] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      const data = await api.getRoadmap();
      setItems(data);
    } catch (error) {
      console.error("Failed to load roadmap", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProfileId) return;

    try {
      const newItems = await api.addRoadmapItem(
        title.trim(),
        description.trim(),
        selectedProfileId,
      );
      setItems(newItems);
      setActionError(null);
      setIsAdding(false);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Failed to add roadmap item", error);
    }
  };

  const handleVote = async (id: string) => {
    try {
      const newItems = await api.voteRoadmapItem(id);
      setItems(newItems);
      setActionError(null);
    } catch (error) {
      console.error("Failed to vote", error);
    }
  };

  const handleDropStatus = async (targetStatus: RoadmapItem["status"]) => {
    if (!draggingItemId) return;
    const draggedItem = items.find((item) => item.id === draggingItemId);
    if (!draggedItem || draggedItem.status === targetStatus) {
      setDraggingItemId(null);
      setDragOverStatus(null);
      return;
    }

    try {
      const newItems = await api.updateRoadmapItemStatus(draggingItemId, targetStatus);
      setItems(newItems);
      setActionError(null);
    } catch (error) {
      console.error("Failed to move roadmap item", error);
      setActionError(
        "Nao foi possivel mover a ideia. Se falhou ao ir para DESCARTADOS, aplique a migration de status no Supabase.",
      );
    } finally {
      setDraggingItemId(null);
      setDragOverStatus(null);
    }
  };

  const buildColumnClassName = (status: RoadmapItem["status"]) =>
    [
      "flex flex-col gap-3 rounded border border-transparent p-2 transition-colors",
      dragOverStatus === status
        ? "border-blue-400/70 bg-blue-500/10"
        : "bg-transparent",
    ].join(" ");

  const pendingItems = items.filter(i => i.status === "pending" || !i.status);
  const inProgressItems = items.filter(i => i.status === "in_progress");
  const doneItems = items.filter(i => i.status === "done");
  const discardedItems = items.filter(i => i.status === "discarded");

  return (
    <section className="glass-card flex min-h-[420px] flex-col p-5 lg:min-h-[calc(100vh-170px)] lg:p-6">
      <div className="mb-6 flex items-center justify-between border-b-2 border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Map className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="pixel-text text-[10px] text-blue-400">
              ROADMAP DO SETOR
            </h2>
            <p className="retro-copy-sm mt-2 text-white/75">
              O QUE O GRUPO QUER PARA O FUTURO DA EMPRESA?
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="retro-btn-emerald flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="pixel-text text-[8px]">PROPOR IDEIA</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="retro-panel mb-6 border-emerald-500/50 bg-emerald-950/20">
          <h3 className="pixel-text mb-4 text-[8px] text-emerald-400">NOVA PROPOSTA</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="pixel-text-soft text-[7px] text-emerald-200">QUEM ESTA PROPONDO?</label>
              <select
                required
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="pixel-input mt-1 w-full"
              >
                <option value="">Selecione quem propôs</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="pixel-text-soft text-[7px] text-emerald-200">TITULO DA IDEIA</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Novo item na loja"
                className="pixel-input mt-1 w-full"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="pixel-text-soft text-[7px] text-emerald-200">DESCRICAO (OPCIONAL)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva melhor como funcionaria..."
              className="pixel-input mt-1 w-full custom-scrollbar"
              rows={5}
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="retro-btn text-white/80 hover:bg-white/10"
            >
              <span className="pixel-text text-[8px]">CANCELAR</span>
            </button>
            <button type="submit" className="retro-btn-emerald">
              <span className="pixel-text text-[8px]">ENVIAR PROPOSTA</span>
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="pixel-text text-[8px] animate-pulse text-white/50">Carregando quadro...</p>
        </div>
      ) : (
        <div className="custom-scrollbar grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-2 xl:grid-cols-4">
          {actionError ? (
            <p className="retro-copy-sm col-span-full border border-rose-400/50 bg-rose-950/20 px-3 py-2 text-rose-200">
              {actionError}
            </p>
          ) : null}

          {/* TO DO */}
          <section
            className={buildColumnClassName("pending")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus("pending");
            }}
            onDragLeave={() => {
              if (dragOverStatus === "pending") setDragOverStatus(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              void handleDropStatus("pending");
            }}
          >
            <div className="border-b-2 border-white/20 pb-2">
              <h3 className="pixel-text text-[8px] text-orange-400">EM PAUTA ({pendingItems.length})</h3>
            </div>
            {pendingItems.length === 0 ? (
              <p className="retro-copy-sm mt-4 text-center text-white/40">Nenhuma ideia pendente.</p>
            ) : (
              pendingItems.map((item) => (
                <RoadmapCard
                  key={item.id}
                  item={item}
                  onVote={() => handleVote(item.id)}
                  onDragStart={() => setDraggingItemId(item.id)}
                  onDragEnd={() => {
                    setDraggingItemId(null);
                    setDragOverStatus(null);
                  }}
                />
              ))
            )}
          </section>

          {/* IN PROGRESS */}
          <section
            className={buildColumnClassName("in_progress")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus("in_progress");
            }}
            onDragLeave={() => {
              if (dragOverStatus === "in_progress") setDragOverStatus(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              void handleDropStatus("in_progress");
            }}
          >
            <div className="border-b-2 border-white/20 pb-2">
              <h3 className="pixel-text text-[8px] text-blue-400">EM ANDAMENTO ({inProgressItems.length})</h3>
            </div>
            {inProgressItems.length === 0 ? (
              <p className="retro-copy-sm mt-4 text-center text-white/40">Nada sendo feito no momento.</p>
            ) : (
              inProgressItems.map((item) => (
                <RoadmapCard
                  key={item.id}
                  item={item}
                  onVote={() => handleVote(item.id)}
                  onDragStart={() => setDraggingItemId(item.id)}
                  onDragEnd={() => {
                    setDraggingItemId(null);
                    setDragOverStatus(null);
                  }}
                />
              ))
            )}
          </section>

          {/* DONE */}
          <section
            className={buildColumnClassName("done")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus("done");
            }}
            onDragLeave={() => {
              if (dragOverStatus === "done") setDragOverStatus(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              void handleDropStatus("done");
            }}
          >
            <div className="border-b-2 border-white/20 pb-2">
              <h3 className="pixel-text text-[8px] text-emerald-400">CONCLUIDO ({doneItems.length})</h3>
            </div>
            {doneItems.length === 0 ? (
              <p className="retro-copy-sm mt-4 text-center text-white/40">Nenhum projeto finalizado ainda.</p>
            ) : (
              doneItems.map((item) => (
                <RoadmapCard
                  key={item.id}
                  item={item}
                  onVote={() => handleVote(item.id)}
                  onDragStart={() => setDraggingItemId(item.id)}
                  onDragEnd={() => {
                    setDraggingItemId(null);
                    setDragOverStatus(null);
                  }}
                />
              ))
            )}
          </section>

          {/* DISCARDED */}
          <section
            className={buildColumnClassName("discarded")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus("discarded");
            }}
            onDragLeave={() => {
              if (dragOverStatus === "discarded") setDragOverStatus(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              void handleDropStatus("discarded");
            }}
          >
            <div className="border-b-2 border-white/20 pb-2">
              <h3 className="pixel-text text-[8px] text-rose-400">DESCARTADOS ({discardedItems.length})</h3>
            </div>
            {discardedItems.length === 0 ? (
              <p className="retro-copy-sm mt-4 text-center text-white/40">Nenhuma ideia descartada.</p>
            ) : (
              discardedItems.map((item) => (
                <RoadmapCard
                  key={item.id}
                  item={item}
                  onVote={() => handleVote(item.id)}
                  onDragStart={() => setDraggingItemId(item.id)}
                  onDragEnd={() => {
                    setDraggingItemId(null);
                    setDragOverStatus(null);
                  }}
                />
              ))
            )}
          </section>

        </div>
      )}
    </section>
  );
}

const RoadmapCard: React.FC<{
  item: RoadmapItem;
  onVote: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}> = ({ item, onVote, onDragStart, onDragEnd }) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="cursor-grab border-2 border-white/20 bg-black/40 p-3 transition-colors hover:border-white/40 active:cursor-grabbing"
      title="Arraste para mover de fase"
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="retro-copy-sm text-[12px] font-bold text-white">{item.title}</h4>
      </div>
      {item.description && (
        <p className="retro-copy-sm mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-white/75">{item.description}</p>
      )}
      
      <div className="mt-3 flex items-center justify-between border-t-2 border-white/10 pt-2">
        <div className="flex items-center gap-1.5">
          <Flag className="h-3 w-3 text-[var(--color-snes-gold)]" />
          <span className="pixel-text-soft text-[6px] text-white/60">
            {item.profiles ? item.profiles.name : "Anônimo"}
          </span>
        </div>
        
        <button 
          onClick={onVote}
          title="Apoiar ideia"
          className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 hover:bg-white/10"
        >
          <ThumbsUp className="h-3 w-3 text-blue-400" />
          <span className="pixel-text text-[8px]">{item.votes || 0}</span>
        </button>
      </div>
    </div>
  );
};
