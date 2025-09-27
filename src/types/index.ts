// types.ts - Definiciones de tipos para el editor UML

export type CustomElement = {
  id: string;
  className: string;
  attributes: string[];
  methods: string[];
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
