(function () {

    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const captureBtn = document.getElementById("capture");
    const status = document.getElementById("status");

    let stream;

    /* 
       Start Camera
   */

    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        } catch (err) {
            status.textContent = "Camera access denied.";
        }
    }

    startCamera();

    /* 
       Capture Face
   */

    captureBtn.addEventListener("click", function () {

        if (!video.videoWidth) {
            status.textContent = "Camera not ready.";
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(function (blob) {

            if (!blob) {
                status.textContent = "Failed to capture image.";
                return;
            }

            const formData = new FormData();

            formData.append("biometric_file", blob, "face_scan.jpg");
            formData.append("biometric_type", "face_scan");

            const cpi_id = localStorage.getItem("cpi_id");

            if (!cpi_id) {
                status.textContent = "User session missing.";
                return;
            }

            formData.append("cpi_id", cpi_id);

            uploadFaceScan(formData);

        }, "image/jpeg");

    });

    /* 
       Upload Face Scan
   */

    async function uploadFaceScan(formData) {

        try {

            const response = await fetch("save_face_scan.php", {
                method: "POST",
                body: formData
            });

            const result = await response.text();

            if (result.trim() === "success") {

                localStorage.removeItem("cpi_data");

                window.location.href = "success.html";

            } else {

                status.textContent = result;

            }

        } catch (error) {

            status.textContent = "Upload failed.";

        }

    }

    /* 
       Stop Camera when leaving page
   */

    window.addEventListener("beforeunload", function () {

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

    });

})();
