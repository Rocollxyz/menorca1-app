# menorca1-app

App móvil para Android e iOS conectada a una instalación de [MediaCMS](https://mediacms.io).

## Características

- Exploración de vídeos con infinite scroll y pull to refresh
- Búsqueda por texto y filtrado por categorías
- Reproducción de vídeo y audio (HLS + MP4)
- Login / Logout con token de autenticación
- Subida de vídeos y audio
- Perfil de usuario con estadísticas
- Historial de vídeos vistos (sincronizado con el servidor)
- Likes, dislikes y comentarios
- Vídeos relacionados, categorías y tags

## Stack

- Expo SDK 54 / React Native
- Expo Router (navegación por ficheros)
- expo-video (reproducción HLS)
- Axios (cliente API)
- AsyncStorage (persistencia del token)
- TypeScript

## Instalación y desarrollo

### 1. Clonar el repositorio

```bash
git clone https://github.com/Rocollxyz/menorca1-app
cd menorca1-app
```

### 2. Configurar el servidor

```bash
cp .env.example .env
```

Edita `.env` y pon la URL de tu servidor MediaCMS:

```
EXPO_PUBLIC_API_BASE=https://tu-servidor-mediacms.com
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Iniciar en desarrollo

```bash
npx expo start
```

Escanea el QR con **Expo Go** en tu móvil (Android o iOS).

## Publicar en las tiendas

### Requisitos previos

- Cuenta en [expo.dev](https://expo.dev)
- `eas-cli` instalado: `npm install -g eas-cli`
- Cuenta Google Play Developer (Android, pago único $25)
- Cuenta Apple Developer (iOS, $99/año)

### Build de producción

```bash
npx expo login
eas build:configure
```

**Android (Play Store):**
```bash
eas build --platform android --profile production
```

**iOS (App Store):**
```bash
eas build --platform ios --profile production
```

Los ficheros `.aab` (Android) e `.ipa` (iOS) se generan en la nube y se descargan desde [expo.dev](https://expo.dev).

## Estructura del proyecto

```
app/
├── (tabs)/
│   ├── index.tsx       # Inicio — listado de vídeos
│   ├── search.tsx      # Búsqueda y categorías
│   ├── upload.tsx      # Subida de contenido
│   ├── profile.tsx     # Perfil, historial y logout
│   └── _layout.tsx     # Layout de tabs
├── player.tsx          # Reproductor de vídeo/audio
├── login.tsx           # Pantalla de login
└── _layout.tsx         # Layout raíz
components/
└── MediaCard.tsx       # Tarjeta de vídeo
context/
└── AuthContext.tsx     # Estado global de autenticación
services/
└── mediacms-api.ts     # Cliente API de MediaCMS
```

## Notas

- Los usuarios deben estar aprobados en el panel de administración de MediaCMS para poder iniciar sesión.
- El `.env` nunca se sube a GitHub — usa `.env.example` como plantilla.
