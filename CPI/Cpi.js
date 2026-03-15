(function () {
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

  function initFormValidation() {
    var form = document.querySelector('form[action="verify_identity.php"]');
    if (!form) return;

    var employmentStatus = document.getElementById('employment_status');
    var occupation = document.getElementById('occupation');
    var employerName = document.getElementById('employer_name');

    function updateEmploymentFieldsVisibility() {
      if (!employmentStatus || !occupation || !employerName) return;

      var status = employmentStatus.value;
      var hideFields = status === 'retired' || status === 'unemployed';

      if (hideFields) {
        occupation.style.display = 'none';
        employerName.style.display = 'none';
        occupation.required = false;
        employerName.required = false;
      } else {
        occupation.style.display = '';
        employerName.style.display = '';
        occupation.required = true;
        employerName.required = true;
      }
    }

    if (employmentStatus) {
      employmentStatus.addEventListener('change', updateEmploymentFieldsVisibility);
      updateEmploymentFieldsVisibility();
    }

    var biometricTypeSelect = document.getElementById('biometric_type');
    var biometricLabelText = document.getElementById('biometric_file_label_text');
    var labelTextByType = {
      photo: 'Upload photo',
      fingerprint: 'Upload fingerprint image',
      face_scan: 'Upload face scan'
    };
    if (biometricTypeSelect && biometricLabelText) {
      biometricTypeSelect.addEventListener('change', function () {
        var key = this.value;
        biometricLabelText.textContent = labelTextByType[key] || 'Upload verification file';
      });
    }

    form.addEventListener('submit', function (e) {
      if (!errorEl) return;
      errorEl.textContent = '';

      var fullName = document.getElementById('full_name');
      var email = document.getElementById('email');
      var phone = document.getElementById('phone');
      var dob = document.getElementById('dob');
      var govIdType = document.getElementById('gov_id_type');
      var govIdNumber = document.getElementById('gov_id_number');
      var govIdFile = document.getElementById('gov_id_file');
      var proofOfAddress = document.getElementById('proof_of_address');
      var employmentStatus = document.getElementById('employment_status');
      var occupation = document.getElementById('occupation');
      var employerName = document.getElementById('employer_name');
      var incomeSources = document.getElementById('income_sources');
      var accountPurpose = document.getElementById('account_purpose');
      var transactionNature = document.getElementById('transaction_nature');
      var biometricFile = document.getElementById('biometric_file');

      var messages = [];

      if (!fullName || fullName.value.trim().length < 2) {
        messages.push('Please enter your full name.');
      }

      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !email.value.trim()) {
        messages.push('Please enter your email address.');
      } else if (!emailRegex.test(email.value.trim())) {
        messages.push('Please enter a valid email address (e.g. name@example.com).');
      }

      var phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phone || !phone.value.trim()) {
      messages.push('Please enter your phone number.');
    } else if (!phoneRegex.test(phone.value.trim())) {
      messages.push('Please enter a valid phone number.');
    }


      if (!dob || !dob.value) {
        messages.push('Please provide your date of birth.');
      } else if (yearsBetween(dob.value) < 18) {
        messages.push('You must be at least 18 years old.');
      }

      if (!govIdType || !govIdType.value) {
        messages.push('Please select a government ID type.');
      }

      if (!govIdNumber || govIdNumber.value.trim().length < 3) {
        messages.push('Please enter a valid government ID number.');
      }

      if (!govIdFile || !govIdFile.files || govIdFile.files.length === 0) {
        messages.push('Please upload your government ID.');
      }

      if (!proofOfAddress || !proofOfAddress.files || proofOfAddress.files.length === 0) {
        messages.push('Please upload proof of address.');
      }

      if (proofOfAddress.files[0]) {
        const proofName = proofOfAddress.files[0].name.toLowerCase();
        if (!proofName.match(/\.(jpg|jpeg|png|pdf)$/)) {
          messages.push('Proof of address must be JPG, PNG, or PDF.');
        }
      }
      

      if (!employmentStatus || !employmentStatus.value) {
        messages.push('Please select your employment status.');
      }

      var status = employmentStatus ? employmentStatus.value : '';
      var requireEmploymentDetails = status && status !== 'retired' && status !== 'unemployed';

      if (requireEmploymentDetails) {
        if (!occupation || occupation.value.trim().length < 2) {
          messages.push('Please enter your occupation.');
        }

        if (!employerName || employerName.value.trim().length < 2) {
          messages.push('Please enter your employer name (or "Self-employed").');
        }
      }

      if (!incomeSources || incomeSources.value.trim().length < 5) {
        messages.push('Please describe your income sources.');
      }

      if (!accountPurpose || accountPurpose.value.trim().length < 5) {
        messages.push('Please describe the purpose of opening this account.');
      }

      if (!transactionNature || transactionNature.value.trim().length < 5) {
        messages.push('Please describe the expected nature of your transactions.');
      }

      if (govIdFile.files[0]) {
        const govIdName = govIdFile.files[0].name.toLowerCase();
        if (!govIdName.match(/\.(jpg|jpeg|png|pdf)$/)) {
          messages.push('Government ID must be JPG, PNG, or PDF.');
        }
      }

      var biometricType = document.getElementById('biometric_type');
  if (!biometricType || !biometricType.value) {
    messages.push('Please select a biometric verification method.');
  } else if (!biometricFile || !biometricFile.files || biometricFile.files.length === 0) {
    messages.push('Please upload your biometric verification file.');
  }

  if (biometricFile.files[0]) {
    const bioName = biometricFile.files[0].name.toLowerCase();
    if (!bioName.match(/\.(jpg|jpeg|png)$/)) {
      messages.push('Biometric file must be JPG, PNG only.');
    }
  }
  
  var agreeTerms = document.getElementById('agree_terms');
  if (!agreeTerms || !agreeTerms.checked) {
    messages.push('You must read and agree to the Terms and Conditions to continue.');
  }

  if (messages.length > 0) {
    e.preventDefault();
    errorEl.textContent = messages[0];
    return; // Stop here if validation fails
  }

  // ✅ SUCCESS: Check biometric type for redirect
  if (biometricType.value === 'face_scan') {
    e.preventDefault(); // Prevent PHP submission
    
    // Save ALL form data to localStorage
    var formData = {
      full_name: fullName.value,
      email: email.value,
      phone: phone.value,
      dob: dob.value,
      gov_id_type: gov_idType.value,
      gov_id_number: govIdNumber.value,
      employment_status: employmentStatus.value,
      occupation: occupation.value,
      employer_name: employerName.value,
      income_sources: incomeSources.value,
      account_purpose: accountPurpose.value,
      transaction_nature: transactionNature.value,
      biometric_type: 'face_scan',
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cpi_data', JSON.stringify(formData));
    window.location.href = 'facescan.html';
    if (messages.length > 0) {
      e.preventDefault();
      errorEl.textContent = messages[0];
      return;
    }
  
    // ✅ SUCCESS: Check biometric type for redirect
    if (biometricType.value === 'face_scan') {
      e.preventDefault();
      
      var formData = {
        full_name: fullName.value,
        email: email.value,
        phone: phone.value,
        dob: dob.value,
        gov_id_type: govIdType.value,
        gov_id_number: govIdNumber.value,
        employment_status: employmentStatus.value,
        occupation: occupation.value,
        employer_name: employerName.value,
        income_sources: incomeSources.value,
        account_purpose: accountPurpose.value,
        transaction_nature: transactionNature.value,
        biometric_type: 'face_scan',
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('cpi_data', JSON.stringify(formData));
      window.location.href = 'facescan.html';
      return;  // ← EXIT DONT MOVE IT
    }
  
    // For other biometrics (photo/fingerprint), submit normally to PHP
    successEl.textContent = 'Submitting...';
  }); // ← Closes form.addEventListener
  
  } // ← Closes initFormValidation
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormValidation);
  } else {
    initFormValidation();
  }
  })(); // ← Closes IIFE
  