# PC Gamers Argentina

Armado de PC en español: showroom, compatibilidad, tier y precios en pesos tomados de las tiendas que publica HardGamers. El enlace «Ver en …» abre el producto en esa tienda.

El rediseño visual y otros ajustes de producto quedan pendientes. El aspecto actual es el de esta versión.

## Qué incluye

- Showroom de GPUs y CPUs, ficha por pieza y comparativa.
- Ensamble por pasos, con socket, DDR, slots de RAM, discos, fuente y cooler.
- Ofertas de tienda con foto, precio en pesos y nombre de la tienda.
- Filtros de núcleos, VRAM, memoria de video y tamaño de gabinete.
- Orden de menor a mayor precio y de mayor a menor.
- Cierre del armado con resumen, tiendas, tier y total, sin obligar a completar todas las piezas.

## Requisitos

- Node.js 20 o superior
- pnpm 10 (el repo fija `pnpm@10.15.1` con Corepack)
- Postgres 16. `docker compose up -d` levanta la base y Adminer en el puerto 8080.

## Puesta en marcha

```bash
corepack pnpm install
copy .env.example .env
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev:api
corepack pnpm dev:web
```

La web queda en http://localhost:5173 y la API en http://localhost:3001. Vite reenvía `/api` hacia la API.

`DATABASE_URL` está en `.env.example`: `postgres://pcbuilder:pcbuilder@localhost:5432/pcbuilder`.

## Pruebas

```bash
corepack pnpm test
```

## Sitio publicado

La GitHub Page publica solo el front. El catálogo, el tier y los precios de tienda necesitan la API y Postgres; en la página estática esas llamadas no tienen servidor detrás.

## Pendiente

- Rediseño visual.
- Ajustes de producto que se definan después de esta versión.
