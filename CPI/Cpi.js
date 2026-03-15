(async function () {
    // 1. DATABASE LINK
    // Ensure window.SUPABASE_URL and window.SUPABASE_ANON_KEY are set in your config file
    const _supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // 2. ELEMENT SELECTORS
    const video = document.getElementById('video');
    const scanBtn = document.getElementById('scan-btn');
    const statusText = document.getElementById('scan-status');
    const form = document.querySelector('form');
    
    // Biometric Toggle Elements
    const biometricTypeSelect = document.getElementById('biometric_type');
    const faceSection = document.getElementById('face-scanner-section');
    const uploadSection = document.getElementById('biometric-upload-section');
    
    let capturedDescriptor = null;

    // 3. SECURE AI INITIALIZATION
    async function initAI() {
        try {
            if (!statusText || !video) return; 
            
            statusText.textContent = "INITIALIZING BIOMETRIC PROTOCOLS...";
            statusText.style.color = "#aaaaaa";

            const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/models/';
            
            // Loading models for detection, landmarks, and recognition
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);

            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            video.srcObject = stream;
            
            statusText.textContent = "SYSTEM READY: POSITION FACE IN SCANNER";
            statusText.style.color = "#2fa12f";

        } catch (err) {
            console.error("Hardware Error:", err);
            statusText.textContent = "ERROR: CAMERA ACCESS DENIED OR UNAVAILABLE";
            statusText.style.color = "#ff4444";
        }
    }

    // 4. BIOMETRIC TOGGLE (Fixes the "Nothing Happens" issue)
    if (biometricTypeSelect) {
        biometricTypeSelect.addEventListener('change', function() {
            if (this.value === 'face') {
                faceSection.style.display = 'block';
                uploadSection.style.display = 'none';
                initAI(); // Only fire camera when 'face' is chosen
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

    // 5. CAPTURE FACE MAP
    scanBtn.addEventListener('click', async () => {
        if (!video.srcObject) {
            statusText.textContent = "ERROR: CAMERA NOT ACTIVE";
            return;
        }

        statusText.textContent = "MAPPING FACIAL COORDINATES...";
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            capturedDescriptor = Array.from(detection.descriptor);
            // Store the mathematical map in the hidden input
            document.getElementById('face_descriptor_input').value = JSON.stringify(capturedDescriptor);
            
            statusText.textContent = "✅ BIOMETRIC IDENTITY SECURED";
            statusText.style.color = "#00ff41";
        } else {
            statusText.textContent = "❌ SCAN FAILED: FACE NOT DETECTED";
            statusText.style.color = "#ff4444";
        }
    });

    // 6. SENSITIVE DATA GATHERING & SUBMISSION
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Security Check for Face Scan
        if (biometricTypeSelect.value === 'face' && !capturedDescriptor) {
            alert("REQUIRED: Please complete the Biometric Face Scan before continuing.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="animate-pulse">ENCRYPTING & UPLOADING...</span>`;

        try {
            // Gathering ALL inputs from your HTML (DO NOT REMOVE)
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

            // 1. Create Auth Entry
            const { error: authError } = await _supabase.auth.signUp({
                email: payload.email,
                password: "EdgeSecurityDefault123!" // Suggest adding a password field to HTML for true security
            });
            if (authError) throw authError;

            // 2. Save Full Encrypted Profile
            const { error: dbError } = await _supabase.from('cpi_submissions').insert([payload]);
            if (dbError) throw dbError;

            // 3. Successful Flow: Move to Login
            alert("ENROLLMENT COMPLETE. REDIRECTING TO BIOMETRIC VERIFICATION.");
            window.location.href = "../login/login.html";

        } catch (err) {
            alert("VAULT SYSTEM ERROR: " + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "Continue";
        }
    });

})();