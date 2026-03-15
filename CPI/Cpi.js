(function () {
  const form = document.querySelector('form[action="verify_identity.php"]');
  const errorEl = document.getElementById('signup-error');
  
  // Form Fields
  const bioType = document.getElementById('biometric_type');
  const bioFileCont = document.getElementById('biometric_upload_container');
  const faceScanCont = document.getElementById('face_scan_container');
  const bioFile = document.getElementById('biometric_file');
  const faceDataInput = document.getElementById('face_scan_data');
  
  // Camera Elements
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const captureBtn = document.getElementById('capture_btn');
  const scanStatus = document.getElementById('scan_status');
  let stream = null;

  // --- 1. BIOMETRIC TOGGLE LOGIC ---
  bioType.addEventListener('change', function() {
      if (this.value === 'face_scan') {
          bioFileCont.style.display = 'none';
          faceScanCont.style.display = 'block';
          bioFile.required = false;
          startCamera();
      } else {
          bioFileCont.style.display = 'block';
          faceScanCont.style.display = 'none';
          bioFile.required = !!this.value;
          stopCamera();
      }
  });

  async function startCamera() {
      try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = stream;
          scanStatus.textContent = "Camera ready.";
      } catch (err) {
          scanStatus.textContent = "Error: Camera access denied.";
      }
  }

  function stopCamera() {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
      }
  }

  captureBtn.addEventListener('click', function() {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      faceDataInput.value = canvas.toDataURL('image/jpeg');
      scanStatus.textContent = "✅ Face Captured!";
      scanStatus.style.color = "#22c55e";
  });

  // --- 2. FULL DATA VALIDATION ---
  form.addEventListener('submit', function (e) {
      errorEl.textContent = '';
      let messages = [];

      // Validate Identity Info
      const fullName = document.getElementById('full_name').value.trim();
      const email = document.getElementById('email').value.trim();
      const dob = document.getElementById('dob').value;
      
      if (fullName.length < 2) messages.push("Full name is too short.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) messages.push("Invalid email format.");
      
      // Check Age (18+)
      const age = Math.floor((new Date() - new Date(dob)) / 31557600000);
      if (isNaN(age) || age < 18) messages.push("You must be 18 years or older.");

      // Validate Required Files (ID and Proof of Address)
      if (document.getElementById('gov_id_file').files.length === 0) {
          messages.push("Government ID upload is required.");
      }

      // Validate Selected Biometric
      if (bioType.value === 'face_scan') {
          if (!faceDataInput.value) messages.push("Please capture your face scan.");
      } else if (bioType.value && bioFile.files.length === 0) {
          messages.push("Please upload your biometric file.");
      }

      if (messages.length > 0) {
          e.preventDefault();
          errorEl.textContent = messages[0];
          window.scrollTo(0, 0);
      }
  });
})();