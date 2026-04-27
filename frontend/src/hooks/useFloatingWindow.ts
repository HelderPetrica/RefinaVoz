import { useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { logger } from "../services/logger";

interface FloatingWindowState {
  showPanel: boolean;
  showHistory: boolean;
  showStudio: boolean;
  showDict: boolean;
  showStatus: boolean;
}

interface WindowPreset {
  width: number;
  height: number;
}

const BUBBLE_PRESET: WindowPreset = { width: 112, height: 112 };
const PANEL_PRESET: WindowPreset = { width: 340, height: 540 };
const STUDIO_PRESET: WindowPreset = { width: 460, height: 680 };

function resolvePreset(state: FloatingWindowState): WindowPreset {
  if (state.showStudio || state.showDict) {
    return STUDIO_PRESET;
  }

  if (state.showPanel || state.showHistory || state.showStatus) {
    return PANEL_PRESET;
  }

  return BUBBLE_PRESET;
}

export function useFloatingWindow(state: FloatingWindowState): void {
  const appliedPresetRef = useRef<string>("");
  const appliedFocusableRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    const preset = resolvePreset(state);
    const presetKey = `${preset.width}x${preset.height}`;
    const shouldBeFocusable = state.showPanel || state.showHistory || state.showStudio || state.showDict || state.showStatus;
    const appWindow = getCurrentWindow();

    if (appliedFocusableRef.current !== shouldBeFocusable) {
      appliedFocusableRef.current = shouldBeFocusable;
      appWindow
        .setFocusable(shouldBeFocusable)
        .then(() => {
          logger.debug("window.focusable.set", { focusable: shouldBeFocusable });
        })
        .catch((error) => {
          logger.warn("window.focusable.error", error);
          appliedFocusableRef.current = null;
        });
    }

    if (appliedPresetRef.current === presetKey) return;

    appliedPresetRef.current = presetKey;

    appWindow
      .setSize(new LogicalSize(preset.width, preset.height))
      .then(() => {
        logger.debug("window.size.set", preset);
      })
      .catch((error) => {
        logger.warn("window.size.error", error);
        appliedPresetRef.current = "";
      });
  }, [state.showDict, state.showHistory, state.showPanel, state.showStatus, state.showStudio]);
}