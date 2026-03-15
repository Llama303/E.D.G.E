(function () {
  // --- 1. URL PARAMS & UTILS ---
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

  // --- 2. FACE SCAN GLOBALS ---
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

  // --- 3. FORM VALIDATION & LOGIC ---
  function initFormValidation() {
      var form = document.querySelector('form[action="verify_identity.php"]');
      if (!form) return;

      var employmentStatus = document.getElementById('employment_status');
      var occupation = document.getElementById('occupation');
      var employerName = document.getElementById('employer_name');
      var biometricType = document.getElementById('biometric_type');
      var faceScannerSection = document.getElementById('face-scanner-section');
      var uploadSection = document.getElementById('biometric-upload-section');
      var biometricFile = document.getElementById('biometric_file');

      // Employment Visibility Logic
      if (employmentStatus) {
          employmentStatus.addEventListener('change', function() {
              var status = this.value;
              var hideFields = status === 'retired' || status === 'unemployed';
              occupation.style.display = hideFields ? 'none' : 'block';
              employerName.style.display = hideFields ? 'none' : 'block';
          });
      }

      // Biometric Toggle Logic
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

      // ONE SINGLE SUBMIT LISTENER
      form.addEventListener('submit', function (e) {
          var messages = [];
          var selectedMethod = biometricType ? biometricType.value : '';

          // 1. Biometric Check
          if (selectedMethod === 'face') {
              if (!descriptorInput || !descriptorInput.value) {
                  messages.push("Please 'Capture Face Map' to verify your identity.");
              }
          } else if (selectedMethod === 'fingerprint' || selectedMethod === 'manual') {
              if (!biometricFile || biometricFile.files.length === 0) {
                  messages.push("Please upload your biometric verification file.");
              }
          } else {
              messages.push("Please select a biometric verification method.");
          }

          // 2. Age Check
          var dob = document.getElementById('dob');
          if (!dob || yearsBetween(dob.value) < 18) {
              messages.push('You must be at least 18 years old.');
          }

          // 3. Gov ID Check
          var govIdFile = document.getElementById('gov_id_file');
          if (!govIdFile || govIdFile.files.length === 0) {
              messages.push("Please upload your Gov ID.");
          }

          // 4. Terms Check
          var agreeTerms = document.getElementById('agree_terms');
          if (!agreeTerms || !agreeTerms.checked) {
              messages.push('You must agree to the Terms and Conditions.');
          }

          // Error Reporting
          if (messages.length > 0) {
              e.preventDefault();
              if (errorEl) {
                  errorEl.textContent = messages[0];
                  window.scrollTo(0, 0); 
              } else {
                  alert(messages[0]);
              }
          }
      });
  }

  // AI Capture Button Logic
  if (scanBtn) {
      scanBtn.addEventListener('click', async () => {
          if (!statusText) return;
          statusText.textContent = "Analyzing face... Stay still.";
          const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

          if (detection) {
              descriptorInput.value = JSON.stringify(Array.from(detection.descriptor));
              statusText.textContent = "✅ Face Map Captured!";
              scanBtn.textContent = "Rescan Face";
              scanBtn.style.backgroundColor = "#2563eb"; // Change color to blue on success
          } else {
              statusText.textContent = "❌ Face not detected. Try again.";
          }
      });
  }

  // --- 4. BOOTSTRAP ---
  document.addEventListener('DOMContentLoaded', initFormValidation);
})();