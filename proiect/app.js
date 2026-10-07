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
let cheltuieliListaCurenta = [];

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
  const sb_el = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const isOpen = sb_el?.classList.toggle('open');
  overlay?.classList.toggle('active');
  
  if (isOpen) {
    // Sidebar deschis - ascunde layerele leaflet
    document.querySelectorAll('.leaflet-pane, .leaflet-control-container').forEach(el => {
      el.style.visibility = 'hidden';
    });
  } else {
    // Sidebar inchis - arata layerele leaflet
    document.querySelectorAll('.leaflet-pane, .leaflet-control-container').forEach(el => {
      el.style.visibility = 'visible';
    });
  }
}
function switchTab(id, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+id)?.classList.add('active');
  if (btn) btn.classList.add('active');
// Închide sidebar pe mobile
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
  const mapFull = document.getElementById('map-full');
  if (mapFull) mapFull.style.zIndex = '';  // Hook-uri per tab
if (id === 'contabilitate') { if(typeof renderTabelCheltuieli === 'function') renderTabelCheltuieli(null); updateSumeContabilitate(); renderCatBars(); }  if (id === 'profitabilitate') calculeazaProfitabilitate();
  if (id === 'rotatie') renderRotatieTabel();
  if (id === 'stiri' && toateStirile.length === 0) incarcaStiri();
if (id === 'calendar') { window.calendarExtins=false; renderCalTimeline(); renderCalSumar(); renderRotatieAlerte(); }
if (id === 'harta') { 
  const tabHarta = document.getElementById('tab-harta');
  const mapFull = document.getElementById('map-full');
  setTimeout(() => initMapFull(), 100); 
}
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
const { data, error } = await sb.from('parcele').select('*,created_at').eq('user_id',currentUser.id).order('created_at',{ascending:false});  if (!error && data) { parceleData=data; renderListaParcele(); renderCulturaBars(); updateAllParcelaSelects(); reincarcaParcelePeHarta(); }
reincarcaParcelePeHartaFull();
}
async function adaugaParcela() {
  const n=document.getElementById('p-nume').value.trim(), ha=parseFloat(document.getElementById('p-ha').value)||0;
  const c=document.getElementById('p-cultura')?.value||null;
  const l=document.getElementById('p-loc').value.trim();
  const d=document.getElementById('p-data').value, note=document.getElementById('p-note').value.trim();
  const coord=document.getElementById('p-coordonate').value, editId=document.getElementById('p-id-edit').value;
  if (!n||!ha) { showToast('Completați numele și suprafața.','error'); return; }
  setLoading('p-btn',true,'','Se salvează...');
  const payload = {user_id:currentUser.id,nume:n,suprafata_ha:ha,cultura:c,localitate:l||null,data_semanat:d||null,note:note||null,coordonate:coord||null};
  const { error } = editId ? await sb.from('parcele').update(payload).eq('id',editId) : await sb.from('parcele').insert([payload]);
  setLoading('p-btn',false,'ti-plus','Adaugă parcelă');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  showToast(editId?'Parcelă actualizată!':'Parcelă adăugată cu succes!','success');
  resetFormParcela();
  await loadParcele(); await loadRotatie(); updateDashboard();
}
function resetFormParcela() {
  document.getElementById('p-id-edit').value=''; document.getElementById('p-coordonate').value='';
  document.getElementById('form-parcela-titlu').innerHTML='<i class="ti ti-plus" style="color:var(--ai-green)"></i> Adaugă parcelă nouă';
  document.getElementById('p-btn').innerHTML='<i class="ti ti-plus"></i> Adaugă parcelă';
  ['p-nume','p-ha','p-loc','p-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
const pCultEl = document.getElementById('p-cultura');
if (pCultEl) pCultEl.value='';
  if (drawnItems) drawnItems.clearLayers();
}
function selecteazaSiIncarcaParcela(id) {
  const p = parceleData.find(x=>x.id===id); if (!p) return;
  document.getElementById('p-id-edit').value=p.id;
  document.getElementById('form-parcela-titlu').innerHTML='<i class="ti ti-edit" style="color:var(--wheat)"></i> Editare: '+escapeHTML(p.nume);
  document.getElementById('p-btn').innerHTML='<i class="ti ti-device-floppy"></i> Salvează Modificările';
  document.getElementById('p-nume').value=p.nume; document.getElementById('p-ha').value=p.suprafata_ha;
  const pCultEl2 = document.getElementById('p-cultura');
if (pCultEl2) pCultEl2.value=p.cultura||'';
 document.getElementById('p-loc').value=p.localitate||'';
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
  const cont = document.getElementById('cultura-bars'); if (!cont) return;
  const anFiltru = document.getElementById('cultura-filter-an')?.value;
  const counts = {};

  if (anFiltru) {
    // Din ani_agricoli manual introdusi
aniAgricoliData.filter(a => a.an_agricol && (a.an_agricol.startsWith(anFiltru+'-') || a.an_agricol.endsWith('-'+anFiltru))).forEach(a => {      if (a.cultura) counts[a.cultura] = (counts[a.cultura]||0) + (parseFloat(a.suprafata_ha)||0);
    });

    // Din recolte in acel an
    const dataStart = new Date(parseInt(anFiltru), 9, 1);
    const dataEnd = new Date(parseInt(anFiltru)+1, 8, 30);
    recolteData.filter(r => r.data_recolta && new Date(r.data_recolta) >= dataStart && new Date(r.data_recolta) <= dataEnd).forEach(r => {
      if (r.cultura) counts[r.cultura] = (counts[r.cultura]||0) + (parseFloat(r.suprafata_ha)||0);
    });

    // Din parcele cu data semanat in acel an
    parceleData.filter(p => p.data_semanat && new Date(p.data_semanat).getFullYear() === parseInt(anFiltru)).forEach(p => {
      if (p.cultura) counts[p.cultura] = (counts[p.cultura]||0) + (parseFloat(p.suprafata_ha)||0);
    });
  } else {
    parceleData.forEach(p => { if (p.cultura) counts[p.cultura] = (counts[p.cultura]||0) + (p.suprafata_ha||0); });
  }

  if (!Object.keys(counts).length) {
    cont.innerHTML='<div style="color:var(--gray-400);font-size:13px;text-align:center;padding:16px">Nicio distributie pentru acest an.</div>';
    return;
  }

  const totalHa = Object.values(counts).reduce((s,v) => s+v, 0);
  const culoriCulturi = {
    'Grâu':'#16a34a','Grau':'#16a34a','Orz':'#4ade80','Orzoaică':'#86efac','Orzoaica':'#86efac',
    'Triticale':'#059669','Secară':'#065f46','Secara':'#065f46','Porumb':'#eab308',
    'Floarea-soarelui':'#ef4444','Rapiță':'#2563eb','Rapita':'#2563eb','Soia':'#7c3aed',
    'Mazăre':'#06b6d4','Mazare':'#06b6d4','Fasole':'#0891b2','Sfeclă de zahăr':'#db2777',
    'Sfecla de zahar':'#db2777','Cartofi':'#d97706','Lucernă':'#0d9488','Lucerna':'#0d9488',
    'In pentru ulei':'#6366f1','Coriandru':'#f97316','Muștar':'#ca8a04','Mustar':'#ca8a04','Altele':'#94a3b8'
  };
  const culoriDefault = ['#16a34a','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2'];
const entries = Object.entries(counts).filter(([k,v]) => v > 0);
const labels = entries.map(e => e[0]);
const valori = entries.map(e => e[1]);
  const culori = labels.map((l,i) => culoriCulturi[l] || culoriDefault[i % culoriDefault.length]);

  cont.innerHTML='<canvas id="cultura-pie-chart" style="max-height:260px"></canvas>';
  if (window.culturaChart) { window.culturaChart.destroy(); window.culturaChart=null; }

  const ctx = document.getElementById('cultura-pie-chart').getContext('2d');
  window.culturaChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: valori, backgroundColor: culori, borderColor: 'rgba(255,255,255,0.5)', borderWidth: 1, hoverOffset: 20 }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position:'bottom', labels:{font:{family:'Plus Jakarta Sans',size:12},padding:14,usePointStyle:true} },
        tooltip: { callbacks: { label: function(ctx) { const pct=Math.round(ctx.parsed/totalHa*100); return ' '+ctx.label+': '+ctx.parsed.toFixed(1)+' ha ('+pct+'%)'; } } }
      },
      cutout: '60%'
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

/* ===== HARTA COMPLETĂ: culturi + indici de vegetație ===== */
// true = imagini SIMULATE, doar ca să testezi interfața. Pune false când există /api/indici (vezi mai jos).
const HARTA_INDICI_DEMO = false;
// false = în modurile NDVI/NDRE/NDMI parcelele nu au niciun contur propriu, se văd doar culorile stratului. true = contur alb subțire.
const HARTA_CONTUR_INDICI = true;

const CULORI_CULTURI = {
  'Grâu': '#16a34a', 'Orz': '#4ade80', 'Orzoaică': '#86efac', 'Triticale': '#059669', 'Secară': '#065f46',
  'Porumb': '#eab308', 'Floarea-soarelui': '#ef4444', 'Rapiță': '#2563eb', 'Soia': '#7c3aed',
  'Mazăre': '#06b6d4', 'Fasole': '#0891b2', 'Sfeclă de zahăr': '#db2777', 'Cartofi': '#d97706',
  'Lucernă': '#0d9488', 'In pentru ulei': '#6366f1', 'Coriandru': '#f97316', 'Muștar': '#ca8a04', 'Altele': '#94a3b8'
};
const CULORI_PARCELE = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

// Rampe de culoare cu luminozitate variabilă, ca să se distingă și la daltonism sau lumină puternică
const RAMPA_VEG = ['#5c3a1e', '#c47f2c', '#f0d84a', '#9bd35a', '#2e9e4a', '#0b5d2f'];
const RAMPA_APA = ['#8c510a', '#d8b365', '#f6e8c3', '#80cdc1', '#35978f', '#01665e'];
const RAMPA_RGB = ['#4a3a28', '#7a6240', '#a58f5c', '#7d8f4a', '#4f7a36', '#2f5a28'];
const INDICI = {
  ndvi: { nume: 'NDVI', sub: 'vigoarea vegetației', min: 0, max: 0.9, rampa: RAMPA_VEG },
  ndre: { nume: 'NDRE', sub: 'clorofilă / azot', min: 0, max: 0.6, rampa: RAMPA_VEG },
  ndmi: { nume: 'NDMI', sub: 'umiditatea vegetației', min: -0.2, max: 0.6, rampa: RAMPA_APA },
  rgb: { nume: 'Culoare naturală', sub: '', min: 0, max: 1, rampa: RAMPA_RGB }
};

let hartaStrat = 'culturi', hartaAn = null, hartaOverlays = [], hartaTokenIndici = 0, hartaCulturiLegenda = {}, hartaAttr = null;

/* ---------- utilitare ---------- */
function _isoLocal(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function _hash(s) { return [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7); }
function _hex(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
function culoareRampa(rampa, t) {
  t = Math.max(0, Math.min(1, t));
  const x = t * (rampa.length - 1), i = Math.min(Math.floor(x), rampa.length - 2), f = x - i, a = _hex(rampa[i]), b = _hex(rampa[i + 1]);
  return a.map((v, k) => Math.round(v + (b[k] - v) * f));
}
function latlngsParcela(p) { return JSON.parse(p.coordonate).map(c => [c.lat || c[0], c.lng || c[1]]); }
function sezonCurent() { const a = new Date(), s = a.getMonth() >= 9 ? a.getFullYear() : a.getFullYear() - 1; return s + '-' + (s + 1); }
function sezonActiv() { return (document.getElementById('harta-filter-an') || {}).value || sezonCurent(); }

function populeazaSezoaneHarta() {
  const sel = document.getElementById('harta-filter-an');
  if (!sel || sel.options.length > 1) return;
  sel.innerHTML = '<option value="">Cultura curentă</option>';
  const start = parseInt(sezonCurent());
  for (let a = start; a >= start - 5; a--) sel.add(new Option(a + '-' + (a + 1), a + '-' + (a + 1)));
}

/* ---------- surse de date pentru indici ----------
   Contract pentru backend (Pasul 2):
   GET /api/indici/date?sezon=2026-2027      -> ["2026-10-04", "2026-09-29", ...]  (cele mai noi primele, doar scene valide)
   GET /api/indici?parcela=ID&indice=ndvi&data=2026-10-04 -> { url: "https://.../ndvi.png", bounds: [[sud,vest],[nord,est]] } */
function sceneDemo(p, indice, data) {
  const I = INDICI[indice], ll = latlngsParcela(p);
  if (ll.length < 3) return null;
  const lats = ll.map(c => c[0]), lngs = ll.map(c => c[1]);
  const s = Math.min(...lats), n = Math.max(...lats), w = Math.min(...lngs), e = Math.max(...lngs);
  const W = 192, H = 192, seed = _hash(p.id) % 100;
  const d = new Date(data + 'T12:00'), doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const baza = 0.1 + 0.7 * Math.exp(-Math.pow((doy - 150) / 55, 2));
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
  const tc = tmp.getContext('2d'), img = tc.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / H;
    const nz = 0.5 * Math.sin(u * 6 + seed) * Math.cos(v * 5 + seed * 0.7) + 0.3 * Math.sin((u + v) * 11 + seed * 1.3) + 0.2 * Math.sin(u * 19 - v * 13 + seed);
    const c = culoareRampa(I.rampa, baza + 0.14 * nz), k = (y * W + x) * 4;
    img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
  }
  tc.putImageData(img, 0, 0);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); ctx.beginPath();
  ll.forEach(([la, lo], i) => { const x = (lo - w) / ((e - w) || 1) * W, y = (n - la) / ((n - s) || 1) * H; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.closePath(); ctx.clip(); ctx.drawImage(tmp, 0, 0);
  return { url: cv.toDataURL('image/png'), bounds: L.latLngBounds([[s, w], [n, e]]) };
}
function dateDemo(sezon) {
  const [a, b] = sezon.split('-').map(Number), azi = new Date(), out = [];
  for (let d = new Date(a, 9, 1); d <= new Date(b, 8, 30) && d <= azi; d.setDate(d.getDate() + 5)) out.push(_isoLocal(d));
  return out.reverse();
}
async function listaDateIndici(sezon) {
  return dateDemo(sezon);
}
async function incarcaScene(p, indice, data) {
  if (HARTA_INDICI_DEMO) return sceneDemo(p, indice, data);

  const ll = latlngsParcela(p);
  if (ll.length < 3) return null;

  // Calculăm Bounding Box-ul dreptunghiular
  const lats = ll.map(c => c[0]), lngs = ll.map(c => c[1]);
  const s = Math.min(...lats), n = Math.max(...lats), w = Math.min(...lngs), e = Math.max(...lngs);
  const bboxStr = `${w},${s},${e},${n}`;

  // Creăm poligonul GeoJSON exact (GeoJSON folosește ordinea [lng, lat])
  const geojsonPolygon = {
    type: "Polygon",
    coordinates: [
      [
        ...ll.map(c => [c[1], c[0]]),
        [ll[0][1], ll[0][0]] // Închidem poligonul cu primul punct
      ]
    ]
  };

  const indiceCode = String(indice).toLowerCase();

  const r = await fetch(`/api/copernicus?bbox=${encodeURIComponent(bboxStr)}&indice=${indiceCode}&data=${data}&geometry=${encodeURIComponent(JSON.stringify(geojsonPolygon))}`);
  if (!r.ok) return null;
  const j = await r.json();
  return j && j.url ? { url: j.url, bounds: L.latLngBounds(j.bounds) } : null;
}
/* ---------- harta ---------- */
function initMapFull() {
  if (leafletMapFull) { leafletMapFull.invalidateSize(); return; }
  populeazaSezoaneHarta();
  leafletMapFull = L.map('map-full', { zoomControl: true, attributionControl: false, tap: true, tapTolerance: 15 }).setView([45.9432, 24.9668], 7);
  hartaAttr = L.control.attribution({ prefix: false }).addTo(leafletMapFull);
  const baze = {
    'Satelit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxNativeZoom: 18, maxZoom: 20, attribution: 'Imagini © Esri, Maxar, Earthstar Geographics' }),
    'Hartă stradală': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxNativeZoom: 19, maxZoom: 20, attribution: '© OpenStreetMap' })
  };
  baze['Satelit'].addTo(leafletMapFull);
  L.control.layers(baze, null, { position: 'topright' }).addTo(leafletMapFull);
  leafletMapFull.createPane('indici').style.zIndex = 350;   // sub conturul parcelelor
  reincarcaParcelePeHartaFull();
}

function reincarcaParcelePeHartaFull(anFiltru) {
  if (!leafletMapFull) return;
  hartaAn = anFiltru || null;
  (leafletMapFull._customLayers || []).forEach(l => leafletMapFull.removeLayer(l));
  leafletMapFull._customLayers = [];
  hartaCulturiLegenda = {};
  const modIndici = hartaStrat !== 'culturi', bounds = [];

  parceleData.forEach((p, index) => {
    if (!p.coordonate) return;
    try {
      const coords = JSON.parse(p.coordonate);
      if (!coords.length) return;
      const latlngs = coords.map(c => [c.lat || c[0], c.lng || c[1]]);
      let cultura = p.cultura;
      if (anFiltru) {
        const parti = anFiltru.split('-'), anStart = new Date(parseInt(parti[0]), 9, 1), anEnd = new Date(parseInt(parti[1]), 8, 30);
        const anInfo = aniAgricoliData.find(a => a.parcela_id === p.id && a.an_agricol === anFiltru);
        const recolta = recolteData.find(r => r.parcela_id === p.id && new Date(r.data_recolta) >= anStart && new Date(r.data_recolta) <= anEnd);
        if (anInfo) cultura = anInfo.cultura;
        else if (recolta) cultura = recolta.cultura;
        else if (p.data_semanat && new Date(p.data_semanat) >= anStart && new Date(p.data_semanat) <= anEnd) cultura = p.cultura;
        else cultura = null;
      }
      const culoare = cultura ? (CULORI_CULTURI[cultura] || CULORI_PARCELE[index % CULORI_PARCELE.length]) : '#94a3b8';
      if (cultura) hartaCulturiLegenda[cultura] = culoare;

      const poly = L.polygon(latlngs, { stroke: !modIndici || HARTA_CONTUR_INDICI, color: modIndici ? '#ffffff' : culoare, weight: modIndici ? 1.5 : 2.5, fillColor: culoare, fillOpacity: modIndici ? 0 : 0.35 }).addTo(leafletMapFull);
      poly.on('click', () => arataDetaliiParcelaHarta(p.id));
      poly.bindTooltip('<b>' + escapeHTML(p.nume) + '</b><br>' + escapeHTML(cultura || 'Necultivat') + ' · ' + p.suprafata_ha + ' ha', { sticky: true, className: 'parcela-tooltip' });
      leafletMapFull._customLayers.push(poly);
      bounds.push(...latlngs);
    } catch (e) { console.error('Eroare parcela', p.nume, e); }
  });

  if (bounds.length && !leafletMapFull._fitFacut) { leafletMapFull.fitBounds(bounds, { padding: [30, 30] }); leafletMapFull._fitFacut = true; }
  deseneazaLegenda();
let chartInstance = null;

async function genereazaGraficSezon(parcela) {
  // 1. Obținem coordonatele centrului parcelei
  const ll = latlngsParcela(parcela);
  const latMediu = ll.reduce((sum, c) => sum + c[0], 0) / ll.length;
  const lngMediu = ll.reduce((sum, c) => sum + c[1], 0) / ll.length;

  // Setăm intervalul sezonului curent (ex: 1 Februarie -> Prezent)
  const anCurent = new Date().getFullYear();
  const startDate = `${anCurent}-02-01`;
  const endDate = new Date().toISOString().split('T')[0];

  // 2. Extragerea datelor (NDVI, Meteo, Calendar Lucrări)
  // a) Lucrările din calendarul parcelei (stocate local sau în DB)
  const lucrari = parcela.lucrari || [
    { data: `${anCurent}-03-15`, titlu: 'Semănat' },
    { data: `${anCurent}-04-10`, titlu: 'Fertilizare N1' },
    { data: `${anCurent}-05-02`, titlu: 'Erbicidare' }
  ];

  // b) Preluăm precipitațiile din API-ul nostru
  const resMeteo = await fetch(`/api/meteo?lat=${latMediu}&lng=${lngMediu}&startDate=${startDate}&endDate=${endDate}`);
  const dateMeteo = resMeteo.ok ? await resMeteo.json() : [];

  // c) Preluăm/generăm valorile NDVI istorice ale parcelei
  // (Puteți folosi valorile din istoricul salvat al parcelei)
  const dateNDVI = parcela.istoricNDVI || [
    { data: `${anCurent}-02-15`, ndvi: 0.18 },
    { data: `${anCurent}-03-01`, ndvi: 0.22 },
    { data: `${anCurent}-03-20`, ndvi: 0.35 },
    { data: `${anCurent}-04-05`, ndvi: 0.52 },
    { data: `${anCurent}-04-20`, ndvi: 0.68 },
    { data: `${anCurent}-05-05`, ndvi: 0.74 }
  ];

  // 3. Aliniem etichetele de pe axa X (Toate zilele din interval)
  const eticheteZile = dateMeteo.map(m => m.data);

  // Potrivim NDVI pe axa X
  const ndviMap = new Map(dateNDVI.map(i => [i.data, i.ndvi]));
  const dateNDVIAliniate = eticheteZile.map(d => ndviMap.get(d) || null);

  // Potrivim Precipitațiile pe axa X
  const precipitatiiAliniate = dateMeteo.map(m => m.precipitatii);

  // 4. Generăm adnotările pentru lucrările agricole (Linii verticale)
  const adnotariLucrari = {};
  lucrari.forEach((lucrare, index) => {
    if (eticheteZile.includes(lucrare.data)) {
      adnotariLucrari[`line${index}`] = {
        type: 'line',
        xMin: lucrare.data,
        xMax: lucrare.data,
        borderColor: '#e74c3c',
        borderWidth: 2,
        borderDash: [4, 4],
        label: {
          display: true,
          content: lucrare.titlu,
          position: 'start',
          backgroundColor: '#e74c3c',
          color: '#fff',
          font: { size: 10 }
        }
      };
    }
  });

  // 5. Randare Chart.js
  const ctx = document.getElementById('chartNDVI').getContext('2d');
  
  if (chartInstance) chartInstance.destroy(); // Resetează graficul vechi

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: eticheteZile,
      datasets: [
        {
          type: 'line',
          label: 'Evoluție NDVI',
          data: dateNDVIAliniate,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          borderWidth: 3,
          spanGaps: true, // Unește punctele între zilele fără trecere de satelit
          yAxisID: 'yNDVI',
          tension: 0.3
        },
        {
          type: 'bar',
          label: 'Precipitații (mm)',
          data: precipitatiiAliniate,
          backgroundColor: 'rgba(52, 152, 219, 0.5)',
          yAxisID: 'yMeteo'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { display: false } },
        yNDVI: {
          type: 'linear',
          position: 'left',
          min: 0,
          max: 1,
          title: { display: true, text: 'Indice NDVI' }
        },
        yMeteo: {
          type: 'linear',
          position: 'right',
          min: 0,
          suggestedMax: 30,
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Precipitații (mm)' }
        }
      },
      plugins: {
        annotation: { annotations: adnotariLucrari }
      }
    }
  });

  document.getElementById('modal-grafic').style.display = 'block';
}

function inchideModalGrafic() {
  document.getElementById('modal-grafic').style.display = 'none';
}
}

/* ---------- controale ---------- */
async function populeazaDateHarta() {
  const sel = document.getElementById('harta-data'); if (!sel) return;
  const date = await listaDateIndici(sezonActiv());
  sel.innerHTML = date.length
    ? date.map(d => '<option value="' + d + '">' + new Date(d + 'T12:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }) + '</option>').join('')
    : '<option value="">Nicio imagine disponibilă</option>';
}
async function filtreazaHartaAn() {
  const an = document.getElementById('harta-filter-an')?.value;
  reincarcaParcelePeHartaFull(an || null);
  if (hartaStrat !== 'culturi') { await populeazaDateHarta(); await afiseazaStratIndice(); }
}
async function schimbaStratHarta() {
  hartaStrat = document.getElementById('harta-strat').value;
  const ind = hartaStrat !== 'culturi';
  document.getElementById('harta-data-wrap').style.display = ind ? '' : 'none';
  if (ind) await populeazaDateHarta();
  reincarcaParcelePeHartaFull(hartaAn);
  await afiseazaStratIndice();
}
function schimbaDataHarta() { afiseazaStratIndice(); }

// Scoate culoarea și conturul parcelelor în modurile cu indici (rămân doar culorile stratului; parcelele rămân clicabile)
function stilParceleIndici() {
  if (hartaStrat === 'culturi' || !leafletMapFull) return;
  (leafletMapFull._customLayers || []).forEach(l => l.setStyle && l.setStyle({ stroke: HARTA_CONTUR_INDICI, color: '#ffffff', weight: 1.5, fillOpacity: 0 }));
}

async function afiseazaStratIndice() {
  if (!leafletMapFull) return;
  const token = ++hartaTokenIndici, info = document.getElementById('harta-info');
  hartaOverlays.forEach(l => leafletMapFull.removeLayer(l)); hartaOverlays = [];
  stilParceleIndici();
  if (hartaAttr) hartaAttr.removeAttribution('Contains modified Copernicus Sentinel data');
  if (hartaStrat === 'culturi') { if (info) info.textContent = ''; return; }
  const data = document.getElementById('harta-data')?.value;
  if (!data) { if (info) info.textContent = 'Nu există imagini disponibile pentru acest sezon.'; return; }
  if (info) info.textContent = 'Se încarcă imaginile…';
  const rez = await Promise.all(parceleData.filter(p => p.coordonate).map(p => incarcaScene(p, hartaStrat, data).catch(() => null)));
  if (token !== hartaTokenIndici) return;                      // utilizatorul a schimbat între timp
  rez.forEach(sc => { if (sc) hartaOverlays.push(L.imageOverlay(sc.url, sc.bounds, { pane: 'indici', interactive: false }).addTo(leafletMapFull)); });
  if (!hartaOverlays.length) { if (info) info.textContent = 'Nu s-au putut încărca imaginile.'; return; }
  if (!HARTA_INDICI_DEMO && hartaAttr) hartaAttr.addAttribution('Contains modified Copernicus Sentinel data');
  const dataTxt = new Date(data + 'T12:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
  if (info) info.innerHTML = INDICI[hartaStrat].nume + ' · imagine din ' + dataTxt +
    (HARTA_INDICI_DEMO ? ' · <span style="color:var(--danger);font-weight:800">DATE SIMULATE, doar pentru test</span>' : '');
}

function deseneazaLegenda() {
  const el = document.getElementById('harta-legenda'); if (!el) return;
  let h = '';
  if (hartaStrat === 'culturi') {
    const k = Object.keys(hartaCulturiLegenda);
    if (!k.length) { el.style.display = 'none'; return; }
    h = '<div style="font-weight:800;margin-bottom:6px">Culturi</div>' + k.map(c =>
      '<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="width:14px;height:14px;border-radius:4px;flex:none;background:' + hartaCulturiLegenda[c] + '"></span>' + escapeHTML(c) + '</div>').join('');
  } else if (hartaStrat === 'rgb') { el.style.display = 'none'; return; }
  else {
    const I = INDICI[hartaStrat];
    h = '<div style="font-weight:800">' + I.nume + '</div><div style="font-size:12.5px;color:var(--gray-500);margin-bottom:8px">' + I.sub + '</div>'
      + '<div style="height:12px;border-radius:6px;background:linear-gradient(90deg,' + I.rampa.join(',') + ')"></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;margin-top:4px"><span>' + I.min + '</span><span>' + I.max + '</span></div>'
      + (HARTA_INDICI_DEMO ? '<div style="margin-top:8px;font-size:12px;font-weight:800;color:var(--danger)">DATE SIMULATE</div>' : '');
  }
  el.innerHTML = h; el.style.display = 'block';
}

/* ---------- restul funcțiilor hărții (neschimbate, cu o singură corecție în vizualizeazaParcela) ---------- */
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
      poly.bindTooltip(escapeHTML(p.nume)+' ('+p.suprafata_ha+' ha)',{permanent:false});
      poly.addTo(leafletMap);
    } catch(e){}
  });
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
      showToast('Parcela nu are coordonate salvate. Desenati conturul pe harta.', 'info');
      return;
    }
    try {
      if (drawnItems) drawnItems.clearLayers();
      const latlngs = JSON.parse(p.coordonate);
      const polygon = L.polygon(latlngs, {
        color: '#4a7c2f',
        fillColor: '#4a7c2f',
        fillOpacity: 0.4
      }).addTo(drawnItems);
leafletMap.fitBounds(polygon.getBounds());
      polygon.bindTooltip('<b>'+escapeHTML(p.nume)+'</b><br>'+escapeHTML(p.cultura||'Necultivat')+' · '+p.suprafata_ha+' ha', {sticky:true, className:'parcela-tooltip'});
      polygon.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        window.parcelaSelectata = p;
        arataDetaliiParcelaHarta(p.id);
        if (typeof genereazaGraficSezon === 'function') {
          genereazaGraficSezon(p);
        }
      });
    }
    catch(e) { console.error('Eroare parcela', p.nume, e); }
  }, 300);
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
let lucrariPaginaCurenta = 1;
let lucrariListaCurenta = [];
const LUCRARI_PER_PAGINA = 10;

function renderTabelLucrari(filter) {
  const tbody=document.getElementById('tabel-lucrari'); if (!tbody) return;
  let list=lucrariData;
  const fp=document.getElementById('luc-filter-parcela')?.value;
  const ft=document.getElementById('luc-filter-tip')?.value;
  if (fp) list=list.filter(l=>l.parcela_id===fp||l.parcela_nume===fp);
  if (ft) list=list.filter(l=>l.tip_lucrare===ft);
  lucrariListaCurenta = list;

  const totalPagini = Math.ceil(list.length / LUCRARI_PER_PAGINA);
  if (lucrariPaginaCurenta > totalPagini) lucrariPaginaCurenta = 1;
  const start = (lucrariPaginaCurenta - 1) * LUCRARI_PER_PAGINA;
  const pagina = list.slice(start, start + LUCRARI_PER_PAGINA);

  if (!list.length) { tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray-400)">Nicio lucrare.</td></tr>'; renderPaginariLucrari(0); return; }
  
  const statusColors={finalizat:'badge-green',in_progres:'badge-blue',planificat:'badge-wheat'};
  const statusLabels={finalizat:'Finalizat',in_progres:'In progres',planificat:'Planificat'};
  tbody.innerHTML=pagina.map(l=>{
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
      +'<button class="btn btn-ghost btn-sm" onclick="editeazaLucrare(\''+l.id+'\')" style="width:auto;padding:5px 10px"><i class="ti ti-edit"></i></button>'
      +'<button class="btn btn-danger btn-sm" onclick="stergeLucrare(\''+l.id+'\')" style="width:auto;padding:5px 10px"><i class="ti ti-trash"></i></button>'
      +'</div>'
      +'</td>'
      +'</tr>';
  }).join('');

  renderPaginariLucrari(totalPagini);
}

function renderPaginariLucrari(totalPagini) {
  let cont = document.getElementById('lucrari-paginare');
  if (!cont) {
    const tabel = document.getElementById('tabel-lucrari')?.closest('table');
    if (!tabel) return;
    cont = document.createElement('div');
    cont.id = 'lucrari-paginare';
    cont.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:6px;margin-top:14px;flex-wrap:wrap';
    tabel.parentElement.appendChild(cont);
  }
  if (totalPagini <= 1) { cont.innerHTML = ''; return; }

  const btnStyle = (activ) => 'width:36px;height:36px;border-radius:8px;border:1.5px solid '+(activ?'var(--ai-green)':'var(--gray-200)')+';background:'+(activ?'var(--ai-green)':'var(--white)')+';color:'+(activ?'#fff':'var(--soil)')+';font-weight:700;font-size:13px;cursor:pointer';
  const dotStyle = 'width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;color:var(--gray-400);font-size:14px';

  const pagini = [];
  if (totalPagini <= 7) {
    for (let i = 1; i <= totalPagini; i++) pagini.push(i);
  } else {
    pagini.push(1);
    if (lucrariPaginaCurenta > 3) pagini.push('...');
    for (let i = Math.max(2, lucrariPaginaCurenta-1); i <= Math.min(totalPagini-1, lucrariPaginaCurenta+1); i++) pagini.push(i);
    if (lucrariPaginaCurenta < totalPagini-2) pagini.push('...');
    pagini.push(totalPagini);
  }

  let html = '';
  pagini.forEach(p => {
    if (p === '...') {
      html += '<span style="'+dotStyle+'">…</span>';
    } else {
      const activ = p === lucrariPaginaCurenta;
      html += '<button onclick="schimbaPaginaLucrari('+p+')" style="'+btnStyle(activ)+'">'+p+'</button>';
    }
  });
  cont.innerHTML = html;
}

function schimbaPaginaLucrari(pagina) {
  lucrariPaginaCurenta = pagina;
  renderTabelLucrari(null, lucrariListaCurenta);
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
function autocompletezaSuprafataCal() {
  const sel = document.getElementById('cal-parcela');
  if (!sel.value) return;
  const parcela = parceleData.find(p => p.id === sel.value);
  if (!parcela) return;
  const supEl = document.getElementById('cal-suprafata');
  if (supEl) supEl.value = parcela.suprafata_ha;
  calcCalProductie();
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
  const editId = document.getElementById('rec-id-edit')?.value;
  const parcelaId=document.getElementById('rec-parcela').value;
  const parcelaOpt=document.getElementById('rec-parcela');
  const parcelaNume=parcelaOpt.options[parcelaOpt.selectedIndex]?.text||'';
  const cant=parseFloat(document.getElementById('rec-cantitate').value)||0;
  const sup=parseFloat(document.getElementById('rec-suprafata').value)||0;
  if (!cant||!sup) { showToast('Completați cantitatea și suprafața.','error'); return; }
  setLoading('rec-btn',true,'','Se salvează...');

  const pretVanzare = parseFloat(document.getElementById('rec-pret').value)||0;
  const venitTotal = pretVanzare > 0 ? pretVanzare * cant : 0;
  const cultura = document.getElementById('rec-cultura').value;
  const sezon = document.getElementById('rec-sezon').value;
  const dataRecolta = document.getElementById('rec-data').value||null;

  const payload = {
    user_id:currentUser.id, parcela_id:parcelaId||null, parcela_nume:parcelaNume,
    cultura, sezon, cantitate_tone:cant, suprafata_ha:sup,
    pret_vanzare_ron_tona:pretVanzare||null,
    calitate:document.getElementById('rec-calitate').value,
    cumparator:document.getElementById('rec-cumparator').value.trim()||null,
    data_recolta:dataRecolta,
    observatii:document.getElementById('rec-obs').value.trim()||null,
venit_total:venitTotal > 0 ? venitTotal : null
  };

  const { error } = editId
    ? await sb.from('recolte').update(payload).eq('id',editId)
    : await sb.from('recolte').insert([payload]);

  setLoading('rec-btn',false,'ti-plus','Salvează recoltă');
  if (error) { showToast('Eroare: '+error.message,'error'); return; }

  // Actualizam venitul in contabilitate
  if (pretVanzare > 0 && cant > 0) {
    const descriere = 'Vanzare '+cultura+' sezon '+sezon+' · '+cant+' t x '+pretVanzare+' RON/t';
    const dataChelt = dataRecolta || new Date().toISOString().split('T')[0];

    if (editId) {
      // Actualizam inregistrarea existenta din contabilitate
      const { data: cheltuieliExistente } = await sb.from('cheltuieli')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('tip', 'venit')
        .eq('categorie', 'Vanzare Recolta')
        .ilike('descriere', '%'+sezon+'%')
        .ilike('descriere', '%'+cultura+'%');

      if (cheltuieliExistente && cheltuieliExistente.length > 0) {
        await sb.from('cheltuieli').update({
          suma: venitTotal,
          descriere,
          data: dataChelt,
          parcela: parcelaNume
        }).eq('id', cheltuieliExistente[0].id);
      } else {
        await sb.from('cheltuieli').insert([{
          user_id:currentUser.id, tip:'venit', categorie:'Vanzare Recolta',
          parcela:parcelaNume, suma:venitTotal, data:dataChelt, descriere
        }]);
      }
    } else {
      await sb.from('cheltuieli').insert([{
        user_id:currentUser.id, tip:'venit', categorie:'Vanzare Recolta',
        parcela:parcelaNume, suma:venitTotal, data:dataChelt, descriere
      }]);
    }
    await loadCheltuieli();
  }

  showToast(editId?'Recoltă actualizată!':'Recoltă salvată!','success');
  ['rec-cantitate','rec-suprafata','rec-pret','rec-cumparator','rec-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const recIdEl = document.getElementById('rec-id-edit');
  if (recIdEl) recIdEl.value = '';
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

  const recIdEl = document.getElementById('rec-id-edit');
  if (recIdEl) recIdEl.value = id;

  const recSel = document.getElementById('rec-parcela');
  if (recSel) recSel.value = r.parcela_id || '';
  document.getElementById('rec-cultura').value = r.cultura || '';
  document.getElementById('rec-sezon').value = r.sezon || '';
  document.getElementById('rec-data').value = r.data_recolta || '';
  document.getElementById('rec-suprafata').value = r.suprafata_ha || '';
  document.getElementById('rec-cantitate').value = r.cantitate_tone || '';

  const randInput = document.getElementById('rec-randament-input');
  if (randInput && r.suprafata_ha > 0) {
    randInput.value = (r.cantitate_tone / r.suprafata_ha).toFixed(2);
  }

  document.getElementById('rec-pret').value = r.pret_vanzare_ron_tona || '';
  document.getElementById('rec-calitate').value = r.calitate || 'Standard';
  document.getElementById('rec-cumparator').value = r.cumparator || '';
  document.getElementById('rec-obs').value = r.observatii || '';

  const btn = document.getElementById('rec-btn');
  btn.innerHTML = '<i class="ti ti-device-floppy"></i> Actualizează recolta';
  btn.onclick = salveazaRecolta;

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
let cheltuieliPaginaCurenta = 1;
const CHELTUIELI_PER_PAGINA = 10;


function renderTabelCheltuieli(filter, customList) {
  const tbody = document.getElementById('tabel-cheltuieli'); if (!tbody) return;
  let list = customList || (filter ? cheltuieliData.filter(c=>c.categorie===filter) : cheltuieliData);
  cheltuieliListaCurenta = list;
  
  const total = list.length;
  const totalPagini = Math.ceil(total / CHELTUIELI_PER_PAGINA);
  if (cheltuieliPaginaCurenta > totalPagini) cheltuieliPaginaCurenta = 1;
  
  const start = (cheltuieliPaginaCurenta - 1) * CHELTUIELI_PER_PAGINA;
  const pagina = list.slice(start, start + CHELTUIELI_PER_PAGINA);

  if (!list.length) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">Nicio inregistrare.</td></tr>'; renderPaginare(0); return; }
  
  tbody.innerHTML = pagina.map(c=>{
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

  renderPaginare(totalPagini);
}

function renderPaginare(totalPagini) {
  let cont = document.getElementById('cheltuieli-paginare');
  if (!cont) {
    const tabel = document.getElementById('tabel-cheltuieli')?.closest('table');
    if (!tabel) return;
    cont = document.createElement('div');
    cont.id = 'cheltuieli-paginare';
    cont.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:6px;margin-top:14px;flex-wrap:wrap';
    tabel.parentElement.appendChild(cont);
  }
  if (totalPagini <= 1) { cont.innerHTML = ''; return; }

let html = '';
const btnStyle = (activ) => 'width:36px;height:36px;border-radius:8px;border:1.5px solid '+(activ?'var(--ai-green)':'var(--gray-200)')+';background:'+(activ?'var(--ai-green)':'var(--white)')+';color:'+(activ?'#fff':'var(--soil)')+';font-weight:700;font-size:13px;cursor:pointer';
const dotStyle = 'width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;color:var(--gray-400);font-size:14px';

const pagini = [];
if (totalPagini <= 7) {
  for (let i = 1; i <= totalPagini; i++) pagini.push(i);
} else {
  pagini.push(1);
  if (cheltuieliPaginaCurenta > 3) pagini.push('...');
  for (let i = Math.max(2, cheltuieliPaginaCurenta-1); i <= Math.min(totalPagini-1, cheltuieliPaginaCurenta+1); i++) pagini.push(i);
  if (cheltuieliPaginaCurenta < totalPagini-2) pagini.push('...');
  pagini.push(totalPagini);
}

pagini.forEach(p => {
  if (p === '...') {
    html += '<span style="'+dotStyle+'">…</span>';
  } else {
    const activ = p === cheltuieliPaginaCurenta;
    html += '<button onclick="schimbaPaginaCheltuieli('+p+')" style="'+btnStyle(activ)+'">'+p+'</button>';
  }
});  cont.innerHTML = html;
}

function schimbaPaginaCheltuieli(pagina) {
  cheltuieliPaginaCurenta = pagina;
  renderTabelCheltuieli(null, cheltuieliListaCurenta);
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
  function modalConfirmare(titlu, mesaj) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = '<div style="background:var(--white);border-radius:20px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,0.3);padding:32px">'
      +'<div style="font-family:\'Lora\',serif;font-size:18px;font-weight:700;color:var(--soil);margin-bottom:12px">'+titlu+'</div>'
      +'<div style="font-size:14px;color:var(--gray-600);line-height:1.6;margin-bottom:24px">'+mesaj+'</div>'
      +'<div style="display:flex;gap:10px">'
      +'<button id="modal-confirmare-nu" class="btn btn-ghost" style="flex:1">Anuleaza</button>'
      +'<button id="modal-confirmare-da" class="btn btn-danger" style="flex:1"><i class="ti ti-trash"></i> Sterge</button>'
      +'</div></div>';
    document.body.appendChild(modal);
    modal.querySelector('#modal-confirmare-da').onclick = () => { modal.remove(); resolve(true); };
    modal.querySelector('#modal-confirmare-nu').onclick = () => { modal.remove(); resolve(false); };
  });
}

async function stergeCheltuiala(id) {
  const inreg = cheltuieliData.find(c => c.id === id);
  if (inreg && inreg.tip === 'venit' && inreg.categorie === 'Vanzare Recolta') {
    const confirmat = await modalConfirmare(
      'Sterge venit din recoltă',
      'Acest venit provine dintr-o recoltă înregistrată. Doriți să ștergeți doar înregistrarea contabilă?'
    );
    if (!confirmat) return;
  }
  showLoading(true);
  await sb.from('cheltuieli').delete().eq('id',id).eq('user_id',currentUser.id);
  showLoading(false);
  showToast('Inregistrare stearsa.','info');
  const { data,error } = await sb.from('cheltuieli').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
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
  const per = parseInt(document.getElementById('filter-perioada')?.value || '', 10);
  let list = cheltuieliTipFilter ? cheltuieliData.filter(c => c.tip === cheltuieliTipFilter) : cheltuieliData;
  if (f) list = list.filter(c => c.categorie === f);
  if (fp) {
    const parcelaGasita = parceleData.find(p => p.id === fp);
    const numeParc = parcelaGasita ? parcelaGasita.nume : fp;
    list = list.filter(c => c.parcela === numeParc);
  }
  if (per) {
    const lim = new Date(); lim.setHours(0, 0, 0, 0); lim.setDate(lim.getDate() - per);
    const dataDin = v => {
      const s = String(v || '');
      let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
      m = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/); if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      const d = new Date(s); return isNaN(d) ? null : d;
    };
    list = list.filter(c => { const d = dataDin(c.data); return d && d >= lim; });
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
  const pestPerHa=parseFloat(document.getElementById('pest-val').value)||0;
  const alt=parseFloat(document.getElementById('alt-val').value)||0;
  const samCant=parseFloat(document.getElementById('sam-cantitate').value)||0;
  const samPret=parseFloat(document.getElementById('sam-pret').value)||0;
  const ingrCant=parseFloat(document.getElementById('ingr-cantitate').value)||0;
  const ingrPret=parseFloat(document.getElementById('ingr-pret').value)||0;
  const motL=parseFloat(document.getElementById('mot-l').value)||0;
  const motPret=parseFloat(document.getElementById('mot-pret').value)||0;

  const calcParcelaOpt=document.getElementById('calc-parcela');
  const parcela=calcParcelaOpt.options[calcParcelaOpt.selectedIndex]?.text||'Toate parcelele';
  const today=new Date().toISOString().split('T')[0];
  const rows=[];

  const costSam=sup*samCant*samPret;
  const costIngr=sup*(ingrCant/1000)*ingrPret;
  const costMot=sup*motL*motPret;
  const pest=pestPerHa*sup;

  if (costSam>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Seminte / Material Sadit',parcela,suma:costSam,data:today,descriere:'Seminte: '+sup+' ha'});
  if (costIngr>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Ingrasaminte',parcela,suma:costIngr,data:today,descriere:'Ingrasaminte: '+ingrCant+' kg/ha x '+sup+' ha'});
  if (costMot>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Combustibil',parcela,suma:costMot,data:today,descriere:'Motorina: '+sup+' ha'});
  if (pest>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Tratamente fitosanitare',parcela,suma:pest,data:today,descriere:'Pesticide: '+pestPerHa+' RON/ha x '+sup+' ha'});
  if (alt>0) rows.push({user_id:currentUser.id,tip:'cheltuiala',categorie:'Altele',parcela,suma:alt,data:today,descriere:'Alte cheltuieli'});

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
/* ===== CONTABILITATE: print curat + export Excel =====
/* ---------- citirea datelor (lista completă, nu doar pagina afișată) ---------- */
function _escC(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function _dataDinText(t) {
  let m = String(t).match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], 12);
  m = String(t).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null;
}
function _randuriContabilitate() {
  // cheltuieliListaCurenta = lista filtrată și sortată, înainte de împărțirea pe pagini (setată de renderTabelCheltuieli)
  return (typeof cheltuieliListaCurenta !== 'undefined' ? cheltuieliListaCurenta : []).map(c => ({
    data: typeof fmtData === 'function' ? fmtData(c.data) : String(c.data || ''),
    dataObj: _dataDinText(String(c.data || '')),
    categorie: c.categorie || '',
    parcela: c.parcela || '-',
    descriere: c.descriere || '-',
    suma: Math.abs(parseFloat(c.suma) || 0),
    tip: c.tip === 'venit' ? 'venit' : 'cheltuiala'
  }));
}
function _totaluriContabilitate(rows) {
  const venituri = rows.filter(r => r.tip === 'venit').reduce((s, r) => s + r.suma, 0);
  const cheltuieli = rows.filter(r => r.tip !== 'venit').reduce((s, r) => s + r.suma, 0);
  return { venituri, cheltuieli, profit: venituri - cheltuieli };
}
function _filtreContabilitate() {
  const sel = id => { const e = document.getElementById(id); return e && e.value ? e.options[e.selectedIndex].text : ''; };
  const t = typeof cheltuieliTipFilter !== 'undefined' ? cheltuieliTipFilter : '';
  const tip = t === 'cheltuiala' ? 'Doar cheltuieli' : t === 'venit' ? 'Doar venituri' : 'Venituri și cheltuieli';
  return [tip, sel('filter-parcela-chelt'), sel('filter-cat'), sel('filter-perioada')].filter(Boolean).join(' · ');
}
const _ron = n => n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' RON';

/* ---------- print: doar raportul, nu toată pagina ---------- */
function printContabilitate() {
  const rows = _randuriContabilitate();
  if (!rows.length) { showToast('Nu există înregistrări de printat.', 'info'); return; }
  const T = _totaluriContabilitate(rows), azi = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
  const tr = rows.map(r => '<tr><td>' + _escC(r.data) + '</td><td>' + (r.tip === 'venit' ? 'Venit' : 'Cheltuială') + '</td><td>' + _escC(r.categorie) + '</td><td>' + _escC(r.parcela) + '</td><td>' + _escC(r.descriere)
    + '</td><td class="n ' + (r.tip === 'venit' ? 'v' : 'c') + '">' + (r.tip === 'venit' ? '+' : '−') + _ron(r.suma) + '</td></tr>').join('');
  const html = '<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Raport financiar</title><style>'
    + '@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:11.5px;margin:0}'
    + 'h1{font-size:20px;margin:0 0 2px}.m{color:#555;margin-bottom:14px}.s{display:flex;gap:10px;margin-bottom:16px}'
    + '.b{flex:1;border:1.5px solid #bbb;border-radius:6px;padding:10px 12px}.b small{display:block;color:#555;font-size:11px}.b strong{font-size:16px}'
    + '.v{color:#0a6b30}.c{color:#b42318}table{width:100%;border-collapse:collapse}th{text-align:left;border-bottom:2px solid #111;padding:6px 6px;font-size:11px}'
    + 'td{border-bottom:1px solid #ddd;padding:6px}tr{page-break-inside:avoid}thead{display:table-header-group}.n{text-align:right;white-space:nowrap;font-weight:700}'
    + '.t td{border-top:2px solid #111;border-bottom:none;font-weight:700}</style></head><body>'
    + '<h1>Raport financiar · AIgriculture</h1><div class="m">Generat la ' + azi + (_filtreContabilitate() ? ' · Filtre: ' + _escC(_filtreContabilitate()) : '') + '</div>'
    + '<div class="s"><div class="b"><small>Total venituri</small><strong class="v">' + _ron(T.venituri) + '</strong></div>'
    + '<div class="b"><small>Total cheltuieli</small><strong class="c">' + _ron(T.cheltuieli) + '</strong></div>'
    + '<div class="b"><small>Profit</small><strong class="' + (T.profit >= 0 ? 'v' : 'c') + '">' + _ron(T.profit) + '</strong></div></div>'
    + '<table><thead><tr><th>Data</th><th>Tip</th><th>Categorie</th><th>Parcela</th><th>Descriere</th><th class="n">Sumă</th></tr></thead><tbody>' + tr
    + '<tr class="t"><td colspan="5">Profit (venituri − cheltuieli)</td><td class="n ' + (T.profit >= 0 ? 'v' : 'c') + '">' + _ron(T.profit) + '</td></tr></tbody></table></body></html>';
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);
  const d = f.contentWindow.document; d.open(); d.write(html); d.close();
  setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1500); }, 300);
}
function exportaPDF() { printContabilitate(); }          // păstrează compatibilitatea cu butonul vechi (în print poți alege „Salvează ca PDF”)

/* ---------- export Excel (.xlsx), cu rezervă CSV ---------- */
function _incarcaXLSX() {
  if (window.XLSX) return Promise.resolve(true);
  return new Promise(res => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => res(true); s.onerror = () => res(false);
    document.head.appendChild(s);
  });
}
function _descarcaFisier(blob, nume) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nume;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function exportaExcel() {
  const rows = _randuriContabilitate();
  if (!rows.length) { showToast('Nu există înregistrări de exportat.', 'info'); return; }
  const T = _totaluriContabilitate(rows), n = rows.length, nume = 'contabilitate_AIgriculture_' + new Date().toISOString().slice(0, 10);
  const ok = await _incarcaXLSX();

  if (!ok) {                                                     // rezervă: CSV pe care Excel îl deschide direct
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"', num = v => v == null ? '' : String(v).replace('.', ',');
    const csv = ['Data;Tip;Categorie;Parcela;Descriere;Venit (RON);Cheltuiala (RON)'].concat(rows.map(r =>
      [q(r.data), r.tip === 'venit' ? 'Venit' : 'Cheltuiala', q(r.categorie), q(r.parcela), q(r.descriere), r.tip === 'venit' ? num(r.suma) : '', r.tip === 'venit' ? '' : num(r.suma)].join(';')))
      .concat(['', 'Total venituri;;;;;' + num(T.venituri), 'Total cheltuieli;;;;;;' + num(T.cheltuieli), 'Profit;;;;;' + num(T.profit)]).join('\r\n');
    _descarcaFisier(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }), nume + '.csv');
    showToast('Biblioteca Excel nu s-a putut încărca. Am exportat CSV (se deschide în Excel).', 'info', 5000);
    return;
  }

  const aoa = [['Data', 'Tip', 'Categorie', 'Parcela', 'Descriere', 'Venit (RON)', 'Cheltuială (RON)']];
  rows.forEach(r => aoa.push([r.dataObj || r.data, r.tip === 'venit' ? 'Venit' : 'Cheltuială', r.categorie, r.parcela, r.descriere,
    r.tip === 'venit' ? r.suma : null, r.tip === 'venit' ? null : r.suma]));
  aoa.push(['Total', '', '', '', '', { t: 'n', v: T.venituri, f: 'SUM(F2:F' + (n + 1) + ')' }, { t: 'n', v: T.cheltuieli, f: 'SUM(G2:G' + (n + 1) + ')' }]);
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
  for (let i = 2; i <= n + 2; i++) {
    if (ws['A' + i] && ws['A' + i].t === 'd') ws['A' + i].z = 'dd.mm.yyyy';
    ['F', 'G'].forEach(c => { if (ws[c + i]) ws[c + i].z = '#,##0.00'; });
  }
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 26 }, { wch: 20 }, { wch: 40 }, { wch: 16 }, { wch: 18 }];

  const rez = XLSX.utils.aoa_to_sheet([
    ['Raport financiar AIgriculture'],
    ['Generat la', new Date()],
    ['Filtre', _filtreContabilitate()],
    [],
    ['Total venituri (RON)', { t: 'n', v: T.venituri, f: 'Tranzactii!F' + (n + 2) }],
    ['Total cheltuieli (RON)', { t: 'n', v: T.cheltuieli, f: 'Tranzactii!G' + (n + 2) }],
    ['Profit (RON)', { t: 'n', v: T.profit, f: 'B5-B6' }]
  ], { cellDates: true });
  ['B5', 'B6', 'B7'].forEach(a => { rez[a].z = '#,##0.00'; });
  if (rez.B2) rez.B2.z = 'dd.mm.yyyy';
  rez['!cols'] = [{ wch: 26 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, rez, 'Rezumat');
  XLSX.utils.book_append_sheet(wb, ws, 'Tranzactii');
  XLSX.writeFile(wb, nume + '.xlsx');
  showToast('Fișier Excel generat.', 'success');
}
// ============================================================
//  PROFITABILITATE
// ============================================================
function calculeazaProfitabilitate() {
const totalVenit=cheltuieliData.filter(c=>c.tip==='venit').reduce((s,c)=>s+parseFloat(c.suma),0);
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
const totalVenit=cheltuieliData.filter(c=>c.tip==='venit').reduce((s,c)=>s+parseFloat(c.suma),0);
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

/* ===== METEO v2 — Open-Meteo (fără cheie) =====
   Înlocuiește funcția cautaMeteo() din app.js cu tot conținutul acestui fișier.
   Folosește globalele existente: parceleData, meteoChart, showLoading, showToast, Chart.
   Pragurile de mai jos sunt orientative: ajustează-le după etichetele produselor și experiența ta. */

const METEO_CACHE_MIN = 30;
let meteoCtx = { lat: null, lon: null, nume: '' };          // ultima localitate căutată
const PRAG_SEMANAT = { 'floarea-soarelui': 8, 'porumb': 10, 'soia': 12 }; // °C sol la 6 cm
const STROP = { vantBun: 15, vantMax: 20, tMinBun: 8, tMaxBun: 25, tMin: 5, tMax: 30 };
const STROP_CULORI = { g: '#0E7C3A', y: '#FFB800', r: '#D92D20' };
const STROP_HASURI = 'background-image:repeating-linear-gradient(45deg,transparent 0 4px,rgba(255,255,255,.4) 4px 6px);';

/* ---------- utilitare ---------- */
function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function _fara(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
function numeParcela(p) { return p.nume || p.name || p.denumire || ('Parcela ' + (p.id != null ? p.id : '')); }

function meteoInfoCod(code) {
  if (code === 0) return { icon: 'ti-sun', color: 'var(--wheat)', desc: 'Cer senin' };
  if (code <= 2) return { icon: 'ti-cloud-sun', color: 'var(--wheat)', desc: 'Parțial noros' };
  if (code <= 3) return { icon: 'ti-cloud', color: '#95a5a6', desc: 'Noros' };
  if (code <= 49) return { icon: 'ti-mist', color: '#95a5a6', desc: 'Ceață' };
  if (code <= 59) return { icon: 'ti-cloud-drizzle', color: 'var(--ai-blue)', desc: 'Burniță' };
  if (code <= 69) return { icon: 'ti-cloud-rain', color: 'var(--ai-blue)', desc: 'Ploaie' };
  if (code <= 79) return { icon: 'ti-snowflake', color: '#a0c0ff', desc: 'Ninsoare' };
  if (code <= 82) return { icon: 'ti-cloud-rain', color: 'var(--ai-blue)', desc: 'Averse' };
  if (code <= 86) return { icon: 'ti-snowflake', color: '#a0c0ff', desc: 'Averse de ninsoare' };
  if (code <= 99) return { icon: 'ti-bolt', color: 'var(--wheat)', desc: 'Furtună' };
  return { icon: 'ti-cloud', color: '#95a5a6', desc: 'Variabil' };
}

/* ---------- centrul unei parcele (acceptă GeoJSON, liste de puncte sau lat/lng) ---------- */
function _colecteazaPuncte(x, out) {
  if (!x) return;
  if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { return; } }
  if (Array.isArray(x)) {
    if (x.length >= 2 && typeof x[0] === 'number' && typeof x[1] === 'number') { out.push([x[0], x[1]]); return; }
    x.forEach(i => _colecteazaPuncte(i, out)); return;
  }
  if (typeof x === 'object') {
    if (x.geometry) return _colecteazaPuncte(x.geometry, out);
    if (x.coordinates) return _colecteazaPuncte(x.coordinates, out);
    const la = x.lat, lo = x.lng != null ? x.lng : x.lon;
    if (typeof la === 'number' && typeof lo === 'number') out.push([la, lo]);
  }
}
function centruParcela(p) {
  const pts = [];
  _colecteazaPuncte({ lat: p.lat, lng: p.lng != null ? p.lng : p.lon }, pts);
  ['geojson', 'geometrie', 'geometry', 'coordonate', 'coordinates', 'poligon', 'coords', 'centru', 'center']
    .forEach(k => { if (p[k]) _colecteazaPuncte(p[k], pts); });
  const ok = [];
  pts.forEach(([a, b]) => {                       // detectează ordinea (lat,lon) sau (lon,lat) pentru România
    if (a >= 43 && a <= 49 && b >= 20 && b <= 30) ok.push([a, b]);
    else if (b >= 43 && b <= 49 && a >= 20 && a <= 30) ok.push([b, a]);
  });
  if (!ok.length) return null;
  return { lat: ok.reduce((s, c) => s + c[0], 0) / ok.length, lon: ok.reduce((s, c) => s + c[1], 0) / ok.length };
}

/* ---------- selector de parcele ---------- */
function populeazaSelectorParcele() {
  const sel = document.getElementById('meteo-parcela');
  if (!sel || typeof parceleData === 'undefined' || !parceleData) return;
  if (sel.options.length - 1 === parceleData.length) return;
  const v = sel.value;
  sel.innerHTML = '<option value="">Locația căutată</option>' +
    parceleData.map((p, i) => '<option value="' + i + '">' + _esc(numeParcela(p)) + (p.cultura ? ' · ' + _esc(p.cultura) : '') + '</option>').join('');
  sel.value = v;
}

/* ---------- date: Open-Meteo cu cache în browser ---------- */
async function meteoFetch(lat, lon) {
  const key = 'meteo:' + lat.toFixed(2) + ',' + lon.toFixed(2);
  try {
    const c = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (c && Date.now() - c.t < METEO_CACHE_MIN * 60000) return c.d;
  } catch (e) { }
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(4) + '&longitude=' + lon.toFixed(4)
    + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code'
    + '&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,soil_temperature_6cm,soil_moisture_3_to_9cm'
    + '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum,et0_fao_evapotranspiration'
    + '&wind_speed_unit=kmh&timezone=Europe%2FBucharest&forecast_days=7';
  const r = await fetch(url);
  if (!r.ok) throw new Error('Open-Meteo ' + r.status);
  const d = await r.json();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) { }
  return d;
}

/* ---------- acțiuni din interfață ---------- */
async function cautaMeteo() {
  const locEl = document.getElementById('meteo-loc');
  if (!locEl || !locEl.value.trim()) return;
  populeazaSelectorParcele();
  showLoading(true);
  try {
    const geoRes = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(locEl.value.trim()) + '&count=1&language=ro&format=json');
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results.length) { showLoading(false); showToast('Localitate negăsită.', 'error'); return; }
    const g = geoData.results[0];
    meteoCtx = { lat: g.latitude, lon: g.longitude, nume: g.name + ', Romania' };
    const sel = document.getElementById('meteo-parcela'); if (sel) sel.value = '';
    showLoading(false);
    await incarcaMeteo(meteoCtx.lat, meteoCtx.lon, meteoCtx.nume, null);
  } catch (e) {
    showLoading(false); console.error('Eroare meteo:', e); showToast('Eroare la încărcarea meteo: ' + e.message, 'error');
  }
}

async function meteoDinParcela() {
  const sel = document.getElementById('meteo-parcela');
  if (!sel) return;
  if (sel.value === '') { if (meteoCtx.lat != null) incarcaMeteo(meteoCtx.lat, meteoCtx.lon, meteoCtx.nume, null); return; }
  const p = parceleData[+sel.value];
  const c = p && centruParcela(p);
  if (!c) { showToast('Parcela nu are coordonate valide.', 'error'); sel.value = ''; return; }
  incarcaMeteo(c.lat, c.lon, numeParcela(p), p);
}

/* ---------- logică agronomică ---------- */
function recomandareAgro(temp, wcode, daily) {
  const ploaieUrmeaza = daily && daily.weather_code && (daily.weather_code[0] >= 60 || (daily.weather_code[1] && daily.weather_code[1] >= 60));
  const pp = (daily && daily.precipitation_probability_max && daily.precipitation_probability_max[0]) || 0;
  if (wcode >= 95) return 'Furtună activă. Opriți toate lucrările mecanice. Asigurați adăpostul utilajelor și animalelor.';
  if (wcode >= 60) return 'Ploaie în desfășurare. Amânați tratamentele fitosanitare și fertilizările foliare. Verificați drenajul parcelelor.';
  if (pp >= 60) return 'Atenție! Probabilitate ridicată de ploaie (' + pp + '%). Amânați tratamentele fitosanitare cu cel puțin 24h. Planificați lucrările pentru după trecerea frontului.';
  if (ploaieUrmeaza && pp >= 30) return 'Ploaie posibilă în următoarele zile (probabilitate ' + pp + '%). Efectuați tratamentele fitosanitare cât mai curând dacă este necesar.';
  if (wcode >= 70) return 'Ninsoare. Protejați culturile de toamnă. Verificați rezistența la îngheț a soiurilor sensibile.';
  if (temp > 32) return 'Caniculă! Irigați dimineața devreme (5-8 AM). Evitați lucrările solului în orele de vârf. Monitorizați stresul hidric la porumb și floarea-soarelui.';
  if (temp > 25) return 'Temperatură ridicată. Irigare recomandată pentru culturi sensibile. Condiții bune pentru uscarea cerealelor recoltate.';
  if (temp < 0) return 'Îngheț! Protejați culturile de toamnă. Nu efectuați lucrări mecanice. Verificați starea culturilor de rapiță și grâu după îngheț.';
  if (temp < 5) return 'Temperaturi scăzute. Risc de îngheț nocturn. Nu semănați porumb sau floarea-soarelui. Monitorizați culturile de toamnă.';
  if (pp < 20 && wcode < 3) return 'Condiții excelente pentru lucrări agricole. Ideal pentru tratamente fitosanitare, fertilizări foliare și lucrări mecanice. Profitați de această fereastră meteo favorabilă.';
  return 'Condiții acceptabile pentru lucrări agricole. Verificați prognoza detaliată înainte de a aplica tratamente fitosanitare.';
}

function _evalStropit(h, i) {
  const vant = h.wind_speed_10m[i] || 0, raf = h.wind_gusts_10m[i] || 0, t = h.temperature_2m[i];
  let ploaie = 0, prob = 0;
  for (let k = i; k < Math.min(i + 3, h.time.length); k++) { ploaie += h.precipitation[k] || 0; prob = Math.max(prob, h.precipitation_probability[k] || 0); }
  if (ploaie > 0.2 || prob >= 60 || vant > STROP.vantMax || raf > 35 || t < STROP.tMin || t > STROP.tMax) return 'r';
  if (ploaie > 0 || prob >= 30 || vant > STROP.vantBun || t < STROP.tMinBun || t > STROP.tMaxBun) return 'y';
  return 'g';
}

function _numeZi(data, azi) {
  const dz = Math.round((new Date(data + 'T12:00') - new Date(azi + 'T12:00')) / 864e5);
  if (dz === 0) return 'Azi';
  if (dz === 1) return 'Mâine';
  return new Date(data + 'T12:00').toLocaleDateString('ro-RO', { weekday: 'long' });
}

function _randStropit(h, idx, azi) {
  const st = h.time.map((_, i) => _evalStropit(h, i));
  const fin = Math.min(idx + 48, h.time.length);
  let best = null, start = -1;                       // cea mai lungă fereastră verde din următoarele 48h
  for (let i = idx; i <= fin; i++) {
    if (i < fin && st[i] === 'g') { if (start < 0) start = i; }
    else if (start >= 0) { if (!best || i - start > best.n) best = { i0: start, n: i - start }; start = -1; }
  }
  let sumar;
  if (best) {
    const i0 = best.i0, i1 = best.i0 + best.n - 1;
    const hh = i => h.time[i].slice(11, 13);
    sumar = '<b>Cea mai bună fereastră:</b> ' + _numeZi(h.time[i0].slice(0, 10), azi) + ' ' + hh(i0) + ':00–' + String((+hh(i1) + 1) % 24).padStart(2, '0') + ':00 (' + best.n + ' h)';
  } else sumar = '<b>Nicio fereastră bună în următoarele 48 de ore.</b> Vânt, ploaie sau temperatură în afara limitelor.';

  const zile = [...new Set(h.time.map(t => t.slice(0, 10)))].slice(0, 2);
  const grid = 'display:grid;grid-template-columns:repeat(24,minmax(13px,1fr));gap:3px;';
  const randuri = zile.map(z => {
    const ore = h.time.map((t, i) => i).filter(i => h.time[i].startsWith(z));
    const celule = ore.map(i => {
      const s = st[i];
      return '<div title="' + h.time[i].slice(11, 16) + ' · vânt ' + Math.round(h.wind_speed_10m[i]) + ' km/h · ' + Math.round(h.temperature_2m[i]) + '°C · ' + (h.precipitation[i] || 0) + ' mm"'
        + ' style="height:38px;border-radius:6px;background:' + STROP_CULORI[s] + ';' + (s === 'r' ? STROP_HASURI : '') + (i < idx ? 'opacity:.3;' : '') + '"></div>';
    }).join('');
    const et = ore.map(i => '<div style="font-size:12px;font-weight:700;color:var(--gray-500);white-space:nowrap">' + (+h.time[i].slice(11, 13) % 3 === 0 ? h.time[i].slice(11, 13) : '') + '</div>').join('');
    return '<div style="margin-bottom:14px"><div style="font-size:14px;font-weight:700;margin-bottom:6px">' + _numeZi(z, azi) + '</div>'
      + '<div style="' + grid + '">' + celule + '</div><div style="' + grid + 'margin-top:4px">' + et + '</div></div>';
  }).join('');

  const chip = (s, t) => '<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;font-size:13px;font-weight:600"><span style="width:14px;height:14px;border-radius:4px;background:' + STROP_CULORI[s] + ';' + (s === 'r' ? STROP_HASURI : '') + '"></span>' + t + '</span>';
  return {
    sumar,
    html: '<div style="overflow-x:auto"><div style="min-width:420px">' + randuri + '</div></div>'
      + '<div style="margin-top:4px">' + chip('g', 'Bun') + chip('y', 'Cu atenție') + chip('r', 'Nu stropi') + '</div>'
  };
}

function _alerte(d, h, idx) {
  const A = [], fin = Math.min(idx + 48, h.time.length);
  const tMin = Math.min(d.temperature_2m_min[0], d.temperature_2m_min[1]);
  const tMax = Math.max(d.temperature_2m_max[0], d.temperature_2m_max[1]);
  const ploaie = (d.precipitation_sum[0] || 0) + (d.precipitation_sum[1] || 0);
  let raf = 0; for (let i = idx; i < fin; i++) raf = Math.max(raf, h.wind_gusts_10m[i] || 0);
  if (tMin <= 0) A.push(['r', 'ti-snowflake', 'Îngheț', 'Minima ajunge la ' + Math.round(tMin) + '°C. Protejează culturile sensibile.']);
  else if (tMin <= 2) A.push(['y', 'ti-snowflake', 'Risc de îngheț', 'Minima de ' + Math.round(tMin) + '°C poate aduce îngheț la sol noaptea.']);
  if (tMax >= 35) A.push(['r', 'ti-temperature-sun', 'Caniculă', 'Maxima ajunge la ' + Math.round(tMax) + '°C. Evită lucrările în orele de vârf.']);
  else if (tMax >= 32) A.push(['y', 'ti-temperature-sun', 'Căldură puternică', 'Maxima de ' + Math.round(tMax) + '°C poate provoca stres hidric.']);
  if (ploaie >= 20) A.push(['r', 'ti-cloud-rain', 'Ploaie puternică', Math.round(ploaie) + ' mm în 48 h. Amână tratamentele și lucrările pe teren umed.']);
  else if (ploaie >= 8) A.push(['y', 'ti-cloud-rain', 'Ploaie semnificativă', 'Aproximativ ' + Math.round(ploaie) + ' mm în 48 h.']);
  if (raf >= 60) A.push(['r', 'ti-wind', 'Vânt puternic', 'Rafale de până la ' + Math.round(raf) + ' km/h.']);
  else if (raf >= 45) A.push(['y', 'ti-wind', 'Rafale de vânt', 'Rafale de până la ' + Math.round(raf) + ' km/h.']);
  return A;
}

/* ---------- afișare ---------- */
async function incarcaMeteo(lat, lon, nume, parcela) {
  showLoading(true);
  try {
    const m = await meteoFetch(lat, lon);
    showLoading(false);
    const cur = m.current, daily = m.daily, h = m.hourly;
    const temp = Math.round(cur.temperature_2m), wcode = cur.weather_code, wi = meteoInfoCod(wcode);
    const aziData = cur.time.slice(0, 10);
    let idx = h.time.findIndex(t => t >= cur.time.slice(0, 13) + ':00'); if (idx < 0) idx = 0;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    // Vremea curentă
    const azi = new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
    set('meteo-city-name', nume);
    set('meteo-data-azi', azi.charAt(0).toUpperCase() + azi.slice(1));
    set('meteo-temp', temp + '°C');
    set('meteo-desc', wi.desc);
    set('meteo-umiditate-val', cur.relative_humidity_2m + '%');
    set('meteo-vant-val', Math.round(cur.wind_speed_10m) + ' km/h');
    set('meteo-presiune-val', Math.round(cur.surface_pressure) + ' hPa');
    const iconEl = document.getElementById('meteo-icon');
    if (iconEl) { iconEl.className = 'ti ' + wi.icon; iconEl.style.color = wi.color; }
    if (!parcela) {
      const tw = document.getElementById('top-weather');
      if (tw) tw.innerHTML = '<i class="ti ' + wi.icon + '"></i> ' + temp + '°C';
      set('d-temp-azi', temp + '°');
    }
    set('meteo-recomandare', recomandareAgro(temp, wcode, daily));

    // Sol și apă (date de model, nu măsurători)
    const solT = h.soil_temperature_6cm[idx], solU = h.soil_moisture_3_to_9cm[idx];
    const suma = a => a.reduce((s, x) => s + (x || 0), 0);
    const ploaie7 = suma(daily.precipitation_sum), et7 = suma(daily.et0_fao_evapotranspiration), bilant = ploaie7 - et7;
    const culturi = parcela ? [parcela.cultura].filter(Boolean)
      : (typeof parceleData !== 'undefined' && parceleData.length ? [...new Set(parceleData.map(p => p.cultura).filter(Boolean))] : []);
    const rand = (a, b, extra) => '<div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--gray-200);font-size:14.5px"><span style="color:var(--gray-600)">' + a + '</span><b style="text-align:right">' + b + (extra || '') + '</b></div>';
    let solHtml = rand('Temperatura solului (6 cm)', solT != null ? solT.toFixed(1) + '°C' : '—')
      + rand('Umiditatea solului (3–9 cm)', solU != null ? Math.round(solU * 100) + '%' : '—')
      + rand('Evapotranspirație azi (ET₀)', (daily.et0_fao_evapotranspiration[0] || 0).toFixed(1) + ' mm')
      + rand('Bilanț apă, 7 zile', (bilant >= 0 ? '+' : '') + bilant.toFixed(0) + ' mm', '<span style="font-weight:500;color:var(--gray-500);font-size:12.5px"> (ploaie ' + ploaie7.toFixed(0) + ' − ET₀ ' + et7.toFixed(0) + ')</span>');
    culturi.forEach(c => {
      const prag = PRAG_SEMANAT[_fara(c)];
      if (prag != null && solT != null) solHtml += rand('Semănat ' + _esc(c), solT >= prag ? 'Sol destul de cald' : 'Sol prea rece', '<span style="font-weight:500;color:var(--gray-500);font-size:12.5px"> (prag ' + prag + '°C)</span>');
    });
    solHtml += '<div style="font-size:12.5px;color:var(--gray-500);margin-top:10px">Valori estimate de model pentru locația aleasă, nu măsurători din sol.</div>';
    const solEl = document.getElementById('meteo-sol'); if (solEl) solEl.innerHTML = solHtml;

    const detEl = document.getElementById('meteo-detalii-agro');
    if (detEl) detEl.innerHTML = '<div style="background:rgba(255,255,255,0.7);border-radius:10px;padding:12px;font-size:13.5px;margin-top:10px">'
      + '<div style="font-weight:700;color:var(--soil);margin-bottom:4px"><i class="ti ti-plant-2"></i> ' + (parcela ? 'Parcela: ' + _esc(numeParcela(parcela)) + (parcela.cultura ? ' · ' + _esc(parcela.cultura) : '') : 'Culturile tale: ' + (culturi.length ? culturi.map(_esc).join(', ') : 'nedefinite')) + '</div>'
      + '<div style="color:var(--gray-600)">Sol (6 cm): <b>' + (solT != null ? solT.toFixed(1) + '°C' : '—') + '</b> · ET₀ azi: <b>' + (daily.et0_fao_evapotranspiration[0] || 0).toFixed(1) + ' mm</b></div></div>';

    // Fereastră de stropit + alerte
    const sp = _randStropit(h, idx, aziData);
    const spS = document.getElementById('meteo-stropit-sumar'); if (spS) spS.innerHTML = sp.sumar;
    const spH = document.getElementById('meteo-stropit'); if (spH) spH.innerHTML = sp.html;
    const al = _alerte(daily, h, idx), alEl = document.getElementById('meteo-alerte');
    if (alEl) alEl.innerHTML = al.length ? al.map(([nivel, ico, titlu, text]) =>
      '<div class="alert-box"' + (nivel === 'r' ? ' style="background:var(--danger-light);border-left-color:var(--danger)"' : '') + '><i class="ti ' + ico + '"' + (nivel === 'r' ? ' style="color:var(--danger)"' : '') + '></i>'
      + '<div><b>' + titlu + '</b><div class="alert-meta">' + text + '</div></div></div>').join('')
      : '<div class="msg-box msg-success"><i class="ti ti-circle-check"></i> Nicio alertă în următoarele 48 de ore.</div>';

    // Prognoza 7 zile
    const zile = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
    const fc = document.getElementById('meteo-forecast-7');
    if (fc) fc.innerHTML = daily.time.map((data, i) => {
      const wInfo = meteoInfoCod(daily.weather_code[i]), pr = daily.precipitation_probability_max[i] || 0, d = new Date(data);
      return '<div style="background:var(--mist);border-radius:12px;padding:12px 8px;text-align:center;border:1px solid rgba(0,0,0,0.05)">'
        + '<div style="font-size:13px;font-weight:800;color:var(--gray-600)">' + (i === 0 ? 'Azi' : zile[d.getDay()]) + '</div>'
        + '<div style="font-size:12.5px;color:var(--gray-500);margin-bottom:8px">' + d.getDate() + ' ' + d.toLocaleDateString('ro-RO', { month: 'short' }) + '</div>'
        + '<i class="ti ' + wInfo.icon + '" style="font-size:28px;color:' + wInfo.color + '"></i>'
        + '<div style="font-weight:800;font-size:17px;color:var(--soil);margin-top:6px">' + Math.round(daily.temperature_2m_max[i]) + '°</div>'
        + '<div style="font-size:13px;font-weight:600;color:var(--gray-500)">' + Math.round(daily.temperature_2m_min[i]) + '°</div>'
        + (pr > 0 ? '<div style="font-size:12.5px;color:var(--ai-blue);margin-top:4px;font-weight:700"><i class="ti ti-droplet"></i> ' + pr + '%</div>' : '') + '</div>';
    }).join('');

    // Grafic temperaturi
    if (typeof meteoChart !== 'undefined' && meteoChart) { meteoChart.destroy(); meteoChart = null; }
    const cv = document.getElementById('meteo-chart'), ctx = cv && cv.getContext('2d');
    if (ctx) meteoChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: daily.time.map((data, i) => i === 0 ? 'Azi' : zile[new Date(data).getDay()] + ' ' + new Date(data).getDate()),
        datasets: [
          { label: 'Max °C', data: daily.temperature_2m_max.map(Math.round), borderColor: '#d63031', tension: 0.4, fill: false, pointBackgroundColor: '#d63031', pointRadius: 5 },
          { label: 'Min °C', data: daily.temperature_2m_min.map(Math.round), borderColor: '#1a6bbf', tension: 0.4, fill: false, pointBackgroundColor: '#1a6bbf', pointRadius: 5 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true } } },
        scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => v + '°C', font: { family: 'Inter', size: 11 } } }, x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } } }
      }
    });
  } catch (e) {
    showLoading(false); console.error('Eroare meteo:', e); showToast('Eroare la încărcarea meteo: ' + e.message, 'error');
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
const anInitial = document.getElementById('harta-filter-an')?.value;
reincarcaParcelePeHartaFull(anInitial && anInitial !== '' ? anInitial : null);
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
const editId = document.getElementById('cal-id-edit')?.value;
const { error } = editId 
  ? await sb.from('ani_agricoli').update({
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
    }).eq('id',editId).eq('user_id',currentUser.id)
  : await sb.from('ani_agricoli').insert([{
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
  const calIdEl = document.getElementById('cal-id-edit');
if (calIdEl) calIdEl.value = '';
document.getElementById('cal-form-title').textContent = 'Inregistrare manuala an agricol';
document.getElementById('cal-btn').innerHTML = '<i class="ti ti-plus"></i> Salveaza';
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
function editeazaAnAgricol(id) {
  const a = aniAgricoliData.find(x => x.id === id);
  if (!a) return;

  // Deschidem modalul
  deschideModalAdaugaCal();

  // Setam id-ul de editare
  document.getElementById('cal-id-edit').value = id;
  document.getElementById('cal-form-title').textContent = 'Editeaza an agricol';
  document.getElementById('cal-btn').innerHTML = '<i class="ti ti-device-floppy"></i> Salveaza modificarile';

  // Populam formularul
  document.getElementById('cal-an').value = a.an_agricol || '';
  const calParc = document.getElementById('cal-parcela');
  if (calParc) calParc.value = a.parcela_id || '';
  document.getElementById('cal-cultura').value = a.cultura || '';
  document.getElementById('cal-status').value = a.status || 'planificat';
  document.getElementById('cal-semanat').value = a.data_semanat || '';
  document.getElementById('cal-recolta').value = a.data_recolta || '';
  document.getElementById('cal-productie').value = a.productie_tone || '';
  document.getElementById('cal-suprafata').value = a.suprafata_ha || '';
  document.getElementById('cal-note').value = a.note || '';
  if (a.productie_tone && a.suprafata_ha) calcCalProductie();
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

const btnEdit = item.sursa === 'manual' 
  ? '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editeazaAnAgricol(\''+manualItem.id+'\')" style="width:auto;padding:4px 10px;margin-top:10px;margin-right:6px"><i class="ti ti-edit"></i> Editeaza</button>'
  : '';
const btnDelete = item.sursa === 'manual' 
  ? '<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();stergeAnAgricol(\''+manualItem.id+'\')" style="width:auto;padding:4px 10px;margin-top:10px"><i class="ti ti-trash"></i> Sterge</button>' 
  : '';
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
        btnEdit+btnDelete+
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
function deschideModalFeedback() {
  document.getElementById('modal-feedback').style.display = 'flex';
  document.getElementById('feedback-mesaj').value = '';
  selectTipFeedback('bug');
}

function selectTipFeedback(tip) {
  document.getElementById('feedback-tip').value = tip;
  document.getElementById('feedback-bug-btn').className = tip === 'bug' ? 'btn btn-danger' : 'btn btn-ghost';
  document.getElementById('feedback-sug-btn').className = tip === 'sugestie' ? 'btn btn-primary' : 'btn btn-ghost';
}

async function trimiteFeeback() {
  const tip = document.getElementById('feedback-tip').value;
  const mesaj = document.getElementById('feedback-mesaj').value.trim();
  if (!mesaj) { showToast('Scrie un mesaj înainte să trimiți.','error'); return; }
  const { error } = await sb.from('feedback').insert([{
    user_id: currentUser.id,
    tip: tip,
    mesaj: mesaj
  }]);
  if (error) { showToast('Eroare: '+error.message,'error'); return; }
  document.getElementById('modal-feedback').style.display = 'none';
  showToast('Mulțumim pentru feedback! Îl vom analiza cu atenție.','success', 5000);
}
function arataDetaliiParcelaHarta(parcelaId) {
  const p = parceleData.find(x => x.id === parcelaId);
  if (!p) return;

  // Stergem panoul vechi daca exista
  document.getElementById('harta-detalii-panel')?.remove();

  const panel = document.createElement('div');
  panel.id = 'harta-detalii-panel';
  panel.style.cssText = 'position:fixed;top:80px;right:20px;width:320px;max-height:calc(100vh - 100px);overflow-y:auto;background:var(--white);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:1000;animation:fadeInUp 0.3s ease';

  // Recolte per an
  const recolteParc = recolteData.filter(r => r.parcela_id === parcelaId);
  const lucrariParc = lucrariData.filter(l => l.parcela_id === parcelaId);
  const aniSet = new Set();
  recolteParc.forEach(r => { if(r.data_recolta) { const d=new Date(r.data_recolta); const luna=d.getMonth(); const an=d.getFullYear(); aniSet.add(luna>=9?(an+'-'+(an+1)):((an-1)+'-'+an)); }});
  lucrariParc.forEach(l => { if(l.data_lucrare) { const d=new Date(l.data_lucrare); const luna=d.getMonth(); const an=d.getFullYear(); aniSet.add(luna>=9?(an+'-'+(an+1)):((an-1)+'-'+an)); }});
  aniAgricoliData.filter(a => a.parcela_id === parcelaId).forEach(a => aniSet.add(a.an_agricol));
  if (p.data_semanat) { const d=new Date(p.data_semanat); const luna=d.getMonth(); const an=d.getFullYear(); aniSet.add(luna>=9?(an+'-'+(an+1)):((an-1)+'-'+an)); }

  const ani = [...aniSet].sort((a,b) => b.localeCompare(a));

  let aniHTML = ani.map(an => {
    const parti = an.split('-');
    const dataStart = new Date(parseInt(parti[0]), 9, 1);
    const dataEnd = new Date(parseInt(parti[1]), 8, 30);

    const rec = recolteParc.filter(r => r.data_recolta && new Date(r.data_recolta) >= dataStart && new Date(r.data_recolta) <= dataEnd);
    const luc = lucrariParc.filter(l => l.data_lucrare && new Date(l.data_lucrare) >= dataStart && new Date(l.data_lucrare) <= dataEnd);
    const anInfo = aniAgricoliData.find(a => a.parcela_id === parcelaId && a.an_agricol === an);

    const cultura = anInfo?.cultura || rec[0]?.cultura || p.cultura || '—';
    const totalTone = rec.reduce((s,r) => s+parseFloat(r.cantitate_tone||0), 0);
    const totalHa = rec.reduce((s,r) => s+parseFloat(r.suprafata_ha||0), 0);
    const randament = totalHa > 0 ? (totalTone/totalHa).toFixed(2) : '—';

    return '<div style="background:var(--gray-50);border-radius:10px;padding:12px;margin-bottom:10px;border-left:3px solid var(--ai-green)">'
      +'<div style="font-weight:700;font-size:13px;color:var(--soil);margin-bottom:8px">'+an+' — <span style="color:var(--ai-green)">'+escapeHTML(cultura)+'</span></div>'
      +(p.data_semanat && new Date(p.data_semanat) >= dataStart && new Date(p.data_semanat) <= dataEnd ? '<div style="font-size:12px;color:var(--gray-500);margin-bottom:4px"><i class="ti ti-plant"></i> Semanat: '+fmtData(p.data_semanat)+'</div>' : '')
      +(luc.length > 0 ? '<div style="font-size:12px;color:var(--gray-500);margin-bottom:4px"><i class="ti ti-tractor"></i> '+luc.length+' lucrari agricole</div>' : '')
      +(rec.length > 0 ? '<div style="font-size:12px;color:var(--gray-500);margin-bottom:4px"><i class="ti ti-grain"></i> Recoltat: '+totalTone.toFixed(1)+' t · '+randament+' t/ha</div>' : '')
      +(luc.length === 0 && rec.length === 0 ? '<div style="font-size:12px;color:var(--gray-400)">Nicio activitate inregistrata</div>' : '')
      +'</div>';
  }).join('');

  if (!aniHTML) aniHTML = '<div style="font-size:13px;color:var(--gray-400);text-align:center;padding:16px">Nicio activitate inregistrata.</div>';

  panel.innerHTML = '<div style="padding:16px 20px;border-bottom:1px solid var(--gray-200);display:flex;justify-content:space-between;align-items:center">'
    +'<div><div style="font-weight:700;font-size:15px;color:var(--soil)">'+escapeHTML(p.nume)+'</div>'
    +'<div style="font-size:12px;color:var(--gray-500)">'+escapeHTML(p.cultura||'—')+' · '+(p.suprafata_ha||0)+' ha · '+escapeHTML(p.localitate||'')+'</div></div>'
    +'<button onclick="document.getElementById(\'harta-detalii-panel\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--gray-400)">×</button>'
    +'</div>'
    +'<div style="padding:16px 20px">'
    +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:var(--gray-400);margin-bottom:12px">Istoric pe ani agricoli</div>'
    +aniHTML
    +'</div>';

  document.body.appendChild(panel);
}
function adaugaCulturaAutomata(parcelaId, an) {
  const parcela = parceleData.find(p => p.id === parcelaId);
  if (!parcela) return;
  deschideModalAdaugaCal();
  document.getElementById('cal-an').value = an;
  const calParc = document.getElementById('cal-parcela');
  if (calParc) calParc.value = parcelaId;
  document.getElementById('cal-suprafata').value = parcela.suprafata_ha || '';
  document.getElementById('cal-form-title').textContent = 'Adauga cultura — '+parcela.nume;
}
initApp();
