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

export default function App(props){
  const handleInputChange = event => {
    const target = event.target;
    const name = target.name;
    props.setInfo({...props.info, [name]: target.value});
  }
  const handleSubmit = (event) => {
    event.preventDefault();
    if (props.info.step==="server_info"){
        const api = new ApiMDC(props.info.server_url, props.info.server_key)
        api.check_email(props.info.email).then(function(resp){
          if(resp.status===200){
            if(resp.data.status){
              props.setInfo({...props.info, 'user_uid': resp.data.uid});
              props.setInfo({...props.info, 'name': resp.data.name});
              props.setInfo({...props.info, 'step': "user_info_confirmar_old"});
            }else{
              props.setInfo({...props.info, 'step': "user_info_criar"});
            }
          }else{
            alert("Not able to connect with credentials and endpoint.")
          }
        })
    }else if(props.info.step==="user_info_confirmar_old"){
      props.setInfo({...props.info, 'view': 1});
    }else if(props.info.step==="user_info_criar"){
      create_account()
    }
  }
  const create_account = () => {
    const api = new ApiMDC(props.info.server_url, props.info.server_key)
    api.create_account(props.info.email, props.info.name).then(function(resp){
      if(resp.status===200){
        if(resp.data.status==="user_created"){
          props.setInfo({...props.info, 'user_uid': resp.data.uid});
          props.setInfo({...props.info, 'view': 1});
        }else{
          alert("Something went wrong. Check console for more informations")
          console.error(resp)
        }
      }else{
        alert("Not able to connect with credentials and endpoint.")
      }
    })
  }
  return(
    <div>
      {props.info.step==="server_info"?
        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <input name="email" type="text" value={props.info.email} onChange={handleInputChange} />
          </label>
          <br/>
          <label>
            Server Endpoint
            <input name="server_url" type="text" value={props.info.server_url} onChange={handleInputChange} />
          </label>
          <br/>
          <label>
            Server Key
            <input name="server_key" type="text" value={props.info.server_key} onChange={handleInputChange} />
          </label>
          <br/>
          <input type="submit" value={props.info.btn_label} />
        </form>
      :props.info.step==="user_info_criar"?
        <form onSubmit={handleSubmit}>
          <p>Usuário não encontrado! Cadastre para acessar</p>
          <label>
            Nome
            <input name="name" type="text" value={props.info.name} onChange={handleInputChange} />
          </label>
          <br/>
          <input type="submit" value={props.info.btn_label} />
        </form>
      :
        <form onSubmit={handleSubmit}>
          <p>Usuário {props.info.email} encontrado!</p>
          <p>Confirme seu nome de usuário</p>
          <label>
            Nome
            <input name="name" type="text" value={props.info.name} disabled/>
          </label>
          <br/>
          <input type="submit" value={props.info.btn_label} />
        </form>
      }
    </div>
  )
}