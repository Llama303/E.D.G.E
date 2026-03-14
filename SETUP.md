# E.D.G.E – Local development & cloud setup

## 1. Local development on Windows (step by step)

### 1.1 Install XAMPP

1. Go to [Apache Friends – XAMPP](https://www.apachefriends.org) and download the **Windows** installer.
2. Run the installer. Ensure **Apache**, **MySQL**, **PHP**, and **phpMyAdmin** are selected.
3. Install to the default folder (e.g. `C:\xampp`).

### 1.2 Start Apache and MySQL

1. Open **XAMPP Control Panel** (`C:\xampp\xampp-control.exe`).
2. Click **Start** for **Apache** and **MySQL**.
3. Both should show a green status (Apache on port 80, MySQL on 3306).

### 1.3 Put the project in htdocs

1. Open `C:\xampp\htdocs`.
2. Create a folder, e.g. `edge`.
3. Copy your whole project into it:
   - From: `d:\Users\HP\Desktop\E.D.G.E\`
   - To: `C:\xampp\htdocs\edge\`
4. You should have:
   - `C:\xampp\htdocs\edge\CPI\CPI.html`
   - `C:\xampp\htdocs\edge\CPI\Cpi.js`
   - `C:\xampp\htdocs\edge\CPI\verify_identity.php`
   - `C:\xampp\htdocs\edge\CPI\config.php`
   - `C:\xampp\htdocs\edge\CPI\schema.sql`

### 1.4 Create the database

1. In your browser, open **http://localhost/phpmyadmin**.
2. Click the **SQL** tab.
3. Open `CPI/schema.sql` from your project and copy its contents (or run the SQL below).
4. Paste into the SQL box and click **Go**.

If you prefer to create the database manually:

- Create database: name `edge_db`, collation `utf8mb4_unicode_ci`.
- Then run the `CREATE TABLE ... cpi_submissions ...` part of `CPI/schema.sql` inside `edge_db`.

### 1.5 Configure the app (local)

- Open `CPI/config.php`.
- For local XAMPP, keep:
  - `$dbHost = 'localhost';`
  - `$dbName = 'edge_db';`
  - `$dbUser = 'root';`
  - `$dbPass = '';`
- If you set a MySQL root password in XAMPP, set `$dbPass` to that password.

### 1.6 Test the form

1. In the browser go to: **http://localhost/edge/CPI/CPI.html**
2. Fill the form (including email and phone), upload the required files, and submit.
3. You should be redirected back with a success message.
4. In phpMyAdmin, open database `edge_db` → table `cpi_submissions` to see the new row.
5. Uploaded files are in `C:\xampp\htdocs\edge\CPI\uploads\`.

---

## 2. Using MAMP instead of XAMPP

- Download [MAMP](https://www.mamp.info) for Windows and install.
- Start **Apache** and **MySQL** from the MAMP control panel.
- Put the project in MAMP’s web root:
  - Usually `C:\MAMP\htdocs\edge\` (copy the same folder structure as above).
- In phpMyAdmin (**http://localhost:8888/phpMyAdmin/** if MAMP uses port 8888), create `edge_db` and run `schema.sql`.
- Open **http://localhost:8888/edge/CPI/CPI.html** (or the URL MAMP shows) to test.
- If MAMP’s MySQL user/password differ from `root`/empty, update `CPI/config.php` with the correct `$dbUser` and `$dbPass`.

---

## 3. Pointing to a cloud MySQL database

To use a cloud MySQL server (e.g. AWS RDS, PlanetScale, DigitalOcean, etc.):

1. Create a MySQL database on your provider and note:
   - Host (e.g. `your-db.region.rds.amazonaws.com`)
   - Database name (e.g. `edge_db`)
   - Username and password
2. Run the same `schema.sql` (or its `CREATE TABLE`) on the cloud database so the `cpi_submissions` table exists.
3. In **CPI/config.php**:
   - Set `$dbHost` to the cloud host.
   - Set `$dbName`, `$dbUser`, and `$dbPass` to the cloud database name, user, and password.
   - (Optional) Comment out the local defaults so only cloud values are used.
4. Deploy your PHP app (including `CPI/` and `config.php`) to a host that can reach the cloud MySQL (e.g. same VPC or allowed IP).
5. Ensure the cloud MySQL user has permission to connect from your server’s IP (or from anywhere if the provider allows it; restrict in production).

**Security:** For production, do not commit real passwords. Use environment variables or a config file that is not in version control, and load them in `config.php` instead of hardcoding.

---

## 4. Validation (email & phone)

- **Email:** Must match a valid format (e.g. `name@example.com`); checked in both the browser (Cpi.js) and in PHP (`filter_var(..., FILTER_VALIDATE_EMAIL)`).
- **Phone:** Only digits are counted; length must be between 7 and 15 digits. Formatting (spaces, dashes, plus) is ignored for validation.

---

## 5. Files involved

| File | Purpose |
|------|--------|
| `CPI/CPI.html` | CPI form (includes email and phone fields). |
| `CPI/Cpi.js` | Client-side validation and employment-field visibility. |
| `CPI/verify_identity.php` | Form handler: validation, uploads, database insert. |
| `CPI/config.php` | Database host, name, user, password (local vs cloud). |
| `CPI/schema.sql` | Database and table creation script. |
| `CPI/uploads/` | Created automatically; stores uploaded ID, proof of address, selfie. |
