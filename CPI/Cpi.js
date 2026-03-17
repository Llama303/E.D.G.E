(function () {
  // --- 1. SUPABASE CONFIG ---
  // Replace these with your actual Supabase Project URL and Anon Key
  const supabaseUrl = 'YOUR_SUPABASE_URL';
  const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
  const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

  // --- 2. URL PARAMS & UTILS ---
  var params = new URLSearchParams(window.location.search);
  var errorEl = document.getElementById('signup-error');
  var successEl = document.getElementById('signup-success');
  var error = params.get('error');
  var success = params.get('success');
  if (error && errorEl) errorEl.textContent = decodeURIComponent(error);
  if (success && successEl) successEl.textContent = decodeURIComponent(success);

  function yearsBetween(dateString) {
      var dob = new Date(dateString);
      if (isNaN(dob.getTime())) return 0;
      var diff = Date.now() - dob.getTime();
      var ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // --- 3. FACE SCAN GLOBALS ---
  const video = document.getElementById('video');
  const scanBtn = document.getElementById('scan-btn');
  const descriptorInput = document.getElementById('face_descriptor_input');
  const statusText = document.getElementById('scan-status');

  async function initAI() {
      try {
          if (!statusText) return;
          statusText.textContent = "Loading security models...";
          const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
          
          await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
          await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
          
          startVideo();
      } catch (err) {
          if (statusText) statusText.textContent = "AI Initialization failed.";
          console.error(err);
      }
  }

  function startVideo() {
      navigator.mediaDevices.getUserMedia({ video: {} })
          .then(stream => {
              if (video) video.srcObject = stream;
              if (statusText) statusText.textContent = "Camera active. Center your face.";
          })
          .catch(err => {
              if (statusText) statusText.textContent = "Camera Error: Check permissions.";
          });
  }

  // --- 4. FORM VALIDATION & SUPABASE SUBMISSION ---
  function initFormValidation() {
      var form = document.querySelector('form'); // Removed the action check since we're using JS now
      if (!form) return;

      var employmentStatus = document.getElementById('employment_status');
      var occupation = document.getElementById('occupation');
      var employerName = document.getElementById('employer_name');
      var biometricType = document.getElementById('biometric_type');
      var faceScannerSection = document.getElementById('face-scanner-section');
      var uploadSection = document.getElementById('biometric-upload-section');
      var biometricFile = document.getElementById('biometric_file');

      // Visibility Logic
      if (employmentStatus) {
          employmentStatus.addEventListener('change', function() {
              var status = this.value;
              var hideFields = status === 'retired' || status === 'unemployed';
              occupation.parentElement.style.display = hideFields ? 'none' : 'block';
              employerName.style.display = hideFields ? 'none' : 'block';
          });
      }

      if (biometricType) {
          biometricType.addEventListener('change', function() {
              if (this.value === 'face') {
                  if (faceScannerSection) faceScannerSection.style.display = 'block';
                  if (uploadSection) uploadSection.style.display = 'none';
                  initAI(); 
              } else {
                  if (faceScannerSection) faceScannerSection.style.display = 'none';
                  if (uploadSection) uploadSection.style.display = 'block';
                  if (video && video.srcObject) {
                      video.srcObject.getTracks().forEach(track => track.stop());
                      video.srcObject = null;
                  }
              }
          });
      }

      // --- THE SUBMIT HANDLER ---
      form.addEventListener('submit', async function (e) {
          e.preventDefault(); // STOP GITHUB FROM LOOKING FOR PHP
          
          var messages = [];
          const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
          var selectedMethod = biometricType ? biometricType.value : '';

          // 1. Validations
          if (selectedMethod === 'face') {
              if (!descriptorInput.value) messages.push("Please 'Capture Face Map'.");
          } else if (!biometricFile.files.length) {
              messages.push("Please upload biometric file.");
          }

          var dob = document.getElementById('dob');
          if (!dob || yearsBetween(dob.value) < 18) messages.push('Must be 18+ years old.');

          var govIdFile = document.getElementById('gov_id_file');
          if (!govIdFile.files.length) messages.push("Upload Gov ID.");
          else if (govIdFile.files[0].size > MAX_SIZE) messages.push("ID file exceeds 5MB.");

          if (!document.getElementById('agree_terms').checked) messages.push('Agree to terms.');

          if (messages.length > 0) {
              alert(messages[0]);
              return;
          }

          // 2. SUPABASE UPLOAD & SAVE
          try {
              if (statusText) statusText.textContent = "Uploading data securely...";
              
              // Upload ID File
              const idFile = govIdFile.files[0];
              const fileExt = idFile.name.split('.').pop();
              const fileName = `${Date.now()}.${fileExt}`;
              
              const { data: uploadData, error: uploadError } = await _supabase.storage
                  .from('id-documents')
                  .upload(`ids/${fileName}`, idFile);

              if (uploadError) throw uploadError;

              // Save Row to Database
              const { error: dbError } = await _supabase
                  .from('cpi_submissions')
                  .insert([{
                      full_name: document.getElementById('full_name').value,
                      email: document.getElementById('email').value,
                      phone: document.getElementById('phone').value,
                      dob: document.getElementById('dob').value,
                      gov_id_type: document.getElementById('gov_id_type').value,
                      gov_id_number: document.getElementById('gov_id_number').value,
                      gov_id_path: uploadData.path,
                      employment_status: document.getElementById('employment_status').value,
                      face_descriptor: descriptorInput.value
                  }]);

              if (dbError) throw dbError;

              alert("Identity Verified Successfully!");
              window.location.href = "success.html"; // Make sure this page exists

          } catch (err) {
              console.error(err);
              alert("Error: " + err.message);
          }
      });
  }

  // AI Capture Button Logic
  if (scanBtn) {
      scanBtn.addEventListener('click', async () => {
          if (!statusText) return;
          statusText.textContent = "Analyzing... Stay still.";
          const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

          if (detection) {
              descriptorInput.value = JSON.stringify(Array.from(detection.descriptor));
              statusText.textContent = "✅ Face Map Captured!";
              scanBtn.style.backgroundColor = "#2563eb";
          } else {
              statusText.textContent = "❌ Face not detected.";
          }
      });
  }

  document.addEventListener('DOMContentLoaded', initFormValidation);
})();