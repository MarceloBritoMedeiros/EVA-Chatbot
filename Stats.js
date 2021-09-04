class Stats{
    constructor(){
        this._servico="";
        this._services="";
        this._unidade=""; 
        this._cpf="";
        this._dNascimento;     
        this._horario;
        this._dia;   
    }

    getServico(){
        return this._servico;
    }

    setServico(servico){
        this._servico=servico;
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

}

module.exports = Stats;