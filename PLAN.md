# PROYECTO: ENGLISH QUEST

## Objetivo

Crear una aplicación web de aprendizaje de inglés tipo videojuego, moderna, inmersiva y responsiva, desarrollada únicamente con:

- HTML5
- CSS3
- JavaScript Vanilla (ES6+)

No utilizar frameworks externos.

La aplicación debe poder desplegarse gratuitamente en GitHub Pages.

---

# API DE TRADUCCIÓN

Utilizar la API:

https://api.mymemory.translated.net/get?q={WORD}&langpair=en|es

Ejemplo:

https://api.mymemory.translated.net/get?q=hello&langpair=en|es

La aplicación debe consumir esta API dinámicamente.

---

# ARQUITECTURA

Aplicar principios de Clean Architecture.

Estructura:

```text
/src
│
├── index.html
│
├── css
│   ├── main.css
│   ├── components.css
│   ├── animations.css
│   └── themes.css
│
├── js
│   ├── app.js
│   │
│   ├── core
│   │   ├── constants.js
│   │   ├── config.js
│   │   └── helpers.js
│   │
│   ├── services
│   │   ├── translationService.js
│   │   ├── audioService.js
│   │   └── storageService.js
│   │
│   ├── repositories
│   │   └── wordRepository.js
│   │
│   ├── game
│   │   ├── gameEngine.js
│   │   ├── scoreManager.js
│   │   ├── levelManager.js
│   │   └── achievementManager.js
│   │
│   ├── ui
│   │   ├── dashboard.js
│   │   ├── modal.js
│   │   ├── progressBar.js
│   │   └── notifications.js
│   │
│   └── pages
│       ├── home.js
│       ├── game.js
│       ├── profile.js
│       └── leaderboard.js
│
└── assets
    ├── images
    ├── sounds
    └── icons
```

---

# DISEÑO VISUAL

Inspirado en:

- Duolingo
- Memrise
- LingQ
- Juegos RPG modernos

Estilo:

- Moderno
- Profesional
- Muy visual
- Gamificado
- Colores vibrantes
- Animaciones fluidas
- Modo claro
- Modo oscuro

Utilizar:

- Glassmorphism
- Neumorphism ligero
- Microanimaciones
- Transiciones suaves

---

# FUNCIONALIDADES

## Sistema de Usuario

Generar ID único:

```javascript
const userId = crypto.randomUUID();
```

Guardar progreso en LocalStorage.

Datos:

- Id
- Nombre
- Nivel
- XP
- Monedas
- Racha diaria
- Palabras aprendidas
- Logros

---

# SISTEMA RPG

Cada palabra aprendida da:

- XP
- Monedas
- Bonus

Ejemplo:

Palabra correcta:

+10 XP
+5 Coins

Racha:

5 correctas seguidas:

+50 XP

---

# NIVELES

Nivel 1 - Beginner
Nivel 2 - Explorer
Nivel 3 - Adventurer
Nivel 4 - Warrior
Nivel 5 - Master
Nivel 6 - Legend

Sistema automático de experiencia.

---

# MODOS DE JUEGO

## 1. Traducción

Mostrar:

```text
hello
```

Opciones:

```text
Hola
Casa
Perro
Agua
```

---

## 2. Memoria

Cartas volteables.

Encontrar parejas:

```text
House -> Casa
Dog -> Perro
```

---

## 3. Escritura

Mostrar:

```text
Hola
```

Usuario escribe:

```text
Hello
```

Validar.

---

## 4. Listening

Usar:

SpeechSynthesis API

Pronunciar:

```javascript
speechSynthesis.speak(...)
```

Usuario selecciona la palabra correcta.

---

## 5. Desafío Contrarreloj

60 segundos.

Mayor puntuación posible.

---

# SISTEMA DE LOGROS

Primer paso

Aprender 10 palabras.

Explorador

Aprender 100 palabras.

Maestro

Aprender 1000 palabras.

Leyenda

Completar todos los niveles.

---

# DASHBOARD

Mostrar:

- Nivel
- XP
- Monedas
- Racha
- Logros
- Ranking local

---

# ESTADÍSTICAS

Gráficos:

- Precisión
- Palabras aprendidas
- Tiempo de estudio
- Nivel actual

Utilizar Canvas API.

No frameworks.

---

# BASE DE PALABRAS

Generar inicialmente:

- 1000 palabras comunes
- Categorías

Categorías:

- Saludos
- Trabajo
- Tecnología
- Viajes
- Familia
- Negocios
- Comida
- Animales
- Verbos
- Adjetivos

---

# ACCESIBILIDAD

Cumplir:

WCAG AA

Soportar:

- Teclado
- Pantallas táctiles
- Responsive

---

# RENDIMIENTO

Objetivos:

- Lighthouse > 95
- First Load < 2 segundos
- Mobile Friendly

---

# GITHUB PAGES

La solución debe funcionar directamente en GitHub Pages sin backend.

Todo el almacenamiento debe hacerse con:

```javascript
localStorage
```

---

# ENTREGABLE

Generar el proyecto completo.

No generar ejemplos.

No generar pseudocódigo.

Generar código funcional listo para ejecutar.

Cada archivo debe estar completamente implementado.

Incluir comentarios profesionales.

Aplicar SOLID donde sea posible en JavaScript.

El resultado debe sentirse como una aplicación comercial lista para producción.
