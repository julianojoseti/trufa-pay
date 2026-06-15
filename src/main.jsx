import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Candy, Users, Package, ShoppingCart, MessageCircle, Plus, Search, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Trash2, Heart, CalendarDays, Target, Settings, Download, History, LogOut, Lock, UserPlus, Database, WifiOff, Menu, X } from 'lucide-react';
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
        const { initializeApp } = await import('firebase/app');
        const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
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
  return <div className="loginPage"><div className="loginCard">
    <div className="loginBrand"><div className="logo"><Candy/></div><div><strong>TrufaPay</strong><span>Projeto Casamento 💒</span></div></div>
    <h1>{mode === 'login' ? 'Entrar' : 'Criar acesso'}</h1>
    <p>{hasFirebase ? 'Login real com Firebase.' : 'Modo demo/local ativo. Configure o .env para usar Firebase.'}</p>
    {mode === 'register' && <label>Nome<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
    <label>E-mail<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    <label>Senha<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
    {error && <div className="loginError">{error}</div>}
    <button className="primary wide" onClick={submit}><Lock size={18}/>{mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
    <button className="secondary wide" onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}><UserPlus size={18}/>{mode === 'login' ? 'Criar novo acesso' : 'Já tenho acesso'}</button>
  </div></div>;
}

function App() {
  const [user, setUser] = useState(() => load('tp_session', null));
  const [screen, setScreen] = useState('dashboard');
  const [products, setProducts] = useState(() => load('tp_products', defaults.products));
  const [customers, setCustomers] = useState(() => load('tp_customers', defaults.customers));
  const [sales, setSales] = useState(() => load('tp_sales', defaults.sales));
  const [settings, setSettings] = useState(() => load('tp_settings', defaults.settings));
  const [cloudReady, setCloudReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(()=>{ user ? localStorage.setItem('tp_session', JSON.stringify(user)) : localStorage.removeItem('tp_session'); },[user]);
  useEffect(()=>localStorage.setItem('tp_products', JSON.stringify(products)),[products]);
  useEffect(()=>localStorage.setItem('tp_customers', JSON.stringify(customers)),[customers]);
  useEffect(()=>localStorage.setItem('tp_sales', JSON.stringify(sales)),[sales]);
  useEffect(()=>localStorage.setItem('tp_settings', JSON.stringify(settings)),[settings]);

  useEffect(() => { if (!user || !hasFirebase) return; (async () => {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, doc, getDoc, setDoc, onSnapshot } = await import('firebase/firestore');
    const app = initializeApp(firebaseConfig); const db = getFirestore(app); const ref = doc(db, 'workspaces', user.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { products, customers, sales, settings, updatedAt: new Date().toISOString() });
    const unsub = onSnapshot(ref, (s) => { const d=s.data(); if (!d) return; setProducts(d.products || defaults.products); setCustomers(d.customers || defaults.customers); setSales(d.sales || []); setSettings(d.settings || defaults.settings); setCloudReady(true); });
    return unsub;
  })(); }, [user?.id]);

  async function persist(next) { if (!user || !hasFirebase) return; const { initializeApp } = await import('firebase/app'); const { getFirestore, doc, setDoc } = await import('firebase/firestore'); const app = initializeApp(firebaseConfig); const db = getFirestore(app); await setDoc(doc(db,'workspaces',user.id), { products, customers, sales, settings, ...next, updatedAt:new Date().toISOString() }, { merge:true }); }
  const setProductsSync = (v) => { const next = typeof v === 'function' ? v(products) : v; setProducts(next); persist({products:next}); };
  const setCustomersSync = (v) => { const next = typeof v === 'function' ? v(customers) : v; setCustomers(next); persist({customers:next}); };
  const setSalesSync = (v) => { const next = typeof v === 'function' ? v(sales) : v; setSales(next); persist({sales:next}); };
  const setSettingsSync = (v) => { const next = typeof v === 'function' ? v(settings) : v; setSettings(next); persist({settings:next}); };

  const stats = useMemo(()=>{ const received=sales.filter(s=>s.paid).reduce((a,s)=>a+s.total,0); const pending=sales.filter(s=>!s.paid).reduce((a,s)=>a+s.total,0); const total=sales.reduce((a,s)=>a+s.total,0); const profit=sales.reduce((a,s)=>{ const p=products.find(x=>x.id===s.productId); return a + (s.total - ((p?.cost||0)*s.qty));},0); const progress=settings.goal?Math.min(100,received/settings.goal*100):0; const daysLeft=Math.max(0,Math.ceil((new Date(settings.weddingDate+'T00:00:00')-new Date())/86400000)); return {received,pending,total,profit,progress,remaining:Math.max(0,settings.goal-received),daysLeft}; },[sales,products,settings]);
  if (!user) return <Login onLogin={setUser}/>;

  function addSale(form) { const p=products.find(x=>x.id===form.productId); if(!p) return; const qty=Number(form.qty); const sale={ id:String(Date.now()), customerId:form.customerId, productId:p.id, qty, total:p.price*qty, paid:form.paid, method:form.paid?form.method:'Pendente', date:today(0), dueDate:form.dueDate || today(0), sellerName:user.name }; setSalesSync([sale, ...sales]); setProductsSync(products.map(x=>x.id===p.id?{...x,stock:Math.max(0,Number(x.stock||0)-qty)}:x)); }
  function markPaid(id){ setSalesSync(sales.map(s=>s.id===id?{...s,paid:true,method:'Pix'}:s)); }
  function delSale(id){ setSalesSync(sales.filter(s=>s.id!==id)); }
  function logout(){ setUser(null); }

  const menu = [['dashboard',Target,'Dashboard'],['vendas',ShoppingCart,'Nova venda'],['historico',History,'Histórico'],['clientes',Users,'Clientes'],['produtos',Package,'Sabores/Estoque'],['config',Settings,'Configurações']];
  return <div className="app">
    <button className="mobileMenuBtn" onClick={()=>setMobileMenuOpen(true)} aria-label="Abrir menu"><Menu size={22}/> Menu</button>
    {mobileMenuOpen && <div className="mobileOverlay" onClick={()=>setMobileMenuOpen(false)} />}
    <aside className={mobileMenuOpen ? 'open' : ''}>
      <button className="closeMenu" onClick={()=>setMobileMenuOpen(false)} aria-label="Fechar menu"><X size={22}/></button>
      <div className="brand"><div className="logo"><Candy/></div><div><strong>TrufaPay</strong><span>Casamento</span></div></div>
      {menu.map(([k,Icon,label])=><button key={k} className={screen===k?'active':''} onClick={()=>{setScreen(k);setMobileMenuOpen(false);}}><Icon size={20}/>{label}</button>)}
      <div className="sideFooter"><span>{user.online ? <><Database size={14}/> Online Firebase {cloudReady?'sincronizado':'conectando'}</> : <><WifiOff size={14}/> Modo demo/local</>}</span><strong>{user.name}</strong><button onClick={logout}><LogOut size={18}/>Sair</button></div>
    </aside>
    <main><header><div><h1>{settings.coupleName}</h1><p>Cada trufa vendida é um passo mais perto do grande dia.</p></div><button className="secondary" onClick={()=>exportCsv(sales,customers,products)}><Download size={18}/>Exportar CSV</button></header>{screen==='dashboard'&&<Dashboard stats={stats} sales={sales} products={products} customers={customers} settings={settings} markPaid={markPaid}/>} {screen==='vendas'&&<NewSale products={products} customers={customers} onAdd={addSale}/>} {screen==='historico'&&<HistoryPage sales={sales} products={products} customers={customers} markPaid={markPaid} delSale={delSale} settings={settings}/>} {screen==='clientes'&&<Customers customers={customers} setCustomers={setCustomersSync}/>} {screen==='produtos'&&<Products products={products} setProducts={setProductsSync}/>} {screen==='config'&&<Config settings={settings} setSettings={setSettingsSync}/>}</main>
  </div>;
}
function exportCsv(sales,customers,products){ saveCsv('vendas-trufapay.csv', [['Data','Cliente','Produto','Qtd','Total','Status','Vendedor'], ...sales.map(s=>[s.date, customers.find(c=>c.id===s.customerId)?.name, products.find(p=>p.id===s.productId)?.name, s.qty, s.total, s.paid?'Pago':'Pendente', s.sellerName])]); }
function whats(s,c,pix){ const text=`Olá ${c?.name || ''}! Tudo bem? 😊\n\nPassando para lembrar do pagamento das trufas.\nValor: ${money(s.total)}\nPix: ${pix}\n\nMuito obrigado por ajudar no nosso projeto de casamento 💒❤️`; return `https://wa.me/${(c?.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(text)}`; }
function Dashboard({stats,sales,products,customers,settings,markPaid}){ const pending=sales.filter(s=>!s.paid).slice(0,5); return <><section className="hero"><div><span className="tag"><Heart size={18}/>Meta do casamento</span><h2>{money(settings.goal)}</h2><div className="progress"><div style={{width:`${stats.progress}%`}}/></div><p>{money(stats.received)} arrecadado • faltam {money(stats.remaining)} • {stats.progress.toFixed(1)}%</p></div><div className="days"><CalendarDays/><strong>{stats.daysLeft}</strong><span>dias restantes</span></div></section><section className="grid4"><Card icon={DollarSign} title="Recebido" value={money(stats.received)}/><Card icon={Clock} title="Pendente" value={money(stats.pending)}/><Card icon={TrendingUp} title="Lucro estimado" value={money(stats.profit)}/><Card icon={ShoppingCart} title="Total vendido" value={money(stats.total)}/></section><section className="split"><div className="panel"><h2>Pendências</h2>{pending.length?pending.map(s=><SaleRow key={s.id} s={s} p={products.find(p=>p.id===s.productId)} c={customers.find(c=>c.id===s.customerId)} settings={settings} markPaid={markPaid}/>):<p className="empty">Nenhuma pendência.</p>}</div><div className="panel"><h2>Alertas de estoque</h2>{products.filter(p=>p.stock<=p.minStock).map(p=><div className="alert" key={p.id}><AlertCircle/><div><strong>{p.name}</strong><span>Saldo baixo: {p.stock}</span></div></div>)}</div></section></>; }
function Card({icon:Icon,title,value}){ return <div className="card"><div className="cardIcon"><Icon/></div><span>{title}</span><strong>{value}</strong></div>; }
function SaleRow({s,p,c,settings,markPaid,delSale}){ return <div className="row"><div><strong>{c?.name}</strong><span>{p?.name} • {s.qty} un • {s.date}</span></div><b>{money(s.total)}</b><em className={s.paid?'paid':'pending'}>{s.paid?'Pago':'Pendente'}</em>{!s.paid&&<a className="whats" target="_blank" href={whats(s,c,settings.pixKey)}><MessageCircle size={16}/>Cobrar</a>}{!s.paid&&<button className="mini" onClick={()=>markPaid(s.id)}><CheckCircle2 size={16}/>Pago</button>}{delSale&&<button className="iconBtn" onClick={()=>delSale(s.id)}><Trash2 size={16}/></button>}</div>; }
function NewSale({products,customers,onAdd}){ const [f,setF]=useState({customerId:customers[0]?.id||'',productId:products[0]?.id||'',qty:1,paid:true,method:'Pix',dueDate:today(0)}); const p=products.find(x=>x.id===f.productId); return <section className="panel narrow"><h2>Nova venda</h2><label>Cliente<select value={f.customerId} onChange={e=>setF({...f,customerId:e.target.value})}>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Sabor<select value={f.productId} onChange={e=>setF({...f,productId:e.target.value})}>{products.map(p=><option key={p.id} value={p.id}>{p.name} - {money(p.price)} / estoque {p.stock}</option>)}</select></label><label>Quantidade<input type="number" min="1" value={f.qty} onChange={e=>setF({...f,qty:e.target.value})}/></label><div className="toggle"><button className={f.paid?'active':''} onClick={()=>setF({...f,paid:true})}>Pago</button><button className={!f.paid?'active':''} onClick={()=>setF({...f,paid:false})}>Pendente</button></div>{!f.paid&&<label>Vencimento<input type="date" value={f.dueDate} onChange={e=>setF({...f,dueDate:e.target.value})}/></label>}<div className="totalBox"><span>Total</span><strong>{money((p?.price||0)*Number(f.qty||0))}</strong></div><button className="primary wide" onClick={()=>onAdd(f)}><Plus/>Registrar venda</button></section>; }
function HistoryPage({sales,products,customers,markPaid,delSale,settings}){ const [q,setQ]=useState(''); const [status,setStatus]=useState('todos'); const filtered=sales.filter(s=>{ const c=customers.find(x=>x.id===s.customerId)?.name||''; const p=products.find(x=>x.id===s.productId)?.name||''; return (status==='todos'||(status==='pago'?s.paid:!s.paid)) && (c+p+s.date).toLowerCase().includes(q.toLowerCase()); }); return <section className="panel"><div className="historyTop"><h2><History/>Histórico de vendas</h2><button className="secondary" onClick={()=>exportCsv(filtered,customers,products)}><Download size={18}/>Exportar filtrado</button></div><div className="filters"><div className="search"><Search/><input placeholder="Buscar cliente, sabor ou data" value={q} onChange={e=>setQ(e.target.value)}/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="todos">Todos</option><option value="pago">Pagos</option><option value="pendente">Pendentes</option></select></div><div className="table">{filtered.map(s=><SaleRow key={s.id} s={s} p={products.find(p=>p.id===s.productId)} c={customers.find(c=>c.id===s.customerId)} settings={settings} markPaid={markPaid} delSale={delSale}/>)}</div></section>; }
function Products({products,setProducts}){ const [f,setF]=useState({name:'',price:'',cost:'',stock:'',minStock:10}); function add(){ if(!f.name) return; setProducts([...products,{...f,id:String(Date.now()),price:Number(f.price),cost:Number(f.cost),stock:Number(f.stock),minStock:Number(f.minStock)}]); setF({name:'',price:'',cost:'',stock:'',minStock:10}); } return <section className="split"><div className="panel"><h2>Sabores e estoque</h2>{products.map(p=><div className="product" key={p.id}><div><strong>{p.name}</strong><span>Venda {money(p.price)} • Custo {money(p.cost)} • Estoque {p.stock}</span></div><button className="iconBtn" onClick={()=>setProducts(products.filter(x=>x.id!==p.id))}><Trash2 size={16}/></button></div>)}</div><div className="panel"><h2>Adicionar sabor</h2>{['name','price','cost','stock','minStock'].map(k=><label key={k}>{k==='name'?'Nome':k==='price'?'Preço':k==='cost'?'Custo':k==='stock'?'Estoque':'Estoque mínimo'}<input type={k==='name'?'text':'number'} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}<button className="primary wide" onClick={add}>Salvar</button></div></section>; }
function Customers({customers,setCustomers}){ const [f,setF]=useState({name:'',phone:'',address:''}); function add(){ if(!f.name||!f.phone) return; setCustomers([...customers,{...f,id:String(Date.now())}]); setF({name:'',phone:'',address:''}); } return <section className="split"><div className="panel"><h2>Clientes</h2>{customers.map(c=><div className="product" key={c.id}><div><strong>{c.name}</strong><span>{c.phone} • {c.address}</span></div><button className="iconBtn" onClick={()=>setCustomers(customers.filter(x=>x.id!==c.id))}><Trash2 size={16}/></button></div>)}</div><div className="panel"><h2>Novo cliente</h2><label>Nome<input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label><label>WhatsApp<input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></label><label>Local<input value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></label><button className="primary wide" onClick={add}>Salvar</button></div></section>; }
function Config({settings,setSettings}){ const [f,setF]=useState(settings); return <section className="panel narrow"><h2>Configurações</h2><label>Nome do projeto<input value={f.coupleName} onChange={e=>setF({...f,coupleName:e.target.value})}/></label><label>Nome da venda<input value={f.sellerName} onChange={e=>setF({...f,sellerName:e.target.value})}/></label><label>Data do casamento<input type="date" value={f.weddingDate} onChange={e=>setF({...f,weddingDate:e.target.value})}/></label><label>Meta<input type="number" value={f.goal} onChange={e=>setF({...f,goal:e.target.value})}/></label><label>Chave Pix<input value={f.pixKey} onChange={e=>setF({...f,pixKey:e.target.value})}/></label><button className="primary wide" onClick={()=>setSettings({...f,goal:Number(f.goal)})}>Salvar configurações</button></section>; }
createRoot(document.getElementById('root')).render(<App />);
