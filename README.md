# Transporte Escolar · UI

Panel administrativo web para la gestión de un servicio de transporte escolar: clientes, prospectos, pagos semanales, asistencias y conductores.

Consume una API REST desarrollada en Go (repositorio independiente).

## Stack

- Vue 3 + TypeScript
- Tailwind CSS v4
- Pinia
- Vue Router
- Vite

## Instalación

```bash
git clone https://github.com/ErnestAlf222/transporte-escolar-ui.git
cd transporte-escolar-ui
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno

| Variable       | Descripción                |
| -------------- | -------------------------- |
| `VITE_API_URL` | URL base de la API backend |

## Scripts

| Comando           | Descripción            |
| ----------------- | ---------------------- |
| `npm run dev`     | Servidor de desarrollo |
| `npm run build`   | Build de producción    |
| `npm run preview` | Previsualiza el build  |
| `npm run lint`    | Linting                |
| `npm run format`  | Formato de código      |
