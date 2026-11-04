# Prompt / especificació per generar una web de llistes de regals familiars

## 1. Objectiu

Crea una aplicació web autohostejada, pensada per executar-se en un NAS amb Docker, per gestionar llistes de regals familiars.

L’aplicació ha de servir per fer:

- Reis
- Aniversaris
- Bodes
- Altres esdeveniments familiars simples

No és un SaaS públic de moment. És una prova per usar en una família, accedint per LAN o Tailscale.

La interfície ha de ser en català.

No sobrecomplicis el producte. Implementa només el mínim necessari perquè sigui útil, robust i fàcil d’usar.

---

## 2. Abast del MVP

L’aplicació ha de permetre:

1. Crear esdeveniments familiars.
2. Convidar usuaris amb un enllaç d’invitació.
3. Crear usuaris provisionals només amb nom.
4. Gestionar llistes de regals.
5. Crear, editar i esborrar items.
6. Pujar una imatge opcional per item.
7. Marcar un item com a agafat.
8. Desmarcar un item.
9. Detectar qui ha reservat primer.
10. Permetre ajuda o regal compartit.
11. Veure visualment quins items estan agafats.
12. Veure el progrés d’una llista, per exemple `3/4`.
13. Permetre que un administrador/mediador pugui gestionar items en nom d’una altra persona.

No implementis de moment:

- Amic invisible.
- Pagaments.
- Notificacions per email.
- OAuth.
- Recuperació de contrasenya.
- Perfils socials.
- PWA avançada.
- Multi-tenant complex.
- Internacionalització.
- Sistema de permisos molt granular.

---

## 3. Stack tecnològic

Fes servir aquest stack:

- **React** amb **Next.js App Router**
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL**
- **Prisma ORM**
- **Docker** i **Docker Compose**
- Pujada d’imatges local amb Node/Next.js
- Sessions simples amb cookie firmada

No facis servir serveis externs per imatges. No facis servir S3, Cloudinary ni cap servei cloud.

No cal autenticació amb contrasenya de moment. Els usuaris seran provisionals per prova familiar. Si el model vol guardar contrasenyes opcionalment, pot fer-ho, però no ha de ser obligatori ni afegir fluxos complexos.

---

## 4. Tipus d’esdeveniments

Hi ha dos modes principals.

### 4.1. Mode `EVERY_MEMBER_LIST`

Cada membre de l’esdeveniment pot tenir la seva pròpia llista.

Cas d’ús:

> Reis - Família Martinez

En entrar a l’esdeveniment, es veuen tots els membres.

- Si un membre té llista buida, es mostra en gris/transparent.
- Si un membre té items actius, es mostra una fracció del tipus:

```text
3/4 agafats
```

On:

- El denominador és el número d’items actius.
- El numerador és el número d’items actius reservats.

Exemple:

```text
Reis - Família Martinez

- Pere: 0/0 → gris
- Marta: 3/4
- Avi Joan: 0/2
- Àvia Rosa: 1/1
```

### 4.2. Mode `SINGLE_LIST`

Només un membre té llista.

Casos d’ús:

- Aniversari
- Boda
- Celebració on hi ha una persona o parella principal

En aquest mode, hi ha un `primaryListOwner`.

Els altres membres poden veure i reservar items, però la llista principal és només la del membre designat.

Els administradors poden gestionar aquesta llista.

---

## 5. Rols

Hi ha tres rols:

### `OWNER`

- Creat per qui crea l’esdeveniment.
- Pot editar configuració de l’esdeveniment.
- Pot regenerar l’enllaç d’invitació.
- Pot fer administrador a altres membres.
- Pot editar qualsevol item de l’esdeveniment.

### `ADMIN`

- Pot fer de mediador.
- Pot afegir, editar i esborrar items de qualsevol membre dins l’esdeveniment.
- Pot gestionar items encara que la persona no sàpiga usar l’app.
- Pot reservar i desreservar com a qualsevol membre normal.

### `MEMBER`

- Pot veure l’esdeveniment.
- Pot reservar items.
- Pot afegir items a la seva pròpia llista només si el mode és `EVERY_MEMBER_LIST`.
- En mode `SINGLE_LIST`, un membre normal només pot veure i reservar, excepte si és el `primaryListOwner`.

---

## 6. Usuaris provisionals

De moment, l’app no necessita login complet.

Flux:

1. Un usuari entra per primera vegada.
2. Se li demana nom.
3. Es crea un usuari provisional.
4. Es guarda una cookie de sessió.
5. L’usuari pot crear esdeveniments o unir-se a un esdeveniment amb invitació.

Camps mínims d’usuari:

```text
User
- id
- name
- email opcional
- passwordHash opcional
- isProvisional
- createdAt
```

Important:

- No cal recuperar contrasenya.
- No cal validació per email.
- No cal perfil avançat.
- Si l’usuari esborra cookies, pot tornar a entrar amb invitació i crear un altre usuari provisional. Això és acceptable per la prova.

---

## 7. Enllaços d’invitació

Cada esdeveniment té un token d’invitació.

Ruta:

```text
/join/[token]
```

Comportament:

1. Si l’usuari ja té sessió i ja és membre, redirigir a l’esdeveniment.
2. Si l’usuari ja té sessió però no és membre, unir-lo directament.
3. Si l’usuari no té sessió, mostrar un formulari simple per posar el nom.
4. Crear usuari provisional.
5. Crear la membresia a l’esdeveniment.
6. Redirigir a l’esdeveniment.

L’enllaç d’invitació s’ha de poder copiar des de la configuració de l’esdeveniment.

Els administradors han de poder regenerar el token si cal.

---

## 8. Pàgines mínimes

Genera com a mínim aquestes pàgines.

### `/`

Pàgina inicial.

Si l’usuari no té sessió:

- Mostrar formulari simple per introduir nom.
- Crear usuari provisional.

Si l’usuari té sessió:

- Mostrar llista d’esdeveniments als quals pertany.
- Botó per crear nou esdeveniment.

---

### `/events/new`

Formulari per crear esdeveniment.

Camps:

- Nom de l’esdeveniment, obligatori.
- Descripció opcional.
- Data opcional.
- Mode de llista:
  - `EVERY_MEMBER_LIST`
  - `SINGLE_LIST`

Si el mode és `SINGLE_LIST`, permetre seleccionar el membre principal. Inicialment pot ser el creador.

Exemple de nom:

```text
Reis - Família Martinez
```

---

### `/events/[eventId]`

Dashboard de l’esdeveniment.

Ha de mostrar:

- Nom de l’esdeveniment.
- Descripció opcional.
- Data opcional.
- Botó de configuració si l’usuari és `OWNER` o `ADMIN`.
- Botó còpia d’enllaç d’invitació si és `OWNER` o `ADMIN`.
- Llista de membres.

En mode `EVERY_MEMBER_LIST`:

- Mostrar tots els membres.
- Cada targeta de membre ha de mostrar:
  - Nom.
  - Estat de la llista.
  - Si té items actius: fracció `reservats / actius`.
  - Si té llista buida: aspecte gris/transparent.
- Les targetes han de ser clicables per veure la llista del membre.

En mode `SINGLE_LIST`:

- Mostrar el membre principal com a llista activa.
- Els altres membres poden aparèixer en gris o com a membres sense llista editable.
- La llista principal ha de ser fàcilment accessible.

---

### `/events/[eventId]/members/[memberId]`

Vista de la llista d’un membre.

Ha de mostrar:

- Nom del membre.
- Eventualment el nom de l’esdeveniment.
- Progrés: `x/y agafats`.
- Llista d’items actius ordenats.
- Si l’usuari té permisos d’edició:
  - Botó afegir item.
  - Botons per editar item.
  - Botons per esborrar item.
  - Botons per pujar/baixar ordre.
  - Botó per activar/desactivar item.

Si l’usuari no té permisos d’edició:

- Només pot veure items i reservar/desreservar segons regles.

---

### `/events/[eventId]/settings`

Configuració de l’esdeveniment.

Només per `OWNER` i potser `ADMIN` si es considera convenient.

Permetre editar:

- Nom.
- Descripció.
- Data.
- En mode `SINGLE_LIST`, canviar `primaryListOwner` entre els membres existents.
- Mostrar i regenerar enllaç d’invitació.
- Llista de membres.
- Canviar rol d’un membre entre `ADMIN` i `MEMBER`.
- El propietari no hauria de poder degradar-se a si mateix si és l’únic `OWNER`.

No cal eliminar membres en aquesta versió, però si s’implementa, que sigui opcional i segur.

---

### `/join/[token]`

Pàgina per unir-se a un esdeveniment.

Ja descrit anteriorment.

---

## 9. Model de dades

Fes servir PostgreSQL amb Prisma.

A continuació hi ha un esquema orientatiu. Adapta’l si cal, però respecta el comportament demanat.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

enum ListMode {
  EVERY_MEMBER_LIST
  SINGLE_LIST
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum ReservationMode {
  NONE
  HELP
  SHARED
}

model User {
  id            String   @id @default(cuid())
  name          String
  email         String?  @unique
  passwordHash  String?
  isProvisional Boolean  @default(true)
  createdAt     DateTime @default(now())

  memberships        EventMember[]
  ownedEvents        Event[]             @relation("EventOwner")
  primaryListEvents  Event[]             @relation("EventPrimaryListOwner")
  listItems          Item[]              @relation("ItemListOwner")
  createdItems       Item[]              @relation("ItemCreatedBy")
  reservedItems      Item[]              @relation("ItemReservedBy")
  contributions      ItemContribution[]
}

model Event {
  id                 String    @id @default(cuid())
  name               String
  description        String?
  date               DateTime?
  listMode           ListMode  @default(EVERY_MEMBER_LIST)
  primaryListOwnerId String?
  inviteToken        String    @unique @default(cuid())
  ownerId            String
  createdAt          DateTime  @default(now())

  owner            User      @relation("EventOwner", fields: [ownerId], references: [id])
  primaryListOwner User?     @relation("EventPrimaryListOwner", fields: [primaryListOwnerId], references: [id], onDelete: SetNull)
  members          EventMember[]
  items            Item[]
}

model EventMember {
  id       String   @id @default(cuid())
  eventId  String
  userId   String
  role     Role     @default(MEMBER)
  joinedAt DateTime @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([eventId])
}

model Item {
  id          String    @id @default(cuid())
  eventId     String
  listOwnerId String

  name        String
  description String?
  url         String?
  imagePath   String?

  price       String?
  priority    Priority?
  category    String?
  notes       String?

  isActive   Boolean @default(true)
  sortOrder  Int     @default(0)

  reservationMode ReservationMode @default(NONE)
  reservedById    String?
  reservedAt      DateTime?

  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  event         Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  listOwner     User   @relation("ItemListOwner", fields: [listOwnerId], references: [id])
  reservedBy    User?  @relation("ItemReservedBy", fields: [reservedById], references: [id], onDelete: SetNull)
  createdByUser User   @relation("ItemCreatedBy", fields: [createdBy], references: [id])

  contributions ItemContribution[]

  @@index([eventId, listOwnerId, isActive])
}

model ItemContribution {
  id        String   @id @default(cuid())
  itemId    String
  userId    String
  note      String?
  createdAt DateTime @default(now())

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([itemId, userId])
}
```

Notes importants:

- `price` és `String?` per simplicitat. L’usuari pot escriure `25€` o `25`.
- `priority` és opcional.
- `category` és text lliure.
- `notes` és text lliure.
- `isActive` permet amagar un item sense esborrar-lo.
- `sortOrder` serveix per ordenar items.
- `reservationMode` pot ser:
  - `NONE`: reservat normal.
  - `HELP`: el reservador demana ajuda.
  - `SHARED`: regal compartit.
- `ItemContribution` serveix per apuntar qui ajuda o participa en un regal compartit.

---

## 10. Regles de negoci principals

### 10.1. Crear items

En mode `EVERY_MEMBER_LIST`:

- Un membre pot crear items per la seva pròpia llista.
- Un `ADMIN` o `OWNER` pot crear items per qualsevol membre.

En mode `SINGLE_LIST`:

- Només el `primaryListOwner`, `OWNER` o `ADMIN` pot crear items.
- Els items han de pertànyer al `primaryListOwner`.

Un item sempre pertany a:

- Un `eventId`.
- Un `listOwnerId`.

---

### 10.2. Editar items

Pot editar un item:

- El propietari de la llista, si té permís per gestionar la seva llista.
- Un `ADMIN`.
- Un `OWNER`.

No s’ha de poder editar un item des d’un esdeveniment diferent.

---

### 10.3. Esborrar items

Pot esborrar un item:

- El propietari de la llista, si té permís.
- Un `ADMIN`.
- Un `OWNER`.

Si un item està reservat o té contribucions, l’esborrat ha de mostrar confirmació.

En esborrar:

- S’esborren les contribucions associades.
- L’item desapareix de la llista.

---

### 10.4. Items inactius

Un item amb `isActive = false`:

- No apareix per membres normals.
- Pot aparèixer per editors amb un badge tipus “Inactiu”.
- No compta al progrés.
- No es pot reservar.

---

### 10.5. Ordre dels items

Els items s’ordenen per `sortOrder`.

Els editors han de poder canviar l’ordre.

Implementació mínima acceptable:

- Botons de pujar/baixar.
- Intercanviar `sortOrder` amb l’item adjacent.

No cal drag & drop si és complex.

---

## 11. Reserva d’items

### 11.1. Marcar com a agafat

Un membre pot marcar un item com a agafat si:

- L’item està actiu.
- L’item no està ja reservat.
- L’usuari no és el propietari de la llista.
- L’usuari és membre de l’esdeveniment.

El propietari de la llista no hauria de reservar els seus propis items.

Exemple:

> Si l’item pertany a la llista de “Marta”, la Marta no hauria de poder marcar-lo com a agafat.

Els administradors sí que poden reservar items d’altres si no són els propietaris d’aquell item.

---

### 11.2. Detectar qui ha reservat primer

La reserva ha de ser atòmica.

Si dos usuaris fan clic alhora, només un ha de guanyar.

Implementació recomanada:

```ts
const updated = await prisma.item.updateMany({
  where: {
    id: itemId,
    reservedById: null,
    isActive: true,
  },
  data: {
    reservedById: userId,
    reservedAt: new Date(),
    reservationMode: "NONE",
  },
});

if (updated.count === 0) {
  return { error: "Aquest regal ja està agafat." };
}
```

No confiïs en llegir primer i escriure després sense condició.

---

### 11.3. Estat visual

Quan un item està reservat:

- S’ha de veure clarament que està agafat.
- Pot tenir una opacitat reduïda.
- Ha de mostrar un badge:
  - `Agafat`
  - `Demana ajuda`
  - `Regal compartit`

No cal mostrar necessàriament el nom del reservador a tothom si no es vol, però per la prova simple pots mostrar-lo a tots els membres.

---

### 11.4. Desmarcar

Pot desmarcar:

- L’usuari que ha reservat.
- Un `ADMIN`.
- Un `OWNER`.

En desmarcar:

- `reservedById = null`
- `reservedAt = null`
- `reservationMode = NONE`
- S’esborren les contribucions associades.

Mostra confirmació si hi ha contribucions.

---

## 12. Ajuda i regal compartit

Quan un usuari ha reservat un item, pot activar:

- `HELP`: demana ajuda.
- `SHARED`: regal compartit.

Això es guarda a `Item.reservationMode`.

### 12.1. `HELP`

Visualment mostrar:

```text
Demana ajuda
```

Altres membres poden afegir-se com a ajudants.

### 12.2. `SHARED`

Visualment mostrar:

```text
Regal compartit
```

Altres membres poden unir-se al regal compartit.

### 12.3. Contribucions

Quan un usuari s’uneix a ajuda o regal compartit:

- Es crea un registre a `ItemContribution`.
- Pot afegir una nota opcional.

Exemples de notes:

```text
Jo compro els comandos
Jo poso 25€
Jo compro el joc
```

Regles:

- Un usuari no pot contribuir dues vegades al mateix item.
- El reservador principal no ha de ser també contribució.
- El propietari de la llista no hauria de poder contribuir al seu propi item.
- Un contribuidor pot sortir-ne.
- El reservador principal, `ADMIN` o `OWNER` pot eliminar una contribució.

### 12.4. Canviar mode

El reservador principal, `ADMIN` o `OWNER` pot canviar entre:

- `NONE`
- `HELP`
- `SHARED`

Si es torna a `NONE`, es poden esborrar les contribucions, però millor mostrar confirmació si ja hi ha participants.

---

## 13. Progrés de llista

Per cada membre amb llista, calcula:

```text
activeItems = items actius de la seva llista
reservedItems = items actius amb reservedById no nul
```

Mostra:

```text
reservedItems / activeItems
```

Exemple:

```text
3/4 agafats
```

Si `activeItems = 0`, mostrar la targeta com a buida/gris.

---

## 14. Formulari d’item

El formulari d’item ha de tenir:

Camps obligatoris:

- Nom

Camps opcionals:

- Descripció
- URL
- Imatge
- Preu
- Prioritat
- Categoria
- Notes
- Actiu

Prioritat pot ser:

- Baixa
- Mitjana
- Alta

La URL ha de ser validada com a http/https.

La imatge ha de ser opcional.

---

## 15. Pujada d’imatges

Has d’implementar pujada real d’imatges.

No facis servir serveis externs.

Requisits:

- Acceptar imatges: JPG, PNG, WEBP i GIF.
- Mida màxima: 5 MB.
- Guardar les imatges en una carpeta persistent, per exemple `/data/uploads`.
- Generar un nom de fitxer únic, per exemple amb `crypto.randomUUID()`.
- Guardar a base de dades només la ruta relativa, per exemple:

```text
/uploads/uuid.png
```

Important:

- La carpeta d’imatges ha de persistir entre reinicis de Docker.
- Si es reemplça una imatge, es pot intentar esborrar la imatge anterior, però no ha de fallar tot si no es pot.
- No executis cap fitxer pujat.
- Validar MIME type i extensió.
- Fer servir `path.basename` per evitar path traversal quan es serveixen.

### Ruta per servir imatges

Crea una ruta tipus:

```text
/uploads/[filename]
```

Aquesta ruta ha de:

- Llegir el fitxer des de `UPLOAD_DIR`.
- Retornar la imatge amb el Content-Type correcte.
- Validar que el fitxer existeix.
- No permetre llegir fitxers fora de `UPLOAD_DIR`.

En Docker, `UPLOAD_DIR` ha de ser:

```text
/data/uploads
```

I aquest directori ha de ser un volum persistent.

---

## 16. UI / UX

La interfície ha de ser:

- Responsive.
- Mobile-first.
- Senzilla.
- Clara.
- En català.

Estats visuals importants:

- Llista buida → gris/transparent.
- Item disponible → normal.
- Item agafat → badge i potser opacitat reduïda.
- Item amb ajuda → badge “Demana ajuda”.
- Item compartit → badge “Regal compartit”.
- Item inactiu → visible només per editors.

Botons suggerits:

```text
Crear esdeveniment
Unir-me
La meva llista
Afegir regal
Editar
Esborrar
Guardar
Cancel·lar
Agafar
Desmarcar
Demanar ajuda
Regal compartit
Ajudar
Unir-me al regal
Sortir
Configuració
Copiar enllaç
```

Si un item té URL, mostra un botó:

```text
Veure enllaç
```

Que obri en nova pestanya.

Si un item té imatge, mostra miniatura.

Si no té imatge, mostra placeholder.

---

## 17. Autorització

Totes les accions han de validar sessió i permisos al servidor.

No confiïs en ocultar botons al client.

Abans de fer una mutació:

1. Comprovar usuari actual.
2. Comprovar que és membre de l’esdeveniment.
3. Comprovar rol.
4. Comprovar propietat de l’item si cal.

Accions mínimes a protegir:

- Crear esdeveniment.
- Unir-se a esdeveniment.
- Editar esdeveniment.
- Crear item.
- Editar item.
- Esborrar item.
- Activar/desactivar item.
- Reordenar item.
- Reservar item.
- Desreservar item.
- Canviar mode ajuda/compartit.
- Afegir contribució.
- Eliminar contribució.
- Regenerar invitació.
- Canviar rols.

---

## 18. Sessions

Implementa una sessió simple amb cookie HTTP-only.

Pot ser:

- Cookie firmada amb HMAC.
- JWT simple amb `jose`.
- Altre mecanisme robust equivalent.

La cookie ha de contenir com a mínim:

```text
userId
```

No cal refresh token.

No cal remember me complex.

No cal logout obligatori, però si és fàcil, pots afegir un botó senzill de tancar sessió.

---

## 19. Variables d’entorn

L’aplicació ha de suportar:

```env
DATABASE_URL=postgresql://user:password@db:5432/dbname
AUTH_SECRET=secret_aleatori_llarg
UPLOAD_DIR=/data/uploads
PORT=3000
```

`AUTH_SECRET` ha de ser obligatori en producció.

Si no hi ha `AUTH_SECRET`, l’app ha de fallar amb un missatge clar o generar-ne un temporal només en desenvolupament.

---

## 20. Docker

Genera:

- `Dockerfile`
- `docker-compose.yml`
- `.env.example`
- Instruccions curtes al `README.md`

El `docker-compose.yml` ha de tenir dos serveis:

- `db` amb PostgreSQL
- `app` amb Next.js

Exemple orientatiu:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: wishlist
      POSTGRES_PASSWORD: wishlist
      POSTGRES_DB: wishlist
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wishlist -d wishlist"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build: .
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://wishlist:wishlist@db:5432/wishlist
      AUTH_SECRET: ${AUTH_SECRET}
      UPLOAD_DIR: /data/uploads
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/data/uploads

volumes:
  pgdata:
```

Important:

- Les imatges pujades han de persistir a `./uploads` o un volum equivalent.
- La base de dades ha de persistir en un volum Docker.
- L’app ha d’esperar que Postgres estigui llest.
- Les migracions s’han d’aplicar automàticament en iniciar el contenidor, per exemple:

```bash
npx prisma migrate deploy
```

Si uses Prisma, assegura’t que el contenidor final pot executar migracions.

---

## 21. Migracions i base de dades

Fes servir Prisma migrations.

Durant desenvolupament:

```bash
npx prisma migrate dev
```

En producció/Docker:

```bash
npx prisma migrate deploy
```

No facis servir `prisma db push` com a única estratègia de producció si pots evitar-ho.

---

## 22. Validacions

Valida formularis al client i al servidor.

Per simplicitat pots usar Zod.

Exemples de validacions:

- Nom d’item obligatori.
- Nom d’usuari obligatori.
- Nom d’esdeveniment obligatori.
- URL vàlida si es proporciona.
- Imatge amb tipus i mida vàlids.
- No reservar item inexistent.
- No reservar item ja reservat.
- No contribuir a item no reservat o sense mode ajuda/compartit.

Missatges d’error en català.

---

## 23. Errors i feedback

Mostra missatges clars:

```text
El nom és obligatori.
Aquest regal ja està agafat.
No tens permisos per fer aquesta acció.
La imatge és massa gran.
Format d’imatge no vàlid.
L’enllaç d’invitació no és vàlid.
```

Fes servir toast, alerta simple o missatge inline, però que sigui usable.

---

## 24. Accessibilitat mínima

- Botons amb text clar.
- Formularis amb labels.
- Contrast raonable.
- Navegable amb teclat en la mesura possible.

No cal complir WCAA complets, però no facis una UI inaccessible.

---

## 25. Casos d’ús que han de funcionar

### Cas 1: Crear Reis per família

1. Usuari entra a `/`.
2. Posa el seu nom.
3. Crea esdeveniment:

```text
Reis - Família Martinez
```

4. Selecciona mode:

```text
Cada membre té la seva llista
```

5. Copia enllaç d’invitació.
6. Envia l’enllaç per WhatsApp.
7. Un familiar entra, posa nom i s’uneix.
8. El familiar afegeix la seva llista.
9. Un altre familiar pot veure i reservar.

---

### Cas 2: Aniversari amb una sola llista

1. Usuari crea esdeveniment:

```text
Aniversari Marta
```

2. Mode:

```text
Només un membre té llista
```

3. Marta és `primaryListOwner`.
4. Amics entren amb invitació.
5. Poden veure la llista de Marta.
6. Poden reservar items.
7. Una amiga administradora pot afegir items per Marta.

---

### Cas 3: Mediador gestiona llista

1. L’avi no vol usar l’app.
2. La filla és administradora.
3. La filla entra a l’esdeveniment.
4. Obre la llista de l’avi.
5. Afegeix items en nom de l’avi.
6. Altres familiars poden reservar.

---

### Cas 4: Reserva concurrent

1. Dos usuaris veuen el mateix item disponible.
2. Tots dos fan clic a “Agafar” gairebé alhora.
3. Només un queda com a reservador.
4. L’altre rep missatge:

```text
Aquest regal ja està agafat.
```

---

### Cas 5: Regal compartit

1. Un nen demana una PS5.
2. Un familiar reserva la PS5.
3. Activa “Regal compartit”.
4. Altres familiars s’uneixen amb notes:

```text
Jo poso 25€
Jo compro un joc
Jo compro els comandos
```

---

## 26. Criteris d’acceptació

L’app es considerarà correcta si:

1. Es pot crear un usuari provisional amb nom.
2. Es pot crear un esdeveniment.
3. Es pot generar i copiar un enllaç d’invitació.
4. Un usuari nou pot unir-se amb invitació.
5. Es pot navegar per Tailscale/LAN sense domini públic.
6. En mode `EVERY_MEMBER_LIST`, cada membre pot tenir la seva llista.
7. En mode `SINGLE_LIST`, només el membre principal té llista principal.
8. Els items es poden crear, editar i esborrar.
9. Els items tenen nom obligatori.
10. Descripció, URL, foto, preu, prioritat, categoria i notes són opcionals.
11. Es pot pujar una imatge des del formulari.
12. Les imatges persisteixen després de reiniciar Docker.
13. Un item es pot marcar com a agafat.
14. Un item es pot desmarcar.
15. Si dos usuaris reserven alhora, només un guanya.
16. L’estat reservat és visualment clar.
17. Es pot activar ajuda o regal compartit.
18. Altres usuaris poden unir-se a ajuda/regal compartit.
19. El progrés es mostra com `reservats / actius`.
20. Les llistes buides es veuen gris/transparent.
21. Un administrador pot editar items d’altres membres.
22. El propietari d’una llista no pot reservar els seus propis items.
23. Tot funciona amb Docker Compose.
24. PostgreSQL és la base de dades.
25. No s’ha afegit funcionalitat fora d’aquest abast.

---

## 27. No implementar ara

No afegeixis:

- Amic invisible.
- Lògica de suggeriments aleatoris.
- Emails.
- Notificacions push.
- Pagaments.
- Integració amb botigues.
- Scraping d’URL.
- Generació automàtica de metadades d’enllaços.
- Sistema d’amics.
- Comments globals.
- Likes.
- Themes avançats.
- Multi-idioma.
- PWA complexa.
- Analytics.
- Exportació avançada.
- Rols personalitzats.
- Permisos granulars per item.
- Moderació.
- Reports.
- Eliminació completa de compte.
- GDPR complet.

Si tens dubte entre afegir una funcionalitat extra o mantenir simplicitat, mantén simplicitat.

---

## 28. Estil de codi

- Fes servir TypeScript sempre.
- Fes servir components React moderns.
- Fes servir server components i server actions quan tingui sentit.
- No creïs una API REST massiva si pots resoldre-ho amb server actions simples.
- Mantén el codi llegible.
- No facis microserveis.
- No introdueixis més dependències si no són necessàries.
- Prioritza solucions simples i mantenibles.

---

## 29. README

Genera un `README.md` curt amb:

```bash
# Com executar

1. Copia .env.example a .env
2. Genera AUTH_SECRET:
   openssl rand -hex 32
3. Executa:
   docker compose up --build
4. Obre:
   http://localhost:3000
```

I també:

```text
Per accedir des de Tailscale, fes servir la IP o el nom del NAS dins la tailnet, per exemple:
http://nas:3000
```

---

## 30. Nota final per a la IA

Aquesta aplicació és per una prova familiar local.

Prioritza:

- Simplitat.
- Fiabilitat.
- Usabilitat mòbil.
- Desplegament fàcil amb Docker.
- Pujada d’imatges funcional.
- Reserva concurrent correcta.

No intentis fer una plataforma comercial completa.

Si has de prendre una decisió no especificada, tria l’opció més simple i coherent amb l’abast del MVP.