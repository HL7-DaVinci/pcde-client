$(function() {
  let coll = document.getElementsByClassName("collapsible");
  let i;

  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      let content = this.nextElementSibling;
      let colCon = document.getElementById("collapseContainer");
      let parent = content.parentElement;
      if (content.style.maxHeight){
        if (colCon !== parent) {
            colCon.style.maxHeight = (parseInt(colCon.style.maxHeight, 10) - parseInt(content.maxHeight, 10)) + "px";
        }
        parent.style.maxHeight = (parseInt(parent.style.maxHeight, 10) - parseInt(content.maxHeight, 10)) + "px";
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
        if (colCon !== parent) {
            colCon.style.maxHeight = (parseInt(colCon.style.maxHeight, 10) + parseInt(content.style.maxHeight, 10)) + "px";
        }
        parent.style.maxHeight = (parseInt(parent.style.maxHeight, 10) + parseInt(content.style.maxHeight, 10)) + "px";
      }
    });
  }

  $('#gp').bind('click', function() {
    id = $("#pid").val();
    url = $("#url").val().replace(/\//g, '%2F');
    $("#display").html("<div></div>");
    $.getJSON('/getbundle?id='+id+'&url='+url,
        function(data) {
          document.getElementById("collapseContainer").style.display = "none";
          formatter = formatResource(data);
          $("#json").html("<h3>Full Bundle</h3>"+syntaxHighlight(JSON.stringify(formatter, undefined, 2)));
          let div = "";
          let medDisplay = "";
          let deviceDisplay = "";
          let other = "";
          if (data["resourceType"] === "Bundle") {
              document.getElementById("collapseContainer").style.display = "block";
              div = "<div><h2>"+data["entry"][0]["resource"]["title"]+"</h2>";
              for (let i = 0; i < data["entry"].length; i++) {
                if (data["entry"][i]["resource"]["resourceType"] == "Patient") {
                  let patient = data["entry"][i]["resource"]
                  let pDisplay ="<table style='width:100%'>";
                  pDisplay += "<tr><td>Name: </td><td>"+patient["name"][0]["given"][0] + " "+ patient["name"][0]["family"]+"</td></tr>";
                  if (patient["birthDate"])
                      pDisplay += "<tr><td>Birth Date: </td><td>"+patient["birthDate"]+"</td></tr>";
                  if (patient["address"])
                      pDisplay += "<tr><td>Address: </td><td>"+patient["address"][0]["line"][0] + " "+ patient["address"][0]["city"]+ ", "+ patient["address"][0]["state"]+ ", "+ patient["address"][0]["postalCode"]+"</td></tr>";
                  for (let j = 0; j < data["identifier"].length; j++) {
                      pDisplay += "<tr><td>"+patient["identifier"][j]["type"]["coding"][0]["display"]+": </td><td>"+patient["identifier"][j]["value"]+"</td></tr>";
                  }
                  pDisplay += "<tr><td>FHIR ID: </td><td>"+patient["id"]+"</td></tr>";
                  pDisplay += "</table>"
                  $("#patientContent").html(pDisplay);
                  div += "<h3>Patient</h3>"+data["entry"][i]["resource"]["text"]["div"];
                }
                else if (data["entry"][i]["resource"]["resourceType"] == "Organization") {
                  div += "<h3>Payer</h3>"+data["entry"][i]["resource"]["text"]["div"];
                }
                else if (data["entry"][i]["resource"]["resourceType"] == "CarePlan") {
                  let careplan = data["entry"][i]["resource"];
                  div += "<h3>Care Plan</h3>"+data["entry"][i]["resource"]["text"]["div"];

                  for (let j = 0; j < careplan["activity"].length; j++) {
                      if (careplan["activity"][j]["detail"]["kind"] === "MedicationRequest") {
                          medDisplay += "<h3>"+careplan["activity"][j]["detail"]["kind"]+"</h3><table style='width:100%'>";
                          medDisplay += "<tr><td>" + careplan["activity"][j]["detail"]["productCodeableConcept"]["text"] + "</td></tr>";
                          if (careplan["activity"][j]["detail"]["description"])
                              medDisplay += "<tr><td>" + careplan["activity"][j]["detail"]["description"] + "</td></tr>";
                          for (let k = 0; k < careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"].length; k++) {
                            medDisplay += "<tr><td>Code: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["code"] + "</td></tr>";
                            medDisplay += "<tr><td>Description: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["display"] + "</td></tr>";
                          }
                          medDisplay += "</table>";

                      } else if (careplan["activity"][j]["detail"]["kind"] === "DeviceRequest") {
                          deviceDisplay += "<h3>"+careplan["activity"][j]["detail"]["kind"]+"</h3><table style='width:100%'>";
                          deviceDisplay += "<tr><td>" + careplan["activity"][j]["detail"]["productCodeableConcept"]["text"] + "</td></tr>";
                          if (careplan["activity"][j]["detail"]["description"])
                              deviceDisplay += "<tr><td>" + careplan["activity"][j]["detail"]["description"] + "</td></tr>";
                          for (let k = 0; k < careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"].length; k++) {
                            deviceDisplay += "<tr><td>Code: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["code"] + "</td></tr>";
                            deviceDisplay += "<tr><td>Description: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["display"] + "</td></tr>";
                          }
                          deviceDisplay += "</table>";
                      } else {
                          if (careplan["activity"][j]["detail"]["kind"]) {
                              other += "<h3>"+careplan["activity"][j]["detail"]["kind"]+"</h3><table style='width:100%'>";
                              if (careplan["activity"][j]["detail"]["productCodeableConcept"]) {
                                  other += "<tr><td>" + careplan["activity"][j]["detail"]["productCodeableConcept"]["text"] + "</td></tr>";
                                  if (careplan["activity"][j]["detail"]["description"])
                                      other += "<tr><td>" + careplan["activity"][j]["detail"]["description"] + "</td></tr>";
                                  for (let k = 0; k < careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"].length; k++) {
                                    other += "<tr><td>Code: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["code"] + "</td></tr>";
                                    other += "<tr><td>Description: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["display"] + "</td></tr>";
                                  }
                              }
                              other += "</table>";
                          } else { console.log(careplan["activity"][j])}
                      }
                  }

                }
              }
              div += "</div>";
              $("#medicineContent").html(medDisplay);
              $("#equipmentContent").html(deviceDisplay);
              $("#other").html(other);
              $("#bundle").html(div);
          }
    });
    return false;
  });
});
function formatResource(data) {
    let formatter = null;
    if (data["resourceType"] == "OperationOutcome") {
        formatter = {
            "resourceType": data["resourceType"],
            "issue": data["issue"],
            "text": data["text"]
        }
    } else {
        formatter = {
            "resourceType": data["resourceType"],
            "id": data["id"],
            "meta": data["meta"],
            "identifier": data["identifier"],
            "type": data["type"],
            "timestamp": data["timestamp"],
            "entry": data["entry"]
        }
    }
    return formatter;
}
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
