import {icon,escapeHtml} from './ui.js';
import {createStore} from './store.js';
import {renderOverview} from './views/overview.js';
import {renderRegistration} from './views/registration.js';
import {renderSurveyQA} from './views/survey.js';
import {renderCadastre} from './views/cadastre.js';
import {renderScheduling} from './views/scheduling.js';
import {renderRisk} from './views/risk.js';
let storage;try{storage=localStorage;}catch{}
const store=createStore(storage);
const pages=[
 {id:'overview',icon:'dashboard',title:'ภาพรวมการปฏิบัติงาน',en:'Command Center',render:renderOverview},
 {id:'registration',icon:'file',title:'ตรวจเอกสารอัจฉริยะ',en:'Smart Registration',render:renderRegistration},
 {id:'survey',icon:'scan',title:'ตรวจคุณภาพรังวัด',en:'Survey QA',render:renderSurveyQA},
 {id:'cadastre',icon:'cube',title:'ทะเบียนสิทธิ 3 มิติ',en:'3D Cadastre',render:renderCadastre},
 {id:'scheduling',icon:'calendar',title:'บริหารคิวรังวัด',en:'Smart Survey 2.0',render:renderScheduling},
 {id:'risk',icon:'shield',title:'สัญญาณผิดปกติ',en:'Anomaly Review',render:renderRisk}
];
document.querySelector('#app').innerHTML=`<aside class="sidebar" id="sidebar"><a class="brand" href="#overview" aria-label="LAND Intelligence หน้าแรก"><span class="brand-mark">${icon('layers',29)}</span><span>LAND<span>INTELLIGENCE</span></span></a><div class="workspace-label">พื้นที่ทดลองกรมที่ดินอัจฉริยะ</div><div class="nav-caption">WORKSPACE</div><nav aria-label="โมดูลสาธิต">${pages.map(p=>`<a href="#${p.id}" class="nav-item" data-nav="${p.id}">${icon(p.icon,21)}<span>${p.title}<small>${p.en}</small></span></a>`).join('')}</nav><div class="sidebar-bottom"><div class="prototype-note"><span class="prototype-icon">${icon('layers',23)}</span><strong>จาก Digital สู่ Intelligent</strong><p>6 แนวคิดเพื่อยกระดับ<br>การทำงานของกรมที่ดิน</p></div><div class="sidebar-version"><span>INTERACTIVE PROTOTYPE</span><span>V.01</span></div></div></aside><button class="sidebar-overlay" id="sidebar-overlay" aria-label="ปิดเมนู"></button><div class="app-body"><header class="topbar"><div class="topbar-left"><button class="icon-button menu-toggle" id="menu-toggle" aria-label="เปิดเมนู" aria-expanded="false">${icon('menu')}</button><span class="breadcrumb">พื้นที่ทดลอง <span>/</span> <strong id="current-page"></strong></span></div><div class="topbar-actions"><span class="demo-badge"><i></i> ข้อมูลจำลอง</span><button id="guide-button" class="button ghost">${icon('play',16)} คู่มือเดโม่</button><button id="reset-button" class="icon-button" aria-label="รีเซ็ตเดโม่" title="รีเซ็ตเดโม่">${icon('refresh',18)}</button><span class="avatar" title="บทบาทผู้ทดลอง">DE</span></div></header><main id="main" tabindex="-1"></main><footer class="app-footer"><span>LAND INTELLIGENCE <b>CONCEPT DEMO</b></span><span>ข้อมูลสังเคราะห์ · ไม่เชื่อมต่อระบบกรมที่ดิน · บันทึกเฉพาะในเบราว์เซอร์นี้</span></footer></div>`;
let toastTimer;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
function navigate(route){if(location.hash==='#'+route)render();else location.hash=route;}
const ctx={getState:store.get,update:store.update,record:store.record,toast,navigate};
function render(){const route=location.hash.slice(1)||'overview';const page=pages.find(p=>p.id===route)||pages[0];document.querySelector('#current-page').textContent=page.en;document.title=`${page.en} — LAND Intelligence`;document.querySelectorAll('[data-nav]').forEach(el=>{const active=el.dataset.nav===page.id;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});page.render(document.querySelector('#main'),ctx);closeMenu();window.scrollTo({top:0,behavior:'instant'});}
function closeMenu(){document.body.classList.remove('menu-open');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');}
document.querySelectorAll('[data-nav]').forEach(el=>{const page=pages.find(p=>p.id===el.dataset.nav);el.setAttribute('aria-label',page.title+' — '+page.en);el.title=page.title;});
document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();document.querySelector('#main').focus();document.querySelector('#main').scrollIntoView({block:'start'});});
document.querySelector('#menu-toggle').addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu-toggle').setAttribute('aria-expanded',String(open));});
document.querySelector('#sidebar-overlay').addEventListener('click',closeMenu);
document.querySelector('#reset-button').addEventListener('click',()=>{const dialog=document.querySelector('#reset-dialog');dialog.returnValue='';dialog.showModal();});
document.querySelector('#reset-dialog').addEventListener('close',e=>{if(e.target.returnValue==='reset'){store.reset();render();toast('เริ่มข้อมูลสาธิตใหม่แล้ว');}});
const guide=[
{route:'registration',title:'ให้ระบบช่วยตรวจ ก่อนเจ้าหน้าที่ตัดสินใจ',description:'เปิดเคส DEMO-R0142 ทดลองตรวจชุดเอกสาร ดูชื่อที่ไม่ตรงและเอกสารมอบอำนาจที่ขาด จากนั้นแก้ข้อมูลแล้วตรวจใหม่',phrase:'AI อ่านก่อน เจ้าหน้าที่ตัดสินใจ'},
{route:'survey',title:'เห็นจุดเสี่ยงบนแปลงจริงในชุดตัวอย่าง',description:'เลือกสถานการณ์แปลงซ้อนทับ ตรวจคุณภาพ แล้วดูพื้นที่ซ้อนทับบนแผนภาพ ลองสลับเป็นแปลงปกติเพื่อเปรียบเทียบ',phrase:'ตรวจทุกแปลง เห็นจุดเสี่ยงก่อนรับรอง'},
{route:'cadastre',title:'สิทธิที่ซ้อนกัน มองเห็นได้ในภาพเดียว',description:'เปิด–ปิดชั้นใต้ดิน หมุนมุมมอง และเลื่อนแยกชั้น เลือกปริมาตรเพื่อดูเอกสารและผู้เกี่ยวข้องสมมติ',phrase:'เห็นพื้นที่ เห็นชั้น เห็นสิทธิ'},
{route:'scheduling',title:'จากคิวงาน สู่แผนที่ลงมือทำได้',description:'ทดลองเพิ่มหรือลดจำนวนทีม แล้วจัดแผนรังวัด เปรียบเทียบการกระจายงานและวันทำการที่คาดว่าจะเสร็จ',phrase:'รู้คิว รู้ทีม รู้วันจบ'},
{route:'risk',title:'เห็นเหตุผลเบื้องหลังทุกการแจ้งเตือน',description:'เลือกกรณีสาธิต อ่านเส้นเวลาและกติกาที่เข้าเงื่อนไข แล้วบันทึกผลสอบทานพร้อมเหตุผล',phrase:'เห็นสัญญาณก่อน สอบทานก่อนเสียหาย'},
{route:'overview',title:'กลับมาดูภาพรวมที่เปลี่ยนไป',description:'ดูบันทึกการทดลองจากแต่ละโมดูล และทดลองปรับกำลังคนเพื่อดูแนวโน้มคิวงานใน 20 วันทำการ',phrase:'เห็นวันนี้ คาดการณ์พรุ่งนี้ จัดการได้ก่อน'}
];
let guideIndex=0;
function showGuide(index=0){guideIndex=index;const item=guide[index],dialog=document.querySelector('#guide-dialog');dialog.innerHTML=`<button class="icon-button guide-close" id="guide-close" aria-label="ปิดคู่มือ">${icon('close')}</button><span class="eyebrow">THE 4-MINUTE WALKTHROUGH</span><div class="guide-progress">${guide.map((g,i)=>`<button class="${i===index?'active':''}" data-step="${i}" aria-label="ขั้น ${i+1}: ${escapeHtml(g.title)}">${i+1}</button>`).join('')}</div><span class="guide-module">${pages.find(p=>p.id===item.route).en}</span><h2 id="guide-title">${item.title}</h2><blockquote>“${item.phrase}”</blockquote><p>${item.description}</p><div class="guide-note">ทุกขั้นเป็นข้อมูลสาธิต ผลคำนวณมาจากกติกาที่เปิดเผย ไม่ได้เรียก AI/OCR หรือทะเบียนจริง</div><div class="dialog-actions"><button class="button secondary" id="guide-next">${index===guide.length-1?'กลับขั้นแรก':'ดูขั้นถัดไป'}</button><button class="button primary" id="guide-open">เปิดโมดูลนี้</button></div>`;dialog.querySelector('#guide-close').addEventListener('click',()=>dialog.close());dialog.querySelector('#guide-next').addEventListener('click',()=>showGuide((index+1)%guide.length));dialog.querySelector('#guide-open').addEventListener('click',()=>{dialog.close();navigate(item.route);});dialog.querySelectorAll('[data-step]').forEach(el=>el.addEventListener('click',()=>showGuide(Number(el.dataset.step))));if(!dialog.open)dialog.showModal();}
document.querySelector('#guide-button').addEventListener('click',()=>showGuide(guideIndex));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
window.addEventListener('hashchange',render);
render();
