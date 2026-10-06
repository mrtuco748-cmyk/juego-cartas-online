# LOOP

Juego de cartas por turnos **1v1 con temática medieval**, multijugador en tiempo
real. Cada jugador crea un personaje con estadísticas propias, adquiere cartas
en una tienda y combate contra otro jugador por Socket.IO.

**Deploy:** Railway · **PWA instalable** · **Móvil first**

---

## Qué es el juego

Combate por turnos donde cada jugador tiene **2 acciones por turno** y energía
que se regenera según su Magia. En cada turno podés:

- **Atacar** (dado + Fuerza − Resistencia rival)
- **Usar una carta** de skill activa (consume energía)
- **Descansar** (recupera HP y energía)
- **Acciones de inventario e invocación**

Gana quien reduzca el HP del rival a 0. El ganador recibe **XP**, sube de nivel y
distribuye puntos de estadística.

### Estadísticas del personaje

Cinco estadísticas base: **Fuerza**, **Resistencia**, **Velocidad**, **Magia** y
**Suerte**. Máximo 3 puntos por asignación.

### Clases

**18 clases** con modificadores únicos (bonificaciones de HP, mods de stats,
efectos en el primer turno, tipo de clase). Ejemplos de bonificación
sistemática: si sos de tipo físico y el rival de tipo técnico, recibís un
modificador.

---

## Sistemas de combate

### Motor de habilidades

**21 skills activas** y **18 pasivas**, definidas en una tabla de datos con
nombre, coste de energía, efecto y tag de combo.

Efectos implementados en el motor:

| Categoría | Efectos |
|---|---|
| Daño | Porcentaje, daño verdadero (ignora escudo), daño en área, doble ataque |
| Sanación | Curación porcentual |
| Defensa | Escudo, reflejos de daño, bonus de resistencia |
| Control | Aturdimiento, silencio, congelamiento, sangrado |
| Buff/Debuff | +Fuerza, +Resistencia con duración |
| Robos | Robo de vida (lifesteal) |
| Especiales | Invocación de criaturas, sacrificio |

Las **pasivas** (hasta 4 por personaje) se disparan automáticamente según su
trigger.

### Sistema de combos

Cada skill tiene un tag: **Físico**, **Técnico**, **Mental** o **Instintivo**.
Al ejecutar dos acciones en un turno, el tag de la primera se combina con el de
la segunda y activa un efecto extra.

**16 combinaciones** definidas en `combos.js`, con efectos sinérgicos entre
pares de tags. Si el jugador usa `POSE`, el combo se interrumpe.

### Cartas de fortuna

Cada **7 turnos** (más una al inicio) se activa una carta de **Fortuna** que
altera las reglas del combate:

- Intercambia curaciones y daño
- Invierte las estadísticas
- Otorga inmunidad
- Ruleta rusa

**30 cartas** definidas en `fortune.js`.

### Tienda e inventario

- Tienda de cartas activas y pasivas, pagadas con energía
- Sistema de **crafteo** con recetas
- Cofres
- Inventario con **capacidad y peso** como límites reales
- Equipar/desequipar, efectos on-hit

---

## Arquitectura

**Cliente-servidor con autoridad total del servidor.** El cliente es
interfaz pura: nunca calcula daño ni decide el resultado.

### Servidor — Node.js + Express + Socket.IO

```
server.js                    Punto de entrada; orquesta todo
server/models/Cuenta.js      Modelo Mongoose: cuentas, personajes, inventario
server/combat/engine.js      SKILLS_DATA, CLASS_DATA, GameProcessor
server/combat/combos.js      Tabla de combos y aplicación de sinergias
server/combat/fortune.js     30 cartas de fortuna
server/routes/auth.js        Registro, login, reconexión, perfil
server/routes/characters.js  Crear/eliminar personaje, stats, loadout
server/routes/shop.js        Tienda y compra de cartas
```

- **Express** para la API y archivos estáticos
- **Socket.IO** para toda la comunicación en tiempo real
- **MongoDB + Mongoose** para cuentas, personajes, inventario y progreso
- **bcrypt** para hash de contraseñas
- **Partidas en memoria**: las partidas activas viven en un objeto `partidas{}`
  en el servidor, no en la base de datos, porque son estado de tiempo real
- Cola de espera, matchmaking por nombre, modo práctica contra bot
- Limpieza periódica de partidas huérfanas

El handler `ejecutarAccion` centraliza el combate: más de 20 tipos de acción,
procesamiento de daño de cartas con escudo, pasivas y reflejo, combos, turnos,
`frozen skip` y fortuna.

### Cliente — HTML/CSS/JS vanilla

Sin framework, sin build, **una sola página**.

```
public/index.html        Estructura, estilos, pantallas y AudioManager
public/clienteCombate.js Interfaz de combate, render, drag-to-use táctil
public/ui-card.js        Utilidades de render de cartas en DOM
public/sw.js             Service Worker de la PWA
public/manifest.json     Manifest de la PWA
```

- **12 pantallas**: splash, auth, menú, personajes, creación, selección, espera,
  tienda, inventario, configuración, combate
- **Estética medieval**: paleta dark/gold/brown, tipografía Cinzel
- **Mobile-first**: drag-to-use de cartas con eventos touch, navegación con
  botones siempre visibles
- **AudioManager**: música de menú y batalla con fade in/out, mute y slider de
  volumen
- **Effects de combate**: daño flotante, iconos de estados, notificaciones de
  combo, cola de logs con delay
- **Stats detalladas**: panel con el desglose de cada estadística y su origen

### Flujo de comunicación

```
1. Cliente se conecta por Socket.IO
2. Login o registro
3. El jugador crea personajes y compra cartas en la tienda
4. Busca partida o entra en práctica contra bot
5. Cada acción se envía como evento ejecutarAccion
6. El servidor aplica daño, pasivas, fortuna y combos
7. Emite el estado actualizado a ambos jugadores
8. Al morir un jugador, la partida termina y se otorga XP
```

### PWA

- **Instalable** en el celular como app nativa
- El Service Worker cachea **solo los archivos de audio**; el HTML y el JS se
  obtienen siempre frescos (`network-first`), así los desplegues nuevos se ven
  de inmediato
- `skipWaiting()` y `clients.claim()` para actualización inmediata

---

## Cómo correrlo

Requiere **Node.js 18 o superior** y una **URI de MongoDB**.

```bash
npm install
MONGO_URI=tu_uri_de_mongodb node server.js
```

También podés usar un `.env` (ya está en `.gitignore`).

### Deploy

Configurado para **Railway**, con `Procfile` y `railway.toml`. El deploy es
automático al hacer push a `main`.

---

## Stack

- **Backend:** Node.js, Express, Socket.IO, MongoDB, Mongoose, bcrypt
- **Frontend:** HTML5, CSS3, JavaScript vanilla, Service Workers, Web Audio API
- **Infra:** Railway, MongoDB Atlas

## Recursos

- **Audio:** música de menú y batalla bajo licencia CC0; efectos de sonido
  propios del juego
- **Tipografía:** [Cinzel](https://fonts.google.com/specimen/Cinzel) (Google Fonts)
- **Icono:** SVG de espada medieval, original

## Documentación

`PROYECTO_ESTRUCTURA.txt` contiene la documentación técnica completa: detalle
archivo por archivo, catálogos de datos (skills, clases, cartas de fortuna,
combos) y el flujo de arquitectura.