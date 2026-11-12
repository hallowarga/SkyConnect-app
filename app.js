const rp=n=>'Rp '+Number(n).toLocaleString('id-ID');
let db={customers:[],pay:[],sal:[],reg:[],addons:[],plans:[],catalog:[],cs:{wa:'',jam:''},promo:{a:'',b:'',c:''},news:[],rek:[],payNote:'',qris:''};
let me=null,admin=false,sup=false,guest=false,flt='all',lastReg=null,cart={},topAmt=0,tab='home',modal='';
const cust=()=>db.customers.find(c=>c.id===me);
const total=c=>c.harga+c.addons.reduce((s,i)=>s+((db.addons.find(a=>a.id===i)||{}).price||0),0);
const late=c=>!c.paid&&c.due<today();
const $=h=>document.getElementById('app').innerHTML=h;
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));






function billView(){
 const c=cust(),t=total(c);
 return `<h2>Tagihan & layanan</h2>
 ${c.iso?`<div class="alert">Layanan Anda sedang terisolir karena tagihan belum dibayar. Bayar sekarang, layanan aktif kembali otomatis.</div>`:late(c)?`<div class="alert">Tagihan lewat jatuh tempo. Segera bayar sebelum layanan diisolir.</div>`:''}
 <div class="bhero"><small>ID Pengguna WiFi</small><div style="font-weight:800;font-size:18px">${c.id}</div>
 <small>Tagihan bulan ini</small><div class="big">${c.paid?'Lunas':rp(t)}</div>
 ${c.paid?`<small>Terima kasih, pembayaran sudah diterima.</small>`:`<button class="btn" style="background:var(--amber);color:#1B1400" onclick="modal=payModal();render()">Bayar sekarang</button>`}</div>
 <div class="card row"><div><div class="mut">Saldo</div><div style="font-weight:800;font-size:20px">${rp(c.saldo||0)}</div></div><button class="btn alt sm" onclick="modal=topModal();render()">Isi saldo</button></div>${salHist(c)}
 <div class="card"><div class="row"><b>Status layanan</b><span class="pill ${c.iso?'bad':'ok'}">${c.iso?'Terisolir':'Aktif'}</span></div>
 <div class="mut" style="margin-top:6px">Paket ${esc(c.paket)} · jatuh tempo ${c.due.split('-').reverse().join('/')}</div></div>
 <div class="card"><b>Rincian tagihan</b>
 <div class="row mut" style="margin-top:8px"><span>${esc(c.paket)}</span><span>${rp(c.harga)}</span></div>
 ${c.addons.map(i=>{const a=db.addons.find(x=>x.id===i);return a?`<div class="row mut"><span>${esc(a.name)}</span><span>${rp(a.price)}</span></div>`:''}).join('')}
 <div class="row" style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px"><b>Total</b><b>${rp(t)}</b></div></div>
 <div class="card mut">Info: tagihan yang melewati jatuh tempo akan diisolir. Setelah pembayaran terverifikasi, layanan diaktifkan kembali.</div>`;
}
function payModal(){
 const c=cust();
 return `<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet"><h3>Pilih cara bayar</h3><p class="mut">Total ${rp(total(c))}</p>
 ${(c.saldo||0)>=total(c)?`<button class="opt" onclick="pinModal()"><b>Saldo</b> (tersedia ${rp(c.saldo)})</button>`:`<p class="mut">Saldo ${rp(c.saldo||0)} belum cukup. Isi saldo dulu atau pilih cara lain.</p>`}<button class="opt" onclick="modal=transferModal('bayar');render()"><b>Transfer bank / e-wallet</b><div class="mut">Lihat rekening, lalu konfirmasi via WhatsApp</div></button>
 <p class="mut">Setelah transfer, admin memverifikasi dan menandai tagihan lunas.</p></div></div>`;
}


function addons(){
 const c=cust();
 return `<h2>Add-on layanan</h2><p class="mut">Aktifkan tambahan sesuai kebutuhan. Biaya masuk ke tagihan bulan berikutnya.</p>
 ${db.addons.map(a=>`<div class="card row"><div><b>${esc(a.name)}</b><div class="mut">${esc(a.desc)}</div><div class="tag">${rp(a.price)}/bulan</div></div>
 <label class="sw"><input type="checkbox" aria-label="${esc(a.name)}" ${c.addons.includes(a.id)?'checked':''} onchange="togAdd('${a.id}',this.checked)"><span></span></label></div>`).join('')||'<div class="card mut">Belum ada add-on.</div>'}`;
}


function catalog(){
 return `<h2>Katalog produk & jasa</h2>${cartBar()}${db.catalog.map((p,i)=>`<div class="card"><b>${esc(p.n)}</b><div class="tag">${esc(p.p)}</div><p class="mut" style="margin:6px 0 10px">${esc(p.d)}</p>
 ${admin?'':`<button class="btn sm" onclick="addCart(${i})">Tambah ke keranjang</button>`}</div>`).join('')}`;
}

function adminView(){
 return `${regNote()}${custHead()}<p class="mut">Belum bayar tampil di atas. Nyalakan isolir untuk memutus layanan yang menunggak.</p>
 ${custList().map(c=>`<div class="card"><div class="row"><div><b>${esc(c.name)}</b><div class="mut">${c.id} · ${c.paid?'Lunas':'Belum bayar '+rp(total(c))}</div></div>
 <div style="text-align:center"><label class="sw danger"><input type="checkbox" aria-label="Isolir ${esc(c.name)}" ${c.iso?'checked':''} onchange="iso('${c.id}',this.checked)"><span></span></label><div class="mut" style="font-size:11px">Isolir</div></div></div><div class="mut" style="margin-top:6px">${esc(c.paket)} · ${rp(c.harga)} · jatuh tempo ${fd(c.due)}</div><div class="row" style="margin-top:10px;justify-content:flex-start">${c.paid?`<span class="pill ok">Lunas</span><button class="btn alt sm" onclick="unpaid('${c.id}')">Batalkan</button>`:`<button class="btn sm" onclick="markPaid('${c.id}')">Tandai lunas</button>`}<button class="btn alt sm" onclick="editCust('${c.id}')">Ubah data</button></div><div class="row" style="margin-top:8px;justify-content:flex-start;flex-wrap:wrap"><button class="btn alt sm" onclick="saldoModal('${c.id}')">Saldo ${rp(c.saldo||0)}</button><button class="btn alt sm" onclick="resetPw('${c.id}')">Reset sandi</button><button class="btn alt sm" onclick="resetPin('${c.id}')">Reset PIN</button></div></div>`).join('')}<button class="btn" style="margin-bottom:10px" onclick="newCust()">+ Pelanggan baru</button>
 <h2>Kelola add-on</h2>
 ${db.addons.map(a=>`<div class="card"><div class="row"><b>${esc(a.name)}</b><button class="btn alt sm" onclick="delAdd('${a.id}')">Hapus</button></div>
 <label>Harga per bulan</label><input type="number" value="${a.price}" onchange="editPrice('${a.id}',this.value)"></div>`).join('')}
 <div class="card"><b>Tambah add-on baru</b><label for="nn">Nama</label><input id="nn"><label for="nd">Keterangan</label><input id="nd"><label for="np">Harga per bulan</label><input id="np" type="number">
 <button class="btn" onclick="newAdd()">Simpan add-on</button></div>`;
}




const MN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const today=()=>new Date(Date.now()+7*36e5).toISOString().slice(0,10);
const fd=d=>d.split('-').reverse().join('/');
const waLink=m=>`https://wa.me/${db.cs.wa}?text=${encodeURIComponent(m)}`;
function profile(){const c=cust();return `<h2>Profil saya</h2><div class="card"><label>ID Pengguna WiFi</label><input value="${c.id}" disabled><label for="pn">Nama</label><input id="pn" value="${esc(c.name)}"><label for="pp">No. WhatsApp</label><input id="pp" type="tel" value="${esc(c.phone||'')}"><label for="pa">Alamat pemasangan</label><input id="pa" value="${esc(c.addr||'')}"><div id="pmsg" class="mut" style="margin-bottom:8px"></div><button class="btn" onclick="saveProf()">Simpan perubahan</button></div>${secBox()}<button class="btn alt" onclick="logout()">Keluar</button>`}


function rekap(){const P=db.pay.filter(x=>!x.noinc).sort((a,b)=>b.date.localeCompare(a.date));const m=today().slice(0,7);const sum=a=>a.reduce((s,x)=>s+x.amount,0);const mon=P.filter(x=>x.date.startsWith(m));const by={};P.forEach(x=>{const k=x.date.slice(0,7);by[k]=(by[k]||0)+x.amount});const bl=db.customers.filter(c=>!c.paid);
return `<h2>Rekap pemasukan</h2><div class="hero"><small>Pemasukan bulan ini</small><div class="big">${rp(sum(mon))}</div><small>${mon.length} pembayaran. Belum masuk ${rp(bl.reduce((s,c)=>s+total(c),0))} dari ${bl.length} pelanggan.</small></div><div class="card"><b>Per bulan</b>${Object.keys(by).sort().reverse().map(k=>`<div class="row mut" style="margin-top:6px"><span>${MN[+k.slice(5)-1]} ${k.slice(0,4)}</span><b style="color:var(--ink)">${rp(by[k])}</b></div>`).join('')}</div><div class="card"><b>Riwayat pembayaran</b>${P.map(x=>`<div class="row" style="margin-top:8px"><div>${esc(x.name)}<div class="mut">${fd(x.date)} · ${esc(x.method)}</div></div><b>${rp(x.amount)}</b></div>`).join('')||'<p class="mut">Belum ada pembayaran.</p>'}</div>`}
function settings(){return newsBox()+planBox()+`<h2>Pengaturan CS</h2><div class="card"><label for="cw">Nomor WhatsApp CS (format 628xxx)</label><input id="cw" type="tel" value="${esc(db.cs.wa)}" placeholder="6281234567890"><label for="cj">Jam layanan</label><input id="cj" value="${esc(db.cs.jam||'')}"><div id="cmsg" class="mut" style="margin-bottom:8px"></div><button class="btn" onclick="saveCS()">Simpan</button></div>`}

function editCust(id){const c=db.customers.find(x=>x.id===id);modal=`<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet" style="max-height:90vh;overflow:auto"><h3>Ubah ${c.id}</h3><label for="en">Nama</label><input id="en" value="${esc(c.name)}"><label for="ep">Paket</label><input id="ep" value="${esc(c.paket)}"><label for="eh">Harga paket per bulan</label><input id="eh" type="number" value="${c.harga}"><label for="ed">Tanggal jatuh tempo</label><input id="ed" type="date" value="${c.due}"><label for="es">Status tagihan</label><select id="es"><option value="0" ${c.paid?'':'selected'}>Belum bayar</option><option value="1" ${c.paid?'selected':''}>Lunas</option></select><button class="btn" onclick="saveCust('${id}')">Simpan</button></div></div>`;render()}


const nz=p=>p.replace(/\D/g,'').replace(/^0/,'62');
function topModal(){return `<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet"><h3>Isi saldo</h3><label for="tn">Nominal</label><select id="tn">${[50000,100000,200000,500000].map(v=>`<option value="${v}">${rp(v)}</option>`).join('')}</select><button class="btn" onclick="topAmt=Number(tn.value);modal=transferModal('topup');render()">Lanjut: lihat rekening</button><p class="mut">Saldo bertambah setelah admin memverifikasi transfer Anda.</p></div></div>`}

function custList(){return db.customers.filter(c=>flt==='all'||(flt==='paid'?c.paid:!c.paid)).sort((a,b)=>a.paid-b.paid||a.due.localeCompare(b.due)||a.name.localeCompare(b.name))}
function custHead(){const n=db.customers.length,p=db.customers.filter(c=>c.paid).length;const f=(k,l)=>`<button class="chip ${flt===k?'on':''}" onclick="flt='${k}';render()">${l}</button>`;return `<h2>Pelanggan</h2><div class="chips">${f('all','Semua '+n)}${f('unpaid','Belum bayar '+(n-p))}${f('paid','Lunas '+p)}</div>`}


function gh(){return `<h2>Daftar harga</h2><p class="mut">Harga per bulan. Biaya pasang dan survei lokasi dikonfirmasi tim kami.</p>${db.plans.map(p=>`<div class="card row"><div><b>${esc(p.n)}</b><div class="mut">${esc(p.d||'')}</div></div><b>${rp(p.p)}</b></div>`).join('')}<h2>Add-on</h2>${db.addons.map(a=>`<div class="card row"><div><b>${esc(a.name)}</b><div class="mut">${esc(a.desc)}</div></div><b>${rp(a.price)}</b></div>`).join('')}<button class="btn" onclick="tab='reg';render()">Daftar sekarang</button>${catalog()}`}
function regView(){return `<h2>Daftar pelanggan baru</h2><div class="card"><label for="rgn">Nama lengkap</label><input id="rgn"><label for="rgw">No. WhatsApp</label><input id="rgw" type="tel"><label for="rga">Alamat pemasangan</label><input id="rga"><label for="rgp">Buat sandi (min. 6 karakter)</label><input id="rgp" type="password"><label for="rgk">Pilih paket</label><select id="rgk">${db.plans.map(p=>`<option>${esc(p.n)}</option>`).join('')}</select><div id="rgmsg" class="mut" style="color:var(--warn);margin-bottom:8px"></div><button class="btn" onclick="sendReg()">Kirim pendaftaran</button></div>`}

function regOk(){const r=lastReg;return `<h2>Pendaftaran terkirim</h2><div class="card"><p>Terima kasih, ${esc(r.name)}. Tim SkyConnect akan menghubungi Anda lewat WhatsApp untuk jadwal survei dan ID pengguna.</p>${db.cs.wa?`<a class="btn" style="display:block;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="${waLink('Halo SkyConnect, saya baru mendaftar. Nama: '+r.name+', paket: '+r.paket+', alamat: '+r.addr)}">Percepat via WhatsApp CS</a>`:''}</div>`}
function regBox(){if(!db.reg.length)return '';return `<h2>Pendaftaran baru (${db.reg.length})</h2>${db.reg.map(r=>`<div class="card"><b>${esc(r.name)}</b><div class="mut">${esc(r.paket)} · ${esc(r.phone)}<br>${esc(r.addr)}</div><div class="row" style="margin-top:10px;justify-content:flex-start"><button class="btn sm" onclick="approve('${r.id}')">Setujui</button><button class="btn alt sm" onclick="rejectReg('${r.id}')">Tolak</button></div></div>`).join('')}`}


function planBox(){return `<h2>Harga paket internet</h2>${db.plans.map((p,i)=>`<div class="card"><div class="row"><b>${esc(p.n)}</b><button class="btn alt sm" onclick="delPlan(${i})">Hapus</button></div><label>Harga per bulan</label><input type="number" value="${p.p}" onchange="db.plans[${i}].p=Number(this.value)||0;cfgSet('plans')"></div>`).join('')}<div class="card"><label for="pln">Paket baru</label><input id="pln" placeholder="Home 100 Mbps"><label for="plp">Harga per bulan</label><input id="plp" type="number"><button class="btn" onclick="addPlan()">Tambah paket</button></div>`}


function sendWA(msg,eid,clr){const ok=!!db.cs.wa;modal=`<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet" style="max-height:90vh;overflow:auto"><h3>Kirim via WhatsApp</h3><p class="mut">Periksa pesan di bawah, lalu ketuk tombol Buka WhatsApp.</p><textarea readonly style="width:100%;height:150px;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;margin-bottom:10px">${esc(msg)}</textarea>${ok?`<a class="btn" style="display:block;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="${waLink(msg)}" onclick="afterWA(${!!clr})">Buka WhatsApp</a>`:'<div class="alert" style="margin:0">Nomor WhatsApp CS belum diatur. Admin perlu mengisinya di tab Pengaturan.</div>'}</div></div>`;render();return ok}
function afterWA(clr){setTimeout(()=>{modal='';if(clr){cart={};tab=guest?'gh':'cat'}render()},400)}

function logSal(c,v,note){db.sal.push({date:today(),id:c.id,t:new Date().toTimeString().slice(0,5),amt:v,note,bal:c.saldo||0})}
function salHist(c){const L=db.sal.filter(x=>x.id===c.id).slice(-3).reverse();if(!L.length)return '';return `<div class="card"><b>Riwayat saldo</b>${L.map(x=>`<div class="row mut" style="margin-top:6px"><span>${fd(x.date)} · ${esc(x.note)}</span><b style="color:${x.amt<0?'var(--warn)':'var(--ok)'}">${x.amt<0?'-':'+'}${rp(Math.abs(x.amt))}</b></div>`).join('')}</div>`}
function secBox(){const c=cust();return `<div class="card"><b>Ubah sandi</b><label for="so">Sandi lama</label><input id="so" type="password"><label for="sn">Sandi baru (min. 6 karakter)</label><input id="sn" type="password"><div id="smsg" class="mut" style="margin-bottom:8px"></div><button class="btn" onclick="savePw()">Ubah sandi</button></div><div class="card"><b>PIN transaksi saldo</b><p class="mut">${c.pin?'PIN sudah dibuat.':'Belum ada PIN. Anda akan diminta membuatnya saat pertama bayar pakai saldo.'}</p>${c.pin?`<label for="po">PIN lama</label><input id="po" type="password" inputmode="numeric" maxlength="6"><label for="pnn">PIN baru (6 angka)</label><input id="pnn" type="password" inputmode="numeric" maxlength="6"><div id="pmsg2" class="mut" style="margin-bottom:8px"></div><button class="btn" onclick="savePinNew()">Ubah PIN</button><p class="mut">Lupa PIN? Minta reset ke admin lewat menu Bantuan.</p>`:''}</div>`}


function pinModal(){const c=cust();const has=!!c.pin;modal=`<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet"><h3>${has?'Masukkan PIN transaksi':'Buat PIN transaksi'}</h3><p class="mut">${has?'PIN 6 angka untuk membayar dengan saldo.':'Buat PIN 6 angka untuk mengamankan saldo Anda.'}</p><input id="pk1" type="password" inputmode="numeric" maxlength="6" placeholder="PIN 6 angka">${has?'':'<input id="pk2" type="password" inputmode="numeric" maxlength="6" placeholder="Ulangi PIN">'}<div id="pkm" class="mut" style="color:var(--warn);margin-bottom:8px"></div><button class="btn" onclick="checkPin()">${has?'Bayar':'Simpan PIN & bayar'}</button></div></div>`;render()}

function transferModal(kind){const c=cust();const amt=kind==='bayar'?total(c):topAmt;return `<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet" style="max-height:90vh;overflow:auto"><h3>${kind==='bayar'?'Transfer pembayaran':'Transfer isi saldo'}</h3><p class="mut">Nominal: <b>${rp(amt)}</b>. ${esc(db.payNote||'')}</p>${db.rek.map(r=>`<div class="card" style="margin-bottom:8px"><b>${esc(r.bank)}</b><div style="font-size:18px;font-weight:800">${esc(r.no)}</div><div class="mut">a.n. ${esc(r.an)}</div></div>`).join('')||'<div class="alert">Rekening belum diatur admin.</div>'}<div id="tmsg" class="mut" style="color:var(--warn);margin-bottom:8px"></div><button class="btn" onclick="confirmTf('${kind}',${amt})">Saya sudah transfer, kirim konfirmasi via WA</button></div></div>`}
function confirmTf(kind,amt){const c=cust();sendWA(['*'+(kind==='bayar'?'KONFIRMASI PEMBAYARAN':'KONFIRMASI ISI SALDO')+' - SkyConnect*','ID Pelanggan: '+c.id,'Nama: '+c.name,'Nominal: '+rp(amt),'Tanggal: '+fd(today()),'Bukti transfer saya lampirkan di chat ini.'].join('\n'),'tmsg')}
function saldoModal(id){const c=db.customers.find(x=>x.id===id);modal=`<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet"><h3>Saldo ${esc(c.name)}</h3><p class="mut">Saldo sekarang ${rp(c.saldo||0)}</p><label for="sa">Nominal</label><input id="sa" type="number" inputmode="numeric"><label for="sno">Catatan</label><input id="sno" placeholder="contoh: transfer BCA"><label class="row" style="justify-content:flex-start;margin-bottom:8px"><input id="sci" type="checkbox" checked style="width:auto;margin:0"> Catat sebagai pemasukan (saat tambah saldo)</label><div id="sm" class="mut" style="color:var(--warn);margin-bottom:8px"></div><div class="row"><button class="btn" onclick="adjSaldo('${id}',1)">Tambah</button><button class="btn alt" onclick="adjSaldo('${id}',-1)">Kurangi</button></div></div></div>`;render()}



function regNote(){const n=db.reg.length;if(!n)return '';return sup?`<div class="alert">${n} pendaftaran menunggu. Setujui atau tolak di tab Super.</div>`:`<p class="mut">${n} pendaftaran menunggu persetujuan super admin.</p>`}
function superView(){return regBox()+`<h2>Rekening pembayaran</h2>${db.rek.map((r,i)=>`<div class="card"><div class="row"><b>${esc(r.bank)}</b><button class="btn alt sm" onclick="delRek(${i})">Hapus</button></div><label>Nomor rekening / e-wallet</label><input value="${esc(r.no)}" onchange="db.rek[${i}].no=this.value.trim();cfgSet('rek')"><label>Atas nama</label><input value="${esc(r.an)}" onchange="db.rek[${i}].an=this.value.trim();cfgSet('rek')"></div>`).join('')}<div class="card"><b>Tambah rekening</b><label for="rb">Bank / e-wallet</label><input id="rb" placeholder="BRI / OVO"><label for="rno">Nomor</label><input id="rno"><label for="ran">Atas nama</label><input id="ran"><button class="btn" onclick="addRek()">Tambah rekening</button></div><div class="card"><label>Instruksi pembayaran (tampil ke pelanggan)</label><input value="${esc(db.payNote||'')}" onchange="db.payNote=this.value;cfgSet('payNote')"></div>${qrisBox()}<h2>Akun admin</h2><div class="card"><label for="apA">PIN admin baru</label><input id="apA" type="password"><label for="apS">Sandi super admin baru</label><input id="apS" type="password"><div id="amsg" class="mut" style="margin-bottom:8px"></div><button class="btn" onclick="saveAuth()">Simpan</button><p class="mut">Kosongkan kolom yang tidak ingin diubah.</p></div>`}



function addCart(i){cart[i]=(cart[i]||0)+1;render()}
function qty(i,d){cart[i]=(cart[i]||0)+d;if(cart[i]<=0)delete cart[i];if(!Object.keys(cart).length)tab=guest?'gh':'cat';render()}
function cartBar(){const n=Object.values(cart).reduce((s,x)=>s+x,0);return n?`<button class="btn" style="margin-bottom:10px" onclick="tab='cart';render()">Keranjang (${n} item) · Checkout</button>`:''}
function cartView(){const c=me?cust():null;const ks=Object.keys(cart);return `<h2>Keranjang</h2>${ks.map(k=>{const p=db.catalog[k];return `<div class="card row"><div><b>${esc(p.n)}</b><div class="tag">${esc(p.p)}</div></div><div class="row" style="gap:6px"><button class="chip" onclick="qty(${k},-1)">-</button><b>${cart[k]}</b><button class="chip" onclick="qty(${k},1)">+</button></div></div>`}).join('')}<div class="card"><label for="onm">Nama</label><input id="onm" value="${c?esc(c.name):''}"><label for="ow">No. WhatsApp</label><input id="ow" type="tel" value="${c?esc(c.phone||''):''}"><label for="oa">Alamat / lokasi pemasangan</label><input id="oa" value="${c?esc(c.addr||''):''}"><label for="ot">Catatan</label><input id="ot" placeholder="contoh: butuh survei dulu"><div id="omsg" class="mut" style="color:var(--warn);margin-bottom:8px"></div><button class="btn" onclick="sendOrder()">Kirim pesanan via WhatsApp</button></div><button class="btn alt" onclick="tab=guest?'gh':'cat';render()">Kembali ke katalog</button>`}
function sendOrder(){const c=me?cust():null;if(!onm.value.trim()||nz(ow.value).length<9||!oa.value.trim()){omsg.textContent='Isi nama, nomor WhatsApp, dan alamat.';return}const ks=Object.keys(cart);const L=ks.map((k,j)=>(j+1)+'. '+db.catalog[k].n+' x'+cart[k]+' ('+db.catalog[k].p+')');const msg=['*PESANAN BARU - SkyConnect*','Nama: '+onm.value.trim(),'ID Pelanggan: '+(c?c.id:'-'),'WhatsApp: '+ow.value.trim(),'Alamat: '+oa.value.trim(),'','Pesanan:'].concat(L,['','Catatan: '+(ot.value.trim()||'-'),'Tanggal: '+fd(today())]).join('\n');sendWA(msg,'omsg',true)}
function helpView(){const c=cust();const K=['Internet lambat / putus','Pembayaran / tagihan','Lupa sandi','Reset PIN transaksi','Pasang CCTV / layanan baru','Lainnya'];return `<h2>Bantuan</h2>${db.cs.wa?'':'<div class="alert">Nomor CS belum diatur oleh admin.</div>'}<p class="mut">${esc(db.cs.jam||'')}</p><div class="card"><label for="hk">Kategori</label><select id="hk">${K.map(k=>`<option ${k===helpPre?'selected':''}>${k}</option>`).join('')}</select><label for="ht">Jelaskan masalah Anda</label><input id="ht" placeholder="contoh: lampu LOS merah sejak pagi"><div id="hmsg" class="mut" style="color:var(--warn);margin-bottom:8px"></div><button class="btn" onclick="sendHelp()">Kirim ke CS via WhatsApp</button></div>`}
function sendHelp(){const c=cust();if(!ht.value.trim()){hmsg.textContent='Tulis dulu masalah Anda.';return}sendWA(['*BANTUAN - SkyConnect*','ID Pelanggan: '+c.id,'Nama: '+c.name,'Paket: '+c.paket,'Kategori: '+hk.value,'Keluhan: '+ht.value.trim(),'Tanggal: '+fd(today())].join('\n'),'hmsg')}
/* ===== Tampilan v2 (Beranda, navigasi, transaksi, notifikasi) ===== */
const LOGO='logo.png',MARK='mark.png';
let helpPre='';
const IC={
home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>',
wallet:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
send:'<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
scan:'<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
wifi:'<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
cctv:'<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
tool:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
mega:'<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
head:'<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
chev:'<path d="M9 18l6-6-6-6"/>'};
const ic=(n,s=24)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const fmtLong=d=>`${+d.slice(8)} ${MN[+d.slice(5,7)-1]} ${d.slice(0,4)}`;


function login(){
 $(`<div class="lg"><img class="logo" src="${LOGO}" alt="SkyConnect Technology">
 <div class="card lgc"><label for="uid">ID Pengguna WiFi</label><input id="uid" placeholder="Masukkan ID pengguna" autocapitalize="characters" autocomplete="username">
 <label for="pin">Sandi</label><input id="pin" type="password" placeholder="Masukkan sandi" autocomplete="current-password">
 <div id="err" class="mut" style="color:var(--warn);margin-bottom:8px"></div>
 <button class="btn" onclick="doLogin()">Masuk</button>
 <button class="chip" style="margin-top:10px" onclick="forgot()">Lupa sandi?</button></div>
 <div class="lgb"><button class="btn ghost" onclick="openGuest('gh')">Lihat daftar harga</button><button class="btn ghost" onclick="openGuest('reg')">Daftar jadi pelanggan</button></div></div>`);
 pin.onkeydown=e=>{if(e.key==='Enter')doLogin()};
}

function render(){
 const cu=!admin&&!guest&&me;
 const body=({home,bill:billView,trx:trxView,notif:notifView,add:addons,cat:catalog,adm:adminView,rek:rekap,set:settings,help:helpView,prof:profile,gh,reg:regView,regok:regOk,sup:superView,cart:cartView}[tab])();
 let top='',nav='';
 if(cu){
  if(tab!=='home')top=`<div class="row" style="margin-bottom:4px"><div class="brand"><img class="mk" src="${MARK}" alt="">Sky<b>Connect</b></div>${['trx','notif','prof'].includes(tab)?'':`<button class="btn alt sm" onclick="go('home')">Kembali</button>`}</div>`;
  nav=custNav();
 }else{
  const tabs=guest?[['gh','Harga'],['reg','Daftar']]:[['adm','Pelanggan'],['rek','Rekap'],['cat','Katalog'],['set','Pengaturan']].concat(sup?[['sup','Super']]:[]);
  top=`<div class="row"><div class="brand"><img class="mk" src="${MARK}" alt="">Sky<b>Connect</b></div><button class="btn alt sm" onclick="logout()">${guest?'Masuk':'Keluar'}</button></div>`;
  nav=`<nav><div>${tabs.map(t=>`<button class="${tab===t[0]?'on':''}" onclick="go('${t[0]}')">${t[1]}</button>`).join('')}</div></nav>`;
 }
 $(`${cu&&tab==='home'?body:`<div class="pg">${top}${body}</div>`}${nav}${modal}`);
}
function custNav(){
 const b=(k,i,l,d)=>`<button class="${tab===k?'on':''}" onclick="go('${k}')">${ic(i)}<span>${l}</span>${d?'<i class="dot"></i>':''}</button>`;
 return `<nav class="cn"><div>${b('home','home','Beranda')}${b('trx','file','Transaksi')}<span class="gap"></span>${b('notif','bell','Notifikasi',notifs().some(n=>n.k))}${b('prof','user','Profil')}</div><button class="fab" aria-label="Scan QRIS" onclick="modal=qrisModal();render()">${ic('scan',28)}</button></nav>`;
}

function home(){
 const c=cust(),on=!c.iso,P=db.promo;
 const mb=(c.paket.match(/(\d+)\s*Mbps/i)||[])[1];
 const last=db.sal.filter(x=>x.id===c.id&&x.amt>0&&!/^Transfer/.test(x.note)).slice(-1)[0];
 const QA=[['wallet','Bayar Tagihan',"go('bill')"],['send','Transfer Saldo',"tfModal()"],['file','Riwayat Transaksi',"go('trx')"],['scan','Scan QRIS',"modal=qrisModal();render()"]];
 const T=[['cctv','Layanan CCTV',"go('cat')"],['tool','Lapor Gangguan',"helpPre='Internet lambat / putus';go('help')"],['file','Info Tagihan',"go('bill')"],['mega','Pengumuman',"go('notif')"],['head','Bantuan',"helpPre='';go('help')"],['grid','Lainnya',"modal=moreModal();render()"]];
 return `<div class="top"><div class="row"><div class="brand"><img class="mk" src="${MARK}" alt=""><span>SKYCONNECT<small>TECHNOLOGY</small></span></div>
 <div class="row" style="gap:4px"><button class="ib" aria-label="Notifikasi" onclick="go('notif')">${ic('bell',26)}${notifs().some(n=>n.k)?'<i class="dot"></i>':''}</button><button class="ib" aria-label="Profil dan pengaturan" onclick="go('prof')">${ic('gear',26)}</button></div></div>
 <div class="greet"><div class="av">${ic('home',26)}</div><div><small>Selamat Datang,</small><h1>${esc(c.name)}</h1><small>Koneksi lebih mudah, hidup lebih nyaman</small></div></div></div>
 <div class="pg" style="padding-top:0">
 <div class="saldo"><div class="sl">${ic('wallet',44)}<div><small>Saldo Anda</small><div class="amt">${rp(c.saldo||0)}</div></div><button class="topup" onclick="modal=topModal();render()">Top Up +</button></div><div class="ln"></div><small>${last?'Terakhir Top Up : '+fmtLong(last.date)+(last.t?' • '+last.t:''):'Belum ada top up'}</small></div>
 ${c.iso?`<div class="alert">Layanan terisolir karena tagihan belum dibayar. Bayar sekarang, layanan aktif kembali otomatis.</div>`:late(c)?`<div class="alert">Tagihan lewat jatuh tempo. Segera bayar sebelum layanan diisolir.</div>`:''}
 <div class="qa">${QA.map(q=>`<button onclick="${q[2]}"><span class="gi">${ic(q[0],26)}</span>${q[1]}</button>`).join('')}</div>
 <button class="stat ${on?'':'off'}" onclick="go('bill')"><span class="sic">${ic('wifi',32)}</span><span><b>Status Internet</b> <span class="pill ${on?'ok':'bad'}">${on?'Online':'Terisolir'}</span><div class="sv">${on?'Terhubung dengan Baik':'Layanan Terputus'}</div><span class="mut">${on?(mb?'Kecepatan : '+mb+' Mbps':esc(c.paket)):'Bayar tagihan untuk mengaktifkan kembali'}</span></span><span class="chev">${ic('chev',22)}</span></button>
 <div class="tiles">${T.map(t=>`<button onclick="${t[2]}">${ic(t[0],34)}${t[1]}</button>`).join('')}</div>
 <div class="promo">${ic('mega',46)}<div><b>${esc(P.a)}</b><div class="hl">${esc(P.b)}</div><i>${esc(P.c)}</i></div><button class="btn sm lite" onclick="promoWA()">Info Promo</button></div></div>`;
}
function promoWA(){const c=cust(),P=db.promo;sendWA(['*INFO PROMO - SkyConnect*','ID Pelanggan: '+c.id,'Nama: '+c.name,'Saya ingin tahu detail promo: '+P.a+' '+P.b].join('\n'),'')}
function moreModal(){return `<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet"><h3 style="margin-bottom:10px">Menu lainnya</h3><button class="opt" onclick="go('add')">Add-on layanan</button><button class="opt" onclick="go('cat')">Katalog produk & jasa</button><button class="opt" onclick="go('prof')">Profil, sandi, dan PIN</button></div></div>`}

function notifs(){const c=cust(),L=[];if(c.iso)L.push({t:'Layanan terisolir',b:'Tagihan belum dibayar. Bayar sekarang, layanan aktif kembali otomatis.',k:1});else if(late(c))L.push({t:'Tagihan lewat jatuh tempo',b:'Segera bayar '+rp(total(c))+' agar layanan tidak diisolir.',k:1});else if(!c.paid)L.push({t:'Tagihan bulan ini',b:rp(total(c))+' jatuh tempo '+fd(c.due)+'.'});db.news.slice().reverse().forEach(n=>L.push({t:n.t,b:n.b,d:n.d}));return L}
function notifView(){return `<h2>Notifikasi & pengumuman</h2>${notifs().map(n=>`<div class="card ${n.k?'bad':''}"><b>${esc(n.t)}</b><div class="mut" style="margin-top:4px">${esc(n.b)}</div>${n.d?`<div class="mut" style="font-size:12px;margin-top:6px">${fd(n.d)}</div>`:''}</div>`).join('')}`}
function trxView(){const c=cust(),A=[];db.sal.forEach((x,i)=>{if(x.id===c.id)A.push({d:x.date,t:x.t||'',i,n:x.note,a:x.amt})});db.pay.forEach((x,i)=>{if(x.id===c.id&&x.method==='Manual (admin)')A.push({d:x.date,t:'',i:1000+i,n:'Tagihan lunas (diverifikasi admin)',a:-x.amount})});A.sort((a,b)=>b.d.localeCompare(a.d)||b.i-a.i);return `<h2>Riwayat transaksi</h2>${A.length?A.map(x=>`<div class="card row"><div><b>${esc(x.n)}</b><div class="mut">${fd(x.d)}${x.t?' • '+x.t:''}</div></div><b style="color:${x.a<0?'var(--warn)':'var(--ok)'}">${x.a<0?'-':'+'}${rp(Math.abs(x.a))}</b></div>`).join(''):'<div class="card mut">Belum ada transaksi.</div>'}`}

function qrisModal(){const c=cust();return `<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet" style="max-height:90vh;overflow:auto"><h3>Scan QRIS</h3>${db.qris?`<img src="${db.qris}" alt="QRIS SkyConnect" style="width:100%;max-width:300px;display:block;margin:10px auto;border-radius:12px"><p class="mut">Scan dari m-banking atau e-wallet, lalu kirim bukti bayar ke CS.</p><button class="btn" onclick="sendWA(['*KONFIRMASI QRIS - SkyConnect*','ID Pelanggan: ${c.id}','Nama: ${esc(c.name)}','Tanggal: '+fd(today()),'Bukti pembayaran saya lampirkan di chat ini.'].join('\\n'),'')">Kirim bukti via WhatsApp</button>`:'<div class="alert" style="margin-top:10px">QRIS belum diatur admin.</div>'}</div></div>`}
function tfModal(){const c=cust(),has=!!c.pin;modal=`<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet" style="max-height:90vh;overflow:auto"><h3>Transfer saldo</h3><p class="mut">Saldo Anda ${rp(c.saldo||0)}</p><label for="tid">ID pelanggan tujuan</label><input id="tid" autocapitalize="characters"><label for="tnm">Nominal</label><input id="tnm" type="number" inputmode="numeric"><label for="pk1">${has?'PIN transaksi':'Buat PIN 6 angka'}</label><input id="pk1" type="password" inputmode="numeric" maxlength="6">${has?'':'<input id="pk2" type="password" inputmode="numeric" maxlength="6" placeholder="Ulangi PIN">'}<div id="pkm" class="mut" style="color:var(--warn);margin-bottom:8px"></div><button class="btn" onclick="doTf()">Kirim saldo</button></div></div>`;render()}


function qrisBox(){return `<h2>QRIS</h2><div class="card">${db.qris?`<img src="${db.qris}" alt="QRIS" style="width:100%;max-width:240px;display:block;margin-bottom:10px;border-radius:10px">`:'<p class="mut">Belum ada gambar QRIS.</p>'}<label for="qf">Unggah gambar QRIS (maks. 1 MB)</label><input id="qf" type="file" accept="image/*" onchange="upQris(this)"><div id="qm" class="mut" style="color:var(--warn);margin-bottom:8px"></div>${db.qris?`<button class="btn alt sm" onclick="db.qris='';cfgSet('qris',1)">Hapus QRIS</button>`:''}</div>`}

function newsBox(){const P=db.promo;return `<h2>Promo di beranda</h2><div class="card"><label for="pr1">Judul</label><input id="pr1" value="${esc(P.a)}"><label for="pr2">Highlight</label><input id="pr2" value="${esc(P.b)}"><label for="pr3">Keterangan</label><input id="pr3" value="${esc(P.c)}"><div id="prm" class="mut" style="margin-bottom:8px"></div><button class="btn" onclick="savePromo()">Simpan promo</button></div><h2>Pengumuman</h2>${db.news.map((n,i)=>`<div class="card"><div class="row"><b>${esc(n.t)}</b><button class="btn alt sm" onclick="delNews(${i})">Hapus</button></div><div class="mut">${esc(n.b)}</div></div>`).join('')}<div class="card"><label for="nt">Judul pengumuman</label><input id="nt"><label for="nb">Isi</label><input id="nb"><button class="btn" onclick="addNews()">Kirim pengumuman</button></div>`}




/* ===== Lapisan server (Supabase) ===== */
const CFG=window.SKY_CONFIG||{};
let TOKEN='',ROLE='',MYID='';
const ERR={AUTH:'Sesi habis. Silakan masuk lagi.',FORBIDDEN:'Akses ditolak.',INVALID:'Data tidak valid.',SALDO:'Saldo tidak cukup.',PIN:'PIN salah.',PINFMT:'PIN harus 6 angka.',PAID:'Tagihan sudah lunas.',NOTO:'ID tidak ditemukan.',OLDPW:'Sandi lama salah.',FULL:'Pendaftaran sedang penuh, hubungi CS.'};
const msg=e=>ERR[e.message]||(e.message==='NET'?'Gagal terhubung ke server. Periksa internet dan config.js.':'Kesalahan server: '+e.message);
function toast(t){let e=document.getElementById('toast');if(!e){e=document.createElement('div');e.id='toast';e.setAttribute('role','status');e.style.cssText='position:fixed;left:50%;bottom:100px;transform:translateX(-50%);background:#0B1F44;color:#fff;padding:12px 18px;border-radius:99px;z-index:20;max-width:90%;text-align:center;font-weight:600;font-size:14px';document.body.appendChild(e)}e.textContent=t;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',2800)}
async function rpc(fn,args){
 const h={'Content-Type':'application/json',apikey:CFG.key.trim()};
 if(CFG.key.startsWith('eyJ'))h.Authorization='Bearer '+CFG.key;
 let r;try{r=await fetch(new URL(CFG.url.trim()).origin+'/rest/v1/rpc/'+fn,{method:'POST',headers:h,body:JSON.stringify(args||{})})}catch(x){throw new Error('NET')}
 const j=await r.json().catch(()=>null);
 if(!r.ok)throw new Error((j&&j.message)||'NET');
 return j;
}
async function sync(){const s=await rpc('get_state',{p_token:TOKEN});Object.assign(db,s.cfg,{customers:s.customers,pay:s.pay,sal:s.sal,reg:s.reg});ROLE=s.role;MYID=s.id}
function fail(e){if(e.message==='AUTH')logout();toast(msg(e))}
async function act(fn,args,ok){try{await rpc(fn,Object.assign({p_token:TOKEN},args));await sync();if(ok)ok();render()}catch(e){fail(e)}}
async function cfgSet(k,rr){try{await rpc('a_cfg',{p_token:TOKEN,p_k:k,p_v:db[k]});toast('Tersimpan.');if(rr)render()}catch(e){fail(e)}}
async function refresh(){if(!TOKEN||guest)return;try{await sync();const a=document.activeElement;if(!modal&&!(a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)))render()}catch(e){if(e.message==='AUTH')logout()}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
setInterval(refresh,45000);
function go(t){tab=t;modal='';render();window.scrollTo(0,0);refresh()}

async function enter(){await sync();admin=ROLE!=='cust';sup=ROLE==='super';guest=false;me=admin?null:MYID;tab=admin?'adm':'home';render()}
async function boot(){
 if(!CFG.url||!CFG.key){$('<div class="pg"><div class="alert">Aplikasi belum dikonfigurasi. Isi file config.js dengan URL dan kunci Supabase.</div></div>');return}
 try{Object.assign(db,await rpc('public_state'))}catch(e){}
 let t='';try{t=localStorage.getItem('sky_t')||''}catch(e){}
 if(t){TOKEN=t;try{await enter();return}catch(e){TOKEN=''}}
 login();
}
async function doLogin(){
 const v=uid.value.trim(),p=pin.value;
 if(!v||!p){err.textContent='Isi ID dan sandi.';return}
 err.textContent='Memeriksa...';
 try{
  const r=await rpc('login',{p_id:v,p_pw:p});
  if(r.error){err.textContent=r.error==='LOCK'?'Terlalu banyak percobaan. Coba lagi 15 menit lagi.':'ID atau sandi salah. Ketuk Lupa sandi untuk meminta reset.';return}
  TOKEN=r.token;try{localStorage.setItem('sky_t',TOKEN)}catch(e){}
  await enter();
 }catch(e){err.textContent=msg(e)}
}
function logout(){
 if(TOKEN)rpc('logout',{p_token:TOKEN}).catch(()=>{});
 TOKEN='';ROLE='';me=null;admin=false;sup=false;guest=false;cart={};modal='';
 Object.assign(db,{customers:[],pay:[],sal:[],reg:[]});
 try{localStorage.removeItem('sky_t')}catch(e){}
 login();
}
function forgot(){const id=uid.value.trim().toUpperCase();if(!id){err.textContent='Isi ID Pengguna WiFi Anda dulu.';return}sendWA(['*RESET SANDI - SkyConnect*','ID Pelanggan: '+id,'Mohon reset sandi akun saya.'].join('\n'),'err')}
async function openGuest(t){guest=true;tab=t;try{Object.assign(db,await rpc('public_state'))}catch(e){}render()}

/* pelanggan */
function saveProf(){if(!pn.value.trim()){toast('Nama tidak boleh kosong.');return}act('c_profile',{p_name:pn.value,p_phone:pp.value,p_addr:pa.value},()=>toast('Data tersimpan.'))}
function savePw(){if(sn.value.length<6){toast('Sandi baru minimal 6 karakter.');return}act('c_pw',{p_old:so.value,p_new:sn.value},()=>toast('Sandi berhasil diubah.'))}
function savePinNew(){if(!/^\d{6}$/.test(pnn.value)){toast('PIN baru harus 6 angka.');return}act('c_pin',{p_old:po.value,p_new:pnn.value},()=>toast('PIN berhasil diubah.'))}
function togAdd(id,on){act('c_addon',{p_aid:id,p_on:on})}
function checkPin(){
 const c=cust(),v=pk1.value;
 if(!/^\d{6}$/.test(v)){pkm.textContent='PIN harus 6 angka.';return}
 if(!c.pin&&v!==pk2.value){pkm.textContent='PIN tidak sama.';return}
 act('c_paysaldo',{p_pin:v},()=>{modal=`<div class="modal" onclick="modal='';render()"><div class="sheet"><h3>Pembayaran berhasil</h3><p class="mut">Tagihan lunas via saldo. Layanan Anda aktif.</p><button class="btn">Tutup</button></div></div>`});
}
function doTf(){
 const c=cust(),v=Number(tnm.value),p=pk1.value,to=tid.value.trim().toUpperCase();
 if(!to||!(v>0)){pkm.textContent='Isi ID tujuan dan nominal.';return}
 if(v>(c.saldo||0)){pkm.textContent='Saldo kurang.';return}
 if(!/^\d{6}$/.test(p)){pkm.textContent='PIN harus 6 angka.';return}
 if(!c.pin&&p!==pk2.value){pkm.textContent='PIN tidak sama.';return}
 act('c_transfer',{p_to:to,p_amt:v,p_pin:p},()=>{modal=`<div class="modal" onclick="modal='';render()"><div class="sheet"><h3>Transfer berhasil</h3><p class="mut">${rp(v)} terkirim ke ${esc(to)}. Saldo Anda ${rp(cust().saldo||0)}.</p><button class="btn">Tutup</button></div></div>`});
}
async function sendReg(){
 if(!rgn.value.trim()||nz(rgw.value).length<9||!rga.value.trim()||rgp.value.length<6){rgmsg.textContent='Isi nama, nomor WhatsApp, alamat, dan sandi (min. 6 karakter).';return}
 rgmsg.textContent='Mengirim...';
 const d={p_name:rgn.value.trim(),p_phone:rgw.value.trim(),p_addr:rga.value.trim(),p_paket:rgk.value,p_pw:rgp.value};
 try{await rpc('register',d);lastReg={name:d.p_name,paket:d.p_paket,addr:d.p_addr};tab='regok';render()}catch(e){rgmsg.textContent=msg(e)}
}

/* admin */
function markPaid(id){act('a_paid',{p_cid:id,p_v:true})}
function unpaid(id){act('a_paid',{p_cid:id,p_v:false})}
function iso(id,v){act('a_iso',{p_cid:id,p_v:v})}
function saveCust(id){act('a_cust',{p_cid:id,p_name:en.value,p_paket:ep.value,p_harga:Number(eh.value)||0,p_due:ed.value,p_paid:es.value==='1'},()=>{modal=''})}
async function newCust(){
 try{const r=await rpc('a_newcust',{p_token:TOKEN});await sync();
  modal=`<div class="modal" onclick="if(event.target===this){modal='';render()}"><div class="sheet"><h3>Pelanggan dibuat</h3><p class="mut">ID: <b>${r.id}</b><br>Sandi sementara: <b>${r.pw}</b></p><p class="mut">Catat dan berikan ke pelanggan, lalu lengkapi datanya.</p><button class="btn" onclick="editCust('${r.id}')">Ubah data</button></div></div>`;render()}
 catch(e){fail(e)}
}
function adjSaldo(id,s){const v=Number(sa.value);if(!(v>0)){sm.textContent='Isi nominal lebih dari 0.';return}act('a_saldo',{p_cid:id,p_amt:s*v,p_note:sno.value.trim(),p_income:s>0&&sci.checked},()=>{modal=''})}
async function resetPw(id){
 try{const t=await rpc('a_resetpw',{p_token:TOKEN,p_cid:id});const c=db.customers.find(x=>x.id===id);
  const m2='Halo '+c.name+', sandi SkyConnect Anda sudah direset. Sandi sementara: '+t+'. Segera ganti di menu Profil.';
  modal=`<div class="modal" onclick="modal='';render()"><div class="sheet"><h3>Sandi direset</h3><p class="mut">Sandi sementara ${esc(c.name)}: <b>${t}</b></p>${c.phone?`<a class="btn" style="display:block;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/${nz(c.phone)}?text=${encodeURIComponent(m2)}">Kirim via WhatsApp</a>`:'<p class="mut">No. WhatsApp pelanggan belum diisi.</p>'}</div></div>`;render()}
 catch(e){fail(e)}
}
function resetPin(id){act('a_resetpin',{p_cid:id},()=>{const c=db.customers.find(x=>x.id===id);modal=`<div class="modal" onclick="modal='';render()"><div class="sheet"><h3>PIN direset</h3><p class="mut">${esc(c.name)} akan diminta membuat PIN baru saat bayar pakai saldo.</p><button class="btn">Tutup</button></div></div>`})}
function delAdd(id){db.addons=db.addons.filter(a=>a.id!==id);cfgSet('addons',1)}
function editPrice(id,v){db.addons.find(a=>a.id===id).price=Number(v)||0;cfgSet('addons')}
function newAdd(){if(!nn.value.trim())return;db.addons.push({id:'a'+Date.now(),name:nn.value.trim(),desc:nd.value.trim(),price:Number(np.value)||0});cfgSet('addons',1)}
function delPlan(i){db.plans.splice(i,1);cfgSet('plans',1)}
function addPlan(){if(!pln.value.trim())return;db.plans.push({n:pln.value.trim(),p:Number(plp.value)||0,d:''});cfgSet('plans',1)}
function saveCS(){db.cs={wa:cw.value.replace(/\D/g,'').replace(/^0/,'62'),jam:cj.value.trim()};cfgSet('cs');cmsg.textContent=db.cs.wa?'Nomor aktif: +'+db.cs.wa:'Nomor dikosongkan.'}
function savePromo(){db.promo={a:pr1.value.trim(),b:pr2.value.trim(),c:pr3.value.trim()};cfgSet('promo');prm.textContent='Promo tersimpan.'}
function addNews(){if(!nt.value.trim())return;db.news.push({t:nt.value.trim(),b:nb.value.trim(),d:today()});cfgSet('news',1)}
function delNews(i){db.news.splice(i,1);cfgSet('news',1)}

/* super admin */
function addRek(){if(!rb.value.trim()||!rno.value.trim())return;db.rek.push({bank:rb.value.trim(),no:rno.value.trim(),an:ran.value.trim()});cfgSet('rek',1)}
function delRek(i){db.rek.splice(i,1);cfgSet('rek',1)}
function upQris(i){
 const f=i.files[0];if(!f)return;const im=new Image();
 im.onload=()=>{const k=Math.min(1,700/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);db.qris=c.toDataURL('image/jpeg',.9);cfgSet('qris',1)};
 im.onerror=()=>{qm.textContent='File gambar tidak valid.'};
 im.src=URL.createObjectURL(f);
}
async function saveAuth(){
 const a=apA.value.trim(),s=apS.value.trim();
 if((a&&a.length<6)||(s&&s.length<6)){amsg.textContent='Minimal 6 karakter.';return}
 try{if(a)await rpc('s_staffpw',{p_token:TOKEN,p_who:'ADMIN',p_new:a});if(s)await rpc('s_staffpw',{p_token:TOKEN,p_who:'SUPER',p_new:s});apA.value='';apS.value='';amsg.textContent='Tersimpan.'}
 catch(e){fail(e)}
}
async function approve(rid){
 const r=db.reg.find(x=>x.id===rid);
 try{const id=await rpc('s_approve',{p_token:TOKEN,p_rid:rid});await sync();
  const m2='Halo '+r.name+', pendaftaran SkyConnect Anda disetujui. ID Pengguna WiFi Anda: '+id+'. Masuk dengan ID ini dan sandi yang Anda buat saat mendaftar.';
  modal=`<div class="modal" onclick="modal='';render()"><div class="sheet"><h3>Pelanggan dibuat: ${id}</h3><p class="mut">${esc(r.name)} sudah masuk daftar pelanggan.</p><a class="btn" style="display:block;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/${nz(r.phone)}?text=${encodeURIComponent(m2)}">Kirim ID via WhatsApp</a></div></div>`;render()}
 catch(e){fail(e)}
}
function rejectReg(id){act('s_reject',{p_rid:id})}

boot();
