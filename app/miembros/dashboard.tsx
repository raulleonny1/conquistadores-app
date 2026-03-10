import React, { useState, useEffect } from 'react';
import { db } from '../../src/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { useSearchParams } from 'next/navigation';
import { 
	Trophy, 
	Calendar, 
	Star, 
	BookOpen, 
	LogOut, 
	Bell, 
	ChevronRight,
	Medal,
	Map,
	CheckCircle2,
	Clock,
	ShieldCheck,
	TrendingUp
} from 'lucide-react';

const App = () => {
	const searchParams = useSearchParams();
	const pin = searchParams.get('pin') || '';

	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Simulación de eventos y calificaciones
	const proximosEventos = [
		{ id: 1, titulo: "Campamento de Verano", fecha: "15 de Oct", tipo: "Campamento", color: "bg-orange-100 text-orange-600" },
		{ id: 2, titulo: "Desfile Cívico", fecha: "20 de Oct", tipo: "Evento", color: "bg-blue-100 text-blue-600" }
	];
	const calificacionesRecientes = [
		{ id: 1, materia: "Nudos y Amarres", nota: "Excelente", icono: <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><BookOpen size={20}/></div> },
		{ id: 2, materia: "Primeros Auxilios", nota: "Aprobado", icono: <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Medal size={20}/></div> }
	];

	useEffect(() => {
		if (!pin) {
			setError('No se proporcionó PIN');
			setLoading(false);
			return;
		}
		const fetchUser = async () => {
			try {
				const q = query(collection(db, 'conquistadores'), where('pin', '==', pin));
				const snap = await getDocs(q);
				console.log('Consulta Firestore:', q);
				console.log('Docs encontrados:', snap.docs.map(doc => doc.data()));
				if (!snap.empty) {
					setUser(snap.docs[0].data());
				} else {
					setError('No existe el conquistador con ese PIN');
				}
			} catch (e) {
				setError('Error al consultar datos');
				console.error('Error Firestore:', e);
			}
			setLoading(false);
		};
		fetchUser();
	}, [pin]);

	const handleLogout = () => {
		const auth = getAuth();
		signOut(auth).then(() => {
			window.location.href = '/';
		});
	};

	if (loading) {
		return <div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>;
	}
	if (error) {
		return <div className="text-center mt-10 text-lg text-red-700">{error}</div>;
	}

	return (
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
							<p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Tu Rango Actual</p>
							<p className="text-xl font-black text-slate-800 leading-none mb-1">{user.rango || 'Sin rango'}</p>
							<div className="flex items-center gap-2 text-indigo-600 font-black">
								<TrendingUp size={16} />
								<span className="text-sm tracking-tight">{user.puntos ? user.puntos.toLocaleString() : 0} PUNTOS XP</span>
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
										<h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Mi Progreso: {user.clase || 'Sin clase'}</h3>
										<p className="text-slate-500 text-base font-medium">¡Estás dominando los requisitos de este año!</p>
									</div>
									<div className="bg-indigo-600 text-white px-6 py-2 rounded-2xl shadow-lg shadow-indigo-200">
										<span className="text-3xl md:text-4xl font-black leading-none">{user.progresoClase || 0}%</span>
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
									  <div className="flex flex-col items-center gap-3 p-5 bg-indigo-50/30 rounded-4xl border border-indigo-100 min-w-32 md:flex-1 shadow-sm hover:shadow-md transition-shadow">
										 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-indigo-50">🏕️</div>
										 <p className="text-[10px] font-black text-center text-slate-600 uppercase tracking-tighter leading-none">Vida al Aire Libre</p>
									</div>
									  <div className="flex flex-col items-center gap-3 p-5 bg-orange-50/30 rounded-4xl border border-orange-100 min-w-32 md:flex-1 shadow-sm hover:shadow-md transition-shadow">
										 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-orange-50">🔥</div>
										 <p className="text-[10px] font-black text-center text-slate-600 uppercase tracking-tighter leading-none">Fogatas y Cocina</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Columna Derecha: Sidebar con Eventos y Retos */}
					<div className="lg:col-span-4 space-y-6 md:space-y-8">
            
						{/* Próximos Eventos */}
						<div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100">
							<h3 className="font-black text-xl mb-8 flex items-center gap-3 tracking-tight">
								<Calendar className="text-orange-500" size={24} />
								Próximos Eventos
							</h3>
							<div className="space-y-4">
								{proximosEventos.map(evento => (
									  <div key={evento.id} className="p-5 rounded-4xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer group active:scale-95">
										<div className="flex items-center justify-between mb-3">
											<span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${evento.color}`}>
												{evento.tipo}
											</span>
											<ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
										</div>
										<h4 className="font-black text-slate-800 leading-tight mb-3 text-base">{evento.titulo}</h4>
										<div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
											<div className="p-1.5 bg-indigo-50 rounded-lg"><Clock size={14} className="text-indigo-500" /></div>
											{evento.fecha}
										</div>
									</div>
								))}
							</div>
							  <button className="w-full mt-8 py-4 rounded-3xl bg-indigo-50 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-md active:scale-95">
								Calendario Completo
							</button>
						</div>

						{/* Tarjeta de Reto Semanal - El toque final */}
						<div className="bg-linear-to-br from-indigo-950 via-indigo-900 to-indigo-800 rounded-b-4xl p-10 text-white relative overflow-hidden group shadow-2xl">
							<div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-700">
								<Trophy size={200} />
							</div>
							<div className="relative z-10">
								<div className="bg-indigo-400/20 backdrop-blur-md px-3 py-1 rounded-full inline-block mb-4 border border-indigo-400/30">
									<p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Reto Especial</p>
								</div>
								<h4 className="text-2xl md:text-3xl font-black mb-6 leading-tight tracking-tighter">Aprende 5 nudos nuevos y gana 200 XP extra</h4>
								<button className="w-full bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-950/50">
									¡Aceptar Reto!
								</button>
							</div>
						</div>

					</div>

				</div>
			</main>
		</div>
	);
};

export default App;
