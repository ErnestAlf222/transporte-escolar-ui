# Transporte Escolar · UI

Panel de administración y portal del cliente de un servicio de transporte escolar.

```mermaid
flowchart LR
    N["Navegador"]

    subgraph Front["Frontend (Vue)"]
        A["Panel admin<br/>dashboard, prospectos, clientes,<br/>pagos, conductores, familias,<br/>asistencias, casos especiales"]
        P["Portal del cliente<br/>acceso, inicio, perfil"]
        S["shared<br/>UI, cliente HTTP,<br/>SSE, utilidades"]
    end

    API["API Go"]

    N --> A
    N --> P
    A --> S
    P --> S
    S -- "HTTP + token" --> API
    API -. "SSE: tiempo real" .-> S
```

El panel y el portal usan sesiones separadas; ambos pasan por `shared` para hablar con la API y
reciben de ella los avisos en tiempo real (por ejemplo, cuando cambia un pago).

Más detalle (instalación, scripts, arquitectura y verificación): [docs/guia-del-proyecto.md](docs/guia-del-proyecto.md).
