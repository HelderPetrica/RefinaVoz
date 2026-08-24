import { useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow, monitorFromPoint } from "@tauri-apps/api/window";
import { logger } from "../services/logger";

interface FloatingWindowState {
  showPanel: boolean;
  showHistory: boolean;
  showStudio: boolean;
  showDict: boolean;
  showStatus: boolean;
  showMascotLab: boolean;
  mascotWindowScale: number;
  anchorSize: number;
}

export type OverlayPlacement = "above" | "below";

interface WindowPreset {
  width: number;
  height: number;
}

const BUBBLE_PRESET: WindowPreset = { width: 112, height: 112 };
const PANEL_PRESET: WindowPreset = { width: 430, height: 570 };
const STUDIO_PRESET: WindowPreset = { width: 540, height: 700 };
const MASCOT_LAB_PRESET: WindowPreset = { width: 720, height: 760 };

function resolvePreset(state: FloatingWindowState): WindowPreset {
  if (state.showMascotLab) {
    return MASCOT_LAB_PRESET;
  }

  if (state.showStudio || state.showDict) {
    return STUDIO_PRESET;
  }

  if (state.showPanel || state.showHistory || state.showStatus) {
    return PANEL_PRESET;
  }

  const bubbleSize = Math.max(BUBBLE_PRESET.width, Math.ceil(BUBBLE_PRESET.width * state.mascotWindowScale));
  return { width: bubbleSize, height: bubbleSize };
}

export function useFloatingWindow(state: FloatingWindowState): OverlayPlacement {
  const [overlayPlacement, setOverlayPlacement] = useState<OverlayPlacement>("below");
  const appliedPresetRef = useRef<WindowPreset | null>(null);
  const appliedFocusableRef = useRef<boolean | null>(null);
  const appliedPlacementRef = useRef<OverlayPlacement>("below");

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    let cancelled = false;

    const syncWindow = async () => {
      const preset = resolvePreset(state);
      const shouldBeFocusable = state.showPanel || state.showHistory || state.showStudio || state.showDict || state.showStatus || state.showMascotLab;
      const appWindow = getCurrentWindow();

      if (appliedFocusableRef.current !== shouldBeFocusable) {
        appliedFocusableRef.current = shouldBeFocusable;
        try {
          await appWindow.setFocusable(shouldBeFocusable);
          logger.debug("window.focusable.set", { focusable: shouldBeFocusable });
        } catch (error) {
          logger.warn("window.focusable.error", error);
          appliedFocusableRef.current = null;
        }
      }

      const currentPreset = appliedPresetRef.current ?? resolvePreset({
        ...state,
        showPanel: false,
        showHistory: false,
        showStatus: false,
        showStudio: false,
        showDict: false,
        showMascotLab: false,
      });

      const currentPosition = await appWindow.outerPosition().catch((error) => {
        logger.warn("window.position.read.error", error);
        return null;
      });

      if (!currentPosition) {
        return;
      }

      const monitor = await monitorFromPoint(currentPosition.x + 24, currentPosition.y + 24).catch((error) => {
        logger.warn("window.monitor.read.error", error);
        return null;
      });

      const workArea = monitor?.workArea;
      const workTop = workArea?.position.y ?? 0;
      const workLeft = workArea?.position.x ?? 0;
      const workRight = workArea ? workArea.position.x + workArea.size.width : Number.POSITIVE_INFINITY;
      const workBottom = workArea ? workArea.position.y + workArea.size.height : Number.POSITIVE_INFINITY;
      const currentPlacement = appliedPlacementRef.current;
      const bubbleTopOnScreen = currentPlacement === "above"
        ? currentPosition.y + currentPreset.height - state.anchorSize - 4
        : currentPosition.y + 4;
      const bubbleBottomOnScreen = bubbleTopOnScreen + state.anchorSize;
      const bubbleLeftOnScreen = currentPosition.x + 4;
      const nextPlacement: OverlayPlacement = shouldBeFocusable && currentPosition.y + preset.height > workBottom - 8
        ? "above"
        : "below";

      if (!cancelled) {
        appliedPlacementRef.current = nextPlacement;
        setOverlayPlacement(nextPlacement);
      }

      let nextX = bubbleLeftOnScreen - 4;
      let nextY = nextPlacement === "above"
        ? bubbleBottomOnScreen - preset.height + 4
        : bubbleTopOnScreen - 4;

      nextX = Math.min(Math.max(nextX, workLeft), Math.max(workLeft, workRight - preset.width));
      nextY = Math.min(Math.max(nextY, workTop), Math.max(workTop, workBottom - preset.height));

      const presetChanged = !appliedPresetRef.current
        || appliedPresetRef.current.width !== preset.width
        || appliedPresetRef.current.height !== preset.height;
      const positionChanged = currentPosition.x !== nextX || currentPosition.y !== nextY;

      if (presetChanged) {
        try {
          await appWindow.setSize(new LogicalSize(preset.width, preset.height));
          logger.debug("window.size.set", preset);
        } catch (error) {
          logger.warn("window.size.error", error);
          return;
        }
      }

      if (presetChanged || positionChanged) {
        try {
          await appWindow.setPosition(new LogicalPosition(nextX, nextY));
          logger.debug("window.position.set", { x: nextX, y: nextY, placement: nextPlacement });
        } catch (error) {
          logger.warn("window.position.error", error);
        }
      }

      appliedPresetRef.current = preset;
    };

    void syncWindow();
    return () => {
      cancelled = true;
    };
  }, [state.anchorSize, state.mascotWindowScale, state.showDict, state.showHistory, state.showMascotLab, state.showPanel, state.showStatus, state.showStudio]);

  return overlayPlacement;
}
