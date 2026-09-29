document.addEventListener("DOMContentLoaded", () => {
    const modeSelector = document.getElementById("mode-selector");
    const tabContents = document.querySelectorAll(".tab-content");
    const fpsInputs = document.querySelectorAll("input[name='fps']");

    const resEventDuration = document.getElementById("res-event-duration");
    const resInterval = document.getElementById("res-interval");
    const resTotalPhotos = document.getElementById("res-total-photos");
    const resFinalDuration = document.getElementById("res-final-duration");
    const intEventDuration = document.getElementById("int-event-duration");
    const intVideoDuration = document.getElementById("int-video-duration");
    const intTotalPhotos = document.getElementById("int-total-photos");
    const intFinalInterval = document.getElementById("int-final-interval");

    const videoUpload = document.getElementById("video-upload");
    const videoAnalysis = document.getElementById("video-analysis");
    const vidOriginalDuration = document.getElementById("vid-original-duration");
    const vidOriginalResolution = document.getElementById("vid-original-resolution");
    const vidTargetMinutes = document.getElementById("vid-target-minutes");
    const vidTargetSeconds = document.getElementById("vid-target-seconds");
    const vidTargetSpeed = document.getElementById("vid-target-speed");
    const videoTargetModeInputs = document.querySelectorAll("input[name='video-target-mode']");
    const videoDurationFields = document.getElementById("video-duration-fields");
    const videoSpeedField = document.getElementById("video-speed-field");
    const vidSpeedMultiplier = document.getElementById("vid-speed-multiplier");
    const vidCalculatedResult = document.getElementById("vid-calculated-result");
    const videoFormat = document.getElementById("video-format");
    const btnProcessVideo = document.getElementById("btn-process-video");
    const hiddenVideo = document.getElementById("hidden-video");
    const processCanvas = document.getElementById("process-canvas");
    const processStatus = document.getElementById("process-status");
    const processProgress = document.getElementById("process-progress");
    const processError = document.getElementById("process-error");
    const downloadLink = document.getElementById("download-link");

    let selectedVideoURL = null;
    let selectedFile = null;
    let isProcessing = false;

    const getSelectedFPS = () => {
        const checkedInput = document.querySelector("input[name='fps']:checked");
        return parseInt(checkedInput.value, 10) || 30;
    };

    const getVideoTargetMode = () => document.querySelector("input[name='video-target-mode']:checked").value;

    const formatDuration = (seconds) => {
        const roundedSeconds = Math.max(0, Math.round(seconds));
        return `${Math.floor(roundedSeconds / 60)} min ${String(roundedSeconds % 60).padStart(2, "0")} s`;
    };

    const getDurationInput = () => {
        const minutes = Number(vidTargetMinutes.value);
        const seconds = Number(vidTargetSeconds.value);
        if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0 || seconds > 59) {
            return 0;
        }
        return minutes * 60 + seconds;
    };

    const getVideoSettings = () => {
        if (!selectedFile || !Number.isFinite(hiddenVideo.duration) || hiddenVideo.duration <= 0) {
            return null;
        }
        if (getVideoTargetMode() === "speed") {
            const speed = Number(vidTargetSpeed.value);
            if (!Number.isFinite(speed) || speed < 1) {
                return null;
            }
            return { speed, targetDuration: hiddenVideo.duration / speed };
        }
        const targetDuration = getDurationInput();
        if (targetDuration <= 0 || targetDuration >= hiddenVideo.duration) {
            return null;
        }
        return { speed: hiddenVideo.duration / targetDuration, targetDuration };
    };

    const showError = (message) => {
        processError.textContent = message;
        processError.classList.remove("hidden");
    };

    const clearError = () => {
        processError.textContent = "";
        processError.classList.add("hidden");
    };

    const updateVideoCalculation = () => {
        const settings = getVideoSettings();
        if (!settings) {
            vidSpeedMultiplier.textContent = "--";
            vidCalculatedResult.textContent = "--";
            return;
        }
        vidSpeedMultiplier.textContent = `${settings.speed.toFixed(2)}x`;
        vidCalculatedResult.textContent = `${formatDuration(settings.targetDuration)} · ${settings.speed.toFixed(2)}x`;
    };

    const calculateAll = () => {
        const fps = getSelectedFPS();
        const eventDuration = Number(resEventDuration.value);
        const interval = Number(resInterval.value);
        if (eventDuration > 0 && interval > 0) {
            const totalPhotos = Math.floor((eventDuration * 60) / interval);
            resTotalPhotos.textContent = totalPhotos.toLocaleString();
            resFinalDuration.textContent = `${(totalPhotos / fps).toFixed(1)} seg`;
        } else {
            resTotalPhotos.textContent = "0";
            resFinalDuration.textContent = "0.0 seg";
        }

        const intervalEventDuration = Number(intEventDuration.value);
        const targetVideoSeconds = Number(intVideoDuration.value);
        if (intervalEventDuration > 0 && targetVideoSeconds > 0) {
            const requiredPhotos = Math.floor(targetVideoSeconds * fps);
            intTotalPhotos.textContent = requiredPhotos.toLocaleString();
            intFinalInterval.textContent = `${((intervalEventDuration * 60) / requiredPhotos).toFixed(1)} seg`;
        } else {
            intTotalPhotos.textContent = "0";
            intFinalInterval.textContent = "0.0 seg";
        }
        updateVideoCalculation();
    };

    modeSelector.addEventListener("change", (event) => {
        tabContents.forEach((tab) => tab.classList.add("hidden"));
        const targetTab = document.getElementById(event.target.value);
        if (targetTab) {
            targetTab.classList.remove("hidden");
        }
        calculateAll();
    });

    [...document.querySelectorAll(
        "#res-event-duration, #res-interval, #int-event-duration, #int-video-duration, " +
        "#vid-target-minutes, #vid-target-seconds, #vid-target-speed"
    )].forEach((input) => input.addEventListener("input", calculateAll));
    fpsInputs.forEach((input) => input.addEventListener("change", calculateAll));

    videoTargetModeInputs.forEach((input) => input.addEventListener("change", () => {
        const speedMode = getVideoTargetMode() === "speed";
        videoDurationFields.classList.toggle("hidden", speedMode);
        videoSpeedField.classList.toggle("hidden", !speedMode);
        calculateAll();
    }));

    videoUpload.addEventListener("change", () => {
        const file = videoUpload.files[0];
        clearError();
        downloadLink.classList.add("hidden");
        videoAnalysis.classList.add("hidden");
        btnProcessVideo.disabled = true;
        selectedFile = null;
        if (!file) {
            return;
        }
        if (!file.type.startsWith("video/")) {
            showError("Selecciona un archivo de video válido.");
            return;
        }
        if (selectedVideoURL) {
            URL.revokeObjectURL(selectedVideoURL);
        }
        selectedFile = file;
        selectedVideoURL = URL.createObjectURL(file);
        hiddenVideo.src = selectedVideoURL;
        hiddenVideo.load();
    });

    hiddenVideo.addEventListener("loadedmetadata", () => {
        if (!selectedFile || !Number.isFinite(hiddenVideo.duration) || hiddenVideo.duration <= 0) {
            showError("No fue posible leer la duración del video.");
            return;
        }
        vidOriginalDuration.textContent = formatDuration(hiddenVideo.duration);
        vidOriginalResolution.textContent = `${hiddenVideo.videoWidth} x ${hiddenVideo.videoHeight} px`;
        videoAnalysis.classList.remove("hidden");
        btnProcessVideo.disabled = false;
        updateVideoCalculation();
    });

    hiddenVideo.addEventListener("error", () => {
        btnProcessVideo.disabled = true;
        showError("El navegador no puede leer este video. Prueba con MP4 o WebM.");
    });

    const getSupportedMimeType = (format) => {
        const candidates = format === "mp4"
            ? ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"]
            : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
        return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || null;
    };

    const resetProcessingState = () => {
        isProcessing = false;
        btnProcessVideo.disabled = !selectedFile;
        videoUpload.disabled = false;
    };

    btnProcessVideo.addEventListener("click", () => {
        if (isProcessing || !selectedFile) {
            return;
        }
        clearError();
        const settings = getVideoSettings();
        if (!settings) {
            showError(getVideoTargetMode() === "speed"
                ? "Indica una velocidad igual o mayor que 1x."
                : "Indica una duración final menor que la duración original.");
            return;
        }
        const mimeType = getSupportedMimeType(videoFormat.value);
        if (!mimeType) {
            showError(`Este navegador no puede generar ${videoFormat.value.toUpperCase()}. Selecciona otro formato.`);
            return;
        }

        isProcessing = true;
        btnProcessVideo.disabled = true;
        videoUpload.disabled = true;
        downloadLink.classList.add("hidden");
        processStatus.classList.remove("hidden");
        processProgress.textContent = "0%";

        const fps = getSelectedFPS();
        const scale = Math.min(1, 1280 / hiddenVideo.videoWidth);
        processCanvas.width = Math.max(1, Math.round(hiddenVideo.videoWidth * scale));
        processCanvas.height = Math.max(1, Math.round(hiddenVideo.videoHeight * scale));
        const context = processCanvas.getContext("2d", { alpha: false });
        const stream = processCanvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 });
        const recordedChunks = [];
        let animationFrameId = null;
        let stopTimerId = null;
        let startedAt = 0;
        let stopped = false;
        let lastCorrection = 0;
        const playbackRate = Math.min(4, settings.speed);

        const finish = () => {
            if (stopped) {
                return;
            }
            stopped = true;
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
            if (stopTimerId !== null) {
                clearTimeout(stopTimerId);
            }
            hiddenVideo.pause();
            recorder.stop();
        };

        const fail = (message) => {
            if (stopped) {
                return;
            }
            stopped = true;
            hiddenVideo.pause();
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
            if (stopTimerId !== null) {
                clearTimeout(stopTimerId);
            }
            recorder.stop();
            processStatus.classList.add("hidden");
            showError(message);
            resetProcessingState();
        };

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        recorder.onerror = () => fail("Ocurrió un error al codificar el video.");
        recorder.onstop = () => {
            if (recordedChunks.length === 0) {
                showError("No se generaron datos de video.");
                resetProcessingState();
                return;
            }
            const blob = new Blob(recordedChunks, { type: mimeType });
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `timelapse_acelerado.${videoFormat.value}`;
            downloadLink.classList.remove("hidden");
            processStatus.classList.add("hidden");
            processProgress.textContent = "¡Completado!";
            resetProcessingState();
        };

        const drawFrame = () => {
            if (stopped) {
                return;
            }
            context.drawImage(hiddenVideo, 0, 0, processCanvas.width, processCanvas.height);
            const elapsed = (performance.now() - startedAt) / 1000;
            processProgress.textContent = `${Math.min(99, Math.round((elapsed / settings.targetDuration) * 100))}%`;
            if (settings.speed > playbackRate && elapsed - lastCorrection >= 0.2) {
                hiddenVideo.currentTime = Math.min(hiddenVideo.duration, elapsed * settings.speed);
                lastCorrection = elapsed;
            }
            if (!stopped) {
                animationFrameId = requestAnimationFrame(drawFrame);
            }
        };

        hiddenVideo.onerror = () => fail("No fue posible leer un fotograma del video.");
        hiddenVideo.onended = finish;
        hiddenVideo.muted = true;
        hiddenVideo.playbackRate = playbackRate;

        const startCapture = () => {
            hiddenVideo.onseeked = null;
            context.drawImage(hiddenVideo, 0, 0, processCanvas.width, processCanvas.height);
            recorder.start();
            startedAt = performance.now();
            animationFrameId = requestAnimationFrame(drawFrame);
            stopTimerId = setTimeout(finish, settings.targetDuration * 1000);
            hiddenVideo.play().catch(() => fail("No fue posible reproducir el video para procesarlo."));
        };

        hiddenVideo.onseeked = startCapture;
        hiddenVideo.currentTime = 0;
    });

    calculateAll();
});
