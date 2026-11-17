const API_URL = 'https://v3d-dashboard-kappa.vercel.app/api';
// Configure com DDI + DDD + número, apenas dígitos (ex.: 5582999999999).
const WHATSAPP_NUMBER = '';
const $ = selector => document.querySelector(selector);
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? 'Sob consulta' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value));
const imageURL = product => product.has_image === 0 || !product.image ? 'assets/placeholder.webp' : `${API_URL}/produtos/${encodeURIComponent(product.id)}/imagem`;
let products = [], category = 'Todos', onlyFav = false;
let favorites;
try { favorites = new Set(JSON.parse(localStorage.getItem('v3d-favorites') || '[]').map(Number)); } catch { favorites = new Set(); }
function filtered() {
  let result = products.filter(p => (category === 'Todos' || p.category === category) && (!onlyFav || favorites.has(Number(p.id))) && normalize([p.name,p.category,p.desc,p.material].join(' ')).includes(normalize($('#search').value.trim())));
  const sort = $('#sort').value;
  if(sort === 'az') result.sort((a,b) => a.name.localeCompare(b.name,'pt-BR'));
  if(sort === 'za') result.sort((a,b) => b.name.localeCompare(a.name,'pt-BR'));
  return result;
}
function renderFilters() {
  const categories = ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))];
  $('#filters').innerHTML = categories.map(c => `<button type="button" data-category="${escapeHTML(c)}" class="${c === category ? 'active' : ''}" aria-pressed="${c === category}">${escapeHTML(c)} <span>${c === 'Todos' ? products.length : products.filter(p => p.category === c).length}</span></button>`).join('');
}
function render() {
  const matches = filtered(), limit = Number($('#products').dataset.limit), list = limit ? matches.slice(0,limit) : matches;
  $('#products').innerHTML = list.map(p => `<article class="card">
    <div class="product-image"><button class="photo-button" data-product="${p.id}" aria-label="Ver detalhes de ${escapeHTML(p.name)}"><img class="photo" src="${imageURL(p)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='assets/placeholder.webp'"></button>
    <button class="heart" data-fav="${p.id}" aria-label="Favoritar ${escapeHTML(p.name)}" aria-pressed="${favorites.has(Number(p.id))}"><i class="fa-${favorites.has(Number(p.id)) ? 'solid' : 'regular'} fa-heart"></i></button></div>
    <p class="category">${escapeHTML(p.category || 'Impressão 3D')}</p><h3><a href="#produto-${p.id}" data-product="${p.id}">${escapeHTML(p.name)}</a></h3>
    <div class="card-bottom"><strong>${money(p.price)}</strong><button data-product="${p.id}" aria-label="Ver ${escapeHTML(p.name)}"><i class="fa-solid fa-arrow-up-right-from-square"></i></button></div></article>`).join('');
  $('#empty').hidden = matches.length > 0;
  $('#result-count').textContent = `${list.length}${matches.length > list.length ? ` de ${matches.length}` : ''} ${matches.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
  $('#fav-count').innerHTML = `<i class="fa-${onlyFav ? 'solid' : 'regular'} fa-heart"></i> ${products.filter(p => favorites.has(Number(p.id))).length}`;
  $('#saved').setAttribute('aria-pressed',String(onlyFav));
  $('#filters').querySelectorAll('[data-category]').forEach(button => { const active = button.dataset.category === category; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
}
function openProduct(id) {
  const p = products.find(p => Number(p.id) === Number(id)); if(!p) return;
  const colors = Array.isArray(p.colors) ? p.colors : (() => { try { return JSON.parse(p.colors || '[]'); } catch { return []; } })();
  const validColors = Array.isArray(colors) ? colors : [];
  $('#detail-content').innerHTML = `<div class="detail-layout"><img src="${imageURL(p)}" alt="${escapeHTML(p.name)}" onerror="this.onerror=null;this.src='assets/placeholder.webp'">
    <div class="detail-info"><p class="eyebrow">${escapeHTML(p.category || 'PRODUTO V3D')}</p><h2>${escapeHTML(p.name)}</h2><p>${escapeHTML(p.desc || 'Conheça este produto da V3D.')}</p>
    <p class="detail-price">${money(p.price)}</p><dl><dt>Material</dt><dd>${escapeHTML(p.material || 'A consultar')}</dd><dt>Dimensões</dt><dd>${escapeHTML(p.size || 'A consultar')}</dd><dt>Cores disponíveis</dt><dd>${validColors.length ? escapeHTML(validColors.join(', ')) : 'Consultar disponibilidade'}</dd></dl>
    <button class="primary" data-request="${p.id}">Solicitar pelo WhatsApp <i class="fa-brands fa-whatsapp"></i></button></div></div>`;
  $('#detail').showModal();
}
function openRequest(product) {
  if($('#detail').open) $('#detail').close();
  $('#request-form').reset(); $('#form-status').textContent = '';
  if(product) $('#request-form').elements.idea.value = `Tenho interesse no produto ${product.name} (código ${product.id}), valor ${money(product.price)}. Gostaria de confirmar disponibilidade e prazo.`;
  $('#request').showModal();
}
function reset() { category='Todos';onlyFav=false;$('#search').value='';$('#sort').value='featured';render(); }
async function loadProducts() {
  $('#result-count').textContent='Carregando produtos...';
  try {
    const response = await fetch(`${API_URL}/produtos`);
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    products = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : Array.isArray(data.produtos) ? data.produtos : [];
    renderFilters();render();
    const featured = products.find(p => p.has_image && p.image) || products[0];
    if(featured) { const button = $('#hero-product'); button.dataset.product=featured.id;button.setAttribute('aria-label',`Ver ${featured.name}`); }
  } catch(error) {
    console.error('Erro ao carregar produtos:',error);
    $('#result-count').textContent='Não foi possível carregar os produtos.';
    $('#products').innerHTML='<p class="load-error">Erro de conexão com o catálogo. Tente novamente mais tarde.</p>';
    $('#empty').hidden=true;
  }
}
document.addEventListener('click',event => {
  const button=event.target.closest('button,a');if(!button)return;
  if(button.hasAttribute('data-product')) { event.preventDefault();openProduct(button.dataset.product); }
  else if(button.hasAttribute('data-fav')) { const id=Number(button.dataset.fav);favorites.has(id)?favorites.delete(id):favorites.add(id);try{localStorage.setItem('v3d-favorites',JSON.stringify([...favorites]));}catch{}render(); }
  else if(button.hasAttribute('data-category')) {category=button.dataset.category;onlyFav=false;render();}
  else if(button.hasAttribute('data-request')) openRequest(products.find(p => Number(p.id)===Number(button.dataset.request)));
  else if(button.classList.contains('close')) button.closest('dialog').close();
});
$('#search').addEventListener('input',render);
$('#sort').addEventListener('change',render);
$('#reset').addEventListener('click',reset);
$('#empty-reset').addEventListener('click',reset);
$('#saved').addEventListener('click',()=>{onlyFav=!onlyFav;category='Todos';$('#search').value='';render();$('#colecao').scrollIntoView({behavior:'smooth'});});
$('#custom-open')?.addEventListener('click',()=>openRequest());
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
$('#request-form').addEventListener('submit',event=>{
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  const message=`Olá! Gostaria de solicitar um orçamento na V3D.\n\nNome: ${String(form.get('name')).trim()}\nPedido: ${String(form.get('idea')).trim()}\nCor desejada: ${form.get('color')}`;
  if(!/^\d{12,15}$/.test(WHATSAPP_NUMBER)) { $('#form-status').textContent='Configure WHATSAPP_NUMBER no app.js para ativar o envio.';return; }
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
});
loadProducts();
