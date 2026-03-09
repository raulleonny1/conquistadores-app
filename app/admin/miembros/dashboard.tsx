"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/src/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Trophy, Calendar, Star, BookOpen, LogOut, Bell, ChevronRight, Medal, Map, CheckCircle2, Clock } from 'lucide-react';
import { especialidadesBase } from '@/src/data/especialidades';

export default function MiembroDashboard({ miembroId }: { miembroId: string }) {
		// Handler para cerrar sesión
		const handleLogout = async () => {
			try {
				// Si usas Firebase Auth
				const { getAuth, signOut } = await import('firebase/auth');
				const auth = getAuth();
				await signOut(auth);
			} catch (e) {
				// Si no hay auth, solo redirige
			}
			window.location.href = '/';
		};
	const [miembro, setMiembro] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!miembroId) return;
		const q = query(
			collection(db, "conquistadores"),
			where("pin", "==", miembroId)
		);
		const unsub = onSnapshot(q, (snapshot) => {
			if (!snapshot.empty) {
				setMiembro({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
			} else {
				setMiembro(null);
			}
			setLoading(false);
		});
		return () => unsub();
	}, [miembroId]);

	if (loading) {
		return <div className="text-center mt-10 text-lg text-blue-700">Cargando datos...</div>;
	}
	if (!miembro) {
		return <div className="text-center mt-10 text-lg text-red-700">No se encontró miembro con PIN: {miembroId}</div>;
	}

	// Datos simulados para gamificación y eventos
	const puntos = 1250;
	const rango = "Explorador Élite";
	const progresoClase = 65;
	const proximosEventos = [
		{ id: 1, titulo: "Campamento de Verano", fecha: "15 de Oct", tipo: "Campamento", color: "bg-orange-100 text-orange-600" },
		{ id: 2, titulo: "Desfile Cívico", fecha: "20 de Oct", tipo: "Evento", color: "bg-blue-100 text-blue-600" }
	];
	const calificacionesRecientes = [
		{ id: 1, materia: "Nudos y Amarres", nota: "Excelente", icono: <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><BookOpen size={20}/></div> },
		{ id: 2, materia: "Primeros Auxilios", nota: "Aprobado", icono: <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Medal size={20}/></div> }
	];

	// Conectar especialidades reales
	let especialidadesMiembro: typeof especialidadesBase = [];
	if (miembro.especialidades) {
		// Puede ser string separado por coma
		const lista = miembro.especialidades.split(',').map((e: string) => e.trim());
		especialidadesMiembro = especialidadesBase.filter(e => lista.includes(e.especialidad));
	}

	return (
		<div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
			{/* Fondo Decorativo - Gradiente Superior */}
			<div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 -z-0 opacity-90" />

			{/* Navbar Transparente */}
			<nav className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col md:flex-row items-center md:justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30">
						<Trophy className="text-white w-6 h-6" />
					</div>
					<span className="text-white font-bold text-xl tracking-tight">CLUB DE CONQUISTADORES</span>
				</div>
				<div className="flex items-center gap-4">
					<button className="relative p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all">
						<Bell size={20} />
						<span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
					</button>
					<button onClick={handleLogout} className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/20 hover:bg-red-500/80 transition-all text-sm font-semibold">
						<LogOut size={18} />
						<span className="hidden md:inline">Cerrar sesión</span>
					</button>
				</div>
			</nav>

			<main className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
				{/* Header de Bienvenida */}
				<div className="mt-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="space-y-1">
						<h1 className="text-white text-3xl md:text-5xl font-black tracking-tight">
							¡Hola, {miembro.nombre.split(' ')[0]}! 👋
						</h1>
						<p className="text-indigo-100 text-lg font-medium">
							Listo para la aventura de hoy en la unidad <span className="font-bold underline decoration-pink-400 underline-offset-4">{miembro.unidad}</span>
						</p>
					</div>
					{/* Tarjeta de Puntos/Rango */}
					<div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-xl flex items-center gap-4 border border-white">
						<div className="bg-amber-100 p-3 rounded-2xl">
							<Star className="text-amber-500 fill-amber-500" size={32} />
						</div>
						<div>
							<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nivel Actual</p>
							<p className="text-xl font-black text-slate-800">{rango}</p>
							<p className="text-sm font-bold text-indigo-600">{puntos} XP</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
					{/* Columna Izquierda: Progreso y Calificaciones */}
					<div className="lg:col-span-8 md:col-span-1 space-y-8">
						{/* Tarjeta de Progreso de Clase */}
						<div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 overflow-hidden relative group">
							<div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
								<Map size={120} />
							</div>
							<div className="relative z-10">
								<div className="flex items-center justify-between mb-6">
									<div>
										<h3 className="text-2xl font-black text-slate-800">Mi Progreso: {miembro.clase}</h3>
										<p className="text-slate-500 font-medium">Estás a pocos pasos de tu siguiente insignia</p>
									</div>
									<div className="text-right">
										<span className="text-4xl font-black text-indigo-600">{progresoClase}%</span>
									</div>
								</div>
								<div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8">
									<div 
										className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
										style={{ width: `${progresoClase}%` }}
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
										<CheckCircle2 className="text-indigo-600 mb-2" size={20} />
										<p className="text-xs font-bold text-indigo-400 uppercase">Completado</p>
										<p className="font-bold text-slate-700">12 Requisitos</p>
									</div>
									<div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
										<Clock className="text-orange-600 mb-2" size={20} />
										<p className="text-xs font-bold text-orange-400 uppercase">Pendiente</p>
										<p className="font-bold text-slate-700">5 Requisitos</p>
									</div>
									<div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
										<Trophy className="text-purple-600 mb-2" size={20} />
										<p className="text-xs font-bold text-purple-400 uppercase">Próximo Rango</p>
										<p className="font-bold text-slate-700">Guía Mayor</p>
									</div>
								</div>
							</div>
						</div>
						{/* Grid de Calificaciones */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
								<div className="flex items-center justify-between mb-6">
									<h3 className="font-bold text-lg flex items-center gap-2">
										<BookOpen className="text-indigo-600" size={20} />
										Calificaciones
									</h3>
									<button className="text-indigo-600 text-sm font-bold hover:underline">Ver todo</button>
								</div>
								<div className="space-y-4">
									{calificacionesRecientes.map(cal => (
										<div key={cal.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
											<div className="flex items-center gap-3">
												{cal.icono}
												<div>
													<p className="font-bold text-slate-800 text-sm">{cal.materia}</p>
													<p className="text-xs text-slate-500">Última evaluación</p>
												</div>
											</div>
											<span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
												{cal.nota}
											</span>
										</div>
									))}
								</div>
							</div>
							{/* Sección de Especialidades en curso */}
							<div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
								<div className="flex items-center justify-between mb-6">
									<h3 className="font-bold text-lg flex items-center gap-2">
										<Medal className="text-pink-500" size={20} />
										Especialidades
									</h3>
									<button className="text-pink-500 text-sm font-bold hover:underline">Explorar</button>
								</div>
								<div className="flex flex-wrap gap-3">
									{especialidadesMiembro.length > 0 ? especialidadesMiembro.map(es => (
										<div key={es.especialidad} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 w-[45%]">
											<div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-indigo-200 shadow-sm">🏅</div>
											<p className="text-[10px] font-bold text-center">{es.especialidad}</p>
										</div>
									)) : <div className="text-slate-400 text-sm">Sin especialidades registradas</div>}
								</div>
							</div>
						</div>
					</div>
					{/* Columna Derecha: Eventos y Sidebar */}
					<div className="lg:col-span-4 md:col-span-1 space-y-8">
						{/* Tarjeta de Próximos Eventos */}
						<div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
							<h3 className="font-bold text-lg mb-6 flex items-center gap-2">
								<Calendar className="text-orange-500" size={20} />
								Próximos Eventos
							</h3>
							<div className="space-y-4">
								{proximosEventos.map(evento => (
									<div key={evento.id} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 group cursor-pointer hover:bg-white hover:shadow-md transition-all">
										<div className="flex items-center justify-between mb-2">
											<span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${evento.color}`}>
												{evento.tipo}
											</span>
											<ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
										</div>
										<h4 className="font-bold text-slate-800 leading-tight mb-1">{evento.titulo}</h4>
										<div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
											<Clock size={12} />
											{evento.fecha}
										</div>
									</div>
								))}
							</div>
							<button className="w-full mt-6 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all">
								Ver calendario completo
							</button>
						</div>
						{/* Banner Motivacional */}
						<div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[2rem] p-8 text-white relative overflow-hidden">
							<div className="absolute -bottom-4 -right-4 opacity-10 rotate-12">
								<Trophy size={140} />
							</div>
							<p className="text-indigo-300 text-xs font-bold uppercase tracking-[0.2em] mb-2">Reto de la semana</p>
							<h4 className="text-xl font-black mb-4 leading-tight">Aprende 5 nudos nuevos y gana 200 XP</h4>
							<button className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform">
								¡Aceptar Reto!
							</button>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}