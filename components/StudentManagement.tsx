'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Upload,
  Shield,
  CheckCircle2,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { StudentUser } from '@/lib/types';

export default function StudentManagement() {
  const [currentUser] = useState<StudentUser | null>(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('khipu_session') || sessionStorage.getItem('khipu_session');
      return session ? JSON.parse(session) : null;
    }
    return null;
  });

  const [users, setUsers] = useState<StudentUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StudentUser | null>(null);
  const [newUser, setNewUser] = useState<{
    username: string;
    password: string;
    fullName: string;
    role: 'STUDENT' | 'ADMIN';
  }>({ username: '', password: '', fullName: '', role: 'STUDENT' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setMsg({ text: 'Error al cargar usuarios.', type: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === 'STUDENT') {
      alert('Error: El rol de estudiante no tiene permisos para registrar usuarios.');
      return;
    }

    const user: StudentUser = {
      id: crypto.randomUUID(),
      username: newUser.username,
      password: newUser.password,
      fullName: newUser.fullName,
      role: newUser.role,
      createdAt: Date.now()
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || 'Error al crear usuario.', type: 'error' });
        setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        return;
      }

      await fetchUsers();
      setNewUser({ username: '', password: '', fullName: '', role: 'STUDENT' });
      setShowAddModal(false);
      setMsg({ text: 'Operador registrado exitosamente.', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    } catch {
      setMsg({ text: 'Error de conexión con el servidor.', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  const deleteUser = async (id: string) => {
    if (currentUser?.role === 'STUDENT') {
      alert('Error: El rol de estudiante no tiene permisos para eliminar usuarios.');
      return;
    }
    const user = users.find(u => u.id === id);
    if (!user) return;
    if (user.username === 'admin') {
      alert('No se puede eliminar la cuenta de administrador principal.');
      return;
    }
    if (user.id === currentUser?.id) {
      alert('No puede eliminarse a sí mismo.');
      return;
    }

    if (confirm(`¿Está seguro de eliminar al usuario "${user.username}"?`)) {
      try {
        await fetch('/api/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        await fetchUsers();
      } catch {
        setMsg({ text: 'Error al eliminar usuario.', type: 'error' });
        setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      }
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (currentUser?.role === 'STUDENT') {
      alert('Error: El rol de estudiante no tiene permisos para modificar usuarios.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || 'Error al actualizar.', type: 'error' });
        setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        return;
      }

      await fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
      setMsg({ text: 'Operador actualizado exitosamente.', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    } catch {
      setMsg({ text: 'Error de conexión con el servidor.', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  const simulateMassiveUpload = async () => {
    if (currentUser?.role === 'STUDENT') {
      alert('Error: El rol de estudiante no tiene permisos para realizar carga masiva.');
      return;
    }
    const jsonInput = prompt('Pegue aquí la lista en formato JSON:\nEjemplo: [{"username":"user01", "password":"123", "fullName":"Juan Perez"}]');
    if (!jsonInput) return;

    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: crypto.randomUUID(),
              username: item.username || `user_${Math.random().toString(36).substring(2, 7)}`,
              password: item.password || 'khipu123',
              fullName: item.fullName || 'Nuevo Operador',
              role: 'STUDENT',
              createdAt: Date.now()
            }),
          });
        }
        await fetchUsers();
        alert(`${parsed.length} operadores cargados exitosamente.`);
      }
    } catch {
      alert('Error en el formato del JSON.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Tools */}
      <div className="bg-white p-8 border border-[#DEE2E6] shadow-sm flex flex-wrap justify-between items-center gap-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" size={16} />
          <input
            type="text"
            placeholder="Buscar por usuario o nombre completo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#DEE2E6] rounded-none text-[11px] font-sans text-[#333] focus:outline-none focus:border-[#2B579A] transition-all"
          />
        </div>
        {currentUser?.role !== 'STUDENT' && (
          <div className="flex gap-3">
            <button
              onClick={simulateMassiveUpload}
              className="flex items-center gap-2 px-6 py-3 border border-[#DEE2E6] bg-white text-[#333] text-[9px] font-sans font-bold hover:bg-[#2B579A] hover:text-white transition-all uppercase tracking-widest"
            >
              <Upload size={14} />
              Carga_Masiva_JSON
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#2B579A] text-white text-[9px] font-sans font-bold hover:bg-[#1E3E6D] transition-all uppercase tracking-widest"
            >
              <UserPlus size={14} />
              Registrar_Usuario
            </button>
          </div>
        )}
      </div>

      {msg.text && (
        <div className={`p-4 border ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} flex items-center gap-3 animate-pulse`}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{msg.text}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-[#DEE2E6] shadow-sm overflow-hidden">
        {loadingUsers ? (
          <div className="p-12 text-center text-[#999] text-[11px] uppercase tracking-widest">Cargando usuarios...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8F9FA] text-[9px] uppercase tracking-[0.2em] text-[#999] font-sans font-bold border-b border-[#DEE2E6]">
                <tr>
                  <th className="px-8 py-5">Identificador</th>
                  <th className="px-8 py-5">Nombre Completo</th>
                  <th className="px-8 py-5">Rol_Sistema</th>
                  <th className="px-8 py-5">Clave_Acceso</th>
                  <th className="px-8 py-5">F_Registro</th>
                  <th className="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEE2E6] text-[11px] font-sans">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-none border ${u.role === 'ADMIN' ? 'bg-[#2B579A] text-white border-[#2B579A]' : 'bg-white text-[#999] border-[#DEE2E6]'}`}>
                          {u.role === 'ADMIN' ? <Shield size={14} /> : <Users size={14} />}
                        </div>
                        <span className="font-bold text-[#333]">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 uppercase text-[#666] tracking-tight">{u.fullName}</td>
                    <td className="px-8 py-5">
                      <span className={`text-[8px] font-black px-2 py-0.5 border ${u.role === 'ADMIN' ? 'bg-[#E7EEF8] text-[#2B579A] border-[#2B579A]/20' : 'bg-gray-50 text-[#999] border-gray-200'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-mono text-[#999]">
                      {u.role === 'ADMIN' ? '••••••••' : u.password}
                    </td>
                    <td className="px-8 py-5 text-[#999]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {currentUser?.role !== 'STUDENT' && (
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                            className="text-[#999] hover:text-[#2B579A] p-2 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          {u.username !== 'admin' && u.id !== currentUser?.id && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="text-[#999] hover:text-[#F97316] p-2 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-6">
          <div className="bg-white border border-[#DEE2E6] p-10 max-w-md w-full shadow-2xl rounded-none relative">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-sans font-bold text-[#2B579A] uppercase tracking-tighter">Registrar_Nuevo_Usuario</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#999] hover:text-[#333]">
                <Trash2 size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div>
                <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Username</label>
                <input type="text" required value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Contraseña</label>
                <input type="text" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Nombre Completo</label>
                <input type="text" required value={newUser.fullName} onChange={(e) => setNewUser({...newUser, fullName: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Rol</label>
                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as 'STUDENT' | 'ADMIN'})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black font-sans">
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#2B579A] text-white py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-[#1E3E6D] transition-all">
                Confirmar_Alta_Usuario
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-6">
          <div className="bg-white border border-[#DEE2E6] p-10 max-w-md w-full shadow-2xl rounded-none relative">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-sans font-bold text-[#2B579A] uppercase tracking-tighter">Modificar_Usuario</h3>
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="text-[#999] hover:text-[#333]">
                <Trash2 size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-6">
              <div>
                <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Username</label>
                <input type="text" required disabled={editingUser.username === 'admin'} value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className={`w-full border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black ${editingUser.username === 'admin' ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-[#F8F9FA]'}`} />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Contraseña</label>
                <input type="text" required value={editingUser.password} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Nombre Completo</label>
                <input type="text" required value={editingUser.fullName} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full bg-[#F8F9FA] border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Rol</label>
                <select disabled={editingUser.username === 'admin'} value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'STUDENT' | 'ADMIN'})} className={`w-full border border-[#DEE2E6] px-4 py-3 text-sm focus:outline-none focus:border-[#2B579A] text-black font-sans ${editingUser.username === 'admin' ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-[#F8F9FA]'}`}>
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#2B579A] text-white py-4 font-bold uppercase tracking-widest text-[10px] hover:bg-[#1E3E6D] transition-all">
                Guardar_Cambios_Usuario
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}