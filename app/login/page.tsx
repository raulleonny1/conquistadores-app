"use client";

import React, { useState } from 'react';
import { db } from '../../src/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


export default function Login() {
  const [step, setStep] = useState<'login' | 'cambiarPin'>('login');
  const [consejeroId, setConsejeroId] = useState<string | null>(null);
  const [nuevoPin, setNuevoPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa correo y contraseña.');
      return;
    }
    // Lógica de autenticación para admin
    if (email.trim().toLowerCase() === 'admin' && password === '1844') {
      setError('');
      router.push('/admin');
      return;
    }
    // Lógica de autenticación para consejero
    const querySnapshot = await getDocs(collection(db, 'consejeros'));
    const found = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return (data.pin === password || (password === '1902' && !data.pin));
    });
    if (found) {
      setError('');
      if (password === '1902' && !found.data().pin) {
        // Redirigir a cambio de PIN
        setConsejeroId(found.id);
        setStep('cambiarPin');
        return;
      }
      localStorage.setItem('consejeroId', found.id);
      router.push(`/consejero?consejeroId=${found.id}`);
      return;
    }
      // Cambiar PIN para consejero nuevo
      const handleChangePin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^[0-9]{4}$/.test(nuevoPin)) {
          setError('El PIN debe tener 4 dígitos');
          return;
        }
        if (!consejeroId) return;
        await updateDoc(doc(db, 'consejeros', consejeroId), { pin: nuevoPin });
        setStep('login');
        setError('PIN actualizado. Ahora puedes ingresar con tu nuevo PIN.');
        setNuevoPin('');
      };
    setError('Correo o contraseña incorrectos.');
  };

  if (step === 'cambiarPin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa' }}>
        <form onSubmit={handleChangePin} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ marginBottom: 24, color: '#222' }}>Crea tu nuevo PIN</h2>
          <input
            type="password"
            placeholder="Nuevo PIN (4 dígitos)"
            value={nuevoPin}
            onChange={e => setNuevoPin(e.target.value)}
            style={{ marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
            maxLength={4}
            pattern="[0-9]{4}"
            required
          />
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          <button type="submit" style={{ background: '#0057b7', color: '#fff', padding: '10px 0', border: 'none', borderRadius: 6, width: '100%', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
            Guardar PIN
          </button>
        </form>
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Image src="/logoconquis.png" alt="Logo Conquistadores" width={120} height={120} style={{ marginBottom: 24 }} />
        <h2 style={{ marginBottom: 24, color: '#222' }}>Iniciar Sesión</h2>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
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
