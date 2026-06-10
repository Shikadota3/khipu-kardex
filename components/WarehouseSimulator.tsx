/* =============================================================
 * PROYECTO: SISTEMA DE CONTROL DE EXISTENCIAS (KARDEX)
 * MÓDULO: INTERFAZ DE GESTIÓN Y SIMULACIÓN (UI)
 * DESARROLLADO POR: KHIPU
 * ESTADO: CÓDIGO PROPIETARIO - 100% FUNCIONAL
 * ============================================================= */

'use client';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  FileText, 
  Settings, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Trash2,
  Database,
  History,
  BarChart3,
  X,
  User,
  Upload,
  Users,
  LogOut,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ActivoKhipu, 
  OperacionKardex, 
  ProtocoloValuacion, 
  LineaKardexKH, 
  StudentUser 
} from '@/lib/types';
import StudentManagement from '@/components/StudentManagement';
import { ejecutarMotorKhipu, calcularSalidaPEPS, obtenerEstadoLotesVigentes } from '@/lib/valuation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-none border-l-4 transition-all duration-300 group ${
      active 
        ? 'bg-[#E7EEF8] border-[#2B579A] text-[#2B579A]' 
        : 'text-[#666] border-transparent hover:bg-gray-100 hover:text-[#2B579A]'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={active ? 'text-[#2B579A]' : 'text-[#999] group-hover:text-[#2B579A]'} />
      <span className="font-sans text-[11px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    {active && <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />}
  </button>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-[#DEE2E6] rounded-none shadow-sm relative overflow-hidden ${className}`}>
    {children}
  </div>
);

const StatCard = ({ icon: Icon, label, value, subtext, trend, colorClass }: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  value: string | number;
  subtext: string;
  trend?: string | number;
  colorClass: string;
}) => (
  <Card className="p-6 flex flex-col justify-between h-full group hover:border-[#2B579A]/40 transition-all border-t-4 border-t-[#2B579A] relative overflow-hidden">
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-[#2B579A] group-hover:scale-110 transition-transform duration-500">
      <Icon size={120} />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-2 rounded-sm ${colorClass} transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={18} />
        </div>
        <span className="text-[9px] font-sans font-bold text-[#999] uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div>
        <h3 className="text-4xl font-sans font-bold tracking-tighter text-[#2B579A]">{value}</h3>
        <div className="flex items-center gap-2 mt-2">
          {trend && <span className="text-[9px] font-sans font-bold text-[#2B579A]">+{trend}%</span>}
          <p className="text-[10px] text-[#666] font-sans uppercase tracking-tight">{subtext}</p>
        </div>
      </div>
    </div>
  </Card>
);

// --- Helpers ---

function safeDate(dateStr: string | number | Date) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function getTabla12(code: string) {
  const table: Record<string, string> = {
    '01': 'VENTA',
    '02': 'COMPRA',
    '03': 'CONSIGNACIÓN RECIBIDA',
    '04': 'CONSIGNACIÓN ENTREGADA',
    '05': 'DEVOLUCIÓN RECIBIDA',
    '06': 'DEVOLUCIÓN ENTREGADA',
    '07': 'PROMOCIÓN',
    '08': 'PREMIO',
    '09': 'DONACIÓN',
    '10': 'SALIDA A PRODUCCIÓN',
    '11': 'TRANSFERENCIA ENTRE ALMACENES',
    '12': 'RETIRO',
    '13': 'MERMAS',
    '14': 'DESMEDROS',
    '15': 'DESTRUCCIÓN',
    '16': 'SALDO INICIAL',
    '99': 'OTROS (ESPECIFICAR)'
  };
  return table[code] || 'OTROS';
}

function getTabla5Label(code: string) {
  const labels: Record<string, string> = {
    '01': 'MERCADERÍA',
    '02': 'PRODUCTO TERMINADO',
    '03': 'MATERIAS PRIMAS Y AUXILIARES - MATERIALES',
    '04': 'ENVASES Y EMBALAJES',
    '05': 'SUMINISTROS DIVERSOS',
    '99': 'OTROS (ESPECIFICAR)'
  };
  return labels[code] || 'MERCADERÍA';
}

function getTabla10Code(type: string) {
  const t = type.toUpperCase();
  if (/^\d{2}$/.test(t)) return t;
  if (t.includes('FACTURA')) return '01';
  if (t.includes('RECIBO POR HONORARIOS')) return '02';
  if (t.includes('BOLETA')) return '03';
  if (t.includes('LIQUIDACIÓN DE COMPRA')) return '04';
  if (t.includes('BOLETO DE COMPAÑÍA DE AVIACIÓN')) return '05';
  if (t.includes('CARTA DE PORTE AÉREO')) return '06';
  if (t.includes('NOTA DE CRÉDITO') || t.includes('CREDITO')) return '07';
  if (t.includes('NOTA DE DÉBITO') || t.includes('DEBITO')) return '08';
  if (t.includes('GUÍA DE REMISIÓN - REMITENTE') || t.includes('GUIA')) return '09';
  if (t.includes('DOCUMENTO INTERNO') || t.includes('INTERNO')) return '50';
  if (t.includes('RECIBO POR ARRENDAMIENTO')) return '10';
  if (t.includes('PÓLIZA EMITIDA POR LAS BOLSAS')) return '11';
  if (t.includes('TICKET')) return '12';
  if (t.includes('DOCUMENTO EMITIDO POR BANCOS')) return '13';
  return '00';
}

export default function WarehouseSimulator() {
  const [currentUser] = useState<StudentUser | null>(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('khipu_session') || sessionStorage.getItem('khipu_session');
      return session ? JSON.parse(session) : null;
    }
    return null;
  });
  const [mounted, setMounted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('khipu_session');
    sessionStorage.removeItem('khipu_session');
    window.location.reload();
  };
  
  // --- ESTADOS DE EMPRESA ---
  const [empresaConfig, setEmpresaConfig] = useState<{
    nombre: string;
    ruc: string;
    telefono: string;
    direccion: string;
    configurada: boolean;
  }>({
    nombre: 'KHIPU SOLUCIONES',
    ruc: '20601234567',
    telefono: '+51 999 999 999',
    direccion: 'Av. Principal 123, Cusco',
    configurada: true
  });

  // --- ESTADOS DEL MAESTRO Y BITÁCORA ---
  const [maestroActivos, setMaestroActivos] = useState<ActivoKhipu[]>([]);
  const [bitacoraOperaciones, setBitacoraOperaciones] = useState<OperacionKardex[]>([]);
  const [protocoloActivo, setProtocoloActivo] = useState<ProtocoloValuacion>('PROMEDIO');
  
  // --- ESTADOS DE NAVEGACIÓN Y FILTROS ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activoSeleccionadoId, setActivoSeleccionadoId] = useState<string>('');
  const esKardexVacio = bitacoraOperaciones.length === 0;
  const [terminoBusquedaActivo, setTerminoBusquedaActivo] = useState('');
  const [terminoBusquedaKardex, setTerminoBusquedaKardex] = useState('');
  const [busquedaActivoModal, setBusquedaActivoModal] = useState('');
  const [fechaActual, setFechaActual] = useState(new Date());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stagedItems, setStagedItems] = useState<any[]>([]);
  
  // --- ESTADOS DE AJUSTE DE INVENTARIO FÍSICO ---
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [physicalCounts, setPhysicalCounts] = useState<{[key: string]: number}>({});
  const [adjustmentSerie, setAdjustmentSerie] = useState('AJUS');
  const [adjustmentNumero, setAdjustmentNumero] = useState('');
  const [adjustmentFecha, setAdjustmentFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adjustmentObs, setAdjustmentObs] = useState('Ajuste de inventario físico valorizado');
  const [filterAdjustmentSearch, setFilterAdjustmentSearch] = useState('');

  // --- ESTADOS DE MODALES Y FORMULARIOS ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [isMovementFromAdjust, setIsMovementFromAdjust] = useState(false);
  const [showStockAlertModal, setShowStockAlertModal] = useState(false);
  const [showMovementReportModal, setShowMovementReportModal] = useState(false);
  const [showLowMovementModal, setShowLowMovementModal] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  // Auth admin para ajustes
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminAuthUser, setAdminAuthUser] = useState('');
  const [adminAuthPass, setAdminAuthPass] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [showAdminAuthPass, setShowAdminAuthPass] = useState(false);
  const [pendingAjuste, setPendingAjuste] = useState(false);
  const [editingMovement, setEditingMovement] = useState<OperacionKardex | null>(null);
  const [editMotivo, setEditMotivo] = useState('');
  const [showEditMovementModal, setShowEditMovementModal] = useState(false);
  const [editAdminUser, setEditAdminUser] = useState('');
  const [editAdminPass, setEditAdminPass] = useState('');
  const [editAdminError, setEditAdminError] = useState('');
  const [editAdminLoading, setEditAdminLoading] = useState(false);
  const [showEditAdminPass, setShowEditAdminPass] = useState(false);

  // --- LÓGICA DE RESUMEN MENSUAL ---
  const resumenMensual = React.useMemo(() => {
    if (!activoSeleccionadoId) return [];
    const kardexCompleto = ejecutarMotorKhipu(
      bitacoraOperaciones.filter(m => m.activoId === activoSeleccionadoId), 
      protocoloActivo
    );
    const meses: Record<string, LineaKardexKH> = {};
    kardexCompleto.forEach(line => {
      const date = safeDate(line.fecha);
      const key = format(date, 'yyyy-MM');
      meses[key] = line;
    });
    return Object.entries(meses).map(([month, lastLine]) => ({
      periodo: month,
      saldoFinal: lastLine.cantidadSaldo,
      valorTotal: lastLine.costoTotalSaldo,
      costoUnitario: lastLine.costoUnitarioSaldo
    })).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [activoSeleccionadoId, bitacoraOperaciones, protocoloActivo]);
  
  const activosFiltrados = maestroActivos.filter(p => 
    (p.nombre || '').toLowerCase().includes((terminoBusquedaActivo || '').toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes((terminoBusquedaActivo || '').toLowerCase())
  );

  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    type: 'product' | 'movement' | 'all', 
    id?: string,
    title: string,
    message: string
  } | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nuevoActivo, setNuevoActivo] = useState<any>({
    codigo: '', 
    nombre: '', 
    unidadMedida: 'UNIDADES', 
    unidadMedidaCodigo: '07',
    tipoExistencia: '01',
    stockMinimo: 10, 
    stockMaximo: 100, 
    observaciones: '', 
    initialStock: 0, 
    initialCost: 0
  });
  
  const [nuevaOperacion, setNuevaOperacion] = useState<Partial<OperacionKardex>>({
    tipo: 'ENTRADA', tipoDocumento: '01', tipoOperacion: '02', serie: 'F001', numero: '', cantidad: 0, costoUnitario: 0, fecha: format(new Date(), 'yyyy-MM-dd'), observaciones: ''
  });

  // --- ESTADOS LOCALES PARA ENTRADA DE CANTIDAD, COSTO Y CÁLCULOS DE IGV ---
  const [localCantidad, setLocalCantidad] = useState<string>('');
  const [localCostoSinIGV, setLocalCostoSinIGV] = useState<string>('');
  const [localCostoConIGV, setLocalCostoConIGV] = useState<string>('');
  const [localTotalConIGV, setLocalTotalConIGV] = useState<string>('');
  const [localGrabado, setLocalGrabado] = useState<boolean>(true);
  const [focusedField, setFocusedField] = useState<'cantidad' | 'costoSin' | 'costoCon' | 'totalCon' | null>(null);

  const obtenerSaldoFisico = useCallback((productId: string) => {
    const ops = bitacoraOperaciones.filter(m => m.activoId === productId);
    const kardex = ejecutarMotorKhipu(ops, protocoloActivo);
    return kardex.length > 0 ? kardex[kardex.length - 1].cantidadSaldo : 0;
  }, [bitacoraOperaciones, protocoloActivo]);

  const obtenerCostoUnitarioActual = useCallback((productId: string) => {
    const ops = bitacoraOperaciones.filter(m => m.activoId === productId);
    const kardex = ejecutarMotorKhipu(ops, protocoloActivo);
    return kardex.length > 0 ? kardex[kardex.length - 1].costoUnitarioSaldo : 0;
  }, [bitacoraOperaciones, protocoloActivo]);

  // --- CONTROLADORAS DE CÁLCULO TRIPLE CON IGV ---
  const recalculateFromSin = (sinStr: string, qtyStr: string, isGrabado: boolean, source?: 'costoSin' | 'costoCon' | 'totalCon' | 'cantidad' | 'grabado') => {
    const parsedSin = sinStr === '' ? 0 : parseFloat(sinStr);
    const parsedQty = qtyStr === '' ? 0 : parseFloat(qtyStr);
    if (parsedQty > 0) {
      const rawConIGV = isGrabado ? parsedSin * 1.18 : parsedSin;
      const totalVal = rawConIGV * parsedQty;
      const roundedTotal = Math.round((totalVal + Number.EPSILON) * 100) / 100;
      const conIGV = roundedTotal / parsedQty;
      const sinIGV = isGrabado ? conIGV / 1.18 : conIGV;
      if (source !== 'costoCon') setLocalCostoConIGV(sinStr === '' ? '' : conIGV.toFixed(4));
      if (source !== 'costoSin') setLocalCostoSinIGV(sinStr === '' ? '' : sinIGV.toFixed(4));
      if (source !== 'totalCon') setLocalTotalConIGV(sinStr === '' || qtyStr === '' ? '' : roundedTotal.toFixed(2));
      setNuevaOperacion(prev => ({ ...prev, cantidad: parsedQty, costoUnitario: sinIGV }));
    } else {
      const conIGV = isGrabado ? parsedSin * 1.18 : parsedSin;
      if (source !== 'costoCon') setLocalCostoConIGV(sinStr === '' ? '' : conIGV.toFixed(4));
      if (source !== 'costoSin') setLocalCostoSinIGV(sinStr === '' ? '' : parsedSin.toFixed(4));
      if (source !== 'totalCon') setLocalTotalConIGV('');
      setNuevaOperacion(prev => ({ ...prev, cantidad: 0, costoUnitario: parsedSin }));
    }
  };

  const recalculateFromCon = (conStr: string, qtyStr: string, isGrabado: boolean, source?: 'costoSin' | 'costoCon' | 'totalCon' | 'cantidad' | 'grabado') => {
    const parsedCon = conStr === '' ? 0 : parseFloat(conStr);
    const parsedQty = qtyStr === '' ? 0 : parseFloat(qtyStr);
    if (parsedQty > 0) {
      const totalVal = parsedCon * parsedQty;
      const roundedTotal = Math.round((totalVal + Number.EPSILON) * 100) / 100;
      const conIGV = roundedTotal / parsedQty;
      const sinIGV = isGrabado ? conIGV / 1.18 : conIGV;
      if (source !== 'costoCon') setLocalCostoConIGV(conStr === '' ? '' : conIGV.toFixed(4));
      if (source !== 'costoSin') setLocalCostoSinIGV(conStr === '' ? '' : sinIGV.toFixed(4));
      if (source !== 'totalCon') setLocalTotalConIGV(conStr === '' || qtyStr === '' ? '' : roundedTotal.toFixed(2));
      setNuevaOperacion(prev => ({ ...prev, cantidad: parsedQty, costoUnitario: sinIGV }));
    } else {
      const sinIGV = isGrabado ? parsedCon / 1.18 : parsedCon;
      if (source !== 'costoSin') setLocalCostoSinIGV(conStr === '' ? '' : sinIGV.toFixed(4));
      if (source !== 'costoCon') setLocalCostoConIGV(conStr === '' ? '' : parsedCon.toFixed(4));
      if (source !== 'totalCon') setLocalTotalConIGV('');
      setNuevaOperacion(prev => ({ ...prev, cantidad: 0, costoUnitario: sinIGV }));
    }
  };

  const recalculateFromTotal = (totalStr: string, qtyStr: string, isGrabado: boolean, source?: 'costoSin' | 'costoCon' | 'totalCon' | 'cantidad' | 'grabado') => {
    const parsedTotal = totalStr === '' ? 0 : parseFloat(totalStr);
    const parsedQty = qtyStr === '' ? 0 : parseFloat(qtyStr);
    if (parsedQty > 0) {
      const conIGV = parsedTotal / parsedQty;
      const sinIGV = isGrabado ? conIGV / 1.18 : conIGV;
      if (source !== 'costoCon') setLocalCostoConIGV(totalStr === '' ? '' : conIGV.toFixed(4));
      if (source !== 'costoSin') setLocalCostoSinIGV(totalStr === '' ? '' : sinIGV.toFixed(4));
      if (source !== 'totalCon') setLocalTotalConIGV(totalStr === '' ? '' : parsedTotal.toFixed(2));
      setNuevaOperacion(prev => ({ ...prev, cantidad: parsedQty, costoUnitario: sinIGV }));
    } else {
      if (source !== 'costoCon') setLocalCostoConIGV('');
      if (source !== 'costoSin') setLocalCostoSinIGV('');
      if (source !== 'totalCon') setLocalTotalConIGV(totalStr);
      setNuevaOperacion(prev => ({ ...prev, cantidad: 0, costoUnitario: 0 }));
    }
  };

  const handleCantidadChange = (valStr: string) => {
    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
      setLocalCantidad(valStr);
      recalculateFromSin(localCostoSinIGV, valStr, localGrabado, 'cantidad');
    }
  };

  const handleCostoSinIGVChange = (valStr: string) => {
    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
      setLocalCostoSinIGV(valStr);
      recalculateFromSin(valStr, localCantidad, localGrabado, 'costoSin');
    }
  };

  const handleCostoConIGVChange = (valStr: string) => {
    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
      setLocalCostoConIGV(valStr);
      recalculateFromCon(valStr, localCantidad, localGrabado, 'costoCon');
    }
  };

  const handleTotalConIGVChange = (valStr: string) => {
    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
      setLocalTotalConIGV(valStr);
      recalculateFromTotal(valStr, localCantidad, localGrabado, 'totalCon');
    }
  };

  const formatOnBlur = (field: 'cantidad' | 'costoSin' | 'costoCon' | 'totalCon') => {
    setFocusedField(null);
    if (field === 'costoSin') {
      const parsed = parseFloat(localCostoSinIGV);
      setLocalCostoSinIGV(isNaN(parsed) || localCostoSinIGV === '' ? '' : parsed.toFixed(4));
    } else if (field === 'costoCon') {
      const parsed = parseFloat(localCostoConIGV);
      setLocalCostoConIGV(isNaN(parsed) || localCostoConIGV === '' ? '' : parsed.toFixed(4));
    } else if (field === 'totalCon') {
      const parsed = parseFloat(localTotalConIGV);
      setLocalTotalConIGV(isNaN(parsed) || localTotalConIGV === '' ? '' : parsed.toFixed(2));
    } else if (field === 'cantidad') {
      const parsed = parseFloat(localCantidad);
      setLocalCantidad(isNaN(parsed) || localCantidad === '' ? '' : parsed.toString());
    }
  };

  const handleGrabadoToggle = (isGrabado: boolean) => {
    setLocalGrabado(isGrabado);
    recalculateFromSin(localCostoSinIGV, localCantidad, isGrabado, 'grabado');
  };

  // Sincronización automática de costo para SALIDAS automáticas o reseteos
  useEffect(() => {
    if (focusedField !== null) return;
    const val = nuevaOperacion.costoUnitario ?? 0;
    const currentParsed = parseFloat(localCostoSinIGV);
    if (isNaN(currentParsed) || Math.abs(currentParsed - val) > 0.0001) {
      setLocalCostoSinIGV(val === 0 ? '' : val.toFixed(4));
      const conIGV = localGrabado ? val * 1.18 : val;
      setLocalCostoConIGV(val === 0 ? '' : conIGV.toFixed(4));
      const parsedCant = parseFloat(localCantidad) || 0;
      if (parsedCant > 0 && val > 0) {
        setLocalTotalConIGV((parsedCant * conIGV).toFixed(2));
      } else {
        setLocalTotalConIGV('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevaOperacion.costoUnitario, localGrabado, focusedField]);

  useEffect(() => {
    if (focusedField !== null) return;
    const val = nuevaOperacion.cantidad ?? 0;
    const currentParsed = parseFloat(localCantidad);
    if (isNaN(currentParsed) || currentParsed !== val) {
      setLocalCantidad(val === 0 ? '' : val.toString());
      const parsedCostoCon = parseFloat(localCostoConIGV) || 0;
      if (val > 0 && parsedCostoCon > 0) {
        setLocalTotalConIGV((val * parsedCostoCon).toFixed(2));
      } else {
        setLocalTotalConIGV('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevaOperacion.cantidad, focusedField]);

  // --- CARGA DE DATOS DESDE LA BASE DE DATOS (reemplaza localStorage) ---
  useEffect(() => {
    if (!currentUser) return;
    const cargarDatos = async () => {
      setLoadingData(true);
      try {
        const [prodRes, movRes] = await Promise.all([
          fetch(`/api/products?userId=${currentUser.id}`),
          fetch(`/api/movements?userId=${currentUser.id}`)
        ]);
        const prodData = await prodRes.json();
        const movData = await movRes.json();
        setMaestroActivos(prodData.products ?? []);
        setBitacoraOperaciones(movData.movements ?? []);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
      const configRes = await fetch(`/api/config?userId=${currentUser.id}`);
      const configData = await configRes.json();
      if (configData.valuationMethod) setProtocoloActivo(configData.valuationMethod as ProtocoloValuacion);
      if (configData.empresaConfig) setEmpresaConfig(configData.empresaConfig);
      setDataLoaded(true);
      setMounted(true);
      setLoadingData(false);
    };
    cargarDatos();
  }, [currentUser]);

  // --- GUARDAR MÉTODO DE VALUACIÓN EN LOCALSTORAGE (solo config, no datos) ---
  useEffect(() => {
    if (mounted && dataLoaded && currentUser) {
      fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, valuationMethod: protocoloActivo })
    }).catch(err => console.error('Error guardando método:', err));
    }
  }, [protocoloActivo, mounted, dataLoaded, currentUser]);

  const guardarEmpresa = (data: typeof empresaConfig) => {
    const config = { ...data, configurada: true };
    setEmpresaConfig(config);
    const key = currentUser?.id || 'invitado';
    fetch('/api/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: key, empresaConfig: config })
}).catch(err => console.error('Error guardando empresa:', err));
  };

  useEffect(() => {
    if (nuevaOperacion.tipo === 'ENTRADA') {
      setNuevaOperacion(prev => ({ 
        ...prev, 
        tipoOperacion: '02', 
        tipoDocumento: prev.tipoDocumento === '50' ? '01' : prev.tipoDocumento 
      }));
    } else {
      setNuevaOperacion(prev => ({ ...prev, tipoOperacion: '01' }));
    }
  }, [nuevaOperacion.tipo]);

  useEffect(() => {
    if (nuevaOperacion.tipo === 'SALIDA') {
      if (nuevaOperacion.tipoDocumento !== '01' && nuevaOperacion.tipoDocumento !== '03') {
        if (localGrabado) {
          setLocalGrabado(false);
          recalculateFromSin(localCostoSinIGV, localCantidad, false, 'grabado');
        }
      }
    }
  }, [nuevaOperacion.tipo, nuevaOperacion.tipoDocumento, localGrabado, localCostoSinIGV, localCantidad]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFechaActual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LÓGICA DE COSTO UNITARIO AUTOMÁTICO PARA SALIDAS ---
  useEffect(() => {
    if (nuevaOperacion.tipo === 'SALIDA' && activoSeleccionadoId && (nuevaOperacion.cantidad || 0) > 0) {
      if (protocoloActivo === 'PEPS') {
        const ops = bitacoraOperaciones.filter(m => m.activoId === activoSeleccionadoId);
        const lotesVigentes = obtenerEstadoLotesVigentes(ops);
        const estimacion = calcularSalidaPEPS(nuevaOperacion.cantidad || 0, lotesVigentes);
        if (nuevaOperacion.costoUnitario !== estimacion.nuevoCostoUnitario) {
          setNuevaOperacion(prev => ({ ...prev, costoUnitario: estimacion.nuevoCostoUnitario }));
        }
      } else if (protocoloActivo === 'PROMEDIO') {
        const costoPromedio = obtenerCostoUnitarioActual(activoSeleccionadoId);
        if (nuevaOperacion.costoUnitario !== costoPromedio) {
          setNuevaOperacion(prev => ({ ...prev, costoUnitario: costoPromedio }));
        }
      }
    }
  }, [nuevaOperacion.cantidad, nuevaOperacion.tipo, nuevaOperacion.costoUnitario, activoSeleccionadoId, bitacoraOperaciones, protocoloActivo, obtenerCostoUnitarioActual]);

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#2B579A 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="w-20 h-20 border border-[#DEE2E6] bg-[#F8F9FA] flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-[#2B579A]/5 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#F97316]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#F97316]"></div>
            <Database size={32} className="text-[#2B579A] animate-bounce" />
          </div>
          <div className="space-y-4 flex flex-col items-center">
            <div className="text-[10px] font-sans font-bold text-[#F97316] uppercase tracking-[0.5em] animate-pulse">Iniciando_Sistema</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-1 w-8 bg-[#DEE2E6] relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-[#2B579A]" 
                    style={{ 
                      animation: `loading-bar 1.5s infinite ${i * 0.2}s`,
                      transform: 'translateX(-100%)'
                    }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="text-[8px] font-sans text-[#999] uppercase tracking-widest font-bold">Chequeo_Hardware: OK // Asignación_Memoria: OK</div>
          </div>
        </div>
        <style jsx>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  const recomendarCodigo = () => {
    if (maestroActivos.length === 0) return 'KH-001';
    const codigos = maestroActivos
      .map(a => {
        const match = a.codigo.match(/KH-(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((n): n is number => n !== null);
    if (codigos.length === 0) return `KH-${String(maestroActivos.length + 1).padStart(3, '0')}`;
    const max = Math.max(...codigos);
    return `KH-${String(max + 1).padStart(3, '0')}`;
  };

  const registrarNuevoActivo = () => {
    if (!nuevoActivo.codigo || !nuevoActivo.nombre) return;

    const codigoExiste = maestroActivos.some(a => a.codigo.toUpperCase() === nuevoActivo.codigo.toUpperCase());
    if (codigoExiste) {
      alert(`Error KH-05: El código [${nuevoActivo.codigo}] ya está registrado en el Maestro de Activos.`);
      return;
    }

    if (!esKardexVacio) {
      if (protocoloActivo && protocoloActivo !== 'PROMEDIO') {
        alert("Error KH-04: Protocolo de Valuación bloqueado. No se permiten cambios con operaciones existentes.");
        return;
      }
    }

    const productId = crypto.randomUUID();
    const activo: ActivoKhipu = {
      id: productId,
      codigo: nuevoActivo.codigo,
      nombre: nuevoActivo.nombre,
      unidadMedida: nuevoActivo.unidadMedida,
      unidadMedidaCodigo: nuevoActivo.unidadMedidaCodigo,
      tipoExistencia: nuevoActivo.tipoExistencia,
      stockMinimo: nuevoActivo.stockMinimo,
      stockMaximo: nuevoActivo.stockMaximo,
      observaciones: nuevoActivo.observaciones,
    };

    // Guardar producto en la base de datos
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...activo, userId: currentUser?.id })
    }).catch(err => console.error('Error guardando producto:', err));
    
    setMaestroActivos([...maestroActivos, activo]);

    const stockInicialVal = parseFloat(nuevoActivo.stockInicial || nuevoActivo.initialStock || 0);
    const costoInicialVal = parseFloat(nuevoActivo.costoInicial || nuevoActivo.initialCost || 0);
    if (stockInicialVal > 0) {
      const opInicial: OperacionKardex = {
        id: crypto.randomUUID(),
        activoId: productId,
        tipo: 'ENTRADA',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        tipoDocumento: '00',
        tipoOperacion: '16',
        serie: 'INI',
        numero: '001',
        cantidad: stockInicialVal,
        costoUnitario: costoInicialVal,
        costoTotal: stockInicialVal * costoInicialVal,
        createdAt: Date.now()
      };

      // Guardar movimiento inicial en la base de datos
      fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...opInicial, userId: currentUser?.id })
      }).catch(err => console.error('Error guardando mov. inicial:', err));

      setBitacoraOperaciones(prev => [...prev, opInicial]);
    }

    setShowProductModal(false);
    setNuevoActivo({ 
      codigo: '', 
      nombre: '', 
      unidadMedida: 'UNIDADES', 
      unidadMedidaCodigo: '07', 
      tipoExistencia: '01', 
      stockMinimo: 10, 
      stockMaximo: 100, 
      observaciones: '', 
      initialStock: 0, 
      initialCost: 0 
    });
  };

  const agregarPartidaAStaging = () => {
    if (!activoSeleccionadoId) { alert("Seleccione un activo."); return; }
    if ((nuevaOperacion.cantidad || 0) <= 0) { alert("Ingrese una cantidad válida."); return; }
    if (nuevaOperacion.tipo === 'ENTRADA' && (nuevaOperacion.costoUnitario || 0) <= 0) { alert("Ingrese un costo unitario válido."); return; }

    if (nuevaOperacion.tipo === 'SALIDA') {
      const saldoActual = obtenerSaldoFisico(activoSeleccionadoId);
      const yaEnStaging = stagedItems
        .filter(item => item.activoId === activoSeleccionadoId)
        .reduce((sum, item) => sum + item.cantidad, 0);
      if ((nuevaOperacion.cantidad || 0) + yaEnStaging > saldoActual) {
        alert(`Stock insuficiente. Solo dispone de ${saldoActual} unidades (incluyendo ${yaEnStaging} ya agregadas al comprobante).`);
        return;
      }
    }

    const activo = maestroActivos.find(p => p.id === activoSeleccionadoId);
    const nuevaPartida = {
      activoId: activoSeleccionadoId,
      activoNombre: activo?.nombre,
      activoCodigo: activo?.codigo,
      cantidad: nuevaOperacion.cantidad,
      costoUnitario: nuevaOperacion.costoUnitario,
      costoTotal: (nuevaOperacion.cantidad || 0) * (nuevaOperacion.costoUnitario || 0),
      tipo: nuevaOperacion.tipo,
      igvGrabado: localGrabado,
    };

    setStagedItems([...stagedItems, nuevaPartida]);
    setNuevaOperacion(prev => ({ ...prev, cantidad: 0, costoUnitario: 0 }));
    setLocalCantidad('');
    setLocalCostoSinIGV('');
    setLocalCostoConIGV('');
    setLocalTotalConIGV('');
    setLocalGrabado(true);
    setActivoSeleccionadoId('');
    setBusquedaActivoModal('');
  };

  const removerPartidaDeStaging = (index: number) => {
    setStagedItems(stagedItems.filter((_, i) => i !== index));
  };

  const descargarPDFComprobante = () => {
    if (stagedItems.length === 0) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = [43, 87, 154] as [number, number, number];
    const accentColor = [249, 115, 22] as [number, number, number];
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(26);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('KHIPUKARDEX', 15, 25);
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTROL AVANZADO DE EXISTENCIAS', 15, 33);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(pageWidth - 85, 8, 70, 24);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(`R.U.C. 20XXXXXXXXX`, pageWidth - 80, 14);
    const tipoDocStr = nuevaOperacion.tipoDocumento === '01' ? 'FACTURA' : nuevaOperacion.tipoDocumento === '03' ? 'BOLETA' : nuevaOperacion.tipoDocumento === '50' ? 'DOCUMENTO INTERNO' : 'COMPROBANTE';
    doc.setFontSize(11);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    const labelDoc = nuevaOperacion.tipoDocumento === '50' ? tipoDocStr : `${tipoDocStr} ELECTRÓNICA`;
    doc.text(labelDoc, pageWidth - 80, 20);
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${nuevaOperacion.serie}-${nuevaOperacion.numero}`, pageWidth - 80, 27);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN GENERAL', 15, 52);
    doc.setDrawColor(220, 226, 230);
    doc.line(15, 54, pageWidth - 15, 54);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA DE EMISIÓN:', 15, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(nuevaOperacion.fecha || '', 60, 62);
    doc.setFont('helvetica', 'bold');
    doc.text('TIPO DE OPERACIÓN:', 15, 68);
    doc.setFont('helvetica', 'normal');
    doc.text(nuevaOperacion.tipo === 'ENTRADA' ? 'COMPRA / ENTRADA' : 'VENTA / SALIDA', 60, 68);
    doc.setFont('helvetica', 'bold');
    doc.text('MÉTODO VALORACIÓN:', 15, 74);
    doc.setFont('helvetica', 'normal');
    doc.text(protocoloActivo, 60, 74);
    const roundTo2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
    const tableData = stagedItems.map(item => {
      const isGrabado = item.igvGrabado !== false;
      const subtotalItem = item.costoTotal;
      const igvItem = isGrabado ? roundTo2(subtotalItem * 0.18) : 0;
      const totalItem = roundTo2(subtotalItem + igvItem);
      return [
        item.activoCodigo,
        item.activoNombre + (isGrabado ? '' : ' (No Grabado)'),
        item.cantidad.toString(),
        `S/ ${item.costoUnitario.toFixed(4)}`,
        `S/ ${subtotalItem.toFixed(2)}`,
        `S/ ${igvItem.toFixed(2)}`,
        `S/ ${totalItem.toFixed(2)}`
      ];
    });
    autoTable(doc, {
      startY: 82,
      head: [['CÓDIGO', 'DESCRIPCIÓN', 'CANTIDAD', 'V. UNITARIO', 'SUBTOTAL', 'I.G.V. (18%)', 'TOTAL CON IGV']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8.5, halign: 'center', fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 'auto' }, 2: { halign: 'center', cellWidth: 15 }, 3: { halign: 'right', cellWidth: 22 }, 4: { halign: 'right', cellWidth: 21 }, 5: { halign: 'right', cellWidth: 21 }, 6: { halign: 'right', cellWidth: 24 } },
      styles: { fontSize: 7.5, cellPadding: 3, valign: 'middle' },
      margin: { left: 15, right: 15 }
    });
    const subtotalGravado = stagedItems.filter(item => item.igvGrabado !== false).reduce((sum, item) => sum + item.costoTotal, 0);
    const subtotalNoGravado = stagedItems.filter(item => item.igvGrabado === false).reduce((sum, item) => sum + item.costoTotal, 0);
    const igv = stagedItems.filter(item => item.igvGrabado !== false).reduce((sum, item) => sum + roundTo2(item.costoTotal * 0.18), 0);
    const totalGeneral = subtotalGravado + subtotalNoGravado + igv;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastTableY = (doc as any).lastAutoTable.finalY || 100;
    let finalY = lastTableY + 14;
    const summaryX = pageWidth - 80;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('OP. GRAVADA (Base):', summaryX, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`S/ ${subtotalGravado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 15, finalY, { align: 'right' });
    if (subtotalNoGravado > 0) {
      finalY += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('OP. NO GRABADA (Exo):', summaryX, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(`S/ ${subtotalNoGravado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 15, finalY, { align: 'right' });
    }
    finalY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('I.G.V. (18%):', summaryX, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`S/ ${igv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 15, finalY, { align: 'right' });
    finalY += 9;
    doc.setFontSize(11);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTE TOTAL:', summaryX, finalY);
    doc.text(`S/ ${totalGeneral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 15, finalY, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('KHIPUKARDEX - SISTEMA DE CONTROL DE EXISTENCIAS', pageWidth / 2, 285, { align: 'center' });
    doc.save(`Comprobante_${nuevaOperacion.serie}_${nuevaOperacion.numero}.pdf`);
  };
  const verificarAdminYAjustar = () => {
  if (!adjustmentObs.trim()) {
    alert("El campo 'Motivo del Ajuste' es obligatorio antes de procesar.");
    return;
  }
  setPendingAjuste(true);
  setAdminAuthUser('');
  setAdminAuthPass('');
  setAdminAuthError('');
  setShowAdminAuthModal(true);
};

const confirmarAdminAuth = async () => {
  setAdminAuthLoading(true);
  setAdminAuthError('');
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminAuthUser, password: adminAuthPass }),
    });
    const data = await res.json();
    if (!res.ok || data.user?.role !== 'ADMIN') {
      setAdminAuthError('Credenciales inválidas o sin permisos de administrador.');
      return;
    }
    setShowAdminAuthModal(false);
    if (pendingAjuste) ejecutarAjusteAutomatico();
  } catch {
    setAdminAuthError('Error de conexión.');
  } finally {
    setAdminAuthLoading(false);
  }
};
  const ejecutarAjusteAutomatico = () => {
    const opsParaAsentar: OperacionKardex[] = [];
    const correlativo = adjustmentNumero || Math.floor(100000 + Math.random() * 900000).toString();
    let countAdj = 0;
    maestroActivos.forEach(p => {
      const stockSistema = obtenerSaldoFisico(p.id);
      const conteo = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : stockSistema;
      const diferencia = conteo - stockSistema;
      if (diferencia !== 0) {
        countAdj++;
        const indexParaLote = bitacoraOperaciones.filter(m => m.activoId === p.id);
        const kardexParaLote = ejecutarMotorKhipu(indexParaLote, protocoloActivo);
        const lastLine = kardexParaLote.length > 0 ? kardexParaLote[kardexParaLote.length - 1] : null;
        let costoUnitario = lastLine ? lastLine.costoUnitarioSaldo : 0;
        if (costoUnitario <= 0) costoUnitario = 10.0;
        const tipo = diferencia > 0 ? 'ENTRADA' : 'SALIDA';
        const cantidadAbs = Math.abs(diferencia);
        opsParaAsentar.push({
          id: crypto.randomUUID(),
          activoId: p.id,
          tipo,
          tipoDocumento: '00', 
          tipoOperacion: diferencia > 0 ? '16' : '12', 
          serie: adjustmentSerie,
          numero: correlativo,
          fecha: adjustmentFecha,
          cantidad: cantidadAbs,
          costoUnitario,
          costoTotal: Number((cantidadAbs * costoUnitario).toFixed(4)),
          observaciones: `AJUSTE ${adjustmentFecha} — ${adjustmentObs} [${diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'}]`,
          createdAt: Date.now()
        });
      }
    });
    if (countAdj === 0) { alert("No hay diferencias reportadas en los activos listados."); return; }
    if (!adjustmentObs.trim()) { alert("El campo 'Motivo del Ajuste' es obligatorio para procesar el ajuste."); return; }
    // Guardar cada movimiento de ajuste en la base de datos
    opsParaAsentar.forEach(op => {
      fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...op, userId: currentUser?.id })
      }).catch(err => console.error('Error guardando ajuste en BD:', err));
    });
    setBitacoraOperaciones(prev => [...prev, ...opsParaAsentar]);
    alert(`Ajuste Procesado Exitosamente.\nSe registraron automáticamente ${countAdj} operaciones en la bitácora con el documento ${adjustmentSerie}-${correlativo}.`);
    setShowAdjustmentModal(false);
  };

  const agregarAjusteAManualStaging = (prodId: string, diferencia: number) => {
    if (diferencia === 0) return;
    const p = maestroActivos.find(item => item.id === prodId);
    if (!p) return;
    const indexParaLote = bitacoraOperaciones.filter(m => m.activoId === p.id);
    const kardexParaLote = ejecutarMotorKhipu(indexParaLote, protocoloActivo);
    const lastLine = kardexParaLote.length > 0 ? kardexParaLote[kardexParaLote.length - 1] : null;
    let costoUnitario = lastLine ? lastLine.costoUnitarioSaldo : 10.0;
    if (costoUnitario <= 0) costoUnitario = 10.0;
    const tipo = diferencia > 0 ? 'ENTRADA' : 'SALIDA';
    const cantidadAbs = Math.abs(diferencia);
    const nuevaPartida = {
      activoId: p.id,
      activoNombre: p.nombre,
      activoCodigo: p.codigo,
      cantidad: cantidadAbs,
      costoUnitario: costoUnitario,
      costoTotal: cantidadAbs * costoUnitario,
      tipo: tipo,
    };
    setNuevaOperacion(prev => ({
      ...prev,
      tipoDocumento: '00',
      tipoOperacion: diferencia > 0 ? '16' : '12',
      serie: adjustmentSerie,
      numero: adjustmentNumero || Math.floor(100000 + Math.random() * 900000).toString(),
      fecha: adjustmentFecha,
      observaciones: `${adjustmentObs} [MANUAL AJUSTE: ${p.codigo}]`
    }));
    setStagedItems([...stagedItems, nuevaPartida]);
    setShowAdjustmentModal(false);
    setIsMovementFromAdjust(true);
    setShowMovementModal(true);
    alert(`Trasladado al comprobante manual. Ahora puede revisar la partida '${p.nombre}' como ${tipo} antes de asentar.`);
  };

  const asentarOperacionKardex = () => {
    if (stagedItems.length > 0) {
      const nuevasOperaciones: OperacionKardex[] = stagedItems.map(item => ({
        ...nuevaOperacion as OperacionKardex,
        id: crypto.randomUUID(),
        activoId: item.activoId,
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario,
        costoTotal: Number(item.costoTotal.toFixed(4)),
        tipo: item.tipo,
        createdAt: Date.now()
      }));

      // Guardar cada movimiento en la base de datos
      nuevasOperaciones.forEach(op => {
        fetch('/api/movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...op, userId: currentUser?.id })
        }).catch(err => console.error('Error guardando movimiento:', err));
      });

      setBitacoraOperaciones(prev => [...prev, ...nuevasOperaciones]);
      setShowMovementModal(false);
      setStagedItems([]);
      setIsMovementFromAdjust(false);
      setNuevaOperacion({ 
        tipo: 'ENTRADA', tipoDocumento: '01', tipoOperacion: '02', serie: 'F001', 
        numero: '', cantidad: 0, costoUnitario: 0, fecha: format(new Date(), 'yyyy-MM-dd'), observaciones: '' 
      });
      return;
    }
    const cantidad = parseFloat(String(nuevaOperacion.cantidad)) || 0;
    const activoId = activoSeleccionadoId;
    if (!activoId || cantidad <= 0) {
      alert("Error: Debe agregar al menos un item o completar los datos del activo actual.");
      return;
    }
    agregarPartidaAStaging();
    setTimeout(() => asentarOperacionKardex(), 0);
  };

  const inyectarDatosDemo = () => {
    const demoActivos: ActivoKhipu[] = [
      { id: 'p1', codigo: 'KH-001', nombre: 'Laptop Workstation K', unidadMedida: 'UND', unidadMedidaCodigo: '05', tipoExistencia: '01', stockMinimo: 5, stockMaximo: 20, observaciones: 'Gama alta' },
      { id: 'p2', codigo: 'KH-002', nombre: 'Monitor UltraWide 34', unidadMedida: 'UND', unidadMedidaCodigo: '05', tipoExistencia: '01', stockMinimo: 10, stockMaximo: 50, observaciones: 'Oficina' },
    ];
    const demoOps: OperacionKardex[] = [
      { id: 'm1', activoId: 'p1', tipo: 'ENTRADA', fecha: '2024-01-01', tipoDocumento: '01', tipoOperacion: '02', serie: 'F001', numero: '001', cantidad: 10, costoUnitario: 3500, costoTotal: 35000, createdAt: 1704067200000 },
      { id: 'm2', activoId: 'p1', tipo: 'ENTRADA', fecha: '2024-01-15', tipoDocumento: '01', tipoOperacion: '02', serie: 'F001', numero: '015', cantidad: 5, costoUnitario: 3700, costoTotal: 18500, createdAt: 1705276800000 },
      { id: 'm3', activoId: 'p1', tipo: 'SALIDA', fecha: '2024-02-01', tipoDocumento: '03', tipoOperacion: '01', serie: 'B001', numero: '001', cantidad: 8, costoUnitario: 0, costoTotal: 0, createdAt: 1706745600000 },
    ];
    setMaestroActivos(demoActivos);
    setBitacoraOperaciones(demoOps);
    setActivoSeleccionadoId('p1');
  };

  const purgarBaseDatos = () => {
    setDeleteConfirm({
      type: 'all',
      title: 'Restablecer Base de Datos',
      message: '¿Está seguro de eliminar todos los datos? Esta acción no se puede deshacer.'
    });
  };

  const deleteProduct = (id: string) => {
    setDeleteConfirm({
      type: 'product',
      id,
      title: 'Eliminar Activo',
      message: '¿Está seguro de eliminar este activo? Se eliminarán también todos sus movimientos.'
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const deleteMovement = (id: string) => {
    setDeleteConfirm({
      type: 'movement',
      id,
      title: 'Eliminar Movimiento',
      message: '¿Está seguro de eliminar este movimiento?'
    });
  };

  const confirmarEliminacionKhipu = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'product' && deleteConfirm.id) {
      fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteConfirm.id, userId: currentUser?.id })
      }).catch(err => console.error('Error eliminando producto:', err));
      setMaestroActivos(maestroActivos.filter(p => p.id !== deleteConfirm.id));
      setBitacoraOperaciones(bitacoraOperaciones.filter(m => m.activoId !== deleteConfirm.id));
      if (activoSeleccionadoId === deleteConfirm.id) setActivoSeleccionadoId('');
    } else if (deleteConfirm.type === 'movement' && deleteConfirm.id) {
      fetch('/api/movements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteConfirm.id, userId: currentUser?.id })
      }).catch(err => console.error('Error eliminando movimiento:', err));
      setBitacoraOperaciones(bitacoraOperaciones.filter(m => m.id !== deleteConfirm.id));
    } else if (deleteConfirm.type === 'all') {
      maestroActivos.forEach(p => {
        fetch('/api/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id, userId: currentUser?.id })
        }).catch(err => console.error('Error eliminando:', err));
      });
      setMaestroActivos([]);
      setBitacoraOperaciones([]);
      setActivoSeleccionadoId('');
    }
    setDeleteConfirm(null);
  };

  const exportToExcel = () => {
    const activoSeleccionado = maestroActivos.find(p => p.id === activoSeleccionadoId);
    if (!activoSeleccionado) return;
    const kardex = ejecutarMotorKhipu(bitacoraOperaciones.filter(m => m.activoId === activoSeleccionadoId), protocoloActivo);
    const data = kardex.map(line => ({
      Fecha: line.fecha, Tipo: line.tipoDocumento, Serie: line.serie, Número: line.numero, Operación: line.tipo,
      'Entrada Cant': line.cantidadEntrada || '', 'Entrada Costo U': line.costoUnitarioEntrada || '', 'Entrada Total': line.costoTotalEntrada || '',
      'Salida Cant': line.cantidadSalida || '', 'Salida Costo U': line.costoUnitarioSalida || '', 'Salida Total': line.costoTotalSalida || '',
      'Saldo Cant': line.cantidadSaldo, 'Saldo Costo U': line.costoUnitarioSaldo, 'Saldo Total': line.costoTotalSaldo,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kardex");
    XLSX.writeFile(wb, `KHIPU_Kardex_${activoSeleccionado.codigo}_${protocoloActivo}.xlsx`);
  };

  const exportToPDF = () => {
    const activoSeleccionado = maestroActivos.find(p => p.id === activoSeleccionadoId);
    if (!activoSeleccionado) return;
    const kardex = ejecutarMotorKhipu(bitacoraOperaciones.filter(m => m.activoId === activoSeleccionadoId), protocoloActivo);
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('FORMATO 12.1: REGISTRO DE INVENTARIO PERMANENTE EN UNIDADES FÍSICAS - DETALLE DEL INVENTARIO PERMANENTE', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    const currentYear = new Date().getFullYear();
    const currentMonth = format(new Date(), 'MMMM', { locale: es }).toUpperCase();
    doc.text(`PERÍODO: ${currentMonth} ${currentYear}`, 14, 25);
    doc.text(`RUC: ${empresaConfig.ruc || '20601234567'}`, 14, 30);
    doc.text(`APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL: ${(empresaConfig.nombre || 'KHIPU SOLUCIONES').toUpperCase()}`, 14, 35);
    doc.text(`ESTABLECIMIENTO: ALMACÉN CENTRAL`, 14, 40);
    doc.text(`CÓDIGO DE LA EXISTENCIA: ${activoSeleccionado.codigo}`, 14, 45);
    doc.text(`TIPO (TABLA 5): ${activoSeleccionado.tipoExistencia || '01'}`, 14, 50);
    doc.text(`DESCRIPCIÓN: ${activoSeleccionado.nombre.toUpperCase()}`, 14, 55);
    doc.text(`CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6): ${activoSeleccionado.unidadMedidaCodigo || '05'}`, 14, 60);
    const getTabla10 = (type: string) => getTabla10Code(type);
    autoTable(doc, {
      startY: 65,
      head: [[
        { content: 'DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO, DOCUMENTO INTERNO O SIMILAR', colSpan: 4, styles: { halign: 'center' } },
        { content: 'TIPO DE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'ENTRADAS', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'SALIDAS', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'SALDO FINAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
      ], ['FECHA', 'TIPO (TABLA 10)', 'SERIE', 'NÚMERO', 'OPERACIÓN (TABLA 12)']],
      body: kardex.map(l => [l.fecha, getTabla10(l.tipoDocumento), l.serie, l.numero, l.tipoOperacion || (l.tipo === 'ENTRADA' ? '02' : '01'), l.cantidadEntrada || '-', l.cantidadSalida || '-', l.cantidadSaldo]),
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
    });
    doc.save(`SUNAT_12.1_${activoSeleccionado.codigo}.pdf`);
  };

  const exportToPDFValorizado = () => {
    const activoSeleccionado = maestroActivos.find(p => p.id === activoSeleccionadoId);
    if (!activoSeleccionado) return;
    const kardex = ejecutarMotorKhipu(bitacoraOperaciones.filter(m => m.activoId === activoSeleccionadoId), protocoloActivo);
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('FORMATO 13.1: REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    const currentYear = new Date().getFullYear();
    const currentMonth = format(new Date(), 'MMMM', { locale: es }).toUpperCase();
    doc.text(`PERÍODO: ${currentMonth} ${currentYear}`, 14, 25);
    doc.text(`RUC: ${empresaConfig.ruc || '20601234567'}`, 14, 30);
    doc.text(`APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL: ${(empresaConfig.nombre || 'KHIPU').toUpperCase()}`, 14, 35);
    doc.text(`ESTABLECIMIENTO: ALMACÉN CENTRAL`, 14, 40);
    doc.text(`CÓDIGO DE LA EXISTENCIA: ${activoSeleccionado.codigo}`, 14, 45);
    doc.text(`TIPO (TABLA 5): ${activoSeleccionado.tipoExistencia || '01'}`, 14, 50);
    doc.text(`DESCRIPCIÓN: ${activoSeleccionado.nombre.toUpperCase()}`, 14, 55);
    doc.text(`CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6): ${activoSeleccionado.unidadMedidaCodigo || '05'}`, 14, 60);
    doc.text(`MÉTODO DE VALUACIÓN (TABLA 14): ${protocoloActivo === 'PROMEDIO' ? '01 - PROMEDIO PONDERADO' : '02 - PEPS'}`, 14, 65);
    const getTabla10 = (type: string) => getTabla10Code(type);
    autoTable(doc, {
      startY: 70,
      head: [[
        { content: 'DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO, DOCUMENTO INTERNO O SIMILAR', colSpan: 4, styles: { halign: 'center' } },
        { content: 'TIPO DE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'ENTRADAS', colSpan: 3, styles: { halign: 'center' } },
        { content: 'SALIDAS', colSpan: 3, styles: { halign: 'center' } },
        { content: 'SALDO FINAL', colSpan: 3, styles: { halign: 'center' } }
      ], ['FECHA', 'TIPO (TABLA 10)', 'SERIE', 'NÚMERO', 'OPERACIÓN (TABLA 12)', 'CANT.', 'COSTO U.', 'COSTO T.', 'CANT.', 'COSTO U.', 'COSTO T.', 'CANT.', 'COSTO U.', 'COSTO T.']],
      body: kardex.map(l => [
        l.fecha, getTabla10(l.tipoDocumento), l.serie, l.numero, l.tipoOperacion || (l.tipo === 'ENTRADA' ? '02' : '01'),
        l.cantidadEntrada || '-', l.costoUnitarioEntrada ? l.costoUnitarioEntrada.toFixed(4) : '-', l.costoTotalEntrada ? l.costoTotalEntrada.toFixed(2) : '-',
        l.cantidadSalida || '-', l.costoUnitarioSalida ? l.costoUnitarioSalida.toFixed(4) : '-', l.costoTotalSalida ? l.costoTotalSalida.toFixed(2) : '-',
        l.cantidadSaldo, l.costoUnitarioSaldo.toFixed(4), l.costoTotalSaldo.toFixed(2)
      ]),
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1.5 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
    });
    doc.save(`SUNAT_13.1_${activoSeleccionado.codigo}.pdf`);
  };

  const exportToExcelSUNAT121 = () => {
    const activoSeleccionado = maestroActivos.find(p => p.id === activoSeleccionadoId);
    if (!activoSeleccionado) return;
    const kardex = ejecutarMotorKhipu(bitacoraOperaciones.filter(m => m.activoId === activoSeleccionadoId), protocoloActivo);
    const getTabla10 = (type: string) => getTabla10Code(type);
    const currentYear = new Date().getFullYear();
    const currentMonth = format(new Date(), 'MMMM', { locale: es }).toUpperCase();
    const header = [
      ['FORMATO 12.1: REGISTRO DE INVENTARIO PERMANENTE EN UNIDADES FÍSICAS'],
      [`PERÍODO: ${currentMonth} ${currentYear}`], [`RUC: ${empresaConfig.ruc || '20601234567'}`],
      [`APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL: ${(empresaConfig.nombre || 'KHIPU').toUpperCase()}`],
      ['ESTABLECIMIENTO: ALMACÉN CENTRAL'], [`CÓDIGO DE LA EXISTENCIA: ${activoSeleccionado.codigo}`],
      [`TIPO (TABLA 5): ${activoSeleccionado.tipoExistencia || '01'}`], [`DESCRIPCIÓN: ${activoSeleccionado.nombre.toUpperCase()}`],
      [`CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6): ${activoSeleccionado.unidadMedidaCodigo || '05'}`], [],
      ['FECHA', 'TIPO (TABLA 10)', 'SERIE', 'NÚMERO', 'OPERACIÓN (TABLA 12)', 'ENTRADAS', 'SALIDAS', 'SALDO FINAL']
    ];
    const rows = kardex.map(l => [l.fecha, getTabla10(l.tipoDocumento), l.serie, l.numero, l.tipoOperacion || (l.tipo === 'ENTRADA' ? '02' : '01'), l.cantidadEntrada || 0, l.cantidadSalida || 0, l.cantidadSaldo]);
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SUNAT 12.1");
    XLSX.writeFile(wb, `SUNAT_12.1_${activoSeleccionado.codigo}.xlsx`);
  };

  const exportToExcelSUNAT131 = () => {
    const activoSeleccionado = maestroActivos.find(p => p.id === activoSeleccionadoId);
    if (!activoSeleccionado) return;
    const kardex = ejecutarMotorKhipu(bitacoraOperaciones.filter(m => m.activoId === activoSeleccionadoId), protocoloActivo);
    const getTabla10 = (type: string) => getTabla10Code(type);
    const currentYear = new Date().getFullYear();
    const currentMonth = format(new Date(), 'MMMM', { locale: es }).toUpperCase();
    const header = [
      ['FORMATO 13.1: REGISTRO DE INVENTARIO PERMANENTE VALORIZADO'],
      [`PERÍODO: ${currentMonth} ${currentYear}`], [`RUC: ${empresaConfig.ruc || '20601234567'}`],
      [`APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL: ${(empresaConfig.nombre || 'KHIPU').toUpperCase()}`],
      ['ESTABLECIMIENTO: ALMACÉN CENTRAL'], [`CÓDIGO DE LA EXISTENCIA: ${activoSeleccionado.codigo}`],
      [`TIPO (TABLA 5): ${activoSeleccionado.tipoExistencia || '01'}`], [`DESCRIPCIÓN: ${activoSeleccionado.nombre.toUpperCase()}`],
      [`CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6): ${activoSeleccionado.unidadMedidaCodigo || '05'}`],
      [`MÉTODO DE VALUACIÓN (TABLA 14): ${protocoloActivo === 'PROMEDIO' ? '01 - PROMEDIO PONDERADO' : '02 - PEPS'}`], [],
      ['FECHA', 'TIPO (TABLA 10)', 'SERIE', 'NÚMERO', 'OPERACIÓN (TABLA 12)', 'ENT. CANT.', 'ENT. COSTO U.', 'ENT. COSTO T.', 'SAL. CANT.', 'SAL. COSTO U.', 'SAL. COSTO T.', 'SALDO CANT.', 'SALDO COSTO U.', 'SALDO COSTO T.']
    ];
    const rows = kardex.map(l => [
      l.fecha, getTabla10(l.tipoDocumento), l.serie, l.numero, l.tipoOperacion || (l.tipo === 'ENTRADA' ? '02' : '01'),
      l.cantidadEntrada || 0, l.costoUnitarioEntrada || 0, l.costoTotalEntrada || 0,
      l.cantidadSalida || 0, l.costoUnitarioSalida || 0, l.costoTotalSalida || 0,
      l.cantidadSaldo, l.costoUnitarioSaldo, l.costoTotalSaldo
    ]);
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SUNAT 13.1");
    XLSX.writeFile(wb, `SUNAT_13.1_${activoSeleccionado.codigo}.xlsx`);
  };

  const exportStockAlertsReport = () => {
    const alerts = maestroActivos.filter(p => {
      const stock = obtenerSaldoFisico(p.id);
      return stock <= p.stockMinimo || stock >= p.stockMaximo;
    }).map(p => {
      const stock = obtenerSaldoFisico(p.id);
      return { 'Código': p.codigo, 'Producto': p.nombre, 'Stock Actual': stock, 'Stock Mínimo': p.stockMinimo, 'Stock Máximo': p.stockMaximo, 'Estado': stock <= p.stockMinimo ? 'STOCK BAJO' : 'SOBRESTOCK' };
    });
    if (alerts.length === 0) { alert("No hay alertas de stock para exportar."); return; }
    const ws = XLSX.utils.json_to_sheet(alerts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alertas de Stock");
    XLSX.writeFile(wb, `KHIPU_Alertas_Stock_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportLowMovementReport = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lowMovementProducts = maestroActivos.filter(p => {
      const productMovements = bitacoraOperaciones.filter(m => {
        const moveDate = safeDate(m.fecha);
        return m.activoId === p.id && moveDate.getMonth() === currentMonth && moveDate.getFullYear() === currentYear;
      });
      return productMovements.length === 0;
    }).map(p => ({ 'Código': p.codigo, 'Producto': p.nombre, 'Stock Actual': obtenerSaldoFisico(p.id), 'Último Movimiento': 'Sin movimientos este mes' }));
    if (lowMovementProducts.length === 0) { alert("No hay productos con poco movimiento para exportar."); return; }
    const ws = XLSX.utils.json_to_sheet(lowMovementProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Poco Movimiento");
    XLSX.writeFile(wb, `KHIPU_Poco_Movimiento_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportMaestroArticulosPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO MAESTRO DE ARTÍCULOS Y EXISTENCIAS', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`EMPRESA: ${(empresaConfig.nombre || 'KHIPU').toUpperCase()}`, 14, 25);
    doc.text(`RUC: ${empresaConfig.ruc || '20601234567'}`, 14, 30);
    doc.text(`FECHA DE REPORTE: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);
    autoTable(doc, {
      startY: 45,
      head: [['CÓDIGO', 'DESCRIPCIÓN', 'TIPO (TABLA 5)', 'UNIDAD', 'ENTRADAS', 'SALIDAS', 'STOCK ACTUAL', 'COSTO UNIT.', 'TOTAL S/']],
      body: maestroActivos.map(p => {
        const ops = bitacoraOperaciones.filter(m => m.activoId === p.id);
        const kardex = ejecutarMotorKhipu(ops, protocoloActivo);
        const lastLine = kardex.length > 0 ? kardex[kardex.length - 1] : null;
        const totalEntradas = kardex.reduce((sum, line) => sum + (line.cantidadEntrada || 0), 0);
        const totalSalidas = kardex.reduce((sum, line) => sum + (line.cantidadSalida || 0), 0);
        const stockActual = lastLine ? lastLine.cantidadSaldo : 0;
        const costoUnit = lastLine ? lastLine.costoUnitarioSaldo : 0;
        const valorTotal = lastLine ? lastLine.costoTotalSaldo : 0;
        return [p.codigo, p.nombre.toUpperCase(), getTabla5Label(p.tipoExistencia), p.unidadMedida, totalEntradas, totalSalidas, stockActual, costoUnit.toFixed(4), valorTotal.toFixed(2)];
      }),
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [43, 87, 154], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
    doc.save(`KHIPU_Maestro_Articulos_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const exportMaestroArticulosExcel = () => {
    const data = maestroActivos.map(p => {
      const ops = bitacoraOperaciones.filter(m => m.activoId === p.id);
      const kardex = ejecutarMotorKhipu(ops, protocoloActivo);
      const lastLine = kardex.length > 0 ? kardex[kardex.length - 1] : null;
      const totalEntradas = kardex.reduce((sum, line) => sum + (line.cantidadEntrada || 0), 0);
      const totalSalidas = kardex.reduce((sum, line) => sum + (line.cantidadSalida || 0), 0);
      return {
        'Código': p.codigo, 'Descripción': p.nombre.toUpperCase(), 'Tipo (Tabla 5)': getTabla5Label(p.tipoExistencia),
        'Unidad de Medida': p.unidadMedida, 'Total Entradas': totalEntradas, 'Total Salidas': totalSalidas,
        'Stock Actual': lastLine ? lastLine.cantidadSaldo : 0, 'Costo Unitario': lastLine ? lastLine.costoUnitarioSaldo : 0,
        'Valorización Total': lastLine ? lastLine.costoTotalSaldo : 0, 'Stock Mínimo': p.stockMinimo, 'Stock Máximo': p.stockMaximo, 'Observaciones': p.observaciones
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Maestro de Artículos");
    XLSX.writeFile(wb, `KHIPU_Maestro_Articulos_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const descargarPlantillaMasiva = () => {
    const template = [{ 'CÓDIGO': 'P-001', 'DESCRIPCIÓN': 'ARTÍCULO DE EJEMPLO', 'TIPO_SUNAT': '01', 'UNIDAD_SUNAT': '07', 'STOCK_MIN': 10, 'STOCK_MAX': 100, 'STOCK_INICIAL': 0, 'COSTO_UNIT_INICIAL': 0 }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Carga Masiva");
    XLSX.writeFile(wb, "KHIPU_Plantilla_Carga_Masiva.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        const nuevosActivos: ActivoKhipu[] = [];
        const nuevasOperaciones: OperacionKardex[] = [];
        let errores = 0;
        jsonData.forEach((row) => {
          const codigo = String(row['CÓDIGO'] || '').trim();
          const nombre = String(row['DESCRIPCIÓN'] || '').trim();
          if (!codigo || !nombre) { errores++; return; }
          if (maestroActivos.some(a => a.codigo.toUpperCase() === codigo.toUpperCase()) || nuevosActivos.some(a => a.codigo.toUpperCase() === codigo.toUpperCase())) return;
          const productId = crypto.randomUUID();
          const unidadCodigo = String(row['UNIDAD_SUNAT'] || '07').padStart(2, '0');
          const tabla6Map: Record<string, string> = {
            '01': 'KILOGRAMOS', '02': 'LIBRAS', '03': 'TONELADAS LARGAS', '04': 'TONELADAS MÉTRICAS',
            '05': 'TONELADAS CORTAS', '06': 'GRAMOS', '07': 'UNIDADES', '08': 'LITROS',
            '09': 'GALONES', '10': 'BARRILES', '11': 'LATAS', '12': 'CAJAS',
            '13': 'MILLARES', '14': 'METROS CÚBICOS', '15': 'METROS', '99': 'OTROS'
          };
          const activo: ActivoKhipu = {
            id: productId, codigo, nombre,
            unidadMedida: tabla6Map[unidadCodigo] || 'UNIDADES', unidadMedidaCodigo: unidadCodigo,
            tipoExistencia: String(row['TIPO_SUNAT'] || '01').padStart(2, '0'),
            stockMinimo: Number(row['STOCK_MIN']) || 0, stockMaximo: Number(row['STOCK_MAX']) || 0,
            observaciones: 'CARGA MASIVA'
          };
          nuevosActivos.push(activo);
          const stockInicial = Number(row['STOCK_INICIAL']) || 0;
          const costoInicial = Number(row['COSTO_UNIT_INICIAL']) || 0;
          if (stockInicial > 0) {
            nuevasOperaciones.push({
              id: crypto.randomUUID(), activoId: productId, tipo: 'ENTRADA',
              fecha: format(new Date(), 'yyyy-MM-dd'), tipoDocumento: '00', tipoOperacion: '16',
              serie: 'INI', numero: 'MASV', cantidad: stockInicial, costoUnitario: costoInicial,
              costoTotal: stockInicial * costoInicial, createdAt: Date.now()
            });
          }
        });
        if (nuevosActivos.length > 0) {
          setMaestroActivos(prev => [...prev, ...nuevosActivos]);
          setBitacoraOperaciones(prev => [...prev, ...nuevasOperaciones]);
          alert(`Éxito: Se cargaron ${nuevosActivos.length} artículos correctamente. ${errores > 0 ? `(${errores} omitidos por datos incompletos)` : ''}`);
        } else {
          alert("No se encontraron artículos nuevos para cargar o el formato es incorrecto.");
        }
      } catch (error) {
        console.error(error);
        alert("Error al procesar el archivo. Asegúrese de usar la plantilla correcta.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };
  const guardarEdicionMovimiento = async () => {
    if (!editMotivo.trim()) {
      setEditAdminError('El motivo de edición es obligatorio.');
      return;
    }
    setEditAdminLoading(true);
    setEditAdminError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editAdminUser, password: editAdminPass }),
      });
      const data = await res.json();
      if (!res.ok || data.user?.role !== 'ADMIN') {
        setEditAdminError('Credenciales inválidas o sin permisos de administrador.');
        setEditAdminLoading(false);
        return;
      }
      if (!editingMovement) return;
      const updatedOp = {
        ...editingMovement,
        observaciones: `EDITADO ${format(new Date(), 'yyyy-MM-dd')} — ${editMotivo} | ${editingMovement.observaciones || ''}`
      };
      fetch('/api/movements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedOp, userId: currentUser?.id })
      }).catch(err => console.error('Error editando movimiento:', err));
      setBitacoraOperaciones(prev => prev.map(m => m.id === updatedOp.id ? updatedOp : m));
      setShowEditMovementModal(false);
      setEditingMovement(null);
      setEditMotivo('');
      setEditAdminUser('');
      setEditAdminPass('');
    } catch {
      setEditAdminError('Error de conexión.');
    } finally {
      setEditAdminLoading(false);
    }
  };

  // --- RENDERIZADO DEL SISTEMA PRINCIPAL ---
  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#333] selection:bg-[#2B579A] selection:text-white">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#F8F9FA] border-r border-[#DEE2E6] flex flex-col p-0 shadow-sm z-10">
        <div className="flex items-center justify-center p-6 mb-2">
          <Image src="/logokhip.png" alt="Logo Khipu" width={200} height={80} priority className="object-contain" />
          <div className="text-center mt-2"></div>
        </div>

        <div className="mb-6">
          <p className="px-6 text-[9px] font-sans font-bold text-[#999] uppercase tracking-widest mb-4">Principal</p>
          <nav className="space-y-0">
            <SidebarItem icon={LayoutDashboard} label="Resumen General" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Package} label="Catálogo de Artículos" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          </nav>
        </div>

        <div className="mb-6">
          <p className="px-6 text-[9px] font-sans font-bold text-[#999] uppercase tracking-widest mb-4">Movimientos</p>
          <nav className="space-y-0">
            <SidebarItem icon={History} label="Registro de Operaciones" active={activeTab === 'kardex'} onClick={() => setActiveTab('kardex')} />
          </nav>
        </div>

        <div className="mb-6">
          <p className="px-6 text-[9px] font-sans font-bold text-[#999] uppercase tracking-widest mb-4">Consultas y Reportes</p>
          <nav className="space-y-0">
            <SidebarItem icon={BarChart3} label="Kardex Valorado" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'STUDENT') && (
              <SidebarItem icon={Settings} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            )}
            {currentUser?.role === 'ADMIN' && (
              <SidebarItem icon={Users} label="Usuarios" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#DEE2E6] space-y-3">
          <button onClick={inyectarDatosDemo} className="w-full py-2 px-3 border border-[#DEE2E6] rounded-none text-[9px] font-sans font-bold text-[#666] hover:border-[#2B579A] hover:text-[#2B579A] transition-all uppercase tracking-tighter">
            Cargar Datos Ejemplo
          </button>
          <div className="bg-white border border-[#DEE2E6] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2B579A] shadow-sm"></div>
              <span className="text-[10px] font-sans font-bold text-[#333] uppercase tracking-wider">Sistema Online</span>
            </div>
            <p className="text-[9px] text-[#999] leading-relaxed font-sans">Monitoreo de inventario activo.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full relative bg-white flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b border-[#DEE2E6] flex items-center justify-between px-12 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#2B579A]"></div>
              <span className="text-[10px] font-sans font-bold text-[#333] uppercase tracking-widest">Empresa: {empresaConfig.nombre || 'No configurada'}</span>
            </div>
            <div className="h-4 w-[1px] bg-[#DEE2E6]"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold text-[#999] uppercase tracking-widest">Operador:</span>
              <span className="text-[10px] font-sans font-bold text-[#2B579A] uppercase tracking-widest">{currentUser?.username || 'Invitado'}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 p-2 hover:bg-red-50 text-[#999] hover:text-red-500 transition-all border border-transparent hover:border-red-100" title="Cerrar Sesión">
              <LogOut size={16} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Salir</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-sans font-bold text-[#333] uppercase tracking-widest">{format(fechaActual, "EEEE, dd 'de' MMMM", { locale: es })}</p>
              <p className="text-[9px] font-sans font-bold text-[#999] uppercase tracking-widest">{format(fechaActual, "HH:mm:ss 'HRS'")}</p>
            </div>
            <div className="w-10 h-10 border border-[#DEE2E6] flex items-center justify-center text-[#2B579A] bg-[#F8F9FA]">
              <User size={18} />
            </div>
          </div>
        </div>

        <div className="p-12 relative">
          <div className="fixed bottom-12 right-12 opacity-[0.03] pointer-events-none select-none z-0">
            <h1 className="text-[20vw] font-sans font-bold leading-none tracking-tighter text-[#2B579A] rotate-[-15deg]">KHIPU</h1>
          </div>

          <header className="flex justify-between items-end mb-16 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="h-[1px] w-12 bg-[#2B579A]"></span>
                <span className="text-[9px] font-sans font-bold text-[#2B579A] uppercase tracking-[0.4em]">
                  {activeTab === 'dashboard' && 'Resumen_Ejecutivo'}
                  {activeTab === 'products' && 'Maestro_de_Articulos'}
                  {activeTab === 'kardex' && 'Registro_de_Movimientos'}
                  {activeTab === 'reports' && 'Kardex_Valorado_Sunat'}
                  {activeTab === 'settings' && 'Parametros_del_Sistema'}
                  {activeTab === 'users' && 'Gestión_de_Acceso_y_Alumnos'}
                </span>
              </div>
              <h2 className="text-5xl font-sans font-bold text-[#2B579A] tracking-tighter uppercase">
                {activeTab === 'dashboard' && 'Resumen'}
                {activeTab === 'products' && 'Maestro'}
                {activeTab === 'kardex' && 'Movimientos'}
                {activeTab === 'reports' && 'Valorizado'}
                {activeTab === 'settings' && 'Configuración'}
                {activeTab === 'users' && 'Usuarios'}
              </h2>
            </div>
            <div className="flex gap-4">
              {activeTab === 'products' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" size={16} />
                    <input type="text" placeholder="Buscar ID..." value={terminoBusquedaActivo} onChange={(e) => setTerminoBusquedaActivo(e.target.value)} className="pl-11 pr-4 py-3 bg-white border border-[#DEE2E6] rounded-none text-xs font-sans text-[#333] focus:outline-none focus:border-[#2B579A] transition-all w-64" />
                  </div>
                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'STUDENT') && (
                    <button onClick={() => { setNuevoActivo({ ...nuevoActivo, codigo: recomendarCodigo() }); setShowProductModal(true); }} className="bg-[#2B579A] text-white px-6 py-3 rounded-none flex items-center gap-2 hover:bg-[#1A3A6A] transition-all text-[11px] font-sans font-bold uppercase tracking-wider shadow-sm">
                      <Plus size={16} />Añadir Activo
                    </button>
                  )}
                </>
              )}
              {activeTab === 'kardex' && (
                <div className="flex gap-4">
                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'STUDENT') && (
                    <button onClick={() => { setNuevaOperacion({...nuevaOperacion, tipoDocumento: 'AJUSTE', serie: 'ADJ', numero: format(new Date(), 'yyyyMMdd')}); setShowMovementModal(true); }} className="bg-orange-50 text-[#F97316] border border-orange-200 px-6 py-3 rounded-none flex items-center gap-2 hover:bg-[#F97316] hover:text-white transition-all text-[11px] font-sans font-bold uppercase tracking-wider shadow-sm">
                      <Settings size={16} />Ajuste de Inventario
                    </button>
                  )}
                  <button onClick={() => { setBusquedaActivoModal(''); setShowMovementModal(true); }} className="bg-[#2B579A] text-white px-6 py-3 rounded-none flex items-center gap-2 hover:bg-[#1A3A6A] transition-all text-[11px] font-sans font-bold uppercase tracking-wider shadow-sm">
                    <Plus size={16} />Nueva Transacción
                  </button>
                </div>
              )}
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={Package} label="Activos Totales" value={maestroActivos.length} subtext="Ítems registrados" colorClass="bg-[#E7EEF8] text-[#2B579A]" />
                <StatCard icon={ClipboardList} label="Ops Mensuales" value={bitacoraOperaciones.filter(m => { const d = safeDate(m.fecha); return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear(); }).length} subtext="Periodo actual" trend="12" colorClass="bg-[#E7EEF8] text-[#2B579A]" />
                <StatCard icon={BarChart3} label="Valorización Total" value={`S/ ${maestroActivos.reduce((acc, p) => { const kardex = ejecutarMotorKhipu(bitacoraOperaciones.filter(m => m.activoId === p.id), protocoloActivo); return acc + (kardex[kardex.length - 1]?.costoTotalSaldo || 0); }, 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtext="Capital en almacén" colorClass="bg-[#E7EEF8] text-[#2B579A]" />
                <StatCard icon={AlertTriangle} label="Alertas Seguridad" value={maestroActivos.filter(p => { const stock = obtenerSaldoFisico(p.id); return stock <= p.stockMinimo || stock >= p.stockMaximo; }).length} subtext="Acción requerida" colorClass="bg-orange-50 text-[#F97316]" />

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="font-sans font-bold text-xl uppercase tracking-tighter text-[#2B579A]">Resumen de Activos</h4>
                      <span className="text-[9px] font-sans font-bold bg-[#2B579A] text-white px-3 py-1 rounded-none uppercase tracking-widest">Total: {maestroActivos.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-[9px] uppercase tracking-widest text-[#999] font-sans font-bold border-b border-[#DEE2E6]">
                          <tr><th className="pb-4">Nombre_Activo</th><th className="pb-4">Cant</th><th className="pb-4">Valorización_S/</th></tr>
                        </thead>
                        <tbody className="text-[11px] font-sans">
                          {maestroActivos.map(p => {
                            const stock = obtenerSaldoFisico(p.id);
                            const kardex = ejecutarMotorKhipu(bitacoraOperaciones.filter(m => m.activoId === p.id), protocoloActivo);
                            const lastLine = kardex[kardex.length - 1];
                            const totalValue = lastLine?.costoTotalSaldo || 0;
                            return (
                              <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                                <td className="py-4"><div className="font-bold text-[#333]">{p.nombre}</div><div className="text-[9px] text-[#999]">{p.codigo}</div></td>
                                <td className="py-4"><div className="text-[#333]">{stock} {p.unidadMedida}</div>{stock <= p.stockMinimo && <span className="text-[8px] font-bold text-[#F97316] uppercase tracking-tighter">Stock_Bajo</span>}</td>
                                <td className="py-4 text-[#2B579A] font-bold">{totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                          {maestroActivos.length === 0 && (<tr><td colSpan={3} className="py-10 text-center text-[#999] italic">No hay activos registrados.</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="font-sans font-bold text-xl uppercase tracking-tighter text-[#2B579A]">Últimos Movimientos</h4>
                      <button onClick={() => setActiveTab('kardex')} className="text-[9px] font-sans font-bold text-[#2B579A] uppercase tracking-widest hover:underline">Ver Todo</button>
                    </div>
                    <div className="space-y-4">
                      {bitacoraOperaciones.slice(-5).reverse().map((m, idx) => {
                        const product = maestroActivos.find(p => p.id === m.activoId);
                        return (
                          <div key={m.id || idx} className="flex items-center justify-between p-4 border border-[#DEE2E6] bg-[#F8F9FA] group hover:border-[#2B579A]/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 flex items-center justify-center ${m.tipo === 'ENTRADA' ? 'bg-[#E7EEF8] text-[#2B579A]' : 'bg-orange-50 text-[#F97316]'}`}>
                                {m.tipo === 'ENTRADA' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-[#333] uppercase">{product?.nombre || 'Activo_Eliminado'}</p>
                                <p className="text-[9px] text-[#999] uppercase tracking-widest">{m.tipoDocumento} {m.serie}-{m.numero}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-[11px] font-bold ${m.tipo === 'ENTRADA' ? 'text-[#2B579A]' : 'text-[#F97316]'}`}>{m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad}</p>
                              <p className="text-[9px] text-[#999] uppercase tracking-widest">{format(safeDate(m.fecha), 'dd/MM/yy')}</p>
                            </div>
                          </div>
                        );
                      })}
                      {bitacoraOperaciones.length === 0 && (<div className="py-12 text-center border border-dashed border-[#DEE2E6]"><p className="text-[10px] text-[#999] uppercase tracking-widest">Sin_Movimientos_Recientes</p></div>)}
                    </div>
                  </Card>

                  <Card className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="font-sans font-bold text-xl uppercase tracking-tighter text-[#F97316]">Alertas de Stock</h4>
                      <AlertTriangle size={20} className="text-[#F97316]" />
                    </div>
                    <div className="space-y-4">
                      {maestroActivos.filter(p => obtenerSaldoFisico(p.id) <= p.stockMinimo).slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 border border-orange-100 bg-orange-50/50 group hover:bg-orange-50 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-orange-100 text-[#F97316]"><AlertTriangle size={18} /></div>
                            <div>
                              <p className="text-[11px] font-bold text-[#333] uppercase">{p.nombre}</p>
                              <p className="text-[9px] text-[#999] uppercase tracking-widest">Mín: {p.stockMinimo} {p.unidadMedida}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-[#F97316]">{obtenerSaldoFisico(p.id)} {p.unidadMedida}</p>
                            <p className="text-[9px] text-[#999] uppercase tracking-widest">Crítico</p>
                          </div>
                        </div>
                      ))}
                      {maestroActivos.filter(p => obtenerSaldoFisico(p.id) <= p.stockMinimo).length === 0 && (<div className="py-12 text-center border border-dashed border-[#DEE2E6]"><p className="text-[10px] text-[#999] uppercase tracking-widest">Sin_Alertas_Criticas</p></div>)}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white p-8 border border-[#DEE2E6] shadow-sm flex justify-between items-center">
                  <div className="relative max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" size={16} />
                    <input type="text" placeholder="Filtrar por nombre o código en catálogo..." value={terminoBusquedaActivo} onChange={(e) => setTerminoBusquedaActivo(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-[#DEE2E6] rounded-none text-[11px] font-sans text-[#333] focus:outline-none focus:border-[#2B579A] transition-all" />
                  </div>
                  <div className="flex gap-3">
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'STUDENT') && (
                      <>
                        <input type="file" id="bulk-upload-input" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                        <button onClick={descargarPlantillaMasiva} className="flex items-center gap-2 px-4 py-3 border border-[#DEE2E6] bg-white text-[#999] text-[9px] font-sans font-bold hover:bg-gray-50 transition-all uppercase tracking-widest" title="Descargar Plantilla de Excel">Plantilla</button>
                        <label htmlFor="bulk-upload-input" className="flex items-center gap-2 px-6 py-3 border border-[#2B579A] bg-[#E7EEF8] text-[#2B579A] text-[9px] font-sans font-bold hover:bg-[#2B579A] hover:text-white transition-all uppercase tracking-widest cursor-pointer">
                          <Upload size={14} />Carga_Masiva
                        </label>
                      </>
                    )}
                    <button onClick={exportMaestroArticulosPDF} className="flex items-center gap-2 px-6 py-3 border border-[#DEE2E6] bg-white text-[#333] text-[9px] font-sans font-bold hover:bg-[#2B579A] hover:text-white transition-all uppercase tracking-widest"><FileText size={14} />Reporte_Maestro_PDF</button>
                    <button onClick={exportMaestroArticulosExcel} className="flex items-center gap-2 px-6 py-3 border border-[#DEE2E6] bg-white text-[#333] text-[9px] font-sans font-bold hover:bg-[#2B579A] hover:text-white transition-all uppercase tracking-widest"><Download size={14} />Reporte_Maestro_XLS</button>
                    <button onClick={() => { const initialCounts: {[key: string]: number} = {}; maestroActivos.forEach(p => { initialCounts[p.id] = obtenerSaldoFisico(p.id); }); setPhysicalCounts(initialCounts); setAdjustmentNumero(Math.floor(100000 + Math.random() * 900000).toString()); setShowAdjustmentModal(true); }} className="flex items-center gap-2 px-6 py-3 border border-orange-500 bg-orange-50 text-orange-600 text-[9px] font-sans font-bold hover:bg-orange-600 hover:text-white transition-all uppercase tracking-widest shadow-sm">
                      <Settings size={14} />Toma_Física_Ajuste
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#DEE2E6] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#F8F9FA] text-[9px] uppercase tracking-[0.2em] text-[#999] font-sans font-bold border-b border-[#DEE2E6]">
                        <tr>
                          <th className="px-8 py-5">ID_Activo</th><th className="px-8 py-5">Descripción</th><th className="px-8 py-5">Tipo</th>
                          <th className="px-8 py-5">Unidad</th><th className="px-8 py-5">Límites</th><th className="px-8 py-5">Costo Unitario</th>
                          <th className="px-8 py-5">Stock</th><th className="px-8 py-5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DEE2E6] text-[11px] font-sans">
                        {activosFiltrados.map(p => {
                          const ops = bitacoraOperaciones.filter(m => m.activoId === p.id);
                          const kardex = ejecutarMotorKhipu(ops, protocoloActivo);
                          const lastLine = kardex.length > 0 ? kardex[kardex.length - 1] : null;
                          const stock = lastLine ? lastLine.cantidadSaldo : 0;
                          const unitCost = lastLine ? lastLine.costoUnitarioSaldo : 0;
                          return (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-8 py-5 text-[#999]">{p.codigo}</td>
                              <td className="px-8 py-5 font-bold text-[#333] uppercase tracking-tight">{p.nombre}</td>
                              <td className="px-8 py-5 text-[#999] text-[9px] font-bold uppercase tracking-tighter">{getTabla5Label(p.tipoExistencia)}</td>
                              <td className="px-8 py-5 text-[#999]">{p.unidadMedida}</td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-bold text-[#999]">{p.stockMinimo}</span>
                                  <div className="h-1 w-16 bg-[#DEE2E6] rounded-none overflow-hidden"><div className="h-full bg-[#2B579A]" style={{ width: `${Math.min(100, (stock / p.stockMaximo) * 100)}%` }}></div></div>
                                  <span className="text-[9px] font-bold text-[#999]">{p.stockMaximo}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-[#333] font-mono">S/ {unitCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                              <td className="px-8 py-5"><span className={`text-xl font-bold ${stock <= p.stockMinimo ? 'text-[#F97316]' : 'text-[#2B579A]'}`}>{stock}</span></td>
                              <td className="px-8 py-5 text-right">
                                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'STUDENT') && (
                                  <button onClick={() => deleteProduct(p.id)} className="text-[#999] hover:text-[#F97316] p-2 transition-colors"><Trash2 size={16} /></button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {maestroActivos.length > 0 && activosFiltrados.length === 0 && (<tr><td colSpan={8} className="px-8 py-32 text-center text-[#999]"><div className="max-w-xs mx-auto"><div className="w-16 h-16 border border-[#DEE2E6] bg-[#F8F9FA] flex items-center justify-center mx-auto mb-6"><Search size={32} className="text-[#DEE2E6]" /></div><h5 className="font-sans font-bold text-xl text-[#2B579A] mb-2 uppercase tracking-tighter">Sin_Coincidencias</h5><p className="text-[10px] leading-relaxed uppercase tracking-tight">La búsqueda &quot;{terminoBusquedaActivo}&quot; retornó 0 resultados.</p></div></td></tr>)}
                        {maestroActivos.length === 0 && (<tr><td colSpan={8} className="px-8 py-32 text-center text-[#999]"><div className="max-w-xs mx-auto"><div className="w-16 h-16 border border-[#DEE2E6] bg-[#F8F9FA] flex items-center justify-center mx-auto mb-6"><Search size={32} className="text-[#DEE2E6]" /></div><h5 className="font-sans font-bold text-xl text-[#2B579A] mb-2 uppercase tracking-tighter">Registro_Vacío</h5><p className="text-[10px] leading-relaxed uppercase tracking-tight">Inicie el sistema añadiendo activos a la base de datos primaria.</p></div></td></tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'kardex' && (
              <motion.div key="kardex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-white p-8 border border-[#DEE2E6] shadow-sm flex flex-wrap gap-8 items-end">
                  <div className="flex-[2] min-w-[280px]">
                    <label className="block text-[9px] font-sans font-bold text-[#999] uppercase tracking-widest mb-3">Búsqueda_y_Selección_de_Activos</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" size={16} />
                        <input type="text" placeholder="Filtrar por nombre o código..." value={terminoBusquedaKardex} onChange={(e) => setTerminoBusquedaKardex(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-[#DEE2E6] rounded-none text-[11px] font-sans text-[#333] focus:outline-none focus:border-[#2B579A] transition-all placeholder:text-[#DEE2E6]" />
                      </div>
                      <select value={activoSeleccionadoId} onChange={(e) => setActivoSeleccionadoId(e.target.value)} className="flex-1 bg-white border border-[#DEE2E6] rounded-none px-4 py-3 text-[11px] font-sans text-[#333] focus:outline-none focus:border-[#2B579A] transition-all appearance-none cursor-pointer">
                        <option value="">-- SELECCIONAR ACTIVO --</option>
                        {maestroActivos.filter(p => (p.nombre || '').toLowerCase().includes((terminoBusquedaKardex || '').toLowerCase()) || (p.codigo || '').toLowerCase().includes((terminoBusquedaKardex || '').toLowerCase())).map(p => (<option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-sans font-bold text-[#999] uppercase tracking-widest mb-3">Protocolo_de_Valuación</label>
                    <div className={`flex bg-[#F8F9FA] p-1 border border-[#DEE2E6] ${!esKardexVacio ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                      {(['PROMEDIO', 'PEPS'] as ProtocoloValuacion[]).map((m) => (
                        <button key={m} disabled={!esKardexVacio} onClick={() => setProtocoloActivo(m)} className={`px-4 py-2 rounded-none text-[9px] font-sans font-bold transition-all ${protocoloActivo === m ? 'bg-[#2B579A] text-white' : 'text-[#999] hover:text-[#2B579A]'} ${!esKardexVacio ? 'cursor-not-allowed' : ''}`}>{m}</button>
                      ))}
                    </div>
                    {!esKardexVacio && (<div className="flex items-center gap-2 mt-2"><AlertTriangle size={10} className="text-[#F97316]" /><p className="text-[8px] font-sans font-bold text-[#F97316] uppercase tracking-tighter">El método de valuación no puede cambiarse una vez iniciadas las operaciones</p></div>)}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 border border-[#DEE2E6] bg-white text-[#333] text-[9px] font-sans font-bold hover:bg-[#2B579A] hover:text-white transition-all uppercase tracking-widest"><Download size={14} />Exportar_XLS</button>
                    <button onClick={exportToPDF} className="flex items-center gap-2 px-6 py-3 border border-[#DEE2E6] bg-white text-[#333] text-[9px] font-sans font-bold hover:bg-[#2B579A] hover:text-white transition-all uppercase tracking-widest"><FileText size={14} />Exportar_PDF</button>
                  </div>
                </div>

                {activoSeleccionadoId && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-[#F8F9FA] border border-[#DEE2E6] p-6">
                    <div><p className="text-[8px] font-bold text-[#999] uppercase tracking-widest mb-1">Código_Articulo</p><p className="text-sm font-sans font-bold text-[#2B579A]">{maestroActivos.find(p => p.id === activoSeleccionadoId)?.codigo}</p></div>
                    <div><p className="text-[8px] font-bold text-[#999] uppercase tracking-widest mb-1">Descripción_Detallada</p><p className="text-sm font-sans font-bold text-[#333]">{maestroActivos.find(p => p.id === activoSeleccionadoId)?.nombre}</p></div>
                    <div><p className="text-[8px] font-bold text-[#999] uppercase tracking-widest mb-1">Unidad_Medida</p><p className="text-sm font-sans font-bold text-[#333]">{maestroActivos.find(p => p.id === activoSeleccionadoId)?.unidadMedida}</p></div>
                    <div><p className="text-[8px] font-bold text-[#999] uppercase tracking-widest mb-1">Método_Valoración</p><p className="text-sm font-sans font-bold text-[#F97316]">{protocoloActivo}</p></div>
                  </div>
                )}

                <div className="bg-white border border-[#DEE2E6] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#F8F9FA] text-[8px] uppercase tracking-[0.2em] text-[#999] font-sans font-bold border-b border-[#DEE2E6]">
                        <tr>
                          <th rowSpan={2} className="px-4 py-4 border-r border-[#DEE2E6]">Marca_de_Tiempo</th>
                          <th colSpan={3} className="px-4 py-3 text-center border-r border-[#DEE2E6]">Referencia_Doc</th>
                          <th rowSpan={2} className="px-4 py-4 border-r border-[#DEE2E6]">Tipo_Op</th>
                          <th colSpan={3} className="px-4 py-3 text-center border-r border-[#DEE2E6] bg-[#E7EEF8]">Registro_Entrada</th>
                          <th colSpan={3} className="px-4 py-3 text-center border-r border-[#DEE2E6] bg-orange-50">Registro_Salida</th>
                          <th colSpan={3} className="px-4 py-3 text-center bg-[#2B579A]/5 border-r border-[#DEE2E6]">Estado_Saldo</th>
                          <th rowSpan={2} className="px-4 py-4 text-center">Observaciones</th>
                          <th rowSpan={2} className="px-4 py-4 text-center">Acc.</th>
                        </tr>
                        <tr className="border-t border-[#DEE2E6] bg-gray-50">
                          <th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px]">Tipo</th><th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px]">Serie</th><th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px]">Número</th>
                          <th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px] text-center">CANT.</th><th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px] text-center">UNIT.</th><th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px] text-center">TOTAL.</th>
                          <th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px] text-center">CANT.</th><th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px] text-center">UNIT.</th><th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px] text-center">TOTAL.</th>
                          <th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px] text-center">CANT.</th><th className="px-4 py-3 border-r border-[#DEE2E6] text-[7px] text-center">UNIT.</th><th className="px-4 py-3 text-[7px] text-center">TOTAL.</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-sans divide-y divide-[#DEE2E6]">
                        {activoSeleccionadoId ? (
                          ejecutarMotorKhipu(bitacoraOperaciones.filter(m => m.activoId === activoSeleccionadoId), protocoloActivo).map((line, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4 border-r border-[#DEE2E6] text-[#999]">{line.fecha}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] text-[#333]">{line.tipoDocumento}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] text-[#999]">{line.serie}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] text-[#999]">{line.numero}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6]">
                                <div className={`text-[8px] font-bold uppercase tracking-wider ${line.tipo === 'ENTRADA' ? 'text-[#2B579A]' : 'text-[#F97316]'}`}>{line.tipoOperacion || (line.tipo === 'ENTRADA' ? '02' : '01')}</div>
                                <div className="text-[7px] text-[#999] uppercase truncate max-w-[80px]">{getTabla12(line.tipoOperacion || (line.tipo === 'ENTRADA' ? '02' : '01'))}</div>
                              </td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-[#E7EEF8] text-[#2B579A] text-center">{line.cantidadEntrada || '-'}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-[#E7EEF8] text-[#2B579A]/70 text-center">{line.costoUnitarioEntrada ? line.costoUnitarioEntrada.toFixed(4) : '-'}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-[#E7EEF8] text-[#2B579A] font-bold text-center">{line.costoTotalEntrada ? line.costoTotalEntrada.toFixed(2) : '-'}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-orange-50 text-[#F97316] text-center">{line.cantidadSalida || '-'}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-orange-50 text-[#F97316]/70 text-center">{line.costoUnitarioSalida ? line.costoUnitarioSalida.toFixed(4) : '-'}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-orange-50 text-[#F97316] font-bold text-center">{line.costoTotalSalida ? line.costoTotalSalida.toFixed(2) : '-'}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-[#2B579A]/5 text-[#2B579A] font-bold text-center">{line.cantidadSaldo}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-[#2B579A]/5 text-[#2B579A]/70 text-center">{line.costoUnitarioSaldo.toFixed(4)}</td>
                              <td className="px-4 py-4 border-r border-[#DEE2E6] bg-[#2B579A]/5 text-[#2B579A] font-bold text-center">{line.costoTotalSaldo.toFixed(2)}</td>
                              <td className="px-4 py-4 text-[#999] italic max-w-[150px] truncate" title={line.observaciones}>{line.observaciones || '-'}</td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => {
                                    const op = bitacoraOperaciones.find(m => m.activoId === activoSeleccionadoId && m.fecha === line.fecha && m.serie === line.serie && m.numero === line.numero);
                                    if (op) { setEditingMovement({...op}); setEditMotivo(''); setEditAdminUser(''); setEditAdminPass(''); setEditAdminError(''); setShowEditMovementModal(true); }
                                  }}
                                  className="text-[#999] hover:text-[#2B579A] p-1 transition-colors"
                                  title="Editar movimiento"
                                >
                                  <Settings size={13} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={15} className="px-4 py-40 text-center text-[#999]"><div className="max-w-xs mx-auto"><div className="w-16 h-16 border border-[#DEE2E6] bg-[#F8F9FA] flex items-center justify-center mx-auto mb-6"><Search size={32} className="text-[#DEE2E6]" /></div><h5 className="font-sans font-bold text-xl text-[#2B579A] mb-2 uppercase tracking-tighter">Sin_Activo_Seleccionado</h5><p className="text-[10px] leading-relaxed uppercase tracking-tight">Seleccione un activo de la base de datos para inicializar la visualización del kardex.</p></div></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {resumenMensual.length > 0 && (
                  <div className="bg-white border border-[#DEE2E6] shadow-sm overflow-hidden mt-8">
                    <div className="bg-[#F8F9FA] px-8 py-5 border-b border-[#DEE2E6] flex justify-between items-center">
                      <h4 className="font-sans font-bold text-sm uppercase tracking-tighter text-[#2B579A]">Saldos Mensuales Acumulados (Transferencia de Saldos)</h4>
                      <History size={16} className="text-[#2B579A]" />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-[8px] uppercase tracking-[0.2em] text-[#999] font-sans font-bold border-b border-[#DEE2E6]">
                          <tr><th className="px-8 py-4">Periodo_Mensual</th><th className="px-8 py-4">Saldo_Final_Uni</th><th className="px-8 py-4">Costo_Unitario_S/</th><th className="px-8 py-4">Valorización_Total_S/</th><th className="px-8 py-4 text-right">Estado_Cierre</th></tr>
                        </thead>
                        <tbody className="text-[10px] font-sans divide-y divide-[#DEE2E6]">
                          {resumenMensual.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-8 py-4 font-bold text-[#333] uppercase tracking-widest">{format(new Date(item.periodo + '-02'), 'MMMM yyyy', { locale: es })}</td>
                              <td className="px-8 py-4 text-[#2B579A] font-bold">{item.saldoFinal}</td>
                              <td className="px-8 py-4 text-[#999]">{item.costoUnitario.toFixed(4)}</td>
                              <td className="px-8 py-4 text-[#2B579A] font-bold">S/ {item.valorTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                              <td className="px-8 py-4 text-right"><span className="bg-green-50 text-green-600 px-3 py-1 rounded-none text-[8px] font-black uppercase tracking-widest border border-green-100">Transferido_OK</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-10 group cursor-pointer border-[#DEE2E6] hover:border-[#2B579A]/50 transition-all">
                  <div className="w-14 h-14 border border-[#DEE2E6] bg-[#F8F9FA] text-[#2B579A] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300"><FileText size={28} /></div>
                  <h3 className="text-2xl font-sans font-bold mb-3 tracking-tighter text-[#2B579A] uppercase">Reportes_Oficiales_SUNAT</h3>
                  <p className="text-[#999] text-[11px] font-sans leading-relaxed mb-8 uppercase tracking-tight">Formatos oficiales de control de inventarios (Unidades Físicas y Valorizadas) según la normativa tributaria vigente.</p>
                  <div className="space-y-4">
                    <select value={activoSeleccionadoId} onChange={(e) => setActivoSeleccionadoId(e.target.value)} className="w-full bg-white border border-[#DEE2E6] rounded-none px-4 py-3 text-[11px] font-sans text-[#333] focus:outline-none focus:border-[#2B579A]">
                      <option value="">-- SELECCIONAR ACTIVO --</option>
                      {maestroActivos.map(p => (<option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>))}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={exportToPDF} disabled={!activoSeleccionadoId} className="py-4 bg-[#2B579A] text-white rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#1A3A6A] disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">PDF 12.1<Download size={14} /></button>
                      <button onClick={exportToExcelSUNAT121} disabled={!activoSeleccionadoId} className="py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">XLS 12.1<Download size={14} /></button>
                      <button onClick={exportToPDFValorizado} disabled={!activoSeleccionadoId} className="py-4 bg-[#2B579A] text-white rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#1A3A6A] disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">PDF 13.1<Download size={14} /></button>
                      <button onClick={exportToExcelSUNAT131} disabled={!activoSeleccionadoId} className="py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">XLS 13.1<Download size={14} /></button>
                    </div>
                  </div>
                </Card>

                <Card className="p-10 group cursor-pointer border-[#DEE2E6] hover:border-[#2B579A]/50 transition-all">
                  <div className="w-14 h-14 border border-[#DEE2E6] bg-[#F8F9FA] text-[#2B579A] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300"><BarChart3 size={28} /></div>
                  <h3 className="text-2xl font-sans font-bold mb-3 tracking-tighter text-[#2B579A] uppercase">Analítica_Operacional</h3>
                  <p className="text-[#999] text-[11px] font-sans leading-relaxed mb-8 uppercase tracking-tight">Reportes avanzados para alertas de stock, rotación de activos y análisis de velocidad de movimiento.</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={exportMaestroArticulosPDF} className="py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white transition-all flex items-center justify-center gap-2">Registro_Maestro_PDF<FileText size={14} /></button>
                    <button onClick={exportMaestroArticulosExcel} className="py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white transition-all flex items-center justify-center gap-2">Registro_Maestro_XLS<Download size={14} /></button>
                    <button onClick={() => setShowStockAlertModal(true)} className="py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white transition-all flex items-center justify-center gap-2">Consola_de_Alertas_Stock<AlertTriangle size={14} /></button>
                    <button onClick={() => setShowMovementReportModal(true)} className="py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white transition-all flex items-center justify-center gap-2">Consola_de_Logs_Movimientos<History size={14} /></button>
                    <button onClick={() => setShowLowMovementModal(true)} className="py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white transition-all flex items-center justify-center gap-2">Consola_de_Baja_Rotación<Filter size={14} /></button>
                  </div>
                </Card>

                <Card className="p-10 group cursor-pointer border-[#DEE2E6] hover:border-[#2B579A]/50 transition-all">
                  <div className="w-14 h-14 border border-[#DEE2E6] bg-[#F8F9FA] text-[#F97316] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300"><AlertTriangle size={28} /></div>
                  <h3 className="text-2xl font-sans font-bold mb-3 tracking-tighter text-[#2B579A] uppercase">Alertas_Críticas</h3>
                  <p className="text-[#999] text-[11px] font-sans leading-relaxed mb-8 uppercase tracking-tight">Identificación en tiempo real de activos por debajo del umbral mínimo o que exceden la capacidad máxima.</p>
                  <button onClick={exportStockAlertsReport} className="w-full py-4 bg-orange-50 border border-orange-200 text-[#F97316] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#F97316] hover:text-white transition-all flex items-center justify-center gap-3">Exportar_Log_Alertas<Download size={16} /></button>
                </Card>

                <Card className="p-10 group cursor-pointer border-[#DEE2E6] hover:border-[#2B579A]/50 transition-all">
                  <div className="w-14 h-14 border border-[#DEE2E6] bg-[#F8F9FA] text-[#2B579A] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300"><History size={28} /></div>
                  <h3 className="text-2xl font-sans font-bold mb-3 tracking-tighter text-[#2B579A] uppercase">Log_Historial_Completo</h3>
                  <p className="text-[#999] text-[11px] font-sans leading-relaxed mb-8 uppercase tracking-tight">Registro cronológico de todas las operaciones de entrada y salida registradas en la base de datos primaria.</p>
                  <button onClick={exportToExcel} className="w-full py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white transition-all flex items-center justify-center gap-3">Exportar_Historial_Completo<Download size={16} /></button>
                </Card>

                <Card className="p-10 group cursor-pointer border-[#DEE2E6] hover:border-[#2B579A]/50 transition-all">
                  <div className="w-14 h-14 border border-[#DEE2E6] bg-[#F8F9FA] text-[#F97316] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300"><Filter size={28} /></div>
                  <h3 className="text-2xl font-sans font-bold mb-3 tracking-tighter text-[#2B579A] uppercase">Análisis_de_Baja_Rotación</h3>
                  <p className="text-[#999] text-[11px] font-sans leading-relaxed mb-8 uppercase tracking-tight">Identificación de activos estancados con rotación nula o mínima durante el periodo operativo actual.</p>
                  <button onClick={exportLowMovementReport} className="w-full py-4 border border-[#DEE2E6] bg-white text-[#333] rounded-none font-sans font-bold text-[10px] uppercase tracking-widest hover:bg-[#2B579A] hover:text-white transition-all flex items-center justify-center gap-3">Exportar_Reporte_Rotación<Download size={16} /></button>
                </Card>
              </motion.div>
            )}

            {activeTab === 'users' && currentUser?.role === 'ADMIN' && (<StudentManagement />)}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                <Card className="p-10">
                  <h3 className="text-2xl font-display font-bold mb-6 tracking-tight">Configuración del Sistema</h3>
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-4">Datos de la Empresa</label>
                      <div className="space-y-4 bg-[#F8F9FA] p-6 border border-[#DEE2E6]">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Nombre</label><input type="text" value={empresaConfig.nombre} onChange={(e) => setEmpresaConfig({...empresaConfig, nombre: e.target.value})} className="w-full bg-white border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A]" /></div>
                          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">RUC</label><input type="text" value={empresaConfig.ruc} onChange={(e) => setEmpresaConfig({...empresaConfig, ruc: e.target.value})} className="w-full bg-white border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A]" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Teléfono</label><input type="text" value={empresaConfig.telefono} onChange={(e) => setEmpresaConfig({...empresaConfig, telefono: e.target.value})} className="w-full bg-white border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A]" /></div>
                          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Dirección</label><input type="text" value={empresaConfig.direccion} onChange={(e) => setEmpresaConfig({...empresaConfig, direccion: e.target.value})} className="w-full bg-white border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A]" /></div>
                        </div>
                        <button onClick={() => guardarEmpresa(empresaConfig)} className="bg-[#2B579A] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A3A6A] transition-all">Actualizar Datos</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-4">Método de Valuación Predeterminado</label>
                      <div className={`flex bg-[#F8F9FA] p-1 rounded-none border border-[#DEE2E6] w-fit ${!esKardexVacio ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                        {(['PROMEDIO', 'PEPS'] as ProtocoloValuacion[]).map((m) => (
                          <button key={m} disabled={!esKardexVacio} onClick={() => setProtocoloActivo(m)} className={`px-6 py-2.5 rounded-none text-[10px] font-bold transition-all ${protocoloActivo === m ? 'bg-[#2B579A] text-white shadow-sm' : 'text-[#999] hover:text-[#2B579A]'} ${!esKardexVacio ? 'cursor-not-allowed' : ''}`}>{m}</button>
                        ))}
                      </div>
                      {!esKardexVacio ? (<div className="flex items-center gap-2 mt-3 p-3 bg-orange-50 border border-orange-100"><AlertTriangle size={14} className="text-[#F97316]" /><p className="text-[10px] font-bold text-[#F97316] uppercase tracking-tight">El método de valuación no puede cambiarse una vez iniciadas las operaciones</p></div>) : (<p className="mt-3 text-[10px] text-[#999] leading-relaxed">Este método se aplicará globalmente a todos los cálculos de Kardex y Dashboard.</p>)}
                    </div>
                    <div className="pt-8 border-t border-[#DEE2E6]">
                      <h4 className="text-sm font-bold text-[#1A1A1A] mb-2">Acerca de Kardex KHIPU</h4>
                      <p className="text-xs text-[#666] leading-relaxed mb-4">Control de inventarios bajo normativa SUNAT (Perú).</p>
                      <div className="flex gap-4 text-[10px] font-bold text-[#999]"><span>Versión 1.2.0</span><span>•</span><span className="text-[#F97316]">Gestión de Almacén</span></div>
                    </div>
                    <div className="pt-8 border-t border-[#DEE2E6]">
                      <button onClick={purgarBaseDatos} className="px-6 py-3 bg-orange-50 text-[#F97316] rounded-none border border-orange-100 text-[10px] font-bold uppercase tracking-widest hover:bg-orange-100 transition-all">Restablecer Base de Datos</button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showStockAlertModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-[#DEE2E6] p-10 max-w-4xl w-full shadow-2xl max-h-[80vh] overflow-y-auto rounded-none relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#F97316]"></div><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F97316]"></div><div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F97316]"></div><div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#F97316]"></div>
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-5"><div className="w-14 h-14 border border-orange-100 bg-orange-50 text-[#F97316] flex items-center justify-center"><AlertTriangle size={28} /></div><div><h3 className="text-2xl font-sans font-bold tracking-tighter text-[#2B579A] uppercase">Alertas_Críticas_de_Stock</h3><p className="text-[#999] text-[10px] font-sans uppercase tracking-widest font-bold">Activos por debajo del umbral de seguridad operacional</p></div></div>
                <button onClick={() => setShowStockAlertModal(false)} className="p-3 border border-[#DEE2E6] text-[#999] hover:text-[#2B579A] hover:border-[#2B579A]/50 transition-all"><X size={24} /></button>
              </div>
              <div className="border border-[#DEE2E6] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F8F9FA] text-[10px] uppercase tracking-widest text-[#999] font-bold border-b border-[#DEE2E6]"><tr><th className="px-6 py-5">ID_Código</th><th className="px-6 py-5">Nombre_Activo</th><th className="px-6 py-5 text-center">Mín_Seguridad</th><th className="px-6 py-5 text-center">Nivel_Actual</th><th className="px-6 py-5 text-center">Flag_Estado</th></tr></thead>
                  <tbody className="divide-y divide-[#DEE2E6] text-[12px] font-sans">
                    {maestroActivos.filter(p => obtenerSaldoFisico(p.id) <= p.stockMinimo).map(p => { const stock = obtenerSaldoFisico(p.id); return (<tr key={p.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-5 text-[#999]">{p.codigo}</td><td className="px-6 py-5 text-[#333] font-bold uppercase">{p.nombre}</td><td className="px-6 py-5 text-center text-[#999]">{p.stockMinimo}</td><td className="px-6 py-5 text-center font-bold text-[#F97316] text-lg">{stock}</td><td className="px-6 py-5 text-center"><span className="px-3 py-1 border border-orange-200 bg-orange-50 text-[#F97316] text-[9px] font-bold uppercase tracking-widest">{stock === 0 ? 'AGOTADO' : 'CRÍTICO'}</span></td></tr>); })}
                    {maestroActivos.filter(p => obtenerSaldoFisico(p.id) <= p.stockMinimo).length === 0 && (<tr><td colSpan={5} className="px-6 py-24 text-center text-[#999] uppercase text-[10px] tracking-[0.2em] font-sans">[ NO SE DETECTARON ALERTAS CRÍTICAS ]</td></tr>)}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showMovementReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-[#DEE2E6] p-10 max-w-5xl w-full shadow-2xl max-h-[80vh] overflow-y-auto rounded-none relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#F97316]"></div><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F97316]"></div><div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F97316]"></div><div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#F97316]"></div>
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-5"><div className="w-14 h-14 border border-[#2B579A]/10 bg-[#E7EEF8] text-[#2B579A] flex items-center justify-center"><History size={28} /></div><div><h3 className="text-2xl font-sans font-bold tracking-tighter text-[#2B579A] uppercase">Log_de_Historial_Operativo</h3><p className="text-[#999] text-[10px] font-sans uppercase tracking-widest font-bold">Registro cronológico completo del flujo de activos</p></div></div>
                <button onClick={() => setShowMovementReportModal(false)} className="p-3 border border-[#DEE2E6] text-[#999] hover:text-[#2B579A] hover:border-[#2B579A]/50 transition-all"><X size={24} /></button>
              </div>
              <div className="border border-[#DEE2E6] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F8F9FA] text-[10px] uppercase tracking-widest text-[#999] font-bold border-b border-[#DEE2E6]"><tr><th className="px-6 py-5">Marca_de_Tiempo</th><th className="px-6 py-5">Descriptor_de_Activo</th><th className="px-6 py-5">Tipo_Op</th><th className="px-6 py-5">Referencia_Doc</th><th className="px-6 py-5 text-right">Cant</th><th className="px-6 py-5 text-right">Val_Unit</th><th className="px-6 py-5 text-right">Val_Total</th></tr></thead>
                  <tbody className="divide-y divide-[#DEE2E6] text-[12px] font-sans">
                    {[...bitacoraOperaciones].reverse().map(m => { const product = maestroActivos.find(p => p.id === m.activoId); return (<tr key={m.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-5 text-[#999]">{m.fecha}</td><td className="px-6 py-5 text-[#333] font-bold uppercase">{product?.nombre || 'REF_NULA'}</td><td className="px-6 py-5"><span className={`px-2 py-1 border text-[9px] font-bold uppercase tracking-widest ${m.tipo === 'ENTRADA' ? 'border-[#2B579A]/20 bg-[#E7EEF8] text-[#2B579A]' : 'border-orange-200 bg-orange-50 text-[#F97316]'}`}>{m.tipo}</span></td><td className="px-6 py-5 text-[#999]">{m.tipoDocumento} {m.serie}-{m.numero}</td><td className={`px-6 py-5 text-right font-bold ${m.tipo === 'ENTRADA' ? 'text-[#2B579A]' : 'text-[#F97316]'}`}>{m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad}</td><td className="px-6 py-5 text-right text-[#999]">S/ {m.costoUnitario.toFixed(4)}</td><td className="px-6 py-5 text-right font-bold text-[#2B579A]">S/ {m.costoTotal.toLocaleString()}</td></tr>); })}
                    {bitacoraOperaciones.length === 0 && (<tr><td colSpan={7} className="px-6 py-24 text-center text-[#999] uppercase text-[10px] tracking-[0.2em] font-sans">[ NO SE ENCONTRARON DATOS OPERATIVOS ]</td></tr>)}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLowMovementModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-[#DEE2E6] p-10 max-w-4xl w-full shadow-2xl max-h-[80vh] overflow-y-auto rounded-none relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#F97316]"></div><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F97316]"></div><div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F97316]"></div><div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#F97316]"></div>
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-5"><div className="w-14 h-14 border border-orange-100 bg-orange-50 text-[#F97316] flex items-center justify-center"><Filter size={28} /></div><div><h3 className="text-2xl font-sans font-bold tracking-tighter text-[#2B579A] uppercase">Análisis_de_Baja_Rotación</h3><p className="text-[#999] text-[10px] font-sans uppercase tracking-widest font-bold">Activos estancados para el periodo: {format(new Date(), 'MMMM_yyyy', { locale: es }).toUpperCase()}</p></div></div>
                <button onClick={() => setShowLowMovementModal(false)} className="p-3 border border-[#DEE2E6] text-[#999] hover:text-[#2B579A] hover:border-[#2B579A]/50 transition-all"><X size={24} /></button>
              </div>
              <div className="border border-[#DEE2E6] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F8F9FA] text-[10px] uppercase tracking-widest text-[#999] font-bold border-b border-[#DEE2E6]"><tr><th className="px-6 py-5">ID_Código</th><th className="px-6 py-5">Descriptor_de_Activo</th><th className="px-6 py-5 text-center">Índice_de_Rotación</th><th className="px-6 py-5 text-center">Stock_Actual</th><th className="px-6 py-5 text-center">Aviso_del_Sistema</th></tr></thead>
                  <tbody className="divide-y divide-[#DEE2E6] text-[12px] font-sans">
                    {maestroActivos.map(p => { const currentMonth = format(new Date(), 'yyyy-MM'); const monthMovements = bitacoraOperaciones.filter(m => m.activoId === p.id && m.fecha.startsWith(currentMonth)).length; return { ...p, monthMovements }; }).filter(p => p.monthMovements < 2).map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-5 text-[#999]">{p.codigo}</td><td className="px-6 py-5 text-[#333] font-bold uppercase">{p.nombre}</td><td className="px-6 py-5 text-center"><span className="font-bold text-[#F97316]">{p.monthMovements} OPS</span></td><td className="px-6 py-5 text-center font-bold text-[#333]">{obtenerSaldoFisico(p.id)}</td><td className="px-6 py-5 text-center"><span className="text-[9px] font-bold text-[#999] uppercase tracking-widest border border-[#DEE2E6] px-2 py-1">{p.monthMovements === 0 ? 'LIQUIDAR_ACTIVO' : 'OPTIMIZAR_STOCK'}</span></td></tr>
                    ))}
                    {maestroActivos.filter(p => { const currentMonth = format(new Date(), 'yyyy-MM'); return bitacoraOperaciones.filter(m => m.activoId === p.id && m.fecha.startsWith(currentMonth)).length < 2; }).length === 0 && (<tr><td colSpan={5} className="px-6 py-24 text-center text-[#999] uppercase text-[10px] tracking-[0.2em] font-sans">[ TODOS LOS ACTIVOS CON ROTACIÓN ÓPTIMA ]</td></tr>)}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-[#DEE2E6] p-10 max-w-md w-full shadow-2xl rounded-none relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#F97316]"></div><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F97316]"></div><div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F97316]"></div><div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#F97316]"></div>
              <div className="w-16 h-16 border border-orange-100 bg-orange-50 text-[#F97316] flex items-center justify-center mb-8"><AlertTriangle size={32} /></div>
              <h3 className="text-2xl font-display font-bold mb-4 tracking-tighter text-[#1A1A1A] uppercase">{deleteConfirm.title}</h3>
              <p className="text-[#666] text-[11px] font-sans leading-relaxed mb-10 uppercase tracking-tight">{deleteConfirm.message}</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 border border-[#DEE2E6] text-[#666] font-bold text-[10px] uppercase tracking-widest hover:bg-[#F8F9FA] transition-all">ABORTAR_OP</button>
                <button onClick={confirmarEliminacionKhipu} className="flex-1 py-4 bg-[#F97316] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-[#EA580C] transition-all">CONFIRMAR_ELIMINACIÓN</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(showProductModal || showMovementModal) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className={`bg-white border border-[#DEE2E6] w-full ${showMovementModal ? 'max-w-4xl' : 'max-w-lg'} rounded-none shadow-2xl overflow-hidden relative transition-all duration-500`}>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#2B579A]"></div><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2B579A]"></div><div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2B579A]"></div><div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#2B579A]"></div>
              <div className="p-8 border-b border-[#DEE2E6] flex justify-between items-center bg-[#F8F9FA]">
                <div>
                  <h3 className="text-2xl font-display font-bold tracking-tighter text-[#1A1A1A] uppercase">{showProductModal ? 'Registro de Activos' : 'Entrada de Operación Multi-Item'}</h3>
                  <p className="text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] mt-1">{showProductModal ? 'Sistema de Catálogo v1.2' : 'Interfaz de Kardex v1.5 - Multi-Item'}</p>
                </div>
                <button onClick={() => { setShowProductModal(false); setShowMovementModal(false); setStagedItems([]); setIsMovementFromAdjust(false); }} className="p-3 border border-[#DEE2E6] text-[#999] hover:text-[#2B579A] hover:border-[#2B579A]/50 transition-all"><X size={20} /></button>
              </div>

              <div className="p-8">
                {showProductModal ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Código_Activo</label>
                        <div className="flex gap-2">
                          <input type="text" value={nuevoActivo.codigo} onChange={(e) => setNuevoActivo({...nuevoActivo, codigo: e.target.value})} placeholder="P-000" className="flex-1 bg-[#F8F9FA] border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] transition-all" />
                          <button onClick={() => setNuevoActivo({ ...nuevoActivo, codigo: recomendarCodigo() })} className="px-3 bg-white border border-[#DEE2E6] text-[#2B579A] hover:bg-[#E7EEF8] transition-all text-[9px] font-bold uppercase tracking-tighter" title="Recomendar código">Auto</button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Tipo Existencia (Tabla 5)</label>
                        <select value={nuevoActivo.tipoExistencia} onChange={(e) => setNuevoActivo({...nuevoActivo, tipoExistencia: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] transition-all">
                          <option value="01">01 - MERCADERÍA</option><option value="02">02 - PRODUCTO TERMINADO</option><option value="03">03 - MATERIAS PRIMAS Y AUXILIARES - MATERIALES</option><option value="04">04 - ENVASES Y EMBALAJES</option><option value="05">05 - SUMINISTROS DIVERSOS</option><option value="99">99 - OTROS (ESPECIFICAR)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Unidad Medida (Tabla 6)</label>
                        <select value={nuevoActivo.unidadMedidaCodigo} onChange={(e) => { const label = e.target.options[e.target.selectedIndex].text.split(' - ')[1]; setNuevoActivo({...nuevoActivo, unidadMedidaCodigo: e.target.value, unidadMedida: label}); }} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] transition-all">
                          <option value="01">01 - KILOGRAMOS</option><option value="02">02 - LIBRAS</option><option value="03">03 - TONELADAS LARGAS</option><option value="04">04 - TONELADAS MÉTRICAS</option><option value="05">05 - TONELADAS CORTAS</option><option value="06">06 - GRAMOS</option><option value="07">07 - UNIDADES</option><option value="08">08 - LITROS</option><option value="09">09 - GALONES</option><option value="10">10 - BARRILES</option><option value="11">11 - LATAS</option><option value="12">12 - CAJAS</option><option value="13">13 - MILLARES</option><option value="14">14 - METROS CÚBICOS</option><option value="15">15 - METROS</option><option value="99">99 - OTROS (ESPECIFICAR)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Descriptor_de_Activo</label>
                      <input type="text" value={nuevoActivo.nombre} onChange={(e) => setNuevoActivo({...nuevoActivo, nombre: e.target.value})} placeholder="Nombre_Activo_Sistema" className="w-full bg-[#F8F9FA] border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div><label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Mín_Seguridad</label><input type="number" value={isNaN(nuevoActivo.stockMinimo as number) ? '' : nuevoActivo.stockMinimo} onChange={(e) => setNuevoActivo({...nuevoActivo, stockMinimo: e.target.value === '' ? 0 : parseInt(e.target.value)})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] transition-all" /></div>
                      <div><label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Máx_Seguridad</label><input type="number" value={isNaN(nuevoActivo.stockMaximo as number) ? '' : nuevoActivo.stockMaximo} onChange={(e) => setNuevoActivo({...nuevoActivo, stockMaximo: e.target.value === '' ? 0 : parseInt(e.target.value)})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] transition-all" /></div>
                    </div>
                    <div className="pt-4 border-t border-[#DEE2E6]">
                      <h4 className="text-[10px] font-bold text-[#2B579A] uppercase tracking-widest mb-4">Saldos Iniciales (Opcional)</h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div><label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Stock_Inicial</label><input type="number" value={nuevoActivo.stockInicial} onChange={(e) => setNuevoActivo({...nuevoActivo, stockInicial: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] transition-all" /></div>
                        <div><label className="block text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">Costo_Unit_Inicial</label><input type="number" value={nuevoActivo.costoInicial} onChange={(e) => setNuevoActivo({...nuevoActivo, costoInicial: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] transition-all" /></div>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-6 border-t border-[#DEE2E6]">
                      <button onClick={() => setShowProductModal(false)} className="flex-1 py-4 border border-[#DEE2E6] text-[#999] font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-sm">CANCELAR</button>
                      <button onClick={registrarNuevoActivo} disabled={!nuevoActivo.codigo || !nuevoActivo.nombre} className={`flex-1 py-4 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg ${!nuevoActivo.codigo || !nuevoActivo.nombre ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2B579A] hover:bg-[#1E3E6D] hover:scale-[1.02] active:scale-[0.98]'}`}>REGISTRAR_ACTIVO</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-5 space-y-6">
                      <div className="space-y-4 bg-[#F8F9FA] p-5 border border-[#DEE2E6]">
                        <h4 className="text-[10px] font-bold text-[#2B579A] uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> Información del Comprobante</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Documento</label>
                            <select value={nuevaOperacion.tipoDocumento} onChange={(e) => setNuevaOperacion({...nuevaOperacion, tipoDocumento: e.target.value})} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-2 py-2 text-[11px] focus:outline-none focus:border-[#2B579A]">
                              <option value="01">01 - FACTURA</option><option value="03">03 - BOLETA</option><option value="09">09 - GUÍA REM.</option>
                              {nuevaOperacion.tipo === 'SALIDA' && (<option value="50">50 - DOCUMENTO INTERNO</option>)}
                              <option value="00">00 - OTROS</option>
                            </select>
                          </div>
                          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Fecha</label><input type="date" value={nuevaOperacion.fecha} onChange={(e) => setNuevaOperacion({...nuevaOperacion, fecha: e.target.value})} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-2 py-2 text-[11px] focus:outline-none" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Serie (ej. F001)" value={nuevaOperacion.serie} onChange={(e) => setNuevaOperacion({...nuevaOperacion, serie: e.target.value})} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans px-3 py-2 text-[11px] focus:outline-none" />
                          <input type="text" placeholder="Número" value={nuevaOperacion.numero} onChange={(e) => setNuevaOperacion({...nuevaOperacion, numero: e.target.value})} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans px-3 py-2 text-[11px] focus:outline-none" />
                        </div>
                        {nuevaOperacion.tipoDocumento === '00' && nuevaOperacion.serie === 'AJUS' && (
                        <div>
                          <label className="block text-[9px] font-bold text-orange-700 uppercase mb-1">Motivo del Ajuste <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={nuevaOperacion.observaciones || ''}
                            onChange={(e) => setNuevaOperacion({...nuevaOperacion, observaciones: `AJUSTE ${nuevaOperacion.fecha} — ${e.target.value}`})}
                            placeholder="Describa el motivo del ajuste..."
                            className="w-full bg-white border border-orange-300 text-[#1A1A1A] font-sans px-3 py-2 text-[11px] focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      )}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button onClick={() => setNuevaOperacion({...nuevaOperacion, tipo: 'ENTRADA'})} disabled={stagedItems.length > 0} className={`py-2 rounded-none text-[9px] font-bold tracking-widest border transition-all ${nuevaOperacion.tipo === 'ENTRADA' ? 'bg-[#E7EEF8] border-[#2B579A] text-[#2B579A]' : 'bg-white border-[#DEE2E6] text-[#999]'} ${stagedItems.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>ENTRADA</button>
                          <button onClick={() => setNuevaOperacion({...nuevaOperacion, tipo: 'SALIDA'})} disabled={stagedItems.length > 0} className={`py-2 rounded-none text-[9px] font-bold tracking-widest border transition-all ${nuevaOperacion.tipo === 'SALIDA' ? 'bg-orange-50 border-[#F97316] text-[#F97316]' : 'bg-white border-[#DEE2E6] text-[#999]'} ${stagedItems.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>SALIDA</button>
                        </div>
                      </div>

                      <div className={`space-y-4 border border-[#DEE2E6] p-5 relative ${isMovementFromAdjust ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                        {isMovementFromAdjust && (
                          <div className="absolute inset-0 bg-gray-100/60 z-10 flex items-center justify-center">
                            <span className="bg-orange-100 border border-orange-300 text-orange-700 text-[9px] font-bold uppercase tracking-widest px-3 py-2">Bloqueado — Item cargado desde ajuste</span>
                          </div>
                        )}
                        <h4 className="text-[10px] font-bold text-[#2B579A] uppercase tracking-widest flex items-center gap-2"><Package size={14} /> Seleccionar Item</h4>
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" size={14} /><input type="text" placeholder="Buscar activo..." value={busquedaActivoModal} onChange={(e) => setBusquedaActivoModal(e.target.value)} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none pl-9 pr-10 py-2 text-[11px] focus:outline-none focus:border-[#2B579A]" /></div>
                        <select value={activoSeleccionadoId} onChange={(e) => setActivoSeleccionadoId(e.target.value)} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none px-3 py-2 text-[11px] focus:outline-none">
                          <option value="">-- Buscar activo --</option>
                          {maestroActivos.filter(p => p.id === activoSeleccionadoId || (p.nombre || '').toLowerCase().includes(busquedaActivoModal.toLowerCase()) || (p.codigo || '').toLowerCase().includes(busquedaActivoModal.toLowerCase())).map(p => (<option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>))}
                        </select>
                        <div className="border border-[#DEE2E6] bg-[#F8F9FA] p-4 space-y-3">
                          <span className="text-[9px] text-[#2B579A] font-bold uppercase tracking-widest block">Afectabilidad de I.G.V. & Cálculos</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-[9px] font-bold text-[#666] uppercase mb-1">Cantidad</label><input type="text" value={localCantidad} onChange={(e) => handleCantidadChange(e.target.value)} onFocus={() => setFocusedField('cantidad')} onBlur={() => formatOnBlur('cantidad')} placeholder="0" className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans font-mono px-3 py-2 text-[11px] focus:outline-none focus:border-[#2B579A]" /></div>
                            <div><label className="block text-[9px] font-bold text-[#666] uppercase mb-1">¿Afecto a I.G.V.?</label><select value={localGrabado ? "true" : "false"} onChange={(e) => handleGrabadoToggle(e.target.value === 'true')} disabled={nuevaOperacion.tipo === 'SALIDA' && nuevaOperacion.tipoDocumento !== '01' && nuevaOperacion.tipoDocumento !== '03'} className={`w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans px-3 py-2 text-[11px] focus:outline-none focus:border-[#2B579A] ${(nuevaOperacion.tipo === 'SALIDA' && nuevaOperacion.tipoDocumento !== '01' && nuevaOperacion.tipoDocumento !== '03') ? 'opacity-40 cursor-not-allowed bg-gray-50' : ''}`}><option value="true">Sí (Gravado 18%)</option><option value="false">No (Exonerado 0%)</option></select></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-[9px] font-bold text-[#666] uppercase mb-1">Costo Unitario <span className="text-[8px] text-gray-400 font-normal">(Sin IGV)</span></label><input type="text" value={localCostoSinIGV} onChange={(e) => handleCostoSinIGVChange(e.target.value)} onFocus={() => setFocusedField('costoSin')} onBlur={() => formatOnBlur('costoSin')} disabled={nuevaOperacion.tipo === 'SALIDA'} placeholder="0.0000" className={`w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans font-mono px-3 py-2 text-[11px] focus:outline-none focus:border-[#2B579A] ${nuevaOperacion.tipo === 'SALIDA' ? 'opacity-40 cursor-not-allowed bg-gray-50' : ''}`} /></div>
                            <div><label className="block text-[9px] font-bold text-[#F97316] uppercase mb-1">Unitario <span className="text-[8px] font-semibold text-orange-500">{localGrabado ? 'Con IGV' : 'Sin IGV (Exo)'}</span></label><input type="text" value={localCostoConIGV} onChange={(e) => handleCostoConIGVChange(e.target.value)} onFocus={() => setFocusedField('costoCon')} onBlur={() => formatOnBlur('costoCon')} disabled={nuevaOperacion.tipo === 'SALIDA'} placeholder="0.0000" className={`w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans font-mono px-3 py-2 text-[11px] focus:outline-none focus:border-orange-500 ${nuevaOperacion.tipo === 'SALIDA' ? 'opacity-40 cursor-not-allowed bg-gray-50' : ''}`} /></div>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            <div><label className="block text-[9px] font-bold text-[#2B579A] uppercase mb-1">Importe Total <span className="text-[8px] font-semibold text-blue-500">{localGrabado ? 'Con IGV' : 'Sin IGV (Exo)'}</span></label><input type="text" value={localTotalConIGV} onChange={(e) => handleTotalConIGVChange(e.target.value)} onFocus={() => setFocusedField('totalCon')} onBlur={() => formatOnBlur('totalCon')} disabled={nuevaOperacion.tipo === 'SALIDA'} placeholder="0.00" className={`w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans font-mono px-3 py-2 text-[11px] focus:outline-none focus:border-blue-500 ${nuevaOperacion.tipo === 'SALIDA' ? 'opacity-40 cursor-not-allowed bg-gray-50' : ''}`} /></div>
                          </div>
                          <div className="pt-2 border-t border-dashed border-[#DEE2E6] text-[10px] space-y-1 text-gray-500 font-sans">
                            <div className="flex justify-between"><span>Monto Neto (Base Imponible):</span><span className="font-mono text-gray-700">S/ {((parseFloat(localCantidad) || 0) * (parseFloat(localCostoSinIGV) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between"><span>Monto I.G.V. ({localGrabado ? '18%' : 'Exonerado 0%'}):</span><span className={`font-mono ${localGrabado ? 'text-[#F97316]' : 'text-gray-400'}`}>S/ {localGrabado ? (((parseFloat(localCantidad) || 0) * (parseFloat(localCostoSinIGV) || 0) * 0.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '0.00'}</span></div>
                          </div>
                        </div>
                        <button onClick={agregarPartidaAStaging} className="w-full py-3 bg-[#E7EEF8] border border-[#2B579A] text-[#2B579A] font-bold text-[10px] uppercase tracking-widest hover:bg-[#D1E1F5] transition-all flex items-center justify-center gap-2"><Plus size={14} /> AGREGAR_AL_DOC</button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col h-full border border-[#DEE2E6] overflow-hidden">
                      <div className="bg-[#1A1A1A] text-white px-4 py-3 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Cuerpo del Comprobante</span>
                        <div className="flex items-center gap-3">
                          {stagedItems.length > 0 && (<button onClick={descargarPDFComprobante} className="flex items-center gap-2 text-[9px] font-bold text-[#F97316] hover:text-white transition-colors uppercase tracking-widest px-2 py-1 border border-[#F97316]/50 hover:border-white" title="Descargar PDF"><Download size={12} /> PDF</button>)}
                          <span className="text-[9px] font-mono text-[#F97316]">{stagedItems.length} ITEMS</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto bg-gray-50 min-h-[300px]">
                        {stagedItems.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-[#999] space-y-3 p-10 opacity-40"><ClipboardList size={40} strokeWidth={1} /><p className="text-[10px] uppercase font-bold tracking-widest text-center">No hay partidas agregadas al comprobante</p></div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F8F9FA] border-b border-[#DEE2E6]"><tr className="text-[8px] font-bold text-[#666] uppercase tracking-tighter"><th className="px-2 py-2">Cód</th><th className="px-2 py-2">Descripción</th><th className="px-2 py-2 text-right">Cant</th><th className="px-2 py-2 text-right">Costo Unit.</th><th className="px-2 py-2 text-center">Afectación</th><th className="px-2 py-2 text-right text-orange-600">Unit c/IGV</th><th className="px-2 py-2 text-right">Subtotal</th><th className="px-2 py-2 text-right text-orange-600 font-semibold">IGV (18%)</th><th className="px-2 py-2 text-right">Total</th><th className="px-2 py-2 w-8"></th></tr></thead>
                            <tbody className="bg-white divide-y divide-[#DEE2E6]">
                              {stagedItems.map((item, idx) => {
                                const isGrabado = item.igvGrabado !== false;
                                const subtotalItem = item.costoTotal;
                                const unitWithIGV = isGrabado ? item.costoUnitario * 1.18 : item.costoUnitario;
                                const igvItem = isGrabado ? Math.round((subtotalItem * 0.18 + Number.EPSILON) * 100) / 100 : 0;
                                const totalItem = Math.round((subtotalItem + igvItem + Number.EPSILON) * 100) / 100;
                                return (<tr key={idx} className="text-[10px] font-sans hover:bg-blue-50/30 transition-colors group"><td className="px-2 py-2 font-bold text-[#2B579A]">{item.activoCodigo}</td><td className="px-2 py-2 text-[#333] max-w-[100px] truncate" title={item.activoNombre}>{item.activoNombre}</td><td className="px-2 py-2 text-right font-mono">{item.cantidad}</td><td className="px-2 py-2 text-right font-mono">S/ {item.costoUnitario.toFixed(4)}</td><td className="px-2 py-2 text-center text-[9px] font-semibold">{isGrabado ? <span className="text-orange-600">GRAV. 18%</span> : <span className="text-gray-400">EXO. 0%</span>}</td><td className="px-2 py-2 text-right font-mono text-orange-600">S/ {unitWithIGV.toFixed(4)}</td><td className="px-2 py-2 text-right font-mono">S/ {subtotalItem.toFixed(2)}</td><td className="px-2 py-2 text-right font-mono text-orange-600">S/ {igvItem.toFixed(2)}</td><td className="px-2 py-2 text-right font-mono font-bold text-[#2B579A]">S/ {totalItem.toFixed(2)}</td><td className="px-2 py-2 text-right"><button onClick={() => removerPartidaDeStaging(idx)} className="text-[#999] hover:text-red-500 transition-colors p-1"><Trash2 size={12} /></button></td></tr>);
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <div className="bg-[#F8F9FA] border-t border-[#DEE2E6] p-5 space-y-2 text-[11px]">
                        <div className="flex justify-between items-center text-gray-600"><span className="font-bold uppercase tracking-wider text-[9px]">Op. Gravada:</span><span className="font-mono font-bold">S/ {stagedItems.filter(i => i.igvGrabado !== false).reduce((sum, i) => sum + i.costoTotal, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center text-gray-600"><span className="font-bold uppercase tracking-wider text-[9px]">Op. No Gravada (Exo):</span><span className="font-mono font-bold text-gray-400">S/ {stagedItems.filter(i => i.igvGrabado === false).reduce((sum, i) => sum + i.costoTotal, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center text-gray-600"><span className="font-bold uppercase tracking-wider text-[9px]">I.G.V. Total (18%):</span><span className="font-mono font-bold text-orange-600">S/ {stagedItems.filter(i => i.igvGrabado !== false).reduce((sum, i) => sum + (Math.round((i.costoTotal * 0.18 + Number.EPSILON) * 100) / 100), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-[#DEE2E6] mb-4"><span className="font-bold uppercase tracking-wider text-[10px] text-[#2B579A]">Importe Total Completo:</span><span className="text-2xl font-display font-bold text-[#2B579A] tracking-tighter">S/ {stagedItems.reduce((sum, i) => { const isGrabado = i.igvGrabado !== false; const sub = i.costoTotal; const igvVal = isGrabado ? Math.round((sub * 0.18 + Number.EPSILON) * 100) / 100 : 0; return sum + sub + igvVal; }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div className="flex gap-4">
                          <button onClick={() => { setShowMovementModal(false); setStagedItems([]); setIsMovementFromAdjust(false); }} className="flex-1 py-4 border border-[#DEE2E6] text-[#999] font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-sm">CANCELAR</button>
                          <button onClick={asentarOperacionKardex} disabled={stagedItems.length === 0 || !nuevaOperacion.numero} className={`flex-1 py-4 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg ${stagedItems.length === 0 || !nuevaOperacion.numero ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2B579A] hover:bg-[#1E3E6D] hover:scale-[1.02] active:scale-[0.98]'}`}>PROCESAR_COMPROBANTE</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAdjustmentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white border border-[#DEE2E6] w-full max-w-5xl rounded-none shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-orange-500"></div><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-orange-500"></div><div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-orange-500"></div><div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-orange-500"></div>
              <div className="p-8 border-b border-[#DEE2E6] flex justify-between items-center bg-[#F8F9FA]">
                <div><h3 className="text-2xl font-display font-bold tracking-tighter text-[#1A1A1A] uppercase">Toma Física & Ajuste de Inventario</h3><p className="text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] mt-1">Auditoría de Sobrantes y Faltantes v1.1</p></div>
                <button onClick={() => setShowAdjustmentModal(false)} className="p-3 border border-[#DEE2E6] text-[#999] hover:text-[#2B579A] hover:border-[#2B579A]/50 transition-all font-bold"><X size={20} /></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 space-y-6">
                <div className="bg-orange-50/50 border border-orange-200/60 p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div><label className="block text-[9px] font-bold text-orange-700 uppercase mb-1">Serie del Ajuste</label><input type="text" value={adjustmentSerie} onChange={(e) => setAdjustmentSerie(e.target.value.toUpperCase())} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-mono px-3 py-2 text-xs focus:outline-none" /></div>
                  <div><label className="block text-[9px] font-bold text-orange-700 uppercase mb-1">N° Comprobante</label><input type="text" value={adjustmentNumero} onChange={(e) => setAdjustmentNumero(e.target.value)} placeholder="Autogenerado" className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-mono px-3 py-2 text-xs focus:outline-none" /></div>
                  <div><label className="block text-[9px] font-bold text-orange-700 uppercase mb-1">Fecha de Operación</label><input type="date" value={adjustmentFecha} onChange={(e) => setAdjustmentFecha(e.target.value)} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] px-3 py-2 text-xs focus:outline-none" /></div>
                  <div><label className="block text-[9px] font-bold text-orange-700 uppercase mb-1">Motivo del Ajuste <span className="text-red-500">*</span></label><input type="text" value={adjustmentObs} onChange={(e) => setAdjustmentObs(e.target.value)} placeholder="Ej: Conteo físico mensual, merma detectada..." className="w-full bg-white border border-orange-300 text-[#1A1A1A] px-3 py-2 text-xs focus:outline-none focus:border-orange-500" /></div>
                </div>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" size={14} /><input type="text" placeholder="Filtrar por código o nombre para auditar..." value={filterAdjustmentSearch} onChange={(e) => setFilterAdjustmentSearch(e.target.value)} className="w-full bg-white border border-[#DEE2E6] text-[#1A1A1A] font-sans rounded-none pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#2B579A]" /></div>
                <div className="border border-[#DEE2E6] overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8F9FA] border-b border-[#DEE2E6]"><tr className="text-[9px] font-bold text-[#666] uppercase tracking-wider"><th className="px-4 py-3">Código</th><th className="px-4 py-3">Descripción de Existencias</th><th className="px-4 py-3 text-center">Stock Sistema</th><th className="px-4 py-3 text-center w-40">Conteo Físico Real</th><th className="px-4 py-3 text-center">Diferencia</th><th className="px-4 py-3 text-center">Tipo de Ajuste</th><th className="px-4 py-3 text-right">Ajuste Manual</th></tr></thead>
                    <tbody className="bg-white divide-y divide-[#DEE2E6] text-[11px] font-sans">
                      {maestroActivos.filter(p => !filterAdjustmentSearch || p.nombre.toLowerCase().includes(filterAdjustmentSearch.toLowerCase()) || p.codigo.toLowerCase().includes(filterAdjustmentSearch.toLowerCase())).map(p => {
                        const stockSistema = obtenerSaldoFisico(p.id);
                        const conteo = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : stockSistema;
                        const diferencia = conteo - stockSistema;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-[#2B579A]">{p.codigo}</td>
                            <td className="px-4 py-3 font-medium text-[#333]">{p.nombre} ({p.unidadMedida})</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-[#2B579A] bg-blue-50/20">{stockSistema}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setPhysicalCounts(prev => ({...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1)}))} className="px-2 py-1 border border-[#DEE2E6] bg-gray-100 hover:bg-gray-200 text-xs font-bold font-mono">-</button>
                                <input type="number" value={conteo} onChange={(e) => { const val = parseFloat(e.target.value); setPhysicalCounts(prev => ({...prev, [p.id]: isNaN(val) ? 0 : val})); }} className="w-16 text-center border border-[#DEE2E6] py-1 font-mono font-bold focus:outline-none" />
                                <button onClick={() => setPhysicalCounts(prev => ({...prev, [p.id]: (prev[p.id] || 0) + 1}))} className="px-2 py-1 border border-[#DEE2E6] bg-gray-100 hover:bg-gray-200 text-xs font-bold font-mono">+</button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold"><span className={diferencia > 0 ? 'text-green-600' : diferencia < 0 ? 'text-orange-600' : 'text-gray-400'}>{diferencia > 0 ? `+${diferencia}` : diferencia}</span></td>
                            <td className="px-4 py-3 text-center">{diferencia > 0 ? (<span className="inline-block px-3 py-1 bg-green-50 text-green-700 border border-green-200 font-bold uppercase text-[9px] tracking-wide">SOBRANTE (Ingreso)</span>) : diferencia < 0 ? (<span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 font-bold uppercase text-[9px] tracking-wide">FALTANTE (Salida)</span>) : (<span className="inline-block px-3 py-1 bg-gray-50 text-gray-400 border border-gray-100 uppercase text-[9px] tracking-wide">Ok / Conforme</span>)}</td>
                            <td className="px-4 py-3 text-right">{diferencia !== 0 && (<button onClick={() => agregarAjusteAManualStaging(p.id, diferencia)} className="text-[9px] font-bold text-[#2B579A] border border-[#2B579A]/30 px-3 py-1 hover:bg-[#2B579A] hover:text-white transition-all uppercase tracking-tight">Ajustar Manual</button>)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-8 border-t border-[#DEE2E6] bg-[#F8F9FA] flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-4 text-xs">
                  <div className="bg-green-50 text-green-800 px-4 py-2 border border-green-200 font-bold">SOBRANTES: {maestroActivos.filter(p => { const stockSistema = obtenerSaldoFisico(p.id); const conteo = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : stockSistema; return conteo > stockSistema; }).length}</div>
                  <div className="bg-orange-50 text-orange-800 px-4 py-2 border border-orange-200 font-bold">FALTANTES: {maestroActivos.filter(p => { const stockSistema = obtenerSaldoFisico(p.id); const conteo = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : stockSistema; return conteo < stockSistema; }).length}</div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowAdjustmentModal(false)} className="px-6 py-4 border border-[#DEE2E6] bg-white text-[#999] hover:bg-gray-50 text-[10px] uppercase font-bold tracking-widest transition-all">CERRAR</button>
                  <button onClick={verificarAdminYAjustar} className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white text-[10px] uppercase font-bold tracking-widest transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]">PROCESAR AJUSTES AUTOMÁTICOS</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        {showAdminAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[80] p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-[#DEE2E6] p-10 max-w-sm w-full shadow-2xl rounded-none relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#F97316]"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F97316]"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F97316]"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#F97316]"></div>
              <div className="w-14 h-14 border border-orange-100 bg-orange-50 text-[#F97316] flex items-center justify-center mb-6 mx-auto">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-sans font-bold tracking-tighter text-[#1A1A1A] uppercase text-center mb-2">Autorización Requerida</h3>
              <p className="text-[10px] text-[#999] uppercase tracking-widest text-center mb-8 font-bold">Se requieren credenciales de administrador para procesar ajustes de inventario</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Usuario Admin</label>
                  <input type="text" value={adminAuthUser} onChange={(e) => setAdminAuthUser(e.target.value)} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black" placeholder="admin" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Contraseña</label>
                  <div className="relative">
                    <input type={showAdminAuthPass ? 'text' : 'password'} value={adminAuthPass} onChange={(e) => setAdminAuthPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmarAdminAuth()} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#2B579A] text-black" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowAdminAuthPass(!showAdminAuthPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333]">
                      {showAdminAuthPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {adminAuthError && (
                  <div className="bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-[10px] font-bold uppercase">{adminAuthError}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => { setShowAdminAuthModal(false); setPendingAjuste(false); }} className="flex-1 py-3 border border-[#DEE2E6] text-[#999] font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">Cancelar</button>
                <button onClick={confirmarAdminAuth} disabled={adminAuthLoading || !adminAuthUser || !adminAuthPass} className={`flex-1 py-3 text-white font-bold text-[10px] uppercase tracking-widest transition-all ${adminAuthLoading || !adminAuthUser || !adminAuthPass ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F97316] hover:bg-[#EA580C]'}`}>
                  {adminAuthLoading ? 'Verificando...' : 'Autorizar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      {showEditMovementModal && editingMovement && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[80] p-6">
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-[#DEE2E6] p-10 max-w-lg w-full shadow-2xl rounded-none relative">
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#2B579A]"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2B579A]"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2B579A]"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#2B579A]"></div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-sans font-bold tracking-tighter text-[#1A1A1A] uppercase">Editar Movimiento</h3>
          <p className="text-[10px] text-[#999] uppercase tracking-widest font-bold mt-1">{editingMovement.serie}-{editingMovement.numero} | {editingMovement.fecha}</p>
        </div>
        <button onClick={() => setShowEditMovementModal(false)} className="p-2 border border-[#DEE2E6] text-[#999] hover:text-[#2B579A]"><X size={18} /></button>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Fecha</label><input type="date" value={editingMovement.fecha} onChange={(e) => setEditingMovement({...editingMovement, fecha: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A] text-black" /></div>
          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Tipo Doc</label><input type="text" value={editingMovement.tipoDocumento} onChange={(e) => setEditingMovement({...editingMovement, tipoDocumento: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A] text-black" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Serie</label><input type="text" value={editingMovement.serie} onChange={(e) => setEditingMovement({...editingMovement, serie: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A] text-black" /></div>
          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Número</label><input type="text" value={editingMovement.numero} onChange={(e) => setEditingMovement({...editingMovement, numero: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A] text-black" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Cantidad</label><input type="number" value={editingMovement.cantidad} onChange={(e) => setEditingMovement({...editingMovement, cantidad: parseFloat(e.target.value) || 0})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A] text-black" /></div>
          <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Costo Unitario</label><input type="number" step="0.0001" value={editingMovement.costoUnitario} onChange={(e) => setEditingMovement({...editingMovement, costoUnitario: parseFloat(e.target.value) || 0, costoTotal: (parseFloat(e.target.value) || 0) * editingMovement.cantidad})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A] text-black" /></div>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-orange-700 uppercase mb-1">Motivo de Edición <span className="text-red-500">*</span></label>
          <input type="text" value={editMotivo} onChange={(e) => setEditMotivo(e.target.value)} placeholder="Explique por qué se edita este movimiento..." className="w-full bg-white border border-orange-300 px-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-black" />
        </div>
        <div className="pt-4 border-t border-[#DEE2E6]">
          <p className="text-[9px] font-bold text-[#999] uppercase tracking-widest mb-3">Credenciales de Administrador</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Usuario</label><input type="text" value={editAdminUser} onChange={(e) => setEditAdminUser(e.target.value)} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-2 text-xs focus:outline-none focus:border-[#2B579A] text-black" placeholder="admin" /></div>
            <div><label className="block text-[9px] font-bold text-[#999] uppercase mb-1">Contraseña</label>
              <div className="relative">
                <input type={showEditAdminPass ? 'text' : 'password'} value={editAdminPass} onChange={(e) => setEditAdminPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && guardarEdicionMovimiento()} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-2 pr-8 text-xs focus:outline-none focus:border-[#2B579A] text-black" placeholder="••••••••" />
                <button type="button" onClick={() => setShowEditAdminPass(!showEditAdminPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#999]">{showEditAdminPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
          </div>
        </div>
        {editAdminError && (
          <div className="bg-red-50 border border-red-200 p-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-[10px] font-bold uppercase">{editAdminError}</p>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-6">
        <button onClick={() => { setDeleteConfirm({ type: 'movement', id: editingMovement.id, title: 'Eliminar Movimiento', message: '¿Está seguro de eliminar este movimiento? Esta acción no se puede deshacer.' }); setShowEditMovementModal(false); }} className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"><Trash2 size={14} /> Eliminar</button>
        <button onClick={() => setShowEditMovementModal(false)} className="flex-1 py-3 border border-[#DEE2E6] text-[#999] font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">Cancelar</button>
        <button onClick={guardarEdicionMovimiento} disabled={editAdminLoading || !editAdminUser || !editAdminPass || !editMotivo.trim()} className={`flex-1 py-3 text-white font-bold text-[10px] uppercase tracking-widest transition-all ${editAdminLoading || !editAdminUser || !editAdminPass || !editMotivo.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2B579A] hover:bg-[#1E3E6D]'}`}>
          {editAdminLoading ? 'Verificando...' : 'Guardar Cambios'}
        </button>
      </div>
    </motion.div>
  </motion.div>
)}
      {/* Loading overlay */}
      {loadingData && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-4">
            <Database size={32} className="text-[#2B579A] animate-bounce" />
            <p className="text-[10px] font-sans font-bold text-[#2B579A] uppercase tracking-widest animate-pulse">Cargando datos...</p>
          </div>
        </div>
      )}
    </div>
  );
}