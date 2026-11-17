const API_URL = 'https://v3d-dashboard-kappa.vercel.app/api';

// Configure com DDI + DDD + número, apenas dígitos (ex.: 5582999999999).
const WHATSAPP_NUMBER = 5582996177211;
const $ = (selector) => document.querySelector(selector);

const normalize = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[char]));

const money = (value) => value === null || value === undefined || value === '' || !Number.isFinite(Number(value))
    ? 'Sob consulta'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

const imageURL = (product) => product.has_image === 0 || !product.image
    ? 'assets/placeholder.webp'
    : `${API_URL}/produtos/${encodeURIComponent(product.id)}/imagem`;

document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver = 'IntersectionObserver' in window && !reducedMotion
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;

function reveal(element, { delay = 0, variant = '' } = {}) {
    if (!element || element.classList.contains('reveal')) return;
    element.classList.add('reveal');
    if (variant) element.classList.add(`reveal-${variant}`);
    element.style.setProperty('--delay', `${delay}ms`);
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('is-visible');
}

function setupReveals() {
    reveal(document.querySelector('.hero-copy'), { variant: 'left' });
    reveal(document.querySelector('.hero-image'), { variant: 'right', delay: 150 });
    reveal(document.querySelector('.ribbon'));
    document.querySelectorAll('.section-top, .catalog-note, .toolbar, .filters, .results, .collection-more, .custom > div:first-child, .how > .eyebrow, .how > h2, footer')
        .forEach((element, index) => reveal(element, { delay: (index % 3) * 80 }));
    document.querySelectorAll('.steps article')
        .forEach((element, index) => reveal(element, { delay: index * 120 }));
}

function revealCards() {
    document.querySelectorAll('#products .card').forEach((card, index) => {
        reveal(card, { delay: (index % 4) * 90, variant: 'scale' });
    });
}

let products = [];
let category = 'Todos';
let onlyFav = false;
let favorites;

try {
    favorites = new Set(JSON.parse(localStorage.getItem('v3d-favorites') || '[]').map(Number));
} catch {
    favorites = new Set();
}

function filtered() {
    const result = products.filter((product) => (
        (category === 'Todos' || product.category === category) &&
        (!onlyFav || favorites.has(Number(product.id))) &&
        normalize([product.name, product.category, product.desc, product.material].join(' '))
            .includes(normalize($('#search').value.trim()))
    ));
    const sort = $('#sort').value;

    if (sort === 'az') result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    if (sort === 'za') result.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
    return result;
}

function renderFilters() {
    const categories = ['Todos', ...new Set(products.map((product) => product.category).filter(Boolean))];

    $('#filters').innerHTML = categories.map((item) => `
        <button type="button" data-category="${escapeHTML(item)}" class="${item === category ? 'active' : ''}" aria-pressed="${item === category}">
            ${escapeHTML(item)}
            <span>${item === 'Todos' ? products.length : products.filter((product) => product.category === item).length}</span>
        </button>
    `).join('');
}

function render() {
    const matches = filtered();
    const limit = Number($('#products').dataset.limit);
    const list = limit ? matches.slice(0, limit) : matches;

    $('#products').innerHTML = list.map((product) => `
        <article class="card">
            <div class="product-image">
                <button class="photo-button" data-product="${product.id}" aria-label="Ver detalhes de ${escapeHTML(product.name)}">
                    <img class="photo" src="${imageURL(product)}" alt="${escapeHTML(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='assets/placeholder.webp'">
                </button>
                <button class="heart" data-fav="${product.id}" aria-label="Favoritar ${escapeHTML(product.name)}" aria-pressed="${favorites.has(Number(product.id))}">
                    <i class="fa-${favorites.has(Number(product.id)) ? 'solid' : 'regular'} fa-heart"></i>
                </button>
            </div>
            <p class="category">${escapeHTML(product.category || 'Impressão 3D')}</p>
            <h3><a href="#produto-${product.id}" data-product="${product.id}">${escapeHTML(product.name)}</a></h3>
            <div class="card-bottom">
                <strong>${money(product.price)}</strong>
                <button data-product="${product.id}" aria-label="Ver ${escapeHTML(product.name)}">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
            </div>
        </article>
    `).join('');

    revealCards();

    $('#empty').hidden = matches.length > 0;
    $('#result-count').textContent = `${list.length}${matches.length > list.length ? ` de ${matches.length}` : ''} ${matches.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
    $('#fav-count').innerHTML = `<i class="fa-${onlyFav ? 'solid' : 'regular'} fa-heart"></i> ${products.filter((product) => favorites.has(Number(product.id))).length}`;
    $('#saved').setAttribute('aria-pressed', String(onlyFav));

    $('#filters').querySelectorAll('[data-category]').forEach((button) => {
        const active = button.dataset.category === category;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
}

function openProduct(id) {
    const product = products.find((item) => Number(item.id) === Number(id));
    if (!product) return;

    const colors = Array.isArray(product.colors) ? product.colors : (() => {
        try {
            return JSON.parse(product.colors || '[]');
        } catch {
            return [];
        }
    })();
    const validColors = Array.isArray(colors) ? colors : [];

    $('#detail-content').innerHTML = `
        <div class="detail-layout">
            <img src="${imageURL(product)}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.src='assets/placeholder.webp'">
            <div class="detail-info">
                <p class="eyebrow">${escapeHTML(product.category || 'PRODUTO V3D')}</p>
                <h2>${escapeHTML(product.name)}</h2>
                <p>${escapeHTML(product.desc || 'Conheça este produto da V3D.')}</p>
                <p class="detail-price">${money(product.price)}</p>
                <dl>
                    <dt>Material</dt><dd>${escapeHTML(product.material || 'A consultar')}</dd>
                    <dt>Dimensões</dt><dd>${escapeHTML(product.size || 'A consultar')}</dd>
                    <dt>Cores disponíveis</dt><dd>${validColors.length ? escapeHTML(validColors.join(', ')) : 'Consultar disponibilidade'}</dd>
                </dl>
                <button class="primary" data-request="${product.id}">
                    Solicitar pelo WhatsApp <i class="fa-brands fa-whatsapp"></i>
                </button>
            </div>
        </div>`;
    $('#detail').showModal();
}

function openRequest(product) {
    if ($('#detail').open) $('#detail').close();
    $('#request-form').reset();
    $('#form-status').textContent = '';
    if (product) {
        $('#request-form').elements.idea.value = `Tenho interesse no produto ${product.name} (código ${product.id}), valor ${money(product.price)}. Gostaria de confirmar disponibilidade e prazo.`;
    }
    $('#request').showModal();
}

function reset() {
    category = 'Todos';
    onlyFav = false;
    $('#search').value = '';
    $('#sort').value = 'featured';
    render();
}

async function loadProducts() {
    $('#result-count').textContent = 'Carregando produtos...';
    let data;

    try {
        const response = await fetch(`${API_URL}/produtos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        $('#result-count').textContent = 'Não foi possível carregar os produtos.';
        $('#products').innerHTML = '<p class="load-error">Erro de conexão com o catálogo. Tente novamente mais tarde.</p>';
        $('#empty').hidden = true;
        return;
    }

    products = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : Array.isArray(data.produtos) ? data.produtos : [];
    renderFilters();
    render();

    const featured = products.find((product) => product.has_image && product.image) || products[0];
    const heroButton = $('#hero-product');
    if (featured && heroButton) {
        heroButton.dataset.product = featured.id;
        heroButton.setAttribute('aria-label', `Ver ${featured.name}`);
    }
}

document.addEventListener('click', (event) => {
    const button = event.target.closest('button, a');
    if (!button) return;

    if (button.hasAttribute('data-product')) {
        event.preventDefault();
        openProduct(button.dataset.product);
    } else if (button.hasAttribute('data-fav')) {
        const id = Number(button.dataset.fav);
        favorites.has(id) ? favorites.delete(id) : favorites.add(id);
        try {
            localStorage.setItem('v3d-favorites', JSON.stringify([...favorites]));
        } catch {
            // Local storage may be unavailable in private browsing contexts.
        }
        render();
    } else if (button.hasAttribute('data-category')) {
        category = button.dataset.category;
        onlyFav = false;
        render();
    } else if (button.hasAttribute('data-request')) {
        openRequest(products.find((product) => Number(product.id) === Number(button.dataset.request)));
    } else if (button.classList.contains('close')) {
        button.closest('dialog').close();
    }
});

$('#search').addEventListener('input', render);
$('#sort').addEventListener('change', render);
$('#reset').addEventListener('click', reset);
$('#empty-reset').addEventListener('click', reset);
$('#saved').addEventListener('click', () => {
    onlyFav = !onlyFav;
    category = 'Todos';
    $('#search').value = '';
    render();
    $('#colecao').scrollIntoView({ behavior: 'smooth' });
});
$('#custom-open')?.addEventListener('click', () => openRequest());

document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
}));


$('#request-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const name = String(form.get('name') || '').trim();
    const idea = String(form.get('idea') || '').trim();
    const color = String(form.get('color') || 'Não informada');

    const message = `Olá! Gostaria de solicitar um orçamento na V3D.

Nome: ${name}
Pedido: ${idea}
Cor desejada: ${color}`;

    if (!/^\d{12,15}$/.test(WHATSAPP_NUMBER)) {
        $('#form-status').textContent =
            'Número do WhatsApp não configurado.';
        return;
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
});


setupReveals();
loadProducts();