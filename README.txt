SKILLBRIDGE PRO — 3-FILE FULL-STACK COLLEGE PROJECT

Files:
- frontend.html: responsive UI, search/filter, job cards, job details, application form, application tracker, category filters, live statistics
- backend.js: Node.js built-in HTTP server and API; no external npm packages required
- database.json: JSON-file database with 20 sample job/internship listings; applications and users are stored here

Run:
1. Install Node.js LTS from https://nodejs.org/en/download
2. Extract this ZIP.
3. Open the extracted SkillBridge_Pro folder in VS Code.
4. Open Terminal > New Terminal.
5. Run: node backend.js
6. Open http://localhost:5000 in your browser.
7. Stop the server with Ctrl+C.

Important:
- Do not open frontend.html directly as a file. Use http://localhost:5000 so the frontend can call the backend API.
- Data is saved locally in database.json.
- This is a student demonstration project. It uses plain JSON storage and basic demo login logic, not production-grade authentication. Do not use real passwords or sensitive personal data.
- Job listings are sample/demo data, not verified real vacancies.
