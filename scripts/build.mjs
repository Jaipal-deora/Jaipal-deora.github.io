import {readFile,writeFile,mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeLink(value){
 if(typeof value!=='string'||!value.trim()) return '';
 if(/^(https?:\/\/|mailto:)/i.test(value))return value;
 if(!/^[a-z][a-z0-9+.-]*:/i.test(value)&&!value.startsWith('//')&&!value.includes('\\'))return value;
 return '';
}
const link=(url,label,cls='')=>safeLink(url)?`<a class="${esc(cls)}" href="${esc(safeLink(url))}" ${/^https?:/.test(url)?'target="_blank" rel="noopener noreferrer"':''}>${esc(label)}</a>`:'';
const listLinks=links=>(links??[]).map(l=>link(l.url,l.label)).join('');
export function validate(d){
 if(!d.site||!d.profile||!Array.isArray(d.sections))throw Error('site, profile and sections are required.');
 const themes=['light','dark','ocean','forest'];
 if(!Array.isArray(d.site.themes)||!d.site.themes.length||d.site.themes.some(t=>!themes.includes(t))||!d.site.themes.includes(d.site.defaultTheme))throw Error('Use supported themes and include defaultTheme in themes.');
 const ids=new Set();
 for(const s of d.sections){if(!/^[a-z][a-z0-9-]*$/.test(s.id)||ids.has(s.id))throw Error('Section IDs must be unique lowercase slugs.');ids.add(s.id);if(!['projects','about','skills','timeline','contact','content'].includes(s.type))throw Error(`Unknown section type: ${s.type}`);}
 const pids=new Set();for(const s of d.sections.filter(s=>s.type==='projects'))for(const p of s.items??[]){if(!/^[a-z][a-z0-9-]*$/.test(p.id)||pids.has(p.id))throw Error('Project IDs must be unique lowercase slugs.');pids.add(p.id);}
}
function plot(type){
 const grid='<path class="grid" d="M0 50H440 M0 100H440 M0 150H440 M55 0V200 M165 0V200 M275 0V200 M385 0V200"/>';
 const shapes=type==='bars'?'<g class="bar"><rect x="35" y="110" width="45" height="70"/><rect x="108" y="80" width="45" height="100"/><rect x="181" y="55" width="45" height="125"/><rect x="254" y="90" width="45" height="90"/><rect x="327" y="25" width="45" height="155"/></g>':type==='scatter'?Array.from({length:36},(_,i)=>`<circle class="point" cx="${35+(i*53)%370}" cy="${30+(i*37)%140}" r="${3+i%4}"/>`).join(''):'<path class="area" d="M0 170L40 155L80 164L120 113L160 125L200 85L240 100L280 50L320 75L360 40L400 55L440 20V200H0Z"/><path class="line" d="M0 170L40 155L80 164L120 113L160 125L200 85L240 100L280 50L320 75L360 40L400 55L440 20"/><path class="baseline" d="M0 180L440 70"/>';
 return `<svg viewBox="0 0 440 200" aria-hidden="true" focusable="false">${grid}${shapes}</svg><span class="plot-caption">Illustrative visualization</span>`;
}
function section(s,d){
 const header=`<div class="section-head"><p class="eyebrow">${esc(s.eyebrow??'')}</p><h2>${esc(s.title)}</h2>${s.description?`<p>${esc(s.description)}</p>`:''}</div>`;
 let body='';
 if(s.type==='projects'){
  const cats=[...new Set((s.items??[]).map(p=>p.category).filter(Boolean))];
  body=`<div class="filters" aria-label="Filter projects"><button type="button" class="filter active" data-filter="all" aria-pressed="true">All work</button>${cats.map(c=>`<button type="button" class="filter" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div><div class="projects">${(s.items??[]).map((p,i)=>`<article class="project ${p.featured?'featured':''}" data-category="${esc(p.category)}"><div class="project-visual visual-${i%3}"><span class="plot-label">${esc(p.category)}</span>${plot(p.visual)}${p.metric?`<div class="metric"><strong>${esc(p.metric.value)}</strong><span>${esc(p.metric.label)}</span></div>`:''}</div><div class="project-copy"><div class="project-meta"><span>${esc(p.category)}</span><span>${esc(p.year)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="tags">${(p.tags??[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="project-links">${p.caseStudy?`<button type="button" class="text-button" data-open="case-${esc(p.id)}">Explore case study <span aria-hidden="true">+</span></button>`:''}${listLinks(p.links)}</div></div></article>`).join('')}</div><p class="no-results" hidden>No projects in this category.</p>`;
 }else if(s.type==='about')body=`<div class="about-layout"><div>${(s.paragraphs??[]).map(p=>`<p class="about-text">${esc(p)}</p>`).join('')}</div><dl class="facts">${(s.facts??[]).map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl></div>`;
 else if(s.type==='skills')body=`<div class="skill-grid">${(s.groups??[]).map((g,i)=>`<div><span class="skill-number">0${i+1}</span><h3>${esc(g.title)}</h3><div class="tags">${g.items.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div>`).join('')}</div>`;
 else if(s.type==='timeline')body=`<div class="timeline">${(s.items??[]).map(t=>`<article><p class="period">${esc(t.period)}</p><div><h3>${esc(t.title)}</h3><p class="organization">${esc(t.organization)}</p><p>${esc(t.description)}</p>${listLinks(t.links)}</div></article>`).join('')}</div>`;
 else if(s.type==='content')body=`<div class="custom-content">${(s.paragraphs??[]).map(p=>`<p>${esc(p)}</p>`).join('')}${(s.items??[]).map(t=>`<article><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p>${listLinks(t.links)}</article>`).join('')}${listLinks(s.links)}</div>`;
 else if(s.type==='contact')body=`<div class="contact-links">${d.profile.email?link('mailto:'+d.profile.email,'Say hello','button primary'):''}${listLinks(d.profile.links)}${!d.profile.email&&!(d.profile.links??[]).length?'<p class="contact-placeholder">Contact details coming soon.</p>':''}</div>`;
 return `<section id="${esc(s.id)}" class="section ${s.type}">${header}${body}</section>`;
}
export async function build(){
 const d=JSON.parse(await readFile(path.join(root,'content/portfolio.json'),'utf8'));validate(d);
 const visible=d.sections.filter(s=>s.enabled!==false),p=d.profile;
 const dialogs=visible.filter(s=>s.type==='projects').flatMap(s=>s.items??[]).filter(p=>p.caseStudy).map(p=>`<dialog id="case-${esc(p.id)}" aria-labelledby="title-${esc(p.id)}"><button class="dialog-close" type="button" data-close aria-label="Close case study">×</button><p class="eyebrow">${esc(p.category)} / ${esc(p.year)}</p><h2 id="title-${esc(p.id)}">${esc(p.title)}</h2>${Object.entries(p.caseStudy).map(([k,v])=>`<h3>${esc(k[0].toUpperCase()+k.slice(1))}</h3><p>${esc(v)}</p>`).join('')}<div class="project-links">${listLinks(p.links)}</div></dialog>`).join('');
 const html=`<!doctype html><html lang="en" data-theme="${esc(d.site.defaultTheme)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(d.site.description)}"><meta property="og:title" content="${esc(d.site.title)}"><meta property="og:description" content="${esc(d.site.description)}"><meta property="og:type" content="website">${/^https?:\/\//.test(d.site.url??'')?`<link rel="canonical" href="${esc(d.site.url)}"><meta property="og:url" content="${esc(d.site.url)}">`:''}<meta name="color-scheme" content="light dark"><title>${esc(d.site.title)}</title><link rel="icon" href="./favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="./styles.css"><script src="./app.js" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="header"><a class="brand" href="#" aria-label="${esc(p.name)} home"><span class="brand-mark">${esc(p.initials)}</span><span>${esc(p.name)}<small>${esc(p.role)}</small></span></a><nav aria-label="Main navigation">${visible.filter(s=>s.nav!==false).map(s=>`<a href="#${esc(s.id)}">${esc(s.navLabel??s.id[0].toUpperCase()+s.id.slice(1))}</a>`).join('')}</nav><label class="theme-label"><span>Theme</span><select id="theme" aria-label="Color theme">${d.site.themes.map(t=>`<option value="${t}" ${t===d.site.defaultTheme?'selected':''}>${t[0].toUpperCase()+t.slice(1)}</option>`).join('')}</select></label></header><main id="main">${d.site.sampleContent?'<div class="sample-notice">Template preview · Projects and experience below are sample content.</div>':''}<section class="hero"><div class="hero-copy"><p class="eyebrow">${esc(p.eyebrow)}</p><h1>${esc(p.headline).replace(/\n/g,'<br>')}</h1><p class="intro">${esc(p.intro)}</p><div class="hero-actions">${visible.some(s=>s.type==='projects')?link('#'+visible.find(s=>s.type==='projects').id,'Explore my work','button primary'):''}${link(p.resume,'Download résumé','button secondary')}</div><p class="location">${esc(p.location)}</p></div><aside class="hero-note"><span class="note-index">${esc(p.workNote?.title)}</span><p>${(p.workNote?.lines??[]).map((line,i,lines)=>i===lines.length-1?`<em>${esc(line)}</em>`:esc(line)).join('<br>')}</p><div class="note-rule"></div><span>${esc(p.availability)}</span></aside></section>${visible.map(s=>section(s,d)).join('')}</main><footer><span>© ${new Date().getUTCFullYear()} ${esc(p.name)}</span><span>${esc(p.footer)}</span><a href="#">Back to top</a></footer>${dialogs}<noscript><p class="noscript">All portfolio content is available. Enable JavaScript for theme switching, project filters, and case study dialogs.</p>${visible.filter(s=>s.type==='projects').flatMap(s=>s.items??[]).filter(p=>p.caseStudy).map(p=>`<article class="section"><h2>${esc(p.title)}</h2>${Object.entries(p.caseStudy).map(([k,v])=>`<h3>${esc(k)}</h3><p>${esc(v)}</p>`).join('')}</article>`).join('')}</noscript></body></html>`;
 await mkdir(path.join(root,'dist'),{recursive:true});await writeFile(path.join(root,'dist/index.html'),html);
 for(const f of ['styles.css','app.js','favicon.svg'])await copyFile(path.join(root,'src',f),path.join(root,'dist',f));
 await cp(path.join(root,'src/assets'),path.join(root,'dist/assets'),{recursive:true});
 await writeFile(path.join(root,'dist/.nojekyll'),'');
 console.log(`Built ${visible.length} sections into dist/`);return html;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await build();
