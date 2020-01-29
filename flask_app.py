from flask import *
import requests
import os
import base64

app = Flask(__name__)
headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
base_url = 'https://davinci-pcde-ri.logicahealth.org/fhir/'#'http://localhost:8080/fhir/'#
client_url = 'https://davinci-pcde-client.logicahealth.org/'#'https://davinci-pcde-ri.logicahealth.org/fhir/'##'http://localhost:5000/'#
return_endpoint = client_url + 'receiveBundle'
last_bundle = '{"Status":"None"}'
@app.route('/')
def index(name=None):
    return render_template('index.html', name=name)
@app.route('/Patient')
def patient(name=None):
    return render_template('patient.html', name=name)
@app.route('/CommunicationRequest')
def comreq(name=None):
    return render_template('comreq.html', name=name)

@app.route('/CommunicationRequestb')
def comreqb(name=None):
    return render_template('comreqb.html', name=name)

@app.route('/Bundle')
def bundle(name=None):
    return render_template('bundle.html', name=name)

@app.route('/receiveBundle', methods=['GET', 'POST'])
def receiveBundle():
    data = request.data
    global last_bundle
    last_bundle = data
    print(data)
    return json.dumps(data), 200, {'ContentType':'application/json'}
@app.route('/getlastbundle')
def get_last_bundle():
    json_data = json.loads(last_bundle)
    try:
        encoding = str(json_data["entry"][0]["payload"][0]["contentAttachment"]["data"])
        json_data["entry"][0]["payload"][0]["contentAttachment"]["data"] = str(base64.b64decode(encoding))
    except Exception as e:
        print e
    return jsonify(**json_data)
@app.route('/getpatient')
def get_patient():
    given = request.args.get('given')
    family = request.args.get('family')
    bdate = request.args.get('birthdate')
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += 'Patient?given='+given+'&family='+family+'&birthdate='+bdate
    r = requests.get(url, headers=headers, verify=False)
    #print (r)
    json_data = json.loads(r.text)
    return jsonify(**json_data)
@app.route('/getbundle')
def get_bundle():
    headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
    id = request.args.get('id')
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += 'Bundle/' + id
    #print (url)
    r = requests.get(url, headers=headers, verify=False)
    #print (r)
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
    headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
    pid = 1
    rid = 2
    sid = 3
    given = request.args.get('given')
    family = request.args.get('family')
    bdate = request.args.get('birthdate')
    identifier = request.args.get('identifier')
    patient_info = {"given":given, "family":family, "birthdate":bdate, "identifier": identifier}
    req_data = make_bundle_request(pid, sid, rid, patient_info)
    #print(req_data)
    url = request.args.get('url').replace("%2F", "/") if request.args.get('url') else base_url
    url += 'PCDE'
    r = requests.post(url, json = req_data, headers=headers, verify=False)
    json_data = json.loads(r.text)
    encoding = str(json_data["payload"][0]["contentAttachment"]["data"])
    json_data["payload"][0]["contentAttachment"]["data"] = str(base64.b64decode(encoding))
    json_data["status_code"] = r.status_code
    #print(r.text)
    return jsonify(**json_data)
@app.route('/postcomreq')
def post_comreq():
    headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
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
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')
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

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
