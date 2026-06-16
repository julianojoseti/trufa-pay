import React, { useEffect, useMemo, useRef, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { createRoot } from 'react-dom/client';
import { Candy, Users, Package, ShoppingCart, MessageCircle, Plus, Search, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Trash2, Heart, CalendarDays, Target, Settings, Download, History, LogOut, Lock, UserPlus, Database, WifiOff, Menu, X, Pencil, Save } from 'lucide-react';
import './style.css';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const hasFirebase = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && !String(firebaseConfig.apiKey).includes('cole_aqui'));

function firebaseApp() {
  if (!hasFirebase) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
function firestoreDb() {
  const app = firebaseApp();
  return app ? getFirestore(app) : null;
}
function firebaseAuth() {
  const app = firebaseApp();
  return app ? getAuth(app) : null;
}

const today = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) || f; } catch { return f; } };
const saveCsv = (filename, rows) => { const csv = rows.map(r => r.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(';')).join('\n'); const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); };

const defaults = {
  products: [
    { id: 'p1', name: 'Trufa de Brigadeiro', price: 4.5, cost: 1.8, stock: 40, minStock: 10 },
    { id: 'p2', name: 'Trufa de Ninho', price: 5, cost: 2, stock: 30, minStock: 10 },
    { id: 'p3', name: 'Trufa de Morango', price: 5, cost: 2.1, stock: 20, minStock: 8 },
  ],
  customers: [
    { id: 'c1', name: 'Maria Souza', phone: '5511999999999', address: 'Centro' },
    { id: 'c2', name: 'João Lima', phone: '5511988888888', address: 'Trabalho' },
  ],
  sales: [
    { id:'s1', customerId:'c1', productId:'p2', qty:4, total:20, paid:false, method:'Pendente', date:today(-1), dueDate:today(0), sellerName:'Admin' },
    { id:'s2', customerId:'c2', productId:'p1', qty:3, total:13.5, paid:true, method:'Pix', date:today(0), dueDate:today(0), sellerName:'Admin' },
  ],
  settings: { coupleName:'Projeto Casamento', weddingDate:'2026-12-12', goal:15000, pixKey:'sua-chave-pix', sellerName:'Trufas do Casamento' }
};

function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'admin@trufapay.com', password:'123456' });
  const [error, setError] = useState('');
  async function submit() {
    setError('');
    try {
      if (hasFirebase) {
        const auth = firebaseAuth();
        let cred;
        if (mode === 'login') cred = await signInWithEmailAndPassword(auth, form.email, form.password);
        else { cred = await createUserWithEmailAndPassword(auth, form.email, form.password); await updateProfile(cred.user, { displayName: form.name || 'Vendedor' }); }
        onLogin({ id: cred.user.uid, name: cred.user.displayName || form.name || 'Vendedor', email: cred.user.email, online:true });
        return;
      }
      const users = load('tp_users', [{ id:'demo', name:'Admin', email:'admin@trufapay.com', password:'123456' }]);
      if (mode === 'register') { const u={ id:String(Date.now()), name:form.name, email:form.email, password:form.password }; localStorage.setItem('tp_users', JSON.stringify([...users,u])); onLogin({ id:u.id, name:u.name, email:u.email, online:false }); return; }
      const u = users.find(x => x.email.toLowerCase() === form.email.toLowerCase() && x.password === form.password);
      if (!u) throw new Error('E-mail ou senha inválidos. Use admin@trufapay.com / 123456 no modo demo.');
      onLogin({ id:u.id, name:u.name, email:u.email, online:false });
    } catch (e) { setError(e.message || 'Não foi possível entrar.'); }
  }

  async function signInWithGoogle() {
    setError('');
    try {
      if (!hasFirebase) { setError('Configure o Firebase para usar login com Google.'); return; }
      const auth = firebaseAuth();
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      onLogin({ id: cred.user.uid, name: cred.user.displayName || cred.user.email, email: cred.user.email, online:true });
      return;
    } catch (e) { setError(e.message || 'Não foi possível entrar com Google.'); }
  }

  return <div className="loginPage"><div className="loginCard">
    <div className="loginBrand"><div className="logo"><Candy/></div><div><strong>TrufaPay</strong><span>Projeto Casamento 💒</span></div></div>
    <h1>{mode === 'login' ? 'Entrar' : 'Criar acesso'}</h1>
    <p>{hasFirebase ? 'Login real com Firebase.' : 'Modo demo/local ativo. Configure o .env para usar Firebase.'}</p>
    {mode === 'register' && <label>Nome<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
    <label>E-mail<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    <label>Senha<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
    {error && <div className="loginError">{error}</div>}
    <button className="primary wide" onClick={submit}><Lock size={18}/>{mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
    <button className="google wide" onClick={signInWithGoogle}>Entrar com Google</button>
    <button className="secondary wide" onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}><UserPlus size={18}/>{mode === 'login' ? 'Criar novo acesso' : 'Já tenho acesso'}</button>
  </div></div>;
} 

function App() {

function App() {
  const [user, setUser] = useState(() => load('tp_session', null));
  const [screen, setScreen] = useState('dashboard');
  const [products, setProducts] = useState(() => load('tp_products', defaults.products));
  const [customers, setCustomers] = useState(() => load('tp_customers', defaults.customers));
  const [sales, setSales] = useState(() => load('tp_sales', defaults.sales));
  const [settings, setSettings] = useState(() => load('tp_settings', defaults.settings));
  const [cloudReady, setCloudReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionBanner, setActionBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const lastLocalRev = useRef(0);
  function notify(message, type = 'success') {
    console.log('[TrufaPay]', type, message);
    const payload = { message, type, id: Date.now() };
    setToast(payload);
    setActionBanner(payload);
    window.clearTimeout(window.__tpToastTimer);
    window.__tpToastTimer = window.setTimeout(() => setToast(null), 4500);
    window.clearTimeout(window.__tpBannerTimer);
    window.__tpBannerTimer = window.setTimeout(() => setActionBanner(null), 6500);
  }

  useEffect(()=>{ user ? localStorage.setItem('tp_session', JSON.stringify(user)) : localStorage.removeItem('tp_session'); },[user]);
  useEffect(()=>localStorage.setItem('tp_products', JSON.stringify(products)),[products]);
  useEffect(()=>localStorage.setItem('tp_customers', JSON.stringify(customers)),[customers]);
  useEffect(()=>localStorage.setItem('tp_sales', JSON.stringify(sales)),[sales]);
  useEffect(()=>localStorage.setItem('tp_settings', JSON.stringify(settings)),[settings]);

  useEffect(() => {
    if (!user || !hasFirebase) return;
    const db = firestoreDb();
    const ref = doc(db, 'workspaces', user.id);
    let unsub = () => {};
    (async () => {
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { products, customers, sales, settings, clientRev: Date.now(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
        unsub = onSnapshot(ref, (s) => {
          const d = s.data();
          if (!d) return;
          const remoteRev = Number(d.clientRev || 0);
          if (remoteRev && remoteRev < lastLocalRev.current) return;
          if (remoteRev) lastLocalRev.current = Math.max(lastLocalRev.current, remoteRev);
          setProducts(d.products || defaults.products);
          setCustomers(d.customers || defaults.customers);
          setSales(d.sales || []);
          setSettings(d.settings || defaults.settings);
          setCloudReady(true);
        }, (err) => {
          console.error('Erro Firestore:', err);
          setCloudReady(false);
        });
      } catch (err) {
        console.error('Erro ao preparar Firestore:', err);
        setCloudReady(false);
      }
    })();
    return () => unsub();
  }, [user?.id]);

  async function persist(next) {
    if (!user || !hasFirebase) return true;
    const rev = Date.now();
    lastLocalRev.current = rev;
    setSaving(true);
    try {
      const db = firestoreDb();
      const payload = {
        products: next.products ?? products,
        customers: next.customers ?? customers,
        sales: next.sales ?? sales,
        settings: next.settings ?? settings,
        clientRev: rev,
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db,'workspaces',user.id), payload, { merge:true });
      setCloudReady(true);
      return true;
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
      setCloudReady(false);
      notify('Não consegui salvar no Firebase. Confira as regras do Firestore.', 'error');
      return false;
    } finally {
      setSaving(false) ;
    }
  }
  const setProductsSync = (v) => { const next = typeof v === 'function' ? v(products) : v; setProducts(next); persist({products:next}); };
  const setCustomersSync = (v) => { const next = typeof v === 'function' ? v(customers) : v; setCustomers(next); persist({customers:next}); };
  const setSalesSync = (v) => { const next = typeof v === 'function' ? v(sales) : v; setSales(next); persist({sales:next}); };
  const setSettingsSync = (v) => { const next = typeof v === 'function' ? v(settings) : v; setSettings(next); persist({settings:next}); };

  const stats = useMemo(()=>{ const received=sales.filter(s=>s.paid).reduce((a,s)=>a+s.total,0); const pending=sales.filter(s=>!s.paid).reduce((a,s)=>a+s.total,0); const total=sales.reduce((a,s)=>a+s.total,0); const profit=sales.reduce((a,s)=>{ const p=products.find(x=>x.id===s.productId); return a + (s.total - ((p?.cost||0)*s.qty));},0); const progress=settings.goal?Math.min(100,received/settings.goal*100):0; const daysLeft=Math.max(0,Math.ceil((new Date(settings.weddingDate+'T00:00:00')-new Date())/86400000)); return {received,pending,total,profit,progress,remaining:Math.max(0,settings.goal-received),daysLeft}; },[sales,products,settings]);
  if (!user) return <Login onLogin={setUser}/>;

  async function addSale(form) {
    const p=products.find(x=>x.id===form.productId);
    const c=customers.find(x=>x.id===form.customerId);
    const qty=Number(form.qty);
    if(!c) { notify('Selecione um cliente válido.', 'error'); return false; }
    if(!p) { notify('Selecione um sabor válido.', 'error'); return false; }
    if(!qty || qty <= 0) { notify('Informe uma quantidade válida.', 'error'); return false; }
    const sale={ id:String(Date.now()), customerId:c.id, productId:p.id, qty, total:Number(p.price||0)*qty, paid:Boolean(form.paid), method:form.paid?(form.method||'Pix'):'Pendente', date:form.purchaseDate || today(0), purchaseDate:form.purchaseDate || today(0), dueDate:form.dueDate || today(0), sellerId:user.id, sellerName:user.name || user.email || 'Vendedor', sellerEmail:user.email || '' };
    const nextSales = [sale, ...sales];
    const nextProducts = products.map(x=>x.id===p.id?{...x,stock:Math.max(0,Number(x.stock||0)-qty)}:x);
    setSales(nextSales);
    setProducts(nextProducts);
    const ok = await persist({ sales: nextSales, products: nextProducts });
    if (ok) {
      notify(`Venda registrada com sucesso: ${c.name} • ${money(sale.total)}`);
      setScreen('historico');
      return true;
    }
    return false;
  }
  async function markPaid(id){
    const nextSales = sales.map(s=>s.id===id?{...s,paid:true,method:'Pix'}:s);
    setSales(nextSales);
    const ok = await persist({sales: nextSales});
    if (ok) notify('Pagamento marcado como recebido.');
  }
  async function delSale(id){
    const nextSales = sales.filter(s=>s.id!==id);
    setSales(nextSales);
    const ok = await persist({sales: nextSales});
    if (ok) notify('Venda excluída.');
  }
  function logout(){ setUser(null); }

  const menu = [['dashboard',Target,'Dashboard'],['vendas',ShoppingCart,'Nova venda'],['historico',History,'Histórico'],['clientes',Users,'Clientes'],['produtos',Package,'Sabores/Estoque'],['config',Settings,'Configurações']];
  return <div className="app">
    {toast && <div className={`toast ${toast.type}`}><CheckCircle2 size={18}/><span>{toast.message}</span></div>}
    <button className="mobileMenuBtn" onClick={()=>setMobileMenuOpen(true)} aria-label="Abrir menu"><Menu size={22}/> Menu</button>
    {mobileMenuOpen && <div className="mobileOverlay" onClick={()=>setMobileMenuOpen(false)} />}
    <aside className={mobileMenuOpen ? 'open' : ''}>
      <button className="closeMenu" onClick={()=>setMobileMenuOpen(false)} aria-label="Fechar menu"><X size={22}/></button>
      <div className="brand"><div className="logo"><Candy/></div><div><strong>TrufaPay</strong><span>Casamento</span></div></div>
      {menu.map(([k,Icon,label])=><button key={k} className={screen===k?'active':''} onClick={()=>{setScreen(k);setMobileMenuOpen(false);}}><Icon size={20}/>{label}</button>)}
      <div className="sideFooter"><span>{user.online ? <><Database size={14}/> Online Firebase {cloudReady?'sincronizado':'conectando'}</> : <><WifiOff size={14}/> Modo demo/local</>}</span><strong>{user.name}</strong><button onClick={logout}><LogOut size={18}/>Sair</button></div>
    </aside>
    <main><header><div><h1>{settings.coupleName}</h1><p>Cada trufa vendida é um passo mais perto do grande dia.</p></div><button className="secondary" onClick={()=>{ exportCsv(sales,customers,products); notify('Arquivo CSV gerado.'); }}><Download size={18}/>Exportar CSV</button></header>{actionBanner && <div className={`actionBanner ${actionBanner.type}`}><CheckCircle2 size={18}/><span>{actionBanner.message}</span></div>}{saving && <div className="syncBanner">Salvando alterações na nuvem...</div>}{screen==='dashboard'&&<Dashboard stats={stats} sales={sales} products={products} customers={customers} settings={settings} markPaid={markPaid}/>} {screen==='vendas'&&<NewSale products={products} customers={customers} onAdd={addSale}/>} {screen==='historico'&&<HistoryPage sales={sales} products={products} customers={customers} markPaid={markPaid} delSale={delSale} settings={settings}/>} {screen==='clientes'&&<Customers customers={customers} setCustomers={setCustomersSync} notify={notify}/>} {screen==='produtos'&&<Products products={products} setProducts={setProductsSync} notify={notify}/>} {screen==='config'&&<Config settings={settings} setSettings={setSettingsSync} notify={notify}/>}</main>
  </div>;
}
function exportCsv(sales,customers,products){ saveCsv('vendas-trufapay.csv', [['Data da compra','Cliente','Produto','Qtd','Total','Status','Vendedor'], ...sales.map(s=>[s.purchaseDate || s.date, customers.find(c=>c.id===s.customerId)?.name, products.find(p=>p.id===s.productId)?.name, s.qty, s.total, s.paid?'Pago':'Pendente', s.sellerName])]); }
function whats(s,c,pix){ const text=`Olá ${c?.name || ''}! Tudo bem? 😊\n\nPassando para lembrar do pagamento das trufas.\nValor: ${money(s.total)}\nPix: ${pix}\n\nMuito obrigado por ajudar no nosso projeto de casamento 💒❤️`; return `https://wa.me/${(c?.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(text)}`; }
function Dashboard({stats,sales,products,customers,settings,markPaid}){ const pending=sales.filter(s=>!s.paid).slice(0,5); return <><section className="hero"><div><span className="tag"><Heart size={18}/>Meta do casamento</span><h2>{money(settings.goal)}</h2><div className="progress"><div style={{width:`${stats.progress}%`}}/></div><p>{money(stats.received)} arrecadado • faltam {money(stats.remaining)} • {stats.progress.toFixed(1)}%</p></div><div className="days"><CalendarDays/><strong>{stats.daysLeft}</strong><span>dias restantes</span></div></section><section className="grid4"><Card icon={DollarSign} title="Recebido" value={money(stats.received)}/><Card icon={Clock} title="Pendente" value={money(stats.pending)}/><Card icon={TrendingUp} title="Lucro estimado" value={money(stats.profit)}/><Card icon={ShoppingCart} title="Total vendido" value={money(stats.total)}/></section><section className="split"><div className="panel"><h2>Pendências</h2>{pending.length?pending.map(s=><SaleRow key={s.id} s={s} p={products.find(p=>p.id===s.productId)} c={customers.find(c=>c.id===s.customerId)} settings={settings} markPaid={markPaid}/>):<p className="empty">Nenhuma pendência.</p>}</div><div className="panel"><h2>Alertas de estoque</h2>{products.filter(p=>p.stock<=p.minStock).map(p=><div className="alert" key={p.id}><AlertCircle/><div><strong>{p.name}</strong><span>Saldo baixo: {p.stock}</span></div></div>)}</div></section></>; }
function Card({icon:Icon,title,value}){ return <div className="card"><div className="cardIcon"><Icon/></div><span>{title}</span><strong>{value}</strong></div>; }
function SaleRow({s,p,c,settings,markPaid,delSale}){ return <div className="row"><div><strong>{c?.name}</strong><span>{p?.name} • {s.qty} un • Compra: {s.purchaseDate || s.date} • Vendedor: {s.sellerName || 'Vendedor'}</span></div><b>{money(s.total)}</b><em className={s.paid?'paid':'pending'}>{s.paid?'Pago':'Pendente'}</em>{!s.paid&&<a className="whats" target="_blank" href={whats(s,c,settings.pixKey)}><MessageCircle size={16}/>Cobrar</a>}{!s.paid&&<button className="mini" onClick={()=>markPaid(s.id)}><CheckCircle2 size={16}/>Pago</button>}{delSale&&<button className="iconBtn" onClick={()=>delSale(s.id)}><Trash2 size={16}/></button>}</div>; }
function NewSale({products,customers,onAdd}){
  const [f,setF]=useState({customerId:'',productId:'',qty:1,paid:true,method:'Pix',purchaseDate:today(0),dueDate:today(0)});
  useEffect(()=>{
    setF(prev=>({
      ...prev,
      customerId: customers.some(c=>c.id===prev.customerId) ? prev.customerId : (customers[0]?.id || ''),
      productId: products.some(p=>p.id===prev.productId) ? prev.productId : (products[0]?.id || '')
    }));
  },[customers,products]);
  const p=products.find(x=>x.id===f.productId);
  const hasBase = customers.length > 0 && products.length > 0;
  async function submit(){
    const ok = await onAdd(f);
    if(ok){ setF(prev=>({...prev, qty:1, paid:true, method:'Pix', purchaseDate:today(0), dueDate:today(0)})); }
  }
  return <section className="panel narrow"><h2>Nova venda</h2>
    {!hasBase && <div className="loginError">Cadastre pelo menos um cliente e um sabor antes de registrar venda.</div>}
    <label>Cliente<select value={f.customerId} onChange={e=>setF({...f,customerId:e.target.value})}>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Sabor<select value={f.productId} onChange={e=>setF({...f,productId:e.target.value})}>{products.map(p=><option key={p.id} value={p.id}>{p.name} - {money(p.price)} / estoque {p.stock}</option>)}</select></label>
    <label>Data da compra<input type="date" value={f.purchaseDate} onChange={e=>setF({...f,purchaseDate:e.target.value})}/></label>
    <label>Quantidade<input type="number" min="1" value={f.qty} onChange={e=>setF({...f,qty:e.target.value})}/></label>
    <div className="toggle"><button type="button" className={f.paid?'active':''} onClick={()=>setF({...f,paid:true})}>Pago</button><button type="button" className={!f.paid?'active':''} onClick={()=>setF({...f,paid:false})}>Pendente</button></div>
    {!f.paid&&<label>Vencimento<input type="date" value={f.dueDate} onChange={e=>setF({...f,dueDate:e.target.value})}/></label>}
    <div className="totalBox"><span>Total</span><strong>{money((p?.price||0)*Number(f.qty||0))}</strong></div>
    <button className="primary wide" disabled={!hasBase} onClick={submit}><Plus/>Registrar venda</button>
  </section>;
}
function HistoryPage({sales,products,customers,markPaid,delSale,settings}){ const [q,setQ]=useState(''); const [status,setStatus]=useState('todos'); const filtered=sales.filter(s=>{ const c=customers.find(x=>x.id===s.customerId)?.name||''; const p=products.find(x=>x.id===s.productId)?.name||''; return (status==='todos'||(status==='pago'?s.paid:!s.paid)) && (c+p+(s.purchaseDate || s.date)+(s.sellerName || '')).toLowerCase().includes(q.toLowerCase()); }); return <section className="panel"><div className="historyTop"><h2><History/>Histórico de vendas</h2><button className="secondary" onClick={()=>exportCsv(filtered,customers,products)}><Download size={18}/>Exportar filtrado</button></div><div className="filters"><div className="search"><Search/><input placeholder="Buscar cliente, sabor ou data" value={q} onChange={e=>setQ(e.target.value)}/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="todos">Todos</option><option value="pago">Pagos</option><option value="pendente">Pendentes</option></select></div><div className="table">{filtered.map(s=><SaleRow key={s.id} s={s} p={products.find(p=>p.id===s.productId)} c={customers.find(c=>c.id===s.customerId)} settings={settings} markPaid={markPaid} delSale={delSale}/>)}</div></section>; }
function Products({products,setProducts,notify}){
  const empty = {name:'',price:'',cost:'',stock:'',minStock:10};
  const [f,setF]=useState(empty);
  const [editingId,setEditingId]=useState(null);
  function normalizeProduct(data, id){
    return {
      id,
      name: String(data.name || '').trim(),
      price: Number(data.price || 0),
      cost: Number(data.cost || 0),
      stock: Number(data.stock || 0),
      minStock: Number(data.minStock || 0)
    };
  }
  function resetForm(){ setF(empty); setEditingId(null); }
  function startEdit(product){
    setEditingId(product.id);
    setF({
      name: product.name || '',
      price: String(product.price ?? ''),
      cost: String(product.cost ?? ''),
      stock: String(product.stock ?? ''),
      minStock: String(product.minStock ?? 0)
    });
    notify(`Editando ${product.name}. Altere os dados e clique em Salvar alterações.`, 'info');
  }
  function saveProduct(){
    if(!String(f.name || '').trim()){ notify('Informe o nome do sabor.', 'error'); return; }
    if(Number(f.price || 0) <= 0){ notify('Informe um preço de venda válido.', 'error'); return; }
    if(editingId){
      const updated = normalizeProduct(f, editingId);
      setProducts(products.map(p=>p.id===editingId ? updated : p));
      notify('Sabor e estoque atualizados com sucesso!');
      resetForm();
      return;
    }
    const product = normalizeProduct(f, String(Date.now()));
    setProducts([...products, product]);
    notify('Sabor salvo com sucesso!');
    resetForm();
  }
  function adjustStock(id, delta){
    const product = products.find(p=>p.id===id);
    const nextStock = Math.max(0, Number(product?.stock || 0) + delta);
    setProducts(products.map(p=>p.id===id ? {...p, stock: nextStock} : p));
    notify(delta > 0 ? 'Estoque aumentado.' : 'Estoque reduzido.');
  }
  function removeProduct(id){
    const product = products.find(p=>p.id===id);
    if(!confirm(`Remover ${product?.name || 'este sabor'}?`)) return;
    setProducts(products.filter(x=>x.id!==id));
    if(editingId === id) resetForm();
    notify('Sabor removido.');
  }
  return <section className="split"><div className="panel"><h2>Sabores e estoque</h2>{products.map(p=><div className="product" key={p.id}><div><strong>{p.name}</strong><span>Venda {money(p.price)} • Custo {money(p.cost)} • Estoque {p.stock} • Mín. {p.minStock}</span><div className="stockActions"><button className="mini" onClick={()=>adjustStock(p.id,-1)}>-1</button><button className="mini" onClick={()=>adjustStock(p.id,1)}>+1</button><button className="mini" onClick={()=>startEdit(p)}><Pencil size={16}/>Editar</button></div></div><button className="iconBtn" onClick={()=>removeProduct(p.id)}><Trash2 size={16}/></button></div>)}</div><div className="panel"><h2>{editingId ? 'Editar sabor/estoque' : 'Adicionar sabor'}</h2>{['name','price','cost','stock','minStock'].map(k=><label key={k}>{k==='name'?'Nome':k==='price'?'Preço':k==='cost'?'Custo':k==='stock'?'Estoque':'Estoque mínimo'}<input type={k==='name'?'text':'number'} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}<button className="primary wide" onClick={saveProduct}>{editingId ? <><Save/>Salvar alterações</> : <>Salvar</>}</button>{editingId && <button className="secondary wide" onClick={resetForm}>Cancelar edição</button>}</div></section>; }
function Customers({customers,setCustomers,notify}){ const [f,setF]=useState({name:'',phone:'',address:''}); function add(){ if(!f.name||!f.phone){ notify('Informe nome e WhatsApp do cliente.', 'error'); return; } setCustomers([...customers,{...f,id:String(Date.now())}]); setF({name:'',phone:'',address:''}); notify('Cliente salvo com sucesso!'); } function removeCustomer(id){ setCustomers(customers.filter(x=>x.id!==id)); notify('Cliente removido.'); } return <section className="split"><div className="panel"><h2>Clientes</h2>{customers.map(c=><div className="product" key={c.id}><div><strong>{c.name}</strong><span>{c.phone} • {c.address}</span></div><button className="iconBtn" onClick={()=>removeCustomer(c.id)}><Trash2 size={16}/></button></div>)}</div><div className="panel"><h2>Novo cliente</h2><label>Nome<input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label><label>WhatsApp<input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></label><label>Local<input value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></label><button className="primary wide" onClick={add}>Salvar</button></div></section>; }
function Config({settings,setSettings,notify}){ const [f,setF]=useState(settings); function saveSettings(){ setSettings({...f,goal:Number(f.goal)}); notify('Configurações salvas com sucesso!'); } return <section className="panel narrow"><h2>Configurações</h2><label>Nome do projeto<input value={f.coupleName} onChange={e=>setF({...f,coupleName:e.target.value})}/></label><label>Nome da venda<input value={f.sellerName} onChange={e=>setF({...f,sellerName:e.target.value})}/></label><label>Data do casamento<input type="date" value={f.weddingDate} onChange={e=>setF({...f,weddingDate:e.target.value})}/></label><label>Meta<input type="number" value={f.goal} onChange={e=>setF({...f,goal:e.target.value})}/></label><label>Chave Pix<input value={f.pixKey} onChange={e=>setF({...f,pixKey:e.target.value})}/></label><button className="primary wide" onClick={saveSettings}>Salvar configurações</button></section>; }
createRoot(document.getElementById('root')).render(<App />);
