const NOMBRE_CACHE = 'gemini-tts-v1';
const ACTIVOS = [
  '/gemini-tts-studio/',
  '/gemini-tts-studio/index.html',
  '/gemini-tts-studio/icon.svg'
];

auto.addEventListener('instalar', (evento) => {
  evento.esperaHasta(
    cachés.abierto(NOMBRE_CACHE).entonces((caché) => cache.agregar todo(ACTIVOS))
  );
  auto.saltarEsperando();
});

auto.addEventListener('activar', (evento) => {
  evento.esperaHasta(
    cachés.claves().entonces((claves) =>
      Promesa.todos(
        llaves.mapa((clave) => {
          si (clave !== NOMBRE_CACHE) devuelve cachés.eliminatorio(clave);
        })
      )
    )
  );
  auto.clientes.reclamar();
});

auto.addEventListener('obtener', (evento) => {
  const url = nueva URL(evento.solicititud.url);

  // Si la petición es externa (API de Gemini) o dinámica: Network First
  si (url.origen !== ubicación.origen) {
    evento.responderCon(
      fetch(evento.solicititud).atrapar(() => cachés.partido(evento.solicititud))
    );
    retorno;
  }

  // Recursos estáticos locales: Caché Primera actualización en segundo plano
  evento.responderCon(
    cachés.partido(evento.solicititud).entonces((respuesta en caché) => {
      const fetchPromise = fetch(evento.solicititud).entonces((respuesta de rojo) => {
        cachés.abierto(NOMBRE_CACHE).entonces((caché) => {
          cache.put(evento.solicititud, respuesta de rojo.clon());
        });
        devuelve respuesta de rojo;
      }).atrapar(() => {});

      devuelve respuesta en caché || fetchPromise;
    })
  );
});
