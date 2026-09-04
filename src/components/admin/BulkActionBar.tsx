"use client";

import React from "react";
import { LucideIcon, X, Loader2 } from "lucide-react";

export interface BulkActionItem {
  id?: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

export interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkActionItem[];
  labelSelectedText?: string;
  deselectTooltip?: string;
  isLoading?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  labelSelectedText,
  deselectTooltip = "Deselect all",
  isLoading = false,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null;

  const getVariantStyles = (variant: BulkActionItem["variant"] = "default") => {
    switch (variant) {
      case "primary":
        return "bg-brand-500 text-slate-950 hover:bg-brand-400 font-bold shadow-glow";
      case "success":
        return "bg-emerald-950 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/90 font-semibold";
      case "warning":
        return "bg-amber-950/60 text-amber-400 border border-amber-800/80 hover:bg-amber-900/80 font-semibold";
      case "danger":
        return "bg-rose-950/60 text-rose-400 border border-rose-800/80 hover:bg-rose-900/80 font-semibold";
      case "default":
      default:
        return "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white font-semibold";
    }
  };

  return (
    <aside
      aria-label="Bulk actions toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-brand-500/40 shadow-2xl rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center gap-2 sm:gap-3 text-xs animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Counter & Deselect button */}
      <div className="flex items-center gap-2 bg-brand-500/15 border border-brand-500/30 rounded-xl px-3 py-1.5 text-brand-400 font-bold">
        <span>
          {labelSelectedText
            ? labelSelectedText.replace("{count}", selectedCount.toString())
            : `${selectedCount} selected`}
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="hover:text-white p-0.5 rounded transition-colors"
          title={deselectTooltip}
          aria-label={deselectTooltip}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-800 hidden sm:block" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id || act.label}
              type="button"
              disabled={act.disabled || act.loading || isLoading}
              onClick={act.onClick}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 ${getVariantStyles(
                act.variant
              )}`}
            >
              {act.loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : Icon ? (
                <Icon className="h-3.5 w-3.5" />
              ) : null}
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
