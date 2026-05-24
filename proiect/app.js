// ============================================================
//  AIgriculture — app.js v2.0 COMPLET
//  Module: Auth, Parcele, Lucrări, Recolte, Rotație, Fitosanitar,
//          Utilaje, Meteo, Contabilitate, Profitabilitate,
//          Știri, Asistent AI, Note & Memento-uri
// ============================================================

const SUPA_URL = 'https://fgbmyveuixrunftivciu.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYm15dmV1aXhydW5mdGl2Y2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0Mzg5MTMsImV4cCI6MjA5NTAxNDkxM30.2oKCF6kHiVMSadJIpFRlzOhZ0pqwPBcwfuHaLVpj3Ak';
const sb = supabase.createClient(SUPA_URL, SUPA_KEY);
const STRIPE_PK = 'pk_test_51TaAiK3EoI10wDe85CSQhwTSTlEhweNExcrZRkF2t1cVuQRBEwQYrZzHp9ZbmPvQbINWAwic7SpNC9V1m2fgXQ4y00xLeE2tCe';
const STRIPE_STANDARD = 'price_1TaAk63EoI10wDe8SzYSbIhl';
const STRIPE_PRO = 'price_1TaAkN3EoI10wDe8wdW36exw';
let stripeInstance = null;
let stripeElements = null;
let currentPriceId = null;
let currentSubscriptionId = null;
let userPlan = 'gratuit';
let currentUser = null;
let parceleData = [], cheltuieliData = [], lucrariData = [];
let recolteData = [], utilajeData = [], fitosanitarData = [];
let rotatieData = [], noteData = [];
let leafletMap = null, drawnItems = null;
let toateStirile = [], chatHistory = [];
let meteoChart = null;
let aniAgricoliData = [];
// ============================================================
//  UTILITARE GENERALE
// ============================================================
// Detectare reset password token din URL
async function verificaResetToken() {
  const hash = window.location.hash;
  if (hash && hash.includes('type=recovery')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      await sb.auth.setSession({ access_token: accessToken, refresh_token: params.get('refresh_token') });
      deschideModalResetParola();
    }
  }
}
function deschideModalResetParola() {
  const modal = document.createElement('div');
  modal.id = 'modal-reset-parola';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = '<div style="background:var(--white);border-radius:20px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,0.3);padding:36px">'
    +'<div style="text-align:center;margin-bottom:24px">'
    +'<div style="font-family:\'Lora\',serif;font-size:22px;font-weight:700;color:var(--soil);margin-bottom:8px">Parolă nouă</div>'
    +'<div style="font-size:14px;color:var(--gray-500)">Introduceți noua parolă pentru contul tău AIgriculture.</div>'
    +'</div>'
    +'<div class="form-group"><label>Parolă nouă</label><input type="password" id="reset-pass-nou" placeholder="Minim 6 caractere"></div>'
    +'<div class="form-group"><label>Confirmă parola</label><input type="password" id="reset-pass-confirm" placeholder="Repetă parola"></div>'
    +'<div id="reset-msg"></div>'
    +'<button class="btn btn-primary" onclick="salveazaParolaNoua()"><i class="ti ti-lock"></i> Salvează parola</button>'
    +'</div>';
  document.body.appendChild(modal);
}

async function salveazaParolaNoua() {
  const pass = document.getElementById('reset-pass-nou').value;
  const confirm = document.getElementById('reset-pass-confirm').value;
  const msg = document.getElementById('reset-msg');
  if (pass.length < 6) { msg.innerHTML='<div class="msg-box msg-error">Parola trebuie să aibă minim 6 caractere.</div>'; return; }
  if (pass !== confirm) { msg.innerHTML='<div class="msg-box msg-error">Parolele nu coincid.</div>'; return; }
  const { error } = await sb.auth.updateUser({ password: pass });
  if (error) { msg.innerHTML='<div class="msg-box msg-error">Eroare: '+error.message+'</div>'; return; }
  document.getElementById('modal-reset-parola').remove();
  showToast('Parolă schimbată cu succes!','success', 5000);
  await sb.auth.signOut();
  showScreen('auth');
}
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]||t));
}
function showLoading(v) { const el = document.getElementById('loading-overlay'); if (el) el.style.display = v ? 'flex' : 'none'; }
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById('screen-'+id)?.classList.add('active'); }
function showToast(msg, type='success', duration=4000) {
  const t = document.getElementById('toast'); if (!t) return;
  const icons = {success:'ti-circle-check',error:'ti-circle-x',info:'ti-info-circle'};
  t.className = 'toast toast-'+type;
  t.innerHTML = `<i class="ti ${icons[type]||'ti-info-circle'}" style="font-size:18px;flex-shrink:0"></i> ${msg}`;
  t.style.display = 'flex'; clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.display = 'none'; }, duration);
}
function showAuthMsg(msg, type) {
  const box = document.getElementById('auth-msg-box'); if (!box) return;
  const icons = {error:'ti-alert-circle',success:'ti-circle-check',info:'ti-info-circle',warning:'ti-alert-triangle'};
  box.innerHTML = `<div class="msg-box msg-${type}"><i class="ti ${icons[type]}" style="font-size:18px;flex-shrink:0;margin-top:1px"></i><div>${msg}</div></div>`;
}
function clearAuthMsg() { const b = document.getElementById('auth-msg-box'); if (b) b.innerHTML = ''; }
function setLoading(btnId, loading, icon, text) {
  const btn = document.getElementById(btnId); if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? `<div class="spinner"></div> ${text||'Se procesează...'}` : `<i class="ti ${icon}"></i> ${text}`;
}
function fmtRON(v) { return (parseFloat(v)||0).toLocaleString('ro-RO',{maximumFractionDigits:0})+' RON'; }
function fmtData(d) { return d ? new Date(d).toLocaleDateString('ro-RO') : '—'; }

// ============================================================
//  SIDEBAR & NAVIGAȚIE
// ============================================================
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('active');
}
function switchTab(id, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+id)?.classList.add('active');
  if (btn) btn.classList.add('active');
  // Închide sidebar pe mobile
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
  // Hook-uri per tab
if (id === 'contabilitate') { if(typeof renderTabelCheltuieli === 'function') renderTabelCheltuieli(null); updateSumeContabilitate(); renderCatBars(); }  if (id === 'profitabilitate') calculeazaProfitabilitate();
  if (id === 'rotatie') renderRotatieTabel();
  if (id === 'stiri' && toateStirile.length === 0) incarcaStiri();
if (id === 'calendar') { window.calendarExtins=false; renderCalTimeline(); renderCalSumar(); renderRotatieAlerte(); }
if (id === 'harta') { setTimeout(() => initMapFull(), 100); }
}
// ============================================================
//  AUTENTIFICARE
// ============================================================
function switchAuthTab(t) {
  document.getElementById('tab-login-btn')?.classList.toggle('active', t==='login');
  document.getElementById('tab-reg-btn')?.classList.toggle('active', t==='register');
  document.getElementById('login-form').style.display = t==='login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = t==='register' ? 'block' : 'none';
  clearAuthMsg();
}
async function initApp() {
  // Verificam mai intai daca e un token de reset parola in URL
  const hash = window.location.hash;
  if (hash && hash.includes('type=recovery')) {
    showLoading(false);
    showScreen('auth');
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      await sb.auth.setSession({ access_token: accessToken, refresh_token: params.get('refresh_token')||'' });
      deschideModalResetParola();
    }
    return;
  }

  // Curatam token-uri invalide
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' && !session) {
      sb.auth.signOut();
      showScreen('auth');
    }
  });

  showLoading(true);
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session) await loadUser(session.user); else showScreen('auth');
  } catch(e) {
    await sb.auth.signOut();
    showScreen('auth');
  }
  showLoading(false);
}
async function loadUser(user) {
  currentUser = user;
  const m = user.user_metadata || {};
const topUser = document.getElementById('top-user');
  if (topUser) topUser.textContent = (m.prenume||'Fermier')+' '+(m.nume||'');
  document.getElementById('top-judet').innerHTML = '<i class="ti ti-map-pin"></i> '+(m.judet||'România');
  document.getElementById('sidebar-user-name').textContent = (m.prenume||'Fermier')+' '+(m.nume||'');
  document.getElementById('sidebar-user-judet').textContent = m.judet||'România';
  showScreen('app');
  const today = new Date().toISOString().split('T')[0];
  ['p-data','c-data','luc-data','rec-data','fito-data'].forEach(id => { const el=document.getElementById(id); if(el) el.value=today; });
  document.getElementById('rec-sezon').value = new Date().getFullYear();
  if (m.judet) { const ml=document.getElementById('meteo-loc'); if(ml){ml.value=m.judet;cautaMeteo();} }
await Promise.all([loadParcele(), loadCheltuieli(), loadLucrari(), loadRecolte(), loadUtilaje(), loadFitosanitar(), loadRotatie(), loadNote(), loadAniAgricoli()]);updateAllParcelaSelects();  updateDashboard();
  incarcaPreturiLive();
}
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!email||!pass) { showAuthMsg('Completați email-ul și parola.','error'); return; }
  setLoading('login-btn',true,'','Se autentifică...');
  clearAuthMsg();
  const { data, error } = await sb.auth.signInWithPassword({email, password: pass});
  setLoading('login-btn',false,'ti-login','Intră în cont');
  if (error) { showAuthMsg('Email sau parolă incorectă.','error'); return; }
  showToast('Bun venit, '+(data.user.user_metadata?.prenume||'Fermier')+'! 🌾','success');
  await loadUser(data.user);
}
function deschideModalSumarCal() {
  renderCalSumar();
  document.getElementById('modal-cal-sumar').style.display = 'flex';
}
async function resetParola() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { showToast('Introduceți email-ul mai întâi.','error'); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://aigriculture.ro'
  });
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('Email de resetare trimis! Verificați căsuța poștală.','success', 6000);
}

async function doRegister() {
  const prenume=document.getElementById('reg-prenume').value.trim(), nume=document.getElementById('reg-nume').value.trim();
  const email=document.getElementById('reg-email').value.trim(), judet=document.getElementById('reg-judet').value;
  const tip=document.getElementById('reg-tip').value;
  const pass=document.getElementById('reg-pass').value, pass2=document.getElementById('reg-pass2').value;
  clearAuthMsg();
  if (!prenume||!nume||!email||!judet) { showAuthMsg('Completați toate câmpurile.','error'); return; }
  if (pass.length<6) { showAuthMsg('Parola trebuie să aibă minim 6 caractere.','error'); return; }
  if (pass!==pass2) { showAuthMsg('Parolele nu coincid.','error'); return; }
  setLoading('reg-btn',true,'','Se creează contul...');
  const { data, error } = await sb.auth.signUp({email, password: pass, options:{data:{prenume,nume,judet,tip_ferma:tip}}});
  setLoading('reg-btn',false,'ti-user-plus','Creează cont gratuit');
  if (error) { showAuthMsg(error.message,'error'); return; }
  document.getElementById('auth-content').style.display = 'none';
  document.getElementById('auth-success').style.display = 'block';
  const msgEl = document.getElementById('success-msg-text');
  if (msgEl) msgEl.innerHTML = data.session ? `Bun venit, <b>${prenume}</b>! Contul a fost creat.` : `Verificați email-ul <b>${email}</b> pentru confirmare.`;
  if (data.session) currentUser = data.user;
}
function goToApp() { if (currentUser) { loadUser(currentUser); showToast('Bun venit în AIgriculture! 🌾','success',5000); } else { document.getElementById('auth-content').style.display='block'; document.getElementById('auth-success').style.display='none'; switchAuthTab('login'); } }
async function doLogout() {
  await sb.auth.signOut();
  currentUser = null;
  parceleData = []; cheltuieliData = []; lucrariData = []; recolteData = [];
  utilajeData = []; fitosanitarData = []; rotatieData = []; noteData = [];
  aniAgricoliData = [];
  cheltuieliTipFilter = ''; cheltuieliSortCol = null;
  if (leafletMap) { leafletMap.remove(); leafletMap = null; drawnItems = null; }
  if (leafletMapFull) { leafletMapFull.remove(); leafletMapFull = null; }
  window.location.reload();
}
sb.auth.onAuthStateChange((event) => { if (event==='SIGNED_OUT') showScreen('auth'); });
// ============================================================
//  PARCELE
// ============================================================
async function loadParcele() {
  if (!currentUser) return;
  const { data, error } = await sb.from('parcele').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
  if (!error && data) { parceleData=data; renderListaParcele(); renderCulturaBars(); updateAllParcelaSelects(); reincarcaParcelePeHarta(); }
reincarcaParcelePeHartaFull();
}
async function adaugaParcela() {
  const n=document.getElementById('p-nume').value.trim(), ha=parseFloat(document.getElementById('p-ha').value)||0;
  const c=document.getElementById('p-cultura').value, l=document.getElementById('p-loc').value.trim();
  const d=document.getElementById('p-data').value, note=document.getElementById('p-note').value.trim();
  const coord=document.getElementById('p-coordonate').value, editId=document.getElementById('p-id-edit').value;
  if (!n||!ha||!c) { showToast('Completați numele, suprafața și cultura.','error'); return; }
  setLoading('p-btn',true,'','Se salvează...');
  const payload = {user_id:currentUser.id,nume:n,suprafata_ha:ha,cultura:c,localitate:l||null,data_semanat:d||null,note:note||null,coordonate:coord||null};
  const { error } = editId ? await sb.from('parcele').update(payload).eq('id',editId) : await sb.from('parcele').insert([payload]);
  setLoading('p-btn',false,'ti-plus','Adaugă parcelă');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  // Salvăm automat și în rotație culturi
  if (!editId && c && d) { const sezon = new Date(d).getFullYear().toString(); await sb.from('rotatie_culturi').insert([{user_id:currentUser.id,parcela_nume:n,sezon,cultura:c}]); }
  showToast(editId?'Parcelă actualizată!':'Parcelă adăugată cu succes!','success');
  resetFormParcela();
await loadParcele(); await loadRotatie(); updateDashboard();
}
function resetFormParcela() {
  document.getElementById('p-id-edit').value=''; document.getElementById('p-coordonate').value='';
  document.getElementById('form-parcela-titlu').innerHTML='<i class="ti ti-plus" style="color:var(--ai-green)"></i> Adaugă parcelă nouă';
  document.getElementById('p-btn').innerHTML='<i class="ti ti-plus"></i> Adaugă parcelă';
  ['p-nume','p-ha','p-loc','p-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('p-cultura').value='';
  if (drawnItems) drawnItems.clearLayers();
}
function selecteazaSiIncarcaParcela(id) {
  const p = parceleData.find(x=>x.id===id); if (!p) return;
  document.getElementById('p-id-edit').value=p.id;
  document.getElementById('form-parcela-titlu').innerHTML='<i class="ti ti-edit" style="color:var(--wheat)"></i> Editare: '+escapeHTML(p.nume);
  document.getElementById('p-btn').innerHTML='<i class="ti ti-device-floppy"></i> Salvează Modificările';
  document.getElementById('p-nume').value=p.nume; document.getElementById('p-ha').value=p.suprafata_ha;
  document.getElementById('p-cultura').value=p.cultura; document.getElementById('p-loc').value=p.localitate||'';
  if (p.data_semanat) document.getElementById('p-data').value=p.data_semanat;
  document.getElementById('p-note').value=p.note||''; document.getElementById('p-coordonate').value=p.coordonate||'';
  if (p.coordonate && drawnItems && leafletMap) { try { drawnItems.clearLayers(); const ll=JSON.parse(p.coordonate); L.polygon(ll,{color:'#4a7c2f',fillColor:'#4a7c2f',fillOpacity:0.4}).addTo(drawnItems); leafletMap.fitBounds(drawnItems.getBounds()); } catch(e){} }
  showToast('Parcelă încărcată în formular.','info');
  document.getElementById('p-nume').focus();
  switchTab('parcele',document.querySelectorAll('.nav-btn')[1]);
}
async function stergeParcela(id,nume) {
  if (!confirm('Sigur ștergeți parcela "'+nume+'"?')) return;
  showLoading(true);
  await sb.from('parcele').delete().eq('id',id).eq('user_id',currentUser.id);
  showLoading(false); showToast('Parcela a fost ștearsă.','info');
  await loadParcele(); updateDashboard();
}
function renderListaParcele() {
  const cont=document.getElementById('lista-parcele'); if (!cont) return;
  if (!parceleData.length) { cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:20px">Nicio parcela adaugata.</div>'; return; }
  const cols=['var(--ai-green)','var(--wheat)','var(--ai-blue)','var(--bark)','#8e44ad'];
const maxVizibile = window.parcelExtins ? parceleData.length : 5;
const parceleFiltrate = parceleData.slice(0, maxVizibile);
cont.innerHTML=parceleFiltrate.map((p,i)=>{    const areCoord=p.coordonate?'<span style="color:var(--ai-green);font-size:11px;margin-left:6px"><i class="ti ti-map-pin"></i></span>':'';
    return '<div class="field-item" style="border-left-color:'+cols[i%cols.length]+';cursor:pointer" onclick="arataNoteparcela(\''+p.id+'\')">'
      +'<div style="flex-grow:1">'
      +'<div class="field-name">'+escapeHTML(p.nume)+areCoord+'</div>'
      +'<div class="field-meta">'+escapeHTML(p.cultura)+' · '+p.suprafata_ha+' ha · '+escapeHTML(p.localitate||'-')+' · '+fmtData(p.data_semanat)+'</div>'
      +'</div>'
      +'<div style="display:flex;gap:6px;align-items:center" onclick="event.stopPropagation()">'
      +'<span class="badge badge-green">'+escapeHTML(p.cultura)+'</span>'
      +'<button class="btn btn-ghost btn-sm" onclick="vizualizeazaParcela(\''+p.id+'\')" style="width:auto;padding:5px 10px" title="Vezi pe harta"><i class="ti ti-map-pin"></i></button>'
      +'<button class="btn btn-secondary btn-sm" onclick="selecteazaSiIncarcaParcela(\''+p.id+'\')" style="width:auto;padding:5px 10px" title="Editeaza"><i class="ti ti-edit"></i></button>'
      +'<button class="btn btn-danger btn-sm" onclick="stergeParcela(\''+p.id+'\',\''+escapeHTML(p.nume).replace(/'/g,"\\'")+'\')" style="width:auto;padding:5px 10px" title="Sterge"><i class="ti ti-trash"></i></button>'
      +'</div></div>';
  }).join('');
  if (parceleData.length > 5) {
  cont.innerHTML += '<div style="text-align:center;margin-top:12px">'
    +'<button class="btn btn-ghost" onclick="window.parcelExtins='+(!window.parcelExtins)+';renderListaParcele()" style="width:auto;padding:8px 20px">'
    +(window.parcelExtins
      ? '<i class="ti ti-chevron-up"></i> Restrânge'
      : '<i class="ti ti-chevron-down"></i> Vezi toate parcelele ('+parceleData.length+')')
    +'</button></div>';
}
  const total=parceleData.reduce((s,p)=>s+p.suprafata_ha,0);
  document.getElementById('p-total-num').textContent=parceleData.length+' parcele';
  document.getElementById('p-total-ha').textContent=total.toFixed(1)+' ha';
}
function arataNoteparcela(id) {
  const p = parceleData.find(x => x.id === id);
  if (!p) return;
  const note = p.note || 'Nicio notă adăugată pentru această parcelă.';
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:var(--white);border-radius:16px;padding:28px;max-width:480px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.3)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:600;color:var(--soil)">${escapeHTML(p.nume)}</div>
          <div style="font-size:13px;color:var(--gray-600);margin-top:2px">${escapeHTML(p.cultura)} · ${p.suprafata_ha} ha · ${escapeHTML(p.localitate||'—')}</div>
        </div>
        <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--gray-400);padding:4px 8px">×</button>
      </div>
      <div style="background:var(--mist);border-radius:10px;padding:16px;font-size:14px;line-height:1.7;color:var(--soil)">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--gray-400);margin-bottom:8px"><i class="ti ti-notes"></i> Note & Observații</div>
        ${escapeHTML(note)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">
        <div style="background:var(--ai-green-light);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:11px;color:var(--ai-green-dark);font-weight:600;text-transform:uppercase">Semănat</div>
          <div style="font-weight:700;color:var(--ai-green-dark)">${p.data_semanat ? fmtData(p.data_semanat) : '—'}</div>
        </div>
        <div style="background:var(--ai-blue-light);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:11px;color:var(--ai-blue-dark);font-weight:600;text-transform:uppercase">Suprafață</div>
          <div style="font-weight:700;color:var(--ai-blue-dark)">${p.suprafata_ha} ha</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button onclick="vizualizeazaParcela('${p.id}');this.closest('[style*=fixed]').remove()" class="btn btn-primary btn-sm" style="flex:1"><i class="ti ti-map-pin"></i> Vezi pe hartă</button>
        <button onclick="selecteazaSiIncarcaParcela('${p.id}');this.closest('[style*=fixed]').remove()" class="btn btn-ghost btn-sm" style="flex:1"><i class="ti ti-edit"></i> Editează</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
function renderCulturaBars() {
  const cultMap={};
  parceleData.forEach(p=>{cultMap[p.cultura]=(cultMap[p.cultura]||0)+p.suprafata_ha;});
  const cont=document.getElementById('cultura-bars'); if (!cont) return;
  if (!Object.keys(cultMap).length) { cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:16px">Nicio distributie.</div>'; return; }

  cont.innerHTML='<canvas id="cultura-pie-chart" style="max-height:260px"></canvas>';

  const culori=[
    '#2e8b2e','#c8902a','#1a6bbf','#8B6914',
    '#6B8E23','#4a7c8e','#8e44ad','#6b3d1e'
  ];
  const labels=Object.keys(cultMap);
  const valori=Object.values(cultMap);

  if (window.culturaChart) { window.culturaChart.destroy(); window.culturaChart=null; }

  const ctx=document.getElementById('cultura-pie-chart').getContext('2d');
  window.culturaChart=new Chart(ctx,{
    type:'doughnut',
    data:{
      labels:labels,
      datasets:[{
        data:valori,
        backgroundColor:culori.slice(0,labels.length),
        borderColor:'rgba(255, 255, 255, 0)',
        borderWidth:1,
        hoverOffset:20
      }]
    },
    options:{
      responsive:true,
      plugins:{
             legend:{
          position:'bottom',
          align:'center',
          labels:{
            font:{ family:'Inter', size:12 },
            padding:14,
            usePointStyle:true,
            pointStyleWidth:14
          }
        },
        tooltip:{
          callbacks:{
            label:function(ctx){
              const total=ctx.dataset.data.reduce((a,b)=>a+b,0);
              const pct=Math.round(ctx.parsed/total*100);
              return ' '+ctx.label+': '+ctx.parsed.toFixed(1)+' ha ('+pct+'%)';
            }
          }
        }
      },
      cutout:'60%'
    }
  });
}
function updateAllParcelaSelects() {
const selIds=['luc-parcela','luc-filter-parcela','rot-parcela','c-parcela','calc-parcela','cal-filter-parcela','filter-parcela-chelt'];  selIds.forEach(selId=>{
    const sel=document.getElementById(selId); if (!sel) return;
    const val=sel.value;
    sel.innerHTML='<option value="">Toate parcelele</option>';
    parceleData.forEach(p=>{const o=document.createElement('option');o.value=p.id||p.nume;o.textContent=p.nume;sel.appendChild(o);});
    if (val) sel.value=val;
  });
  const recSel = document.getElementById('rec-parcela');
if (recSel) {
  recSel.innerHTML = '<option value="">Selectează parcela</option>';
  parceleData.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.nume;
    recSel.appendChild(o);
  });
  recSel.onchange = autocompletezaSuprafataRecolta;
}
const fitoSel = document.getElementById('fito-parcela');
if (fitoSel) {
  fitoSel.innerHTML = '<option value="">Selectează...</option>';
  parceleData.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.nume;
    fitoSel.appendChild(o);
  });
  fitoSel.onchange = function() {
    const parcela = parceleData.find(x => x.id === this.value);
    if (!parcela) return;
    document.getElementById('fito-suprafata').value = parcela.suprafata_ha;
    document.getElementById('fito-cultura').value = parcela.cultura;
  };
}
const calSel = document.getElementById('cal-parcela');
if (calSel) {
  calSel.innerHTML = '<option value="">Selectează...</option>';
  parceleData.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.nume;
    calSel.appendChild(o);
  });
}
// Populăm selectele de utilaje din lucrări
const utilajeTractoare = utilajeData.filter(u => 
  ['Tractor','Combina','Generator'].includes(u.tip) && u.status === 'functional'
);
const utilajeImplemente = utilajeData.filter(u => 
  !['Tractor','Combina','Generator'].includes(u.tip) && u.status === 'functional'
);
const lucUtilajSel = document.getElementById('luc-utilaj');
if (lucUtilajSel) {
  const valCurenta = lucUtilajSel.value;
  lucUtilajSel.innerHTML = '<option value="">Selectează utilaj...</option>';
  if (utilajeTractoare.length) {
    utilajeTractoare.forEach(u => {
      const o = document.createElement('option');
      o.value = u.nume;
      o.textContent = u.nume + (u.marca ? ' · ' + u.marca : '') + (u.model ? ' ' + u.model : '');
      lucUtilajSel.appendChild(o);
    });
  } else {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = '— Niciun utilaj înregistrat —';
    o.disabled = true;
    lucUtilajSel.appendChild(o);
  }
  if (valCurenta) lucUtilajSel.value = valCurenta;
}

const lucImplementSel = document.getElementById('luc-implement');
if (lucImplementSel) {
  const valCurenta = lucImplementSel.value;
  lucImplementSel.innerHTML = '<option value="">Selectează implement...</option>';
  if (utilajeImplemente.length) {
    utilajeImplemente.forEach(u => {
      const o = document.createElement('option');
      o.value = u.nume;
      o.textContent = u.nume + ' · ' + u.tip;
      lucImplementSel.appendChild(o);
    });
  } else {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = '— Niciun implement înregistrat —';
    o.disabled = true;
    lucImplementSel.appendChild(o);
  }
  if (valCurenta) lucImplementSel.value = valCurenta;
}
}

// ============================================================
//  HARTĂ LEAFLET
// ============================================================
function initMap() {
  if (leafletMap) return;

  leafletMap = L.map('map', {
    zoomControl: true,
    attributionControl: false,
    tap: true,
    tapTolerance: 15
  }).setView([45.9432, 24.9668], 7);

L.tileLayer('https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=ro&gl=RO', {
      maxZoom: 21
  }).addTo(leafletMap);

  drawnItems = new L.FeatureGroup();
  leafletMap.addLayer(drawnItems);

  const drawControl = new L.Control.Draw({
    position: 'topleft',
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
        shapeOptions: {
          color: '#4a7c2f',
          fillColor: '#4a7c2f',
          fillOpacity: 0.35,
          weight: 2
        },
        repeatMode: false,
        touchIcon: new L.DivIcon({
          iconSize: new L.Point(20, 20),
          className: 'leaflet-div-icon leaflet-editing-icon'
        })
      },
      polyline: false, circle: false,
      rectangle: false, marker: false, circlemarker: false
    },
    edit: {
      featureGroup: drawnItems,
      edit: {
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.8,
          fillOpacity: 0.25
        }
      },
      remove: true
    }
  });

  leafletMap.addControl(drawControl);
// Buton custom de cautare
const SearchControl = L.Control.extend({
  options: { position: 'topleft' },
  onAdd: function() {
    const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    div.innerHTML = '<a href="#" title="Cauta localitate" style="font-size:16px;display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:#fff;text-decoration:none;color:#333" id="map-search-toggle"><i class="ti ti-search"></i></a>'
      + '<div id="map-search-popup" style="display:none;position:absolute;left:36px;top:0;background:#fff;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.2);padding:8px;display:none;gap:6px;min-width:260px;z-index:1000">'
      + '<input type="text" id="map-search-input" placeholder="Cauta localitate..." style="flex:1;padding:7px 10px;border:1.5px solid #e5e7eb;border-radius:6px;font-size:13px;outline:none;width:200px">'
      + '<button onclick="cautaLocatieHarta()" style="background:#16a34a;color:#fff;border:none;padding:7px 12px;border-radius:6px;cursor:pointer;font-size:13px"><i class="ti ti-search"></i></button>'
      + '</div>';
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.on(div.querySelector('#map-search-toggle'), 'click', function(e) {
      L.DomEvent.preventDefault(e);
      const popup = div.querySelector('#map-search-popup');
      popup.style.display = popup.style.display === 'none' ? 'flex' : 'none';
    });
    return div;
  }
});
leafletMap.addControl(new SearchControl());
  leafletMap.on(L.Draw.Event.CREATED, function(e) {
    drawnItems.clearLayers();
    const layer = e.layer;
    drawnItems.addLayer(layer);
    salveazaPoligon(layer.getLatLngs()[0]);
    showToast('Parcela conturata! Suprafata calculata automat.', 'success');
  });

leafletMap.on(L.Draw.Event.EDITED, function(e) {
    e.layers.eachLayer(function(layer) {
      if (layer.getLatLngs && typeof layer.getLatLngs === 'function') {
        const latlngs = layer.getLatLngs();
        if (latlngs && latlngs.length) {
          salveazaPoligon(Array.isArray(latlngs[0]) ? latlngs[0] : latlngs);
        }
      }
    });
    showToast('Contur actualizat!', 'info');
  });

  leafletMap.on(L.Draw.Event.DELETED, function() {
    document.getElementById('p-ha').value = '';
    document.getElementById('p-coordonate').value = '';
    showToast('Contur sters.', 'info');
  });

  leafletMap.on('draw:drawvertex', function(e) {
    const layers = e.layers;
if (layers) {
      layers.eachLayer(function(layer) {
        if (!layer.getLatLngs || typeof layer.getLatLngs !== 'function') return;
        const latlngs = layer.getLatLngs();
        const flatLatlngs = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
        if (flatLatlngs && flatLatlngs.length > 2) {
          const area = L.GeometryUtil.geodesicArea(flatLatlngs);
          const ha = (area / 10000).toFixed(2);
                    const haEl = document.getElementById('p-ha');
          if (haEl) haEl.value = ha;
        }
      });
    }
  });

  // Auto-zoom la parcelele existente
  if (parceleData.length > 0) {
    const parcelaLoc = parceleData.find(p => p.localitate);
    if (parcelaLoc) {
      cautaLocatieSilent(parcelaLoc.localitate);
    } else {
      const coordParcela = parceleData.find(p => p.coordonate);
      if (coordParcela) {
        try {
          const coords = JSON.parse(coordParcela.coordonate);
          if (coords.length > 0) {
            leafletMap.setView([coords[0].lat||coords[0][0], coords[0].lng||coords[0][1]], 14);
          }
        } catch(e) {}
      }
    }
  }

  reincarcaParcelePeHarta();
  showToast('Apasa iconita polygon din stanga pentru a contura parcela.', 'info', 5000);
}
let leafletMapFull = null;

function initMapFull() {
  if (leafletMapFull) { leafletMapFull.invalidateSize(); return; }
  
  leafletMapFull = L.map('map-full', {
    zoomControl: true,
    attributionControl: false,
    tap: true,
    tapTolerance: 15
  }).setView([45.9432, 24.9668], 7);

  L.tileLayer('https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 21
  }).addTo(leafletMapFull);

  reincarcaParcelePeHartaFull();
}
function reincarcaParcelePeHarta() {
  if (!leafletMap) return;
  leafletMap.eachLayer(l=>{if(l._isParcelaFundal)leafletMap.removeLayer(l);});
  const cols=['#4a7c2f','#c8902a','#2e6fa3','#6b3d1e','#8e44ad'];
  parceleData.forEach((p,i)=>{
    if (!p.coordonate) return;
    try {
      const ll=JSON.parse(p.coordonate);
      const poly=L.polygon(ll,{color:cols[i%cols.length],fillColor:cols[i%cols.length],fillOpacity:0.2,weight:2});
      poly._isParcelaFundal=true;
      poly.bindTooltip(p.nume+' ('+p.suprafata_ha+' ha)',{permanent:false});
      poly.addTo(leafletMap);
    } catch(e){}
  });
}
function reincarcaParcelePeHartaFull(anFiltru) {
  if (!leafletMapFull) return;
  leafletMapFull.eachLayer(l => { if (l instanceof L.Polygon) leafletMapFull.removeLayer(l); });

  const culoriCulturi = {
    'Grâu': '#22c55e', 'Orz': '#86efac', 'Orzoaică': '#bbf7d0',
    'Triticale': '#4ade80', 'Secară': '#16a34a', 'Porumb': '#facc15',
    'Floarea-soarelui': '#ef4444', 'Rapiță': '#f97316', 'Soia': '#a3e635',
    'Mazăre': '#bef264', 'Fasole': '#84cc16', 'Sfeclă de zahăr': '#e879f9',
    'Cartofi': '#d97706', 'Lucernă': '#2dd4bf', 'In pentru ulei': '#818cf8',
    'Coriandru': '#fb923c', 'Muștar': '#fbbf24', 'Altele': '#94a3b8'
  };
  const culoriParcele = ['#16a34a','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2'];

  const bounds = [];
  parceleData.forEach((p, index) => {
    if (!p.coordonate) return;
    try {
      const coords = JSON.parse(p.coordonate);
      if (!coords.length) return;
      const latlngs = coords.map(c => [c.lat||c[0], c.lng||c[1]]);
      const culoare = culoriCulturi[p.cultura] || culoriParcele[index % culoriParcele.length];
      
      let labelExtra = '';
      if (anFiltru && aniAgricoliData.length) {
        const anInfo = aniAgricoliData.find(a => a.parcela_id === p.id && a.an_agricol === anFiltru);
        if (anInfo) labelExtra = '<br><b>'+anInfo.cultura+'</b> · '+anInfo.status+(anInfo.productie_tone?' · '+anInfo.productie_tone+'t':'');
      }

      const polygon = L.polygon(latlngs, {
        color: culoare, fillColor: culoare, fillOpacity: 0.35, weight: 2.5
      }).addTo(leafletMapFull);

      polygon.bindPopup('<div style="min-width:160px">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
        +'<div style="width:12px;height:12px;border-radius:3px;background:'+culoare+'"></div>'
        +'<b style="font-size:14px">'+escapeHTML(p.nume)+'</b></div>'
        +'<div style="font-size:12px;color:#6b7280">'+escapeHTML(p.cultura||'—')+' · '+(p.suprafata_ha||0)+' ha</div>'
        +labelExtra+'</div>');

      bounds.push(...latlngs);
    } catch(e) {}
  });

  if (bounds.length) leafletMapFull.fitBounds(bounds, { padding: [30, 30] });
}

function filtreazaHartaAn() {
  const an = document.getElementById('harta-filter-an')?.value || '';
  reincarcaParcelePeHartaFull(an || null);
}

async function cautaLocatieSilent(localitate) {
  try {
    const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(localitate)+'&count=1&language=ro&format=json');
    const data = await res.json();
    if (data.results && data.results.length) {
      leafletMap.setView([data.results[0].latitude, data.results[0].longitude], 13);
    }
  } catch(e) {}
}
function salveazaPoligon(latlngs) {
  const ha=(L.GeometryUtil.geodesicArea(latlngs)/10000).toFixed(2);
  document.getElementById('p-ha').value=ha;
  document.getElementById('p-coordonate').value=JSON.stringify(latlngs.map(p=>({lat:p.lat,lng:p.lng})));
  showToast(`Suprafață calculată: ${ha} ha`,'info');
}
function reincarcaParcelePeHartaFull(anFiltru) {
  if (!leafletMapFull) return;
  
  // Stergem toate layerele custom
  if (!leafletMapFull._customLayers) leafletMapFull._customLayers = [];
  leafletMapFull._customLayers.forEach(l => leafletMapFull.removeLayer(l));
  leafletMapFull._customLayers = [];

  const culoriCulturi = {
    'Grâu': '#22c55e', 'Orz': '#86efac', 'Orzoaică': '#bbf7d0',
    'Triticale': '#4ade80', 'Secară': '#16a34a', 'Porumb': '#facc15',
    'Floarea-soarelui': '#ef4444', 'Rapiță': '#f97316', 'Soia': '#a3e635',
    'Mazăre': '#bef264', 'Fasole': '#84cc16', 'Sfeclă de zahăr': '#e879f9',
    'Cartofi': '#d97706', 'Lucernă': '#2dd4bf', 'In pentru ulei': '#818cf8',
    'Coriandru': '#fb923c', 'Muștar': '#fbbf24', 'Altele': '#94a3b8'
  };
  const culoriParcele = ['#16a34a','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2'];

  const bounds = [];
  parceleData.forEach((p, index) => {
    if (!p.coordonate) return;
    try {
      const coords = JSON.parse(p.coordonate);
      if (!coords.length) return;
      const latlngs = coords.map(c => [c.lat||c[0], c.lng||c[1]]);

      let culturaAfisata = p.cultura;
      let labelExtra = '';

      if (anFiltru) {
        const anInfo = aniAgricoliData.find(a => a.parcela_id === p.id && a.an_agricol === anFiltru);
        if (anInfo) {
          culturaAfisata = anInfo.cultura;
          labelExtra = '<br><b>'+escapeHTML(anInfo.cultura)+'</b> · '+anInfo.status+(anInfo.productie_tone?' · '+anInfo.productie_tone+'t':'');
        } else {
          culturaAfisata = null;
        }
      }

      const culoare = culturaAfisata
        ? (culoriCulturi[culturaAfisata] || culoriParcele[index % culoriParcele.length])
        : '#94a3b8';

      const polygon = L.polygon(latlngs, {
        color: culoare, fillColor: culoare, fillOpacity: 0.35, weight: 2.5
      }).addTo(leafletMapFull);

      polygon.bindPopup('<div style="min-width:160px">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
        +'<div style="width:12px;height:12px;border-radius:3px;background:'+culoare+'"></div>'
        +'<b style="font-size:14px">'+escapeHTML(p.nume)+'</b></div>'
        +'<div style="font-size:12px;color:#6b7280">'+escapeHTML(culturaAfisata||'Necultivat')+' · '+(p.suprafata_ha||0)+' ha</div>'
        +labelExtra+'</div>');

      leafletMapFull._customLayers.push(polygon);
      bounds.push(...latlngs);
    } catch(e) { console.error('Eroare parcela', p.nume, e); }
  });

  if (bounds.length) leafletMapFull.fitBounds(bounds, { padding: [30, 30] });
}
function deschideModalHarta() {
  document.getElementById('map-modal').style.display='flex';
  if (!leafletMap) setTimeout(()=>{initMap();},100); else setTimeout(()=>{leafletMap.invalidateSize();},50);
  const coord=document.getElementById('p-coordonate').value;
  if (coord&&drawnItems) { try{const ll=JSON.parse(coord);if(ll.length>0)leafletMap.setView([ll[0].lat||ll[0][0],ll[0].lng||ll[0][1]],14);}catch(e){} }
}
function inchideModalHarta() { document.getElementById('map-modal').style.display='none'; }
async function cautaLocatieHarta() {
  const query=document.getElementById('map-search-input').value.trim(); if (!query) return;
  const btn=document.querySelector('.map-search-container button'); const orig=btn?.innerHTML; if(btn) btn.innerHTML='<i class="ti ti-loader"></i>...';
  try { const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ro&limit=1`,{headers:{'Accept-Language':'ro'}}); const d=await r.json(); if(d&&d.length>0){leafletMap.setView([parseFloat(d[0].lat),parseFloat(d[0].lon)],14);showToast(`Mutat la: ${d[0].display_name.split(',')[0]}`,'info');}else showToast('Locație negăsită.','error'); } catch(e){ showToast('Eroare căutare.','error'); } finally { if(btn) btn.innerHTML=orig; }
}
function vizualizeazaParcela(id) {
  const p = parceleData.find(x => x.id === id);
  if (!p) return;
  deschideModalHarta();
  setTimeout(() => {
    if (!p.coordonate) {
      showToast('Parcela nu are coordonate salvate. Desenați conturul pe hartă.', 'info');
      return;
    }
    try {
      drawnItems.clearLayers();
      const latlngs = JSON.parse(p.coordonate);
      const polygon = L.polygon(latlngs, {
        color: '#4a7c2f',
        fillColor: '#4a7c2f',
        fillOpacity: 0.4
      }).addTo(drawnItems);
      leafletMap.fitBounds(polygon.getBounds());
polygon.bindTooltip('<div style="min-width:160px">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
        +'<div style="width:12px;height:12px;border-radius:3px;background:'+culoare+'"></div>'
        +'<b style="font-size:14px">'+escapeHTML(p.nume)+'</b></div>'
        +'<div style="font-size:12px;color:#6b7280">'+escapeHTML(culturaAfisata||'Necultivat')+' · '+(p.suprafata_ha||0)+' ha</div>'
        +labelExtra+'</div>', 
        {sticky: true, direction: 'top', className: 'parcela-tooltip'}
      );

      leafletMapFull._customLayers.push(polygon);
      bounds.push(...latlngs);
    } catch(e) { console.error('Eroare parcela', p.nume, e); }
  });

  if (bounds.length) leafletMapFull.fitBounds(bounds, { padding: [30, 30] });
}
function importaFisierApia(event) {
  const file=event.target.files[0]; if (!file) return;
  const reader=new FileReader();
  reader.onload=async function(e) {
    try {
      const geojson=JSON.parse(e.target.result);
      let features=[];
      if (geojson.type==='FeatureCollection') features=geojson.features;
      else if (geojson.type==='Feature') features=[geojson];
      else if (geojson.type==='Polygon') features=[{type:'Feature',geometry:geojson,properties:{}}];
      if (!features.length) { showToast('Nicio parcelă găsită în fișier.','error'); return; }

      // Dacă e o singură parcelă — comportamentul vechi
      if (features.length===1) {
        const coords=features[0].geometry.coordinates[0];
        const latlngs=coords.map(c=>L.latLng(c[1],c[0]));
        if (!leafletMap) initMap();
        drawnItems.clearLayers();
        const poly=L.polygon(latlngs,{color:'#4a7c2f'}).addTo(drawnItems);
        leafletMap.fitBounds(poly.getBounds());
        salveazaPoligon(latlngs);
        showToast('Parcela importata! Suprafata: '+document.getElementById('p-ha').value+' ha','success');
        return;
      }

      // Dacă sunt mai multe parcele — import în masă
      if (!confirm('Fișierul conține '+features.length+' parcele. Se vor importa automat cu nume generic. Continui?')) return;
      showLoading(true);
      let importate=0;
      for (let i=0; i<features.length; i++) {
        const f=features[i];
        try {
          const coords=f.geometry.coordinates[0];
          const latlngs=coords.map(c=>L.latLng(c[1],c[0]));
          const suprafataMp=L.GeometryUtil.geodesicArea(latlngs);
          const suprafataHa=(suprafataMp/10000).toFixed(2);
          const numeProp=f.properties?.name||f.properties?.Name||f.properties?.NUME||null;
          const nume=numeProp||('Parcela import '+(i+1));
          const coordonate=JSON.stringify(latlngs.map(p=>({lat:p.lat,lng:p.lng})));
          const { error }=await sb.from('parcele').insert([{
            user_id:currentUser.id,
            nume:nume,
            suprafata_ha:parseFloat(suprafataHa),
            cultura:'Altele',
            localitate:null,
            data_semanat:null,
            note:'Importat din fisier GeoJSON. Editati detaliile.',
            coordonate:coordonate
          }]);
          if (!error) importate++;
        } catch(err) { console.warn('Eroare la parcela '+i,err); }
      }
      showLoading(false);
      await loadParcele();
      updateDashboard();
      showToast(importate+' parcele importate din '+features.length+'! Editati detaliile fiecareia.','success',6000);
      deschideModalHarta();
    } catch(err) {
      showLoading(false);
      showToast('Format GeoJSON invalid.','error');
    }
  };
  reader.readAsText(file);
  event.target.value='';
}

// ============================================================
//  LUCRĂRI AGRICOLE
// ============================================================
async function loadLucrari() {
  if (!currentUser) return;
  const { data,error } = await sb.from('lucrari').select('*').eq('user_id',currentUser.id).order('data_lucrare',{ascending:false});
  if (!error&&data) { lucrariData=data; renderTabelLucrari(); renderLucrariStats(); }
}
async function salveazaLucrare() {
  const editId=document.getElementById('luc-id-edit').value;
  const parcelaId=document.getElementById('luc-parcela').value;
  const parcelaOpt=document.getElementById('luc-parcela');
  const parcelaNume=parcelaOpt.options[parcelaOpt.selectedIndex]?.text||'';
const payload={user_id:currentUser.id,tip_lucrare:document.getElementById('luc-tip').value,parcela_id:parcelaId||null,parcela_nume:parcelaNume||null,data_lucrare:document.getElementById('luc-data').value,status:document.getElementById('luc-status').value,utilaj:document.getElementById('luc-utilaj').value||null,implement:document.getElementById('luc-implement').value||null,operator:document.getElementById('luc-operator').value.trim()||null,durata_ore:parseFloat(document.getElementById('luc-durata').value)||null,observatii:document.getElementById('luc-obs').value.trim()||null};  if (!payload.data_lucrare) { showToast('Selectați data lucrării.','error'); return; }
  setLoading('luc-btn',true,'','Se salvează...');
  const { error } = editId ? await sb.from('lucrari').update(payload).eq('id',editId) : await sb.from('lucrari').insert([payload]);
  setLoading('luc-btn',false,'ti-plus','Salvează lucrare');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('Lucrare salvata!','success');
// Actualizam orele utilajului
const utilajNume = document.getElementById('luc-utilaj').value;
const implementNume = document.getElementById('luc-implement').value;
const durata = parseFloat(document.getElementById('luc-durata').value) || 0;
if (durata > 0 && !editId) {
  const utilaje_de_actualizat = [utilajNume, implementNume].filter(Boolean);
  for (const nume of utilaje_de_actualizat) {
    const utilaj = utilajeData.find(u => u.nume === nume);
    if (utilaj) {
      const oreNoi = (parseFloat(utilaj.ore_motor) || 0) + durata;
      await sb.from('utilaje').update({ore_motor: oreNoi}).eq('id', utilaj.id).eq('user_id', currentUser.id);
    }
  }
  if (utilaje_de_actualizat.length > 0) await loadUtilaje();
}
resetFormLucrare(); await loadLucrari(); updateDashboard();

}
function resetFormLucrare() { document.getElementById('luc-id-edit').value=''; ['luc-utilaj','luc-operator','luc-obs','luc-durata'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('luc-btn').innerHTML='<i class="ti ti-plus"></i> Salvează lucrare'; }
function editeazaLucrare(id) {
  const l=lucrariData.find(x=>x.id===id); if (!l) return;
  document.getElementById('luc-id-edit').value=l.id;
  document.getElementById('luc-tip').value=l.tip_lucrare||'';
  document.getElementById('luc-parcela').value=l.parcela_id||'';
  document.getElementById('luc-data').value=l.data_lucrare||'';
  document.getElementById('luc-status').value=l.status||'finalizat';
  document.getElementById('luc-utilaj').value=l.utilaj||'';
  const implementEl=document.getElementById('luc-implement');
  if (implementEl) implementEl.value=l.implement||'';
  document.getElementById('luc-operator').value=l.operator||'';
  document.getElementById('luc-durata').value=l.durata_ore||'';
  document.getElementById('luc-obs').value=l.observatii||'';
  const btn=document.getElementById('luc-btn');
  btn.innerHTML='<i class="ti ti-device-floppy"></i> Actualizeaza lucrarea';
  document.getElementById('luc-btn').scrollIntoView({behavior:'smooth',block:'center'});
  showToast('Lucrare incarcata pentru editare.','info');
}
function renderTabelLucrari(filter) {
  const tbody=document.getElementById('tabel-lucrari'); if (!tbody) return;
  let list=lucrariData;
  const fp=document.getElementById('luc-filter-parcela')?.value;
  const ft=document.getElementById('luc-filter-tip')?.value;
  if (fp) list=list.filter(l=>l.parcela_id===fp||l.parcela_nume===fp);
  if (ft) list=list.filter(l=>l.tip_lucrare===ft);
  if (!list.length) { tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray-400)">Nicio lucrare.</td></tr>'; return; }
  const statusColors={finalizat:'badge-green',in_progres:'badge-blue',planificat:'badge-wheat'};
  const statusLabels={finalizat:'Finalizat',in_progres:'In progres',planificat:'Planificat'};
  tbody.innerHTML=list.map(l=>{
    return '<tr>'
      +'<td>'+fmtData(l.data_lucrare)+'</td>'
      +'<td>'+escapeHTML(l.tip_lucrare)+'</td>'
      +'<td>'+escapeHTML(l.parcela_nume||'-')+'</td>'
      +'<td>'+escapeHTML(l.utilaj||'-')+'</td>'
      +'<td>'+escapeHTML(l.operator||'-')+'</td>'
      +'<td>'+(l.durata_ore?l.durata_ore+' h':'-')+'</td>'
      +'<td><span class="badge '+(statusColors[l.status]||'badge-wheat')+'">'+(statusLabels[l.status]||l.status)+'</span></td>'
      +'<td>'
      +'<div style="display:flex;gap:6px">'
      +'<button class="btn btn-ghost btn-sm" onclick="editeazaLucrare(\''+l.id+'\')" style="width:auto;padding:5px 10px" title="Editeaza"><i class="ti ti-edit"></i></button>'
      +'<button class="btn btn-danger btn-sm" onclick="stergeLucrare(\''+l.id+'\')" style="width:auto;padding:5px 10px" title="Sterge"><i class="ti ti-trash"></i></button>'
      +'</div>'
      +'</td>'
      +'</tr>';
  }).join('');
}

function filtreazaLucrari() { renderTabelLucrari(); }
function renderLucrariStats() {
  const cont=document.getElementById('lucrari-stats'); if (!cont) return;
  if (!lucrariData.length) { cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:20px">Nicio lucrare.</div>'; return; }
  const tipMap={};
  lucrariData.forEach(l=>{tipMap[l.tip_lucrare]=(tipMap[l.tip_lucrare]||0)+1;});
  const total=lucrariData.length;
  const totalOre=lucrariData.reduce((s,l)=>s+(l.durata_ore||0),0);
  cont.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
    <div style="background:var(--ai-green-light);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--ai-green)">${total}</div><div style="font-size:11px;color:var(--ai-green-dark);text-transform:uppercase;font-weight:600">Lucrări total</div></div>
    <div style="background:var(--ai-blue-light);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--ai-blue)">${totalOre.toFixed(1)}</div><div style="font-size:11px;color:var(--ai-blue-dark);text-transform:uppercase;font-weight:600">Ore totale</div></div>
  </div>`+Object.entries(tipMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([tip,cnt])=>`<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span>${escapeHTML(tip)}</span><b>${cnt}x</b></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(cnt/total*100)}%"></div></div></div>`).join('');
}

// ============================================================
//  RECOLTE & PRODUCȚIE
// ============================================================
async function loadRecolte() {
  if (!currentUser) return;
  const { data,error } = await sb.from('recolte').select('*').eq('user_id',currentUser.id).order('data_recolta',{ascending:false});
  if (!error&&data) { recolteData=data; renderTabelRecolte(); renderRecGrafic(); updateRecStat(); }
}
function autocompletezaSuprafataRecolta() {
  const sel = document.getElementById('rec-parcela');
  const parcelaId = sel.value;
  if (!parcelaId) return;
  const parcela = parceleData.find(p => p.id === parcelaId);
  if (!parcela) return;
  document.getElementById('rec-suprafata').value = parcela.suprafata_ha;
  document.getElementById('rec-cultura').value = parcela.cultura;
  calcRandament();
}
function autocompletezaSuprafataCalculator() {
  const sel = document.getElementById('calc-parcela');
  if (!sel.value) return;
  const parcela = parceleData.find(p => p.id === sel.value);
  if (!parcela) return;
  document.getElementById('calc-ha').value = parcela.suprafata_ha;
  calculeazaTotal();
}

function updateIngrLabel() {
  const unitate = document.getElementById('ingr-unitate').value;
  const label = document.getElementById('ingr-pret-label');
  if (label) label.textContent = unitate === 'tona' ? 'Pret/tona (RON/tona)' : 'Pret/tona (RON/tona)';
}
function calcRandament() {
  const cant=parseFloat(document.getElementById('rec-cantitate').value)||0;
  const sup=parseFloat(document.getElementById('rec-suprafata').value)||0;
  const pr=document.getElementById('rec-randament-preview');
  if (cant>0&&sup>0&&pr) { pr.style.display='block'; document.getElementById('rec-rand-val').textContent=(cant/sup).toFixed(2); }
  calcVenitRecolta();
}
function calcTotalDinRandament() {
  const randament = parseFloat(document.getElementById('rec-randament-input').value) || 0;
  const sup = parseFloat(document.getElementById('rec-suprafata').value) || 0;
  const total = randament * sup;
  const preview = document.getElementById('rec-total-preview');
  const totalVal = document.getElementById('rec-total-val');
  const cantInput = document.getElementById('rec-cantitate');
  if (randament > 0 && sup > 0) {
    preview.style.display = 'block';
    totalVal.textContent = total.toFixed(2);
    cantInput.value = total.toFixed(2);
  } else {
    preview.style.display = 'none';
    cantInput.value = '';
  }
  calcVenitRecolta();
}
function calcVenitRecolta() {
  const cant=parseFloat(document.getElementById('rec-cantitate').value)||0;
  const pret=parseFloat(document.getElementById('rec-pret').value)||0;
  const pv=document.getElementById('rec-venit-preview');
  if (cant>0&&pret>0&&pv) { pv.style.display='block'; document.getElementById('rec-venit-val').textContent=(cant*pret).toLocaleString('ro-RO')+' RON'; }
}
async function salveazaRecolta() {
  const parcelaId=document.getElementById('rec-parcela').value;
  const parcelaOpt=document.getElementById('rec-parcela');
  const parcelaNume=parcelaOpt.options[parcelaOpt.selectedIndex]?.text||'';
  const cant=parseFloat(document.getElementById('rec-cantitate').value)||0;
  const sup=parseFloat(document.getElementById('rec-suprafata').value)||0;
  if (!cant||!sup) { showToast('Completați cantitatea și suprafața.','error'); return; }
  setLoading('rec-btn',true,'','Se salvează...');
  const { error } = await sb.from('recolte').insert([{user_id:currentUser.id,parcela_id:parcelaId||null,parcela_nume:parcelaNume,cultura:document.getElementById('rec-cultura').value,sezon:document.getElementById('rec-sezon').value,cantitate_tone:cant,suprafata_ha:sup,pret_vanzare_ron_tona:parseFloat(document.getElementById('rec-pret').value)||null,calitate:document.getElementById('rec-calitate').value,cumparator:document.getElementById('rec-cumparator').value.trim()||null,data_recolta:document.getElementById('rec-data').value||null,observatii:document.getElementById('rec-obs').value.trim()||null}]);
  setLoading('rec-btn',false,'ti-plus','Salvează recoltă');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  // Daca are pret de vanzare, adaugam automat in contabilitate
const pretVanzare = parseFloat(document.getElementById('rec-pret').value) || 0;
const cantitate = parseFloat(document.getElementById('rec-cantitate').value) || 0;
if (pretVanzare > 0 && cantitate > 0) {
  const venitTotal = pretVanzare * cantitate;
  const parcelaOpt = document.getElementById('rec-parcela');
  const parcelaNume = parcelaOpt.options[parcelaOpt.selectedIndex]?.text || '';
  const cultura = document.getElementById('rec-cultura').value;
  const sezon = document.getElementById('rec-sezon').value;
  await sb.from('cheltuieli').insert([{
    user_id: currentUser.id,
    tip: 'venit',
    categorie: 'Vanzare Recolta',
    parcela: parcelaNume,
    suma: venitTotal,
    data: document.getElementById('rec-data').value || new Date().toISOString().split('T')[0],
    descriere: 'Vanzare ' + cultura + ' sezon ' + sezon + ' · ' + cantitate + ' t x ' + pretVanzare + ' RON/t'
  }]);
  await loadCheltuieli();
}
  showToast('Recoltă salvată!','success');
  ['rec-cantitate','rec-suprafata','rec-pret','rec-cumparator','rec-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('rec-randament-preview').style.display='none';
  document.getElementById('rec-venit-preview').style.display='none';
  await loadRecolte(); updateDashboard();
}
async function stergeRecolta(id) { showLoading(true); await sb.from('recolte').delete().eq('id',id).eq('user_id',currentUser.id); showLoading(false); await loadRecolte(); updateDashboard(); }
function renderTabelRecolte() {
  const tbody=document.getElementById('tabel-recolte'); if (!tbody) return;
  if (!recolteData.length) { tbody.innerHTML='<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--gray-400)">Nicio recolta inregistrata.</td></tr>'; return; }
  tbody.innerHTML=recolteData.map(r=>{
    const randament=parseFloat(r.randament_tha||0).toFixed(2);
    const pret=r.pret_vanzare_ron_tona?r.pret_vanzare_ron_tona+' RON':'-';
    const venit=r.venit_total?fmtRON(r.venit_total):'-';
    return '<tr>'
      +'<td>'+escapeHTML(r.sezon)+'</td>'
      +'<td>'+escapeHTML(r.parcela_nume||'-')+'</td>'
      +'<td>'+escapeHTML(r.cultura)+'</td>'
      +'<td><b>'+r.cantitate_tone+' t</b></td>'
      +'<td>'+r.suprafata_ha+' ha</td>'
      +'<td><b style="color:var(--ai-green)">'+randament+' t/ha</b></td>'
      +'<td>'+pret+'</td>'
      +'<td>'+venit+'</td>'
      +'<td><span class="badge badge-green">'+escapeHTML(r.calitate||'Standard')+'</span></td>'
      +'<td style="display:flex;gap:6px">'
      +'<button class="btn btn-ghost btn-sm" onclick="editeazaRecolta(\''+r.id+'\')" style="width:auto;padding:5px 10px"><i class="ti ti-edit"></i></button>'
      +'<button class="btn btn-danger btn-sm" onclick="stergeRecolta(\''+r.id+'\')" style="width:auto;padding:5px 10px"><i class="ti ti-trash"></i></button>'
      +'</td>'
      +'</tr>';
  }).join('');
}
function editeazaRecolta(id) {
  const r = recolteData.find(x => x.id === id);
  if (!r) return;

  // Populăm formularul
  const recSel = document.getElementById('rec-parcela');
  if (recSel) recSel.value = r.parcela_id || '';
  document.getElementById('rec-cultura').value = r.cultura || '';
  document.getElementById('rec-sezon').value = r.sezon || '';
  document.getElementById('rec-data').value = r.data_recolta || '';
  document.getElementById('rec-suprafata').value = r.suprafata_ha || '';
  document.getElementById('rec-cantitate').value = r.cantitate_tone || '';

  // Completăm câmpul randament input dacă există
  const randInput = document.getElementById('rec-randament-input');
  if (randInput && r.suprafata_ha > 0) {
    randInput.value = (r.cantitate_tone / r.suprafata_ha).toFixed(2);
  }

  document.getElementById('rec-pret').value = r.pret_vanzare_ron_tona || '';
  document.getElementById('rec-calitate').value = r.calitate || 'Standard';
  document.getElementById('rec-cumparator').value = r.cumparator || '';
  document.getElementById('rec-obs').value = r.observatii || '';

  // Schimbăm butonul în "Actualizează"
  const btn = document.getElementById('rec-btn');
  btn.innerHTML = '<i class="ti ti-device-floppy"></i> Actualizează recolta';
  btn.onclick = async function() {
    const cantitate = parseFloat(document.getElementById('rec-cantitate').value) || 0;
    const suprafata = parseFloat(document.getElementById('rec-suprafata').value) || 0;
    if (!cantitate || !suprafata) { showToast('Completați cantitatea și suprafața.', 'error'); return; }
    showLoading(true);
    const { error } = await sb.from('recolte').update({
      cultura: document.getElementById('rec-cultura').value,
      sezon: document.getElementById('rec-sezon').value,
      data_recolta: document.getElementById('rec-data').value || null,
      cantitate_tone: cantitate,
      suprafata_ha: suprafata,
      pret_vanzare_ron_tona: parseFloat(document.getElementById('rec-pret').value) || null,
      calitate: document.getElementById('rec-calitate').value,
      cumparator: document.getElementById('rec-cumparator').value.trim() || null,
      observatii: document.getElementById('rec-obs').value.trim() || null
    }).eq('id', id);
    showLoading(false);
    if (error) { showToast('Eroare: ' + error.message, 'error'); return; }
    showToast('Recoltă actualizată!', 'success');
    // Resetăm butonul
    btn.innerHTML = '<i class="ti ti-plus"></i> Salvează recoltă';
    btn.onclick = salveazaRecolta;
    await loadRecolte();
    updateDashboard();
  };

  // Scroll la formular
  document.getElementById('rec-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Recoltă încărcată în formular pentru editare.', 'info');
}
function updateRecStat() {
  const totalTone=recolteData.reduce((s,r)=>s+parseFloat(r.cantitate_tone||0),0);
  const totalVenit=recolteData.reduce((s,r)=>s+parseFloat(r.venit_total||0),0);
  const randMed=recolteData.length?recolteData.reduce((s,r)=>s+parseFloat(r.randament_tha||0),0)/recolteData.length:0;
  document.getElementById('rec-tone-total').textContent=totalTone.toFixed(1)+' t';
  document.getElementById('rec-randament-med').textContent=randMed.toFixed(2)+' t/ha';
  document.getElementById('rec-venit-total').textContent=fmtRON(totalVenit);
}
function arataDetaliiRecolte(tip) {
  const titluri = {tone:'Total recoltat pe culturi', randament:'Randament mediu pe culturi', venit:'Venituri pe culturi'};
  
  // Grupam pe cultura
  const culturi = {};
  recolteData.forEach(r => {
    const c = r.cultura || 'Necunoscut';
    if (!culturi[c]) culturi[c] = {tone:0, ha:0, venit:0, count:0};
    culturi[c].tone += parseFloat(r.cantitate_tone||0);
    culturi[c].ha += parseFloat(r.suprafata_ha||0);
    culturi[c].venit += parseFloat(r.venit_total||0);
    culturi[c].count++;
  });

  const culoriCulturi = {'Porumb':'#16a34a','Grau':'#d97706','Grâu':'#d97706','Floarea-soarelui':'#2563eb','Rapita':'#7c3aed','Rapiță':'#7c3aed','Orz':'#059669','Soia':'#0891b2'};

  const randuri = Object.entries(culturi).sort((a,b) => {
    if (tip==='tone') return b[1].tone - a[1].tone;
    if (tip==='venit') return b[1].venit - a[1].venit;
    const rA = a[1].ha>0?a[1].tone/a[1].ha:0;
    const rB = b[1].ha>0?b[1].tone/b[1].ha:0;
    return rB - rA;
  });

  const totalTone = recolteData.reduce((s,r)=>s+parseFloat(r.cantitate_tone||0),0);

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = '<div style="background:var(--white);border-radius:20px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.3)">'
    +'<div style="padding:20px 24px;border-bottom:1px solid var(--gray-200);display:flex;justify-content:space-between;align-items:center">'
    +'<div style="font-family:\'Lora\',serif;font-size:18px;font-weight:600;color:var(--soil)">'+titluri[tip]+'</div>'
    +'<button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--gray-400)">×</button>'
    +'</div>'
    +'<div style="padding:20px 24px">'
    + randuri.map(([cultura, d]) => {
        const col = culoriCulturi[cultura] || '#6b7280';
        const rand = d.ha>0?(d.tone/d.ha).toFixed(2):'—';
        const pct = totalTone>0?Math.round(d.tone/totalTone*100):0;
        let valoare, sublabel;
        if (tip==='tone') { valoare=d.tone.toFixed(1)+' t'; sublabel=pct+'% din total'; }
        else if (tip==='venit') { valoare=fmtRON(d.venit); sublabel=d.tone.toFixed(1)+' t vandute'; }
        else { valoare=rand+' t/ha'; sublabel=d.tone.toFixed(1)+' t pe '+d.ha.toFixed(1)+' ha'; }
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">'
          +'<div style="display:flex;align-items:center;gap:10px">'
          +'<div style="width:12px;height:12px;border-radius:3px;background:'+col+'"></div>'
          +'<div><div style="font-weight:700;font-size:14px">'+escapeHTML(cultura)+'</div>'
          +'<div style="font-size:12px;color:var(--gray-500)">'+sublabel+'</div></div>'
          +'</div>'
          +'<div style="font-weight:700;font-size:15px;color:var(--soil)">'+valoare+'</div>'
          +'</div>';
      }).join('')
    +'</div>'
    +'<div style="padding:14px 24px;border-top:1px solid var(--gray-200);text-align:right">'
    +'<button onclick="this.closest(\'[style*=fixed]\').remove()" class="btn btn-primary" style="width:auto;padding:8px 20px">Inchide</button>'
    +'</div></div>';

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
}
function renderRecGrafic() {
  const cultMap={};
  recolteData.forEach(r=>{cultMap[r.cultura]=(cultMap[r.cultura]||0)+parseFloat(r.cantitate_tone||0);});
  const cont=document.getElementById('rec-grafic-bars'); if (!cont) return;
  if (!Object.keys(cultMap).length) { cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:20px">Nicio recoltă.</div>'; return; }
  const max=Math.max(...Object.values(cultMap));
  cont.innerHTML=Object.entries(cultMap).sort((a,b)=>b[1]-a[1]).map(([c,t])=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><b>${escapeHTML(c)}</b><span>${t.toFixed(2)} t</span></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(t/max*100)}%"></div></div></div>`).join('');
}

// ============================================================
//  ROTAȚIE CULTURI
// ============================================================
async function loadRotatie() {
  if (!currentUser) return;
  const { data,error } = await sb.from('rotatie_culturi').select('*').eq('user_id',currentUser.id).order('sezon',{ascending:false});
  if (!error&&data) { rotatieData=data; renderRotatieTabel(); renderRotatieAvertizari(); }
}
async function salveazaRotatie() {
  const parcelaId=document.getElementById('rot-parcela').value;
  const parcelaOpt=document.getElementById('rot-parcela');
  const parcelaNume=parcelaOpt.options[parcelaOpt.selectedIndex]?.text||'';
  const sezon=document.getElementById('rot-sezon').value.trim();
  const cultura=document.getElementById('rot-cultura').value;
  if (!parcelaNume||!sezon) { showToast('Selectați parcela și introduceți sezonul.','error'); return; }
  const { error } = await sb.from('rotatie_culturi').insert([{user_id:currentUser.id,parcela_id:parcelaId||null,parcela_nume:parcelaNume,sezon,cultura}]);
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('Rotație salvată!','success'); document.getElementById('rot-sezon').value=''; await loadRotatie();
}
function renderRotatieTabel() {
  const cont=document.getElementById('rot-tabel'); if (!cont) return;
  if (!rotatieData.length) { cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Nicio înregistrare.</div>'; return; }
  const parcelaMap={};
  rotatieData.forEach(r=>{if(!parcelaMap[r.parcela_nume])parcelaMap[r.parcela_nume]=[];parcelaMap[r.parcela_nume].push(r);});
  const cultColors={'Porumb':'#4a7c2f','Grâu':'#c8902a','Floarea-soarelui':'#2e6fa3','Rapiță':'#8B6914','Orz':'#6B8E23','Soia':'#4a7c8e'};
  cont.innerHTML=Object.entries(parcelaMap).map(([parcela,records])=>{
    const sorted=records.sort((a,b)=>a.sezon.localeCompare(b.sezon));
    const chipsHTML=sorted.map(r=>{
      const bg=cultColors[r.cultura]||'#666';
      return '<div style="background:'+bg+';color:#fff;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600">'+escapeHTML(r.sezon)+': '+escapeHTML(r.cultura)+'</div>';
    }).join('');
    return '<div style="margin-bottom:14px">'
      +'<div style="font-weight:700;font-size:13px;color:var(--soil);margin-bottom:8px"><i class="ti ti-map-2" style="color:var(--ai-green)"></i> '+escapeHTML(parcela)+'</div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+chipsHTML+'</div>'
      +'</div>';
  }).join('');
}
function renderRotatieAvertizari() {
  const cont=document.getElementById('rot-avertizari'); if (!cont) return;
  const avertizari=[];
  const parcelaMap={};
  rotatieData.forEach(r=>{if(!parcelaMap[r.parcela_nume])parcelaMap[r.parcela_nume]=[];parcelaMap[r.parcela_nume].push(r);});
  Object.entries(parcelaMap).forEach(([parcela,records])=>{
    const sorted=records.sort((a,b)=>b.sezon.localeCompare(a.sezon));
    const consecutive=[];let i=0;
    while(i<sorted.length&&sorted[i].cultura===sorted[0].cultura){consecutive.push(sorted[i]);i++;}
    if(consecutive.length>=2)avertizari.push({parcela,cultura:sorted[0].cultura,ani:consecutive.length});
  });
  if (!avertizari.length) { cont.innerHTML='<div style="color:var(--ai-green);font-size:13px;text-align:center;padding:20px"><i class="ti ti-circle-check" style="font-size:20px;display:block;margin-bottom:6px"></i>Rotație corespunzătoare!</div>'; return; }
  cont.innerHTML=avertizari.map(a=>`<div style="background:#fff8e0;border:1px solid #f0d070;border-radius:10px;padding:12px;margin-bottom:8px;display:flex;gap:10px">
    <i class="ti ti-alert-triangle" style="color:var(--wheat);font-size:18px;flex-shrink:0;margin-top:2px"></i>
    <div><b style="font-size:13px">${escapeHTML(a.parcela)}</b><div style="font-size:12px;color:var(--gray-600);margin-top:2px">${escapeHTML(a.cultura)} cultivat ${a.ani} ani consecutivi. Recomandăm schimbarea culturii.</div></div>
  </div>`).join('');
}

// ============================================================
//  REGISTRU FITOSANITAR
// ============================================================
async function loadFitosanitar() {
  if (!currentUser) return;
  const { data,error } = await sb.from('fitosanitar').select('*').eq('user_id',currentUser.id).order('data_aplicare',{ascending:false});
  if (!error&&data) { fitosanitarData=data; renderTabelFitosanitar(); renderFitoPauzeActive(); }
}
async function salveazaFitosanitar() {
  const produs=document.getElementById('fito-produs').value.trim();
  const dataApl=document.getElementById('fito-data').value;
  if (!produs||!dataApl) { showToast('Completați produsul și data.','error'); return; }
  const parcelaOpt=document.getElementById('fito-parcela');
  const parcelaNume=parcelaOpt.options[parcelaOpt.selectedIndex]?.text||'';
  const pauza=parseInt(document.getElementById('fito-pauza').value)||0;
  let reintrare=document.getElementById('fito-reintrare').value;
  if (!reintrare&&pauza>0) { const d=new Date(dataApl); d.setDate(d.getDate()+pauza); reintrare=d.toISOString().split('T')[0]; document.getElementById('fito-reintrare').value=reintrare; }
  setLoading('fito-btn',true,'','Se salvează...');
  const { error } = await sb.from('fitosanitar').insert([{user_id:currentUser.id,parcela_id:document.getElementById('fito-parcela').value||null,parcela_nume:parcelaNume,cultura:document.getElementById('fito-cultura').value,data_aplicare:dataApl,tip_tratament:document.getElementById('fito-tip').value,produs,substanta_activa:document.getElementById('fito-substanta').value.trim()||null,doza_ha:document.getElementById('fito-doza').value.trim()||null,suprafata_tratata_ha:parseFloat(document.getElementById('fito-suprafata').value)||null,operator:document.getElementById('fito-operator').value.trim()||null,conditii_meteo:document.getElementById('fito-meteo').value.trim()||null,perioada_pauza_zile:pauza||null,data_reintrare:reintrare||null,observatii:document.getElementById('fito-obs').value.trim()||null}]);
  setLoading('fito-btn',false,'ti-plus','Salvează tratament');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('Tratament înregistrat!','success');
  ['fito-produs','fito-substanta','fito-doza','fito-suprafata','fito-operator','fito-meteo','fito-pauza','fito-reintrare','fito-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  await loadFitosanitar();
}
async function stergeFitosanitar(id) { showLoading(true); await sb.from('fitosanitar').delete().eq('id',id).eq('user_id',currentUser.id); showLoading(false); await loadFitosanitar(); }
function renderTabelFitosanitar() {
  const tbody=document.getElementById('tabel-fitosanitar'); if (!tbody) return;
  if (!fitosanitarData.length) { tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-400)">Nicio inregistrare.</td></tr>'; return; }
  tbody.innerHTML=fitosanitarData.map(f=>{
    const reintrareDepasita=f.data_reintrare&&new Date(f.data_reintrare)<new Date();
    return '<tr>'
      +'<td>'+fmtData(f.data_aplicare)+'</td>'
      +'<td>'+escapeHTML(f.parcela_nume||'-')+'</td>'
      +'<td>'+escapeHTML(f.cultura||'-')+'</td>'
      +'<td><b>'+escapeHTML(f.produs)+'</b><div style="font-size:11px;color:var(--gray-400)">'+escapeHTML(f.substanta_activa||'')+'</div></td>'
      +'<td><span class="badge badge-blue">'+escapeHTML(f.tip_tratament)+'</span></td>'
      +'<td>'+escapeHTML(f.doza_ha||'-')+'</td>'
      +'<td>'+(f.suprafata_tratata_ha?f.suprafata_tratata_ha+' ha':'-')+'</td>'
      +'<td>'+(f.data_reintrare?'<span style="color:'+(reintrareDepasita?'var(--ai-green)':'var(--danger)')+'">'+fmtData(f.data_reintrare)+'</span>':'-')+'</td>'
      +'<td><button class="btn btn-danger btn-sm" onclick="stergeFitosanitar(\''+f.id+'\')" style="width:auto;padding:5px 10px"><i class="ti ti-trash"></i></button></td>'
      +'</tr>';
  }).join('');
}
function renderFitoPauzeActive() {
  const cont=document.getElementById('fito-pauze-active'); if (!cont) return;
  const azi=new Date(); azi.setHours(0,0,0,0);
  const active=fitosanitarData.filter(f=>f.data_reintrare&&new Date(f.data_reintrare)>=azi);
  if (!active.length) { cont.innerHTML='<div style="color:var(--ai-green);font-size:13px;text-align:center;padding:20px"><i class="ti ti-circle-check" style="font-size:20px;display:block;margin-bottom:6px"></i>Nicio restrictie activa</div>'; return; }
  cont.innerHTML=active.map(f=>{
    const zileRamase=Math.ceil((new Date(f.data_reintrare)-azi)/(1000*60*60*24));
    return '<div style="background:#fce8e8;border:1px solid #f0b0b0;border-radius:10px;padding:12px;margin-bottom:8px">'
      +'<div style="font-weight:700;font-size:13px;color:var(--danger)">'+escapeHTML(f.produs)+'</div>'
      +'<div style="font-size:12px;color:var(--gray-600);margin-top:2px">'+escapeHTML(f.parcela_nume||'-')+' - Reintrare: '+fmtData(f.data_reintrare)+'</div>'
      +'<div style="font-size:12px;font-weight:600;color:var(--danger);margin-top:4px">'+zileRamase+' zile ramase</div>'
      +'</div>';
  }).join('');
}

// ============================================================
//  UTILAJE
// ============================================================
async function loadUtilaje() {
  if (!currentUser) return;
  const { data,error } = await sb.from('utilaje').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
  if (!error&&data) { utilajeData=data; renderListaUtilaje(); renderUtilajAlerte(); }
}
async function salveazaUtilaj() {
  const editId=document.getElementById('utilaj-id-edit').value;
  const payload={
    user_id:currentUser.id,
    nume:document.getElementById('utilaj-nume').value.trim(),
    tip:document.getElementById('utilaj-tip').value,
    marca:document.getElementById('utilaj-marca').value.trim()||null,
    model:document.getElementById('utilaj-model').value.trim()||null,
    an_fabricatie:parseInt(document.getElementById('utilaj-an').value)||null,
    numar_inmatriculare:document.getElementById('utilaj-nr').value.trim()||null,
    ore_motor:parseFloat(document.getElementById('utilaj-ore').value)||0,
    ore_la_ultima_revizie:parseFloat(document.getElementById('utilaj-ore-revizie').value)||0,
    interval_revizie_ore:parseFloat(document.getElementById('utilaj-interval').value)||250,
    data_ultima_revizie:document.getElementById('utilaj-revizie').value||null,
    status:document.getElementById('utilaj-status').value,
    observatii:document.getElementById('utilaj-obs').value.trim()||null,
  poza_url: null,
  };
  if (!payload.nume) { showToast('Introduceti denumirea utilajului.','error'); return; }
  const fileInput = document.getElementById('utilaj-poza-file');
    const file = fileInput?.files[0];
  if (file) {
    const fileName = 'utilaj-'+Date.now()+'.'+file.name.split('.').pop();
    const { data: uploadData, error: uploadError } = await sb.storage
      .from('utilaje')
      .upload(fileName, file, { upsert: true });
if (!uploadError) {
  const { data: urlData } = sb.storage.from('utilaje').getPublicUrl(fileName);
  console.log('URL poza:', urlData.publicUrl);
  payload.poza_url = urlData.publicUrl;
}
  }
  const { error } = editId ? await sb.from('utilaje').update(payload).eq('id',editId) : await sb.from('utilaje').insert([payload]);
  setLoading('utilaj-btn',false,'ti-plus','Salveaza utilaj');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('Utilaj salvat!','success');
  resetFormUtilaj();
  await loadUtilaje();
  updateDashboard();
}
function resetFormUtilaj() {
  document.getElementById('utilaj-id-edit').value='';
  document.getElementById('utilaj-form-title').textContent='Adauga utilaj';
  ['utilaj-nume','utilaj-marca','utilaj-model','utilaj-an','utilaj-nr','utilaj-ore','utilaj-interval','utilaj-revizie','utilaj-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('utilaj-btn').innerHTML='<i class="ti ti-plus"></i> Salveaza utilaj';
const fileInput = document.getElementById('utilaj-poza-file');
if (fileInput) fileInput.value='';
const preview = document.getElementById('utilaj-poza-preview');
if (preview) preview.style.display='none';
const pozaEl = document.getElementById('utilaj-poza');
if (pozaEl) pozaEl.value='';
}
function previewPozaUtilaj(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('utilaj-poza-preview');
    const img = document.getElementById('utilaj-poza-img');
    if (preview && img) {
      img.src = e.target.result;
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}
function editeazaUtilaj(id) {
  const u=utilajeData.find(x=>x.id===id); if (!u) return;
  document.getElementById('utilaj-id-edit').value=u.id;
  document.getElementById('utilaj-form-title').textContent='Editare: '+u.nume;
  document.getElementById('utilaj-btn').innerHTML='<i class="ti ti-device-floppy"></i> Salveaza Modificarile';
  document.getElementById('utilaj-nume').value=u.nume;
  document.getElementById('utilaj-tip').value=u.tip;
  document.getElementById('utilaj-marca').value=u.marca||'';
  document.getElementById('utilaj-model').value=u.model||'';
  document.getElementById('utilaj-an').value=u.an_fabricatie||'';
  document.getElementById('utilaj-nr').value=u.numar_inmatriculare||'';
  document.getElementById('utilaj-ore').value=u.ore_motor||'';
  document.getElementById('utilaj-interval').value=u.interval_revizie_ore||250;
  document.getElementById('utilaj-revizie').value=u.data_ultima_revizie||'';
  document.getElementById('utilaj-status').value=u.status||'functional';
  document.getElementById('utilaj-obs').value=u.observatii||'';
  document.getElementById('utilaj-ore-revizie').value=u.ore_la_ultima_revizie||'';
const pozaEl = document.getElementById('utilaj-poza');
if (pozaEl) pozaEl.value=u.poza_url||'';
  deschideModalUtilaj();
}
async function stergeUtilaj(id) { if(!confirm('Sigur ștergeți acest utilaj?'))return; showLoading(true); await sb.from('utilaje').delete().eq('id',id).eq('user_id',currentUser.id); showLoading(false); showToast('Utilaj șters.','info'); await loadUtilaje(); updateDashboard(); }
function renderListaUtilaje() {
  const cont=document.getElementById('lista-utilaje'); if (!cont) return;
  const statusColors={functional:'badge-green',revizie:'badge-wheat',defect:'badge-red',vandut:'badge-blue'};
  const statusLabels={functional:'Functional',revizie:'La revizie',defect:'Defect',vandut:'Vandut'};

  const areAlerte = utilajeData.some(u => {
    if (u.status === 'defect') return true;
    if (u.ore_motor && u.interval_revizie_ore) {
      const oreDeAtunci = u.ore_motor - (u.ore_la_ultima_revizie||0);
      return oreDeAtunci/u.interval_revizie_ore*100 >= 90;
    }
    return false;
  });

  let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">'
    + '<div style="font-weight:700;font-size:15px">Parcul de utilaje</div>'
    + '<div style="display:flex;gap:8px">'
    + (areAlerte ? '<button class="btn btn-wheat btn-sm" onclick="deschideModalAlerteUtilaj()" style="width:auto"><i class="ti ti-alert-triangle"></i> Alerte mentenanta</button>' : '')
    + '<button class="btn btn-primary btn-sm" onclick="resetFormUtilaj();deschideModalUtilaj()" style="width:auto"><i class="ti ti-plus"></i> Adauga utilaj</button>'
    + '</div></div>';

  if (!utilajeData.length) {
    html += '<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Niciun utilaj inregistrat.</div>';
    cont.innerHTML = html;
    return;
  }

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">';
  html += utilajeData.map(u => {
    const needsService = u.ore_motor&&u.interval_revizie_ore&&(u.ore_motor-(u.ore_la_ultima_revizie||0))/u.interval_revizie_ore*100>=90;
    const bgStyle = u.poza_url
      ? 'background:linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.75)),url('+u.poza_url+') center/cover no-repeat;'
      : '';
    const textColor = u.poza_url ? 'color:#fff' : 'color:var(--soil)';
    const textMuted = u.poza_url ? 'color:rgba(255,255,255,0.7)' : 'color:var(--gray-600)';
    const btnStyle = u.poza_url ? 'background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3)' : '';

return '<div style="padding:0;margin-bottom:0;overflow:hidden;border-radius:14px;background:var(--white);border:1px solid var(--gray-200);box-shadow:var(--shadow-xs);'+bgStyle+'">'    + (needsService ? '<div style="background:rgba(217,119,6,0.9);padding:5px 12px;font-size:11px;font-weight:700;color:#fff"><i class="ti ti-alert-triangle"></i> Revizie apropiata!</div>' : '')
      + '<div style="padding:16px">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'
      + '<div><div style="font-weight:700;font-size:15px;'+textColor+'">'+escapeHTML(u.nume)+'</div>'
      + '<div style="font-size:12px;margin-top:2px;'+textMuted+'">'+escapeHTML(u.marca||'')+' '+escapeHTML(u.model||'')+' · '+(u.an_fabricatie||'—')+'</div></div>'
      + '<span class="badge '+(statusColors[u.status]||'badge-wheat')+'">'+(statusLabels[u.status]||u.status)+'</span>'
      + '</div>'
      + '<div style="font-size:12px;margin-bottom:6px;'+textMuted+'"><i class="ti ti-activity"></i> '+(u.ore_motor||0)+' h '+(['Tractor','Combina','Generator'].includes(u.tip)?'motor · Revizie la '+(u.interval_revizie_ore||250)+' h':'')+'</div>'
      + (u.data_ultima_revizie ? '<div style="font-size:12px;margin-bottom:10px;'+textMuted+'"><i class="ti ti-calendar-check"></i> Ultima revizie: '+fmtData(u.data_ultima_revizie)+(u.ore_la_ultima_revizie?' la '+u.ore_la_ultima_revizie+' h':'')+'</div>' : '<div style="margin-bottom:10px"></div>')
      + '<div style="display:flex;gap:6px">'
      + '<button class="btn btn-ghost btn-sm" onclick="editeazaUtilaj(\''+u.id+'\')" style="flex:1;'+btnStyle+'"><i class="ti ti-edit"></i> Editeaza</button>'
      + '<button class="btn btn-danger btn-sm" onclick="stergeUtilaj(\''+u.id+'\')" style="width:auto;padding:6px 10px"><i class="ti ti-trash"></i></button>'
      + '</div></div></div>';
  }).join('');

  html += '</div>';
  cont.innerHTML = html;
}
function renderUtilajAlerte() {
  const cont=document.getElementById('utilaje-alerte'); if (!cont) return;
  const alerte=utilajeData.filter(u=>{
    if (u.status==='defect') return true;
   if (u.ore_motor&&u.interval_revizie_ore) {
  const oreDeAtunci=u.ore_motor-(u.ore_la_ultima_revizie||0);
  const procent=oreDeAtunci/u.interval_revizie_ore*100;
  return procent>=90;
}
return false;
    return false;
  });
  if (!alerte.length) {
    cont.innerHTML='<div style="color:var(--ai-green);font-size:13px;text-align:center;padding:20px"><i class="ti ti-circle-check" style="font-size:20px;display:block;margin-bottom:6px"></i>Toate utilajele sunt in ordine!</div>';
    return;
  }
  cont.innerHTML=alerte.map(u=>{
    const isDefect=u.status==='defect';
    const oreDeAtunci=u.ore_motor-(u.ore_la_ultima_revizie||0);
    const oreRamase=u.interval_revizie_ore-oreDeAtunci;
const mesaj=isDefect
  ?'Utilaj marcat ca defect - necesita interventie'
  :'Revizie necesara in '+oreRamase.toFixed(0)+' h ('+oreDeAtunci.toFixed(0)+' h de la ultima revizie, interval '+u.interval_revizie_ore+' h)';    const culoare=isDefect?'var(--danger)':'var(--wheat)';
    const icon=isDefect?'ti-tool':'ti-alert-triangle';
    const bgStyle=isDefect?'border-color:#f0b0b0;background:#fce8e8':'border-color:#f0d58a;background:#fffbf0';
    const btnRevizie=!isDefect
      ?'<button class="btn btn-primary btn-sm" onclick="marcheazaRevizie(\''+u.id+'\')" style="width:auto;margin-top:8px;padding:6px 14px"><i class="ti ti-check"></i> Revizie efectuata</button>'
      :'';
    return '<div class="alert-box" style="'+bgStyle+'">'
      +'<i class="ti '+icon+'" style="color:'+culoare+'"></i>'
      +'<div style="flex:1">'
      +'<b style="font-size:13px">'+escapeHTML(u.nume)+'</b>'
      +'<div style="font-size:12px;color:var(--gray-600);margin-top:2px">'+mesaj+'</div>'
      +btnRevizie
      +'</div></div>';
  }).join('');
}
async function marcheazaRevizie(id) {
  const u=utilajeData.find(x=>x.id===id); if (!u) return;
  const today=new Date().toISOString().split('T')[0];
  showLoading(true);
  const { error }=await sb.from('utilaje').update({
    data_ultima_revizie: today,
    ore_la_ultima_revizie: u.ore_motor,
    status: 'functional'
  }).eq('id',id).eq('user_id',currentUser.id);
  showLoading(false);
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('Revizie inregistrata la '+u.ore_motor+' h!','success');
  await loadUtilaje();
}

// ============================================================
//  CHELTUIELI & CALCULATOR
// ============================================================
async function loadCheltuieli() {
  if (!currentUser) return;
const { data,error } = await sb.from('cheltuieli').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});  if (!error&&data) {
    cheltuieliData=data;
    updateSumeContabilitate();
    renderCatBars();
    renderTabelCheltuieli(null);
  }
}
function renderTabelCheltuieli(filter, customList) {
  const tbody=document.getElementById('tabel-cheltuieli'); if (!tbody) return;
  let list = customList || (filter ? cheltuieliData.filter(c=>c.categorie===filter) : cheltuieliData);
  if (!list.length) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">Nicio inregistrare.</td></tr>'; return; }
  tbody.innerHTML=list.map(c=>{
    const culoare=c.tip==='venit'?'var(--ai-green)':'var(--danger)';
    const semn=c.tip==='venit'?'+':'-';
    const badgeClasa=c.tip==='venit'?'badge-green':'badge-red';
    const tipLabel=c.tip==='venit'?'Venit':'Cheltuiala';
    return '<tr>'
      +'<td>'+fmtData(c.data)+'</td>'
      +'<td>'+escapeHTML(c.categorie)+'</td>'
      +'<td>'+escapeHTML(c.parcela||'-')+'</td>'
      +'<td>'+escapeHTML(c.descriere||'-')+'</td>'
      +'<td style="font-weight:600;color:'+culoare+'">'+semn+parseFloat(c.suma).toLocaleString('ro-RO')+' RON</td>'
      +'<td><span class="badge '+badgeClasa+'">'+tipLabel+'</span></td>'
      +'<td><button class="btn btn-danger btn-sm" onclick="stergeCheltuiala(\''+c.id+'\')" style="width:auto;padding:5px 10px"><i class="ti ti-trash"></i></button></td>'
      +'</tr>';
  }).join('');
}
function updateSumeContabilitate() {
  const totalCheltuieli=cheltuieliData.filter(c=>c.tip==='cheltuiala').reduce((s,c)=>s+parseFloat(c.suma||0),0);
  const totalVenituri=cheltuieliData.filter(c=>c.tip==='venit').reduce((s,c)=>s+parseFloat(c.suma||0),0);
  const sold=totalVenituri-totalCheltuieli;
  const cTotal=document.getElementById('c-total');
  const cIntrari=document.getElementById('c-intrari');
  const cSold=document.getElementById('c-sold');
  if (cTotal) cTotal.textContent=fmtRON(totalCheltuieli);
  if (cIntrari) cIntrari.textContent=fmtRON(totalVenituri);
  if (cSold) { cSold.textContent=fmtRON(sold); cSold.style.color=sold>=0?'var(--ai-green)':'var(--danger)'; }
}
async function adaugaCheltuiala() {
  const tip=document.getElementById('c-tip').value, cat=document.getElementById('c-cat').value;
  const parc=document.getElementById('c-parcela').value, suma=parseFloat(document.getElementById('c-suma').value)||0;
  const data=document.getElementById('c-data').value, desc=document.getElementById('c-desc').value.trim();
  if (!suma||!data) { showToast('Completați suma și data.','error'); return; }
  setLoading('c-btn',true,'','Se salvează...');
  const { error } = await sb.from('cheltuieli').insert([{user_id:currentUser.id,tip,categorie:cat,parcela:parc,suma,data,descriere:desc||null}]);
  setLoading('c-btn',false,'ti-plus','Înregistrează');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('Înregistrare salvată!','success');
  document.getElementById('c-suma').value=''; document.getElementById('c-desc').value='';
  await loadCheltuieli(); updateDashboard();
}
async function stergeCheltuiala(id) {
  showLoading(true);
  await sb.from('cheltuieli').delete().eq('id',id).eq('user_id',currentUser.id);
  showLoading(false);
  showToast('Inregistrare stearsa.','info');
  const { data,error } = await sb.from('cheltuieli').select('*').eq('user_id',currentUser.id).order('data',{ascending:false});
  if (!error&&data) {
    cheltuieliData=data;
    updateSumeContabilitate();
    renderCatBars();
    filtreazaCheltuieli();
  }
  updateDashboard();
}
function filtreazaCheltuieli() {
  const f = document.getElementById('filter-cat').value;
  const fp = document.getElementById('filter-parcela-chelt')?.value || '';
  let list = cheltuieliTipFilter ? cheltuieliData.filter(c => c.tip === cheltuieliTipFilter) : cheltuieliData;
  if (f) list = list.filter(c => c.categorie === f);
if (fp) {
  const parcelaGasita = parceleData.find(p => p.id === fp);
  const numeParc = parcelaGasita ? parcelaGasita.nume : fp;
  list = list.filter(c => c.parcela === numeParc);
}
  if (cheltuieliSortCol) {
    list = [...list].sort((a, b) => {
      if (cheltuieliSortCol === 'data') return (new Date(a.data) - new Date(b.data)) * cheltuieliSortDir;
      if (cheltuieliSortCol === 'suma') return (parseFloat(a.suma) - parseFloat(b.suma)) * cheltuieliSortDir;
      return 0;
    });
  }
  renderTabelCheltuieli(null, list);
}
let cheltuieliSortCol = null;
let cheltuieliSortDir = 1;
let cheltuieliTipFilter = '';

function filtreazaTipCheltuieli(tip) {
  cheltuieliTipFilter = tip;
  // Actualizam butoanele
  document.getElementById('filter-tip-toate').className = 'btn btn-sm ' + (!tip ? 'btn-primary' : 'btn-ghost');
  document.getElementById('filter-tip-chelt').className = 'btn btn-sm ' + (tip==='cheltuiala' ? 'btn-danger' : 'btn-ghost');
  document.getElementById('filter-tip-venit').className = 'btn btn-sm ' + (tip==='venit' ? 'btn-primary' : 'btn-ghost');
  filtreazaCheltuieli();
}

function sorteazaCheltuieli(col) {
  if (cheltuieliSortCol === col) {
    cheltuieliSortDir *= -1;
  } else {
    cheltuieliSortCol = col;
    cheltuieliSortDir = 1;
  }
  document.getElementById('sort-data').textContent = col==='data' ? (cheltuieliSortDir===1?'↑':'↓') : '↕';
  document.getElementById('sort-suma').textContent = col==='suma' ? (cheltuieliSortDir===1?'↑':'↓') : '↕';
  filtreazaCheltuieli();
}
function renderCatBars() {
  const catMap={};
  cheltuieliData.filter(c=>c.tip==='cheltuiala').forEach(c=>{catMap[c.categorie]=(catMap[c.categorie]||0)+parseFloat(c.suma);});
  const cont=document.getElementById('cat-bars'); if (!cont) return;
  if (!Object.keys(catMap).length) { cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:20px">Nicio cheltuială.</div>'; return; }
  const maxVal=Math.max(...Object.values(catMap));
  cont.innerHTML=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${escapeHTML(c)}</span><b>${fmtRON(v)}</b></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(v/maxVal*100)}%"></div></div></div>`).join('');
}
function calculeazaTotal() {
  const sup = parseFloat(document.getElementById('calc-ha').value) || 0;

  const samCant = parseFloat(document.getElementById('sam-cantitate').value) || 0;
  const samPret = parseFloat(document.getElementById('sam-pret').value) || 0;
  const costSam = samCant * samPret * sup;
  document.getElementById('sub-sam').textContent = fmtRON(costSam);

 const ingrCant = parseFloat(document.getElementById('ingr-cantitate').value) || 0;
  const ingrPret = parseFloat(document.getElementById('ingr-pret').value) || 0;
  const ingrUnitateEl = document.getElementById('ingr-unitate');
const ingrUnitate = ingrUnitateEl ? ingrUnitateEl.value : 'kg';
  let costIngr = 0;
  if (ingrUnitate === 'tona') {
    // tone/ha x pret/tona x suprafata
    costIngr = ingrCant * ingrPret * sup;
  } else {
    // kg/ha → convertit in tone → x pret/tona x suprafata
    costIngr = (ingrCant / 1000) * ingrPret * sup;
  }
  document.getElementById('sub-ingr').textContent = fmtRON(costIngr);

  const motL = parseFloat(document.getElementById('mot-l').value) || 0;
  const motPret = parseFloat(document.getElementById('mot-pret').value) || 0;
  const costMot = motL * motPret * sup;
  document.getElementById('sub-mot').textContent = fmtRON(costMot);

  const pestPerHa = parseFloat(document.getElementById('pest-val').value) || 0;
  const costPest = pestPerHa * sup;
  const pestPreview = document.getElementById('pest-total-preview');
  if (pestPreview) pestPreview.textContent = fmtRON(costPest);
  document.getElementById('sub-diverse').textContent = fmtRON(costPest);

  const alt = parseFloat(document.getElementById('alt-val').value) || 0;
  const subAlt = document.getElementById('sub-alt');
  if (subAlt) subAlt.textContent = fmtRON(alt);

  const total = costSam + costIngr + costMot + costPest + alt;
  const totalEl = document.getElementById('total-estimat');
  if (totalEl) totalEl.textContent = fmtRON(total);

  const costHaEl = document.getElementById('calc-cost-ha');
  if (costHaEl) costHaEl.textContent = sup > 0 ? fmtRON(total / sup) + '/ha' : '—';
}
async function adaugaDinCalculator() {
  const sup=parseFloat(document.getElementById('calc-ha').value)||0;
  const calcParcelaOpt=document.getElementById('calc-parcela');
  const parcela=calcParcelaOpt.options[calcParcelaOpt.selectedIndex]?.text||'Toate parcelele';
  const today=new Date().toISOString().split('T')[0];
  const rows=[];
  const costSam=sup*(parseFloat(document.getElementById('sam-cantitate').value)||0)*(parseFloat(document.getElementById('sam-pret').value)||0);
const ingrCant=parseFloat(document.getElementById('ingr-cantitate').value)||0;
  const ingrPret=parseFloat(document.getElementById('ingr-pret').value)||0;
  const costIngr=sup*(ingrCant/1000)*ingrPret;
    const costMot=sup*(parseFloat(document.getElementById('mot-l').value)||0)*(parseFloat(document.getElementById('mot-pret').value)||0);
  const pest=parseFloat(document.getElementById('pest-val').value)||0, alt=parseFloat(document.getElementById('alt-val').value)||0;
  if (costSam>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Seminte / Material Sadit',parcela,suma:costSam,data:today,descriere:'Seminte: '+sup+' ha'});
if (costIngr>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Ingrasaminte',parcela,suma:costIngr,data:today,descriere:'Ingrasaminte: '+(ingrCant||0)+' kg/ha x '+sup+' ha'});  if (costMot>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Combustibil',parcela,suma:costMot,data:today,descriere:'Motorina: '+sup+' ha'});
if (pest>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Tratamente fitosanitare',parcela,suma:pest,data:today,descriere:'Pesticide (valoare totala)'});  if (alt>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Altele',parcela,suma:alt,data:today,descriere:'Alte cheltuieli'});
  if (!rows.length) { showToast('Completati cel putin o valoare in calculator.','error'); return; }
  setLoading('calc-adauga-btn',true,'','Se salveaza...');
  const { error } = await sb.from('cheltuieli').insert(rows);
  setLoading('calc-adauga-btn',false,'ti-database-plus','Adauga la cheltuieli');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  const total=rows.reduce((s,r)=>s+r.suma,0);
  showToast(rows.length+' inregistrari adaugate! Total: '+fmtRON(total),'success',6000);
  ['sam-cantitate','sam-pret','ingr-cantitate','ingr-pret','mot-l','mot-pret','pest-val','alt-val'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  calculeazaTotal(); await loadCheltuieli(); updateDashboard();
}

// Export PDF simplu (print)
function exportaPDF() {
  window.print();
}

// ============================================================
//  PROFITABILITATE
// ============================================================
function calculeazaProfitabilitate() {
  const totalVenit=cheltuieliData.filter(c=>c.tip==='venit').reduce((s,c)=>s+parseFloat(c.suma),0)+recolteData.reduce((s,r)=>s+parseFloat(r.venit_total||0),0);
  const totalChelt=cheltuieliData.filter(c=>c.tip==='cheltuiala').reduce((s,c)=>s+parseFloat(c.suma),0);
  const profit=totalVenit-totalChelt;
  const marja=totalVenit>0?Math.round(profit/totalVenit*100):0;
  document.getElementById('prof-venit-total').textContent=fmtRON(totalVenit);
  document.getElementById('prof-chelt-total').textContent=fmtRON(totalChelt);
  const marjaEl=document.getElementById('prof-marja');
  if (marjaEl) { marjaEl.textContent=marja+'%'; marjaEl.style.color=marja>=0?'var(--ai-green)':'var(--danger)'; }
  document.getElementById('d-profit').textContent=profit.toLocaleString('ro-RO');
  // Per cultură
  const cultVenit={}, cultChelt={};
  recolteData.forEach(r=>{cultVenit[r.cultura]=(cultVenit[r.cultura]||0)+parseFloat(r.venit_total||0);});
  cheltuieliData.filter(c=>c.tip==='cheltuiala').forEach(c=>{const parc=c.parcela||'General';cultChelt[parc]=(cultChelt[parc]||0)+parseFloat(c.suma);});
  const cultCont=document.getElementById('prof-per-cultura');
  if (cultCont) {
    if (!Object.keys(cultVenit).length) { cultCont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Necesită date de recolte.</div>'; }
    else cultCont.innerHTML=Object.entries(cultVenit).map(([c,v])=>`<div style="margin-bottom:12px;padding:12px;background:var(--mist);border-radius:10px"><div style="font-weight:700;font-size:14px;margin-bottom:4px">${escapeHTML(c)}</div><div style="font-size:13px;color:var(--ai-green)">Venit: <b>${fmtRON(v)}</b></div></div>`).join('');
  }
  // Per parcelă
  const parcelaVenit={};
  recolteData.forEach(r=>{if(r.parcela_nume){parcelaVenit[r.parcela_nume]=(parcelaVenit[r.parcela_nume]||0)+parseFloat(r.venit_total||0);}});
  const parcCont=document.getElementById('prof-per-parcela');
  if (parcCont) {
    if (!Object.keys(parcelaVenit).length) { parcCont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Necesită date de recolte.</div>'; }
    else parcCont.innerHTML=Object.entries(parcelaVenit).map(([p,v])=>`<div style="margin-bottom:12px;padding:12px;background:var(--mist);border-radius:10px"><div style="font-weight:700;font-size:14px;margin-bottom:4px"><i class="ti ti-map-2" style="color:var(--ai-green)"></i> ${escapeHTML(p)}</div><div style="font-size:13px;color:var(--ai-green)">Venit: <b>${fmtRON(v)}</b></div></div>`).join('');
  }
  // Cost/tonă
  const costTonaCont=document.getElementById('prof-cost-tona');
  if (costTonaCont) {
    const cultTone={};
    recolteData.forEach(r=>{cultTone[r.cultura]=(cultTone[r.cultura]||0)+parseFloat(r.cantitate_tone||0);});
    if (!Object.keys(cultTone).length) { costTonaCont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Necesită date de recolte.</div>'; return; }
    const totalCheltGlobal=totalChelt/Math.max(Object.keys(cultTone).length,1);
    costTonaCont.innerHTML=Object.entries(cultTone).map(([c,t])=>{
      const costTona=t>0?totalCheltGlobal/t:0;
      const pretMed=recolteData.filter(r=>r.cultura===c&&r.pret_vanzare_ron_tona).reduce((s,r,_,a)=>s+parseFloat(r.pret_vanzare_ron_tona)/a.length,0);
      const profitTona=pretMed-costTona;
      const profCuloare=profitTona>=0?'var(--ai-green)':'var(--danger)';
      const profSemn=profitTona>=0?'+':'';
      const pretBlock=pretMed>0
        ?'<div style="text-align:center"><div style="font-size:11px;color:var(--gray-400);text-transform:uppercase">Pret vanzare/t</div><div style="font-weight:700;font-size:16px;color:var(--ai-blue)">'+fmtRON(pretMed)+'</div></div>'
         +'<div style="text-align:center"><div style="font-size:11px;color:var(--gray-400);text-transform:uppercase">Profit/t</div><div style="font-weight:700;font-size:16px;color:'+profCuloare+'">'+profSemn+fmtRON(profitTona)+'</div></div>'
        :'';
      return '<div style="padding:14px;background:var(--mist);border-radius:10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'
        +'<div><div style="font-weight:700;font-size:14px">'+escapeHTML(c)+'</div>'
        +'<div style="font-size:12px;color:var(--gray-600)">'+t.toFixed(2)+' tone recoltate</div></div>'
        +'<div style="display:flex;gap:12px;flex-wrap:wrap">'
        +'<div style="text-align:center"><div style="font-size:11px;color:var(--gray-400);text-transform:uppercase">Cost/t</div>'
        +'<div style="font-weight:700;font-size:16px;color:var(--danger)">'+fmtRON(costTona)+'</div></div>'
        +pretBlock
        +'</div></div>';
    }).join('');
  }
}

// ============================================================
//  DASHBOARD
// ============================================================
function updateDashboard() {
  const totalHa=parceleData.reduce((s,p)=>s+p.suprafata_ha,0);
  const totalChelt=cheltuieliData.filter(c=>c.tip==='cheltuiala').reduce((s,c)=>s+parseFloat(c.suma),0);
  const totalVenit=cheltuieliData.filter(c=>c.tip==='venit').reduce((s,c)=>s+parseFloat(c.suma),0)+recolteData.reduce((s,r)=>s+parseFloat(r.venit_total||0),0);
  const totalTone=recolteData.reduce((s,r)=>s+parseFloat(r.cantitate_tone||0),0);
  document.getElementById('d-ha').textContent=totalHa.toFixed(1);
  document.getElementById('d-parcele').textContent=parceleData.length;
  document.getElementById('d-chelt').textContent=totalChelt.toLocaleString('ro-RO');
  document.getElementById('d-recolte').textContent=totalTone.toFixed(1);
  document.getElementById('d-lucrari').textContent=lucrariData.length;
  document.getElementById('d-utilaje').textContent=utilajeData.filter(u=>u.status==='functional').length;
  const profit=totalVenit-totalChelt;
  const profEl=document.getElementById('d-profit');
  if (profEl) { profEl.textContent=(profit>=0?'+':'')+profit.toLocaleString('ro-RO'); profEl.style.color=profit>=0?'var(--ai-green)':'var(--danger)'; }
  document.getElementById('setup-banner').style.display=parceleData.length===0?'block':'none';
  // Culturi
  const cultCont=document.getElementById('d-culturi');
  if (cultCont) cultCont.innerHTML=parceleData.length?parceleData.slice(0,3).map(p=>`<div class="field-item"><div><div class="field-name">${escapeHTML(p.nume)}</div><div class="field-meta">${escapeHTML(p.cultura)} · ${p.suprafata_ha} ha</div></div><span class="badge badge-green">Activă</span></div>`).join(''):'<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Nicio parcelă.</div>';
  // Ultimele lucrări
  const lucCont=document.getElementById('d-ult-lucrari');
  if (lucCont) lucCont.innerHTML=lucrariData.length?lucrariData.slice(0,3).map(l=>`<div class="field-item" style="border-left-color:var(--ai-blue)"><div><div class="field-name">${escapeHTML(l.tip_lucrare)}</div><div class="field-meta">${escapeHTML(l.parcela_nume||'—')} · ${fmtData(l.data_lucrare)}</div></div><span class="badge badge-blue">${escapeHTML(l.status)}</span></div>`).join(''):'<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:20px">Nicio lucrare.</div>';
  // Note urgente
  const noteCont=document.getElementById('d-note-urgente');
  if (noteCont) {
    const urgente=noteData.filter(n=>n.prioritate==='urgent'&&!n.completat).slice(0,3);
    if (urgente.length) {
      noteCont.innerHTML=urgente.map(n=>{
        const sc=n.data_scadenta?'<div class="field-meta"><i class="ti ti-calendar-event"></i> Scadent: '+fmtData(n.data_scadenta)+'</div>':'';
        const nId=n.id;
        return '<div class="field-item" style="border-left-color:var(--danger)"><div><div class="field-name">'+escapeHTML(n.titlu)+'</div>'+sc+'</div>'
          +'<button class="btn btn-ghost btn-sm" onclick="marcheazaNota(String(\''+nId+'\'))" style="width:auto;padding:5px 10px"><i class="ti ti-check"></i></button></div>';
      }).join('');
    } else {
      noteCont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:20px">Nicio nota urgenta.</div>';
    }
  }
}

async function cautaMeteo() {
  const locEl=document.getElementById('meteo-loc');
  if (!locEl||!locEl.value.trim()) return;
  const loc=locEl.value.trim();
  showLoading(true);
  try {
    // Pas 1: Geocoding - gasim coordonatele localitatii
    const geoRes=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(loc)+'&count=1&language=ro&format=json');
    const geoData=await geoRes.json();
    if (!geoData.results||!geoData.results.length) { showToast('Localitate negasita.','error'); showLoading(false); return; }
    const geo=geoData.results[0];
    const lat=geo.latitude, lon=geo.longitude;
    const numeOras=geo.name+', Romania';

    // Pas 2: Vremea curenta + prognoza 7 zile
    const meteoRes=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&wind_speed_unit=kmh&timezone=Europe%2FBucharest&forecast_days=7');
    const meteo=await meteoRes.json();
    showLoading(false);

    const current=meteo.current;
    const daily=meteo.daily;
    const temp=Math.round(current.temperature_2m);
    const wcode=current.weather_code;

    // Functie helper pentru weather code -> icon si descriere
    function getWeatherInfo(code) {
      if (code===0) return {icon:'ti-sun',color:'var(--wheat)',desc:'Cer senin'};
      if (code<=2) return {icon:'ti-cloud-sun',color:'var(--wheat)',desc:'Partial noros'};
      if (code<=3) return {icon:'ti-cloud',color:'#95a5a6',desc:'Noros'};
      if (code<=49) return {icon:'ti-mist',color:'#95a5a6',desc:'Ceata'};
      if (code<=59) return {icon:'ti-cloud-drizzle',color:'var(--ai-blue)',desc:'Burnitoare'};
      if (code<=69) return {icon:'ti-cloud-rain',color:'var(--ai-blue)',desc:'Ploaie'};
      if (code<=79) return {icon:'ti-snowflake',color:'#a0c0ff',desc:'Ninsoare'};
      if (code<=82) return {icon:'ti-cloud-rain',color:'var(--ai-blue)',desc:'Averse'};
      if (code<=86) return {icon:'ti-snowflake',color:'#a0c0ff',desc:'Averse de ninsoare'};
      if (code<=99) return {icon:'ti-bolt',color:'var(--wheat)',desc:'Furtuna'};
      return {icon:'ti-cloud',color:'#95a5a6',desc:'Variabil'};
    }

    const wi=getWeatherInfo(wcode);
    const azi=new Date().toLocaleDateString('ro-RO',{weekday:'long',day:'numeric',month:'long'});

    // Vremea curenta
    document.getElementById('meteo-city-name').textContent=numeOras;
    document.getElementById('meteo-data-azi').textContent=azi.charAt(0).toUpperCase()+azi.slice(1);
    document.getElementById('meteo-temp').textContent=temp+'°C';
    document.getElementById('meteo-desc').textContent=wi.desc;
    document.getElementById('meteo-umiditate-val').textContent=current.relative_humidity_2m+'%';
    document.getElementById('meteo-vant-val').textContent=Math.round(current.wind_speed_10m)+' km/h';
    document.getElementById('meteo-presiune-val').textContent=Math.round(current.surface_pressure)+' hPa';

    const iconEl=document.getElementById('meteo-icon');
    if (iconEl) { iconEl.className='ti '+wi.icon; iconEl.style.color=wi.color; }

    const topWeath=document.getElementById('top-weather');
    if (topWeath) topWeath.innerHTML='<i class="ti '+wi.icon+'"></i> '+temp+'°C';
    if (document.getElementById('d-temp-azi')) document.getElementById('d-temp-azi').textContent=temp+'°';

    // Recomandare agronomica
    const recEl=document.getElementById('meteo-recomandare');
  if (recEl) {
  // Verificam si prognoza urmatoarele 24h pentru recomandari mai precise
  const ploaieUrmeaza = daily && daily.weather_code &&
    (daily.weather_code[0] >= 60 || (daily.weather_code[1] && daily.weather_code[1] >= 60));
  const precipitatiMaxime = daily?.precipitation_probability_max?.[0] || 0;

  if (wcode >= 95) {
    recEl.textContent = 'Furtuna activa. Opriti toate lucrarile mecanice. Asigurati adapostul utilajelor si animalelor.';
  } else if (wcode >= 60) {
    recEl.textContent = 'Ploaie in desfasurare. Amanati tratamentele fitosanitare si fertilizarile foliare. Verificati drenajul parcelelor.';
  } else if (precipitatiMaxime >= 60) {
    recEl.textContent = 'Atentie! Probabilitate ridicata de ploaie (' + precipitatiMaxime + '%). Amanati tratamentele fitosanitare cu cel putin 24h. Planificati lucrarile pentru dupa trecerea frontului.';
  } else if (ploaieUrmeaza && precipitatiMaxime >= 30) {
    recEl.textContent = 'Ploaie posibila in urmatoarele zile (probabilitate ' + precipitatiMaxime + '%). Efectuati tratamentele fitosanitare cat mai curand daca este necesar.';
  } else if (wcode >= 70) {
    recEl.textContent = 'Ninsoare. Protejati culturile de toamna. Verificati rezistenta la inghet a soiurilor sensibile.';
  } else if (temp > 32) {
    recEl.textContent = 'Canicula! Irigati dimineata devreme (5-8 AM). Evitati lucrarile solului in orele de varf. Monitorizati stresul hidric la porumb si floarea-soarelui.';
  } else if (temp > 25) {
    recEl.textContent = 'Temperatura ridicata. Irigare recomandata pentru culturi sensibile. Conditii bune pentru uscarea cerealelor recoltate.';
  } else if (temp < 0) {
    recEl.textContent = 'Inghet! Protejati culturile de toamna. Nu efectuati lucrari mecanice. Verificati starea culturilor de rapita si grau dupa inghet.';
  } else if (temp < 5) {
    recEl.textContent = 'Temperaturi scazute. Risc de inghet nocturn. Nu semanati porumb sau floarea-soarelui. Monitorizati culturile de toamna.';
  } else if (precipitatiMaxime < 20 && wcode < 3) {
    recEl.textContent = 'Conditii excelente pentru lucrari agricole. Ideal pentru tratamente fitosanitare, fertilizari foliare si lucrari mecanice. Profitati de aceasta fereastra meteo favorabila.';
  } else {
    recEl.textContent = 'Conditii acceptabile pentru lucrari agricole. Verificati prognoza detaliata inainte de a aplica tratamente fitosanitare.';
  }
}

    // Detalii agro
    const detaliiEl=document.getElementById('meteo-detalii-agro');
    if (detaliiEl) {
      const culturi=parceleData.length?[...new Set(parceleData.map(p=>p.cultura))].join(', '):'nedefinite';
      detaliiEl.innerHTML='<div style="background:rgba(255,255,255,0.7);border-radius:10px;padding:12px;font-size:13px;margin-top:10px">'
        +'<div style="font-weight:700;color:var(--soil);margin-bottom:4px"><i class="ti ti-plant-2"></i> Culturile tale: '+culturi+'</div>'
        +'<div style="color:var(--gray-600)">Temperatura sol estimata: <b>'+(temp-2)+'°C</b> · Evapotranspiratie: <b>'+(temp>20?'Ridicata':'Moderata')+'</b></div>'
        +'</div>';
    }

    // Prognoza 7 zile
    const forecastCont=document.getElementById('meteo-forecast-7');
    const zileSaptamana=['Dum','Lun','Mar','Mie','Joi','Vin','Sam'];
    if (forecastCont&&daily) {
      forecastCont.innerHTML=daily.time.map((data,i)=>{
        const tMax=Math.round(daily.temperature_2m_max[i]);
        const tMin=Math.round(daily.temperature_2m_min[i]);
        const wInfo=getWeatherInfo(daily.weather_code[i]);
        const precip=daily.precipitation_probability_max[i]||0;
        const d=new Date(data);
        const numeZi=i===0?'Azi':zileSaptamana[d.getDay()];
        const ziLuna=d.getDate()+' '+d.toLocaleDateString('ro-RO',{month:'short'});
        return '<div style="background:var(--mist);border-radius:12px;padding:12px 8px;text-align:center;border:1px solid rgba(0,0,0,0.05)">'
          +'<div style="font-size:11px;font-weight:700;color:var(--gray-600);text-transform:uppercase">'+numeZi+'</div>'
          +'<div style="font-size:11px;color:var(--gray-400);margin-bottom:8px">'+ziLuna+'</div>'
          +'<i class="ti '+wInfo.icon+'" style="font-size:28px;color:'+wInfo.color+'"></i>'
          +'<div style="font-weight:700;font-size:16px;color:var(--soil);margin-top:6px">'+tMax+'°</div>'
          +'<div style="font-size:12px;color:var(--gray-400)">'+tMin+'°</div>'
          +(precip>0?'<div style="font-size:11px;color:var(--ai-blue);margin-top:4px;font-weight:600"><i class="ti ti-droplet"></i> '+precip+'%</div>':'')
          +'</div>';
      }).join('');
    }

    // Grafic temperaturi
    if (meteoChart) { meteoChart.destroy(); meteoChart=null; }
    const ctx=document.getElementById('meteo-chart')?.getContext('2d');
    if (ctx&&daily) {
      const labele=daily.time.map((data,i)=>{
        const d=new Date(data);
        return i===0?'Azi':zileSaptamana[d.getDay()]+' '+d.getDate();
      });
      meteoChart=new Chart(ctx,{
        type:'line',
        data:{
          labels:labele,
          datasets:[
            {label:'Max °C',data:daily.temperature_2m_max.map(t=>Math.round(t)),borderColor:'#d63031',backgroundColor:'rgba(214,48,49,0.1)',tension:0.4,fill:false,pointBackgroundColor:'#d63031',pointRadius:5},
            {label:'Min °C',data:daily.temperature_2m_min.map(t=>Math.round(t)),borderColor:'#1a6bbf',backgroundColor:'rgba(26,107,191,0.1)',tension:0.4,fill:false,pointBackgroundColor:'#1a6bbf',pointRadius:5}
          ]
        },
        options:{
          responsive:true,
          plugins:{legend:{position:'top',labels:{font:{family:'Inter',size:12},usePointStyle:true}}},
          scales:{
            y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{callback:v=>v+'°C',font:{family:'Inter',size:11}}},
            x:{grid:{display:false},ticks:{font:{family:'Inter',size:11}}}
          }
        }
      });
    }

  } catch(e) {
    showLoading(false);
    console.error('Eroare meteo:', e);
    showToast('Eroare la incarcarea meteo: '+e.message,'error');
  }
}

// ============================================================
//  ȘTIRI
// ============================================================
async function incarcaStiri() {
  const cont=document.getElementById('stiri-container'); if (!cont) return;
  cont.innerHTML='<div style="text-align:center;padding:48px;color:var(--gray-400)"><i class="ti ti-loader" style="font-size:36px;display:block;margin-bottom:12px"></i>Se incarca stirile...</div>';

  const surse=[
    'https://api.rss2json.com/v1/api.json?rss_url=https://agrointel.ro/feed/',
    'https://api.rss2json.com/v1/api.json?rss_url=https://www.agro-tv.ro/feed/',
    'https://api.rss2json.com/v1/api.json?rss_url=https://www.agrimedia.ro/feed/',
    'https://api.rss2json.com/v1/api.json?rss_url=https://www.fermierul.ro/feed/'
  ];

  toateStirile=[];
  const rezultate=await Promise.allSettled(surse.map(url=>
    fetch(url).then(r=>r.json()).catch(e=>({status:'error'}))
  ));

  rezultate.forEach(res=>{
    if (res.status==='fulfilled'&&res.value.status==='ok'&&res.value.items) {
      res.value.items.forEach(item=>{
        try {
          toateStirile.push({
            title:item.title,
            link:item.link,
            pubDate:item.pubDate,
            description:item.description?item.description.replace(/<[^>]+>/g,'').slice(0,180)+'...':'',
            source:new URL(item.link).hostname.replace('www.','')
          });
        } catch(e){}
      });
    }
  });

  toateStirile.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));

  if (!toateStirile.length) {
    cont.innerHTML='<div style="text-align:center;padding:40px;color:var(--gray-400)"><i class="ti ti-wifi-off" style="font-size:32px;display:block;margin-bottom:10px"></i>Nu s-au putut incarca stirile. Verificati conexiunea.</div>';
    return;
  }
  afiseazaStiri(toateStirile);

}
function afiseazaStiri(stiri) {
  const cont=document.getElementById('stiri-container'); if (!cont) return;
  if (!stiri.length) { cont.innerHTML='<div style="text-align:center;padding:30px;color:var(--gray-400)">Nicio știre pentru filtrul selectat.</div>'; return; }
  cont.innerHTML=stiri.map(item=>{
    const d=item.pubDate?new Date(item.pubDate).toLocaleDateString('ro-RO',{day:'2-digit',month:'short',year:'numeric'}):'';
    return `<div class="card" style="padding:16px;border-left:4px solid var(--ai-green);margin-bottom:10px;transition:all 0.2s" onmouseover="this.style.transform='translateX(3px)'" onmouseout="this.style.transform=''">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <h4 style="font-size:14px;font-weight:600;color:var(--soil);line-height:1.4;flex:1">${escapeHTML(item.title)}</h4>
        <span style="font-size:11px;color:var(--gray-400);white-space:nowrap;background:var(--mist);padding:3px 8px;border-radius:10px">${escapeHTML(item.source)}</span>
      </div>
      ${item.description?`<p style="font-size:12px;color:var(--gray-600);margin:8px 0;line-height:1.5">${escapeHTML(item.description)}</p>`:''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <span style="font-size:11px;color:var(--gray-400)"><i class="ti ti-calendar"></i> ${d}</span>
        <a href="${item.link}" target="_blank" rel="noopener" style="color:var(--ai-green);font-weight:600;font-size:12px;text-decoration:none">Citește mai mult <i class="ti ti-external-link"></i></a>
      </div></div>`;
  }).join('');
}
function filtreazaStiri(keyword, btn) {
  document.querySelectorAll('.stiri-filter-btn').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  afiseazaStiri(keyword==='toate'?toateStirile:toateStirile.filter(s=>s.title.toLowerCase().includes(keyword)||s.description.toLowerCase().includes(keyword)));
}
async function incarcaPreturiLive() {
  const apiKey='NZIER6MLR0MA1TKO'; const simboluri=['WEAT','CORN'];
  for (let s of simboluri) { try { const r=await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${s}&apikey=${apiKey}`); const d=await r.json(); if(d['Global Quote']?.['05. price']){const el=document.getElementById(`pret-${s.toLowerCase()}`);if(el)el.textContent=parseFloat(d['Global Quote']['05. price']).toFixed(2);} } catch(e){} }
}

// ============================================================
//  ASISTENT AI (Anthropic API)
// ============================================================
function sugestieChat(text) { document.getElementById('chat-input').value=text; trimiteChat(); }
async function trimiteChat() {
  const input=document.getElementById('chat-input'); if (!input) return;
  const msg=input.value.trim(); if (!msg) return;

  // Verificam limita de mesaje
  const chatCount = parseInt(localStorage.getItem('chat_count_'+currentUser.id)||'0');
  const chatData = localStorage.getItem('chat_reset_'+currentUser.id);
  const azi = new Date().toDateString();
  
  // Reset contor zilnic
  if (chatData !== azi) {
    localStorage.setItem('chat_count_'+currentUser.id, '0');
    localStorage.setItem('chat_reset_'+currentUser.id, azi);
  }
  
  const countCurent = parseInt(localStorage.getItem('chat_count_'+currentUser.id)||'0');
  if (countCurent >= 3) {
    addChatMsg('Ai atins limita de 3 mesaje pe zi pentru planul gratuit. Revino mâine sau upgradează la Pro pentru mesaje nelimitate.','ai');
    return;
  }

  input.value=''; addChatMsg(msg,'user');
  localStorage.setItem('chat_count_'+currentUser.id, (countCurent+1).toString());

  const farmContext='Fermierul are '+parceleData.length+' parcele ('+parceleData.reduce((s,p)=>s+p.suprafata_ha,0).toFixed(1)+' ha total). Culturi: '+([...new Set(parceleData.map(p=>p.cultura))].join(', ')||'nedefinite')+'. Judetul: '+(currentUser?.user_metadata?.judet||'Romania')+'.';
  chatHistory.push({role:'user',content:msg});
  if (chatHistory.length>20) chatHistory=chatHistory.slice(-20);
  const typingId='typing-'+Date.now();
  const cont=document.getElementById('chat-messages');
  cont.innerHTML+='<div class="chat-msg chat-ai" id="'+typingId+'"><div class="chat-avatar"><i class="ti ti-robot"></i></div><div class="chat-bubble"><i class="ti ti-dots" style="animation:spin 1s linear infinite"></i> Se gandeste...</div></div>';
  cont.scrollTop=cont.scrollHeight;
  try {
    const messages=[
      {role:'system',content:'Esti un asistent agronomic expert pentru fermieri romani. '+farmContext+' Raspunzi in romana, concis si practic.'}
    ];
    chatHistory.forEach(m=>{
      if (m.role==='user'||m.role==='assistant') messages.push({role:m.role,content:String(m.content||'')});
    });
    const response=await fetch('/api/groq',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'llama-3.3-70b-versatile',max_tokens:1000,messages:messages})
    });
    const data=await response.json();
    document.getElementById(typingId)?.remove();
    const reply=data.choices?.[0]?.message?.content||'Nu am putut genera un raspuns.';
    chatHistory.push({role:'assistant',content:reply});
    addChatMsg(reply,'ai');
  } catch(e) {
    document.getElementById(typingId)?.remove();
    addChatMsg('Eroare de conexiune. Verificati conexiunea la internet.','ai');
    console.error('Groq error:',e);
  }
}
function addChatMsg(text,role) {
  const cont=document.getElementById('chat-messages'); if (!cont) return;
  const div=document.createElement('div');
  div.className=`chat-msg chat-${role}`;
  div.innerHTML=role==='ai'?`<div class="chat-avatar"><i class="ti ti-robot"></i></div><div class="chat-bubble">${escapeHTML(text).replace(/\n/g,'<br>')}</div>`:`<div class="chat-bubble chat-user-bubble">${escapeHTML(text)}</div>`;
  cont.appendChild(div); cont.scrollTop=cont.scrollHeight;
}

// ============================================================
//  NOTE & MEMENTO-URI
// ============================================================
async function loadNote() {
  if (!currentUser) return;
  const { data,error } = await sb.from('note').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
  if (!error&&data) { noteData=data; renderListaNote(); renderNoteUrgente(); }
}
async function salveazaNota() {
  const editId=document.getElementById('nota-id-edit').value;
  const titlu=document.getElementById('nota-titlu').value.trim();
  if (!titlu) { showToast('Introduceți titlul notei.','error'); return; }
  const payload={user_id:currentUser.id,titlu,continut:document.getElementById('nota-continut').value.trim()||null,prioritate:document.getElementById('nota-prioritate').value,data_scadenta:document.getElementById('nota-scadenta').value||null};
  setLoading('nota-btn',true,'','Se salvează...');
  const { error } = editId ? await sb.from('note').update(payload).eq('id',editId) : await sb.from('note').insert([payload]);
  setLoading('nota-btn',false,'ti-plus','Salvează notă');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('Notă salvată!','success'); resetFormNota(); await loadNote(); updateDashboard();
}
function resetFormNota() { document.getElementById('nota-id-edit').value=''; ['nota-titlu','nota-continut','nota-scadenta'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); document.getElementById('nota-btn').innerHTML='<i class="ti ti-plus"></i> Salvează notă'; }
async function marcheazaNota(id) { await sb.from('note').update({completat:true}).eq('id',id).eq('user_id',currentUser.id); await loadNote(); updateDashboard(); showToast('Notă marcată ca rezolvată!','success'); }
async function stergeNota(id) { showLoading(true); await sb.from('note').delete().eq('id',id).eq('user_id',currentUser.id); showLoading(false); await loadNote(); updateDashboard(); }
function renderListaNote(filter) {
  const cont=document.getElementById('lista-note'); if (!cont) return;
  const list=filter?noteData.filter(n=>n.prioritate===filter):noteData;
  if (!list.length) { cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Nicio nota adaugata.</div>'; return; }
  const prColors={urgent:'var(--danger)',normal:'var(--ai-blue)',scazut:'var(--gray-400)'};
  const prLabels={urgent:'Urgent',normal:'Normal',scazut:'Prioritate scazuta'};
  cont.innerHTML=list.map(n=>{
    const scadentAzi=n.data_scadenta&&new Date(n.data_scadenta)<new Date();
    const borderColor=prColors[n.prioritate]||'var(--gray-400)';
    const opacitate=n.completat?'opacity:0.5;':'';
    const bgColor=scadentAzi&&!n.completat?'background:linear-gradient(to right,#fce8e8,#fff);':'';
    const textDec=n.completat?'text-decoration:line-through':'';
    const badgeColor=n.prioritate==='urgent'?'red':n.prioritate==='normal'?'blue':'wheat';
    const continutBlock=n.continut?'<div class="field-meta">'+escapeHTML(n.continut.slice(0,80))+(n.continut.length>80?'...':'')+'</div>':'';
    const scadentColor=scadentAzi&&!n.completat?'var(--danger)':'var(--gray-400)';
    const scadentBlock=n.data_scadenta?'<span style="font-size:11px;color:'+scadentColor+'"><i class="ti ti-calendar"></i> '+fmtData(n.data_scadenta)+'</span>':'';
    const id=String(n.id);
    const checkBtn=!n.completat?'<button class="btn btn-ghost btn-sm" onclick="marcheazaNota(this.dataset.id)" data-id="'+id+'" style="width:auto;padding:5px 10px"><i class="ti ti-check"></i></button>':'';
    return '<div class="field-item" style="border-left-color:'+borderColor+';'+opacitate+bgColor+'">'
      +'<div style="flex-grow:1">'
      +'<div class="field-name" style="'+textDec+'">'+escapeHTML(n.titlu)+'</div>'
      +continutBlock
      +'<div style="display:flex;gap:8px;margin-top:4px;align-items:center">'
      +'<span class="badge badge-'+badgeColor+'">'+prLabels[n.prioritate]+'</span>'
      +scadentBlock
      +'</div></div>'
      +'<div style="display:flex;gap:6px;align-items:center">'
      +checkBtn
      +'<button class="btn btn-danger btn-sm" onclick="stergeNota(this.dataset.id)" data-id="'+id+'" style="width:auto;padding:5px 10px"><i class="ti ti-trash"></i></button>'
      +'</div></div>';
  }).join('');
}

function renderNoteUrgente() {
  const cont=document.getElementById('note-urgente-list'); if (!cont) return;
  const urgente=noteData.filter(n=>n.prioritate==='urgent'&&!n.completat);
  if (!urgente.length) { cont.innerHTML='<div style="color:var(--ai-green);font-size:13px;text-align:center;padding:20px"><i class="ti ti-circle-check" style="font-size:20px;display:block;margin-bottom:6px"></i>Nicio sarcina urgenta!</div>'; return; }
  cont.innerHTML=urgente.map(n=>{
    const id=String(n.id);
    const scadentBlock=n.data_scadenta?'<div style="font-size:12px;color:var(--gray-600);margin-top:2px">Scadent: '+fmtData(n.data_scadenta)+'</div>':'';
    return '<div style="background:#fce8e8;border:1px solid #f0b0b0;border-radius:10px;padding:12px;margin-bottom:8px">'
      +'<div style="font-weight:700;font-size:13px;color:var(--danger)">'+escapeHTML(n.titlu)+'</div>'
      +scadentBlock
      +'<button class="btn btn-ghost btn-sm" onclick="marcheazaNota(this.dataset.id)" data-id="'+id+'" style="width:auto;margin-top:8px;padding:5px 12px"><i class="ti ti-check"></i> Rezolvat</button>'
      +'</div>';
  }).join('');
}
function filtreazaNote() { const f=document.getElementById('nota-filter').value; renderListaNote(f||null); }

// ============================================================
//  SIDEBAR TOGGLE (MOBILE)
// ============================================================
function toggleSidebar() {
  const sb_el=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebar-overlay');
  sb_el?.classList.toggle('open');
  overlay?.classList.toggle('active');
}

// ============================================================
//  START
// ============================================================
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  const icon = document.getElementById('dark-icon');
  if (icon) icon.className = isDark ? 'ti ti-sun' : 'ti ti-moon';
  localStorage.setItem('darkMode', isDark ? '1' : '0');
}

// Aplicăm dark mode la încărcare dacă era activ
if (localStorage.getItem('darkMode') === '1') {
  document.body.classList.add('dark-mode');
  document.addEventListener('DOMContentLoaded', () => {
    const icon = document.getElementById('dark-icon');
    if (icon) icon.className = 'ti ti-sun';
  });

}
async function loadAniAgricoli() {
  if (!currentUser) return;
  const { data,error } = await sb.from('ani_agricoli').select('*').eq('user_id',currentUser.id).order('an_agricol',{ascending:false});
  if (!error&&data) {
    aniAgricoliData=data;
    renderCalTimeline();
    renderCalSumar();
  }
  reincarcaParcelePeHartaFull();
}

function calcCalProductie() {
  const prod=parseFloat(document.getElementById('cal-productie').value)||0;
  const sup=parseFloat(document.getElementById('cal-suprafata').value)||0;
  const prev=document.getElementById('cal-tha-preview');
  if (prod>0&&sup>0&&prev) {
    prev.style.display='block';
    document.getElementById('cal-tha-val').textContent=(prod/sup).toFixed(2);
  } else if (prev) { prev.style.display='none'; }
}

async function salveazaAnAgricol() {
  const parcelaOpt=document.getElementById('cal-parcela');
  const parcelaNume=parcelaOpt.options[parcelaOpt.selectedIndex]?.text||'';
  const parcelaId=parcelaOpt.value;
  const prod=parseFloat(document.getElementById('cal-productie').value)||null;
  const sup=parseFloat(document.getElementById('cal-suprafata').value)||null;
  const tha=prod&&sup?parseFloat((prod/sup).toFixed(2)):null;
  setLoading('cal-btn',true,'','Se salvează...');
  const { error } = await sb.from('ani_agricoli').insert([{
    user_id:currentUser.id,
    parcela_id:parcelaId||null,
    parcela_nume:parcelaNume,
    an_agricol:document.getElementById('cal-an').value,
    cultura:document.getElementById('cal-cultura').value,
    status:document.getElementById('cal-status').value,
    data_semanat:document.getElementById('cal-semanat').value||null,
    data_recolta:document.getElementById('cal-recolta').value||null,
    productie_tone:prod,
    suprafata_ha:sup,
    productie_tha:tha,
    note:document.getElementById('cal-note').value.trim()||null
  }]);
  setLoading('cal-btn',false,'ti-plus','Salvează');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast('An agricol salvat!','success');
  ['cal-productie','cal-suprafata','cal-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('cal-semanat').value='';
  document.getElementById('cal-recolta').value='';
  document.getElementById('cal-tha-preview').style.display='none';
  await loadAniAgricoli();
}

async function stergeAnAgricol(id) {
  showLoading(true);
  await sb.from('ani_agricoli').delete().eq('id',id).eq('user_id',currentUser.id);
  showLoading(false);
  showToast('An agricol sters.','info');
  await loadAniAgricoli();
}

function filtreazaCalendar() {
  renderCalTimeline();
  renderCalSumar();
}

function renderCalTimeline() {
  const cont = document.getElementById('cal-timeline'); if (!cont) return;
  const fa = document.getElementById('cal-filter-an')?.value;
  const fp = document.getElementById('cal-filter-parcela')?.value;

  const aniDetectati = new Set();
  [...parceleData, ...lucrariData, ...recolteData, ...fitosanitarData].forEach(item => {
    const data = item.data_semanat || item.data_lucrare || item.data_recolta || item.data_aplicare;
    if (data) {
      const d = new Date(data);
      const luna = d.getMonth();
      const an = d.getFullYear();
      const anAgricol = luna >= 9 ? (an+'-'+(an+1)) : ((an-1)+'-'+an);
      aniDetectati.add(anAgricol);
    }
  });

  aniAgricoliData.forEach(x => aniDetectati.add(x.an_agricol));
  const acum = new Date();
  const lunaAcum = acum.getMonth();
  const anAcum = acum.getFullYear();
  const anCurent = lunaAcum >= 9 ? (anAcum+'-'+(anAcum+1)) : ((anAcum-1)+'-'+anAcum);
  aniDetectati.add(anCurent);

let ani = [...aniDetectati].sort((a,b) => b.localeCompare(a));
const toateAnii = [...ani];
if (!window.calendarExtins) ani = ani.slice(0, 1);  if (fa) ani = ani.filter(a => a === fa);

  if (!ani.length) {
    cont.innerHTML = '<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Nicio activitate inregistrata.</div>';
    return;
  }

  const cultColors = {'Porumb':'#16a34a','Grau':'#d97706','Grâu':'#d97706','Floarea-soarelui':'#2563eb','Rapita':'#7c3aed','Rapiță':'#7c3aed','Orz':'#059669','Soia':'#0891b2','Altele':'#6b7280'};
  const statusColors = {planificat:'badge-wheat',in_desfasurare:'badge-blue',finalizat:'badge-green'};
  const statusLabels = {planificat:'Planificat',in_desfasurare:'In desfasurare',finalizat:'Finalizat'};

  function inInterval(data, dataStart, dataEnd) {
    if (!data) return false;
    const d = new Date(data);
    return d >= dataStart && d <= dataEnd;
  }

  const rezultat = ani.map(an => {
    const parti = an.split('-');
    const anStart = parseInt(parti[0]);
    const anEnd = parseInt(parti[1]);
    const dataStart = new Date(anStart, 9, 1);
    const dataEnd = new Date(anEnd, 8, 30);

    const parceleActive = parceleData.filter(p =>
      inInterval(p.data_semanat, dataStart, dataEnd) ||
      recolteData.some(r => r.parcela_id === p.id && inInterval(r.data_recolta, dataStart, dataEnd))
    );

    const manuale = aniAgricoliData.filter(x => x.an_agricol === an);
    const toateParcele = new Map();
    parceleActive.forEach(p => toateParcele.set(p.id, {sursa:'parcela', parcela:p}));
    manuale.forEach(m => { if (!toateParcele.has(m.parcela_id)) toateParcele.set(m.id, {sursa:'manual', manual:m}); });

    let filtrate = [...toateParcele.values()];
    if (fp) {
  const parcelaGasita = parceleData.find(p => p.id === fp);
  const numeParc = parcelaGasita ? parcelaGasita.nume : fp;
  filtrate = filtrate.filter(x => {
    const n = x.sursa === 'parcela' ? x.parcela.nume : x.manual.parcela_nume;
    return n === numeParc;
  });
}

    if (!filtrate.length) return '';

    const carduriHTML = filtrate.map(item => {
      let nume, cultura, col, statusKey, manualItem = null;
      let lucrariParc = [], recolteParc = [], tratamenteParc = [];

      if (item.sursa === 'parcela') {
        const p = item.parcela;
        nume = p.nume; cultura = p.cultura;
        col = cultColors[cultura] || '#6b7280';
        lucrariParc = lucrariData.filter(l => l.parcela_id === p.id && inInterval(l.data_lucrare, dataStart, dataEnd));
        recolteParc = recolteData.filter(r => r.parcela_id === p.id && inInterval(r.data_recolta, dataStart, dataEnd));
        tratamenteParc = fitosanitarData.filter(f => f.parcela_id === p.id && inInterval(f.data_aplicare, dataStart, dataEnd));
        statusKey = recolteParc.length > 0 ? 'finalizat' : lucrariParc.length > 0 ? 'in_desfasurare' : 'planificat';
      } else {
        manualItem = item.manual;
        nume = manualItem.parcela_nume || '-'; cultura = manualItem.cultura;
        col = cultColors[cultura] || '#6b7280';
        statusKey = manualItem.status || 'planificat';
        lucrariParc = lucrariData.filter(l => l.parcela_nume === nume && inInterval(l.data_lucrare, dataStart, dataEnd));
        recolteParc = recolteData.filter(r => r.parcela_nume === nume && inInterval(r.data_recolta, dataStart, dataEnd));
        tratamenteParc = fitosanitarData.filter(f => f.parcela_nume === nume && inInterval(f.data_aplicare, dataStart, dataEnd));
      }

      const totalTone = recolteParc.reduce((s,r) => s + parseFloat(r.cantitate_tone||0), 0);
      const totalHa = recolteParc.reduce((s,r) => s + parseFloat(r.suprafata_ha||0), 0);
      const randament = totalHa > 0 ? (totalTone/totalHa).toFixed(2) : null;
      const manualTone = manualItem?.productie_tone;
      const manualTha = manualItem?.productie_tha;

      const productieText = totalTone > 0 ? totalTone.toFixed(1)+' t' : (manualTone ? manualTone+' t' : '—');
      const randamentText = randament ? randament+' t/ha' : (manualTha ? manualTha+' t/ha' : '—');

      const actLucrari = lucrariParc.length > 0 ? '<span style="background:#dcfce7;color:#15803d;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600"><i class="ti ti-tractor"></i> '+lucrariParc.length+' lucrari</span>' : '';
      const actTratamente = tratamenteParc.length > 0 ? '<span style="background:#fef9c3;color:#a16207;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600"><i class="ti ti-flask"></i> '+tratamenteParc.length+' tratamente</span>' : '';
      const actRecolte = recolteParc.length > 0 ? '<span style="background:#dbeafe;color:#1d4ed8;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600"><i class="ti ti-grain"></i> '+recolteParc.length+' recolte</span>' : '';
      const actGoale = (!actLucrari && !actTratamente && !actRecolte) ? '<span style="color:var(--gray-400);font-size:11px">Nicio activitate</span>' : '';

      const btnDelete = item.sursa === 'manual' ? '<button class="btn btn-danger btn-sm" onclick="stergeAnAgricol(\''+manualItem.id+'\')" style="width:auto;padding:4px 10px;margin-top:10px"><i class="ti ti-trash"></i> Sterge</button>' : '';

      return '<div style="background:var(--white);border:1px solid var(--gray-200);border-radius:12px;padding:15px;border-top:3px solid '+col+';box-shadow:var(--shadow-xs);transition:all 0.2s;cursor:pointer" onclick="arataTimelineParcela(\''+escapeHTML(nume)+'\',\''+an+'\')" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'var(--shadow-md)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'var(--shadow-xs)\'">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
        '<div><div style="font-weight:700;font-size:14px;color:var(--ai-green)">'+escapeHTML(nume)+' <i class="ti ti-timeline" style="font-size:12px"></i></div>'+
        '<div style="font-size:12px;color:var(--gray-500);margin-top:2px">'+escapeHTML(cultura)+'</div></div>'+
        '<span class="badge '+statusColors[statusKey]+'">'+statusLabels[statusKey]+'</span>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+
        '<div style="background:var(--gray-50);border-radius:8px;padding:8px;text-align:center"><div style="font-size:10px;color:var(--gray-400);text-transform:uppercase;font-weight:700">Productie</div><div style="font-weight:700;font-size:14px;color:var(--soil)">'+productieText+'</div></div>'+
        '<div style="background:var(--gray-50);border-radius:8px;padding:8px;text-align:center"><div style="font-size:10px;color:var(--gray-400);text-transform:uppercase;font-weight:700">Randament</div><div style="font-weight:700;font-size:14px;color:var(--ai-green)">'+randamentText+'</div></div>'+
        '</div>'+
        '<div style="font-size:11px;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Activitati</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:5px">'+actLucrari+actTratamente+actRecolte+actGoale+'</div>'+
        btnDelete+
        '</div>';
    }).join('');

    if (!carduriHTML.trim()) return '';

    return '<div style="margin-bottom:28px">'+
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'+
      '<div style="background:var(--grad-earth);color:#fff;padding:6px 18px;border-radius:20px;font-size:13px;font-weight:700">'+an+'</div>'+
      '<div style="height:1px;flex:1;background:var(--gray-200)"></div>'+
      '<div style="font-size:12px;color:var(--gray-400);font-weight:600">'+filtrate.length+' parcele</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px">'+
      carduriHTML+
      '</div></div>';
  }).filter(x => x).join('');

  cont.innerHTML = rezultat || '<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:24px">Nicio activitate inregistrata.</div>';
// Buton extinde daca sunt mai multi ani
if (toateAnii.length > 1 && !window.calendarExtins) {
  cont.innerHTML += '<div style="text-align:center;margin-top:16px">'
    +'<button class="btn btn-ghost" onclick="window.calendarExtins=true;renderCalTimeline()" style="width:auto;padding:10px 24px">'
    +'<i class="ti ti-chevron-down"></i> Vezi toti anii ('+toateAnii.length+')'
    +'</button></div>';
} else if (toateAnii.length > 1 && window.calendarExtins) {
  cont.innerHTML += '<div style="text-align:center;margin-top:16px">'
    +'<button class="btn btn-ghost" onclick="window.calendarExtins=false;renderCalTimeline()" style="width:auto;padding:10px 24px">'
    +'<i class="ti ti-chevron-up"></i> Restrânge'
    +'</button></div>';
}
}
function arataTimelineParcela(nume, an) {
  const [anStart, anEnd] = an.split('-').map(Number);
  const dataStart = new Date(anStart, 9, 1);
  const dataEnd   = new Date(anEnd, 8, 30);

  function inInterval(data) {
    if (!data) return false;
    const d = new Date(data);
    return d >= dataStart && d <= dataEnd;
  }

  // Colectăm toate evenimentele
  const evenimente = [];

  lucrariData.filter(l => l.parcela_nume === nume && inInterval(l.data_lucrare)).forEach(l => {
    evenimente.push({
      data: l.data_lucrare,
      tip: 'lucrare',
      titlu: l.tip_lucrare,
      detalii: [
        l.utilaj ? 'Utilaj: ' + l.utilaj : null,
        l.operator ? 'Operator: ' + l.operator : null,
        l.durata_ore ? 'Durata: ' + l.durata_ore + ' h' : null,
        l.observatii ? 'Note: ' + l.observatii : null
      ].filter(Boolean)
    });
  });

  fitosanitarData.filter(f => f.parcela_nume === nume && inInterval(f.data_aplicare)).forEach(f => {
    evenimente.push({
      data: f.data_aplicare,
      tip: 'tratament',
      titlu: f.tip_tratament + ': ' + f.produs,
      detalii: [
        f.substanta_activa ? 'Substanta: ' + f.substanta_activa : null,
        f.doza_ha ? 'Doza: ' + f.doza_ha : null,
        f.suprafata_tratata_ha ? 'Suprafata: ' + f.suprafata_tratata_ha + ' ha' : null,
        f.operator ? 'Operator: ' + f.operator : null,
        f.conditii_meteo ? 'Meteo: ' + f.conditii_meteo : null
      ].filter(Boolean)
    });
  });

  recolteData.filter(r => r.parcela_nume === nume && inInterval(r.data_recolta)).forEach(r => {
    evenimente.push({
      data: r.data_recolta,
      tip: 'recolta',
      titlu: 'Recoltare ' + r.cultura,
      detalii: [
        r.cantitate_tone ? 'Productie: ' + r.cantitate_tone + ' t' : null,
        r.randament_tha ? 'Randament: ' + parseFloat(r.randament_tha).toFixed(2) + ' t/ha' : null,
        r.pret_vanzare_ron_tona ? 'Pret: ' + r.pret_vanzare_ron_tona + ' RON/t' : null,
        r.cumparator ? 'Cumparator: ' + r.cumparator : null,
        r.calitate ? 'Calitate: ' + r.calitate : null
      ].filter(Boolean)
    });
  });

  // Sortam cronologic
  evenimente.sort((a, b) => new Date(a.data) - new Date(b.data));

  // Culori si icoane per tip
  const tipConfig = {
    lucrare:   { culoare: '#16a34a', bg: '#dcfce7', icon: 'ti-tractor',    label: 'Lucrare' },
    tratament: { culoare: '#d97706', bg: '#fef9c3', icon: 'ti-flask',      label: 'Tratament' },
    recolta:   { culoare: '#2563eb', bg: '#dbeafe', icon: 'ti-grain',      label: 'Recolta' }
  };

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';

  modal.innerHTML = '<div style="background:var(--white);border-radius:20px;width:100%;max-width:560px;max-height:85vh;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.3);display:flex;flex-direction:column">'

    // Header
    + '<div style="padding:20px 24px;border-bottom:1px solid var(--gray-200);display:flex;justify-content:space-between;align-items:center;background:var(--gray-50)">'
    + '<div>'
    + '<div style="font-family:\'Lora\',serif;font-size:18px;font-weight:600;color:var(--soil)">' + escapeHTML(nume) + '</div>'
    + '<div style="font-size:13px;color:var(--gray-500);margin-top:2px;font-weight:600">An agricol ' + an + ' · ' + evenimente.length + ' interventii</div>'
    + '</div>'
    + '<button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--gray-400);padding:4px 8px;border-radius:8px;transition:all 0.2s" onmouseover="this.style.background=\'var(--danger-light)\';this.style.color=\'var(--danger)\'" onmouseout="this.style.background=\'none\';this.style.color=\'var(--gray-400)\'">×</button>'
    + '</div>'

    // Timeline
    + '<div style="padding:24px;overflow-y:auto;flex:1">'
    + (evenimente.length === 0
      ? '<div style="text-align:center;padding:40px;color:var(--gray-400)"><i class="ti ti-calendar-off" style="font-size:36px;display:block;margin-bottom:10px"></i>Nicio interventie inregistrata pentru acest an.</div>'
      : '<div style="position:relative">'
        // Linia verticală
        + '<div style="position:absolute;left:19px;top:0;bottom:0;width:2px;background:var(--gray-200);border-radius:1px"></div>'
        + evenimente.map((ev, i) => {
          const cfg = tipConfig[ev.tip] || tipConfig.lucrare;
          return '<div style="display:flex;gap:16px;margin-bottom:' + (i < evenimente.length-1 ? '20px' : '0') + ';position:relative">'
            // Dot
            + '<div style="width:40px;height:40px;border-radius:50%;background:' + cfg.bg + ';border:2px solid ' + cfg.culoare + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1">'
            + '<i class="ti ' + cfg.icon + '" style="font-size:16px;color:' + cfg.culoare + '"></i>'
            + '</div>'
            // Content
            + '<div style="flex:1;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;padding:12px 14px;margin-top:4px">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">'
            + '<div style="font-weight:700;font-size:13px;color:var(--soil)">' + escapeHTML(ev.titlu) + '</div>'
            + '<span style="font-size:11px;font-weight:600;color:' + cfg.culoare + ';background:' + cfg.bg + ';padding:2px 8px;border-radius:10px">' + fmtData(ev.data) + '</span>'
            + '</div>'
            + (ev.detalii.length ? '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:5px">'
              + ev.detalii.map(d => '<span style="font-size:11px;color:var(--gray-500);background:var(--white);border:1px solid var(--gray-200);padding:2px 8px;border-radius:6px;font-weight:500">' + escapeHTML(d) + '</span>').join('')
              + '</div>' : '')
            + '</div>'
            + '</div>';
        }).join('')
        + '</div>'
    )
    + '</div>'

    // Footer
    + '<div style="padding:14px 24px;border-top:1px solid var(--gray-200);background:var(--gray-50);display:flex;justify-content:space-between;align-items:center">'
    + '<div style="display:flex;gap:10px">'
    + '<span style="font-size:11px;font-weight:600;color:#15803d;background:#dcfce7;padding:3px 9px;border-radius:6px"><i class="ti ti-tractor"></i> ' + lucrariData.filter(l => l.parcela_nume===nume && inInterval(l.data_lucrare)).length + ' lucrari</span>'
    + '<span style="font-size:11px;font-weight:600;color:#a16207;background:#fef9c3;padding:3px 9px;border-radius:6px"><i class="ti ti-flask"></i> ' + fitosanitarData.filter(f => f.parcela_nume===nume && inInterval(f.data_aplicare)).length + ' tratamente</span>'
    + '<span style="font-size:11px;font-weight:600;color:#1d4ed8;background:#dbeafe;padding:3px 9px;border-radius:6px"><i class="ti ti-grain"></i> ' + recolteData.filter(r => r.parcela_nume===nume && inInterval(r.data_recolta)).length + ' recolte</span>'
    + '</div>'
    + '<button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:var(--grad-green);color:#fff;border:none;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:\'Plus Jakarta Sans\',sans-serif">Inchide</button>'
    + '</div>'
    + '</div>';

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function renderCalSumar() {
  const cont=document.getElementById('cal-sumar'); if (!cont) return;

  // Agregam datele din recolte si lucrari per an agricol
  const aniMap={};

  recolteData.forEach(r=>{
    if (!r.data_recolta) return;
    const d=new Date(r.data_recolta);
    const luna=d.getMonth();
    const an=d.getFullYear();
    const anAgricol=luna>=9?(an+'-'+(an+1)):((an-1)+'-'+an);
    if (!aniMap[anAgricol]) aniMap[anAgricol]={tone:0,parcele:new Set(),lucrari:0};
    aniMap[anAgricol].tone+=parseFloat(r.cantitate_tone||0);
    if (r.parcela_nume) aniMap[anAgricol].parcele.add(r.parcela_nume);
  });

  lucrariData.forEach(l=>{
    if (!l.data_lucrare) return;
    const d=new Date(l.data_lucrare);
    const luna=d.getMonth();
    const an=d.getFullYear();
    const anAgricol=luna>=9?(an+'-'+(an+1)):((an-1)+'-'+an);
    if (!aniMap[anAgricol]) aniMap[anAgricol]={tone:0,parcele:new Set(),lucrari:0};
    aniMap[anAgricol].lucrari++;
    if (l.parcela_nume) aniMap[anAgricol].parcele.add(l.parcela_nume);
  });

  const ani=Object.keys(aniMap).sort((a,b)=>b.localeCompare(a));

  if (!ani.length) {
    cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:20px">Nicio activitate inregistrata.</div>';
    return;
  }

  cont.innerHTML=ani.slice(0,4).map(an=>{
    const d=aniMap[an];
    return '<div style="background:var(--gray-50);border-radius:10px;padding:12px;margin-bottom:10px;border-left:3px solid var(--ai-green)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
      +'<div style="font-weight:700;font-size:14px">'+an+'</div>'
      +'<span class="badge badge-green">'+d.parcele.size+' parcele</span>'
      +'</div>'
      +'<div style="font-size:12px;color:var(--gray-500)">'
      +(d.tone>0?'<span style="color:var(--ai-green);font-weight:700">'+d.tone.toFixed(1)+' t</span> recoltate · ':'')
      +d.lucrari+' lucrari efectuate'
      +'</div></div>';
  }).join('');
}
function renderRotatieAlerte() {
  const cont = document.getElementById('cal-rotatii-alerte'); if (!cont) return;
  if (!parceleData.length) { cont.innerHTML=''; return; }

  const alerte = [];
  const recomandari = [];

  parceleData.forEach(parcela => {
    const istoricParcela = rotatieData.filter(r => r.parcela_id === parcela.id)
      .sort((a,b) => b.sezon.localeCompare(a.sezon));

    if (istoricParcela.length < 2) return;

    // Verificam monocultura
    const ultimele3 = istoricParcela.slice(0, 3);
    const toateAceeasiCultura = ultimele3.every(r => r.cultura === ultimele3[0].cultura);
    if (ultimele3.length >= 2 && toateAceeasiCultura) {
      alerte.push({
        parcela: parcela.nume,
        cultura: ultimele3[0].cultura,
        ani: ultimele3.length,
        tip: 'pericol'
      });
      return;
    }

    // Recomandam cultura optima
    const ultimaCultura = istoricParcela[0].cultura;
    const recomandariCulturi = {
      'Grau': ['Floarea-soarelui', 'Rapita', 'Soia'],
      'Grâu': ['Floarea-soarelui', 'Rapita', 'Soia'],
      'Porumb': ['Grau', 'Rapita', 'Soia'],
      'Floarea-soarelui': ['Grau', 'Porumb', 'Orz'],
      'Rapita': ['Grau', 'Porumb', 'Orz'],
      'Rapiță': ['Grau', 'Porumb', 'Orz'],
      'Soia': ['Grau', 'Porumb', 'Floarea-soarelui'],
      'Orz': ['Floarea-soarelui', 'Rapita', 'Soia']
    };
    const rec = recomandariCulturi[ultimaCultura];
    if (rec) {
      recomandari.push({
        parcela: parcela.nume,
        ultimaCultura: ultimaCultura,
        recomandate: rec
      });
    }
  });

  if (!alerte.length && !recomandari.length) {
    cont.innerHTML = '<div style="color:var(--ai-green);font-size:13px;text-align:center;padding:16px"><i class="ti ti-circle-check" style="font-size:20px;display:block;margin-bottom:6px"></i>Rotatia culturilor este optima!</div>';
    return;
  }

  cont.innerHTML =
    alerte.map(a =>
      '<div class="alert-box" style="border-color:#f0b0b0;background:#fce8e8;margin-bottom:8px">'
      +'<i class="ti ti-alert-triangle" style="color:var(--danger);font-size:18px"></i>'
      +'<div><b style="color:var(--danger)">Atentie: Monocultura '+a.ani+' ani — '+escapeHTML(a.parcela)+'</b>'
      +'<div style="font-size:12px;color:var(--gray-600);margin-top:2px">'+escapeHTML(a.cultura)+' cultivat '+a.ani+' ani consecutiv. Schimbati cultura pentru sezonul urmator!</div>'
      +'</div></div>'
    ).join('')
    + recomandari.map(r =>
      '<div class="alert-box" style="margin-bottom:8px">'
      +'<i class="ti ti-bulb" style="color:var(--wheat);font-size:18px"></i>'
      +'<div><b>Recomandare rotatie — '+escapeHTML(r.parcela)+'</b>'
      +'<div style="font-size:12px;color:var(--gray-600);margin-top:2px">Dupa '+escapeHTML(r.ultimaCultura)+', recomandam: <b>'+r.recomandate.join(', ')+'</b></div>'
      +'</div></div>'
    ).join('');
}
// Inregistrare Service Worker PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('[PWA] Service Worker inregistrat:', reg.scope))
      .catch(err => console.warn('[PWA] Service Worker eroare:', err));
  });
// ============================================================
//  SISTEM ABONAMENTE STRIPE
// ============================================================

async function loadUserPlan() {
  if (!currentUser) return;
  const { data } = await sb.from('abonamente')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('status', 'active')
    .order('created_at', {ascending: false})
    .limit(1);
  if (data && data.length > 0) {
    userPlan = data[0].plan;
  } else {
    userPlan = 'gratuit';
  }
  updateUIForPlan();
}

function updateUIForPlan() {
  const badge = document.getElementById('top-user');
  if (badge) {
    const m = currentUser?.user_metadata || {};
    const planLabel = userPlan === 'pro' ? ' 👑 Pro' : userPlan === 'standard' ? ' ⭐ Standard' : '';
    badge.textContent = (m.prenume||'Fermier')+' '+(m.nume||'')+planLabel;
  }
}

function deschideModalAbonament(plan) {
  const modal = document.getElementById('modal-abonament');
  if (modal) modal.style.display = 'flex';

  const planuri = {
    standard: {
      titlu: 'Plan Standard',
      pret: '49 RON / lună',
      priceId: STRIPE_STANDARD,
      features: ['✅ Parcele nelimitate','✅ Toate modulele active','✅ Funcționare offline','✅ Calendar agricol complet','✅ Export PDF rapoarte','✅ Asistent AI agronomic']
    },
    pro: {
      titlu: 'Plan Pro',
      pret: '99 RON / lună',
      priceId: STRIPE_PRO,
      features: ['✅ Tot ce include Standard','✅ Notificări push meteo','✅ Analiză profitabilitate avansată','✅ Multi-fermă','✅ Suport prioritar','✅ Acces beta funcții noi']
    }
  };

  const p = planuri[plan] || planuri.standard;
  currentPriceId = p.priceId;

  document.getElementById('modal-plan-titlu').textContent = p.titlu;
  document.getElementById('modal-plan-pret').textContent = p.pret;
  document.getElementById('modal-plan-features').innerHTML = p.features
    .map(f => '<div style="font-size:13px;padding:4px 0;color:var(--soil)">'+f+'</div>').join('');

  initStripeElements();
}

function inchideModalAbonament() {
  const modal = document.getElementById('modal-abonament');
  if (modal) modal.style.display = 'none';
  stripeElements = null;
  document.getElementById('payment-element').innerHTML = '';
}

async function initStripeElements() {
  if (!stripeInstance) stripeInstance = Stripe(STRIPE_PK);
  try {
    const response = await fetch('/api/stripe', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        action: 'create_subscription',
        priceId: currentPriceId,
        userId: currentUser.id,
        userEmail: currentUser.email
      })
    });
    const data = await response.json();
    currentSubscriptionId = data.subscriptionId;
    stripeElements = stripeInstance.elements({
      clientSecret: data.clientSecret,
      appearance: {
        theme: document.body.classList.contains('dark-mode') ? 'night' : 'stripe',
        variables: {
          colorPrimary: '#16a34a',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          borderRadius: '8px'
        }
      }
    });
    const paymentEl = stripeElements.create('payment');
    paymentEl.mount('#payment-element');
  } catch(e) {
    console.error('Stripe error:', e);
    showToast('Eroare la initializarea platii.','error');
  }
}

async function confirmaPlata() {
  if (!stripeElements || !stripeInstance) return;

  const btn = document.getElementById('btn-confirma-plata');
  const errEl = document.getElementById('payment-error');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Se procesează...';
  errEl.style.display = 'none';

  const { error } = await stripeInstance.confirmPayment({
    elements: stripeElements,
    confirmParams: { return_url: window.location.href },
    redirect: 'if_required'
  });

  if (error) {
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-lock"></i> Confirmă abonamentul';
    return;
  }

  // Salvam abonamentul in Supabase
  const planNume = currentPriceId === STRIPE_STANDARD ? 'standard' : 'pro';
  await sb.from('abonamente').insert([{
    user_id: currentUser.id,
    plan: planNume,
    stripe_subscription_id: currentSubscriptionId,
    status: 'active'
  }]);

  inchideModalAbonament();
  userPlan = planNume;
  updateUIForPlan();
  showToast('Abonament activat cu succes! Bun venit în planul '+planNume.toUpperCase()+'! 🎉','success',6000);
}
function deschideModalUtilaj() {
  const modal = document.getElementById('modal-utilaj');
  if (modal) modal.style.display = 'flex';
}

function inchideModalUtilaj() {
  const modal = document.getElementById('modal-utilaj');
  if (modal) modal.style.display = 'none';
  resetFormUtilaj();
}

function deschideModalAlerteUtilaj() {
  const modal = document.getElementById('modal-alerte-utilaj');
  if (modal) modal.style.display = 'flex';
  renderUtilajAlerte();
}
function deschideModalAdaugaCal() {
  document.getElementById('modal-cal-adauga').style.display = 'flex';
}

function deschideModalSumarCal() {
  renderCalSumar();
  document.getElementById('modal-cal-sumar').style.display = 'flex';
}

}
initApp();
