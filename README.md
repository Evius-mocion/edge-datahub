<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->
# Data Hub Local - Endpoints

Este servicio expone una API local para gestionar asistentes, experiencias y redenciones para eventos. Base path: `api/edge`.


## Instalar dependencias

```bash
$ npm install
```

## Correr projecto

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```


## Usar con Docker

Instrucciones rápidas para ejecutar la aplicación usando Docker.

1. Construir la imagen:
```bash
docker build -t data-hub-local:latest .  
```
or
```bash
docker compose up --build -d
```

2. Ejecutar el contenedor (ejemplo):
```bash
docker compose up -d
```
- Ajustar API_BASE y TOKEN según su entorno.
- El servicio NestJS expone por defecto el puerto 3000.

Endpoints principales
- POST /attendees/register
  - Registra un asistente localmente.
  - Payload (JSON):
    {
      "eventId": "string",
      "fullName": "Nombre Apellido",
      "email": "user@example.com",
      "country": "PAIS",
      "city": "CIUDAD",
      "properties": {}
    }
  - Respuesta: mensaje y objeto attendee. Genera un código determinístico basado en el email.

- GET /attendees/:code
  - Buscar asistente por código.
  - Respuesta: mensaje y objeto attendee.

- POST /experience
  - Registrar o actualizar una jugada en una experiencia.
  - Payload (JSON):
    {
      "eventExperienceId": "string",
      "attendeeId": "string",
      "play_timestamp": "2025-10-17T12:00:00.000Z",
      "data": {},
      "bonusScore": 0,
      "modePoints": "firstTry" | "betterTry",
      "score": 100
    }

- POST /redemption
  - Redimir puntos para un asistente.
  - Payload (JSON):
    {
      "eventId": "string",
      "attendeeId": "string",
      "pointsRedeemed": 100,
      "reason": "Motivo de la redención"
    }

- POST /attendees_status
  - Obtener estado de un asistente (por attendeeId, code o email).
  - Payload (JSON) ejemplo:
    { "attendeeId": "string" }
    o { "code": "12345" }
    o { "email": "user@example.com" }
  - Respuesta incluye puntos totales calculados localmente.

- POST /sync
  - Inicia sincronización con la nube para un evento.
  - Payload:
    { "eventId": "string" }
  - Respuesta: { message: 'Sync initiated', eventId }

- GET /health
  - Comprueba estado local y conectividad con la nube.
  - Respuesta incluye cloudConnected y timestamp.

Notas
- El código generado para asistentes es determinístico para el mismo email (normalizar mayúsculas/minúsculas o espacios afecta el resultado).
- Validaciones y errores retornan excepciones HTTP apropiadas (400/404).
- Para pruebas con curl, usar Content-Type: application/json y el body JSON correspondiente.

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).