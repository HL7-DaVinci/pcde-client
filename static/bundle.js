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
          let medRGroups = [];
          let medDGroups = [];
          let medCGroups = {};
          let medEOBGroups = {};
          let deviceDisplay = "";
          let other = "";
          let supportingInfo = "";
          if (data["resourceType"] === "Bundle") {
              document.getElementById("collapseContainer").style.display = "block";
              div = "<div><h2>"+data["entry"][0]["resource"]["title"]+"</h2>";
              for (let i = 0; i < data["entry"].length; i++) {
                if (!data["entry"][i]["resource"]) {
                  console.log("TEST")
                  console.log(data["entry"][i])
                }
                else if (data["entry"][i]["resource"]["resourceType"] == "Patient") {
                  let patient = data["entry"][i]["resource"]
                  let pDisplay ="<div class='card'><table style='width:100%'>";
                  pDisplay += "<tr><td>Name: </td><td>"+patient["name"][0]["given"][0] + " "+ patient["name"][0]["family"]+"</td></tr>";
                  if (patient["birthDate"])
                      pDisplay += "<tr><td>Birth Date: </td><td>"+patient["birthDate"]+"</td></tr>";
                  if (patient["address"])
                      pDisplay += "<tr><td>Address: </td><td>"+patient["address"][0]["line"][0] + " "+ patient["address"][0]["city"]+ ", "+ patient["address"][0]["state"]+ ", "+ patient["address"][0]["postalCode"]+"</td></tr>";
                  for (let j = 0; j < data["identifier"].length; j++) {
                      pDisplay += "<tr><td>"+patient["identifier"][j]["type"]["coding"][0]["display"]+": </td><td>"+patient["identifier"][j]["value"]+"</td></tr>";
                  }
                  pDisplay += "<tr><td>FHIR ID: </td><td>"+patient["id"]+"</td></tr>";
                  pDisplay += "</table></div>"
                  $("#patientContent").html(pDisplay);
                  div += "<h3>Patient</h3>"+data["entry"][i]["resource"]["text"]["div"];
                }
                else if (data["entry"][i]["resource"]["resourceType"] == "Organization") {
                  div += "<h3>Payer</h3>"+data["entry"][i]["resource"]["text"]["div"];
                }
                else if (data["entry"][i]["resource"]["resourceType"] == "CarePlan") {
                  let careplan = data["entry"][i]["resource"];
                  div += "<h3>Care Plan</h3>";

                  if (data["entry"][i]["resource"]["text"]) {
                      div += "<h3>Care Plan</h3>"+data["entry"][i]["resource"]["text"]["div"];
                  } else {
                      console.log(data["entry"][i])
                  }
                  let claimRef = "";
                  let eobRef = "";
                  for (let j = 0; j < careplan["activity"].length; j++) {
                      if (careplan["activity"][j]["outcomeReference"]) {
                          if (careplan["activity"][j]["outcomeReference"][0]["reference"].includes("Claim")) {
                              claimRef = careplan["activity"][j]["outcomeReference"][0]["reference"];
                              console.log("Setting Claim Ref " + claimRef);
                          } else if (careplan["activity"][j]["outcomeReference"][0]["reference"].includes("ExplanationOfBenefit")) {

                              eobRef = careplan["activity"][j]["outcomeReference"][0]["reference"];
                              console.log("ADDING EOBREF" + eobRef)
                          }
                      } else if (careplan["activity"][j]["detail"]["kind"] === "MedicationRequest") {
                          console.log("Current claimRef: " + claimRef);
                          if (claimRef !== "") {
                              console.log("Adding to careplan " + claimRef);
                              careplan["activity"][j]["claimRef"] = claimRef;
                              claimRef = "";
                          } else if (eobRef !== "") {
                              console.log("Adding to careplan " + eobRef);
                              careplan["activity"][j]["eobRef"] = eobRef;
                              eobRef = "";
                          }
                          medRGroups.push(careplan["activity"][j])
                      } else if (careplan["activity"][j]["detail"]["kind"] === "DeviceRequest") {
                          deviceDisplay += "<div class='card'><h3>"+careplan["activity"][j]["detail"]["kind"]+"</h3><table style='width:100%'>";
                          deviceDisplay += "<tr><td>" + careplan["activity"][j]["detail"]["productCodeableConcept"]["text"] + "</td></tr>";
                          if (careplan["activity"][j]["detail"]["description"])
                              deviceDisplay += "<tr><td>" + careplan["activity"][j]["detail"]["description"] + "</td></tr>";
                          for (let k = 0; k < careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"].length; k++) {
                            deviceDisplay += "<tr><td> </td></tr>";
                            deviceDisplay += "<tr><td>System: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["system"] + "</td></tr>";
                            deviceDisplay += "<tr><td>Code: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["code"] + "</td></tr>";
                            deviceDisplay += "<tr><td>Description: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["display"] + "</td></tr>";
                          }
                          deviceDisplay += "</table></div>";
                      } else if (careplan["activity"][j]["detail"]["kind"] === "ServiceRequest") {
                          if (careplan["activity"][j]["detail"]["kind"]) {
                              other += "<div class='card'><h3>"+careplan["activity"][j]["detail"]["kind"]+"</h3><table style='width:100%'>";
                              if (careplan["activity"][j]["detail"]["productCodeableConcept"]) {
                                  other += "<tr><td>" + careplan["activity"][j]["detail"]["productCodeableConcept"]["text"] + "</td></tr>";
                                  if (careplan["activity"][j]["detail"]["description"])
                                      other += "<tr><td>" + careplan["activity"][j]["detail"]["description"] + "</td></tr>";
                                  for (let k = 0; k < careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"].length; k++) {
                                    other += "<tr><td> </td></tr>";
                                    other += "<tr><td>System: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["system"] + "</td></tr>";
                                    other += "<tr><td>Code: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["code"] + "</td></tr>";
                                    other += "<tr><td>Description: " + careplan["activity"][j]["detail"]["productCodeableConcept"]["coding"][k]["display"] + "</td></tr>";
                                  }
                              }
                              other += "</table></div>";
                          } else { console.log(careplan["activity"][j])}
                      }
                  }

                } else if (data["entry"][i]["resource"]["resourceType"] == "DocumentReference") {
                    let docRef = data["entry"][i]["resource"];
                    supportingInfo += "<div class='card'><h3>"+docRef["resourceType"]+"</h3><table style='width:100%'>";
                    supportingInfo += "<tr><td>System: " + docRef["type"]["coding"][0]["system"] + "</td></tr>";
                    supportingInfo += "<tr><td>Code: " + docRef["type"]["coding"][0]["code"] + "</td></tr>";
                    if (docRef["content"][0]["attachment"]["contentType"] === "text/plain") {
                        // Parse the base64 plan text
                        supportingInfo += "<tr><td>Text: " + atob(docRef["content"][0]["attachment"]["data"]) + "</td></tr>";
                    } else if (docRef["content"][0]["attachment"]["contentType"] === "application/pdf") {
                        // Parse the base64 PDF
                        supportingInfo += "<tr><td>PDF Attachment</td></tr>";
                        supportingInfo += "<a download='file.pdf' href='"+convertToPDF(docRef["content"][0]["attachment"]["data"])+"'>Download PDF</a>";
                    } else if (docRef["content"][0]["attachment"]["contentType"] === "application/edi-x12") {
                        console.log("edi-x12")
                        supportingInfo += "<tr><td>Text: " + docRef["content"][0]["attachment"]["contentType"] + "</td></tr>";
                        supportingInfo += "<a download='file.txt' href='"+convertToTxt(docRef["content"][0]["attachment"]["data"])+"'>Download Text</a>";
                        supportingInfo += "<div>" + parsex12(atob(docRef["content"][0]["attachment"]["data"])) + "</div>";
                    }
                    supportingInfo += "</table></div>";
                } else if (data["entry"][i]["resource"]["resourceType"] == "MedicationDispense") {
                    medDGroups.push(data["entry"][i]["resource"]);
                    console.log(data["entry"][i]["resource"]);
                } else if (data["entry"][i]["resource"]["resourceType"] == "Claim") {
                    // This will contain all claims
                    medCGroups["Claim/" + data["entry"][i]["resource"]["id"]] = data["entry"][i]["resource"];
                } else if (data["entry"][i]["resource"]["resourceType"] == "ExplanationOfBenefit") {
                    // This will contain all claims
                    console.log("FOUND EOB");
                    console.log(data["entry"][i]["resource"])
                    medEOBGroups["ExplanationOfBenefit/" + data["entry"][i]["resource"]["id"]] = data["entry"][i]["resource"];
                }
              }
              div += "</div>";
              let usedList = [];
              for (let mr of medRGroups) {
                  medDisplay += "<div class='card'>";
                  medDisplay += medicationRequestHTML(mr);
                  if (mr["claimRef"]) {
                      console.log("Adding Claim Ref to medDisplay");
                      medDisplay += medicationClaimHTML(medCGroups[mr["claimRef"]]);
                  }
                  if (mr["eobRef"]) {
                      console.log("Adding EOB Ref to medDisplay");
                      medDisplay += medicationClaimHTML(medEOBGroups[mr["eobRef"]]);
                  }
                  let x = 0;
                  for (let md of medDGroups) {
                      for (let i = 0; i < mr["detail"]["productCodeableConcept"]["coding"].length; i++) {
                          for (let j = 0; j < mr["detail"]["productCodeableConcept"]["coding"].length; j++) {
                              if (mr["detail"]["productCodeableConcept"]["coding"][i]["code"] === md["medicationCodeableConcept"]["coding"][j]["code"]) {
                                  medDisplay += medicationDispenseHTML(md);
                                  usedList.push(x)
                              }
                          }
                      }
                      x++;
                  }
                  medDisplay += "</div>";
              }
              for (let i = 0; i < medDGroups.length; i++) {
                  if (!(i in usedList)) {
                      medDisplay += "<div class='card'>";
                      medDisplay += medicationDispenseHTML(medDGroups[i]);
                      medDisplay += "</div>";
                  }
              }
              $("#medicineContent").html(medDisplay);
              $("#equipmentContent").html(deviceDisplay);
              $("#other").html(other);
              $("#supInf").html(supportingInfo);
              $("#bundle").html(div);
          }
    });
    return false;
  });
});
// mr will be careplan["activity"][index]
function medicationRequestHTML(mr) {
    let medDisplay = "<h3>"+mr["detail"]["kind"]+"</h3><table style='width:100%'>";
    medDisplay += "<tr><td>" + mr["detail"]["productCodeableConcept"]["text"] + "</td></tr>";
    if (mr["detail"]["description"])
        medDisplay += "<tr><td>" + mr["detail"]["description"] + "</td></tr>";
    for (let k = 0; k < mr["detail"]["productCodeableConcept"]["coding"].length; k++) {
      medDisplay += "<tr><td> </td></tr>";
      medDisplay += "<tr><td>System: " + mr["detail"]["productCodeableConcept"]["coding"][k]["system"] + "</td></tr>";
      medDisplay += "<tr><td>Code: " + mr["detail"]["productCodeableConcept"]["coding"][k]["code"] + "</td></tr>";
      medDisplay += "<tr><td>Description: " + mr["detail"]["productCodeableConcept"]["coding"][k]["display"] + "</td></tr>";
    }
    medDisplay += "</table>";
    return medDisplay;
}
function medicationDispenseHTML(md) {
      let medDisplay = "<h3>"+md["resourceType"]+"</h3><table style='width:100%'>";
      medDisplay += "<tr><td>" + md["medicationCodeableConcept"]["text"] + "</td></tr>";
      medDisplay += "<tr><td>Status: " + md["status"] + "</td></tr>";
      for (let k = 0; k < md["medicationCodeableConcept"]["coding"].length; k++) {
        medDisplay += "<tr><td> </td></tr>";
        medDisplay += "<tr><td>System: " + md["medicationCodeableConcept"]["coding"][k]["system"] + "</td></tr>";
        medDisplay += "<tr><td>Code: " + md["medicationCodeableConcept"]["coding"][k]["code"] + "</td></tr>";
        medDisplay += "<tr><td>Description: " + md["medicationCodeableConcept"]["coding"][k]["display"] + "</td></tr>";
      }
      medDisplay += "</table>";
      return medDisplay;
}
function medicationClaimHTML(claim) {
    let medDisplay = "<h3>"+claim["resourceType"]+"</h3><table style='width:100%'>";
    let product = claim["item"][0]["productOrService"]
    for (let k = 0; k < product["coding"].length; k++) {
      medDisplay += "<tr><td> </td></tr>";
      medDisplay += "<tr><td>System: " + product["coding"][k]["system"] + "</td></tr>";
      medDisplay += "<tr><td>Code: " + product["coding"][k]["code"] + "</td></tr>";
      medDisplay += "<tr><td>Description: " + product["coding"][k]["display"] + "</td></tr>";
    }
    medDisplay += "</table>";
    return medDisplay;
}
function convertToPDF(b64) {
      // Embed the PDF into the HTML page and show it to the user
      // let obj = document.createElement('object');
      // obj.style.width = '100%';
      // obj.style.height = '842pt';
      // obj.type = 'application/pdf';
      // obj.data = 'data:application/pdf;base64,' + b64;
      // let pdfDiv = "<div><object style='width: 100%; height: 842px;' type='application/pdf' data='data:application/pdf;base64+" + b64 + "'></object></div>";
      // document.body.appendChild(obj);
      // $("#pdfDiv").append(obj);

      // Insert a link that allows the user to download the PDF file
      let link = document.createElement('a');
      link.innerHTML = 'Download PDF file';
      link.download = 'file.pdf';
      link.href = 'data:application/octet-stream;base64,' + b64;
      return link;
}
function convertToTxt(b64) {
  let link = document.createElement('a');
  link.innerHTML = 'Download txt file';
  link.download = 'file.txt';
  link.href = 'data:application/octet-stream;base64,' + b64;
  return link;
}
function parsex12(x12) {
    let parsed = "";
    x12.split("~").forEach(function(item) {
        if (item.includes("*****46*560894904")) {
            let parts = item.split("*");
            parsed += "<div>Insurance: "+parts[3]+"</div>";
        } else if (item.includes("NM1*IL*1*")) {
            let parts = item.split("*");
            parsed += "<div>Subscriber Name: "+parts[4] +" " + parts[3]+"</div>";
        } else if (item.includes("N3")) {
            let parts = item.split("*");
            parsed += "<div>Address: "+parts[1];
        } else if (item.includes("N4")) {
            let parts = item.split("*");
            parsed += ", "+parts[1] +", " + parts[2] +" " + parts[3] + "</div>";
        }
    });
    return parsed;

}
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
