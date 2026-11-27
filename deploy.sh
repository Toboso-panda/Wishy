#!/usr/bin/env bash
# Actualitza Wishy al NAS amb l'última imatge que ha construït GitHub Actions.
# Primer cal que el PR s'accepti a main de Toboso-panda/Wishy i que el workflow
# "Docker image" d'aquell repositori acabi en verd.
#
# Al NAS, Wishy és dins del compose compartit /root/docker-stack/docker-compose.yml
# (amb els secrets), així que aquí no es copia cap fitxer: només es baixa la imatge
# nova i es reinicia el servei "wishy". La base de dades (wishy-db) i les fotos
# (/root/docker/wishy) no es toquen. Les migracions s'apliquen soles en arrencar.
set -euo pipefail

NAS="${NAS:-root@buggyhs}"
STACK=/root/docker-stack
IMAGE=ghcr.io/toboso-panda/wishy

# Les imatges d'aquest repositori porten aquesta etiqueta; només s'esborren aquestes
LABEL="org.opencontainers.image.source=https://github.com/Toboso-panda/Wishy"

ssh "$NAS" bash -s <<EOF
set -euo pipefail
cd $STACK

# Seguretat: el compose ha de fer servir la imatge de GitHub, no l'antiga construïda al NAS
if ! grep -q "image: $IMAGE" docker-compose.yml; then
    echo "El servei wishy encara no fa servir $IMAGE a $STACK/docker-compose.yml" >&2
    exit 1
fi

docker compose pull wishy
docker compose up -d --no-deps wishy
docker image prune -f --filter label=$LABEL >/dev/null
docker compose ps wishy wishy-db
EOF

echo "Desplegat: https://wishy.claniserver.duckdns.org"
