import React, { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_MASCOT_CONFIG,
  FRAME_SIZE,
  MASCOT_FRAMES,
  MascotOrb,
  MascotCharacterVisual,
  SPRITE_COLUMNS,
  SPRITE_ROWS,
  clampMascotScale,
  getMascotFrameStyle,
  resolveMascotFrame,
  resolveCharacterSize,
  type MascotConfig,
} from "./MascotOrb";
import "./MascotOrbLab.css";

interface MascotOrbLabProps {
  visible: boolean;
  config: MascotConfig;
  onApply: (config: MascotConfig) => void;
  onClose: () => void;
}

const CHARACTER_LABELS: Record<MascotConfig["character"], string> = {
  app_button: "Botao do app",
  voice_orb: "Orb de voz",
  robot_classic: "Robo classico",
  robot_modern: "Robo moderno",
  robot_pseudo_3d: "RefinaVoz",
  living_document: "Documento vivo",
};

export const MascotOrbLab: React.FC<MascotOrbLabProps> = ({
  visible,
  config,
  onApply,
  onClose,
}) => {
  const [draftCharacter, setDraftCharacter] = useState<MascotConfig["character"]>(config.character);
  const [draftScale, setDraftScale] = useState(clampMascotScale(config.scale));
  const [draftVariant, setDraftVariant] = useState<MascotConfig["variant"]>(config.variant);
  const [selectedId, setSelectedId] = useState(resolveMascotFrame("idle").id);
  const [showFeatures, setShowFeatures] = useState(false);
  const selectedFrame = useMemo(
    () => MASCOT_FRAMES.find((frame) => frame.id === selectedId) ?? MASCOT_FRAMES[0],
    [selectedId],
  );
  const spriteWidth = SPRITE_COLUMNS * FRAME_SIZE;
  const spriteHeight = SPRITE_ROWS * FRAME_SIZE;
  const cropX = selectedFrame.col * FRAME_SIZE;
  const cropY = selectedFrame.row * FRAME_SIZE;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftCharacter(config.character);
    setDraftScale(clampMascotScale(config.scale));
    setDraftVariant(config.variant);
  }, [config.character, config.scale, config.variant, visible]);

  if (!visible) {
    return null;
  }

  const handleApply = () => {
    onApply({
      character: draftCharacter,
      scale: clampMascotScale(draftScale),
      variant: draftVariant,
    });
    onClose();
  };

  const handleReset = () => {
    setDraftCharacter(DEFAULT_MASCOT_CONFIG.character);
    setDraftScale(DEFAULT_MASCOT_CONFIG.scale);
    setDraftVariant(DEFAULT_MASCOT_CONFIG.variant);
  };

  return (
    <div className="mascot-lab-overlay">
      <section className="mascot-lab" aria-labelledby="mascot-lab-title">
        <header className="mascot-lab-header">
          <div>
            <h2 id="mascot-lab-title">Selecionar mascote</h2>
            <p>Escolha o componente visual, ajuste a escala e confirme para aplicar na bolha.</p>
          </div>
          <button type="button" className="mascot-icon-btn" onClick={onClose} aria-label="Fechar seletor">
            ×
          </button>
        </header>

        <div className="mascot-selector-row mascot-selector-grid" role="radiogroup" aria-label="Tipo de mascote">
          <button
            type="button"
            className={`mascot-choice ${draftCharacter === "app_button" ? "active" : ""}`}
            onClick={() => setDraftCharacter("app_button")}
            aria-pressed={draftCharacter === "app_button"}
          >
            <span className="mascot-choice-normal" />
            <strong>Botao do app</strong>
          </button>
          <button
            type="button"
            className={`mascot-choice ${draftCharacter === "voice_orb" ? "active" : ""}`}
            onClick={() => setDraftCharacter("voice_orb")}
            aria-pressed={draftCharacter === "voice_orb"}
          >
            <MascotCharacterVisual character="voice_orb" state="recording" compact variant={draftVariant} />
            <strong>Orb de voz</strong>
          </button>
          <button
            type="button"
            className={`mascot-choice ${draftCharacter === "robot_classic" ? "active" : ""}`}
            onClick={() => setDraftCharacter("robot_classic")}
            aria-pressed={draftCharacter === "robot_classic"}
          >
            <MascotCharacterVisual character="robot_classic" state="idle" compact variant={draftVariant} />
            <strong>Robo classico</strong>
          </button>
          <button
            type="button"
            className={`mascot-choice ${draftCharacter === "robot_modern" ? "active" : ""}`}
            onClick={() => setDraftCharacter("robot_modern")}
            aria-pressed={draftCharacter === "robot_modern"}
          >
            <MascotCharacterVisual character="robot_modern" state="idle" compact variant={draftVariant} />
            <strong>Robo moderno</strong>
          </button>
          <button
            type="button"
            className={`mascot-choice ${draftCharacter === "robot_pseudo_3d" ? "active" : ""}`}
            onClick={() => setDraftCharacter("robot_pseudo_3d")}
            aria-pressed={draftCharacter === "robot_pseudo_3d"}
          >
            <MascotCharacterVisual character="robot_pseudo_3d" state="idle" compact variant={draftVariant} />
            <strong>RefinaVoz</strong>
          </button>
          <button
            type="button"
            className={`mascot-choice ${draftCharacter === "living_document" ? "active" : ""}`}
            onClick={() => setDraftCharacter("living_document")}
            aria-pressed={draftCharacter === "living_document"}
          >
            <MascotCharacterVisual character="living_document" state="idle" compact variant={draftVariant} />
            <strong>Documento vivo</strong>
          </button>
        </div>

        <div className="mascot-lab-stage">
          <div
            className="mascot-scale-preview"
            style={{ "--mascot-preview-scale": draftScale } as React.CSSProperties}
          >
            {draftCharacter === "voice_orb"
              ? <MascotOrb frame={selectedFrame} className="mascot-preview-live" variant={draftVariant} />
              : <MascotCharacterVisual character={draftCharacter} state="idle" variant={draftVariant} />}
          </div>
          <div className="mascot-lab-meta">
            <strong>{draftCharacter === "voice_orb" ? selectedFrame.label : CHARACTER_LABELS[draftCharacter]}</strong>
            <span>{draftCharacter === "voice_orb" ? `${selectedFrame.expression} · ${selectedFrame.effect}` : "Visual importado do simulador de assistentes"}</span>
            <code>
              escala {draftScale.toFixed(2)}x · {Math.round(resolveCharacterSize(draftCharacter).button * draftScale)}px na bolha
            </code>
            {draftCharacter === "voice_orb" && (
              <code>
                frame {selectedFrame.col + 1},{selectedFrame.row + 1} · x:{cropX} y:{cropY} w:{FRAME_SIZE} h:{FRAME_SIZE}
              </code>
            )}
          </div>
        </div>

        <div className="mascot-variant-control" role="group" aria-label="Variante visual">
          <span>Variante</span>
          <button
            type="button"
            className={draftVariant === "masculine" ? "active" : ""}
            onClick={() => setDraftVariant("masculine")}
            aria-pressed={draftVariant === "masculine"}
          >
            Masculino
          </button>
          <button
            type="button"
            className={draftVariant === "feminine" ? "active" : ""}
            onClick={() => setDraftVariant("feminine")}
            aria-pressed={draftVariant === "feminine"}
          >
            Feminino
          </button>
        </div>

        <label className="mascot-scale-control">
          <span>Tamanho</span>
          <input
            type="range"
            min="0.75"
            max="1.75"
            step="0.05"
            value={draftScale}
            onChange={(event) => setDraftScale(clampMascotScale(Number(event.target.value)))}
          />
          <strong>{Math.round(draftScale * 100)}%</strong>
        </label>

        <button
          type="button"
          className="mascot-features-btn"
          onClick={() => setShowFeatures((current) => !current)}
          aria-expanded={showFeatures}
        >
          Funcionalidades
        </button>

        {showFeatures && (
          <div className="mascot-features-panel">
            <div>
              <strong>Botao do app</strong>
              <span>Mantem o comportamento nativo do RefinaVoz com escala configuravel.</span>
            </div>
            <div>
              <strong>Personagens</strong>
              <span>Orb, documento vivo, botao do app e robos usam o mesmo estado central de voz e podem ser trocados sem alterar o pipeline.</span>
            </div>
            <div>
              <strong>Estados visuais</strong>
              <span>Escuta, captura, processamento, sucesso e erro ja possuem sinalizacao visual compartilhada.</span>
            </div>
          </div>
        )}

        <div className="mascot-lab-specs" aria-label="Especificacao do sprite">
          <div>
            <span>Sprite</span>
            <strong>{spriteWidth}x{spriteHeight}</strong>
          </div>
          <div>
            <span>Grade</span>
            <strong>{SPRITE_COLUMNS}x{SPRITE_ROWS}</strong>
          </div>
          <div>
            <span>Quadro</span>
            <strong>{FRAME_SIZE}px</strong>
          </div>
        </div>

        {draftCharacter === "voice_orb" && (
          <div className="mascot-frame-grid" role="list" aria-label="Quadros do mascote">
            {MASCOT_FRAMES.map((frame) => (
              <button
                key={frame.id}
                type="button"
                className={`mascot-frame-btn ${frame.id === selectedFrame.id ? "active" : ""}`}
                style={getMascotFrameStyle(frame)}
                onClick={() => setSelectedId(frame.id)}
                role="listitem"
                title={`${frame.label}: linha ${frame.row + 1}, coluna ${frame.col + 1}`}
              >
                <MascotOrb frame={frame} compact variant={draftVariant} />
                <span>{frame.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mascot-action-row">
          <button type="button" className="mascot-close-btn" onClick={handleReset}>
            Padrao
          </button>
          <button type="button" className="mascot-apply-btn" onClick={handleApply}>
            OK
          </button>
        </div>
      </section>
    </div>
  );
};
