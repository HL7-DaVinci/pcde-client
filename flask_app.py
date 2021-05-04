from flask import *
import requests, subprocess
import os
import base64

app = Flask(__name__)
headers = {'Accept' : '*/*', 'Content-Type' : 'application/json'}
base_url = 'https://davinci-pcde-ri.logicahealth.org/fhir/'#'http://localhost:8080/fhir/'#
client_url = 'https://davinci-pcde-client.logicahealth.org/'#'https://davinci-pcde-ri.logicahealth.org/fhir/'##'http://localhost:5000/'#
return_endpoint = client_url + 'receiveBundle'

# Simple method to make data tempory
# NOTE: Do not use in production
last_bundle = '{"text": "Bundle Not Found","status_code":"404"}'
bundle_queue = []
bundle_entries = {}
task_entries = {}
task_id = 0
bundle_id = 0
@app.route('/')
def index(name=None):
    return render_template('index.html', name=name)
@app.route('/Patient')
def patient(name=None):
    return render_template('patient.html', name=name)
@app.route('/test')
def dummy(name=None):
    return render_template('dummy.html', name=name)
@app.route('/memberMatch')
def memberMatch(name=None):
    return render_template('memberMatch.html', name=name)
@app.route('/Tutorial')
def tutorial(name=None):
    return render_template('tutorial.html', name=name)
@app.route('/CommunicationRequest')
def comreq(name=None):
    return render_template('comreq.html', name=name)

@app.route('/CommunicationRequestb')
def comreqb(name=None):
    return render_template('comreqb.html', name=name)

@app.route('/Bundle')
def bundle(name=None):
    return render_template('bundle.html', name=name)
@app.route('/Task')
def task(name=None):
    return render_template('task.html', name=name)
@app.route('/Auth')
def auth(name=None):
    return render_template('token.html', name=name)


@app.route('/getToken')
def get_token():
    print("TEST")
    authorize_url = request.args.get('authorize_url').replace("%2F", "/")#"https://fhir.collablynk.com/oauth/authorize"
    token_url = request.args.get('token_url').replace("%2F", "/")#"https://fhir.collablynk.com/oauth/token"

    #callback URL specified when the application was defined
    callback_uri = request.args.get('callback_uri').replace("%2F", "/")#"https://fhir.collablynk.com/fhir-experience/back"

    client_id = request.args.get('client_id')
    #client_secret = #'de827600-1cd8-4e8d-a581-1b1bd6369b03'

    #scope = ''

    # will return access_token
    authorization_redirect_url = authorize_url + '?response_type=token&client_id=' + client_id + '&redirect_uri=' + callback_uri# + '&scope=openid'
    data = {"auth_url": authorization_redirect_url}
    return json.dumps(data), 200, {'ContentType':'application/json'}

# @app.route('/receiveBundle', methods=['GET', 'POST'])
# def receiveBundle():
#     data = request.data
#     global bundle_queue
#     global bundle_entries
#     #print(bundle_queue)
#     bundle_entries[bundle_queue.pop(0)] = data
#     #print(bundle_entries)
#     # print(data)
#     return json.dumps(data), 200, {'ContentType':'application/json'}
# @app.route('/getlastbundle')
# def get_last_bundle():
#     global last_bundle
#     global bundle_entries
#     given = request.args.get('given')
#     family = request.args.get('family')
#     bdate = request.args.get('birthdate')
#     identifier = request.args.get('identifier')
#     bundle_key = (given+family+bdate+identifier)
#     #print(bundle_entries)
#     if (bundle_key in bundle_entries.keys()):
#         json_data = json.loads(bundle_entries.pop(bundle_key))
#         try:
#             encoding = str(json_data["entry"][0]["resource"]["payload"][0]["contentAttachment"]["data"])
#             json_data["entry"][0]["resource"]["payload"][0]["contentAttachment"]["data"] = str(base64.b64decode(encoding))
#         except Exception as e:
#             print(e)
#     else:
#         json_data = json.loads(last_bundle)
#     return jsonify(**json_data)
@app.route('/getpatient')
def get_patient():
    given = request.args.get('given')
    family = request.args.get('family')
    bdate = request.args.get('birthdate')
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += 'Patient?given='+given+'&family='+family+'&birthdate='+bdate
    token = request.args.get('token')
    temp_headers = headers
    if not token == '' and not token is None:
        temp_headers['Authorization'] = 'Bearer ' + token
    r = requests.get(url, headers=temp_headers, verify=False)
    #print (r)
    json_data = json.loads(r.text)
    return jsonify(**json_data)
@app.route('/getbundle')
def get_bundle():
    id = request.args.get('id')
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += 'Bundle/' + id
    token = request.args.get('token')
    temp_headers = headers
    token_url = request.args.get('token_url').replace("%2F", "/")
    if not token_url == '' and not token_url is None:
        client_id = request.args.get('cid')
        client_secret = request.args.get('cs')
        data = {'grant_type': 'client_credentials'}
        access_token_response = requests.post(token_url, data=data, verify=False, allow_redirects=False, auth=(client_id, client_secret))
        tokens = json.loads(access_token_response.text)
        temp_headers['Authorization'] = 'Bearer ' + tokens['access_token']
    r = requests.get(url, headers=temp_headers, verify=False)
    json_data = json.loads(r.text)
    return jsonify(**json_data)
@app.route('/getcomreq')
def get_comreq():
    headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
    id = request.args.get('id')
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += 'CommunicationRequest/' + id
    r = requests.get(url, headers=headers, verify=False)
    #print (r)
    json_data = json.loads(r.text)
    return jsonify(**json_data)
@app.route('/postcomreqb')
def post_comreqb():
    global bundle_queue
    global last_bundle
    headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
    pid = 1
    rid = 2
    sid = 3
    given = request.args.get('given')
    family = request.args.get('family')
    bdate = request.args.get('birthdate')
    identifier = request.args.get('identifier')
    bundle_key = given+family+bdate+identifier
    bundle_queue.append(bundle_key)
    print(bundle_queue)
    patient_info = {"given":given, "family":family, "birthdate":bdate, "identifier": identifier}
    req_data = make_bundle_request(pid, sid, rid, patient_info)
    #print(req_data)
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    r = requests.post(url, json = req_data, headers=headers, verify=False)
    json_data = json.loads(r.text)
    encoding = str(json_data["payload"][0]["contentAttachment"]["data"])
    json_data["payload"][0]["contentAttachment"]["data"] = str(base64.b64decode(encoding))
    json_data["status_code"] = r.status_code
    #print(r.text)
    return jsonify(**json_data)
@app.route('/postcomreq')
def post_comreq():
    pid = request.args.get('pid')
    rid = request.args.get('rid')
    sid = request.args.get('sid')

    req_data = make_request(pid, sid, rid)
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += 'PCDE'
    r = requests.post(url, json = req_data, headers=headers, verify=False)
    json_data = json.loads(r.text)
    #print (json_data["payload"][0]["contentAttachment"]["data"])
    encoding = str(json_data["payload"][0]["contentAttachment"]["data"])
    json_data["payload"][0]["contentAttachment"]["data"] = str(base64.b64decode(encoding))
    #print("get this")
    #print(r.text)
    return jsonify(**json_data)
@app.route('/member-match')
def member_match():
    given = request.args.get('given')
    family = request.args.get('family')
    bdate = request.args.get('birthdate')
    sid = request.args.get('sid')
    mid = request.args.get('mid')
    param_data = get_member_match(given, family, bdate, sid, mid)
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += 'Patient/$member-match'
    token = request.args.get('token')
    temp_headers = headers
    if not token == '' and not token is None:
        temp_headers['Authorization'] = 'Bearer ' + token
    r = requests.post(url, json = param_data, headers=temp_headers, verify=False)
    json_data = json.loads(r.text)
    if isinstance(json_data, int):
        json_data = {"StatusCode": json_data}
    if r.status_code != 200 or r.status_code != 201:
        json_data["StatusCode"] = r.status_code
    return jsonify(**json_data)
@app.route('/send-task')
def send_task():
    identifier = request.args.get('umb')
    id = request.args.get('id')
    task_data = make_task(identifier, id)
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    token_url = request.args.get('token_url').replace("%2F", "/")
    temp_headers = headers
    if (url == base_url):
        url += 'PCDE/'
    else:
        task_data["for"]["reference"] = "Patient?identifier="+identifier
    url += 'Task'
    if not id == '' and not id == None:
        url += '/' + id
        print("SENDING PUT REQUEST")
        r = requests.put(url, json = task_data, headers=temp_headers, verify=False)
        print("SENT")
    else:
        #token = request.args.get('token')
        if not token_url == '' and not token_url is None:
            client_id = request.args.get('cid')
            client_secret = request.args.get('cs')
            data = {'grant_type': 'client_credentials'}
            access_token_response = requests.post(token_url, data=data, verify=False, allow_redirects=False, auth=(client_id, client_secret))
            tokens = json.loads(access_token_response.text)
            temp_headers['Authorization'] = 'Bearer ' + tokens['access_token']

        r = requests.post(url, json = task_data, headers=temp_headers, verify=False)
    json_data = json.loads(r.text)
    if isinstance(json_data, int):
        json_data = {"StatusCode": json_data}
    if r.status_code != 200:
        json_data["StatusCode"] = r.status_code
    return jsonify(**json_data)
@app.route('/subscribe')
def subscribe():
    id = request.args.get('id')
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    subscription_data = make_backport_sub(id, client_url + 'sub-result')
    url += "/Subscription"
    token = request.args.get('token')
    temp_headers = headers
    if not token == '' and not token is None:
        temp_headers['Authorization'] = 'Bearer ' + token
    r = requests.post(url, json = subscription_data, headers=temp_headers, verify=False)
    return jsonify(**json.loads(r.text))
@app.route('/sub-result/Task/<id>', methods=['GET', 'POST', 'PUT'])
def sub_result(id):
    print("Recieved sub result")
    print(id)
    data = json.loads(request.data.decode())
    global task_entries
    task_entries[id] = data
    return json.dumps(data), 200, {'ContentType':'application/json'}
@app.route('/sub-result/Bundle', methods=['GET', 'POST', 'PUT'])
def sub_result_bundle():
    print("Recieved sub result")
    data = json.loads(request.data.decode())
    global bundle_entries
    bundle_entries[str(bundle_id)] = data
    bundle_id += 1
    return json.dumps(data), 200, {'ContentType':'application/json'}

@app.route('/clear-bundles')
def clear_bundle():
    bundle_id = 0
    bundle_entries = {}
    return json.dumps(""), 200, {'ContentType':'application/json'}

@app.route('/get-bundles')
def get_bundles():
    return jsonify(**bundle_entries)


@app.route('/clear-tasks')
def clear_tasks():
    task_entries = {}
    return json.dumps(""), 200, {'ContentType':'application/json'}

@app.route('/get-tasks')
def get_tasks():
    return jsonify(**task_entries)

@app.route('/get-task')
def get_task():
    identifier = request.args.get('id')
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += ('/Task/' + str(identifier))
    token = request.args.get('token')
    temp_headers = headers
    if not token == '' and not token is None:
        temp_headers['Authorization'] = 'Bearer ' + token
    r = requests.get(url, headers=temp_headers, verify=False)
    json_data = json.loads(r.text)
    return jsonify(**json_data)
@app.route('/check-task')
def check_task():
    identifier = request.args.get('id')
    if identifier in task_entries.keys():
        return jsonify(**task_entries[identifier])
    else:
        return jsonify({"error": "Task not found"})
@app.route('/sample-mm')
def sample_mm():
    given = request.args.get('given')
    family = request.args.get('family')
    bdate = request.args.get('birthdate')
    sid = request.args.get('sid')
    mid = request.args.get('mid')
    param_data = get_member_match(given, family, bdate, sid, mid)
    return jsonify(**param_data)
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

def process_bundle(bundle):
    return bundle
def make_subscription(task_id, endpoint):
    return {
      "resourceType": "Subscription",
      "id": "example",
      "text": {
        "status": "generated",
        "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">[Put rendering here]</div>"
      },
      "status": "requested",
      "contact": [
        {
          "system": "phone",
          "value": "ext 4123"
        }
      ],
      "end": "2021-01-01T00:00:00Z",
      "reason": "Monitor new neonatal function",
      "criteria": "Task?_id=" + task_id + "&code=pcde&status=completed",
      "channel": {
        "type": "rest-hook",
        "endpoint": endpoint,
        "payload": "application/fhir+json",
        "header": [
          "Authorization: Bearer secret-token-abc-123"
        ]
      }
    }
def make_backport_sub(task_id, endpoint):
    return {
      "resourceType" : "Subscription",
      "id" : "subscription-multi-resource",
      "meta" : {
        "profile" : [
          "http://hl7.org/fhir/uv/subscriptions-backport/StructureDefinition/backport-subscription"
        ]
      },
      "text" : {
        "status" : "extensions",
        "div" : "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Generated Narrative</b></p><p><b>Backport R5 Subscription Topic Canonical</b>: <a href=\"http://example.org/fhir/SubscriptionTopic/PatientEncounterObservation\">http://example.org/fhir/SubscriptionTopic/PatientEncounterObservation</a></p><p><b>status</b>: active</p><p><b>end</b>: Dec 31, 2020, 12:00:00 PM</p><p><b>reason</b>: Example Backported Subscription for Multiple Resources</p><p><b>criteria</b>: Patient?id=Patient/123</p><h3>Channels</h3><table class=\"grid\"><tr><td>-</td><td><b>Extension</b></td><td><b>Type</b></td><td><b>Endpoint</b></td><td><b>Payload</b></td><td><b>Header</b></td></tr><tr><td>*</td><td>, , , </td><td>rest-hook</td><td><a href=\"https://example.org/Endpoints/d7dcc004-808d-452b-8030-3a3a13cd871d\">https://example.org/Endpoints/d7dcc004-808d-452b-8030-3a3a13cd871d</a></td><td>application/fhir+json</td><td>Authorization: Bearer secret-token-abc-123</td></tr></table></div>"
      },
      "extension" : [
        {
          "url" : "http://hl7.org/fhir/uv/subscriptions-backport/StructureDefinition/backport-topic-canonical",
          "valueUri" : "http://example.org/fhir/SubscriptionTopic/PatientEncounterObservation"
        }
      ],
      "status" : "active",
      "end" : "2020-12-31T12:00:00Z",
      "reason" : "Example Backported Subscription for Multiple Resources",
      "criteria" : "Task?_id=" + task_id + "&code=pcde&status=completed",
      "channel" : {
        "extension" : [
          {
            "url" : "http://hl7.org/fhir/uv/subscriptions-backport/StructureDefinition/backport-heartbeat-period",
            "valueUnsignedInt" : 86400
          },
          {
            "url" : "http://hl7.org/fhir/uv/subscriptions-backport/StructureDefinition/backport-timeout",
            "valueUnsignedInt" : 60
          },
          {
            "url" : "http://hl7.org/fhir/uv/subscriptions-backport/StructureDefinition/backport-notification-url-location",
            "valueCode" : "all"
          },
          {
            "url" : "http://hl7.org/fhir/uv/subscriptions-backport/StructureDefinition/backport-max-count",
            "valuePositiveInt" : 20
          }
        ],
        "type" : "rest-hook",
        "endpoint" : endpoint,
        "payload" : "application/fhir+json",
        "_payload" : {
          "extension" : [
            {
              "url" : "http://hl7.org/fhir/uv/subscriptions-backport/StructureDefinition/backport-payload-content",
              "valueCode" : "id-only"
            }
          ]
        },
        "header" : [
          "Authorization: Bearer secret-token-abc-123"
        ]
      }
    }



def make_request(pid, sid, rid):
    comreq = {
        "resourceType" : "CommunicationRequest",
        "id" : "1",
        "text" : {
        "status" : "generated",
        "div" : "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 1</p><p><b>status</b>: active</p><p><b>subject</b>: <a href=\"Patient/1\">Patient/1</a></p><h3>Payloads</h3><table class=\"grid\"><tr><td>-</td><td><b>Extension</b></td><td><b>Content[x]</b></td></tr><tr><td>*</td><td/><td>Please send previous coverage information.</td></tr></table><p><b>requester</b>: <a href=\"Organization/"+str(rid)+"\">Organization/"+str(rid)+"</a></p><p><b>recipient</b>: <a href=\"Organization/"+str(rid)+"\">Organization/"+str(rid)+"</a></p><p><b>sender</b>: <a href=\"Organization/"+str(sid)+"\">Organization/"+str(sid)+"</a></p></div>"
        },
        "status" : "active",
        "subject" : {
        "reference" : "Patient/"+str(pid)
        },
        "payload" : [
        {
          "extension" : [
            {
              "url" : "http://hl7.org/fhir/us/davinci-cdex/StructureDefinition/cdex-payload-clinical-note-type",
              "valueCodeableConcept" : {
                "coding" : [
                  {
                    "system" : "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDEDocumentCode",
                    "code" : "pcde"
                  }
                ]
              }
            }
          ],
          "contentString" : "Please send previous coverage information."
        }
        ],
        "requester" : {
        "reference" : "Organization/"+str(rid)
        },
        "recipient" : [
        {
          "reference" : "Organization/"+str(rid)
        }
        ],
        "sender" : {
        "reference" : "Organization/"+str(sid)
        }
    }
    return comreq
def make_patient(pid, patient_info):
    patient = {
      "fullUrl": "http://example.org/fhir/Patient/" + str(pid),
      "resource": {
        "resourceType": "Patient",
        "id": str(pid),
        "text": {
          "status": "generated",
          "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: 1</p><p><b>identifier</b>: 12345678901</p><p><b>name</b>: "+patient_info["given"] + patient_info["family"] + " </p></div>"
        },
        "identifier": [
          {
            "system": "http://clinfhir.com/fhir/NamingSystem/identifier",
            "value": ""
          }
        ],
        "name": [
          {
            "family": "",
            "given": []
          }
        ],
        "address": []
      }
    }
    if checkExists("identifier", patient_info):
        patient["resource"]["identifier"][0]["value"] = patient_info["identifier"]
    if checkExists("birthdate", patient_info):
        patient["resource"]["birthDate"] = patient_info["birthdate"]
    if checkExists("family", patient_info):
        patient["resource"]["name"][0]["family"] = patient_info["family"]
    if checkExists("given", patient_info):
        patient["resource"]["name"][0]["given"].append(patient_info["given"])
    if checkExists("address", patient_info):
        patient["resource"]["address"].append(patient_info["family"])
    if checkExists("identifier", patient_info):
        patient["resource"]["identifier"][0]["value"] = patient_info["identifier"]
    return patient
def checkExists(key, obj):
    return key in obj and not obj[key] == ""
def make_org(id, name):
    return {
      "fullUrl": "http://example.org/fhir/Organization/" + str(id),
      "resource": {
        "resourceType": "Organization",
        "id": str(id),
        "text": {
          "status": "generated",
          "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: "+str(id)+"</p><p><b>identifier</b>: 789312</p><p><b>name</b>: "+name+"</p></div>"
        },
        "identifier": [
          {
            "system": "http://example.org/ETIN",
            "value": "789312"
          }
        ],
        "name": name
      }
    }
def make_bundle_request(pid, sid, rid, patient_info):
    comreq = {
        "resourceType": "Bundle",
        "id": "pcde-communicationrequest-example",
        "meta": {
          "lastUpdated": "2019-07-21T11:01:00+05:00"
        },
        "type": "collection",
        "timestamp": "2019-07-21T11:01:00+05:00",
        "entry": [
          {"fullUrl": "http://example.org/fhir/CommunicationRequest/1",
          "resource": make_request(pid, sid, rid)},
          make_patient(pid, patient_info),
          make_org(sid, "MARYLAND CAPITAL INSURANCE COMPANY"),
          make_org(rid, "MARYLAND GLOBAL INSURANCE COMPANY"),
          make_endpoint(5)
        ]
        }
    return comreq
# NOTE: UPDATE THIS TO HANDLE URL CORRECTLY
def make_endpoint(id):
    return {
        "fullUrl": "http://example.org/fhir/Endpoint/" + str(id),
        "resource": {
            "resourceType" : "Endpoint",
            "address" : str(return_endpoint)
        }
    }
def test_address():
    return [
    {
      "line": [
        "123 Main St"
      ],
      "city": "Somewhere",
      "state": "OK",
      "postalCode": "12345",
      "country": "US"
    }
  ]
def make_task(identifier, id="requested"):
    return {
      "resourceType" : "Task",
      "id" : id,
      "text" : {
        "status" : "generated",
        "div" : "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: requested</p><p><b>status</b>: requested</p><p><b>intent</b>: order</p><p><b>code</b>: Coverage Transition Document <span style=\"background: LightGoldenRodYellow\">(Details : {http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDEtempCodes code 'pcde' = 'Coverage Transition Document', given as 'Coverage Transition Document'})</span></p><p><b>for</b>: </p><p><b>requester</b>: New Insurance Co Inc.</p><p><b>owner</b>: Original Insurance Co Inc.</p></div>"
      },
      "status" : "requested",
      "intent" : "order",
      "code" : {
        "coding" : [
          {
            "system" : "http://hl7.org/fhir/us/davinci-pcde/CodeSystem/PCDEtempCodes",
            "code" : "pcde",
            "display" : "Coverage Transition Document"
          }
        ]
      },
      "for" : {
        "type" : "Patient",
        "identifier" : {
          "system" : "http://originalinsuranceinc.com/fhir/NamingSystem/client-ids",
          "value" : identifier
        }
      },
      "requester" : {
        "type" : "Organization",
        "display" : "New Insurance Co Inc."
      },
      "owner" : {
        "type" : "Organization",
        "display" : "Original Insurance Co Inc."
      }
    }

def get_identifier(value):
    return {
              "system": "http://oldhealthplan.example.com",
              "value": value
            }
def get_full_identifier(value, code):
    return {
                "use": "usual",
                "type": {
                    "coding": [
                        {
                            "system": "http://hl7.org/fhir/v2/0203",
                            "code": code,
                            "display": "Medical record number",
                            "userSelected": False
                        }
                    ],
                    "text": "Medical record number"
                },
                "system": "http://hospital.smarthealthit.org",
                "value": value
            }
def get_member_match(given="", family="", birthDate="", sid="", mid=""):
    parameters = {
    "resourceType": "Parameters",
    "parameter": [
      {
        "name": "exact",
        "valueBoolean": True
      },
      {
        "name": "MemberPatient",
        "resource": {
          "resourceType": "Patient",
          "id": "1",
          "name": [
            {
              "use": "official",
              "family": family,
              "given": [given]
            }
          ],
          "gender": "male",
          "birthDate": birthDate
        }
      },
      {
        "name": "OldCoverage",
        "resource": {
          "resourceType": "Coverage",
          "id": "9876B1",
          "text": {
            "status": "generated",
            "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">A human-readable rendering of the coverage</div>"
          },
          "contained": [
            {
              "resourceType" : "Organization",
              "id" : "Organization/2",
              "name" : "Old Health Plan",
              "endpoint" : [
                {
                  "reference" : "http://www.oldhealthplan.com"
                }
             ]
            }
            ],
          "identifier": [
            {
              "system": "http://oldhealthplan.example.com",
              "value": "12345"
            }
          ],
          "status": "draft",
          "beneficiary": {
            "reference": "Patient/4"
          },
          "period": {
            "start": "2011-05-23",
            "end": "2012-05-23"
          },
          "payor": [
            {
              "reference": "#Organization/2"
            }
          ],
          "class": [
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "group"
                  }
                ]
              },
              "value": "CB135"
            },
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "plan"
                  }
                ]
              },
              "value": "B37FC"
            },
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "subplan"
                  }
                ]
              },
              "value": "P7"
            },
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "class"
                  }
                ]
              },
              "value": "SILVER"
            }
          ]
        }
      },
      {
        "name": "NewCoverage",
        "resource": {
          "resourceType": "Coverage",
          "id": "AA87654",
          "contained": [
              {
                "resourceType" : "Organization",
                "id" : "Organization/3",
                "name" : "New Health Plan",
                "endpoint" : [
                  {
                    "reference" : "http://www.newhealthplan.com"
                  }
                ]
              }
            ],
            "identifier": [
            {
              "system": "http://newealthplan.example.com",
              "value": "234567"
            }
          ],
          "status": "active",
          "beneficiary": {
            "reference": "Patient/1"
          },
          "period": {
            "start": "2020-04-01",
            "end": "2021-03-31"
          },
          "payor": [
            {
              "reference": "#Organization/3"
            }
          ],
          "class": [
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "group"
                  }
                ]
              },
              "value": "A55521",
              "name": "New Health Plan Group"
            },
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "subgroup"
                  }
                ]
              },
              "value": "456"
            },
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "plan"
                  }
                ]
              },
              "value": "99012"
            },
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "subplan"
                  }
                ]
              },
              "value": "A4"
            },
            {
              "type": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
                    "code": "class"
                  }
                ]
              },
              "value": "GOLD"
            }
          ]
        }
      }
    ]
  }
    if (not sid == "") or (not mid == ""):
        parameters["parameter"][1]["resource"]["identifier"] = []
        if not sid == "":
            parameters["parameter"][1]["resource"]["identifier"].append(get_identifier(sid))
        if not mid == "":
            parameters["parameter"][1]["resource"]["identifier"].append(get_full_identifier(mid, "MB"))
            parameters["parameter"][2]["resource"]["identifier"].append(get_full_identifier(mid, "MB"))
    return parameters


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
