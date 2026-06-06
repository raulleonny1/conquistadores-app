export type FirestoreDocBase = {
  id: string;
};

export type MiembroDoc = FirestoreDocBase & {
  nombre?: string;
  nombres?: string;
  displayName?: string;
  edad?: number | string;
  rango?: string;
  unidad?: string;
  pin?: string;
  clubId?: string;
};

export type UnidadDoc = FirestoreDocBase & {
  nombre?: string;
  displayName?: string;
  clubId?: string;
};

export type EventoDoc = FirestoreDocBase & {
  nombre?: string;
  titulo?: string;
  fecha?: string;
  lugar?: string;
  clubId?: string;
};

export type EspecialidadDoc = FirestoreDocBase & {
  nombre?: string;
  titulo?: string;
  categoria?: string;
  clubId?: string;
};

export type AspiranteDoc = FirestoreDocBase & {
  nombre?: string;
  nombres?: string;
  pin?: string;
  clubId?: string;
};

export type ConsejeroDoc = FirestoreDocBase & {
  nombre?: string;
  nombres?: string;
  unidad?: string;
  pin?: string;
  clubId?: string;
};
