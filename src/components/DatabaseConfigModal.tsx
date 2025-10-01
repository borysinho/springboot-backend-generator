import React, { useState } from "react";
import "./DatabaseConfigModal.css";

export interface DatabaseConfig {
  type: "postgresql" | "mysql" | "sqlite" | "sqlserver";
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  schema?: string;
}

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: DatabaseConfig) => void;
  diagramName: string;
}

const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  diagramName,
}) => {
  const [config, setConfig] = useState<DatabaseConfig>({
    type: "postgresql",
    host: "localhost",
    port: "5432",
    database:
      diagramName.toLowerCase().replace(/[^a-z0-9]/g, "_") || "my_database",
    username: "postgres",
    password: "",
    ssl: false,
    schema: "public",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(config);
  };

  const handleTypeChange = (type: DatabaseConfig["type"]) => {
    const defaultPorts = {
      postgresql: "5432",
      mysql: "3306",
      sqlite: "",
      sqlserver: "1433",
    };

    setConfig((prev) => ({
      ...prev,
      type,
      port: defaultPorts[type],
      host: type === "sqlite" ? "" : "localhost",
      username:
        type === "sqlite" ? "" : type === "sqlserver" ? "sa" : "postgres",
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Configuración de Base de Datos</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="db-type">Tipo de Base de Datos:</label>
            <select
              id="db-type"
              value={config.type}
              onChange={(e) =>
                handleTypeChange(e.target.value as DatabaseConfig["type"])
              }
              required
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="sqlserver">SQL Server</option>
            </select>
          </div>

          {config.type !== "sqlite" && (
            <>
              <div className="form-group">
                <label htmlFor="db-host">Host:</label>
                <input
                  type="text"
                  id="db-host"
                  value={config.host}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, host: e.target.value }))
                  }
                  placeholder="localhost"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="db-port">Puerto:</label>
                <input
                  type="text"
                  id="db-port"
                  value={config.port}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, port: e.target.value }))
                  }
                  placeholder="5432"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="db-username">Usuario:</label>
                <input
                  type="text"
                  id="db-username"
                  value={config.username}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="postgres"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="db-password">Contraseña:</label>
                <input
                  type="password"
                  id="db-password"
                  value={config.password}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Contraseña"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="db-schema">Schema (opcional):</label>
                <input
                  type="text"
                  id="db-schema"
                  value={config.schema}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, schema: e.target.value }))
                  }
                  placeholder="public"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.ssl || false}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, ssl: e.target.checked }))
                    }
                  />
                  Usar SSL
                </label>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="db-name">Nombre de la Base de Datos:</label>
            <input
              type="text"
              id="db-name"
              value={config.database}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, database: e.target.value }))
              }
              placeholder="my_database"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" className="confirm-button">
              Generar Backend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DatabaseConfigModal;
