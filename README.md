<div align="center">
<img src="assets/logo.webp" alt="Logo V3D" width="120">
  
# V3D — Do digital para o mundo real
 
Vitrine de objetos impressos em 3D, feitos sob encomenda, com pedido de orçamento via WhatsApp.
 
[![Demo](https://img.shields.io/badge/DEMO-site--v3d.vercel.app-9af345?style=for-the-badge&logo=vercel&logoColor=black)](https://site-v3d.vercel.app)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
 
</div>
 
## Sobre
 
**V3D** é uma marca de impressão 3D de Maceió, AL. Este repositório contém o site-vitrine da marca: um catálogo de peças de exemplo (suporte, organizador, decoração), com busca, filtros e favoritos, e um fluxo para solicitar orçamento de peças personalizadas direto pelo WhatsApp.
 
Todas as peças são **sob encomenda**: cor, tamanho e acabamento são confirmados no orçamento, e os preços são "sob consulta".
 
> O site é uma vitrine de demonstração (`noindex, nofollow`).
 
## Funcionalidades
 
- Catálogo de produtos renderizado via JavaScript
- Busca por texto, ignorando acentos e maiúsculas
- Filtro por categoria: Setup & tecnologia, Organização e Decoração
- Ordenação por destaques, A–Z e Z–A
- Favoritos persistidos no `localStorage`
- Modal de detalhes do produto, com seleção de cor
- Formulário de pedido personalizado que abre uma conversa no WhatsApp com a mensagem já preenchida
- Layout responsivo, com marcação acessível (`aria-*`, `<dialog>` nativo)
## Estrutura
 
```
site-v3d/
├── assets/          # logo e imagens dos produtos (.webp)
├── index.html       # página inicial: hero, coleção, personalização e como funciona
├── produtos.html    # catálogo completo
├── app.js           # dados dos produtos, filtros, favoritos, modais e envio do pedido
├── style.css        # estilos do site
└── package.json
```
 
## Tecnologias
 
- HTML5, CSS3 e JavaScript puro, sem framework
- [Font Awesome 6](https://fontawesome.com/) via CDN
- [Vercel](https://vercel.com/) para hospedagem
## Como rodar
 
Não há etapa de build. Clone o repositório e sirva a pasta com qualquer servidor estático:
 
```bash
git clone https://github.com/vinniciusnascimento/site-v3d.git
cd site-v3d
 
# opção 1
npx serve .
 
# opção 2
python3 -m http.server 8000
```
 
Depois, abra `http://localhost:3000` (serve) ou `http://localhost:8000` (python).
 
## Configuração
 
O número de WhatsApp que recebe os pedidos é lido da variável `NUMERO_TELEFONE` (formato internacional, só dígitos, ex.: `5582999999999`). O arquivo `.env` está no `.gitignore` e não é versionado.
 
## Adicionando produtos
 
Os produtos ficam no array `products` no início do `app.js`. Para cadastrar uma peça, adicione um objeto e coloque a imagem em `assets/`:
 
```js
{
    id: 4,
    name: 'Nome da peça',
    category: 'Organização',
    image: 'nome-do-arquivo',   // assets/nome-do-arquivo.webp
    desc: 'Descrição curta.',
    size: 'Dimensões a confirmar',
    material: 'Material a confirmar',
    colors: ['Branco', 'Preto']  // Areia, Branco, Verde ou Preto
}
```
 
## Autor
 
Feito por **Vinnicius Nascimento** · Maceió, AL
 
[![GitHub](https://img.shields.io/badge/GitHub-vinniciusnascimento-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/vinniciusnascimento)
 
