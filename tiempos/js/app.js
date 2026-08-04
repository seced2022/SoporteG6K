const eventos=[{nombre:'Rally Ciudad de Bailén',campeonato:'Campeonato de Andalucía',estado:'EN DIRECTO'}];
document.addEventListener('DOMContentLoaded',()=>{
const g=document.getElementById('eventosGrid');
const c=document.getElementById('liveCount');
c.textContent=eventos.length+' evento';
g.innerHTML=eventos.map(e=>`<div class="event-card"><h2>${e.nombre}</h2><p>${e.campeonato}</p><p>${e.estado}</p><button class="follow-button">SEGUIR EVENTO</button></div>`).join('');
setInterval(()=>{const r=document.getElementById('clock'); if(r) r.textContent=new Date().toLocaleTimeString('es-ES');},1000);
});
