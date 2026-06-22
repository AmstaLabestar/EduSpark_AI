// End-to-end smoke test against the live Supabase project.
// Reproduit le parcours complet: enseignant -> cours -> exercices IA -> eleve -> tuteur IA.
const URL = "https://cfmgbtszysqdlhhqgrvl.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWdidHN6eXNxZGxoaHFncnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTYxNDUsImV4cCI6MjA5NzY5MjE0NX0.wq8rqIlbOWpxqh4yYfxOAt99nPQebYH29rENOihoqhA";

const ts = Date.now();
const teacherEmail = `prof.demo.${ts}@example.com`;
const studentEmail = `eleve.demo.${ts}@example.com`;
const password = "DemoPass123!";

const courseText = `Le cycle de l'eau.
Le cycle de l'eau decrit les mouvements continus de l'eau sur, au-dessus et sous la surface de la Terre.
1. L'evaporation: sous l'effet de la chaleur du Soleil, l'eau des oceans, des lacs et des rivieres se transforme en vapeur d'eau et monte dans l'atmosphere.
2. La condensation: en altitude, la vapeur d'eau se refroidit et se transforme en minuscules gouttelettes qui forment les nuages.
3. Les precipitations: quand les gouttelettes deviennent trop lourdes, elles tombent sous forme de pluie, de neige ou de grele.
4. Le ruissellement et l'infiltration: l'eau qui tombe ruisselle vers les rivieres et les oceans, ou s'infiltre dans le sol pour alimenter les nappes phreatiques.
Ce cycle est essentiel a la vie sur Terre car il renouvelle sans cesse les reserves d'eau douce.`;

function log(step, ok, detail) {
  const mark = ok ? "OK " : "ECHEC";
  console.log(`[${mark}] ${step}${detail ? " -> " + detail : ""}`);
}

async function api(path, { method = "GET", token, body, headers = {} } = {}) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token ?? ANON}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

async function signup(email) {
  const res = await api("/auth/v1/signup", {
    method: "POST",
    body: { email, password, data: { full_name: email.split("@")[0], role: email.startsWith("prof") ? "teacher" : "student" } },
  });
  return res;
}

async function main() {
  let failures = 0;
  const fail = () => { failures++; };

  // 1. Teacher signup
  const t = await signup(teacherEmail);
  const teacherToken = t.json?.access_token;
  log("Inscription enseignant", !!teacherToken, teacherToken ? "session obtenue" : JSON.stringify(t.json));
  if (!teacherToken) return fail(), finish(failures);

  // Some projects set role via metadata trigger; ensure profile role is teacher
  // (handle_new_user reads raw_user_meta_data->>'role')

  // 2. Create course
  const c = await api("/rest/v1/rpc/create_course", {
    method: "POST",
    token: teacherToken,
    body: { p_title: "Le cycle de l'eau", p_description: "Cours de SVT - 6eme", p_content_text: courseText },
  });
  const course = Array.isArray(c.json) ? c.json[0] : c.json;
  const courseId = course?.id;
  const courseCode = course?.course_code;
  log("Creation du cours", !!courseId, courseId ? `id=${courseId} code=${courseCode}` : `HTTP ${c.status} ${JSON.stringify(c.json)}`);
  if (!courseId) { fail(); return finish(failures); }

  // 3. Generate exercises (Gemini)
  const gx = await api("/functions/v1/generate-exercises", {
    method: "POST",
    token: teacherToken,
    body: { courseId, count: 4 },
  });
  const exOk = gx.status === 200 && Array.isArray(gx.json?.questions) && gx.json.questions.length >= 3;
  log("Generation exercices IA (Gemini)", exOk, exOk ? `${gx.json.questions.length} questions, titre="${gx.json.title}"` : `HTTP ${gx.status} ${JSON.stringify(gx.json)}`);
  if (!exOk) fail();

  // 4. Student signup
  const s = await signup(studentEmail);
  const studentToken = s.json?.access_token;
  log("Inscription eleve", !!studentToken, studentToken ? "session obtenue" : JSON.stringify(s.json));
  if (!studentToken) { fail(); return finish(failures); }

  // 5. Enroll with code
  const e = await api("/rest/v1/rpc/enroll_with_code", {
    method: "POST",
    token: studentToken,
    body: { p_code: courseCode },
  });
  const enrolledId = typeof e.json === "string" ? e.json : e.json;
  const enrollOk = e.status === 200 && !!enrolledId;
  log("Inscription au cours par code", enrollOk, enrollOk ? `course=${enrolledId}` : `HTTP ${e.status} ${JSON.stringify(e.json)}`);
  if (!enrollOk) fail();

  // 6. Ask AI (Gemini)
  const a = await api("/functions/v1/ask-ai", {
    method: "POST",
    token: studentToken,
    body: { courseId, question: "Qu'est-ce que l'evaporation dans le cycle de l'eau ?" },
  });
  const askOk = a.status === 200 && typeof a.json?.answer === "string" && a.json.answer.length > 10;
  log("Question au tuteur IA (Gemini)", askOk, askOk ? `reponse: "${a.json.answer.slice(0, 120).replace(/\n/g, " ")}..."` : `HTTP ${a.status} ${JSON.stringify(a.json)}`);
  if (!askOk) fail();

  // 7. Practice quiz generated by the student (ephemeral, member-only)
  const pq = await api("/functions/v1/practice-quiz", {
    method: "POST",
    token: studentToken,
    body: { courseId, count: 4 },
  });
  const pqOk = pq.status === 200 && Array.isArray(pq.json?.questions) && pq.json.questions.length >= 3;
  log("Quiz d'entrainement eleve (Gemini)", pqOk, pqOk ? `${pq.json.questions.length} questions, titre="${pq.json.title}"` : `HTTP ${pq.status} ${JSON.stringify(pq.json)}`);
  if (!pqOk) fail();

  finish(failures);
}

function finish(failures) {
  console.log("\n=====================================");
  console.log(failures === 0 ? "RESULTAT: TOUT FONCTIONNE ✅" : `RESULTAT: ${failures} etape(s) en echec ❌`);
  console.log("=====================================");
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
