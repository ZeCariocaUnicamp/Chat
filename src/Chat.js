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

  async request_story(email){
    const url = this.base_url+"get_story";
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

}

class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      server_url: "http://localhost:8888/",
      server_key: "1033b11e-ea82-11ec-8fea-0242ac120002",
      email: "mail@mail.com",
      name: "nome",
      user_uid: "33b46c3b-0299-4459-924s-ab5ba7f67f1a",

      status: 'loading',

      'max_time': null,
      'story': null,
      'story_id': null,
    };
    

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.requestStory = this.requestStory.bind(this);

    this.mapi = new ApiMDC(this.state.server_url, this.state.server_key);

    // this.request_story()
  }

  requestStory(){
    const max_time = 600;
    const story = JSON.parse("{\"completed_at\": null, \"completed_by\": null, \"content\": \"Start\\n[Cliente] Fale que quer fazer pedido antes de informar os detalhes do pedido\\n[Sistema] Pergunte quais os itens do pedido\\n[Cliente] Detalhe os itens: 1 Portuguesa ; Meia Repolho e meia Caprese ; 1 Frango com palmito\\n[Sistema] Confirme os itens em uma lista enumerada\\n[Cliente] Confirme que os itens do pedido est\u00e3o corretos\\n[Sistema] Informe o total: R$ 122,85\\n[Sistema] Pergunte o endere\u00e7o\\n[Cliente] Informe o endere\u00e7o: Conjunto Habitacional Presidente Eurico Gaspar Dutra N\u00famero 512\\n[Sistema] Pergunte a forma de pagamento\\n[Cliente] Pe\u00e7a para pagar com PIX\\n[Sistema] Passe a chave CNPJ 72.504.254/8984-37 para PIX\\n[Cliente] Avise que o pix foi feito\\n[Sistema] Confirme o pedido. Informe que est\u00e1 sendo preparado e que vai demorar 60 minutos minutos\\n\", \"first_load\": \"2022-06-28T23:13:21.010189\", \"idd\": \"13\", \"last_user_writting\": \"33b46c3b-0299-4459-924s-ab5ba7f67f1a\", \"last_writting\": \"2022-07-01T02:05:22.210043\", \"started_writting_at\": \"2022-07-01T02:05:22.210026\", \"status\": \"active_writting\", \"turn_now\": 1, \"turns\": []}")
    const story_id = "13"
    this.setState({max_time: max_time})
    this.setState({story: story})
    this.setState({story_id: max_time})
    this.setState({'status': 'writing_story'})

    // this.mapi.request_story(this.state.email).then(function(resp){
    //   console.log(resp)
    //   if(resp.status===200){
    //     if(resp.data.status==="success"){
    //       console.log("ok")
    // //       dis.setState({'user_uid': resp.data.uid})
    // //       dis.setState({'name': resp.data.name})
    // //       dis.enable_confirm_account();
    //     }else{
    //       alert(resp.data.status)
    //     }
    //   }else{
    //     alert("Not able to connect with credentials and endpoint.")
    //   }
    // })
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;

    this.setState({
      [name]: target.value
    });
  }

  handleSubmit(event) {
    
  }

  render() {
    if (this.state.status==='loading'){
      return (<div>Click <button onClick={this.requestStory}>Here</button> to load a story</div>)
    }else if(this.state.status==='writing_story'){
      return this.render_writing_story();
    }
  }

  render_writing_story(){
    return (<div>writing</div>)
  }

}

export default Chat;
