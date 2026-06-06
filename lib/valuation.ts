/* =============================================================
 * PROYECTO: SISTEMA DE CONTROL DE EXISTENCIAS (KARDEX)
 * MÓDULO: MOTOR DE VALUACIÓN DE ACTIVOS
 * DESARROLLADO POR: KHIPU
 * ESTADO: CÓDIGO PROPIETARIO - 100% FUNCIONAL
 * ============================================================= */

import { OperacionKardex, LineaKardexKH, ProtocoloValuacion, LoteKhipu } from './types';

/**
 * Lógica pura para el cálculo de salidas bajo el método PEPS (FIFO).
 * Procesa la descarga de inventario por capas o lotes.
 * 
 * @param cantidadAVender Cantidad total a descargar.
 * @param lotesDisponibles Array de lotes vigentes [{cantidad, costoUnitario}].
 * @returns Objeto con el costo total, costo unitario resultante (promedio de la venta) y lotes actualizados.
 */
export function calcularSalidaPEPS(
  cantidadAVender: number,
  lotesDisponibles: LoteKhipu[]
) {
  const lotesActualizados = lotesDisponibles.map(l => ({ ...l })); // Clonar para pureza
  let pendientePorDescargar = cantidadAVender;
  let costoTotalVenta = 0;

  let i = 0;
  while (pendientePorDescargar > 0 && i < lotesActualizados.length) {
    const lote = lotesActualizados[i];
    if (lote.cantidad > 0) {
      const cantidadTomada = Math.min(pendientePorDescargar, lote.cantidad);
      costoTotalVenta += Number((cantidadTomada * lote.costoUnitario).toFixed(4));
      lote.cantidad = Number((lote.cantidad - cantidadTomada).toFixed(4));
      pendientePorDescargar = Number((pendientePorDescargar - cantidadTomada).toFixed(4));
    }
    
    if (lote.cantidad <= 0) {
      i++;
    } else {
      break; 
    }
  }

  // Costo Unitario de la venta (Total / Cantidad) para reporte/formulario
  const nuevoCostoUnitario = cantidadAVender > 0 ? costoTotalVenta / cantidadAVender : 0;

  return {
    costoTotalVenta: Number(costoTotalVenta.toFixed(4)),
    nuevoCostoUnitario: Number(nuevoCostoUnitario.toFixed(4)),
    lotesActualizados: lotesActualizados.filter(l => l.cantidad > 0)
  };
}

/**
 * Obtiene el estado final de los lotes vigentes después de procesar una serie de operaciones.
 */
export function obtenerEstadoLotesVigentes(
  operaciones: OperacionKardex[]
): LoteKhipu[] {
  // Solo se calcula bajo lógica PEPS implícita para obtener capas
  const operacionesOrdenadas = [...operaciones].sort((a, b) => {
    const dateA = new Date(a.fecha || Date.now()).getTime();
    const dateB = new Date(b.fecha || Date.now()).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  let lotes: LoteKhipu[] = [];
  for (const op of operacionesOrdenadas) {
    if (op.tipo === 'ENTRADA') {
      lotes.push({ cantidad: op.cantidad, costoUnitario: op.costoUnitario });
    } else {
      const resultado = calcularSalidaPEPS(op.cantidad, lotes);
      lotes = resultado.lotesActualizados;
    }
  }
  return lotes;
}

/**
 * MOTOR KHIPU: Ejecuta el cálculo de saldos y costos unitarios.
 * Cumple con la normativa SUNAT para el registro de inventario valorizado.
 */
export function ejecutarMotorKhipu(
  operaciones: OperacionKardex[],
  protocolo: ProtocoloValuacion
): LineaKardexKH[] {
  
  // Ordenamiento cronológico estricto por fecha y registro
  const operacionesOrdenadas = [...operaciones].sort((a, b) => {
    const dateA = new Date(a.fecha || Date.now()).getTime();
    const dateB = new Date(b.fecha || Date.now()).getTime();
    const timeA = isNaN(dateA) ? 0 : dateA;
    const timeB = isNaN(dateB) ? 0 : dateB;
    
    if (timeA !== timeB) return timeA - timeB;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  const historialKardex: LineaKardexKH[] = [];
  let colaLotesKhipu: LoteKhipu[] = []; 
  let stockAcumulado = 0;
  let valorTotalAcumulado = 0;

  for (const op of operacionesOrdenadas) {
    const linea: LineaKardexKH = {
      fecha: op.fecha,
      tipoDocumento: op.tipoDocumento,
      tipoOperacion: op.tipoOperacion,
      serie: op.serie,
      numero: op.numero,
      tipo: op.tipo,
      cantidadEntrada: 0,
      costoUnitarioEntrada: 0,
      costoTotalEntrada: 0,
      cantidadSalida: 0,
      costoUnitarioSalida: 0,
      costoTotalSalida: 0,
      cantidadSaldo: 0,
      costoUnitarioSaldo: 0,
      costoTotalSaldo: 0,
      observaciones: op.observaciones,
    };

    if (op.tipo === 'ENTRADA') {
      linea.cantidadEntrada = op.cantidad;
      linea.costoUnitarioEntrada = op.costoUnitario;
      linea.costoTotalEntrada = op.costoTotal;

      stockAcumulado += op.cantidad;
      valorTotalAcumulado += op.costoTotal;

      colaLotesKhipu.push({ cantidad: op.cantidad, costoUnitario: op.costoUnitario });
    } else {
      // PROCESAMIENTO DE SALIDAS (DESCARGA DE INVENTARIO)
      linea.cantidadSalida = op.cantidad;
      let costoTotalSalida = 0;

      if (protocolo === 'PROMEDIO') {
        const costoPromedioActual = stockAcumulado > 0 ? valorTotalAcumulado / stockAcumulado : 0;
        linea.costoUnitarioSalida = Number(costoPromedioActual.toFixed(4));
        linea.costoTotalSalida = Number((op.cantidad * linea.costoUnitarioSalida).toFixed(4));
        costoTotalSalida = linea.costoTotalSalida;
        
        // Actualizar lotes internamente si se requiere consistencia, aunque Promedio no los usa.
        // Pero para mantener colaLotesKhipu sincronizado (por si cambian de método):
        const resultadoFIFO = calcularSalidaPEPS(op.cantidad, colaLotesKhipu);
        colaLotesKhipu = resultadoFIFO.lotesActualizados;
      } else if (protocolo === 'PEPS') {
        const resultado = calcularSalidaPEPS(op.cantidad, colaLotesKhipu);
        costoTotalSalida = resultado.costoTotalVenta;
        linea.costoUnitarioSalida = Number(resultado.nuevoCostoUnitario.toFixed(4));
        linea.costoTotalSalida = resultado.costoTotalVenta;
        colaLotesKhipu = resultado.lotesActualizados;
      }

      stockAcumulado = Number((stockAcumulado - op.cantidad).toFixed(4));
      valorTotalAcumulado = Number((valorTotalAcumulado - costoTotalSalida).toFixed(4));
    }

    // ACTUALIZACIÓN DE SALDOS FINALES
    linea.cantidadSaldo = stockAcumulado;
    
    // Normalización de errores de precisión en punto flotante
    if (stockAcumulado <= 0) {
      stockAcumulado = 0;
      valorTotalAcumulado = 0;
      colaLotesKhipu = [];
    }
    
    if (protocolo === 'PEPS') {
      valorTotalAcumulado = colaLotesKhipu.reduce((sum, lote) => sum + (lote.cantidad * lote.costoUnitario), 0);
      linea.costoTotalSaldo = Number(valorTotalAcumulado.toFixed(4));
      linea.costoUnitarioSaldo = colaLotesKhipu.length > 0 ? Number(colaLotesKhipu[0].costoUnitario.toFixed(4)) : 0;
    } else {
      linea.costoTotalSaldo = Number(valorTotalAcumulado.toFixed(4));
      linea.costoUnitarioSaldo = stockAcumulado > 0 ? Number((valorTotalAcumulado / stockAcumulado).toFixed(4)) : 0;
    }

    historialKardex.push(linea);
  }

  return historialKardex;
}
