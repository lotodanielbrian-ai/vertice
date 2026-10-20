export function BenchmarkSources({ source }: { source?: string | null }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs leading-relaxed text-slate-400">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">De dónde salen estos números</h3>
      <p className="mt-2">
        Los FPS no son de un juego puntual. El catálogo no guarda una suite de juegos, así que no se inventan títulos.
        La escala sale de reseñas públicas de TechPowerUp, ComputerBase y Tom's Hardware: el raster en 1440p está anclado para que la RTX 5090 marque 175.5 fps, y 1080p, 4K y ray tracing usan el factor de esa misma escala.
      </p>
      <p className="mt-2">
        Mostrar el rendimiento a la vista, en la ficha de cada pieza, está inspirado en la vitrina de{' '}
        <a className="underline" href="https://www.michaelpcmaster.com/" target="_blank" rel="noreferrer">Michael Quesada</a>.
        No se copia el texto de su sitio.
      </p>
      <p className="mt-2">El precio de esta tabla es el de lanzamiento en dólares del catálogo, distinto del precio en pesos de las tiendas.</p>
      {source && (
        <p className="mt-2">
          Ficha de referencia:{' '}
          <a className="underline" href={source} target="_blank" rel="noreferrer">TechPowerUp</a>.
        </p>
      )}
    </section>
  )
}
