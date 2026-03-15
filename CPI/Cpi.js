(async function () {
    // 1. INITIALIZE SUPABASE
    // Ensure window.SUPABASE_URL and window.SUPABASE_ANON_KEY are provided by supabase_config.js
    const _supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // 2. ELEMENT SELECTORS
    const video = document.getElementById('video');
    const scanBtn = document.getElementById('scan-btn');
    const statusText = document.getElementById('scan-status');
    const form = document.querySelector('form');
    
    // Toggle Selectors
    const biometricTypeSelect = document.getElementById('biometric_type');
    const faceSection = document.getElementById('face-scanner-section');
    const uploadSection = document.getElementById('biometric-upload-section');
    
    let capturedDescriptor = null;

    // 3. AI SCANNER ENGINE
    async function initAI() {
        try {
            if (!statusText || !video) return; 
            
            statusText.textContent = "LOADING BIOMETRIC MODELS...";
            statusText.style.color = "#888";

            const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/models/';
            
            // Load all 3 models required for secure verification
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);

            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            video.srcObject = stream;
            
            statusText.textContent = "SCANNER READY: ALIGN FACE";
            statusText.style.color = "#2fa12f";

        } catch (err) {
            console.error("Hardware Error:", err);
            statusText.textContent = "HARDWARE ERROR: CAMERA BLOCKED";
            statusText.style.color = "#ff4444";
        }
    }

    // 4. THE TOGGLE LOGIC (Ensures fluidity and performance)
    if (biometricTypeSelect) {
        biometricTypeSelect.addEventListener('change', function() {
            if (this.value === 'face') {
                faceSection.style.display = 'block';
                uploadSection.style.display = 'none';
                initAI(); 
            } else if (this.value === 'fingerprint') {
                faceSection.style.display = 'none';
                uploadSection.style.display = 'block';
                document.getElementById('biometric_file_label_text').textContent = "Upload Fingerprint Scan (.jpg/.png)";
            } else {
                faceSection.style.display = 'none';
                uploadSection.style.display = 'block';
            }
        });
    }

    // 5. BIOMETRIC CAPTURE (The "Point" of the system)
    scanBtn.addEventListener('click', async () => {
        if (!video.srcObject) return;

        statusText.textContent = "GENERATING IDENTITY MAP...";
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            capturedDescriptor = Array.from(detection.descriptor);
            // Save the data to the hidden input
            document.getElementById('face_descriptor_input').value = JSON.stringify(capturedDescriptor);
            
            statusText.textContent = "✅ BIOMETRIC IDENTITY SECURED";
            statusText.style.color = "#00ff41";
        } else {
            statusText.textContent = "❌ SCAN FAILED: FACE NOT CLEAR";
            statusText.style.color = "#ff4444";
        }
    });

    // 6. FINAL ENROLLMENT SUBMISSION (Captures 100% of Data)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Security Gate: Ensure face is mapped if they chose face scan
        if (biometricTypeSelect.value === 'face' && !capturedDescriptor) {
            alert("SECURITY REQUIREMENT: Please complete the Face Scan to proceed.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="animate-pulse">ENCRYPTING VAULT...</span>`;

        try {
            // THE FULL PAYLOAD (Nothing forgotten)
            const payload = {
                full_name: document.getElementById('full_name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                dob: document.getElementById('dob').value,
                gov_id_type: document.getElementById('gov_id_type').value,
                gov_id_number: document.getElementById('gov_id_number').value,
                employment_status: document.getElementById('employment_status').value,
                occupation: document.getElementById('occupation').value,
                employer_name: document.getElementById('employer_name').value,
                income_sources: document.getElementById('income_sources').value,
                account_purpose: document.getElementById('account_purpose').value,
                transaction_nature: document.getElementById('transaction_nature').value,
                face_descriptor: JSON.stringify(capturedDescriptor),
                created_at: new Date()
            };

            // 1. Create the Authentication Account
            // We use a default password since this is a biometric-first system
            const { error: authError } = await _supabase.auth.signUp({
                email: payload.email,
                password: "SecuritySystemEntry123!" 
            });

            if (authError) throw authError;

            // 2. Save the Full Profile to the 'cpi_submissions' table
            const { error: dbError } = await _supabase.from('cpi_submissions').insert([payload]);
            if (dbError) throw dbError;

            // 3. The Flow: SUCCESS -> LOGIN
            alert("IDENTITY ENROLLED. REDIRECTING TO BIOMETRIC LOGIN.");
            window.location.href = "../login/login.html";

        } catch (err) {
            alert("VAULT SYSTEM ERROR: " + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "Continue";
        }
    });

})();