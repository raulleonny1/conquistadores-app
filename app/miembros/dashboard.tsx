"use client";
import React, { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import EventosSidebar from './EventosSidebar';
import { db } from '../../src/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { logInfo, logError } from "@/src/lib/logger";
import { useSearchParams } from 'next/navigation';
import {
	Medal,
	Trophy,
	Calendar,
	Star,
	BookOpen,
	LogOut,
	Bell,
	ChevronRight,
	Map,
	CheckCircle2,
	Clock,
	ShieldCheck,
	TrendingUp
} from 'lucide-react';
// Medal se importa solo una vez

// Mapeo simple de especialidades a emojis (puedes expandirlo según tus necesidades)
const iconosEspecialidades: Record<string, string> = {
	"Vida al Aire Libre": "🏕️",
	"Fogatas y Cocina": "🔥",
	"Nudos y Amarres": "🪢",
	"Primeros Auxilios": "⛑️",
	"Exploración": "🧭",
	"Naturaleza": "🌳",
	"Cocina": "🍳",
	"Deportes": "⚽",
	// ...agrega más según tus especialidades
};

const App = () => {
	const [frasesSemana, setFrasesSemana] = useState<any[]>([]);
	const [fraseHoy, setFraseHoy] = useState<{ frase: string, hora: string } | null>(null);
	const [retosEspeciales, setRetosEspeciales] = useState<any[]>([]);
	const [defaultReto, setDefaultReto] = useState<any | null>(null);
	const searchParams = useSearchParams();
	const pin = searchParams.get('pin') || '';

	const [user, setUser] = useState<any>(null);
	const [especialidades, setEspecialidades] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [tipo, setTipo] = useState<string>(""); // 'conquistador' o 'consejero'

	// Simulación de eventos y calificaciones
	const proximosEventos = [
		{ id: 1, titulo: "Campamento de Verano", fecha: (() => { const { formatFechaDDMMYYYY } = require("../../src/firebase"); return formatFechaDDMMYYYY(new Date()); })(), tipo: "Campamento", color: "bg-orange-100 text-orange-600" },
		{ id: 2, titulo: "Desfile Cívico", fecha: (() => { const { formatFechaDDMMYYYY } = require("../../src/firebase"); return formatFechaDDMMYYYY(new Date()); })(), tipo: "Evento", color: "bg-blue-100 text-blue-600" }
	];
	const calificacionesRecientes = [
		{ id: 1, materia: "Nudos y Amarres", nota: "Excelente", icono: <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><BookOpen size={20}/></div> },
		{ id: 2, materia: "Primeros Auxilios", nota: "Aprobado", icono: <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Medal size={20}/></div> }
	];


	useEffect(() => {
		// Notificación de frases de la semana
		const frasesDoc = doc(db, 'frasesSemana', 'actual');
		const unsubFrases = onSnapshot(frasesDoc, (snap) => {
			const data = snap.data();
			if (data && Array.isArray(data.frases)) {
				setFrasesSemana(data.frases);
				const hoy = new Date();
				const diaSemana = hoy.getDay();
				const idx = diaSemana === 0 ? 6 : diaSemana - 1;
				setFraseHoy({
					frase: data.frases[idx],
					hora: (() => {
						const { formatFechaDDMMYYYY } = require("../../src/firebase");
						return formatFechaDDMMYYYY(new Date());
					})()
				});
			}
		});

		// Suscripción en tiempo real a retos de la unidad y retos globales
		let unsubReto: (() => void) | undefined;
		if (user && user.unidad) {
			const retosQuery = collection(db, "retosEspeciales");
			unsubReto = onSnapshot(retosQuery, snap => {
				const retos = snap.docs.map(doc => {
					const data = doc.data();
					return {
						id: doc.id,
						titulo: data.titulo || '',
						descripcion: data.descripcion || '',
						puntos: data.puntos || 0,
						fecha: data.fecha || '',
						unidad: data.unidad || '',
						consejeroId: data.consejeroId || ''
					};
				});
				// Filtrar retos: globales (admin) o de la unidad
				const retosFiltrados = retos.filter(r => r.unidad === user.unidad || r.unidad === "ALL" || !r.unidad);
				retosFiltrados.sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
				setRetosEspeciales(retosFiltrados);
				// Si no hay retos, buscar el reto especial por ID
				if (retosFiltrados.length === 0) {
					import('firebase/firestore').then(({ getDoc, doc }) => {
						getDoc(doc(db, "retosEspeciales", "0eVaYg1dXcAchOdqtNd8")).then(snap => {
							if (snap.exists()) {
								setDefaultReto({ id: snap.id, ...snap.data() });
							} else {
								setDefaultReto(null);
							}
						});
					});
				} else {
					setDefaultReto(null);
				}
			});
		}

		if (!pin) {
			setError('No se proporcionó PIN');
			return;
		}

		// Fetch user logic directly here
		(async () => {
			try {
				const qConquis = query(collection(db, 'RegistroConquis'), where('pin', '==', pin));
				const snapConquis = await getDocs(qConquis);
				if (!snapConquis.empty) {
					const data = snapConquis.docs[0].data();
					setUser(data);
					setTipo('conquistador');
					let esp = data.especialidades;
					if (typeof esp === 'string') {
						esp = esp.split(',').map((e: string) => e.trim()).filter(Boolean);
					}
					setEspecialidades(Array.isArray(esp) ? esp : []);
					setLoading(false);
					return;
				}
				const qConsejero = query(collection(db, 'consejeros'), where('pin', '==', pin));
				const snapConsejero = await getDocs(qConsejero);
				if (!snapConsejero.empty) {
					const data = snapConsejero.docs[0].data();
					setUser(data);
					setTipo('consejero');
					let esp = data.especialidades;
					if (typeof esp === 'string') {
						esp = esp.split(',').map((e: string) => e.trim()).filter(Boolean);
					}
					setEspecialidades(Array.isArray(esp) ? esp : []);
					setLoading(false);
					return;
				}
				setError('No existe usuario con ese PIN.');
			} catch (e) {
				setError('Error al consultar datos');
				console.error('Error Firestore:', e);
			}
			setLoading(false);
		})();

		// cleanup SIEMPRE al final
		return () => {
			unsubFrases();
			if (unsubReto) unsubReto();
		};
	}, [pin]);

	const handleLogout = () => {
		const auth = getAuth();
		signOut(auth).then(() => {
			logInfo('Logout miembro exitoso');
			window.location.href = '/';
		});
	};

	if (loading) {
		return <div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>;
	}
	if (error) {
		logError('Error en dashboard miembro: ' + error + ' PIN: ' + pin);
		return <div className="text-center mt-10 text-lg text-red-700 font-bold">{error}<br/><span className="text-xs text-slate-500">PIN ingresado: {pin}</span></div>;
	}

	return (
		<>
			{/* Notificación de frase de la semana */}
			{fraseHoy && fraseHoy.frase && (
				<div className="max-w-2xl mx-auto mt-6 mb-8 bg-cyan-100 border-l-4 border-cyan-500 rounded-xl shadow p-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4">
					<h3 className="text-xl font-bold text-cyan-700 mb-2">Frase para hoy</h3>
					<p className="text-cyan-900 text-lg font-semibold text-center mb-2">{fraseHoy.frase}</p>
					<span className="text-xs text-cyan-600">Se publicará a las {fraseHoy.hora || 'hora no definida'}</span>
				</div>
			)}
			<div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-10">
			{/* Fondo Decorativo - Gradiente Superior dinámico */}
			<div className="absolute top-0 left-0 w-full h-80 md:h-64 bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 z-0 opacity-95 rounded-b-4xl md:rounded-none" />

			{/* Navbar Transparente y Moderna */}
			<nav className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
				<div className="flex items-center gap-2 md:gap-3">
					<div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30 shadow-lg">
						<ShieldCheck className="text-white w-5 h-5 md:w-6 md:h-6" />
					</div>
					<span className="text-white font-black text-sm md:text-xl tracking-tight leading-none uppercase">
						Club de Conquistadores
					</span>
				</div>
        
				<div className="flex items-center gap-2 md:gap-4">
					<button className="relative p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all">
						<Bell size={18} />
						<span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
					</button>
					<button
						className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white p-2 md:px-4 md:py-2 rounded-xl border border-white/20 hover:bg-red-500/80 transition-all shadow-lg active:scale-95"
						onClick={handleLogout}
					>
						<LogOut size={18} />
						<span className="hidden md:inline text-sm font-black uppercase tracking-wider">Cerrar Sesión</span>
					</button>
				</div>
			</nav>

			<main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
				{/* Header de Bienvenida con Estilo */}
				<div className="mt-4 md:mt-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="space-y-1 text-center md:text-left">
						<h1 className="text-white text-4xl md:text-6xl font-black tracking-tighter leading-tight drop-shadow-md">
							¡Hola, {user.nombre ? user.nombre.split(' ')[0] : 'Conquistador'}! 👋
						</h1>
						<p className="text-indigo-100 text-base md:text-xl font-medium">
							Orgulloso miembro de la unidad <span className="font-bold underline decoration-pink-400 decoration-4 underline-offset-4">{user.unidad || 'Sin unidad'}</span>
						</p>
					</div>
          
					{/* Tarjeta de Rango y XP Flotante */}
					<div className="bg-white/95 backdrop-blur-xl p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-center md:justify-start gap-4 border border-white mx-auto md:mx-0 w-full max-w-sm md:w-auto transform hover:scale-105 transition-transform cursor-default">
						<div className="bg-amber-100 p-4 rounded-3xl shadow-inner">
							<Star className="text-amber-500 fill-amber-500" size={32} />
						</div>
						<div className="text-left">
							<p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Tu Rol</p>
							<p className="text-xl font-black text-slate-800 leading-none mb-1">{tipo === 'conquistador' ? 'Conquistador' : 'Consejero'}</p>
							<div className="flex items-center gap-2 text-green-600 font-black">
								<TrendingUp size={16} />
								<span className="text-sm tracking-tight">{user.puntos ? user.puntos.toLocaleString() : 0} PUNTOS</span>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
					{/* Columna Izquierda: Progreso y Calificaciones */}
					<div className="lg:col-span-8 space-y-6 md:space-y-8">
            
						{/* Tarjeta de Progreso de Clase - Gamificada */}
						<div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100 overflow-hidden relative group">
							<div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:scale-110 transition-transform hidden lg:block">
								<Map size={240} />
							</div>
              
							<div className="relative z-10">
								<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-4">
									<div>
										<h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Mi Unidad: {user.unidad || 'Sin unidad'}</h3>
										<p className="text-slate-500 text-base font-medium">Gestiona y motiva a tus conquistadores.</p>
									</div>
									<div className="bg-green-600 text-white px-6 py-2 rounded-2xl shadow-lg shadow-green-200">
										<span className="text-3xl md:text-4xl font-black leading-none">
											{tipo === 'conquistador' ? '1' : tipo === 'consejero' ? (Array.isArray(user.conquistadores) ? user.conquistadores.length : 0) : '0'}
										</span>
									</div>
								</div>
                
								{/* Barra de Progreso Estilizada */}
								<div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner p-1">
									<div 
										className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 shadow-md"
										style={{ width: `${user.progresoClase}%` }}
									/>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div className="flex items-center gap-4 p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100 group-hover:bg-indigo-50 transition-colors">
										<CheckCircle2 className="text-indigo-600 shrink-0" size={24} />
										<div>
											<p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Completado</p>
											<p className="font-black text-slate-800 text-lg">12 Tareas</p>
										</div>
									</div>
									<div className="flex items-center gap-4 p-5 rounded-3xl bg-orange-50/50 border border-orange-100 group-hover:bg-orange-50 transition-colors">
										<Clock className="text-orange-600 shrink-0" size={24} />
										<div>
											<p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">Pendiente</p>
											<p className="font-black text-slate-800 text-lg">5 Tareas</p>
										</div>
									</div>
									<div className="flex items-center gap-4 p-5 rounded-3xl bg-purple-50/50 border border-purple-100 group-hover:bg-purple-50 transition-colors">
										<Trophy className="text-purple-600 shrink-0" size={24} />
										<div>
											<p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Siguiente Nivel</p>
											<p className="font-black text-slate-800 text-lg">Guía Mayor</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Grid Inferior: Calificaciones y Especialidades */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Sección Calificaciones */}
							<div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100">
								<div className="flex items-center justify-between mb-8">
									<h3 className="font-black text-xl flex items-center gap-3 tracking-tight">
										<BookOpen className="text-indigo-600" size={24} />
										Calificaciones
									</h3>
									<button className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">Ver Todo</button>
								</div>
								<div className="space-y-4">
									{calificacionesRecientes.map(cal => (
										<div key={cal.id} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-3xl border border-transparent hover:border-slate-200 hover:bg-white transition-all cursor-pointer group">
											<div className="flex items-center gap-4">
												<div className="group-hover:scale-110 transition-transform">{cal.icono}</div>
												<div>
													<p className="font-black text-slate-800 text-sm">{cal.materia}</p>
													<p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Examen Final</p>
												</div>
											</div>
											<span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-black uppercase shadow-sm">
												{cal.nota}
											</span>
										</div>
									))}
								</div>
							</div>

								{/* Sección Especialidades */}
								<div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100">
									<div className="flex items-center justify-between mb-8">
										<h3 className="font-black text-xl flex items-center gap-3 tracking-tight">
											<Medal className="text-pink-500" size={24} />
											Especialidades
										</h3>
										<button className="text-pink-500 text-xs font-black uppercase tracking-widest hover:underline">Explorar</button>
									</div>
									<div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
										{especialidades.length === 0 && (
											<div className="text-slate-400 text-xs">No tienes especialidades registradas.</div>
										)}
										{/* Mostrar especialidades como lista si es array de objetos */}
										{Array.isArray(user.especialidades) && user.especialidades.length > 0 ? (
											user.especialidades.map((espObj: any, idx: number) => (
												<div key={idx} className="flex flex-col items-center gap-3 p-5 bg-indigo-50/30 rounded-4xl border border-indigo-100 min-w-32 md:flex-1 shadow-sm hover:shadow-md transition-shadow">
													<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-indigo-50">
														{iconosEspecialidades[espObj.especialidad] || <Medal className="text-pink-400" size={32} />}
													</div>
													<p className="text-[10px] font-black text-center text-slate-600 uppercase tracking-tighter leading-none">
														{espObj.area} &gt; {espObj.categoria} &gt; {espObj.especialidad}
													</p>
												</div>
											))
										) : (
											especialidades.map((esp, idx: number) => (
												<div key={esp + idx} className="flex flex-col items-center gap-3 p-5 bg-indigo-50/30 rounded-4xl border border-indigo-100 min-w-32 md:flex-1 shadow-sm hover:shadow-md transition-shadow">
													<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-indigo-50">
														{iconosEspecialidades[esp] || <Medal className="text-pink-400" size={32} />}
													</div>
													<p className="text-[10px] font-black text-center text-slate-600 uppercase tracking-tighter leading-none">{esp}</p>
												</div>
											))
										)}
									</div>
								</div>
						</div>
					</div>

					{/* Columna Derecha: Sidebar con Eventos y Retos */}
					<div className="lg:col-span-4 space-y-6 md:space-y-8">
            
						{/* Próximos Eventos reales desde Firebase */}
						<EventosSidebar />

						{/* Tarjeta de Reto Semanal - El toque final */}
						<div className="bg-linear-to-br from-indigo-950 via-indigo-900 to-indigo-800 rounded-b-4xl p-10 text-white relative overflow-hidden group shadow-2xl">
							<div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-700">
								<Trophy size={200} />
							</div>
							<div className="relative z-10">
								<div className="bg-indigo-400/20 backdrop-blur-md px-3 py-1 rounded-full inline-block mb-4 border border-indigo-400/30">
									<p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Reto Especial</p>
								</div>
								{/* Depuración: mostrar unidad del usuario y de los retos */}
								<div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700">
									<div><b>Unidad del usuario:</b> {user?.unidad || 'Sin unidad'}</div>
									<div><b>Retos encontrados:</b> {retosEspeciales.length}</div>
									{retosEspeciales.length > 0 && (
										<ul className="mt-2">
											{retosEspeciales.map((reto, idx) => (
												<li key={reto.id}>
													<b>Reto {idx + 1}:</b> unidad: "{reto.unidad}" | título: "{reto.titulo}"
												</li>
											))}
										</ul>
									)}
								</div>
								{retosEspeciales.length > 0 ? (
									<>
										{retosEspeciales.map((reto, idx) => (
											<div key={reto.id} className="mb-8">
												<h4 className="text-2xl md:text-3xl font-black mb-2 leading-tight tracking-tighter">{reto.titulo}</h4>
												<p className="mb-2 text-indigo-200 text-sm">{reto.descripcion}</p>
												<div className="mb-2 text-xs text-indigo-300">Puntos: {reto.puntos} | Fecha: {reto.fecha}</div>
												<button className="w-full bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-950/50">
													¡Aceptar Reto!
												</button>
											</div>
										))}
									</>
								) : defaultReto ? (
									<>
										<h4 className="text-2xl md:text-3xl font-black mb-6 leading-tight tracking-tighter">{defaultReto.titulo}</h4>
										<p className="mb-4 text-indigo-200 text-sm">{defaultReto.descripcion}</p>
										<div className="mb-4 text-xs text-indigo-300">Puntos: {defaultReto.puntos} | Fecha: {defaultReto.fecha}</div>
										<button className="w-full bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-950/50">
											¡Aceptar Reto!
										</button>
									</>
								) : (
									<>
										<h4 className="text-2xl md:text-3xl font-black mb-6 leading-tight tracking-tighter">No hay reto especial asignado</h4>
									</>
								)}
							</div>
						</div>

					</div>

				</div>
			</main>
		</div>
		</>
	);
};

export default App;
