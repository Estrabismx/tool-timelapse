document.addEventListener("DOMContentLoaded", () => {
    
    // --- ELEMENTOS DEL DOM ---
    const modeSelector = document.getElementById("mode-selector");
    const tabContents = document.querySelectorAll(".tab-content");
    const fpsInputs = document.querySelectorAll("input[name='fps']");

    // Elementos Pestaña 1 (Resultado)
    const resEventDuration = document.getElementById("res-event-duration");
    const resInterval = document.getElementById("res-interval");
    const resTotalPhotos = document.getElementById("res-total-photos");
    const resFinalDuration = document.getElementById("res-final-duration");

    // Elementos Pestaña 2 (Intervalo)
    const intEventDuration = document.getElementById("int-event-duration");
    const intVideoDuration = document.getElementById("int-video-duration");
    const intTotalPhotos = document.getElementById("int-total-photos");
    const intFinalInterval = document.getElementById("int-final-interval");

    // Elementos Pestaña 3 (Video)
    const vidOriginalDuration = document.getElementById("vid-original-duration");
    const vidTargetDuration = document.getElementById("vid-target-duration");
    const vidSpeedMultiplier = document.getElementById("vid-speed-multiplier");
    const vidSpeedPercent = document.getElementById("vid-speed-percent");

    // Elementos del Procesador de Video
    const videoUpload = document.getElementById("video-upload");
    const btnProcessVideo = document.getElementById("btn-process-video");
    const hiddenVideo = document.getElementById("hidden-video");
    const processCanvas = document.getElementById("process-canvas");
    const processStatus = document.getElementById("process-status");
    const processProgress = document.getElementById("process-progress");
    const downloadLink = document.getElementById("download-link");

    // --- FUNCIÓN PARA OBTENER LOS FPS SELECCIONADOS ---
    const getSelectedFPS = () => {
        const checkedInput = document.querySelector("input[name='fps']:checked");
        return parseInt(checkedInput.value, 10) || 30;
    };

    // --- LÓGICA DE NAVEGACIÓN ---
    modeSelector.addEventListener("change", (e) => {
        // Ocultar todas las pestañas
        tabContents.forEach(tab => tab.classList.add("hidden"));
        // Mostrar la pestaña seleccionada
        const targetTab = document.getElementById(e.target.value);
        if (targetTab) {
            targetTab.classList.remove("hidden");
        }
        // Recalcular valores al cambiar
        calculateAll();
    });

    // --- LÓGICA DE CÁLCULOS ---
    const calculateAll = () => {
        const fps = getSelectedFPS();

        // Cálculo Tab 1 (Fotos y Duración Final)
        const eDurationMinRes = parseFloat(resEventDuration.value) || 0;
        const intervalSec = parseFloat(resInterval.value) || 0;
        
        if (eDurationMinRes > 0 && intervalSec > 0) {
            const totalPhotos = Math.floor((eDurationMinRes * 60) / intervalSec);
            const videoDurationSec = totalPhotos / fps;
            
            resTotalPhotos.textContent = totalPhotos.toLocaleString();
            resFinalDuration.textContent = videoDurationSec.toFixed(1) + " seg";
        } else {
            resTotalPhotos.textContent = "0";
            resFinalDuration.textContent = "0.0 seg";
        }

        // Cálculo Tab 2 (Fotos e Intervalo a Configurar)
        const eDurationMinInt = parseFloat(intEventDuration.value) || 0;
        const targetVideoSec = parseFloat(intVideoDuration.value) || 0;

        if (eDurationMinInt > 0 && targetVideoSec > 0) {
            const requiredPhotos = Math.floor(targetVideoSec * fps);
            const requiredInterval = (eDurationMinInt * 60) / requiredPhotos;

            intTotalPhotos.textContent = requiredPhotos.toLocaleString();
            intFinalInterval.textContent = requiredInterval.toFixed(1) + " seg";
        } else {
            intTotalPhotos.textContent = "0";
            intFinalInterval.textContent = "0.0 seg";
        }

        // Cálculo Tab 3 (Velocidad en Video)
        const vOriginalMin = parseFloat(vidOriginalDuration.value) || 0;
        const vTargetSec = parseFloat(vidTargetDuration.value) || 0;

        if (vOriginalMin > 0 && vTargetSec > 0) {
            const vOriginalSec = vOriginalMin * 60;
            const multiplier = vOriginalSec / vTargetSec;
            const percent = multiplier * 100;

            vidSpeedMultiplier.textContent = multiplier.toFixed(2) + "x";
            vidSpeedPercent.textContent = `O colocar: ${Math.round(percent)}%`;
        } else {
            vidSpeedMultiplier.textContent = "0.00x";
            vidSpeedPercent.textContent = "O colocar: 0%";
        }
    };

    // --- ASIGNAR EVENTOS A INPUTS ---
    const allInputs = [
        resEventDuration, resInterval, 
        intEventDuration, intVideoDuration, 
        vidOriginalDuration, vidTargetDuration
    ];

    allInputs.forEach(input => {
        input.addEventListener("input", calculateAll);
    });

    fpsInputs.forEach(input => {
        input.addEventListener("change", calculateAll);
    });

    // Calcular valores iniciales
    calculateAll();

    // --- PROCESADOR DE VIDEO INTEGRADO ---
    let isProcessing = false;

    // Habilitar botón al cargar un archivo
    videoUpload.addEventListener("change", (e) => {
        if (e.target.files.length > 0 && !isProcessing) {
            btnProcessVideo.disabled = false;
        } else {
            btnProcessVideo.disabled = true;
        }
    });

    btnProcessVideo.addEventListener("click", () => {
        const file = videoUpload.files[0];
        if (!file) return;

        // UI Reset
        isProcessing = true;
        btnProcessVideo.disabled = true;
        videoUpload.disabled = true;
        downloadLink.classList.add("hidden");
        processStatus.classList.remove("hidden");
        processProgress.textContent = "0%";

        const fps = getSelectedFPS();
        const targetVideoDurationSec = parseFloat(vidTargetDuration.value) || 15;
        const totalFramesNeeded = Math.floor(targetVideoDurationSec * fps);
        
        const videoURL = URL.createObjectURL(file);
        hiddenVideo.src = videoURL;

        // Cuando los metadatos del video cargan
        hiddenVideo.onloadedmetadata = () => {
            const ctx = processCanvas.getContext("2d");
            processCanvas.width = hiddenVideo.videoWidth;
            processCanvas.height = hiddenVideo.videoHeight;

            const totalDurationOriginal = hiddenVideo.duration; // Segundos reales del video
            const timeStep = totalDurationOriginal / totalFramesNeeded; // Salto en segundos por fotograma
            
            // Configurar el grabador (MediaRecorder) usando el Canvas
            const stream = processCanvas.captureStream(fps);
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            const recordedChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Terminar de generar el video
                const blob = new Blob(recordedChunks, { type: "video/webm" });
                const url = URL.createObjectURL(blob);
                
                downloadLink.href = url;
                downloadLink.download = "timelapse_acelerado.webm";
                
                // Actualizar UI
                downloadLink.classList.remove("hidden");
                processStatus.classList.add("hidden");
                btnProcessVideo.disabled = false;
                videoUpload.disabled = false;
                isProcessing = false;
                processProgress.textContent = "¡Completado!";
                
                URL.revokeObjectURL(videoURL); // Limpiar memoria
            };

            // Iniciar procesamiento de frames
            mediaRecorder.start();
            let currentFrameIndex = 0;

            const processNextFrame = () => {
                if (currentFrameIndex >= totalFramesNeeded) {
                    mediaRecorder.stop();
                    return;
                }
                // Adelantar el video oculto al tiempo exacto
                hiddenVideo.currentTime = currentFrameIndex * timeStep;
            };

            // Cuando el video termina de "saltar" al tiempo exacto
            hiddenVideo.onseeked = () => {
                // Dibujar el frame en el canvas
                ctx.drawImage(hiddenVideo, 0, 0, processCanvas.width, processCanvas.height);
                
                // Actualizar progreso
                const percentage = Math.round((currentFrameIndex / totalFramesNeeded) * 100);
                processProgress.textContent = percentage + "%";

                currentFrameIndex++;
                
                // Esperar el tiempo correspondiente al FPS para que MediaRecorder grabe bien el tiempo real
                setTimeout(() => {
                    processNextFrame();
                }, 1000 / fps);
            };

            // Comenzar el primer frame
            processNextFrame();
        };
    });
});