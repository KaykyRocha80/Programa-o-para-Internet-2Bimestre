let atendimentos = [];
let idEdicao = null;

const form = document.getElementById('formAtendimento');
const corpoTabela = document.getElementById('corpo-tabela');
const totalAgendamentos = document.getElementById('total-agendamentos');
const inputFiltro = document.getElementById('filtro-tutor');
const statusCarregamento = document.getElementById('status-carregamento');
const tituloFormulario = document.getElementById('titulo-formulario') || document.querySelector('#atendimento h2');
const btnCancelar = document.getElementById('btn-cancelar');
const mensagem = document.getElementById('mensagem');

async function carregarDadosIniciais() {
    try {
        const resposta = await fetch('dados.json');
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        atendimentos = await resposta.json();
        statusCarregamento.style.display = 'none';
        renderizarTabela();
        atualizarResumo();

    } catch (erro) {
        console.error(erro);
        statusCarregamento.innerHTML = `<span style="color: red;">Erro ao carregar os dados: ${erro.message}. Verifique se o arquivo dados.json existe e se você está usando um servidor local.</span>`;
    }
}

function renderizarTabela(filtro = '') {
    corpoTabela.innerHTML = '';
    
    const dadosFiltrados = atendimentos.filter(item => 
        item.tutor.toLowerCase().includes(filtro.toLowerCase()) || 
        item.pet.toLowerCase().includes(filtro.toLowerCase())
    );

    if (dadosFiltrados.length === 0) {
        corpoTabela.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 10px;">Nenhum agendamento encontrado.</td></tr>';
        return;
    }

    dadosFiltrados.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #ddd';
        tr.innerHTML = `
            <td style="padding: 10px; border: 1px solid #ccc;">${item.pet} (${item.tutor})</td>
            <td style="padding: 10px; border: 1px solid #ccc;">${item.servico}</td>
            <td style="padding: 10px; border: 1px solid #ccc;">${item.data}</td>
            <td style="padding: 10px; border: 1px solid #ccc;">
                <button onclick="prepararEdicao(${item.id})" style="background: #f59e0b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Editar</button>
                <button onclick="excluirAtendimento(${item.id})" style="background: #b91c1c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Excluir</button>
            </td>
        `;
        corpoTabela.appendChild(tr);
    });
}

function atualizarResumo() {
    totalAgendamentos.textContent = atendimentos.length;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const tutor = document.getElementById('tutor').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const pet = document.getElementById('pet').value.trim();
    const especie = document.getElementById('especie').value;
    const porte = document.querySelector('input[name="porte"]:checked')?.value || '';
    const servico = document.getElementById('servico').value;
    const data = document.getElementById('data').value;
    const turno = document.querySelector('input[name="turno"]:checked')?.value || '';
    const observacao = document.getElementById('observacao').value.trim();
    const termos = document.querySelector('input[name="termos"]').checked;

    if(!tutor || !pet || !data || !especie || !servico) {
        mensagem.textContent = "❌ Preencha todos os campos obrigatórios.";
        mensagem.className = "mensagem erro";
        return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) {
        mensagem.textContent = "❌ A data do agendamento não pode ser no passado.";
        mensagem.className = "mensagem erro";
        return;
    }

    const duplicado = atendimentos.find(a => 
        a.pet.toLowerCase() === pet.toLowerCase() && 
        a.data === data && 
        a.servico === servico &&
        a.id !== idEdicao
    );

    if (duplicado) {
        mensagem.textContent = "❌ Erro: Este pet já tem este serviço agendado para esta data.";
        mensagem.className = "mensagem erro";
        return;
    }

    if (idEdicao) {
        const index = atendimentos.findIndex(a => a.id === idEdicao);
        atendimentos[index] = { id: idEdicao, tutor, email, telefone, pet, especie, porte, servico, data, turno, observacao, termos };
        mensagem.textContent = "✅ Agendamento editado com sucesso!";
        resetarFormulario();
    } else {
        const novoId = atendimentos.length > 0 ? Math.max(...atendimentos.map(a => a.id)) + 1 : 1;
        atendimentos.push({ id: novoId, tutor, email, telefone, pet, especie, porte, servico, data, turno, observacao, termos });
        mensagem.textContent = "✅ Agendamento criado com sucesso!";
        form.reset();
    }

    mensagem.className = "mensagem sucesso";
    renderizarTabela(inputFiltro.value);
    atualizarResumo();
    setTimeout(() => mensagem.textContent = "", 3000);
});

window.prepararEdicao = function(id) {
    const atendimento = atendimentos.find(a => a.id === id);
    if (!atendimento) return;

    document.getElementById('tutor').value = atendimento.tutor || '';
    document.getElementById('email').value = atendimento.email || '';
    document.getElementById('telefone').value = atendimento.telefone || '';
    document.getElementById('pet').value = atendimento.pet || '';
    document.getElementById('especie').value = atendimento.especie || '';
    document.getElementById('servico').value = atendimento.servico || '';
    document.getElementById('data').value = atendimento.data || '';
    document.getElementById('observacao').value = atendimento.observacao || '';

    if (atendimento.porte) {
        const radioPorte = document.querySelector(`input[name="porte"][value="${atendimento.porte}"]`);
        if (radioPorte) radioPorte.checked = true;
    }

    if (atendimento.turno) {
        const radioTurno = document.querySelector(`input[name="turno"][value="${atendimento.turno}"]`);
        if (radioTurno) radioTurno.checked = true;
    }

    document.querySelector('input[name="termos"]').checked = atendimento.termos || false;

    idEdicao = id;
    if (tituloFormulario) tituloFormulario.textContent = "Editando Agendamento";
    btnCancelar.style.display = 'inline-block';
    window.scrollTo(0, 0);
};

window.excluirAtendimento = function(id) {
    if (confirm("Tem certeza que deseja excluir este agendamento?")) {
        atendimentos = atendimentos.filter(a => a.id !== id);
        renderizarTabela(inputFiltro.value);
        atualizarResumo();
    }
};

btnCancelar.addEventListener('click', resetarFormulario);

function resetarFormulario() {
    form.reset();
    idEdicao = null;
    if (tituloFormulario) tituloFormulario.textContent = "Gerenciamento de Atendimentos";
    btnCancelar.style.display = 'none';
    mensagem.textContent = "";
}

inputFiltro.addEventListener('input', (e) => {
    renderizarTabela(e.target.value);
});

carregarDadosIniciais();