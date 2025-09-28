import React, { useState, useEffect, useMemo } from "react";
import type { CustomElement, UMLRelationship, ElementType } from "../types";

interface PropertiesPanelProps {
  selectedElement: CustomElement | UMLRelationship | null;
  onUpdateElement: (element: CustomElement) => void;
  onUpdateRelationship: (relationship: UMLRelationship) => void;
  onDeleteElement: (element: CustomElement | UMLRelationship) => void;
  onAssignToPackage: (elementId: string, packageId: string | null) => void;
  allElements: CustomElement[];
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onUpdateRelationship,
  onDeleteElement,
  onAssignToPackage,
  allElements,
  onClose,
}) => {
  // Estados para elementos
  const [className, setClassName] = useState("");
  const [attributes, setAttributes] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [stereotype, setStereotype] = useState("");
  const [customStereotype, setCustomStereotype] = useState("");
  const [useCustomStereotype, setUseCustomStereotype] = useState(false);

  // Estados para relaciones
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [sourceMultiplicity, setSourceMultiplicity] = useState("");
  const [targetMultiplicity, setTargetMultiplicity] = useState("");
  const [sourceRole, setSourceRole] = useState("");
  const [targetRole, setTargetRole] = useState("");

  // Estereotipos comunes por tipo de elemento
  const commonStereotypes = useMemo<Record<ElementType, string[]>>(
    () => ({
      class: [
        "entity", // Entidades de negocio
        "control", // Lógica de control
        "boundary", // Interfaz con usuario/sistema externo
        "service", // Servicios del sistema
        "repository", // Acceso a datos
        "DTO", // Objetos de transferencia de datos
      ],
      interface: [
        "API", // Interfaces de API
        "remote", // Interfaces remotas
        "local", // Interfaces locales
        "callback", // Interfaces de callback
      ],
      enumeration: ["enumeration"],
      package: [
        "system", // Sistemas completos
        "subsystem", // Subsistemas
        "layer", // Capas arquitecturales
        "module", // Módulos del sistema
      ],
      note: [],
    }),
    []
  );

  // Actualizar el estado local cuando cambia el elemento seleccionado
  useEffect(() => {
    if (selectedElement) {
      if ("className" in selectedElement) {
        // Es un CustomElement
        const element = selectedElement as CustomElement;
        setClassName(element.className);
        setAttributes([...element.attributes]);
        setMethods([...(element.methods || [])]);

        const elementStereotype = element.stereotype || "";
        setStereotype(elementStereotype);
        setCustomStereotype("");
        setUseCustomStereotype(false);

        // Si el estereotipo no está en la lista de comunes, activar modo personalizado
        if (elementStereotype) {
          const isCommon =
            commonStereotypes[element.elementType].includes(elementStereotype);
          if (!isCommon) {
            setUseCustomStereotype(true);
            setCustomStereotype(elementStereotype);
            setStereotype("");
          }
        }

        // Limpiar campos de relación
        setRelationshipLabel("");
        setSourceMultiplicity("");
        setTargetMultiplicity("");
        setSourceRole("");
        setTargetRole("");
      } else {
        // Es un UMLRelationship
        const relationship = selectedElement as UMLRelationship;
        setRelationshipLabel(relationship.label || "");
        setSourceMultiplicity(relationship.sourceMultiplicity || "");
        setTargetMultiplicity(relationship.targetMultiplicity || "");
        setSourceRole(relationship.sourceRole || "");
        setTargetRole(relationship.targetRole || "");

        // Limpiar campos de elemento
        setClassName("");
        setAttributes([]);
        setMethods([]);
        setStereotype("");
        setCustomStereotype("");
        setUseCustomStereotype(false);
      }
    }
  }, [selectedElement, commonStereotypes]);

  const handleUpdate = () => {
    if (selectedElement && "className" in selectedElement) {
      const updatedElement = {
        ...selectedElement,
        className,
        attributes,
        methods,
        stereotype:
          (useCustomStereotype ? customStereotype : stereotype) || undefined,
      };
      onUpdateElement(updatedElement);
    } else if (selectedElement) {
      const updatedRelationship = {
        ...selectedElement,
        label: relationshipLabel,
        sourceMultiplicity,
        targetMultiplicity,
        sourceRole,
        targetRole,
      };
      onUpdateRelationship(updatedRelationship);
    }
  };

  const handleSave = () => {
    if (selectedElement && "className" in selectedElement) {
      const updatedElement = {
        ...selectedElement,
        className,
        attributes,
        methods,
        stereotype:
          (useCustomStereotype ? customStereotype : stereotype) || undefined,
      };
      onUpdateElement(updatedElement);
    } else if (selectedElement) {
      const updatedRelationship = {
        ...selectedElement,
        label: relationshipLabel,
        sourceMultiplicity,
        targetMultiplicity,
        sourceRole,
        targetRole,
      };
      onUpdateRelationship(updatedRelationship);
    }
    onClose();
  };

  const handleDelete = () => {
    if (selectedElement) {
      onDeleteElement(selectedElement);
      onClose();
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, ""]);
  };

  const updateAttribute = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = value;
    setAttributes(newAttributes);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const addMethod = () => {
    setMethods([...methods, ""]);
  };

  const updateMethod = (index: number, value: string) => {
    const newMethods = [...methods];
    newMethods[index] = value;
    setMethods(newMethods);
  };

  const removeMethod = (index: number) => {
    setMethods(methods.filter((_, i) => i !== index));
  };

  const getElementTypeLabel = (element: CustomElement): string => {
    const typeLabels = {
      class: "Clase",
      interface: "Interfaz",
      enumeration: "Enumeración",
      package: "Paquete",
      note: "Nota",
    };
    return typeLabels[element.elementType] || "Elemento";
  };

  if (!selectedElement) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        width: "320px",
        backgroundColor: "white",
        border: "2px solid #007bff",
        borderRadius: "12px",
        boxShadow: "0 8px 25px rgba(0, 123, 255, 0.15)",
        zIndex: 1000,
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "2px solid #e3f2fd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            color: "#1976d2",
            fontWeight: "600",
          }}
        >
          {selectedElement && "className" in selectedElement
            ? getElementTypeLabel(selectedElement)
            : "Etiqueta de la relación:"}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#666",
            padding: "4px",
            borderRadius: "50%",
            transition: "all 0.2s",
          }}
          title="Cerrar panel"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
            e.currentTarget.style.color = "#333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#666";
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        {selectedElement && "className" in selectedElement ? (
          <>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Nombre:
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e3f2fd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1976d2";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e3f2fd";
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Estereotipo:
              </label>
              <select
                value={useCustomStereotype ? "custom" : stereotype}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setUseCustomStereotype(true);
                    setStereotype("");
                  } else {
                    setUseCustomStereotype(false);
                    setStereotype(e.target.value);
                    setCustomStereotype("");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e3f2fd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  transition: "border-color 0.2s",
                  marginBottom: "5px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1976d2";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e3f2fd";
                  handleUpdate();
                }}
              >
                <option value="">Sin estereotipo</option>
                {selectedElement &&
                  "elementType" in selectedElement &&
                  commonStereotypes[selectedElement.elementType]?.map(
                    (stereotypeOption) => (
                      <option key={stereotypeOption} value={stereotypeOption}>
                        {stereotypeOption}
                      </option>
                    )
                  )}
                <option value="custom">Otro (personalizado)...</option>
              </select>
              {useCustomStereotype && (
                <input
                  type="text"
                  value={customStereotype}
                  onChange={(e) => setCustomStereotype(e.target.value)}
                  placeholder="Ingresa tu estereotipo personalizado"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "2px solid #e3f2fd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1976d2";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e3f2fd";
                  }}
                />
              )}
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <label style={{ fontWeight: "bold" }}>Atributos:</label>
                <button
                  onClick={addAttribute}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  style={{ display: "flex", gap: "5px", marginBottom: "5px" }}
                >
                  <input
                    type="text"
                    value={attr}
                    onChange={(e) => updateAttribute(index, e.target.value)}
                    placeholder="nombre: tipo"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      border: "2px solid #e3f2fd",
                      borderRadius: "4px",
                      fontSize: "12px",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1976d2";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e3f2fd";
                    }}
                  />
                  <button
                    onClick={() => removeAttribute(index)}
                    style={{
                      padding: "6px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <label style={{ fontWeight: "bold" }}>Métodos:</label>
                <button
                  onClick={addMethod}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
              {methods.map((method, index) => (
                <div
                  key={index}
                  style={{ display: "flex", gap: "5px", marginBottom: "5px" }}
                >
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => updateMethod(index, e.target.value)}
                    placeholder="nombre(): tipo"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      border: "2px solid #e3f2fd",
                      borderRadius: "4px",
                      fontSize: "12px",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1976d2";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e3f2fd";
                    }}
                  />
                  <button
                    onClick={() => removeMethod(index)}
                    style={{
                      padding: "6px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {selectedElement.elementType === "class" && (
              <>
                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Asignar a paquete:
                  </label>
                  <div
                    style={{
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                      padding: "10px",
                      maxHeight: "150px",
                      overflowY: "auto",
                    }}
                  >
                    {allElements
                      .filter((el) => el.elementType === "package")
                      .map((pkg) => {
                        const isAssigned =
                          pkg.containedElements?.includes(selectedElement.id) ||
                          false;
                        return (
                          <div
                            key={pkg.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "5px",
                            }}
                          >
                            <span style={{ fontSize: "12px" }}>
                              {pkg.className}
                            </span>
                            <button
                              onClick={() =>
                                onAssignToPackage(
                                  selectedElement.id,
                                  isAssigned ? null : pkg.id
                                )
                              }
                              style={{
                                padding: "2px 6px",
                                backgroundColor: isAssigned
                                  ? "#28a745"
                                  : "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "3px",
                                fontSize: "10px",
                                cursor: "pointer",
                              }}
                              title={
                                isAssigned
                                  ? "Remover de este paquete"
                                  : "Asignar a este paquete"
                              }
                            >
                              {isAssigned ? "✓" : "+"}
                            </button>
                          </div>
                        );
                      })}
                    {selectedElement.parentPackageId && (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "5px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "3px",
                        }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                          Actualmente en:{" "}
                          {
                            allElements.find(
                              (el) => el.id === selectedElement.parentPackageId
                            )?.className
                          }
                        </span>
                        <button
                          onClick={() =>
                            onAssignToPackage(selectedElement.id, null)
                          }
                          style={{
                            marginLeft: "10px",
                            padding: "2px 6px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                          title="Remover del paquete"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Etiqueta:
              </label>
              <input
                type="text"
                value={relationshipLabel}
                onChange={(e) => setRelationshipLabel(e.target.value)}
                placeholder="ej: contiene, usa, extiende"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e3f2fd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1976d2";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e3f2fd";
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Multiplicidad origen:
              </label>
              <select
                value={sourceMultiplicity}
                onChange={(e) => setSourceMultiplicity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e3f2fd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1976d2";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e3f2fd";
                }}
              >
                <option value="">Sin multiplicidad</option>
                <option value="1">1 (uno)</option>
                <option value="*">* (cero o más)</option>
                <option value="0..1">0..1 (opcional)</option>
                <option value="1..*">1..* (uno o más)</option>
                <option value="0..*">0..* (cero o más)</option>
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Rol origen:
              </label>
              <input
                type="text"
                value={sourceRole}
                onChange={(e) => setSourceRole(e.target.value)}
                placeholder="ej: propietario, cliente"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e3f2fd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1976d2";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e3f2fd";
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Multiplicidad destino:
              </label>
              <select
                value={targetMultiplicity}
                onChange={(e) => setTargetMultiplicity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e3f2fd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1976d2";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e3f2fd";
                }}
              >
                <option value="">Sin multiplicidad</option>
                <option value="1">1 (uno)</option>
                <option value="*">* (cero o más)</option>
                <option value="0..1">0..1 (opcional)</option>
                <option value="1..*">1..* (uno o más)</option>
                <option value="0..*">0..* (cero o más)</option>
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Rol destino:
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="ej: contenido, usado"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e3f2fd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1976d2";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e3f2fd";
                }}
              />
            </div>
          </>
        )}

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s",
              boxShadow: "0 2px 4px rgba(25, 118, 210, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1565c0";
              e.currentTarget.style.boxShadow =
                "0 4px 8px rgba(25, 118, 210, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1976d2";
              e.currentTarget.style.boxShadow =
                "0 2px 4px rgba(25, 118, 210, 0.2)";
            }}
          >
            💾 Guardar
          </button>
          <button
            onClick={handleDelete}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s",
              boxShadow: "0 2px 4px rgba(220, 53, 69, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#c82333";
              e.currentTarget.style.boxShadow =
                "0 4px 8px rgba(220, 53, 69, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#dc3545";
              e.currentTarget.style.boxShadow =
                "0 2px 4px rgba(220, 53, 69, 0.2)";
            }}
          >
            🗑️ Eliminar Elemento
          </button>
        </div>
      </div>
    </div>
  );
};
