import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Dashboard.css";

interface BackendInvitation {
  id: string;
  diagramId: string;
  creatorId: string;
  inviteeEmail: string;
  inviteeId?: string;
  status: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  diagram?: {
    diagramId: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
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
  diagram?: {
    diagramId: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

const Invitations: React.FC = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  const loadInvitations = useCallback(async () => {
    try {
      const response = await fetch("/api/invitations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const invitationsData: BackendInvitation[] = await response.json();
        // Convertir el status a tipo específico
        const convertedInvitations: Invitation[] = invitationsData.map(
          (inv) => ({
            ...inv,
            status: inv.status as
              | "pending"
              | "accepted"
              | "rejected"
              | "expired",
          })
        );
        setInvitations(convertedInvitations);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Invitación aceptada exitosamente!");
        await loadInvitations();
      } else {
        const error = await response.json();
        alert(
          `Error al aceptar invitación: ${error.message || "Error desconocido"}`
        );
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert("Error al aceptar la invitación");
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Invitación rechazada");
        await loadInvitations();
      } else {
        const error = await response.json();
        alert(
          `Error al rechazar invitación: ${
            error.message || "Error desconocido"
          }`
        );
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      alert("Error al rechazar la invitación");
    }
  };

  const getReceivedInvitations = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return [];

    const user = JSON.parse(userStr);
    return invitations.filter(
      (invitation) => invitation.inviteeEmail === user.email
    );
  };

  const getSentInvitations = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return [];

    const user = JSON.parse(userStr);
    return invitations.filter((invitation) => invitation.creatorId === user.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#ffa500";
      case "accepted":
        return "#28a745";
      case "rejected":
        return "#dc3545";
      case "expired":
        return "#6c757d";
      default:
        return "#6c757d";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "accepted":
        return "Aceptada";
      case "rejected":
        return "Rechazada";
      case "expired":
        return "Expirada";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Invitaciones</h1>
        </header>
        <main className="dashboard-main">
          <div className="loading">Cargando invitaciones...</div>
        </main>
      </div>
    );
  }

  const receivedInvitations = getReceivedInvitations();
  const sentInvitations = getSentInvitations();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Invitaciones</h1>
        <button onClick={() => navigate("/dashboard")} className="back-button">
          ← Volver al Dashboard
        </button>
      </header>

      <main className="dashboard-main">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "received" ? "active" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Recibidas ({receivedInvitations.length})
          </button>
          <button
            className={`tab-button ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Enviadas ({sentInvitations.length})
          </button>
        </div>

        {activeTab === "received" && (
          <section className="invitations-section">
            <h2>Invitaciones Recibidas</h2>
            {receivedInvitations.length === 0 ? (
              <p className="no-invitations">
                No tienes invitaciones pendientes
              </p>
            ) : (
              <div className="invitations-list">
                {receivedInvitations.map((invitation) => (
                  <div key={invitation.id} className="invitation-card">
                    <div className="invitation-info">
                      <h4>{invitation.diagram?.name || "Diagrama"}</h4>
                      <p>
                        Invitado por:{" "}
                        {invitation.creator?.name ||
                          invitation.creator?.email ||
                          "Usuario"}
                      </p>
                      <p>
                        Estado:{" "}
                        <span
                          style={{
                            color: getStatusColor(invitation.status),
                            fontWeight: "bold",
                          }}
                        >
                          {getStatusText(invitation.status)}
                        </span>
                      </p>
                      {invitation.message && (
                        <p>Mensaje: {invitation.message}</p>
                      )}
                      <p>
                        Fecha:{" "}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="invitation-actions">
                      {invitation.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleAcceptInvitation(invitation.id)
                            }
                            className="accept-button"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() =>
                              handleDeclineInvitation(invitation.id)
                            }
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
            )}
          </section>
        )}

        {activeTab === "sent" && (
          <section className="invitations-section">
            <h2>Invitaciones Enviadas</h2>
            {sentInvitations.length === 0 ? (
              <p className="no-invitations">No has enviado invitaciones</p>
            ) : (
              <div className="invitations-list">
                {sentInvitations.map((invitation) => (
                  <div key={invitation.id} className="invitation-card">
                    <div className="invitation-info">
                      <h4>{invitation.diagram?.name || "Diagrama"}</h4>
                      <p>Invitado: {invitation.inviteeEmail}</p>
                      <p>
                        Estado:{" "}
                        <span
                          style={{
                            color: getStatusColor(invitation.status),
                            fontWeight: "bold",
                          }}
                        >
                          {getStatusText(invitation.status)}
                        </span>
                      </p>
                      {invitation.message && (
                        <p>Mensaje: {invitation.message}</p>
                      )}
                      <p>
                        Fecha:{" "}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Invitations;
