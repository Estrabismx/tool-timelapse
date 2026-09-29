# tool-timelapse

Calculadora y procesador de time-lapse para el navegador.

## Funciones

- Calcula la duración final a partir del intervalo entre fotografías.
- Calcula el intervalo recomendado para una duración de video determinada.
- Carga un video, analiza su duración y permite elegir exactamente una configuración: duración final en minutos/segundos o multiplicador de aceleración.
- Calcula automáticamente el valor equivalente: duración final = duración original / velocidad.
- Procesa el video localmente en el navegador, sin subir el archivo a un servidor.
- Limita la salida a un máximo de 1280 px, mantiene la proporción y usa una compresión media para reducir el peso.
- Permite elegir WebM o MP4 cuando el navegador ofrece un codificador compatible. WebM suele producir archivos más pequeños; la disponibilidad de MP4 depende del navegador.

El procesamiento requiere un navegador con `MediaRecorder` y `canvas.captureStream`. Para obtener mejores resultados se recomienda usar videos MP4 o WebM.
