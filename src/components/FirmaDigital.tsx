"use client"

import SignatureCanvas from "react-signature-canvas"
import { useRef } from "react"

interface FirmaDigitalProps {
  onSave: (firmaBase64: string) => void;
}

export default function FirmaDigital({ onSave }: FirmaDigitalProps) {

  const sigRef = useRef(null)

  const guardarFirma = () => {
    const firma = sigRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png")

    onSave(firma)
  }

  return (
    <div>
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{
          width: 350,
          height: 150,
          className: "border rounded"
        }}
      />
      <div className="flex gap-2 mt-2">
        <button onClick={guardarFirma}>
          Guardar firma
        </button>
        <button onClick={() => sigRef.current.clear()}>
          Limpiar
        </button>
      </div>
    </div>
  )
}
