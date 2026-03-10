"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/src/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Trophy, Calendar, Star, BookOpen, LogOut, Bell, ChevronRight, Medal, Map, CheckCircle2, Clock } from 'lucide-react';
import { especialidadesBase } from '@/src/data/especialidades';

export default function MiembroDashboard({ miembroId }: { miembroId: string }) {
				// Unidades disponibles
				const [unidades, setUnidades] = useState<string[]>([]);
				useEffect(() => {
					const fetchUnidades = async () => {
						const { getDocs, collection } = await import('firebase/firestore');
						const snap = await getDocs(collection(db, 'unidades'));
						setUnidades(snap.docs.map(doc => doc.data().nombre || doc.id));
					};
					fetchUnidades();
				}, []);
			// Estado para formulario de registro
			const [showForm, setShowForm] = useState(false);
			const [form, setForm] = useState({
				nombre: '',
				unidad: '',
				pin: '',
				clase: '',
				especialidades: ''
			});
			const [saving, setSaving] = useState(false);
			const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
				setForm({ ...form, [e.target.name]: e.target.value });
			};
			const handleSubmit = async (e: React.FormEvent) => {
				e.preventDefault();
				setSaving(true);
				try {
					const { addDoc } = await import('firebase/firestore');
					await addDoc(collection(db, 'conquistadores'), form);
					setForm({ nombre: '', unidad: '', pin: '', clase: '', especialidades: '' });
					setShowForm(false);
				} catch (err) {
					alert('Error al registrar miembro');
				}
				setSaving(false);
			};
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
	const [miembro, setMiembro] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Consulta solo el miembro por PIN
		if (!miembroId) {
			setLoading(false);
			setMiembro(null);
			return;
		}
		const q = query(collection(db, "conquistadores"), where("pin", "==", miembroId));
		const unsub = onSnapshot(q, (snapshot) => {
			const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
			setMiembro(docs[0] || null);
			setLoading(false);
		});
		return () => unsub();
	}, [miembroId]);

	if (loading) {
		return <div className="text-center mt-10 text-lg text-blue-700">Cargando datos...</div>;
	}
	if (!miembro) {
		return (
			<div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex items-center justify-center">
				<div className="text-center text-lg text-red-700 mb-6">No existe miembro con ese PIN.</div>
			</div>
		);
	}

	// Dashboard personal del miembro
	return (
		<div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
			<div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 z-0 opacity-90" />
			<nav className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col md:flex-row items-center md:justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30">
						<Trophy className="text-white w-6 h-6" />
					</div>
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
				<div className="mt-8 mb-10">
					<h1 className="text-white text-3xl md:text-5xl font-black tracking-tight">Panel de Conquistador</h1>
					<p className="text-indigo-100 text-lg font-medium">Bienvenido, {miembro.nombre}</p>
				</div>
				<div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-200 max-w-xl mx-auto">
					<h2 className="text-xl font-bold text-indigo-700 mb-4">Datos personales</h2>
					<ul className="text-slate-700 text-lg mb-4">
						<li><span className="font-bold">Unidad:</span> {miembro.unidad}</li>
						<li><span className="font-bold">PIN:</span> {miembro.pin}</li>
						<li><span className="font-bold">Clase:</span> {miembro.clase}</li>
					</ul>
					<h3 className="text-lg font-bold text-indigo-700 mb-2">Especialidades</h3>
					<div className="mb-4">
						{miembro.especialidades ? miembro.especialidades.split(',').map((e: string) => <span key={e} className="inline-block bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 text-xs mr-1">{e.trim()}</span>) : <span className="text-slate-400 text-xs">Sin especialidades</span>}
					</div>
					{/* Aquí puedes agregar secciones para puntos, eventos, calificaciones, etc. */}
				</div>
			</main>
		</div>
	);
}