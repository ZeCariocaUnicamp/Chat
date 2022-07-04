import os
import json
import uuid
import datetime
import numpy as np














class Configurer(object):
    def __init__(self, config_file):

        with open(config_file, 'r') as f:
            configs = json.loads(f.read())

        self.server_folder = configs['server_folder']
        self.stories_folder = configs['stories_folder']
        self.user_file = os.path.join(self.server_folder, configs['user_file'])
        self.stories_folder_processed = os.path.join(self.server_folder, "processed_stories/")
        self.server_key = configs['server_key']
        self.limit_active_stories = configs['limit_active_stories']
        self.min_writting_time_seconds = configs['min_writting_time_seconds']

        if not os.path.isdir(self.server_folder):
            os.mkdir(self.server_folder)

        if not os.path.isdir(self.stories_folder_processed):
            os.mkdir(self.stories_folder_processed)

        if not os.path.isfile(self.user_file):
            with open(self.user_file, 'w'):
                pass


    def __str__(self):
        return "   Configs= "+json.dumps({
                'server_folder': self.server_folder,
                'stories_folder': self.stories_folder,
                'user_file': self.user_file,
                'stories_folder_processed': self.stories_folder_processed,
                'server_key': self.server_key,
                'limit_active_stories': self.limit_active_stories,
                'min_writting_time_seconds': self.min_writting_time_seconds
            })













class Story(object):
    
    STORY_STATUS = {
        'open': 'open', # can be turned into active
        'closed': 'closed', # is not selected to be activated anymore
        'active': 'active', # can be chosen to be written
        'active_writting': 'active_writting', # are being written
        'completed': 'completed' # marked as completed by client
    }
    
    def __init__(self, file_path=None, load_from_file=False):
        self.file_path = file_path

        if self.file_path!=None and load_from_file:
            f = open(file_path, 'r')
            self.infos = json.load(f)
            f.close()
        else:
            self.infos = {
                'first_load': datetime.datetime.now().isoformat(),
                'started_writting_at': None,
                'last_writting': None,
                'last_user_writting': None
            }
            self.set_turns([])
            self.set_status(Story.STORY_STATUS['open'])
            self.set_completed(user=None, timestamp=None)

    def add_turn(self, user, text, position, remote_addr, user_agent):
        
        position = int(position)
        if self.infos['turn_now'] == position:
            self.infos['turns'].append({
                'user': user['uid'],
                'text': text,
                'position': position,
                'timestamp': datetime.datetime.now().isoformat(),
                'remote_addr': remote_addr,
                'user_agent': str(user_agent),
                })
            self.infos['turn_now'] += 1
            self.save_file()
            return True
        else:
            return False
        # self.save_file()

    def update_active_writting(self, user):
        if self.infos['started_writting_at']==None:
            self.infos['started_writting_at'] = datetime.datetime.now().isoformat()

        self.infos['last_writting'] = datetime.datetime.now().isoformat()
        self.infos['last_user_writting'] = user['uid']
        self.set_status(Story.STORY_STATUS['active_writting'])

        self.save_file()

    def update_active_writting_completed(self, config):
        self.infos['last_writting'] = (datetime.datetime.now()-datetime.timedelta(seconds=2*config.min_writting_time_seconds)).isoformat()
        self.infos['last_user_writting'] = None
        self.save_file()

    # Setters
    def set_id(self, idd):
        self.infos['idd'] = idd

    def set_status(self, status):
        self.infos['status'] = status

    def set_turns(self, turns):
        self.infos['turns'] = turns
        self.get_turn() # update infos['turn_now']

    def set_content(self, content):
        self.infos['content'] = content

    def set_completed(self, user=None, timestamp=None):
        self.infos['completed_by'] = user
        self.infos['completed_at'] = timestamp

    # Getters
    def get_id(self):
        return self.infos['idd']

    def get_status(self):
        return self.infos['status']

    def get_first_load(self):
        return self.infos['first_load']

    def get_turns(self):
        return self.infos['turns']

    def get_content(self):
        return self.infos['content']

    def get_file_path(self):
        return self.file_path

    def get_turn(self):
        return len(self.get_turns())+1

    def get_infos(self):
        ret = self.infos
        ret['turn_now'] = self.get_turn()
        return ret

    def get_last_writting_infos(self):
        return {"last_writting": self.infos['last_writting'], "last_user_writting": self.infos['last_user_writting']}


    # UPDATE METHODS
    # Alter file
    # def update_status_completed(self):
        # self.set_status(Story.STORY_STATUS['completed'])
        # self.save_file()

    def update_status(self, status, user=None):
        try:
            test = Story.STORY_STATUS[status] # validation if value is valid
            self.set_status(status)
            self.save_file()
        except Exception as e:
            raise Exception(f"Wrong Status: {status} {e}")

        if status==Story.STORY_STATUS['completed'] or status==Story.STORY_STATUS['closed']:
            self.set_completed(user, datetime.datetime.now().isoformat())

        self.save_file()

    # Force save
    def save_file(self):
        with open(self.get_file_path(), 'w') as f:
            f.write(json.dumps(self.get_infos(), indent=2, sort_keys=True))


    # Utility
    def __str__(self):
        ret = json.dumps(self.get_infos(), indent=2, sort_keys=True)
        ret = f"\nSaving at: {self.get_file_path()}\n{ret}"
        return ret

    def to_json(self):
        return json.dumps(self.get_infos(), indent=2, sort_keys=True)

    def to_json_inline(self):
        return json.dumps(self.get_infos(), sort_keys=True)

























class StoryManager(object):
    def __init__(self, configs):
        print("-> Starting StoryManager", datetime.datetime.now())
        self.user = 'SYSTEM'
        self.configs = configs
        self.time_start = datetime.datetime.now()
        print(self.configs)

        self.cache = {f"stories_{Story.STORY_STATUS[k]}":[] for k in Story.STORY_STATUS}
        self.cache['stories'] = {}

        self.load_stories(self.configs.stories_folder)
        print("-> Completed StoryManager", datetime.datetime.now())

        self.prepare_actives()


    def prepare_actives(self):
        print("-> Activating stories")
        active_remaining = self.configs.limit_active_stories

        print(f"   Total allowed to active: {self.configs.limit_active_stories}")
        for key in self.cache['stories'].keys():
            story_status =self.cache['stories'][key].get_status() 
            if story_status==Story.STORY_STATUS['active'] or story_status==Story.STORY_STATUS['active_writting']:
                active_remaining -= 1

        print(f"   Active Remaining: {active_remaining}")

        opens = self.get_all_open_stories()
        while active_remaining>0 and len(opens)>0:
            story_to_activate = np.random.choice(opens)
            print(f"   Activating: {story_to_activate}")
            story_to_activate = self.get_story(story_to_activate)
            self.change_status_story(story=story_to_activate, status='active', user=self.user)
            active_remaining -= 1
            opens = self.get_all_open_stories()


        self.print_stories_status()

        print("-> Stories activated")

    def print_stories_status(self):
        stories = self.get_all_stories_by_status(Story.STORY_STATUS['open'])
        print(f"   Stories OPEN: {len(stories)} - [{','.join(stories)}]")

        stories = self.get_all_stories_by_status(Story.STORY_STATUS['closed'])
        print(f"   Stories CLOSED: {len(stories)} - [{','.join(stories)}]")

        stories = self.get_all_stories_by_status(Story.STORY_STATUS['completed'])
        print(f"   Stories COMPLETED: {len(stories)} - [{','.join(stories)}]")

        stories = self.get_all_stories_by_status(Story.STORY_STATUS['active'])
        print(f"   Stories ACTIVE: {len(stories)} - [{','.join(stories)}]")

        stories = self.get_all_stories_by_status(Story.STORY_STATUS['active_writting'])
        stories_writting = []
        print(f"   Stories ACTIVE WRITTING: {len(stories)} - [ ", end='')
        for s in stories:
            story = self.get_story(s)
            user_email = story.infos['last_user_writting']
            user_email = self.find_user_by_uuid(user_email)
            user_email = user_email['email']
            last_infos = story.get_last_writting_infos()
            time_left = self.configs.min_writting_time_seconds-(datetime.datetime.now()-datetime.datetime.fromisoformat(last_infos['last_writting'])).total_seconds()
            time_left = max(0, int(time_left))
            print(f"{s} ({user_email} {time_left}s) , ", end="")
        print("]")

    def get_all_stories_by_status(self, status):
        k = Story.STORY_STATUS[status]
        return self.cache[f'stories_{k}']

    def get_all_open_stories(self):
        return self.get_all_stories_by_status(Story.STORY_STATUS['open'])


    def load_stories(self, folder):
        stories_folder = os.listdir(folder)
        stories_folder = [story for story in stories_folder if story.endswith('.txt')]
        stories_processed_files = os.listdir(self.configs.stories_folder_processed)


        total_already_cached = 0
        total_new = 0
        if len(stories_folder)==0:
            print("   No stories found to be prepared.")
        else:

            for story_fname in stories_folder:
                id_story = story_fname.split(".")[0]

                file_path_processed = os.path.join(self.configs.stories_folder_processed, f"{id_story}.json")

                if os.path.isfile(file_path_processed):
                    total_already_cached += 1
                    continue
                total_new += 1
                

                

                with  open(os.path.join(self.configs.stories_folder, story_fname), 'r') as f:
                    content = f.read()

                story = Story(file_path=file_path_processed)
                story.set_id(id_story)
                story.set_content(content)
                story.save_file()

        print(f"   Loaded {total_new} new stories")
        print(f"   Ingored {total_already_cached} stories")


        stories_processed_files = os.listdir(self.configs.stories_folder_processed)
        for story in stories_processed_files:
            story_processed = os.path.join(self.configs.stories_folder_processed, story)


            story = Story(file_path=story_processed, load_from_file=True)

            # set cache
            self.cache['stories'][story.get_id()] = story
            self.cache[f'stories_{story.get_status()}'].append(story.get_id())


        print(f"   Loaded {len(self.cache['stories'])} processed stories to cache")

    def validate_server_key(self, key):
        return self.configs.server_key==key


    def find_user_by_email(self, email):
        with open(self.configs.user_file, 'r') as f:
            while True:
                line = f.readline()
                if not line:
                    break
                line = line.strip()
                line = line.split("\t") # email

                if line[1]==email:
                    return {'uid': line[0], 'email': line[1], 'name': line[2]}

        return None

    def find_user_by_uuid(self, uuid):
        with open(self.configs.user_file, 'r') as f:
            while True:
                line = f.readline()
                if not line:
                    break
                line = line.strip()
                line = line.split("\t") # email

                if line[0]==uuid:
                    return {'uid': line[0], 'email': line[1], 'name': line[2]}

        return None

    def add_user(self, email, name):
        found = False
        uids = []
        with open(self.configs.user_file, 'r') as f:
            while True:
                line = f.readline()
                if not line:
                    break
                line = line.split("\t")
                email_file = line[1]
                uid_file = line[0]

                if email_file==email:
                    found = True
                    break

                uids.append(uid_file)

        if found:
            return False

        new_uid = str(uuid.uuid4())
        while new_uid in uids:
            new_uid = str(uuid.uuid4())

        with open(self.configs.user_file, 'a') as f:
            f.write(f"{new_uid}\t{email}\t{name}\n")

        return new_uid

    def get_story(self, story_id):
        try:
            return self.cache['stories'][story_id]
        except:
            return None


    def change_status_story(self, story, status, user):

        if status not in Story.STORY_STATUS.keys():
            raise Exception(f"Unknown status {status}")

        self.cache[f'stories_{story.get_status()}'].remove(story.get_id())
        story.update_status(status=status, user=user)
        self.cache[f'stories_{story.get_status()}'].append(story.get_id())


        if status==Story.STORY_STATUS['completed'] or status==Story.STORY_STATUS['closed']:
            opens = self.get_all_open_stories()
            total_active = len(self.cache['stories_active'])+len(self.cache['stories_active_writting'])
            if len(opens)>0 and total_active<self.configs.limit_active_stories:
                story_to_activate = np.random.choice(opens)
                print(f"   Activating: {story_to_activate}")
                story_to_activate = self.get_story(story_to_activate)
                self.change_status_story(story=story_to_activate, status=Story.STORY_STATUS['active'], user=self.user)

        self.print_stories_status()

    def get_situation(self):
        ret = {}
        ret['uptime_seconds'] = int((datetime.datetime.now()-self.time_start).total_seconds())
        ret['stories_data'] = {}
        ret['stories_data']['stories'] = [self.cache['stories'][s_id].get_id() for s_id in self.cache['stories'].keys()]
        ret['stories_data']['stories_open'] = self.cache['stories_open']
        ret['stories_data']['stories_closed'] = self.cache['stories_closed']
        ret['stories_data']['stories_active'] = self.cache['stories_active']
        ret['stories_data']['stories_active_writting'] = self.cache['stories_active_writting']
        ret['stories_data']['stories_completed'] = self.cache['stories_completed']
        return ret

    def add_turn_story(self, user, story_id, story_turn, story_text, remote_addr, user_agent):
        # if turn position is correct is validated inside Story class
        if len(story_text)<1:
            return None
        story = self.get_story(story_id)
        story.update_active_writting_completed(self.configs)
        ret = story.add_turn(user, story_text, story_turn, remote_addr, user_agent)
        self.change_status_story(story, Story.STORY_STATUS['active'], user)
        return ret


    def get_active_story(self, user_requesting):
        story_id = None
        print(f"Requesting Story for user, {user_requesting}")
        self.print_stories_status()

        for s_id in self.cache['stories_active_writting']:
            story = self.get_story(s_id)
            last_infos = story.get_last_writting_infos()
            if last_infos['last_user_writting'] == user_requesting['uid']:
                self.change_status_story(story, Story.STORY_STATUS['active'], user_requesting)


        if len(self.cache['stories_active_writting'])>0:
            print("Checking actives writting")
            actives_writting_now_remaining = []
            actives_writting_now_remaining_for_this_user = []
            for s_id in self.cache['stories_active_writting']:

                last_infos = self.get_story(s_id).get_last_writting_infos()
                time_dif = datetime.datetime.now()-datetime.datetime.fromisoformat(last_infos['last_writting'])
                time_dif = time_dif.total_seconds()
                if time_dif>self.configs.min_writting_time_seconds:  # check if story is after min writting time. means no one answered and the user assingned may have logged out
                    actives_writting_now_remaining.append(s_id)

                    if last_infos['last_user_writting'] != user_requesting['uid']:
                        actives_writting_now_remaining_for_this_user.append(s_id)

            if len(actives_writting_now_remaining_for_this_user)>0: # first try to find one where this user was not the last
                story_id = np.random.choice(actives_writting_now_remaining_for_this_user)
                print(f"Using active writting avoiding current user. story id: {story_id}")
            elif len(actives_writting_now_remaining)>0: # try to find one abandoned one
                print(f"Using abandoned story id: {story_id}")
                story_id = np.random.choice(actives_writting_now_remaining)
        else:
            print("No active writting to check")

        if story_id==None: # if story was not chosen using active_writting
            print("Trying to return one active story")
            if len(self.cache['stories_active'])>0: 
                story_id = np.random.choice(self.cache['stories_active']) # find a story inside active
                print(f"Return active: {story_id}")
            else:
                print("No active to use")


        if story_id==None: # if we cant pick active and active_writting there is nothing to do. (We only change from open to active at completation or closing)
            print("Trying to force from oepn to active_writting")
            if len(self.cache['stories_open'])>0:
                story_id = np.random.choice(self.cache['stories_open'])
                print(f" * Force status open to active_writting {story_id}")
            else:
                print("cant force from open to active_writting")
                return None

        print(f"The story id being returned is {story_id}")
        story = self.get_story(story_id)
        self.cache[f'stories_{story.get_status()}'].remove(story.get_id())
        story.update_active_writting(user_requesting)
        self.cache[f'stories_{story.get_status()}'].append(story.get_id())


        self.print_stories_status()

        return story