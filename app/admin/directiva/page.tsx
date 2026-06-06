"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "../../../src/firebase";
import { formatFechaDDMMYYYY } from "@/src/utils/formatoFecha";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { generarPinUnicoClub, validarPinDisponible } from "@/src/lib/pinUnico";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { mensajeErrorFirestore, prepararEscrituraClub } from "@/src/lib/escrituraFirestore";

const cargos = [
  "Director/a",
  "Subdirector/a",
  "Secretario/a",
  "Tesorero/a"
];

// Formatea el número de WhatsApp al formato internacional
function formatWhatsapp(num: string) {
  if (!num) return "";
  let n = num.replace(/\D/g, "");
  if (n.startsWith("09")) {
    return "+593" + n.slice(1);
  }
  if (n.startsWith("+593")) {
    return n;
  }
  if (n.startsWith("593")) {
    return "+" + n;
  }
  return n;
}

export default function DirectivaPage() {
  const { clubId } = useClubActivo();
  const [form, setForm] = useState({
    nombre: "",
    edad: "",
    nacimiento: "",
    cargo: cargos[0],
    whatsapp: ""
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [directiva, setDirectiva] = useState<any[]>([]);
  const editarDesdeUrlAplicado = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Generar PIN aleatorio
  // Cargar directiva en tiempo real
  useEffect(() => {
    const q = queryColeccionClub("directivaClub", clubId);
    if (!q) return;
    const unsub = onSnapshot(q, snap => {
      setDirectiva(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [clubId]);

  const handleSave = async () => {
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      alert(prep.mensaje);
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        const pinActual = directiva.find((d) => d.id === editId)?.pin;
        if (form.cargo === "Director/a") {
          const val = await validarPinDisponible("1902", [
            { coleccion: "directivaClub", docId: editId },
          ]);
          if (!val.ok && pinActual !== "1902") {
            alert(val.mensaje);
            setLoading(false);
            return;
          }
        }
        await updateDoc(doc(db, "directivaClub", editId), {
          ...form,
          ...(form.cargo === "Director/a" ? { pin: "1902" } : {}),
        });
        alert("Directiva actualizada correctamente.");
        setEditId(null);
      } else {
        const pin =
          form.cargo === "Director/a" ? "1902" : await generarPinUnicoClub();
        if (form.cargo === "Director/a") {
          const val = await validarPinDisponible("1902");
          if (!val.ok) {
            alert(val.mensaje);
            setLoading(false);
            return;
          }
        }
        await addDoc(collection(db, "directivaClub"), datosConClub({
          ...form,
          pin,
          fechaRegistro: formatFechaDDMMYYYY(new Date())
        }, clubId));
        alert("Directiva registrada correctamente. PIN: " + pin);
      }
      setForm({ nombre: "", edad: "", nacimiento: "", cargo: cargos[0], whatsapp: "" });
    } catch (err) {
      alert(mensajeErrorFirestore(err));
    }
    setLoading(false);
  };

  const handleEdit = (d: { id: string; nombre: string; edad: string; nacimiento?: string; cargo: string; whatsapp: string }) => {
    setForm({
      nombre: d.nombre,
      edad: d.edad,
      nacimiento: d.nacimiento || "",
      cargo: d.cargo,
      whatsapp: d.whatsapp
    });
    setEditId(d.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      document.getElementById("campo-nacimiento")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  useEffect(() => {
    if (editarDesdeUrlAplicado.current || directiva.length === 0) return;
    const id =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("editar")
        : null;
    if (!id) return;
    const d = directiva.find((x) => x.id === id);
    if (d) {
      editarDesdeUrlAplicado.current = true;
      handleEdit(d);
    }
  }, [directiva]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este miembro de la directiva?")) return;
    await deleteDoc(doc(db, "directivaClub", id));
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <button
        onClick={() => window.location.href = '/admin'}
        className="bg-fuchsia-600 text-white font-bold px-6 py-2 rounded-xl mb-6 hover:bg-fuchsia-800 transition-all"
      >
        <ArrowLeft className="inline mr-2" /> Retornar a Admin
      </button>
      <h1 className="text-2xl font-bold mb-6">Registrar Directiva del Club</h1>
      <form className="space-y-3 mb-8">
        <input
          name="nombre"
          placeholder="Nombre y Apellido"
          value={form.nombre}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        <input
          name="edad"
          placeholder="Edad"
          value={form.edad}
          onChange={handleChange}
          className="border p-2 w-full"
          type="number"
        />
        <input
          id="campo-nacimiento"
          name="nacimiento"
          type="date"
          value={form.nacimiento}
          onChange={handleChange}
          className="border p-2 w-full"
          aria-label="Fecha de nacimiento"
        />
        <select
          name="cargo"
          value={form.cargo}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          {cargos.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          name="whatsapp"
          placeholder="WhatsApp"
          value={form.whatsapp}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </form>
      <button
        onClick={handleSave}
        className="bg-fuchsia-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-fuchsia-900 transition-all"
        disabled={loading}
      >
        {editId ? "Actualizar Directiva" : "Guardar Directiva"}
      </button>

      {/* Lista de directiva registrada */}
      <div className="mt-10">
        <h2 className="font-bold mb-4 text-fuchsia-700">Directiva Registrada</h2>
        <ul className="space-y-3">
          {directiva.map(d => (
            <li key={d.id} className="bg-fuchsia-50 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 border border-fuchsia-200">
              <div className="flex-1">
                <span className="font-bold text-fuchsia-800">{d.nombre}</span> <span className="text-slate-500">({d.cargo})</span><br />
                <span className="text-xs text-slate-400">
                  Edad: {d.edad}
                  {d.nacimiento ? ` · Nac.: ${formatFechaDDMMYYYY(d.nacimiento)}` : ""}
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="bg-fuchsia-100 text-fuchsia-800 px-3 py-1 rounded-lg font-mono">PIN: {d.pin}</span>
                <a
                  href={`https://wa.me/${formatWhatsapp(d.whatsapp)}?text=Hola%20${encodeURIComponent(d.nombre)}%2C%20tu%20PIN%20de%20acceso%20es%20${d.pin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-800 transition-all"
                >
                  Enviar PIN por WhatsApp
                </a>
                <button
                  onClick={() => handleEdit(d)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-yellow-700 transition-all"
                >Editar</button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-red-800 transition-all"
                >Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}