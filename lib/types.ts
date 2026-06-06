/* =============================================================
 * PROYECTO: SISTEMA DE CONTROL DE EXISTENCIAS (KARDEX)
 * MÓDULO: DEFINICIÓN DE ESTRUCTURAS DE DATOS (TYPES)
 * DESARROLLADO POR: KHIPU
 * ESTADO: CÓDIGO PROPIETARIO - 100% FUNCIONAL
 * ============================================================= */

/**
 * Representación de un activo o mercadería dentro del ecosistema KHIPU.
 * Alineado a la estructura de control de inventarios SUNAT.
 */
export interface ActivoKhipu {
  id: string;
  codigo: string;
  nombre: string;
  unidadMedida: string;
  unidadMedidaCodigo: string; // SUNAT Tabla 6
  tipoExistencia: string;      // SUNAT Tabla 5
  stockMinimo: number;
  stockMaximo: number;
  observaciones: string;
}

/**
 * Clasificación de la naturaleza del movimiento de almacén.
 */
export type NaturalezaOperacion = 'ENTRADA' | 'SALIDA';

/**
 * Registro individual de una operación en el historial de movimientos.
 */
export interface OperacionKardex {
  id: string;
  activoId: string;
  fecha: string;
  tipo: NaturalezaOperacion;
  tipoDocumento: string;
  tipoOperacion: string; // SUNAT Tabla 12
  serie: string;
  numero: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  observaciones?: string;
  createdAt: number;
}

/**
 * Protocolos de valuación admitidos por el motor contable KHIPU.
 * El método UEPS ha sido removido por cumplimiento con normativa SUNAT.
 */
export type ProtocoloValuacion = 'PEPS' | 'PROMEDIO';

/**
 * Representa una unidad de carga o lote para métodos de capas (PEPS).
 */
export interface LoteKhipu {
  cantidad: number;
  costoUnitario: number;
}

/**
 * Estructura de salida para la visualización del Kardex oficial.
 */
export interface LineaKardexKH {
  fecha: string;
  tipoDocumento: string;
  tipoOperacion: string; // SUNAT Tabla 12
  serie: string;
  numero: string;
  tipo: NaturalezaOperacion;
  
  // Segmento de Entradas
  cantidadEntrada: number;
  costoUnitarioEntrada: number;
  costoTotalEntrada: number;
  
  // Segmento de Salidas
  cantidadSalida: number;
  costoUnitarioSalida: number;
  costoTotalSalida: number;
  
  // Segmento de Saldos Finales
  cantidadSaldo: number;
  costoUnitarioSaldo: number;
  costoTotalSaldo: number;
  observaciones?: string;
}

/**
 * Representa un usuario (alumno o admin) en el sistema local.
 */
export interface StudentUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'STUDENT';
  createdAt: number;
}
