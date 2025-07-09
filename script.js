// Estado do personagem
let character = {
    // Identidade
    apelido: '',
    aparencia: '',
    esquema: '',
    detalhesEsquema: '',
    
    // Atitudes
    atitudes: {
        agressiva: { value: 0, bugado: false },
        sagaz: { value: 0, bugado: false },
        empatica: { value: 0, bugado: false },
        furtiva: { value: 0, bugado: false }
    },
    
    // Perícias
    pericias: {
        analise: { value: 0, bugado: false },
        atletismo: { value: 0, bugado: false },
        'mano-a-mano': { value: 0, bugado: false },
        programacao: { value: 0, bugado: false },
        influencia: { value: 0, bugado: false },
        pilotagem: { value: 0, bugado: false },
        tiro: { value: 0, bugado: false },
        gambiarra: { value: 0, bugado: false },
        ciencias: { value: 0, bugado: false },
        manha: { value: 0, bugado: false }
    },
    
    // Especializações
    especializacoes: {},
    
    // Ampliações
    ampliacoes: [],
    
    // Equipamentos
    carga: 5,
    equipamentos: {},
    
    // Estresse e Dano
    estresse: [],
    dano: {
        leve: 0,
        moderado: 0,
        grave: false
    },
    exausta: false,
    sobrecarregada: false,
    atitudeBugada: '',
    consequenciaSobrecarga: ''
};

// Cache de elementos DOM para melhor performance
const domCache = {
    atitudeStatus: null,
    periciaStatus: null,
    cargaStatus: null,
    equipmentCheckboxes: null,
    stressCheckboxes: null,
    damageCheckboxes: null
};

// Função de debounce para otimizar performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Versões debounced das funções custosas
const debouncedValidateAtitudes = debounce(validateAtitudes, 50);
const debouncedValidatePericias = debounce(validatePericias, 50);
const debouncedUpdateCargaStatus = debounce(updateCargaStatus, 100);

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Cachear elementos DOM importantes
    domCache.atitudeStatus = document.getElementById('atitude-status');
    domCache.periciaStatus = document.getElementById('pericia-status');
    domCache.cargaStatus = document.getElementById('carga-status');
    domCache.equipmentCheckboxes = document.querySelectorAll('input[type="checkbox"][name^="equip-"]');
    domCache.stressCheckboxes = document.querySelectorAll('input[name^="stress-"]');
    domCache.damageCheckboxes = document.querySelectorAll('input[name^="dano-"]');
    
    initializeTabs();
    initializeFormHandlers();
    initializeDiceBoxes();
    initializeValidation();
    initializeEquipmentCategories();
});

// Sistema de Navegação
function initializeTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Remove active class from all tabs and contents
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Manipuladores de Formulário (otimizados)
function initializeFormHandlers() {
    // Identidade
    const apelido = document.getElementById('apelido');
    const aparencia = document.getElementById('aparencia');
    const esquema = document.getElementById('esquema');
    const detalhesEsquema = document.getElementById('detalhes-esquema');
    
    if (apelido) apelido.addEventListener('input', (e) => character.apelido = e.target.value);
    if (aparencia) aparencia.addEventListener('input', (e) => character.aparencia = e.target.value);
    if (esquema) esquema.addEventListener('change', (e) => character.esquema = e.target.value);
    if (detalhesEsquema) detalhesEsquema.addEventListener('input', (e) => character.detalhesEsquema = e.target.value);

    // Especializações com event delegation
    document.addEventListener('input', function(event) {
        if (event.target.matches('.especializacao-input')) {
            handleEspecializacaoChange(event);
        }
    });
    
    // Carga
    document.addEventListener('change', function(event) {
        if (event.target.matches('input[name="carga"]')) {
            character.carga = parseInt(event.target.value);
            debouncedUpdateCargaStatus();
        }
        
        // Equipamentos
        if (event.target.matches('input[type="checkbox"][name^="equip-"]')) {
            handleEquipmentChange(event);
        }
        
        // Estresse
        if (event.target.matches('input[name^="stress-"]')) {
            handleStressChange();
        }
        
        // Dano
        if (event.target.matches('input[name^="dano-"]')) {
            handleDamageChange();
        }
        
        // Estados
        if (event.target.id === 'exausta') {
            character.exausta = event.target.checked;
        }
        
        if (event.target.id === 'sobrecarregada') {
            character.sobrecarregada = event.target.checked;
        }
    });
}

// Sistema de Caixas de Dados Interativas
function initializeDiceBoxes() {
    // Inicializar caixas de atitudes
    document.querySelectorAll('[data-atitude]').forEach(box => {
        box.addEventListener('click', handleAtitudeDiceClick);
    });
    
    // Inicializar caixas de perícias
    document.querySelectorAll('[data-pericia]').forEach(box => {
        box.addEventListener('click', handlePericiaDiceClick);
    });
    
    // Atualizar estado inicial dos botões de especialização
    updateEspecializacaoButtons();
}

function handleAtitudeDiceClick(event) {
    const box = event.target;
    const atitude = box.dataset.atitude;
    const value = box.dataset.value;
    
    if (value === 'bugado') {
        // Toggle bugado
        const isBugado = box.classList.contains('active');
        box.classList.toggle('active');
        character.atitudes[atitude].bugado = !isBugado;
    } else {
        // Toggle this individual box
        box.classList.toggle('active');
        
        // Calcular valor usando cache local para evitar querySelectorAll
        let totalValue = 0;
        const atitudeContainer = box.closest('.atitude-column') || box.closest('.atitude-item');
        if (atitudeContainer) {
            const activeBoxes = atitudeContainer.querySelectorAll(`[data-atitude="${atitude}"][data-value]:not([data-value="bugado"]).active`);
            activeBoxes.forEach(activeBox => {
                totalValue += parseInt(activeBox.dataset.value);
            });
        }
        
        character.atitudes[atitude].value = totalValue;
    }
    
    // Usar requestAnimationFrame para otimizar a validação
    debouncedValidateAtitudes();
}

function handlePericiaDiceClick(event) {
    const box = event.target;
    const pericia = box.dataset.pericia;
    const value = box.dataset.value;
    const periciaContainer = box.closest('.pericia-item') || box.closest('.pericia-column');
    
    if (value === 'bugado') {
        // Toggle bugado
        const isBugado = box.classList.contains('active');
        box.classList.toggle('active');
        character.pericias[pericia].bugado = !isBugado;
    } else if (value === '3') {
        // Botão de especialização - verificar se já houver 2 pontos
        let currentValue = 0;
        if (periciaContainer) {
            const currentActiveBoxes = periciaContainer.querySelectorAll(`[data-pericia="${pericia}"][data-value]:not([data-value="bugado"]):not([data-value="3"]).active`);
            currentActiveBoxes.forEach(activeBox => {
                currentValue += parseInt(activeBox.dataset.value);
            });
        }
        
        // Só permite clicar na especialização se já houver pelo menos 2 pontos
        if (currentValue < 2 && !box.classList.contains('active')) {
            return; // Não faz nada se não houver 2 pontos e está tentando ativar
        }
        
        // Toggle this individual box
        box.classList.toggle('active');
        
        // Recalcular o valor total usando container local
        let totalValue = 0;
        if (periciaContainer) {
            const activeBoxes = periciaContainer.querySelectorAll(`[data-pericia="${pericia}"][data-value]:not([data-value="bugado"]).active`);
            activeBoxes.forEach(activeBox => {
                totalValue += parseInt(activeBox.dataset.value);
            });
        }
        
        character.pericias[pericia].value = totalValue;
    } else {
        // Toggle this individual box (pontos 1 e 2)
        box.classList.toggle('active');
        
        // Recalcular o valor total usando container local
        let totalValue = 0;
        if (periciaContainer) {
            const activeBoxes = periciaContainer.querySelectorAll(`[data-pericia="${pericia}"][data-value]:not([data-value="bugado"]).active`);
            activeBoxes.forEach(activeBox => {
                totalValue += parseInt(activeBox.dataset.value);
            });
        }
        
        // Limitar a 3 pontos máximo por perícia
        if (totalValue > 3) {
            // Se exceder 3, desfazer a última ação
            box.classList.toggle('active');
            return;
        }
        
        character.pericias[pericia].value = totalValue;
    }
    
    // Usar requestAnimationFrame para otimizar atualizações
    requestAnimationFrame(() => {
        updateEspecializacaoButtons();
        debouncedValidatePericias();
    });
}

function validateAtitudes() {
    const values = Object.values(character.atitudes).map(att => att.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const twoCount = values.filter(val => val === 2).length;
    const oneCount = values.filter(val => val === 1).length;
    
    const status = domCache.atitudeStatus;
    if (!status) return; // Proteção se elemento não existir
    
    if (twoCount === 1 && oneCount === 2 && total === 4) {
        status.textContent = 'Distribuição correta!';
        status.className = 'status-message valid';
    } else {
        status.textContent = 'Distribua: um ++ e dois +';
        status.className = 'status-message invalid';
    }
    
    // Usar requestAnimationFrame para otimizar
    requestAnimationFrame(() => updateDiceCalculatorOptions());
}

function validatePericias() {
    const values = Object.values(character.pericias).map(per => per.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    
    const status = domCache.periciaStatus;
    if (!status) return; // Proteção se elemento não existir
    
    if (total === 8) {
        status.textContent = 'Distribuição correta!';
        status.className = 'status-message valid';
    } else if (total < 8) {
        status.textContent = `Restam ${8 - total} pontos para distribuir`;
        status.className = 'status-message';
    } else {
        status.textContent = `Excesso de ${total - 8} pontos`;
        status.className = 'status-message invalid';
    }
    
    // Usar requestAnimationFrame para otimizar
    requestAnimationFrame(() => updateDiceCalculatorOptions());
}

// Especializações
function handleEspecializacaoChange() {
    const inputs = document.querySelectorAll('.especializacao-input');
    
    inputs.forEach(input => {
        const periciaName = input.dataset.pericia;
        character.especializacoes[periciaName] = input.value;
    });
}

// Atualizar visual dos botões de especialização
function updateEspecializacaoButtons() {
    // Para cada perícia, verificar se pode usar especialização
    Object.keys(character.pericias).forEach(pericia => {
        const especializacaoBox = document.querySelector(`[data-pericia="${pericia}"][data-value="3"]`);
        if (!especializacaoBox) return;
        
        // Calcular pontos atuais excluindo a especialização
        const activeBoxes = document.querySelectorAll(`[data-pericia="${pericia}"][data-value]:not([data-value="bugado"]):not([data-value="3"]).active`);
        let currentValue = 0;
        
        activeBoxes.forEach(activeBox => {
            currentValue += parseInt(activeBox.dataset.value);
        });
        
        // Se tem menos de 2 pontos e não está ativa, desabilitar visualmente
        if (currentValue < 2 && !especializacaoBox.classList.contains('active')) {
            especializacaoBox.classList.add('disabled');
            especializacaoBox.title = 'Precisa de pelo menos 2 pontos na perícia';
        } else {
            especializacaoBox.classList.remove('disabled');
            especializacaoBox.title = '3 pontos (Especialização)';
        }
    });
}

// Equipamentos
function handleEquipmentChange() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name^="equip-"]');
    
    checkboxes.forEach(checkbox => {
        character.equipamentos[checkbox.name] = {
            checked: checkbox.checked,
            weight: parseInt(checkbox.dataset.weight) || 1
        };
    });
    
    updateCargaStatus();
}

// Função para toggle das categorias de equipamentos
function toggleCategoria(headerElement) {
    const categoria = headerElement.parentElement;
    categoria.classList.toggle('collapsed');
}

// Função para atualizar contadores das categorias (otimizada)
function updateCategoriaCounter(categoria) {
    const categoriaElement = document.querySelector(`[data-categoria="${categoria}"]`)?.closest('.categoria-equipamento');
    if (!categoriaElement) return;
    
    const selectedItems = categoriaElement.querySelectorAll('input[type="checkbox"]:checked');
    const counter = categoriaElement.querySelector('.categoria-counter');
    const totalItems = categoriaElement.querySelectorAll('input[type="checkbox"]').length;
    
    // Atualizar contador
    if (counter) {
        counter.textContent = `(${selectedItems.length}/${totalItems})`;
    }
}

// Flag para evitar múltiplas inicializações
let equipmentCategoriesInitialized = false;

// Inicializar event listeners para equipamentos (otimizado com event delegation)
function initializeEquipmentCategories() {
    if (equipmentCategoriesInitialized) {
        return;
    }
    
    // Usar event delegation no body para capturar todos os checkboxes de equipamentos
    document.body.addEventListener('change', function(event) {
        if (event.target.matches('input[data-categoria]')) {
            const categoria = event.target.dataset.categoria;
            updateCategoriaCounter(categoria);
            debouncedUpdateCargaStatus(); // Usar versão debounced
        }
    });
    
    // Inicializar estado das categorias (todas fechadas)
    document.querySelectorAll('.categoria-equipamento').forEach(categoria => {
        categoria.classList.add('collapsed');
    });
    
    // Atualizar contadores iniciais
    const categorias = ['armas', 'protecoes', 'maquinas', 'ferramentas', 'kits', 'carga'];
    categorias.forEach(categoria => {
        updateCategoriaCounter(categoria);
    });
    
    equipmentCategoriesInitialized = true;
}

// Status da Carga otimizado
function updateCargaStatus() {
    let totalWeight = 0;
    
    // Usar cache de checkboxes para melhor performance
    if (domCache.equipmentCheckboxes) {
        domCache.equipmentCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const weight = parseInt(checkbox.dataset.weight) || 1;
                totalWeight += weight;
            }
        });
    }
    
    const maxCarga = character.carga;
    const status = domCache.cargaStatus;
    if (!status) return; // Proteção se elemento não existir
    
    if (totalWeight <= maxCarga) {
        status.textContent = `${totalWeight}/${maxCarga} pontos de carga`;
        status.className = 'status-message valid';
    } else {
        status.textContent = `Sobrecarga! ${totalWeight}/${maxCarga} pontos de carga`;
        status.className = 'status-message invalid';
    }
}

// Estresse otimizado
function handleStressChange() {
    if (!domCache.stressCheckboxes) return;
    
    const specialStressElement = document.querySelector('input[name="stress-special"]');
    const specialStressChecked = specialStressElement ? specialStressElement.checked : false;
    
    character.estresse = Array.from(domCache.stressCheckboxes).map(cb => cb.checked);
    
    // Usar requestAnimationFrame para otimizar
    requestAnimationFrame(() => updateStressIndicator(specialStressChecked));
}

// Dano otimizado
function handleDamageChange() {
    // Usar cache ou consultas mais específicas
    const danoLeveElements = document.querySelectorAll('input[name^="dano-leve"]:checked');
    const danoModeradoElements = document.querySelectorAll('input[name^="dano-moderado"]:checked');
    const danoGraveElement = document.querySelector('input[name="dano-grave"]');
    
    const danoLeve = danoLeveElements.length;
    const danoModerado = danoModeradoElements.length;
    const danoGrave = danoGraveElement ? danoGraveElement.checked : false;
    
    // Atualizar estado do personagem
    character.dano = {
        leve: danoLeve,
        moderado: danoModerado,
        grave: danoGrave
    };
    
    // Usar requestAnimationFrame para otimizar
    requestAnimationFrame(() => updateDamageIndicators(danoLeve, danoModerado, danoGrave));
}

// Atualizar indicador de estresse (sobrecarregada)
function updateStressIndicator(specialStressActive) {
    const indicatorSobrecarregada = document.getElementById('indicator-sobrecarregada');
    
    // Indicador de SOBRECARREGADA (bloco especial S marcado)
    if (specialStressActive) {
        showDamageIndicator(indicatorSobrecarregada, 'sobrecarregada');
    } else {
        hideDamageIndicator(indicatorSobrecarregada);
    }
}

// Atualizar indicadores visuais de dano
function updateDamageIndicators(danoLeve, danoModerado, danoGrave, specialStressActive = null) {
    const indicatorLeve = document.getElementById('indicator-leve');
    const indicatorModerado = document.getElementById('indicator-moderado');
    const indicatorGrave = document.getElementById('indicator-grave');
    
    // Indicador de Dano Leve (2 caixas = ▽E)
    if (danoLeve >= 2) {
        showDamageIndicator(indicatorLeve, 'leve');
    } else {
        hideDamageIndicator(indicatorLeve);
    }
    
    // Indicador de Dano Moderado (2 caixas = -1d)
    if (danoModerado >= 2) {
        showDamageIndicator(indicatorModerado, 'moderado');
    } else {
        hideDamageIndicator(indicatorModerado);
    }
    
    // Indicador de Dano Grave (1 caixa = EXAUSTA)
    if (danoGrave) {
        showDamageIndicator(indicatorGrave, 'grave');
    } else {
        hideDamageIndicator(indicatorGrave);
    }
    
    // Se specialStressActive foi fornecido, atualizar também o indicador de estresse
    if (specialStressActive !== null) {
        updateStressIndicator(specialStressActive);
    }
}

function showDamageIndicator(indicator, type) {
    if (!indicator) return;
    
    indicator.className = `damage-indicator ${type}`;
    indicator.style.display = 'flex';
}

function hideDamageIndicator(indicator) {
    if (!indicator) return;
    
    if (indicator.style.display !== 'none') {
        indicator.classList.add('fade-out');
        setTimeout(() => {
            indicator.style.display = 'none';
            indicator.classList.remove('fade-out');
        }, 300);
    }
}

// Ampliações
// Sistema de Dados
function initializeDiceSystem() {
    updateDiceCalculatorOptions();
    

}



// Validação
function initializeValidation() {
    // Validar perícias ao carregar
    const periciaInputs = document.querySelectorAll('.pericia-input');
    periciaInputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value > 3) {
                this.value = 3;
            } else if (value < 0) {
                this.value = 0;
            }
        });
    });
}

// Funções de atualização do personagem
function updateCharacterData() {
    // Identidade
    character.apelido = document.getElementById('apelido').value;
    character.aparencia = document.getElementById('aparencia').value;
    character.esquema = document.getElementById('esquema').value;
    character.detalhesEsquema = document.getElementById('detalhes-esquema').value;
    
    // Atitudes
    document.querySelectorAll('.atitude-select').forEach(select => {
        character.atitudes[select.name] = parseInt(select.value) || 0;
    });
    
    // Perícias
    document.querySelectorAll('.pericia-input').forEach(input => {
        const name = input.name.replace(/-/g, '');
        const finalName = name === 'manoamano' ? 'manoAmano' : name;
        character.pericias[finalName] = parseInt(input.value) || 0;
    });
    
    // Especializações
    document.querySelectorAll('.especializacao-input').forEach(input => {
        const periciaName = input.name.replace('-esp', '').replace(/-/g, '');
        const finalName = periciaName === 'manoamano' ? 'manoAmano' : periciaName;
        character.especializacoes[finalName] = input.value;
    });
    
    // Carga
    const cargaRadio = document.querySelector('input[name="carga"]:checked');
    if (cargaRadio) character.carga = parseInt(cargaRadio.value);
    
    // Equipamentos
    character.equipamentos = {};
    document.querySelectorAll('input[type="checkbox"][name^="equip-"]').forEach(checkbox => {
        if (checkbox.checked) {
            character.equipamentos[checkbox.name] = {
                checked: true,
                weight: parseInt(checkbox.dataset.weight) || 1
            };
        } else {
            character.equipamentos[checkbox.name] = {
                checked: false,
                weight: parseInt(checkbox.dataset.weight) || 1
            };
        }
    });
    
    // Estresse
    character.estresse = [];
    document.querySelectorAll('input[name^="stress-"]').forEach((checkbox, index) => {
        character.estresse[index] = checkbox.checked;
    });
    
    // Dano
    const danoLeve = document.querySelectorAll('input[name^="dano-leve"]:checked').length;
    const danoModerado = document.querySelectorAll('input[name^="dano-moderado"]:checked').length;
    const danoGrave = document.querySelector('input[name="dano-grave"]').checked;
    
    character.dano = {
        leve: danoLeve,
        moderado: danoModerado,
        grave: danoGrave
    };
    
    // Estados
    character.ajuda = document.querySelector('input[name="ajuda"]')?.checked || false;
    character.exausta = document.querySelector('input[name="exausta"]')?.checked || false;
    character.sobrecarregada = document.querySelector('input[name="sobrecarregada"]')?.checked || false;
    
    const retrospecto = document.querySelector('input[name="retrospecto"]:checked');
    character.retrospecto = retrospecto ? parseInt(retrospecto.value) : 0;
    
    // Ampliações
    character.ampliacoes = [];
    
    // Ampliações da seção de equipamentos
    document.querySelectorAll('.ampliacoes-grid-equipamentos .ampliacao-item-eq').forEach((item, index) => {
        const nome = item.querySelector(`input[name^="ampliacao-nome-eq"]`)?.value || '';
        const efeito = item.querySelector(`textarea[name^="ampliacao-efeito-eq"]`)?.value || '';
        
        if (nome || efeito) {
            character.ampliacoes.push({ nome, efeito, fonte: 'equipamentos' });
        }
    });
}

// Esta função foi removida como parte da refatoração do sistema de salvamento

function populateForm() {
    // Identidade
    document.getElementById('apelido').value = character.apelido || '';
    document.getElementById('aparencia').value = character.aparencia || '';
    document.getElementById('esquema').value = character.esquema || '';
    document.getElementById('detalhes-esquema').value = character.detalhesEsquema || '';
    
    // Atitudes - atualizar caixas de dados
    Object.entries(character.atitudes).forEach(([nome, atitude]) => {
        // Limpar todas as caixas desta atitude
        document.querySelectorAll(`[data-atitude="${nome}"]`).forEach(box => {
            box.classList.remove('active');
        });
        
        // Ativar caixas baseado no valor total
        let remainingValue = atitude.value || 0;
        
        // Ativar caixas de valor 2 primeiro (mais eficiente)
        const box2 = document.querySelector(`[data-atitude="${nome}"][data-value="2"]`);
        while (remainingValue >= 2 && box2) {
            box2.classList.add('active');
            remainingValue -= 2;
            break; // Só pode ter uma caixa de valor 2
        }
        
        // Ativar caixas de valor 1 para o restante
        const box1 = document.querySelector(`[data-atitude="${nome}"][data-value="1"]`);
        while (remainingValue >= 1 && box1) {
            box1.classList.add('active');
            remainingValue -= 1;
            break; // Só pode ter uma caixa de valor 1
        }
        
        // Ativar caixa bugada se necessário
        if (atitude.bugado) {
            const bugBox = document.querySelector(`[data-atitude="${nome}"][data-value="bugado"]`);
            if (bugBox) bugBox.classList.add('active');
        }
    });
    
    // Perícias - atualizar caixas de dados
    Object.entries(character.pericias).forEach(([nome, pericia]) => {
        // Limpar todas as caixas desta perícia
        document.querySelectorAll(`[data-pericia="${nome}"]`).forEach(box => {
            box.classList.remove('active');
        });
        
        // Ativar caixas baseado no valor total
        let remainingValue = pericia.value || 0;
        
        // Ativar caixa de valor 3 primeiro (mais eficiente)
        const box3 = document.querySelector(`[data-pericia="${nome}"][data-value="3"]`);
        if (remainingValue >= 3 && box3) {
            box3.classList.add('active');
            remainingValue -= 3;
        }
        
        // Ativar caixas de valor 2
        const box2 = document.querySelector(`[data-pericia="${nome}"][data-value="2"]`);
        if (remainingValue >= 2 && box2) {
            box2.classList.add('active');
            remainingValue -= 2;
        }
        
        // Ativar caixas de valor 1 para o restante
        const box1 = document.querySelector(`[data-pericia="${nome}"][data-value="1"]`);
        if (remainingValue >= 1 && box1) {
            box1.classList.add('active');
            remainingValue -= 1;
        }
        
        // Ativar caixa bugada se necessário
        if (pericia.bugado) {
            const bugBox = document.querySelector(`[data-pericia="${nome}"][data-value="bugado"]`);
            if (bugBox) bugBox.classList.add('active');
        }
    });
    
    // Especializações
    Object.entries(character.especializacoes || {}).forEach(([nome, valor]) => {
        const input = document.querySelector(`input[data-pericia="${nome}"]`);
        if (input) input.value = valor;
    });
    
    // Carga
    const cargaRadio = document.querySelector(`input[name="carga"][value="${character.carga}"]`);
    if (cargaRadio) cargaRadio.checked = true;
    
    // Equipamentos
    Object.entries(character.equipamentos || {}).forEach(([nome, equipData]) => {
        const checkbox = document.querySelector(`input[name="${nome}"]`);
        if (checkbox) {
            // Suporte para formato antigo (boolean) e novo formato (objeto)
            const isChecked = typeof equipData === 'boolean' ? equipData : equipData.checked;
            checkbox.checked = isChecked;
        }
    });
    
    // Estresse
    character.estresse.forEach((checked, index) => {
        const checkbox = document.querySelector(`input[name="stress-${index + 1}"]`);
        if (checkbox) checkbox.checked = checked;
    });
    
    // Dano
    if (character.dano) {
        // Carregar dano leve
        const danoLeveCheckboxes = document.querySelectorAll('input[name^="dano-leve"]');
        for (let i = 0; i < Math.min(character.dano.leve || 0, danoLeveCheckboxes.length); i++) {
            danoLeveCheckboxes[i].checked = true;
        }
        
        // Carregar dano moderado
        const danoModeradoCheckboxes = document.querySelectorAll('input[name^="dano-moderado"]');
        for (let i = 0; i < Math.min(character.dano.moderado || 0, danoModeradoCheckboxes.length); i++) {
            danoModeradoCheckboxes[i].checked = true;
        }
        
        // Carregar dano grave
        const danoGraveCheckbox = document.querySelector('input[name="dano-grave"]');
        if (danoGraveCheckbox) danoGraveCheckbox.checked = character.dano.grave || false;
        
        // Atualizar indicadores
        const specialStressActive = document.querySelector('input[name="stress-special"]').checked;
        updateDamageIndicators(
            character.dano.leve || 0,
            character.dano.moderado || 0,
            character.dano.grave || false,
            specialStressActive
        );
    }
    
    // Estados
    if (character.ajuda) {
        const ajudaCheckbox = document.querySelector('input[name="ajuda"]');
        if (ajudaCheckbox) ajudaCheckbox.checked = true;
    }
    
    if (character.retrospecto) {
        const retrospecto = document.querySelector(`input[name="retrospecto"][value="${character.retrospecto}"]`);
        if (retrospecto) retrospecto.checked = true;
    }
    
    // Carregar ampliações
    if (character.ampliacoes && character.ampliacoes.length > 0) {
        character.ampliacoes.forEach((ampliacao, index) => {
            // Adicionar apenas na seção de equipamentos (3 colunas fixas)
            const container = document.querySelector('.ampliacoes-grid-equipamentos');
            const item = container.querySelectorAll('.ampliacao-item-eq')[Math.min(index, 2)]; // Máximo 3 ampliações
            
            if (item && index < 3) {
                const nomeInput = item.querySelector('input[name^="ampliacao-nome-eq"]');
                const efeitoTextarea = item.querySelector('textarea[name^="ampliacao-efeito-eq"]');
                
                if (nomeInput) nomeInput.value = ampliacao.nome || '';
                if (efeitoTextarea) efeitoTextarea.value = ampliacao.efeito || '';
            }
        });
    }
    
    // Atualizar validações
    handleAtitudeChange();
    handlePericiaChange();
    updateCargaStatus();
    updateEspecializacaoButtons();
    
    // Atualizar contadores de equipamentos
    setTimeout(() => {
        ['armas', 'protecoes', 'maquinas', 'ferramentas', 'kits', 'carga'].forEach(categoria => {
            const firstCheckbox = document.querySelector(`[data-categoria="${categoria}"]`);
            if (firstCheckbox) {
                updateCategoriaCounter(categoria);
            }
        });
    }, 100);
}

// Funções de exportação/importação foram removidas na refatoração

// Adicionar estilos CSS para os indicadores de dano
const style = document.createElement('style');
style.textContent = `
    .damage-indicators {
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .damage-indicator {
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid;
        border-radius: 8px;
        padding: 8px 12px;
        font-family: 'Orbitron', monospace;
        font-weight: 700;
        font-size: 14px;
        text-align: center;
        animation: pulse 2s infinite;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    /* Cores organizadas dos indicadores de dano */
    .damage-indicator:nth-child(1) {
        border-color: #ffaa00;
        color: #ffaa00;
        text-shadow: 0 0 10px rgba(255, 170, 0, 0.8);
    }

    .damage-indicator:nth-child(2) {
        border-color: #ff6b6b;
        color: #ff6b6b;
        text-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
    }

    .damage-indicator:nth-child(3) {
        border-color: #dc2626;
        color: #dc2626;
        text-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
    }

    .damage-indicator:nth-child(4) {
        border-color: #9333ea;
        color: #9333ea;
        text-shadow: 0 0 10px rgba(147, 51, 234, 0.8);
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.05); opacity: 1; }
    }

    @media (max-width: 768px) {
        .damage-indicators {
            right: 10px;
            top: auto;
            bottom: 80px;
            transform: none;
        }
        
        .damage-indicator {
            font-size: 12px;
            padding: 6px 10px;
        }
    }
`;
document.head.appendChild(style);
