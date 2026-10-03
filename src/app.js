(() => {
 const select=document.querySelector('#theme');
 const allowed=[...select.options].map(o=>o.value);
 function setTheme(theme){if(!allowed.includes(theme))return;document.documentElement.dataset.theme=theme;select.value=theme;}
 try {setTheme(localStorage.getItem('portfolio-theme'));}catch{}
 select.addEventListener('change',()=>{setTheme(select.value);try{localStorage.setItem('portfolio-theme',select.value);}catch{}});
 document.querySelectorAll('.projects').forEach(grid=>{
  const section=grid.closest('section');
  section.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
   section.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
   grid.querySelectorAll('[data-category]').forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter);
   section.querySelector('.no-results').hidden=[...grid.children].some(c=>!c.hidden);
  }));
 });
 let opener;
 document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{opener=button;document.getElementById(button.dataset.open).showModal();}));
 document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
  dialog.addEventListener('close',()=>opener?.focus());
 });
})();
