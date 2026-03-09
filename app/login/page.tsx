"use client";


import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { db } from "../../src/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// Actualiza la redirección al dashboard de consejero:


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa correo y contraseña o PIN.');
      return;
    }
    // Lógica de autenticación para admin
    if (email.trim().toLowerCase() === 'admin' && password === '1844') {
      setError('');
      router.push('/admin');
      return;
    }
    // Permitir login de consejero con PIN 1902
    if (password === '1902') {
      setError('');
      // Aquí debes obtener el ID real del consejero
      const consejeroId = 'ID_DEL_CONSEJERO'; // Reemplaza por el ID real
      router.push(`/consejero/${consejeroId}`);
      return;
    }
    // Login de miembro por PIN
    // El usuario puede poner su PIN en el campo contraseña
    if (password.length === 4 && /^[0-9]{4}$/.test(password)) {
      // Buscar miembro con ese PIN
      const q = query(collection(db, 'conquistadores'), where('pin', '==', password));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setError('');
        // Redirigir al dashboard de miembros, pasando el PIN
        router.push(`/miembros/dashboard?pin=${password}`);
        return;
      } else {
        setError('PIN incorrecto o no registrado.');
        return;
      }
    }
    setError('Correo o contraseña incorrectos.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Image src="/logoconquis.png" alt="Logo Conquistadores" width={120} height={120} style={{ marginBottom: 24 }} />
        <h2 style={{ marginBottom: 24, color: '#222' }}>Iniciar Sesión</h2>
        <input
          type="text"
          placeholder="Correo electrónico o deja vacío para PIN"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
        />
        <input
          type="password"
          placeholder="Contraseña o PIN de 4 dígitos"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
        />
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <button type="submit" style={{ background: '#0057b7', color: '#fff', padding: '10px 0', border: 'none', borderRadius: 6, width: '100%', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
