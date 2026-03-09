
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
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
    setError('Correo o contraseña incorrectos.');
  };

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
"use client";
