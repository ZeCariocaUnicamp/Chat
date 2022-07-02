import React from 'react';
import axios from "axios";


class ApiMDC{
  constructor(base_url, key){
    this.base_url = base_url
    this.key = key

    this.api = axios.create({
      baseURL: this.base_url,
    });
  }

  async check_email(email){
    const url = this.base_url+"check_user";
    const dat = {
               email: email,
               server_key: this.key
    }

    return await axios({
      method: 'post',
      url: url,
      headers: {"Content-Type": "application/json"}, 
      data: dat
    })
    .then(function (response) {
      return response
    })
    .catch(function (error) {
      return error
    });
  }

  async create_account(email, name){
    const url = this.base_url+"add_user";
    const dat = {
               email: email,
               name: name,
               server_key: this.key
    }

    return await axios({
      method: 'post',
      url: url,
      headers: {"Content-Type": "application/json"}, 
      data: dat
    })
    .then(function (response) {
      return response
    })
    .catch(function (error) {
      return error
    });
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      server_url: "http://localhost:8888/",
      server_key: "1033b11e-ea82-11ec-8fea-0242ac120002",
      email: "mail@mail.com_",
      name: "",
      user_uid: "",

      step: "server_info",// server_info, user_info
      btn_label: "Próximo"
    };
    

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;

    this.setState({
      [name]: target.value
    });
  }

  render() {
    if (this.state.step==="server_info"){
      return this.render_server_info()
    }else if (this.state.step==="user_info_criar"){
      return this.render_user_info_new_user()
    }else if (this.state.step==="user_info_confirmar_old"){
      return this.render_user_info_old_user()
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    

    if (this.state.step==="server_info"){
        const api = new ApiMDC(this.state.server_url, this.state.server_key)
        const dis = this;
        api.check_email(this.state.email).then(function(resp){
          if(resp.status===200){
            if(resp.data.status){
              dis.setState({'user_uid': resp.data.uid})
              dis.setState({'name': resp.data.name})
              dis.enable_confirm_account();
            }else{
              dis.enable_create_account();
            }
          }else{
            alert("Not able to connect with credentials and endpoint.")
          }
        })
    }else if(this.state.step==="user_info_confirmar_old"){
      this.access_chat()
    }else if(this.state.step==="user_info_criar"){
      this.create_account()
    }
  }

  create_account(){
    const api = new ApiMDC(this.state.server_url, this.state.server_key)
    const dis = this;
    api.create_account(this.state.email, this.state.name).then(function(resp){
      if(resp.status===200){
        if(resp.data.status==="user_created"){
          dis.setState({'user_uid': resp.data.uid})
          dis.access_chat()
        }else{
          alert("Something went wrong. Check console for more informations")
          console.error(resp)
        }
      }else{
        alert("Not able to connect with credentials and endpoint.")
      }
    })
  }

  access_chat(){

  }

  enable_confirm_account(){
    this.setState({'name': 'nome nomenome'})
    this.setState({'btn_label': 'Acessar'})
    this.setState({'step': 'user_info_confirmar_old'})
  }

  enable_create_account(){
    this.setState({'step': 'user_info_criar'})
    this.setState({'btn_label': 'Criar e Acessar'})
  }

  render_server_info(){
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          E-mail
          <input
            name="email"
            type="text"
            value={this.state.email}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <label>
          Server Endpoint
          <input
            name="server_url"
            type="text"
            value={this.state.server_url}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <label>
          Server Key
          <input
            name="server_key"
            type="text"
            value={this.state.server_key}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <input type="submit" value={this.state.btn_label} />
      </form>
    );
  }


  render_user_info_new_user(){
    return (
      <form onSubmit={this.handleSubmit}>
        <p>Usuário não encontrado! Cadastre para acessar</p>
        <label>
          Nome
          <input
            name="name"
            type="text"
            value={this.state.name}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <input type="submit" value={this.state.btn_label} />
      </form>
      );
  }

  render_user_info_old_user(){

    return (
      <form onSubmit={this.handleSubmit}>
        <p>Usuário {this.state.email} encontrado!</p>
        <p>Confirme seu nome de usuário</p>
        <label>
          Nome
          <input
            name="name"
            type="text"
            value={this.state.name} disabled/>
        </label>
        <br />
        <input type="submit" value={this.state.btn_label} />
      </form>
      );
  }
}

export default App;
