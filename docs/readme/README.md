# Diagrama UML Colaborativo

Una aplicación web para crear y editar diagramas UML de manera colaborativa en tiempo real, construida con React, TypeScript y JointJS.

## Características

- **Editor de Diagramas UML**: Crea diagramas de clases, interfaces y relaciones UML
- **Colaboración en Tiempo Real**: Múltiples usuarios pueden editar el mismo diagrama simultáneamente
- **Autenticación de Usuarios**: Sistema de login y registro
- **Dashboard Personal**: Gestiona tus diagramas y visualiza invitaciones
- **Interfaz Moderna**: Diseño responsivo con gradientes y animaciones
- **Socket.IO**: Comunicación en tiempo real entre clientes

## Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **UI/UX**: CSS Modules, Gradientes modernos
- **Diagramas**: JointJS para renderizado de diagramas UML
- **Tiempo Real**: Socket.IO para colaboración
- **Routing**: React Router DOM
- **Estado**: React Hooks y Context API
- **Backend**: Express.js (servidor de desarrollo)

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Header.tsx      # Cabecera con navegación
│   ├── Toolbar.tsx     # Barra de herramientas del editor
│   ├── UMLDiagram.tsx  # Componente principal del diagrama
│   └── ...
├── pages/              # Páginas de la aplicación
│   ├── Login.tsx       # Página de inicio de sesión
│   ├── Register.tsx    # Página de registro
│   ├── Dashboard.tsx   # Dashboard del usuario
│   └── Auth.css        # Estilos compartidos de autenticación
├── hooks/              # Hooks personalizados
│   ├── useSocket.ts    # Gestión de conexión Socket.IO
│   ├── useDiagramSync.ts # Sincronización de diagramas
│   └── ...
├── types/              # Definiciones TypeScript
├── utils/              # Utilidades
└── constants/          # Constantes y plantillas
```

## Rutas de la Aplicación

- `/` - Dashboard (redirige a login si no autenticado)
- `/login` - Inicio de sesión
- `/register` - Registro de nuevos usuarios
- `/dashboard` - Panel principal del usuario
- `/diagrams` - Editor de diagramas UML
- `/diagrams/:id` - Editor con diagrama específico

## Instalación y Uso

1. **Instalar dependencias**:

   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:

   ```bash
   npm run dev
   ```

3. **Acceder a la aplicación**:
   - Abrir http://localhost:5173 en el navegador
   - Registrarse o iniciar sesión
   - Crear y editar diagramas UML

## Desarrollo

### Comandos Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Vista previa de la build de producción
- `npm run lint` - Ejecuta ESLint para verificar código

### Arquitectura

La aplicación sigue una arquitectura de componentes modulares:

- **Componentes Presentacionales**: Encargados de la UI (Toolbar, PropertiesPanel, etc.)
- **Componentes de Página**: Páginas principales (Login, Dashboard, App)
- **Hooks Personalizados**: Lógica reutilizable (useSocket, useDiagramSync)
- **Utilidades**: Funciones helper y constantes
- **Tipos**: Definiciones TypeScript para type safety

### Colaboración en Tiempo Real

El sistema de colaboración utiliza Socket.IO para mantener sincronizados los diagramas entre múltiples usuarios:

- Cambios en tiempo real
- Indicadores de conexión
- Sistema de notificaciones
- Historial de operaciones

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
   languageOptions: {
   parserOptions: {
   project: ['./tsconfig.node.json', './tsconfig.app.json'],
   tsconfigRootDir: import.meta.dirname,
   },
   // other options...
   },
   },
   ])

````

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
````
