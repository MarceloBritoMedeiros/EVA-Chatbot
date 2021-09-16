
class Stats{
    constructor(){
        this._recipient = "";
        this._services = "";
        this._unidade = ""; 
        this._cpf = "";
        this._dNascimento;
        this._horario;
        this._dia;   
        this._historico=[];
        this._typeInput=["selecao_unidades","selecao_dias","selecao_horarios", "transicao"]
    }   

    getTypeInput(){
        return this._typeInput;
    }

    setTypeInput(typeInput){
        this._typeInput = typeInput;
    }

    getRecipient(){
        return this._recipient;
    }

    setRecipient(recipient){
        this._recipient = recipient;
    }
    getServices(){
        return this._services;
    }

    setServices(services){
        this._services=services;
    }
    getUnidade(){
        return this._unidade;
    }
    setUnidade(unidade){
        this._unidade=unidade;
    }
    getCpf(){
        return this._cpf;
    }

    setCpf(cpf){
        this._cpf=cpf;
    }

    getDNascimento(){
        return this._dNascimento;
    }

    setDNascimento(dNascimento){
        this._dNascimento=dNascimento;
    }
    getDia(){
        return this._dia;
    }

    setDia(dia){
        this._dia=dia;
    }
    getHorario(){
        return this._horario;
    }

    setHorario(horario){
        this._horario=horario;
    }
    getHistorico(){
        return this._historico;
    }
    setHistorico(historico, i){
        this._historico[i]=historico;
    }
    delHistorico(){
        this._historico.pop();
    }
    addHistorico(historico){
        this._historico.push(historico);
    }    

}

module.exports = Stats;