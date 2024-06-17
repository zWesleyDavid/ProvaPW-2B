const url = 'https://servicodados.ibge.gov.br/api/v3/noticias/';

async function chamarApi() {
    const resp = await fetch(url);
    if (resp.status === 200) {
        const obj = await resp.json();
        console.log(obj);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const qtd = params.get('qtd') || 10; // Default to 10 items
    const page = params.get('page') || 1;
    params.set('qtd', qtd);
    params.set('page', page);

    fetch(`${url}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            displayNews(data.items);
            updateFilterCount(params); // Update filter count on page load
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));

    // Open dialog on filter icon click
    const filterIcon = document.getElementById('iconeFiltro');
    const dialog = document.getElementById('dialog');
    filterIcon.addEventListener('click', () => {
        dialog.showModal();
    });

    // Close dialog on close button click
    const closeButton = document.querySelector('#dialog #fechar button');
    closeButton.addEventListener('click', () => {
        dialog.close();
    });

    // Apply filters on form submit
    const form = document.getElementById('form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        applyFilters();
        dialog.close();
    });

    // Search on form submit
    const searchForm = document.getElementById('busca');
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        searchNews();
    });
});

function applyFilters() {
    const tipo = document.getElementById('tipo').value;
    const dataDe = document.getElementById('data-de').value;
    const dataAte = document.getElementById('data-ate').value;
    const quantidade = document.getElementById('quantidade').value || 10; // Default to 10 items

    const params = new URLSearchParams();
    if (tipo) params.set('tipo', tipo);
    if (dataDe) params.set('de', formatDateToMMDDYYYY(dataDe));
    if (dataAte) params.set('ate', formatDateToMMDDYYYY(dataAte));
    params.set('qtd', quantidade);
    params.set('page', 1); // Reset to first page

    fetch(`${url}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            clearNewsContainer();
            displayNews(data.items);
            updateFilterCount(params); // Update filter count when filters are applied
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));
}

function searchNews() {
    const searchTerm = document.getElementById('pesquisa').value;
    console.log('Search term:', searchTerm); // Debugging log

    const params = new URLSearchParams();
    params.set('busca', searchTerm);
    params.set('qtd', 10); // Default to 10 items
    params.set('page', 1); // Reset to first page

    console.log('Fetch URL:', `${url}?${params}`); // Debugging log

    fetch(`${url}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Search results:', data); // Debugging log
            clearNewsContainer();
            displayNews(data.items);
            updateFilterCount(params); // Update filter count when search is performed
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));
}

function updateFilterCount(params) {
    let activeFilterCount = 0;
    params.forEach((value, key) => {
        if (key !== 'page' && key !== 'busca' && value) {
            activeFilterCount++;
        }
    });
    document.getElementById('filter-count').textContent = activeFilterCount;
}

function clearNewsContainer() {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = ''; // Clear the container
}

function formatDateToMMDDYYYY(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}-${day}-${year}`;
}

function displayNews(newsArray) {
    if (!Array.isArray(newsArray)) {
        console.error('Expected an array but got', typeof newsArray);
        return;
    }

    const newsContainer = document.getElementById('news-container');
    const newsList = document.createElement('ul');
    newsContainer.innerHTML = '';
    newsContainer.appendChild(newsList);

    newsArray.forEach(news => {
        const newsElement = document.createElement('li');
        newsElement.className = 'news-item';

        let imageObj = {};
        if (news.imagens) {
            try {
                imageObj = JSON.parse(news.imagens);
            } catch (error) {
                console.error('Error parsing image JSON:', error);
            }
        }

        const baseUrl = 'https://agenciadenoticias.ibge.gov.br/';
        const imageUrl = imageObj.image_intro ? `${baseUrl}${imageObj.image_intro}` : '';

        const publicationDate = new Date(news.data_publicacao);
        const timeSincePublication = getTimeSincePublication(publicationDate);

        newsElement.innerHTML = `
            <img src="${imageUrl}" alt="${imageObj.image_intro_alt || news.titulo}" />
            <div class="news-info">
                <h2>${news.titulo}</h2>
                <p>${news.introducao}</p>
                <div class="news-parag">
                    <p>${formatEditorias(news.editorias)}</p>
                    <p>${timeSincePublication}</p>
                </div>
                <button onclick="window.open('${news.link}', '_blank')">Leia Mais</button>
            </div>
        `;

        newsList.appendChild(newsElement);
    });

    createPaginationButtons();

}

function createPaginationButtons() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Limpa os botões existentes, se houver

    const params = new URLSearchParams(window.location.search);
    const currentPage = parseInt(params.get('page')) || 1; // Página atual da query string

    const totalPages = 20; // Assumindo que há 20 páginas no total

    const maxButtonsToShow = 10; // Máximo de botões a serem mostrados
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    if (endPage - startPage + 1 < maxButtonsToShow) {
        startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('pagination-button');
        if (i === currentPage) {
            button.classList.add('current');
        }
        button.addEventListener('click', () => {
            params.set('page', i);
            window.location.search = params.toString();
        });
        paginationContainer.appendChild(button);
    }
}

function formatEditorias(editorias) {
    const formattedEditorias = editorias
        .replace(/;/g, ',')
        .split(',')
        .map(editoria => `#${editoria.trim()}`)
        .join(' ');
    return formattedEditorias;
}

function getTimeSincePublication(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffDays === 0) {
        return "Publicado hoje";
    } else if (diffDays === 1) {
        return "Publicado ontem";
    } else if (diffWeeks === 1) {
        return "Publicado há 1 semana";
    } else if (diffWeeks === 2) {
        return "Publicado há 2 semanas";
    } else if (diffMonths === 1) {
        return "Publicado há 1 mês";
    } else if (diffDays < 7) {
        return `Publicado há ${diffDays} dias`;
    } else if (diffDays < 30) {
        return `Publicado há ${diffWeeks} semanas`;
    } else {
        return `Publicado há ${diffMonths} meses`;
    }
}
