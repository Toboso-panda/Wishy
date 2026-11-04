# Wishy — llistes de regals familiars

Aplicació autohostejada per crear esdeveniments familiars, compartir llistes de regals i coordinar reserves. Interfície en català.

El registre i l’inici de sessió fan servir correu i contrasenya (mínim 8 caràcters); no s’envien ni es verifiquen correus. No hi ha recuperació de contrasenya en aquesta versió.

## Executar amb Docker

1. Copia `.env.example` a `.env`.
2. Genera un secret per a les sessions i configura’l a `.env`:

   ```bash
   openssl rand -hex 32
   ```

3. (Recomanat) Canvia també `POSTGRES_PASSWORD` a `.env`.
4. Executa:

   ```bash
   docker compose up --build
   ```

5. Obre [http://localhost:3000](http://localhost:3000).

Per accedir des de Tailscale, fes servir la IP o el nom del NAS dins la tailnet, per exemple `http://nas:3000`. Amb accés HTTP local, deixa `COOKIE_SECURE=false`; si configures HTTPS, posa-ho a `true`.

La base de dades persisteix al volum Docker `pgdata` i les imatges al volum `uploads`. Les migracions s’apliquen en iniciar el contenidor. El canvi de perfils provisionals a comptes esborra les dades de Wishy existents per començar net, tal com s’ha demanat. Per eliminar també totes les imatges pujades, executa una vegada `docker compose down -v` abans de tornar a iniciar; això elimina irreversiblement els volums de la base de dades i de les imatges.

El mode sorpresa amaga l’estat de reserva i el progrés només al destinatari; la resta de convidats els veuen per coordinar-se. Es pot activar o desactivar a **Configuració → Mode sorpresa**. Les imatges acceptades són JPG/JPEG, PNG, WEBP i GIF, fins a 5 MB.

Les targetes de regal permeten marcar imprescindibles amb una estrella i reordenar-les amb les fletxes. Les peticions d’ajuda admeten un objectiu de persones; el regal compta com a agafat en arribar-hi. Els administradors poden eliminar membres i qualsevol membre (excepte el propietari de l’esdeveniment) pot abandonar-lo.

Els administradors veuen i reserven regals com la resta de membres. A **Configuració → Membres** poden donar-se accés de responsable a tots els perfils; a **Perfils familiars i responsables** poden assignar diversos responsables per perfil i decidir si poden veure la llista. Els perfils familiars poden començar sense compte i activar-ne un després amb l’enllaç de reclamació. Els regals creats per un responsable queden amagats al destinatari, però visibles per a la resta de convidats.

## Desenvolupament local

Cal Node.js 22 i PostgreSQL. Copia `.env.example` a `.env`, instal·la dependències amb `npm install`, aplica les migracions amb `npx prisma migrate dev` i inicia amb `npm run dev`.
