# Configuración necesaria de Firebase

La aplicación usa autenticación anónima para que Firestore y Storage no queden abiertos a solicitudes sin sesión.

## 1. Habilitar autenticación anónima

1. Abre Firebase Console y selecciona el proyecto `mylove-ff661`.
2. Entra en **Authentication > Sign-in method**.
3. Habilita el proveedor **Anonymous / Anónimo**.

## 2. Publicar las reglas

Desde la raíz del repositorio:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

También puedes copiar manualmente `mylove/firestore.rules` y `mylove/storage.rules` en las secciones **Rules** de Firestore y Storage.

## 3. Desplegar la aplicación

Después de fusionar el Pull Request, Vercel debe reconstruir el proyecto usando `mylove` como **Root Directory**.

## Verificación

1. Crea o abre una cita.
2. Presiona el botón verde de verificación para marcarla como realizada.
3. Abre **Notas y recuerdos de la cita**.
4. Guarda una nota y selecciona una o varias imágenes.
5. Confirma en Firebase Storage que se crearon archivos bajo `dates/<id-de-cita>/` y en Firestore que el documento contiene `completed`, `notes` y `photos`.

> La autenticación anónima evita solicitudes completamente anónimas, pero cualquier persona que conozca la URL pública puede obtener una sesión anónima. Para una aplicación privada conviene agregar acceso con correo/contraseña o Google.
