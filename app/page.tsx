
"use client";
import React, { useState } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Login automático al ingresar 4 dígitos
  React.useEffect(() => {
    async function tryLogin() {
      if (pin.length === 4) {
        if (pin === '1844') {
          setError('');
          router.push('/admin');
          return;
        }
        // Buscar consejero con ese PIN
        const qConsejero = query(collection(db, 'consejeros'), where('pin', '==', pin));
        const snapshotConsejero = await getDocs(qConsejero);
        if (!snapshotConsejero.empty) {
          const consejeroDoc = snapshotConsejero.docs[0];
          setError('');
          router.push(`/consejero/${consejeroDoc.id}`);
          return;
        }
        // Buscar miembro conquistador con ese PIN
        const qMiembro = query(collection(db, 'conquistadores'), where('pin', '==', pin));
        const snapshotMiembro = await getDocs(qMiembro);
        if (!snapshotMiembro.empty) {
          setError('');
          router.push(`/miembros/dashboard?pin=${pin}`);
          return;
        }
        setError('PIN incorrecto.');
        setTimeout(() => setPin(''), 600);
      }
    }
    tryLogin();
    // eslint-disable-next-line
  }, [pin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length !== 4) {
      setError('Ingresa un PIN de 4 dígitos.');
      return;
    }
    if (pin === '1844') {
      setError('');
      router.push('/admin');
      return;
    }
    (async () => {
      // Buscar consejero con ese PIN
      const qConsejero = query(collection(db, 'consejeros'), where('pin', '==', pin));
      const snapshotConsejero = await getDocs(qConsejero);
      if (!snapshotConsejero.empty) {
        const consejeroDoc = snapshotConsejero.docs[0];
        setError('');
        router.push(`/consejero/${consejeroDoc.id}`);
        return;
      }
      // Buscar miembro conquistador con ese PIN
      const qMiembro = query(collection(db, 'conquistadores'), where('pin', '==', pin));
      const snapshotMiembro = await getDocs(qMiembro);
      if (!snapshotMiembro.empty) {
        setError('');
        router.push(`/miembros/dashboard?pin=${pin}`);
        return;
      }
      setError('PIN incorrecto.');
      setTimeout(() => setPin(''), 600);
    })();
  };

  const handleKeypad = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
      setError('');
    }
  };
  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0.7
        }}
      >
        <source src="/fondo-login.mp4" type="video/mp4" />
        Tu navegador no soporta el video de fondo.
      </video>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#eee',
          padding: '28px 18px',
          border: '2px solid #444',
          width: '100%',
          maxWidth: 340,
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          boxSizing: 'border-box',
        }}
      >
        <Image src="/logoconquis.png" alt="Logo Conquistadores" width={80} height={80} style={{ marginBottom: 16, border: '2px solid #444', background: '#fff', padding: 4 }} />
        <h2 style={{ marginBottom: 8, color: '#222', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 20 }}>Iniciar Sesión</h2>
        <div style={{ marginBottom: 16, color: '#444', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }}>Club "Caleb"</div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 18,
            justifyContent: 'center',
          }}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                width: 38,
                height: 44,
                borderBottom: '2.5px solid #444',
                textAlign: 'center',
                fontSize: 24,
                fontFamily: 'monospace',
                background: '#fafafa',
              }}
            >
              {pin[i] ? '•' : ''}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 14,
            width: '100%',
            maxWidth: 260,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button
              type="button"
              key={n}
              onClick={() => handleKeypad(String(n))}
              style={{
                height: 44,
                fontSize: 20,
                background: '#fff',
                border: '1.5px solid #444',
                borderRadius: 10,
                fontFamily: 'monospace',
                cursor: 'pointer',
                width: '100%',
                minWidth: 0,
              }}
            >
              {n}
            </button>
          ))}
          <div></div>
          <button
            type="button"
            onClick={() => handleKeypad('0')}
            style={{
              height: 44,
              fontSize: 20,
              background: '#fff',
              border: '1.5px solid #444',
              borderRadius: 10,
              fontFamily: 'monospace',
              cursor: 'pointer',
              width: '100%',
              minWidth: 0,
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={{
              height: 44,
              fontSize: 20,
              background: '#fff',
              border: '1.5px solid #444',
              borderRadius: 10,
              fontFamily: 'monospace',
              cursor: 'pointer',
              width: '100%',
              minWidth: 0,
            }}
          >
            ⌫
          </button>
        </div>
        {error && <div style={{ color: '#a00', marginBottom: 12, fontFamily: 'monospace', fontSize: 14 }}>{error}</div>}
      </form>
    </div>
  );
}
