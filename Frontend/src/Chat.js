import React from 'react';
import axios from "axios";


class ApiMDC{
  constructor(base_url, key){
    this.base_url = base_url
    this.key = key

    this.api = axios.create({
      baseURL: this.base_url,
    });

    this.total_calls = 0;

    this.status = 0;
  }

  async request_story(email){
    if (this.status==0){
      this.status = 1
      const url = this.base_url+"get_story";
      const dat = {
                 email: email,
                 server_key: this.key
      }
      const dis = this;

      return await axios({
        method: 'post',
        url: url,
        headers: {"Content-Type": "application/json"}, 
        data: dat
      })
      .then(function (response) {
        dis.status = 0
        return response
      })
      .catch(function (error) {
        dis.status = 0
        return error
      });
    }
  }

  async add_turn_request_story(email, story_id, story_turn, story_text){
    if (this.status==0){
      this.status = 1
      const url = this.base_url+"get_story";
      const dat = {
                 email: email,
                 story_id: story_id,
                 story_turn: story_turn,
                 story_text: story_text,
                 server_key: this.key
      }
      const dis = this;

      return await axios({
        method: 'post',
        url: url,
        headers: {"Content-Type": "application/json"}, 
        data: dat
      })
      .then(function (response) {
        dis.status = 0
        return response
      })
      .catch(function (error) {
        dis.status = 0
        return error
      });
    }
  }

  async story_mark_as_complete(email, story_id){

      const url = this.base_url+"story_mark_as_complete";
      const dat = {
                 email: email,
                 story_id: story_id,
                 server_key: this.key
      }
      
      return await this.do_request(dat, url)
  }

  async do_request(dat, url){
    if (this.status==0){
      this.status = 1
      const dis = this;
      return await axios({
        method: 'post',
        url: url,
        headers: {"Content-Type": "application/json"}, 
        data: dat
      })
      .then(function (response) {
        dis.status = 0
        return response
      })
      .catch(function (error) {
        dis.status = 0
        return error
      });

    }
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

      status: 'first',

      'max_time': null,
      'story': null,
      'story_id': null,

      'message': '',
    };
    

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.requestStory = this.requestStory.bind(this);
    this.setStoryCompleted = this.setStoryCompleted.bind(this);

    this.mapi = new ApiMDC(this.state.server_url, this.state.server_key);

    this.messagesEnd = null;


    setTimeout(this.requestStory, 100);
  }

  requestStory(){
    this.setState({'status': 'loading'})

    const dis = this;
    this.mapi.request_story(this.state.email).then(function(resp){
      if(resp.status===200){
        if(resp.data.status==="success"){
          dis.process_new_story(resp.data)
        }else{
          alert(resp.data.status)
        }
      }else{
        alert("Not able to connect with credentials and endpoint.")
      }
    })
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;

    this.setState({
      [name]: target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.submit_message()
  }

  render() {
    if (this.state.status==='first'){
      return (<div>Starting Chat</div>)
    }else if (this.state.status==='loading'){
      return (<div>Loading story</div>)
    }else if(this.state.status==='writing_story'){
      return this.render_writing_story();
    }
  }

  render_writing_story(){
    return (
    <div className="container mx-auto">
      <div className="min-w-full border rounded lg:grid lg:grid-cols-3">
        {this.render_writing_story_left_panel()}
        <div className="hidden lg:col-span-2 lg:block max-h-screen">
        {this.render_writing_story_right_panel()}
        </div>
      </div>
    </div>
    )
  }

  setStoryCanceled(){
    alert("Not working")
  }

  setStoryCompleted(){

    const dis = this;
    this.mapi.story_mark_as_complete(this.state.email, this.state.story.idd).then(function(resp){
      if(resp.status===200){
        if(resp.data.status==="success"){
          dis.requestStory()
        }else{
          alert(resp.data.status)
        }
      }else{
        alert("Not able to connect with credentials and endpoint.")
      }
    })
  }

  render_writing_story_left_panel(){

    const dis = this;
    let story_now = this.state.story.content
    const turn_now = ((this.state.story.turn_now%2===1) ? 'Cliente' : 'Sistema');
    story_now = story_now.split("\n")


    return (
      <div className="border-r border-gray-300 lg:col-span-1 overflow-y-auto max-h-screen">
        <div className=" bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 mt-3 self-auto mx-6">

          <div className="flex flex-col items-center py-5">
            <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">História: {this.state.story.idd}</h5>
            <span className="text-sm text-gray-500 dark:text-gray-400">Escrevendo como: <b>{turn_now}</b></span>
            <br />
            <span className="text-sm text-gray-500 dark:text-gray-400">Usuário: {this.state.email}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Servidor: {this.state.server_url}</span>
            <div className="mt-4 ">
              <div className='block w-full text-center'>
                <span className="text-sm text-white">Ações da história</span>
              </div>
              <div className='block w-full'>
                <button onClick={this.setStoryCanceled} className="mx-1 inline-flex items-center py-2 px-4 text-sm font-medium text-center text-gray-900 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">Excluir</button>
                <button onClick={this.setStoryCompleted} className="mx-1 inline-flex items-center py-2 px-4 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Completar</button>
              </div>
            </div>
          </div>
        </div>

        <br/>
        
        <div className='px-2'>
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                      <th scope="col" className="px-6 py-6">
                          Turno
                      </th>
                      <th scope="col" className="px-6 py-6">
                          Objetivo
                      </th>
                  </tr>
              </thead>
              <tbody>
              {story_now.map(function(a, i){
                let color = "text-black bg-white border-b border-gray-700 "
                if (i!==dis.state.story.turn_now){
                  color += " bg-gray-200 hover:bg-gray-300"
                }else{
                  color += " bg-green-100 hover:bg-green-200"
                }
                
                  if(a.length>0){
                    return <tr key={i} className={color}><td className="py-1 text-center">{i}</td><td className="px-1 py-1">{a}</td></tr>
                  }
                  return null
              })}
              </tbody>
            </table>
          </div>
        </div>




        <br/>


      </div>
    )
  }

  render_writing_story_right_panel(){
    const label_talking_to = ((this.state.story.turn_now%2===0) ? 'Cliente' : 'Sistema');
    const dis = this;
    return (
          <div className="w-full h-screen">
            <div className="relative flex items-center p-3 border-b border-gray-300 h-[6vh] min-h-fit">
                <svg viewBox="0 0 212 212" width="30" height="30" className="w-10 h-10"><path fill="#DFE5E7" className="background" d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z"></path><g fill="#FFF"><path className="primary" d="M173.561 171.615a62.767 62.767 0 0 0-2.065-2.955 67.7 67.7 0 0 0-2.608-3.299 70.112 70.112 0 0 0-3.184-3.527 71.097 71.097 0 0 0-5.924-5.47 72.458 72.458 0 0 0-10.204-7.026 75.2 75.2 0 0 0-5.98-3.055c-.062-.028-.118-.059-.18-.087-9.792-4.44-22.106-7.529-37.416-7.529s-27.624 3.089-37.416 7.529c-.338.153-.653.318-.985.474a75.37 75.37 0 0 0-6.229 3.298 72.589 72.589 0 0 0-9.15 6.395 71.243 71.243 0 0 0-5.924 5.47 70.064 70.064 0 0 0-3.184 3.527 67.142 67.142 0 0 0-2.609 3.299 63.292 63.292 0 0 0-2.065 2.955 56.33 56.33 0 0 0-1.447 2.324c-.033.056-.073.119-.104.174a47.92 47.92 0 0 0-1.07 1.926c-.559 1.068-.818 1.678-.818 1.678v.398c18.285 17.927 43.322 28.985 70.945 28.985 27.678 0 52.761-11.103 71.055-29.095v-.289s-.619-1.45-1.992-3.778a58.346 58.346 0 0 0-1.446-2.322zM106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 3.624-.896 37.124 37.124 0 0 0 5.12-1.958 36.307 36.307 0 0 0 6.15-3.67 35.923 35.923 0 0 0 9.489-10.48 36.558 36.558 0 0 0 2.422-4.84 37.051 37.051 0 0 0 1.716-5.25c.299-1.208.542-2.443.725-3.701.275-1.887.417-3.827.417-5.811s-.142-3.925-.417-5.811a38.734 38.734 0 0 0-1.215-5.494 36.68 36.68 0 0 0-3.648-8.298 35.923 35.923 0 0 0-9.489-10.48 36.347 36.347 0 0 0-6.15-3.67 37.124 37.124 0 0 0-5.12-1.958 37.67 37.67 0 0 0-3.624-.896 39.875 39.875 0 0 0-7.68-.737c-21.162 0-37.345 16.183-37.345 37.345 0 21.159 16.183 37.342 37.345 37.342z"></path></g></svg>
              <span className="block ml-2 font-bold text-gray-600">{label_talking_to}</span>
              <span className="absolute w-3 h-3 bg-green-600 rounded-full left-10 top-3">
              </span>


            </div>
            <div className="relative w-full p-6 overflow-y-auto h-[88vh]">
              <ul className="space-y-2">
                {this.state.story.turns.map(function(a, i){
                  let side = ''
                  let color = ''

                  if (i%2===0){
                    side = 'justify-start'
                    color = 'bg-gray-700'
                  }else{
                    side = 'justify-end'
                    color = 'bg-green-700'
                  }

                  const li_class = side+' flex text-white'
                  const bubble_class = color+' relative max-w-xl px-4 py-2 rounded shadow'
                  return (
                    <li key={i} className={li_class}>
                      <div className={bubble_class}>
                        <span className="block">{a.text}</span>
                      </div>
                    </li>
                  )
                })}
                <div style={{ float:"left", clear: "both" }}
             ref={(el) => { dis.messagesEnd = el; }}>
        </div>
              </ul>
            </div>

            <div className="flex items-center justify-between w-full p-3 border-t border-gray-300 h-[6vh] min-h-fit">

              <form onSubmit={this.handleSubmit} className='block w-full mx-3'>
                <input
                  onChange={this.handleInputChange}
                  value={this.state.message}
                  name="message"
                  type="text"
                  placeholder="Mensagem"
                  className="w-full py-2 pl-4 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                  required=""
                  autoFocus
                  />
              </form>

              <button type="submit" onClick={this.handleSubmit}>
                <svg className="w-5 h-5 text-gray-500 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              </button>
            </div>
          </div>)
  }


  submit_message(){
    this.setState({'status': 'loading'})
    const dis = this;
    this.mapi.add_turn_request_story(this.state.email, this.state.story.idd, this.state.story.turn_now, this.state.message)
    .then(function(resp){
      if(resp.status===200){
        dis.process_new_story(resp.data)
      }else{
        alert("Not able to connect with credentials and endpoint.")
      }
    })
  }

  process_new_story(data){
    const story = JSON.parse(data.story)
    this.setState({max_time: data.seconds_to_write})
    this.setState({story_id: data.story_id})
    this.setState({story: story})
    this.setState({status: 'writing_story'})
    this.setState({message:''})
  }

  scrollToBottom () {

    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  componentDidMount() {
    if (this.messagesEnd!=undefined){
      this.scrollToBottom();
    }
  }

  componentDidUpdate() {
    
    if (this.messagesEnd!=undefined){
      this.scrollToBottom();
    }
  }
}

export default Chat;
