"use client";
import React, { useState, useEffect } from "react";
import { useEspecialidades } from "@/src/hooks/firebase/useEspecialidades";
import { Trophy, Calendar, Zap, LogOut, X, BookOpen, TrendingUp } from "lucide-react";
import { useEventos } from "@/src/hooks/firebase/useEventos";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../src/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function DashboardSubdirector() {
  const { especialidades } = useEspecialidades();
  const { eventos } = useEventos();
  const searchParams = useSearchParams();
  const pinParam = searchParams.get("pin") || "";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"especialidades" | "progreso" | "eventos" | null>(null);
  const [subdirector, setSubdirector] = useState<any | null>(null);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "directivaClub"), snap => {
      const found = snap.docs.find(doc => doc.data().cargo === "Subdirector/a" && doc.data().pin === pinParam);
      if (found) {
        setSubdirector(found.data());
      } else {
        setSubdirector(null);
      }
    });
    return () => unsub();
  }, [pinParam]);
  const handleLogout = () => {
    router.push("/");
  };
  const data = {
    especialidades: {
      total: especialidades.length,
      icon: <BookOpen size={32} />,
      color: "from-indigo-400 to-fuchsia-600",
      shadow: "shadow-indigo-200",
      list: especialidades.map(e => ({ nombre: e.nombre || e.titulo || "Sin nombre", categoria: e.categoria || "", id: e.id || "" }))
    },
    progreso: {
      total: especialidades.length > 0 ? Math.round((especialidades.length / 20) * 100) : 0,
      icon: <TrendingUp size={32} />,
      color: "from-fuchsia-400 to-indigo-600",
      shadow: "shadow-fuchsia-200",
      list: [{ porcentaje: especialidades.length > 0 ? Math.round((especialidades.length / 20) * 100) : 0 }]
    },
    eventos: {
      total: eventos.length,
      icon: <Calendar size={32} />,
      color: "from-blue-400 to-fuchsia-600",
      shadow: "shadow-blue-200",
      list: eventos.map(e => ({ nombre: e.nombre || e.titulo || "Sin nombre", fecha: e.fecha || "", lugar: e.lugar || "" }))
    }
  };
  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-fuchsia-500 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>
      <div className="relative z-10 p-4 md:p-10 max-w-7xl mx-auto">
        {/* Navbar */}
        <nav className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-linear-to-tr from-fuchsia-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Zap size={32} fill="white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic italic-shadow">
                Caleb <span className="text-fuchsia-500 text-stroke">Club</span>
              </h1>
              <p className="text-slate-400 font-bold tracking-[0.2em] text-xs uppercase">Conquistadores 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="px-4 py-2">
              <p className="text-[10px] uppercase font-black text-fuchsia-400 tracking-widest">Subdirector/a</p>
              <p className="font-bold text-sm">{subdirector?.nombre || ""}</p>
            </div>
            <button className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </div>
        </nav>
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-5xl md:text-7xl font-black mb-4 leading-none">
            PANEL DEL <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-fuchsia-500">SUBDIRECTOR.</span>
          </h2>
          <div className="h-1 w-24 bg-fuchsia-500 rounded-full"></div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {Object.entries(data).map(([key, value]) => (
            <div
              key={key}
              onClick={() => setActiveTab(activeTab === key ? null : key as "especialidades" | "progreso" | "eventos")}
              className={`group cursor-pointer relative p-0.5 rounded-[2.5rem] transition-all duration-500 transform hover:scale-[1.02] ${activeTab === key ? 'scale-[1.02]' : ''}`}
            >
              {/* Border Gradient */}
              <div className={`absolute inset-0 bg-linear-to-br ${value.color} rounded-[2.5rem] opacity-20 group-hover:opacity-100 transition-opacity`}></div>
              {/* Card Body */}
              <div className="relative bg-[#1e293b] rounded-[2.4rem] p-8 h-full flex flex-col items-center justify-center text-center overflow-hidden">
                <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-linear-to-br ${value.color} blur-[50px] opacity-0 group-hover:opacity-20 transition-opacity`}></div>
                <div className={`w-20 h-20 mb-6 rounded-3xl bg-linear-to-br ${value.color} flex items-center justify-center shadow-2xl ${value.shadow} group-hover:rotate-12 transition-transform`}>
                  {value.icon}
                </div>
                <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">{key}</h3>
                <p className="text-6xl font-black tracking-tighter">{value.total}</p>
                <div className="mt-6 px-4 py-1 rounded-full bg-white/5 text-[10px] font-bold group-hover:bg-white/10 transition-colors uppercase">
                  Ver Detalles
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Detail Panel - Ultra Modern */}
        {activeTab && (
          <div className="animate-in zoom-in-95 fade-in duration-300 bg-linear-to-b from-white/10 to-transparent backdrop-blur-2xl rounded-[3rem] border border-white/20 overflow-hidden shadow-3xl">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-12 rounded-full bg-linear-to-b ${data[activeTab as "especialidades" | "progreso" | "eventos"].color}`}></div>
                  <h3 className="text-4xl font-black uppercase tracking-tight italic">
                    Expediente: <span className="text-fuchsia-500">{activeTab}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab(null)}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-red-500 rounded-full transition-all group"
                >
                  <X className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
                {activeTab === 'especialidades' && data.especialidades.list.map((e, i) => (
                  <div key={i} className="group bg-slate-900/50 p-6 rounded-4xl border border-white/5 hover:border-indigo-500/50 transition-all flex items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-3xl font-black shadow-lg shadow-indigo-500/20">
                      {e.nombre.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-indigo-400">{e.nombre}</h4>
                      <p className="text-slate-500">CATEGORÍA: {e.categoria}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-md font-black tracking-widest uppercase">ID: {e.id}</span>
                    </div>
                  </div>
                ))}
                {activeTab === 'progreso' && data.progreso.list.map((p, i) => (
                  <div key={i} className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 hover:border-fuchsia-500/50 transition-all flex items-center justify-between group">
                    <p className="text-xl font-black tracking-tight group-hover:translate-x-2 transition-transform italic underline decoration-fuchsia-500/30 decoration-4">
                      Progreso: {p.porcentaje}%
                    </p>
                    <div className="w-10 h-10 rounded-full bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                ))}
                {activeTab === 'eventos' && data.eventos.list.map((e, i) => (
                  <div key={i} className="col-span-full bg-linear-to-r from-blue-500/10 to-transparent p-10 rounded-[3rem] border border-blue-500/20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                      <div>
                        <span className="text-xs font-black text-blue-500 tracking-[0.3em] uppercase mb-4 block">Evento</span>
                        <h4 className="text-5xl font-black italic tracking-tighter mb-4">{e.nombre}</h4>
                        <div className="flex gap-4">
                          <span className="bg-white/5 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" /> {e.fecha}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest italic">Lugar:</p>
                        <p className="text-2xl font-black text-white">{e.lugar}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .text-stroke {
          -webkit-text-stroke: 1px rgba(255,255,255,0.3);
          color: transparent;
        }
        .italic-shadow {
          text-shadow: 4px 4px 0px rgba(217, 70, 239, 0.3);
        }
      `}</style>
    </div>
  );
}
