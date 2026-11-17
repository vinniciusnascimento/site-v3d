const API_URL = "https://v3d-dashboard-kappa.vercel.app/api";

let products = [];

async function getAllProducts() {
    const response = await fetch(`${API_URL}/produtos`);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}

async function loadProducts() {
    try {
        products = await getAllProducts();

        console.log("Produtos carregados:", products);

        // Atualiza favoritos depois de carregar os produtos
        favorites = new Set(
            JSON.parse(localStorage.getItem('v3d-favorites') || '[]')
                .map(Number)
                .filter(id => products.some(p => Number(p.id) === id))
        );

        // Renderiza somente depois de receber os produtos
        render();

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

const $ = s => document.querySelector(s);

let category = 'Todos';
let onlyFav = false;
let favorites = new Set();

try {
    favorites = new Set(
        JSON.parse(localStorage.getItem('v3d-favorites') || '[]')
            .filter(id => products.some(p => p.id === id))
    );
} catch { }

const normalize = s =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const COLOR_HEX = {
    Areia: '#d9b99b',
    Branco: '#efefe8',
    Verde: '#9af345',
    Preto: '#272a25'
};

function filtered() {
    const query = normalize($('#search').value.trim());

    const list = products.filter(p =>
        (category === 'Todos' || p.category === category) &&
        (!onlyFav || favorites.has(p.id)) &&
        normalize(`${p.name} ${p.category} ${p.desc}`).includes(query)
    );

    const sort = $('#sort').value;
    if (sort !== 'featured') {
        list.sort((a, b) =>
            a.name.localeCompare(b.name, 'pt-BR') * (sort === 'az' ? 1 : -1)
        );
    }

    return list;
}

function render() {
    const matches = filtered();
    const limit = Number($('#products').dataset.limit);
    const list = limit ? matches.slice(0, limit) : matches;

    $('#products').innerHTML = list.map(p => `
    <article class="card">
      <div class="product-image">
        <button class="photo-button" data-product="${p.id}" aria-label="Ver detalhes de ${p.name}">
          <img class="photo" src="assets/${p.image}.webp" alt="${p.name} em uma composição de mesa" loading="lazy">
        </button>
        <span class="tag">EXEMPLO · SOB ENCOMENDA</span>
        <button class="heart" data-fav="${p.id}" aria-label="Favoritar ${p.name}" aria-pressed="${favorites.has(p.id)}">
          <i class="${favorites.has(p.id) ? 'fa-solid' : 'fa-regular'} fa-heart" aria-hidden="true"></i>
        </button>
      </div>
      <p class="category">${p.category}</p>
      <h3><a href="#produto-${p.id}" data-product="${p.id}">${p.name}</a></h3>
      <div class="card-bottom">
        <span>Valor sob consulta</span>
        <button data-product="${p.id}" aria-label="Ver ${p.name}"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></button>
      </div>
    </article>
  `).join('');

    $('#empty').hidden = !!list.length;
    $('#result-count').textContent =
        `${list.length}${matches.length > list.length ? ` de ${matches.length}` : ''} ${list.length === 1 ? 'objeto encontrado' : 'objetos encontrados'}${onlyFav ? ' · favoritos' : ''}`;
    $('#fav-count').innerHTML =
        `<i class="fa-${onlyFav ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i> ${favorites.size}`;
    $('#saved').setAttribute('aria-pressed', onlyFav);

    document.querySelectorAll('[data-category]').forEach(b => {
        const active = b.dataset.category === category;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active);
    });
}

function reset() {
    category = 'Todos';
    onlyFav = false;
    $('#search').value = '';
    $('#sort').value = 'featured';
    render();
}

function toast(t) {
    $('#toast').textContent = t;
    $('#toast').classList.add('visible');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(
        () => $('#toast').classList.remove('visible'),
        2400
    );
}

function openProduct(id) {
    const p = products.find(p => p.id === id);
    if (!p) return;

    $('#detail-content').innerHTML = `
    <div class="detail-layout">
      <img src="assets/${p.image}.webp" alt="${p.name}">
      <div class="detail-info">
        <p class="eyebrow">${p.category.toUpperCase()} / EXEMPLO</p>
        <h2>${p.name}</h2>
        <p>${p.desc}</p>
        <dl>
          <dt>Disponibilidade de demonstração</dt>
          <dd>Sob encomenda · prazo a confirmar</dd>
          <dt>Material e medidas</dt>
          <dd>${p.material} · ${p.size.toLowerCase()}</dd>
          <dt>Cores de exemplo</dt>
          <dd id="color-name">${p.colors[0]}</dd>
        </dl>
        <div class="swatches">
          ${p.colors.map((c, i) => `
            <button
              style="background:${COLOR_HEX[c]}"
              data-color="${c}"
              aria-label="Cor ${c}"
              aria-pressed="${i === 0}"
              class="${i === 0 ? 'selected' : ''}"></button>
          `).join('')}
        </div>
        <p>Valor sob consulta. Nomes e opções ilustrativos; confirme os detalhes no orçamento.</p>
        <button class="primary" data-request="${p.id}">Preparar meu pedido <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></button>
      </div>
    </div>
  `;

    $('#detail').showModal();
}

function openRequest(p) {
    if ($('#detail').open) $('#detail').close();

    $('#request-form').reset();
    $('#form-status').textContent = '';

    if (p) {
        const color = $('#color-name')?.textContent || 'a definir';
        $('#request-form').elements.idea.value =
            `Tenho interesse no ${p.name}. Cor: ${color}. Gostaria de confirmar preço, medidas e prazo.`;
    }

    $('#request').showModal();
}

document.addEventListener('click', e => {
    const b = e.target.closest('button,a');
    if (!b) return;

    if (b.hasAttribute('data-product')) {
        e.preventDefault();
        openProduct(Number(b.dataset.product));
    }

    if (b.hasAttribute('data-fav')) {
        const id = Number(b.dataset.fav);
        favorites.has(id) ? favorites.delete(id) : favorites.add(id);
        try {
            localStorage.setItem('v3d-favorites', JSON.stringify([...favorites]));
        } catch { }
        render();
    }

    if (b.hasAttribute('data-category')) {
        category = b.dataset.category;
        onlyFav = false;
        render();
    }

    if (b.hasAttribute('data-color')) {
        $('#color-name').textContent = b.dataset.color;
        document.querySelectorAll('[data-color]').forEach(c => {
            c.classList.toggle('selected', c === b);
            c.setAttribute('aria-pressed', c === b);
        });
    }

    if (b.hasAttribute('data-request')) {
        openRequest(products.find(p => p.id === Number(b.dataset.request)));
    }

    if (b.classList.contains('close')) {
        b.closest('dialog').close();
    }
});

$('#search').addEventListener('input', render);
$('#sort').addEventListener('change', render);
$('#reset').onclick = reset;
$('#empty-reset').onclick = reset;

$('#saved').onclick = () => {
    onlyFav = !onlyFav;
    category = 'Todos';
    $('#search').value = '';
    render();
    $('#colecao').scrollIntoView({ behavior: 'smooth' });
};

if ($('#custom-open')) {
    $('#custom-open').onclick = () => openRequest();
}

document.querySelectorAll('dialog').forEach(d =>
    d.addEventListener('click', e => {
        if (e.target === d) {
            const r = d.getBoundingClientRect();
            if (
                e.clientX < r.left || e.clientX > r.right ||
                e.clientY < r.top || e.clientY > r.bottom
            ) {
                d.close();
            }
        }
    })
);

$('#request-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);

    const text =
        `Olá! Gostaria de solicitar um orçamento para um pedido na V3D.\n\n` +
        `Nome: ${f.get('name').trim()}\n` +
        `Ideia: ${f.get('idea').trim()}\n` +
        `Cor desejada: ${f.get('color')}`;

    window.location.href =
        `https://wa.me/${process.env.NUMERO_TELEFONE}?text=${encodeURIComponent(text)}`;
});

loadProducts();