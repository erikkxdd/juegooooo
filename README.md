# Turno de Noche

## Publicar la web

- **Netlify Drop:** entra en [app.netlify.com/drop](https://app.netlify.com/drop) y arrastra la carpeta `dist/` completa, con `index.html` en su raíz. Si el workspace no conserva `dist/` entre sesiones, usa `web-publicable/`, una copia idéntica lista para arrastrar. No arrastres la raíz del proyecto.
- **GitHub Pages automático:** sube `src/`, `public/`, los archivos de configuración, `index.html`, `package.json`, `package-lock.json` y `.github/workflows/deploy.yml` a la rama `main`. En el repositorio, entra en **Settings → Pages → Build and deployment → Source** y elige **GitHub Actions**. Cada push a `main` compila y publica automáticamente. Si el primer push fue anterior a esta configuración, ejecuta el workflow desde **Actions → Run workflow**. No necesitas subir `dist/` para este método.
- **Regenerar o probar en local:** con Node.js 22, ejecuta `npm ci` y `npm run build`. Sirve `dist/` por HTTP (por ejemplo, `npx vite preview`) en vez de abrir `index.html` con doble clic. Puedes publicar en la raíz o en una subcarpeta sin cambiar las rutas.

**Antes de hacerla pública:** `dist/` incluye las fotos de referencia y las imágenes de los personajes que usa el juego. Comprueba que tienes permiso para publicar esas imágenes.


Casa 3D explorable inspirada en las 13 fotografías de referencia. Sin historia, enemigos, mascotas ni interfaz de móvil.

```sh
npm ci
npm run dev
npm run build
```

Pulsa **Entrar en la casa**. WASD mueve, el ratón gira la vista, E interactúa a menos de 2,2 m, F alterna la linterna y Esc suelta el cursor. Si el navegador bloquea Pointer Lock en una vista incrustada, mantén pulsado el botón izquierdo y arrastra para mirar.

Desde la entrada se mira hacia el primer baño, con el dormitorio infantil a la derecha. El salón y la cocina se enfrentan a través del pasillo. el segundo pasillo gira a la izquierda y conduce al segundo baño y al dormitorio de los padres. Las dimensiones, los tramos no visibles y el interior del primer baño son estimaciones; no había plano ni mediciones. La puerta de salida y los acristalamientos exteriores delimitan el espacio jugable.

Las 13 imágenes se conservan en `public/fotos-casa/`. `HouseMaterials.ts` carga todas y aplica recortes de superficies sobre la geometría, en lugar de pegar fotos panorámicas enteras sobre las paredes. `HouseBuilder.ts` contiene la distribución, el mobiliario, las luces, las bisagras y las colisiones.

El detallado usa perfiles biselados, paños con geometría ondulada, tuberías curvadas, cerámica con relieve y espejos con reflejos de baja resolución. Las mallas estáticas opacas se agrupan por material y zona; las puertas, interruptores y espejos permanecen independientes. La resolución VHS sigue siendo de 854 × 480. El rendimiento efectivo depende de la GPU y del navegador.

## Fase 2

- **Shift** corre. **E** también sirve para observar espejos, televisor, impresora y mirilla, o acariciar a Lola cuando aparece la huella.
- **Tab** abre y cierra el teléfono sin detener la escena. El WhatsApp es local y simulado: lee el chat de Erik y elige una de las dos respuestas; no envía datos ni mensajes fuera del juego.
- Lola alterna `FOLLOW` e `IDLE` y usa la geometría de colisión actual para rodear muebles y esperar si se cierra una puerta. `EAT`, `ALERT_STARE` y `HIDE` quedan reservados, sin escenas de terror en esta fase.
- Los tres espejos usan `Reflector` a 256 × 256. El modelo completo de Yasmín está en una capa visible para la cámara virtual del espejo, no para la cámara principal.
- El audio se sintetiza con Web Audio tras pulsar **Entrar en la casa**. Las texturas de los personajes y el retrato del móvil son recortes de las referencias adjuntas, alojados localmente en `public/personajes/`.

## Fase 3A · Copia de Llave

Los actos 1 y 2 se gestionan en `src/story/StoryManager.ts`. Lee el primer mensaje de Erik con **Tab**. Usa **E** sobre el cuenco de la cocina y el pestillo de la entrada; tras completar ambas acciones, espera diez segundos. **E** también sirve para mirar por la mirilla, recoger la hoja de la impresora y guardarla tras examinarla. El aviso para Erik se redacta y se envía en el chat local. Sonidos, vibración compatible con el navegador y cambios de reloj se activan durante la partida; los eventos se reinician al recargar.

## Fase 3B · Invasión y desenlace

Al **enviar** el aviso a Erik empieza el punto de control de las **21:50**. Pulsa **Q** mirando a Lola o a menos de 2,2 m para calmarla. **C** o **Ctrl izquierdo** alternan la postura agachada; entra al hueco lateral de la litera en el dormitorio infantil. Mientras estás debajo no puedes ponerte de pie. Evita sacar el móvil en la misma habitación que el intruso. Tras una captura, el botón de reintento restaura el punto de control de la partida actual; no hace falta repetir la rutina. El botón del epílogo sí reinicia todo.

**Pulido final:** **Espacio** salta de pie; algunas superficies bajas, como las camas, permiten aterrizar encima. Usa **E** en la pantalla de la televisión del salón para encender o apagar su luz de espera. Al cargar, pulsa **JUGAR** en la pantalla de título para iniciar la partida y habilitar el audio.

### Menús CRT y ajustes

Desde **JUGAR** se inicia una partida nueva. **Esc** o **P** abren la pausa; **Reiniciar acto** vuelve al comienzo del acto actual y **Salir al menú** vuelve a la pantalla de título. Los ajustes están disponibles desde ambas pantallas y se guardan en el navegador. El navegador puede exigir un primer clic antes de reproducir el ambiente o los sonidos de la interfaz. Si no permite el bloqueo del ratón, puedes mantener pulsado y arrastrar sobre la escena para mirar.

Al llegar al epílogo por primera vez se desbloquea **Capítulos** en la portada. Permite empezar en **21:30**, **21:42** o **21:50**, con los acontecimientos previos preparados. **Reiniciar partida** y **Volver a jugar** regresan a las 21:30 sin recargar la página; **Reiniciar acto** conserva su función de volver al punto de control actual. Los ajustes y el desbloqueo se conservan en el navegador.
