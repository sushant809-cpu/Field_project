const http = require("http");
const fs = require("fs");
const path = require("path");
const URL = require("url");
const PORT = 5000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, "database.json");

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch (e) { return { jobs: [], users: [], applications: [], savedJobs: [] }; }
}
function writeDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8"); }
function send(res, status, data, type="application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = ""; req.on("data", c => raw += c);
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch(e) { reject(e); } });
  });
}
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const parsed = URL.parse(req.url, true);
  const route = parsed.pathname;
  const db = readDB();
  try {
    if (req.method === "GET" && (route === "/" || route === "/frontend.html")) {
      return send(res, 200, fs.readFileSync(path.join(ROOT, "frontend.html"), "utf8"), "text/html; charset=utf-8");
    }
    if (req.method === "GET" && route === "/api/health") return send(res, 200, { ok: true, database: "database.json", jobCount: db.jobs.length });
    if (req.method === "GET" && route === "/api/jobs") {
      let items = db.jobs;
      const q = (parsed.query.q || "").toLowerCase();
      const category = parsed.query.category || "All categories";
      const mode = parsed.query.mode || "Any work mode";
      const type = parsed.query.type || "Any type";
      if (q) items = items.filter(j => [j.title,j.company,j.location,j.category,...j.skills].join(" ").toLowerCase().includes(q));
      if (category !== "All categories") items = items.filter(j => j.category === category);
      if (mode !== "Any work mode") items = items.filter(j => j.mode === mode);
      if (type !== "Any type") items = items.filter(j => j.type === type);
      return send(res, 200, { jobs: items, total: items.length });
    }
    if (req.method === "POST" && route === "/api/register") {
      const data = await body(req);
      if (!data.name || !data.email || !data.password) return send(res, 400, { error: "Name, email and password are required." });
      if (db.users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) return send(res, 409, { error: "This email is already registered." });
      const user = { id: Date.now(), name: data.name.trim(), email: data.email.trim(), password: data.password, createdAt: new Date().toISOString() };
      db.users.push(user); writeDB(db);
      return send(res, 201, { message: "Account created.", user: { id:user.id, name:user.name, email:user.email } });
    }
    if (req.method === "POST" && route === "/api/login") {
      const data = await body(req);
      const user = db.users.find(u => u.email.toLowerCase() === String(data.email||"").toLowerCase() && u.password === data.password);
      if (!user) return send(res, 401, { error: "Email or password is incorrect." });
      return send(res, 200, { message: "Welcome back.", user: { id:user.id, name:user.name, email:user.email } });
    }
    if (req.method === "POST" && route === "/api/apply") {
      const data = await body(req);
      if (!data.name || !data.email || !data.jobId) return send(res, 400, { error: "Please enter your name, email and choose a job." });
      if (!db.jobs.some(j => j.id === Number(data.jobId))) return send(res, 404, { error: "Job not found." });
      if (db.applications.some(a => a.email.toLowerCase() === data.email.toLowerCase() && a.jobId === Number(data.jobId))) return send(res, 409, { error: "You have already applied for this job." });
      const app = { id: Date.now(), jobId:Number(data.jobId), name:data.name.trim(), email:data.email.trim(), phone:data.phone||"", note:data.note||"", status:"Submitted", appliedAt:new Date().toISOString() };
      db.applications.push(app); writeDB(db);
      return send(res, 201, { message:"Application submitted successfully.", application:app });
    }
    if (req.method === "GET" && route === "/api/applications") {
      const email = (parsed.query.email || "").toLowerCase();
      const apps = db.applications.filter(a => !email || a.email.toLowerCase() === email).map(a => ({...a, job: db.jobs.find(j => j.id === a.jobId)}));
      return send(res, 200, { applications:apps, total:apps.length });
    }
    if (req.method === "POST" && route === "/api/save-job") {
      const data = await body(req);
      if (!data.email || !data.jobId) return send(res, 400, {error:"Email and job ID are required."});
      if (!db.jobs.some(j => j.id === Number(data.jobId))) return send(res, 404, {error:"Job not found."});
      if (!db.savedJobs.some(s => s.email.toLowerCase() === data.email.toLowerCase() && s.jobId === Number(data.jobId))) db.savedJobs.push({email:data.email,jobId:Number(data.jobId),savedAt:new Date().toISOString()});
      writeDB(db); return send(res, 201, {message:"Job saved."});
    }
    if (req.method === "GET" && route === "/api/stats") return send(res, 200, { jobs:db.jobs.length, companies:new Set(db.jobs.map(j=>j.company)).size, remote:db.jobs.filter(j=>j.mode==="Remote").length, internships:db.jobs.filter(j=>j.type==="Internship").length, applications:db.applications.length, users:db.users.length });
    return send(res, 404, { error:"Route not found." });
  } catch (e) { console.error(e); return send(res, 500, { error:"Server error. Check the terminal." }); }
});
server.listen(PORT, () => console.log(`SkillBridge Pro running at http://localhost:${PORT}\nJobs loaded from database.json: ${readDB().jobs.length}\nPress Ctrl+C to stop.`));
