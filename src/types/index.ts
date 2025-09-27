// types.ts - Definiciones de tipos para el editor UML

export type ElementType = "class" | "interface" | "enumeration" | "package" | "note";

export type CustomElement = {
  id: string;
  className: string;
  attributes: string[];
  methods: string[];
  elementType: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type UMLRelationship = {
  id: string;
  source: string;
  target: string;
  relationship:
    | "association"
    | "aggregation"
    | "composition"
    | "generalization"
    | "dependency"
    | "realization";
  label?: string;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  sourceRole?: string;
  targetRole?: string;
};
