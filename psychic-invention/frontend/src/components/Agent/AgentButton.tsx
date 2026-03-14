/**
 * AgentButton — floating action button that opens the AI assistant popup.
 *
 * Reads WorkspaceAgentContext to show a green "data ready" badge when the
 * current workspace has computed results the agent can analyse.
 */
import { useState } from 'react';
import { AgentPopup } from './AgentPopup';
import { useAgentContext } from '@/context/AgentContext';

interface AgentButtonProps {
  menuId: string;
  menuLabel: string;
}

export function AgentButton({ menuId, menuLabel }: AgentButtonProps) {
  const [open, setOpen] = useState(false);
  const { workspaceContext } = useAgentContext();

  const hasData =
    workspaceContext?.rawData &&
    Object.keys(workspaceContext.rawData).length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-500 flex items-center justify-center text-xl transition-all hover:scale-105"
        title={`Open ${menuLabel} Assistant`}
        aria-label={`Open ${menuLabel} Assistant`}
      >
        🤖
        {hasData && (
          <span
            className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950"
            title="Workspace data ready for analysis"
          />
        )}
      </button>

      {open && (
        <AgentPopup
          menuId={menuId}
          menuLabel={menuLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
