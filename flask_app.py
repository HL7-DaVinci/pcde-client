from flask import *
import requests
import os
import base64

app = Flask(__name__)
headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
base_url = 'https://davinci-pcde-ri.logicahealth.org/fhir/'#'http://localhost:8080/fhir/'#
@app.route('/')
def index(name=None):
    return render_template('index.html', name=name)
@app.route('/Patient')
def patient(name=None):
    return render_template('patient.html', name=name)
@app.route('/CommunicationRequest')
def comreq(name=None):
    return render_template('comreq.html', name=name)

@app.route('/Bundle')
def bundle(name=None):
    return render_template('bundle.html', name=name)

@app.route('/getpatient')
def get_patient():
    given = request.args.get('given')
    family = request.args.get('family')
    bdate = request.args.get('birthdate')
    url = base_url + 'Patient?given='+given+'&family='+family+'&birthdate='+bdate
    r = requests.get(url, headers=headers, verify=False)
    print (r)
    json_data = json.loads(r.text)
    return jsonify(**json_data)
@app.route('/getbundle')
def get_bundle():
    headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
    id = request.args.get('id')
    url = base_url + 'Bundle/' + id
    r = requests.get(url, headers=headers, verify=False)
    print (r)
    json_data = json.loads(r.text)
    return jsonify(**json_data)
@app.route('/getcomreq')
def get_comreq():
    headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
    id = request.args.get('id')
    url = base_url + 'CommunicationRequest/' + id
    r = requests.get(url, headers=headers, verify=False)
    print (r)
    json_data = json.loads(r.text)
    return jsonify(**json_data)
@app.route('/postcomreq')
def post_comrep():
    headers = {'Accept' : 'application/json', 'Content-Type' : 'application/json'}
    pid = request.args.get('pid')
    rid = request.args.get('rid')
    sid = request.args.get('sid')
    req_data = make_request(pid, sid, rid)
    url = base_url + 'PCDE'
    r = requests.post(url, json = req_data, headers=headers, verify=False)
    json_data = json.loads(r.text)
    print (json_data["payload"][0]["contentAttachment"]["data"])
    encoding = str(json_data["payload"][0]["contentAttachment"]["data"])
    json_data["payload"][0]["contentAttachment"]["data"] = str(base64.b64decode(encoding))
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

if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0')
