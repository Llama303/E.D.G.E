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
      // Initialize visibility on load
      updateEmploymentFieldsVisibility();
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
      var selfiePhoto = document.getElementById('selfie_photo');

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

      var phoneDigits = phone ? phone.value.replace(/\D/g, '') : '';
      if (!phone || !phone.value.trim()) {
        messages.push('Please enter your phone number.');
      } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        messages.push('Please enter a valid phone number (7–15 digits).');
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

      if (!selfiePhoto || !selfiePhoto.files || selfiePhoto.files.length === 0) {
        messages.push('Please upload a selfie / face photo for verification.');
      }

      if (messages.length > 0) {
        e.preventDefault();
        errorEl.textContent = messages[0];
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormValidation);
  } else {
    initFormValidation();
  }
})();