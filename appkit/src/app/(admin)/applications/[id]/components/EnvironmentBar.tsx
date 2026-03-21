'use client'

import React from 'react'
import { ServerIcon, PlusIcon, Loader2Icon, AlertTriangleIcon } from 'lucide-react'
import type { AppEnvironment } from '../page'

const ENV_TYPE_STYLES: Record<string, { badge: string; dot: string; ring: string; label: string }> = {
  production:  { badge: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',  dot: 'bg-green-500',  ring: 'ring-green-400 dark:ring-green-500',  label: 'Production' },
  staging:     { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',  dot: 'bg-amber-500',  ring: 'ring-amber-400 dark:ring-amber-500',  label: 'Staging' },
  development: { badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',        dot: 'bg-blue-500',   ring: 'ring-blue-400 dark:ring-blue-500',   label: 'Development' },
  custom:      { badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800', dot: 'bg-purple-500', ring: 'ring-purple-400 dark:ring-purple-500', label: 'Custom' },
}

interface EnvironmentBarProps {
  environments: AppEnvironment[]
  activeEnvId: string | null
  loading: boolean
  onSelect: (envId: string) => void
  onAdd: () => void
}

export function EnvironmentBar({ environments, activeEnvId, loading, onSelect, onAdd }: EnvironmentBarProps) {
  const activeEnv = environments.find(e => e.id === activeEnvId)

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 mb-5">
      <div className="flex items-center gap-2 shrink-0">
        <ServerIcon className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
        <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Environment</span>
      </div>

      <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 shrink-0" />

      {loading ? (
        <Loader2Icon className="w-3.5 h-3.5 animate-spin text-gray-400" />
      ) : environments.length === 0 ? (
        <span className="text-xs text-gray-400 dark:text-zinc-500 italic">No environments — create one to isolate configs</span>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          {environments.map(env => {
            const style = ENV_TYPE_STYLES[env.type] || ENV_TYPE_STYLES.custom
            const isActive = env.id === activeEnvId
            return (
              <button
                key={env.id}
                onClick={() => onSelect(env.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                  isActive
                    ? style.badge + ' ring-2 ring-offset-1 ' + style.ring + ' dark:ring-offset-zinc-900'
                    : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 hover:text-gray-700 dark:hover:text-zinc-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                {env.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {activeEnv && (
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 hidden sm:block">
            Config isolated from other environments
          </span>
        )}
        {!activeEnv && environments.length > 0 && (
          <span className="text-[10px] text-amber-500 dark:text-amber-400 flex items-center gap-1 hidden sm:flex">
            <AlertTriangleIcon className="w-3 h-3" /> Select an environment to edit its config
          </span>
        )}
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <PlusIcon className="w-3 h-3" /> New
        </button>
      </div>
    </div>
  )
}
