import MDC
import json


from flask import Flask
from flask_cors import CORS
from flask import request
import flask

import os
import time


app = Flask(__name__)
CORS(app)


try:
    configs = MDC.Configurer("./configs.json")
    sm = MDC.StoryManager(configs)
    print("Ready...")
except Exception as e:
    print(e)
    raise e



@app.route("/")
def hello_world():
    return "<p>Everything seems to be working here</p>"

@app.route("/check_user", methods=['POST'])
def check_user():

    abort_code = 403
    try:
        dat = json.loads(request.data)
        email = dat['email']
        server_key = dat['server_key']
        if not sm.validate_server_key(server_key):
            abort_code = 401
            raise Exception("server_key error")
    except Exception as e:
        return flask.abort(abort_code) # 403 Forbidden


    user = sm.find_user_by_email(email)

    if user==None:
        return json.dumps({"status":False}, indent=2)

    user['status'] = True

    return json.dumps(user)



@app.route("/add_user", methods=['POST'])
def add_user():
    abort_code = 403
    try:
        dat = json.loads(request.data)
        email = dat['email']
        name = dat['name']
        server_key = dat['server_key']
        if not sm.validate_server_key(server_key):
            abort_code = 401
            raise Exception("server_key error")
    except Exception as e:
        return flask.abort(abort_code) # 403 Forbidden

    uuid_created = sm.add_user(email, name)

    if type(uuid_created)==bool and uuid_created==False:
        return flask.abort(400)

    return json.dumps({'status': 'user_created', 'uid': uuid_created})



@app.route("/get_story_info", methods=['POST'])
def get_story_info():
    abort_code = 403
    try:
        dat = json.loads(request.data)
        email = dat['email']
        story_id = dat['story_id']
        server_key = dat['server_key']
        if not sm.validate_server_key(server_key) or sm.find_user_by_email(email)==None:
            abort_code = 401
            raise Exception("server_key error")
    except Exception as e:
        return flask.abort(abort_code) # 403 Forbidden

    story = sm.get_story(story_id)
    if type(story)==MDC.Story:
        return story.to_json()
    else:
        return flask.abort(404)


@app.route("/story_mark_as_complete", methods=['POST'])
def story_mark_as_complete():
    abort_code = 403
    try:
        dat = json.loads(request.data)
        email = dat['email']
        story_id = dat['story_id']
        server_key = dat['server_key']
        user = sm.find_user_by_email(email)
        if not sm.validate_server_key(server_key) or user==None:
            abort_code = 401
            raise Exception("server_key error")
    except Exception as e:
        return flask.abort(abort_code) # 403 Forbidden

    story = sm.get_story(story_id)
    if story==None:
        return flask.abort(404)

    if story.infos['status']==MDC.Story.STORY_STATUS['active'] or story.infos['status']==MDC.Story.STORY_STATUS['active_writting']:
        sm.change_status_story(story, 'completed', user)
        return {'status': 'success'}
    elif story.infos['status']==MDC.Story.STORY_STATUS['open']:
        return {'status': 'cant_close_open_story'}
    elif story.infos['status']==MDC.Story.STORY_STATUS['closed']:
        return {'status': 'alredy_closed'}
    elif story.infos['status']==MDC.Story.STORY_STATUS['completed']:
        return {'status': 'already_completed'}
    else:
        return {'status': 'undefined_error'}


@app.route("/get_situation", methods=['POST', 'GET'])
def get_situation():
    # abort_code = 403
    # try:
    #     dat = json.loads(request.data)
    #     server_key = dat['server_key']
    #     if not sm.validate_server_key(server_key):
    #         abort_code = 401
    #         raise Exception("server_key error")
    # except Exception as e:
        # return flask.abort(abort_code) # 403 Forbidden

    return sm.get_situation()

@app.route("/get_story", methods=['POST'])
def get_story():
    abort_code = 403
    try:
        dat = json.loads(request.data)
        email = dat['email']
        server_key = dat['server_key']
        user = sm.find_user_by_email(email)
        if not sm.validate_server_key(server_key) or user==None:
            abort_code = 401
            raise Exception("server_key error")
    except Exception as e:
        return flask.abort(abort_code) # 403 Forbidden

    req_keys = dat.keys()
    if 'story_id' in req_keys and 'story_turn' in req_keys and 'story_text' in req_keys:
        print("Trying to add turn")
        added = sm.add_turn_story(user, dat['story_id'], dat['story_turn'], dat['story_text'], request.remote_addr, request.user_agent)
        if not added:
            print("Turn not added", dat)

    story = sm.get_active_story(user)

    if story!=None:
        return {'status': 'success', 'story_id': story.get_id(), 'story': story.to_json_inline(), 'seconds_to_write': sm.configs.min_writting_time_seconds}
    else:
        return {"status": "no_stories"}