import React, { useState, useEffect } from "react";
import "./DictionaryEditor.css";
import { logger } from "../services/logger";

interface DictionaryEditorProps {
  visible: boolean;
  onClose: () => void;
}

export const DictionaryEditor: React.FC<DictionaryEditorProps> = ({
  visible,
  onClose,
}) => {
  const [dictionary, setDictionary] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("global");
  const [wrong, setWrong] = useState("");
  const [right, setRight] = useState("");

  const loadDictionary = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:14201/api/v1/dictionary");
      const data = await res.json();
      setDictionary(data);
    } catch (err) {
      logger.warn("dictionary.load.error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadDictionary();
    }
  }, [visible]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wrong.trim() || !right.trim()) return;

    try {
      const fd = new FormData();
      fd.append("scope", scope);
      fd.append("wrong", wrong);
      fd.append("right", right);

      await fetch("http://localhost:14201/api/v1/dictionary", {
        method: "POST",
        body: fd,
      });

      setWrong("");
      setRight("");
      loadDictionary();
    } catch (err) {
      logger.warn("dictionary.add.error", err);
    }
  };

  const handleRemove = async (scope: string, wrongWord: string) => {
    try {
      await fetch(`http://localhost:14201/api/v1/dictionary/${scope}/${encodeURIComponent(wrongWord)}`, {
        method: "DELETE",
      });
      loadDictionary();
    } catch (err) {
      logger.warn("dictionary.remove.error", err);
    }
  };

  if (!visible) return null;

  return (
    <div className="dict-overlay" onClick={onClose}>
      <div className="dict-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dict-header">
          <h3>📖 Dicionário de Correção</h3>
          <p>Mapeie texto falado para termos técnicos exatos.</p>
        </div>

        <form className="dict-form" onSubmit={handleAdd}>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label="Escopo do dicionário"
            title="Escopo do dicionário"
          >
            <option value="global">Global (Sempre ativo)</option>
            <option value="programacao">Programação</option>
            <option value="comunicacao">Comunicação</option>
          </select>
          <input 
            type="text" 
            placeholder="Falado (ex: páiton)" 
            value={wrong} 
            onChange={(e) => setWrong(e.target.value)} 
          />
          <span>→</span>
          <input 
            type="text" 
            placeholder="Correto (ex: Python)" 
            value={right} 
            onChange={(e) => setRight(e.target.value)} 
          />
          <button type="submit">Add</button>
        </form>

        {loading ? <div className="dict-loading">Carregando...</div> : (
          <div className="dict-list-container">
            {Object.entries(dictionary).map(([scopeName, terms]) => (
              <div key={scopeName} className="dict-scope-section">
                <h4>{scopeName.toUpperCase()}</h4>
                {Object.keys(terms).length === 0 ? (
                  <p className="dict-empty">Nenhum termo</p>
                ) : (
                  <div className="dict-terms">
                    {Object.entries(terms).map(([w, r]) => (
                      <div key={w} className="dict-term-item">
                        <span className="dict-w">{w}</span>
                        <span className="dict-arrow">→</span>
                        <span className="dict-r">{r as string}</span>
                        <button onClick={() => handleRemove(scopeName, w)}>❌</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button className="dict-close" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
};
