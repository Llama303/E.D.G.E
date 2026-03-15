(async function () {
    // Uses the keys already defined in your supabase_config.js
    const _supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    const video = document.getElementById('video');
    const scanBtn = document.getElementById('scan-btn');
    const statusText = document.getElementById('scan-status');
    const form = document.querySelector('form'); // Grabs your enrollment form
    
    let capturedDescriptor = null;

    // Load AI and Camera
    async function init() {
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/models/';
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        statusText.textContent = "SCANNER READY";
    }

    // Capture Face Map (Gathering the biometric info)
    scanBtn.addEventListener('click', async () => {
        statusText.textContent = "SCANNING...";
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        if (detection) {
            capturedDescriptor = Array.from(detection.descriptor);
            document.getElementById('face_descriptor_input').value = JSON.stringify(capturedDescriptor);
            statusText.textContent = "✅ FACE MAP SECURED";
            statusText.style.color = "#2fa12f";
        } else {
            statusText.textContent = "❌ FACE NOT DETECTED";
        }
    });

    // Save ALL Information and Move to Login
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!capturedDescriptor) {
            alert("Biometric scan required to proceed.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "ENCRYPTING & SAVING...";

        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // 1. Create the Auth Account
            const { error: authError } = await _supabase.auth.signUp({ email, password });
            if (authError) throw authError;

            // 2. Save all the sensitive info you gathered
            const { error: dbError } = await _supabase.from('cpi_submissions').insert([{
                full_name: document.getElementById('full_name').value,
                email: email,
                dob: document.getElementById('dob').value,
                gov_id_type: document.getElementById('gov_id_type').value,
                gov_id_number: document.getElementById('gov_id_number').value,
                employment_status: document.getElementById('employment_status').value,
                face_descriptor: JSON.stringify(capturedDescriptor),
                created_at: new Date()
            }]);

            if (dbError) throw dbError;

            alert("INFORMATION SAVED. PLEASE LOGIN TO ACCESS DESKTOP.");
            
            // THE FLOW: Move to login page
            window.location.href = "../login/login.html";

        } catch (err) {
            alert("SYSTEM ERROR: " + err.message);
            submitBtn.disabled = false;
        }
    });

    init();
})();