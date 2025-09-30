import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

interface Diagram {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  collaborators: number;
}

interface Invitation {
  id: string;
  diagramId: string;
  creatorId: string;
  inviteeEmail: string;
  inviteeId?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  message?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  diagram?: {
    name: string;
  };
  creator?: {
    name: string;
    email: string;
  };
}

const Dashboard: React.FC = () => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login");
      return;
    }

    // Cargar datos del dashboard
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const user = JSON.parse(userStr);

      // Cargar diagramas (aún mock por ahora)
      const mockDiagrams: Diagram[] = [
        {
          id: "1",
          name: "Diagrama de Clases - Sistema de Gestión",
          description:
            "Diagrama UML de clases para el sistema de gestión universitaria",
          createdAt: "2024-01-15",
          updatedAt: "2024-01-20",
          collaborators: 1,
        },
        {
          id: "2",
          name: "Diagrama de Secuencia - Login",
          description: "Flujo de autenticación de usuarios",
          createdAt: "2024-01-18",
          updatedAt: "2024-01-22",
          collaborators: 2,
        },
        {
          id: "3",
          name: "Diagrama de Base de Datos",
          description: "Esquema de base de datos del sistema",
          createdAt: "2024-01-20",
          updatedAt: "2024-01-25",
          collaborators: 1,
        },
      ];

      // Cargar invitaciones reales desde el backend
      const response = await fetch(`/api/invitations/user/${user.id}`);
      if (response.ok) {
        const invitationsData = await response.json();
        setInvitations(invitationsData);
      } else {
        setInvitations([]);
      }

      setDiagrams(mockDiagrams);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiagram = async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(userStr);

    // Pedir el nombre del diagrama
    let diagramName = prompt("Ingresa el nombre del diagrama:");

    if (!diagramName || diagramName.trim() === "") {
      alert("El nombre del diagrama es obligatorio");
      return;
    }

    diagramName = diagramName.trim();

    try {
      // Verificar si el nombre ya existe para este usuario
      console.log("Verificando nombre:", diagramName, "para usuario:", user.id);
      const response = await fetch(
        `/api/diagrams/check-name?name=${encodeURIComponent(
          diagramName
        )}&creatorId=${encodeURIComponent(user.id)}`
      );
      console.log("Respuesta de la API:", response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Datos de la API:", data);
        const { exists } = data;
        if (exists) {
          alert(
            `Ya tienes un diagrama con el nombre "${diagramName}". Por favor elige un nombre diferente.`
          );
          return;
        }
      } else {
        const errorText = await response.text();
        console.error("Error en respuesta de API:", response.status, errorText);
        alert("Error al verificar el nombre del diagrama");
        return;
      }

      // Si el nombre es único, navegar al editor
      navigate(`/diagrams?name=${encodeURIComponent(diagramName)}`);
    } catch (error) {
      console.error("Error validating diagram name:", error);
      alert("Error al validar el nombre del diagrama");
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const user = JSON.parse(userStr);

      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        // Recargar invitaciones
        await loadDashboardData();
      } else {
        console.error("Error accepting invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        // Recargar invitaciones
        await loadDashboardData();
      } else {
        console.error("Error declining invitation");
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
    }
  };

  const handleDeleteDiagram = (diagramId: string) => {
    // Confirmar eliminación
    const confirmDelete = window.confirm(
      "¿Estás seguro de que quieres eliminar este diagrama? Esta acción no se puede deshacer."
    );

    if (confirmDelete) {
      // TODO: Implementar eliminación real del diagrama
      setDiagrams((prev) => prev.filter((diagram) => diagram.id !== diagramId));
      console.log(`Diagrama ${diagramId} eliminado`);
    }
  };

  const handleShareDiagram = async (diagramId: string) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const user = JSON.parse(userStr);

      // Pedir email del invitado
      const inviteeEmail = prompt(
        "Ingresa el email de la persona que quieres invitar:"
      );
      if (!inviteeEmail) return;

      // Pedir mensaje opcional
      const message = prompt("Mensaje opcional para la invitación:");

      // Crear invitación
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diagramId,
          creatorId: user.id,
          inviteeEmail,
          message: message || undefined,
          expiresAt: expiresAt.toISOString(),
        }),
      });

      if (response.ok) {
        alert("Invitación enviada exitosamente!");
        // Recargar datos para mostrar la nueva invitación
        await loadDashboardData();
      } else {
        const error = await response.json();
        alert(
          `Error al enviar invitación: ${error.message || "Error desconocido"}`
        );
      }
    } catch (error) {
      console.error("Error sharing diagram:", error);
      alert("Error al enviar la invitación");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <div className="header-actions">
            <button onClick={handleCreateDiagram} className="create-button">
              Nuevo Diagrama
            </button>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="diagrams-section">
          <h2>Mis Diagramas</h2>
          {diagrams.length === 0 ? (
            <div className="empty-state">
              <p>No tienes diagramas creados aún.</p>
              <button onClick={handleCreateDiagram} className="create-button">
                Crear tu primer diagrama
              </button>
            </div>
          ) : (
            <div className="diagrams-grid">
              {diagrams.map((diagram) => (
                <div key={diagram.id} className="diagram-card">
                  <div className="diagram-header">
                    <h3>{diagram.name}</h3>
                    <span className="collaborators">
                      👥 {diagram.collaborators}
                    </span>
                  </div>
                  <p className="diagram-description">{diagram.description}</p>
                  <div className="diagram-meta">
                    <span>Creado: {diagram.createdAt}</span>
                    <span>Actualizado: {diagram.updatedAt}</span>
                  </div>
                  <div className="diagram-actions">
                    <Link
                      to={`/diagrams/${diagram.id}`}
                      className="edit-button"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleShareDiagram(diagram.id)}
                      className="share-button"
                    >
                      📤 Compartir
                    </button>
                    <button
                      onClick={() => handleDeleteDiagram(diagram.id)}
                      className="delete-button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {invitations.length > 0 && (
          <section className="invitations-section">
            <h2>Invitaciones Pendientes</h2>
            <div className="invitations-list">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="invitation-card">
                  <div className="invitation-info">
                    <h4>{invitation.diagram?.name || "Diagrama"}</h4>
                    <p>
                      Invitado por:{" "}
                      {invitation.creator?.name ||
                        invitation.creator?.email ||
                        "Usuario"}
                    </p>
                    <p>Estado: {invitation.status}</p>
                    {invitation.message && <p>Mensaje: {invitation.message}</p>}
                  </div>
                  <div className="invitation-actions">
                    {invitation.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="accept-button"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          className="decline-button"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
