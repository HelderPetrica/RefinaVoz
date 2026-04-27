/**
 * PromptStudio — Showcase inteligente dos modos/prompts do RefinaVoz.
 *
 * Consome os endpoints GET /prompts e GET /prompts/{mode} do backend
 * e apresenta cada modo com sua persona, regras e descrição num layout premium.
 */

import React, { useState, useEffect } from "react";
import { listPromptModes, getPromptDetail, generatePromptAssistant, saveNewPrompt } from "../services/apiClient";
import { logger } from "../services/logger";
import type { PromptDetail } from "../services/apiClient";
import "./PromptStudio.css";

interface PromptStudioProps {
  visible: boolean;
  currentMode: string;
  onSelectMode: (mode: string) => void;
  onClose: () => void;
}

const MODE_ICONS: Record<string, string> = {
  vibe_code: "🎯",
  normal: "✏️",
  profissional: "💼",
  programador: "🐛",
  mensagem: "💬",
  prompt: "🧠",
  juridico: "⚖️",
  pesquisador: "🔍",
  ilustrador: "🎨",
  filme: "🎬"
};

const MODE_ICON_CLASS: Record<string, string> = {
  vibe_code: "ps-card-icon-vibe-code",
  normal: "ps-card-icon-normal",
  profissional: "ps-card-icon-profissional",
  programador: "ps-card-icon-programador",
  mensagem: "ps-card-icon-mensagem",
  prompt: "ps-card-icon-prompt",
};

/**
 * Extrai a persona de dentro do conteúdo XML do prompt.
 */
function extractPersona(content: string): string {
  const match = content.match(/<persona>\s*([\s\S]*?)\s*<\/persona>/i);
  if (!match) return "";
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .join(" · ");
}

/**
 * Extrai as regras (rules) do conteúdo XML do prompt.
 */
function extractRules(content: string): string[] {
  const match = content.match(/<rules>\s*([\s\S]*?)\s*<\/rules>/i);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter((l) => l.length > 5)
    .slice(0, 4);
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
  visible,
  currentMode,
  onSelectMode,
  onClose,
}) => {
  const [modes, setModes] = useState<Record<string, string>>({});
  const [selectedDetail, setSelectedDetail] = useState<PromptDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Estados para criacao
  const [creatingNew, setCreatingNew] = useState(false);
  const [newModeForm, setNewModeForm] = useState({ id: "", name: "", desc: "", explanation: "", content: "" });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const reloadModes = () => {
    listPromptModes()
      .then((data) => setModes(data.modes))
      .catch((err) => logger.error("promptStudio.modes.load.error", err));
  };

  // Carregar lista de modos ao abrir
  useEffect(() => {
    if (!visible) return;
    reloadModes();
  }, [visible]);

  // Carregar detalhes ao selecionar um modo
  const handleViewDetail = async (mode: string) => {
    setCreatingNew(false);
    setLoadingDetail(true);
    try {
      const detail = await getPromptDetail(mode);
      setSelectedDetail(detail);
    } catch (err) {
      logger.error("promptStudio.detail.load.error", { mode, err });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectAndClose = (mode: string) => {
    onSelectMode(mode);
    onClose();
  };

  const handleGeneratePrompt = async () => {
    if (!newModeForm.explanation.trim()) return;
    setGenerating(true);
    try {
      const res = await generatePromptAssistant(newModeForm.explanation);
      setNewModeForm((prev) => ({ ...prev, content: res.content }));
    } catch (err) {
      logger.error("promptStudio.generate.error", err);
      alert("Erro ao gerar prompt com IA.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveMode = async () => {
    if (!newModeForm.id || !newModeForm.name || !newModeForm.content) return;
    setSaving(true);
    try {
      const safeId = newModeForm.id.toLowerCase().replace(/[^a-z0-9_]/g, "");
      await saveNewPrompt(safeId, newModeForm.name, newModeForm.desc, newModeForm.content);
      setCreatingNew(false);
      setNewModeForm({ id: "", name: "", desc: "", explanation: "", content: "" });
      reloadModes();
      alert(`Modo ${safeId} criado com sucesso!`);
    } catch (err) {
      logger.error("promptStudio.save.error", err);
      alert("Erro ao salvar modo.");
    } finally {
      setSaving(false);
    }
  };

  const startCreateNew = () => {
    setSelectedDetail(null);
    setCreatingNew(true);
  };

  if (!visible) return null;

  return (
    <div className="prompt-studio-overlay" onClick={onClose}>
      <div className="prompt-studio" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ps-header">
          <div className="ps-title">
            <span className="ps-title-icon">✨</span>
            <span>Prompt Studio</span>
          </div>
          <p className="ps-subtitle">
            Cada modo veste uma persona diferente na IA. Escolha o modo ideal para a sua intenção.
          </p>
        </div>

        {/* Cards de Modos */}
        <div className="ps-grid">
          <div
            className={`ps-card ps-card-new ${creatingNew ? "ps-card-active" : ""}`}
            onClick={startCreateNew}
          >
            <div className="ps-card-icon">➕</div>
            <div className="ps-card-body">
              <h3 className="ps-card-name">Nova Persona</h3>
              <p className="ps-card-desc">Crie um modo personalizado com IA</p>
            </div>
            <button className="ps-card-use">Criar</button>
          </div>

          {Object.entries(modes).map(([mode, description]) => (
            <div
              key={mode}
              className={`ps-card ${currentMode === mode ? "ps-card-active" : ""}`}
              onClick={() => handleViewDetail(mode)}
            >
              <div
                className={`ps-card-icon ${MODE_ICON_CLASS[mode] ?? MODE_ICON_CLASS.normal}`}
              >
                {MODE_ICONS[mode] || "📄"}
              </div>
              <div className="ps-card-body">
                <h3 className="ps-card-name">{mode.replace(/_/g, " ")}</h3>
                <p className="ps-card-desc">{description}</p>
              </div>
              <button
                className={`ps-card-use ${currentMode === mode ? "ps-card-use-active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAndClose(mode);
                }}
              >
                {currentMode === mode ? "✓ Ativo" : "Usar"}
              </button>
            </div>
          ))}
        </div>

        {/* Detalhe do Prompt Selecionado */}
        {selectedDetail && (
          <div className="ps-detail">
            <div className="ps-detail-header">
              <span className="ps-detail-icon">
                {MODE_ICONS[selectedDetail.mode] || "📄"}
              </span>
              <div>
                <h3 className="ps-detail-name">
                  {selectedDetail.metadata.name || selectedDetail.mode}
                </h3>
                <p className="ps-detail-desc">
                  {selectedDetail.metadata.description || ""}
                </p>
              </div>
            </div>

            {/* Persona */}
            {extractPersona(selectedDetail.content) && (
              <div className="ps-detail-section">
                <h4>🎭 Persona</h4>
                <p className="ps-persona-text">
                  {extractPersona(selectedDetail.content)}
                </p>
              </div>
            )}

            {/* Regras */}
            {extractRules(selectedDetail.content).length > 0 && (
              <div className="ps-detail-section">
                <h4>📋 Regras Principais</h4>
                <ul className="ps-rules-list">
                  {extractRules(selectedDetail.content).map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              className="ps-detail-use-btn"
              onClick={() => handleSelectAndClose(selectedDetail.mode)}
            >
              Usar {selectedDetail.mode.replace(/_/g, " ")}
            </button>
          </div>
        )}

        {creatingNew && (
          <div className="ps-detail ps-create-mode">
            <h3 className="ps-detail-name">Criar Novo Modo</h3>
            <p className="ps-detail-desc" style={{marginBottom: "16px"}}>Use a IA para gerar um prompt base a partir de uma explicação.</p>

            <div className="ps-form-group" style={{display:'flex', gap:'8px', flexDirection:'column', marginBottom:'16px'}}>
              <input 
                type="text" 
                placeholder="ID do Modo (apenas minúsculas, ex: juridico)" 
                value={newModeForm.id} 
                onChange={e => setNewModeForm({...newModeForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                className="ps-input"
                style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:'6px'}}
              />
              <input 
                type="text" 
                placeholder="Nome de Exibição (ex: Modo Jurídico)" 
                value={newModeForm.name} 
                onChange={e => setNewModeForm({...newModeForm, name: e.target.value})}
                className="ps-input"
                style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:'6px'}}
              />
              <input 
                type="text" 
                placeholder="Descrição Curta" 
                value={newModeForm.desc} 
                onChange={e => setNewModeForm({...newModeForm, desc: e.target.value})}
                className="ps-input"
                style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:'6px'}}
              />
            </div>

            <div className="ps-form-group ps-assistant-group" style={{marginBottom:'16px', background:'rgba(255,255,255,0.03)', padding:'12px', borderRadius:'8px'}}>
              <h4 style={{margin:'0 0 8px 0', fontSize:'12px', color:'#a855f7'}}>Assistente de IA 🤖</h4>
              <textarea 
                rows={3} 
                placeholder="Explique o que este modo deve fazer. Ex: 'Atue como um advogado senior...'"
                value={newModeForm.explanation}
                onChange={e => setNewModeForm({...newModeForm, explanation: e.target.value})}
                className="ps-assistant-input"
                style={{width:'100%', padding:'8px', boxSizing:'border-box', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', borderRadius:'6px', marginBottom:'8px'}}
              />
              <button 
                className="ps-btn-generate"
                onClick={handleGeneratePrompt}
                disabled={generating || !newModeForm.explanation.trim()}
                style={{width:'100%', padding:'8px', background:'rgba(168,85,247,0.2)', border: generating ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(168,85,247,0.5)', color:'#fff', borderRadius:'6px', cursor: generating ? 'not-allowed' : 'pointer'}}
              >
                {generating ? "⏳ Gerando com Gemini..." : "✨ Gerar Prompt XML"}
              </button>
            </div>

            <div className="ps-form-group" style={{marginBottom:'16px'}}>
              <h4 style={{margin:'0 0 8px 0', fontSize:'12px', color:'#fff'}}>Corpo do Prompt (XML)</h4>
              <textarea 
                rows={8}
                placeholder="O código gerado aparecerá aqui..."
                value={newModeForm.content}
                onChange={e => setNewModeForm({...newModeForm, content: e.target.value})}
                className="ps-code-editor"
                style={{width:'100%', padding:'8px', boxSizing:'border-box', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)', color:'#a5b4fc', fontFamily:'monospace', fontSize:'11px', borderRadius:'6px'}}
              />
            </div>

            <button 
              className="ps-detail-use-btn" 
              onClick={handleSaveMode}
              disabled={saving || !newModeForm.id || !newModeForm.content}
            >
              {saving ? "Salvando..." : "💾 Salvar Modo"}
            </button>
          </div>
        )}

        {loadingDetail && (
          <div className="ps-loading">Carregando detalhes...</div>
        )}

        {/* Footer */}
        <button className="ps-close-btn" onClick={onClose}>
          Fechar Studio
        </button>
      </div>
    </div>
  );
};
