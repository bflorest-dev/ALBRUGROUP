/**
 * Simple Tailwind test component - if this has colors, Tailwind is working
 */
export function TailwindTest() {
  return (
    <div className="p-8 bg-blue-500 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Tailwind Test</h2>
      <p className="text-red-300">
        Si ves AZUL de fondo con texto BLANCO y texto rojo aquí, Tailwind SÍ está funcionando.
      </p>
      <button className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
        Botón de prueba
      </button>
    </div>
  )
}
