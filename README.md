# ConquisApp (ConquistadoresApp)

Plataforma **multi-club** para ministerio joven: Conquistadores, Aventureros y Jóvenes Adventistas. Cada iglesia/club tiene datos aislados por `clubId`.

**Repositorio:** [github.com/raulleonny1/conquistadores-app](https://github.com/raulleonny1/conquistadores-app)

> Proyecto independiente de [Club Caleb](https://github.com/raulleonny1/club-caleb). No mezclar despliegues ni remotos Git.

## Stack

- Next.js 16 (App Router)
- Firebase Auth + Firestore + Storage
- Tailwind CSS 4

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completa las claves en .env.local (Firebase Console → Project settings → Web app)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno (Vercel)

Importa `.env.example` en Vercel o pega las 6 variables `NEXT_PUBLIC_FIREBASE_*`.

Tras importar, **redeploy**. En Firebase Auth → Authorized domains, agrega tu dominio `.vercel.app`.

## Firestore

```bash
firebase deploy --only firestore:rules
```

Activa **Authentication → Sign-in method → Anonymous** si usas login admin por PIN.

## Programas

| Programa | Admin | Puntos / ranking |
|----------|-------|------------------|
| Conquistadores | `/admin` | Catálogo en Calificaciones |
| Aventureros | `/admin/aventureros` | Actividades + ranking por club |
| JA | `/admin/ja` | Actividades + ranking por grupo |
| Padres (solo lectura) | `/padres` | — |

## Git

```bash
git remote -v
# origin → conquistadoresapp únicamente
git push origin main
```

No enlazar este proyecto al repo `club-caleb`.
