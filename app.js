'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const data=JSON.parse($('#site-data').textContent), selected=new Set();
let activeFilter='all',photoIndex=0;
const norm=s=>s.normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const menu=$('.menu-toggle');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);$('#navigation').classList.toggle('is-open',open);menu.textContent=open?'إغلاق':'القائمة'});
function closeMenu(){menu.setAttribute('aria-expanded','false');$('#navigation').classList.remove('is-open');menu.textContent='القائمة'}
$$('#navigation a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
function filterServices(){let count=0;const query=norm($('#search').value.trim());$$('.service').forEach(card=>{const show=(activeFilter==='all'||card.dataset.category===activeFilter)&&norm(card.querySelector('h3').textContent).includes(query);card.hidden=!show;if(show)count++});$('#empty-results').hidden=count>0;$('#result-count').textContent=`${count} من ${data.services.length} خدمة`}
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',x===b));filterServices()}));
$('#search').addEventListener('input',filterServices);$('#reset-search').addEventListener('click',()=>{$('#search').value='';$('[data-filter="all"]').click()});filterServices();
$$('[data-work-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-work-filter]').forEach(x=>x.setAttribute('aria-pressed',x===b));$$('.work').forEach(x=>x.hidden=b.dataset.workFilter!=='all'&&x.dataset.kind!==b.dataset.workFilter);$('.work-grid').classList.toggle('is-filtered',b.dataset.workFilter!=='all')}));
function showError(id,msg){$(id).textContent=msg;$(id).hidden=!msg}
function openDialog(id){closeMenu();const dlg=$(id);if(!dlg.open)dlg.showModal();document.body.style.overflow='hidden'}
function syncDialogLock(){document.body.style.overflow=$$('dialog').some(d=>d.open)?'hidden':''}$$('dialog').forEach(d=>d.addEventListener('close',syncDialogLock));$$('[data-close]').forEach(b=>b.addEventListener('click',()=>{document.getElementById(b.dataset.close).close();syncDialogLock()}));
function edit(){ $('#request-form').hidden=false;$('#review').hidden=true;$('#send-request').removeAttribute('href') }
function render(){
 $('#chosen').replaceChildren();selected.forEach(id=>{const s=data.services.find(x=>x.id===id),row=document.createElement('div');row.className='chosen-row';const label=document.createElement('span');label.textContent=s.name;const b=document.createElement('button');b.type='button';b.textContent='إزالة';b.setAttribute('aria-label',`إزالة ${s.name}`);b.addEventListener('click',()=>{selected.delete(id);render();edit();showError('#selection-error','')});row.append(label,b);$('#chosen').append(row)});
 $('#no-chosen').hidden=selected.size>0;$('#dock-count').hidden=!selected.size;$('#dock-count').textContent=selected.size;$$('[data-add]').forEach(b=>{const on=selected.has(b.dataset.add);b.setAttribute('aria-pressed',on);b.textContent=on?'تم الاختيار':'اختيار الخدمة'});
}
function add(id){if(!data.services.some(x=>x.id===id))return;if(selected.size>=4&&!selected.has(id)){openDialog('#booking');showError('#selection-error','يمكنك اختيار أربع خدمات في الطلب. أزيلي خدمة لإضافة غيرها.');return}selected.add(id);showError('#selection-error','');render();edit()}
$$('[data-add]').forEach(b=>b.addEventListener('click',()=>{if(selected.has(b.dataset.add)){selected.delete(b.dataset.add);render();edit()}else add(b.dataset.add)}));
$('#quick-add').addEventListener('click',()=>{if(!$('#quick-service').value){showError('#selection-error','اختاري خدمة من القائمة أولا.');return}add($('#quick-service').value);$('#quick-service').value=''});
const form=$('#request-form');
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
$$('[data-book]').forEach(b=>b.addEventListener('click',()=>{form.elements.date.min=today();showError('#form-error','');openDialog('#booking')}));
form.addEventListener('submit',e=>{e.preventDefault();showError('#form-error','');showError('#selection-error','');
 if(!selected.size){showError('#selection-error','اختاري خدمة واحدة على الأقل.');$('#quick-service').focus();return}
 const f=new FormData(form),name=f.get('name').trim(),date=f.get('date'),time=f.get('time'),notes=f.get('notes').trim();
 if(!name){showError('#form-error','أضيفي اسمك لإكمال الطلب.');return}
 if(date<today()||new Date(date+'T'+time+':00+03:00').getTime()<=Date.now()){showError('#form-error','اختاري موعدا في وقت قادم.');return}
 if(new Date(date+'T12:00:00+03:00').getUTCDay()===0){showError('#form-error','الأحد مغلق. اختاري يوما من الاثنين إلى السبت.');return}
 if(time<'13:00'||time>='22:00'){showError('#form-error','اختاري وقتا بين ١ ظهرا وقبل ١٠ مساء.');return}
 const names=[...selected].map(id=>data.services.find(s=>s.id===id).name);const readable=new Intl.DateTimeFormat('ar-SA',{dateStyle:'full',calendar:'gregory',timeZone:'Asia/Riyadh'}).format(new Date(date+'T12:00:00+03:00'));
 $('#review-details').replaceChildren();[['الاسم',name],['الخدمات',names.join('، ')],['اليوم',readable],['الوقت',time],['ملاحظات',notes||'بدون ملاحظات']].forEach(([k,v])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;$('#review-details').append(dt,dd)});
 const msg=`مرحبا دي سبا، أرغب بطلب موعد.\nالاسم: ${name}\nالخدمات:\n${names.map(n=>'- '+n).join('\n')}\nاليوم: ${date}\nالوقت المفضل: ${time}\n${notes?'ملاحظات: '+notes+'\n':''}فضلا تأكيد توفر الموعد والأسعار الحالية ومدة الخدمات قبل اعتماد الحجز.`;
 $('#send-request').href='https://wa.me/966538778497?text='+encodeURIComponent(msg);form.hidden=true;$('#review').hidden=false;$('#send-request').focus();
});
$('#edit').addEventListener('click',()=>{edit();form.elements.name.focus()});render();
function renderPhoto(){const p=data.photos[photoIndex];$('#full-photo').src=p.src;$('#full-photo').alt=p.alt;$('#photo-caption').textContent=p.alt;$('#photo-count').textContent=`${photoIndex+1} / ${data.photos.length}`}
$$('[data-photo]').forEach(b=>b.addEventListener('click',()=>{photoIndex=Number(b.dataset.photo);renderPhoto();openDialog('#lightbox')}));
function changePhoto(step){photoIndex=(photoIndex+step+data.photos.length)%data.photos.length;renderPhoto()}
$('#next-photo').addEventListener('click',()=>changePhoto(1));$('#previous-photo').addEventListener('click',()=>changePhoto(-1));$('#lightbox').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();changePhoto(1)}if(e.key==='ArrowRight'){e.preventDefault();changePhoto(-1)}});
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});$$('.section-heading,.philosophy,.appointment-copy,.visit>div,.faq>h2').forEach(el=>{el.classList.add('reveal');observer.observe(el)})}
