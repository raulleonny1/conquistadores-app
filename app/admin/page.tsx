"use client";
import React, { useState } from 'react';
import { 
  Users, 
  LayoutGrid, 
  LogOut, 
  ShieldCheck, 
  ChevronRight,
  ClipboardList,
  Map,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const AdminPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const menuItems = [
    {
      id: 'miembros',
      title: 'Miembros del Club',
      description: 'Inscribir y gestionar datos de los conquistadores.',
      icon: <Users className="w-8 h-8" />,
      color: 'border-blue-500 text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:shadow-blue-200'
    },
    {
      id: 'unidades',
      title: 'Unidades',
      description: 'Gestión de unidades, nombres y liderazgo.',
      icon: <LayoutGrid className="w-8 h-8" />,
      color: 'border-purple-500 text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:shadow-purple-200'
    },
    {
      id: 'consejero',
      title: 'Consejero',
      description: 'Registrar consejero y asignar clases.',
      icon: <ClipboardList className="w-8 h-8 text-green-600" />,
      color: 'border-green-500 text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:shadow-green-200'
    },
    {
      id: 'especialidades',
      title: 'Especialidades',
      description: 'Seguimiento de requisitos y parches aprobados.',
      icon: <ShieldCheck className="w-8 h-8" />,
      color: 'border-amber-500 text-amber-600',
      bgColor: 'bg-amber-50',
      hoverColor: 'hover:shadow-amber-200'
    },
    {
      id: 'calificaciones',
      title: 'Calificaciones',
      description: 'Registro y consulta de calificaciones de los miembros.',
      icon: <Settings className="w-8 h-8 text-pink-600" />,
      color: 'border-pink-500 text-pink-600',
      bgColor: 'bg-pink-50',
      hoverColor: 'hover:shadow-pink-200'
    },
    {
      id: 'actividades',
      title: 'Plan de Actividades',
      description: 'Calendario de campamentos y reuniones.',
      icon: <Map className="w-8 h-8" />, 
      color: 'border-emerald-500 text-emerald-600',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:shadow-emerald-200'
    }
  ];

          const handleLogout = () => {
            router.push('/');
          };

          // Renderiza el contenido según el tab activo
          const renderTabContent = () => {
            if (activeTab === 'unidades') {
              return (
                <div className="text-center py-8 text-purple-700 font-semibold">Gestión de unidades (próximamente)</div>
              );
            }
            if (activeTab === 'especialidades') {
              return (
                <div className="text-center py-8 text-amber-600 font-semibold">Gestión de especialidades (próximamente)</div>
              );
            }
            if (activeTab === 'actividades') {
              return (
                <div className="text-center py-8 text-emerald-600 font-semibold">Plan de actividades (próximamente)</div>
              );
            }
            return null;
          };

          return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
              {/* Fondo Decorativo con gradientes suaves */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-200/40 blur-3xl"></div>
                <div className="absolute top-[60%] -right-[5%] w-[35%] h-[35%] rounded-full bg-amber-100/50 blur-3xl"></div>
              </div>

              {/* Navbar Superior */}
              <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-700 p-2 rounded-lg shadow-lg">
                    {/* Reemplazo visual del logo del club */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h1 className="font-bold text-xl tracking-tight text-slate-800">Conquis<span className="text-purple-700">App</span></h1>
                </div>
                <button onClick={handleLogout} className="group flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-full transition-all duration-300 font-medium text-sm">
                  <span>Cerrar Sesión</span>
                  <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </header>

              {/* Hero Section */}
              <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
                    Panel Administrativo
                  </h2>
                  <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    Bienvenido al centro de gestión del <span className="text-purple-700 font-semibold underline decoration-amber-400 decoration-2 underline-offset-4">Club de Conquistadores</span>. 
                    Acceso exclusivo para directiva y secretaría.
                  </p>
                </div>

                {/* Rejilla de Menú */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'miembros') {
                          router.push('/admin/miembros');
                        } else if (item.id === 'unidades') {
                          router.push('/admin/unidades');
                        } else if (item.id === 'consejero') {
                          router.push('/admin/consejero');
                        } else if (item.id === 'especialidades') {
                          router.push('/admin/especialidades');
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`group relative bg-white p-8 rounded-3xl border-2 ${item.color.split(' ')[0]} transition-all duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 flex flex-col items-center text-center`}
                    >
                      {/* Círculo de fondo que crece en hover */}
                      <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full ${item.bgColor} opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150`}></div>
                      <div className={`relative z-10 p-4 rounded-2xl ${item.bgColor} ${item.color.split(' ')[1]} mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        {item.icon}
                      </div>
                      <h3 className="relative z-10 text-xl font-bold text-slate-800 mb-3">
                        {item.title}
                      </h3>
                      <p className="relative z-10 text-sm text-slate-500 leading-relaxed mb-6">
                        {item.description}
                      </p>
                      <div className={`relative z-10 flex items-center gap-1 font-bold text-xs uppercase tracking-widest ${item.color.split(' ')[1]}`}>
                        Gestionar <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contenido del tab activo */}
                {activeTab && activeTab !== 'miembros' && (
                  <div className="mt-12">
                    {renderTabContent()}
                  </div>
                )}

                {/* Accesos Rápidos Inferiores */}
                <div className="mt-20 pt-10 border-t border-slate-200">
                  <h4 className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] text-center mb-8">Accesos Directos</h4>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm">
                      <ClipboardList className="w-4 h-4 text-purple-500" />
                      <span>Reporte Mensual</span>
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Configuración</span>
                    </button>
                  </div>
                </div>
              </main>

              {/* Footer / Nota */}
              <footer className="mt-auto py-8 text-center text-slate-400 text-xs">
                © 2026 Club de Conquistadores • Sirviendo con Honor
              </footer>
            </div>
          );
        };

        export default AdminPage;

