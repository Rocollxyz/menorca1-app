# Menorca1 - App de MediaCMS

App móvil para Android e iOS que consume la API de MediaCMS desde **media.menorca1.com**.

## Características

✅ **Exploración de videos** - Lista todos los videos disponibles  
✅ **Búsqueda** - Busca videos por título y descripción  
✅ **Categorías** - Filtrado por categorías  
✅ **Reproducción** - Player de video integrado con controles  
✅ **Infinite scroll** - Carga más videos al llegar al final  
✅ **Actualización** - Pull to refresh para recargar datos  

## Stack Tecnológico

- **Expo** - Framework React Native
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **expo-av** - Reproducción de video
- **TypeScript** - Type safety

## Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar en desarrollo

```bash
npm start
```

### 3. Abrir en dispositivo

- **iOS**: Presiona `i` para abrir en simulador (requiere macOS)
- **Android**: Presiona `a` para abrir en emulador
- **Expo Go**: Escanea el QR con tu teléfono

## Estructura del Proyecto

```
app/
├── (tabs)/
│   ├── index.tsx        # Pantalla principal de videos
│   ├── two.tsx          # Pantalla de búsqueda y categorías
│   └── _layout.tsx      # Layout de tabs
components/
├── VideoCard.tsx        # Tarjeta de video
└── VideoPlayer.tsx      # Player de video
services/
└── mediacms-api.ts      # Cliente API de MediaCMS
```

## API de MediaCMS

La app se conecta a: `https://media.menorca1.com/api`

### Endpoints principales

- `GET /videos/` - Listar videos
- `GET /videos/{id}/` - Detalles de video
- `GET /categories/` - Listar categorías
- `GET /videos/search/` - Buscar videos
- `POST /videos/{id}/views/` - Registrar visualización

## Próximos pasos

- [ ] Pantalla de detalles del video
- [ ] Historial de videos vistos
- [ ] Favoritos
- [ ] Reproducción en segundo plano
- [ ] Descarga de videos
- [ ] Soporte para subtítulos
- [ ] Dark mode mejorado

## Desarrollo

Para trabajar con Claude/IA en este proyecto:

1. **Exploración**: Pide que explore la estructura del proyecto
2. **Nuevas funciones**: Describe qué quieres agregar
3. **Debugging**: Comparte logs de error
4. **Refactoring**: Solicita mejorar código existente

## Comandos útiles

```bash
npm start              # Inicia servidor Expo
npm run android        # Abre en emulador Android
npm run ios            # Abre en simulador iOS
npm run web            # Abre en navegador
npm run lint           # Ejecuta ESLint
```

## Notas

- La app usa el endpoint de API de MediaCMS. Verifica que `media.menorca1.com` esté accesible.
- Los videos se cargan bajo demanda con paginación.
- El cliente HTTP está configurado con timeout de 10 segundos.

---

**Creado con ❤️ usando Expo**
