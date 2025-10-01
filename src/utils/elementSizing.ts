import type { CustomElement } from "../types";

/**
 * Calcula el ancho de un texto considerando caracteres especiales
 * @param text El texto a medir
 * @returns El ancho aproximado en píxeles
 */
const calculateTextWidth = (text: string): number => {
  const charWidth = 7.2; // Ancho base para caracteres normales
  const wideCharWidth = 9.6; // Ancho para caracteres anchos (acentos, caracteres especiales)

  let totalWidth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);

    // Caracteres anchos (acentos, caracteres especiales, emojis)
    if (charCode > 127 || char === "«" || char === "»" || char === "📦") {
      totalWidth += wideCharWidth;
    } else {
      totalWidth += charWidth;
    }
  }

  return totalWidth;
};

/**
 * Calcula el ancho óptimo para un elemento UML basado en su contenido
 * @param element El elemento UML
 * @returns El ancho calculado en píxeles
 */
export const calculateElementWidth = (
  element: Partial<CustomElement>
): number => {
  const baseWidth = 140; // Ancho mínimo aumentado
  const padding = 48; // Padding horizontal total aumentado (24px cada lado)
  const iconWidth = 20; // Espacio adicional para iconos

  // Recopilar todos los textos que pueden afectar el ancho
  const texts: string[] = [];

  // Nombre de la clase con indicadores de tipo
  let classNameText = element.className || "";
  if (element.elementType === "interface") {
    classNameText = `«interface» ${classNameText}`;
  } else if (element.elementType === "enumeration") {
    classNameText = `«enumeration» ${classNameText}`;
  } else if (element.elementType === "package") {
    classNameText = `📦 ${classNameText}`;
  }
  texts.push(classNameText);

  // Estereotipo si existe
  if (element.stereotype) {
    texts.push(element.stereotype);
  }

  // Atributos
  if (element.attributes && element.attributes.length > 0) {
    texts.push(...element.attributes);
  }

  // Métodos
  if (element.methods && element.methods.length > 0) {
    texts.push(...element.methods);
  }

  // Para enumeraciones, usar los valores de atributos
  if (element.elementType === "enumeration" && element.attributes) {
    texts.push(...element.attributes);
  }

  // Para notas, usar líneas de atributos
  if (element.elementType === "note" && element.attributes) {
    texts.push(...element.attributes);
  }

  // Encontrar el texto más largo
  const longestText = texts.reduce((longest, current) => {
    return current.length > longest.length ? current : longest;
  }, "");

  // Calcular ancho basado en el texto más largo usando medición precisa
  const textWidth = calculateTextWidth(longestText);

  // Agregar espacio extra para elementos con iconos
  const hasIcon = element.elementType === "package";
  const iconSpace = hasIcon ? iconWidth : 0;

  const calculatedWidth = Math.max(baseWidth, textWidth + padding + iconSpace);

  // Limitar ancho máximo para evitar elementos demasiado anchos
  return Math.min(calculatedWidth, 450);
};

/**
 * Calcula el alto óptimo para un elemento UML basado en su contenido
 * @param element El elemento UML
 * @returns El alto calculado en píxeles
 */
export const calculateElementHeight = (
  element: Partial<CustomElement>
): number => {
  const baseHeight = 80; // Alto mínimo para el header
  const lineHeight = 18; // Alto aproximado por línea
  const padding = 16; // Padding vertical total

  let lineCount = 1; // Al menos el nombre de la clase

  // Contar líneas de atributos
  if (element.attributes && element.attributes.length > 0) {
    lineCount += element.attributes.length;
  }

  // Contar líneas de métodos
  if (element.methods && element.methods.length > 0) {
    lineCount += element.methods.length;
  }

  // Para interfaces, solo mostrar métodos
  if (element.elementType === "interface") {
    lineCount = 1 + (element.methods?.length || 0);
  }

  // Para enumeraciones, contar valores
  if (element.elementType === "enumeration") {
    lineCount = 1 + (element.attributes?.length || 0);
  }

  // Para notas, contar líneas de texto
  if (element.elementType === "note") {
    lineCount = 1 + (element.attributes?.length || 0);
  }

  // Para paquetes, agregar espacio para elementos contenidos
  if (element.elementType === "package") {
    lineCount += 1; // Espacio adicional para el indicador de paquete
  }

  const calculatedHeight = baseHeight + lineCount * lineHeight + padding;

  // Limitar alto máximo
  return Math.min(calculatedHeight, 300);
};
