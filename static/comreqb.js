$(function() {
  $('#gp').bind('click', function() {
    $("#display").html("<div></div>");
    pid = $("#pid").val();
    sid = $("#sid").val();
    rid = $("#rid").val();
    given = $("#given").val();
    family = $("#family").val();
    bdate = $("#bdate").val();
    identifier = $("#identifier").val();
    url = $("#url").val().replace(/\//g, '%2F');
    $.getJSON('/postcomreqb?identifier='+identifier+'&given='+given+'&family='+family+'&birthdate='+bdate+'&url='+url,
        function(data) {
          //console.log(data)
          var div = "<div><h2>"+data["status_code"]+"</h2><h2>"+data["resourceType"]+"</h2>";
          console.log(data["status_code"])
          if (data["status_code"] == 200) {
              var div = "<div><h2>"+data["resourceType"]+"</h2>";
              div += "<h3>Sender: "+ data["sender"]["reference"]+ "</h3>";
              div += "<h3>Recipient: "+ data["recipient"][0]["reference"] + "</h3>";
              div += "<h3>Subject: "+ data["subject"]["reference"]+ "</h3>";
              div += "<h3>Payload: "+ data["payload"][0]["contentAttachment"]["data"]+ "</h3>";
          } else {
            div += "<h3>Sender: "+ data["sender"]["reference"]+ "</h3>";
            div += "<h3>Recipient: "+ data["recipient"][0]["reference"] + "</h3>";
            div += "<h3>Payload: "+ data["payload"][0]["contentAttachment"]["data"]+ "</h3>";
            div += "</div>";
            $("#display").html(div);
          }
          //
          //formatter = formatResource(data);
          //$("#json").html(syntaxHighlight(data));
    });
    return false;
  });
});
$(function() {
  $('#gc').bind('click', function() {
    given = $("#given").val();
    family = $("#family").val();
    bdate = $("#bdate").val();
    identifier = $("#identifier").val();
    $.getJSON('/getlastbundle?identifier='+identifier+'&given='+given+'&family='+family+'&birthdate='+bdate,
        function(data) {
          console.log(data)
          var div;
          if (data["resourceType"] === "Bundle") {
              communication = data["entry"][0]["resource"]
              patient = data["entry"][1]["resource"]

              patientDiv = "<div class='card'>"
              patientDiv += "<table style='width:100%'>";
              patientDiv += "<tr><td>Name: </td><td>"+patient["name"][0]["given"] + " "+ patient["name"][0]["family"]+"</td></tr>";
              if ('gender' in patient) {
                  patientDiv += "<tr><td>Gender: </td><td>"+patient["gender"]+"</td></tr>";
              }
              if ('birthDate' in patient) {
                  patientDiv += "<tr><td>Birth Date: </td><td>"+patient["birthDate"]+"</td></tr>";
              }
              if ('address' in patient) {
                  patientDiv += "<tr><td>Address: </td><td>"+patient["address"][0]["line"][0] + " "+ patient["address"][0]["city"]+ ", "+ patient["address"][0]["state"]+ ", "+ patient["address"][0]["postalCode"]+"</td></tr>";
              }
              patientDiv += "</table>";
              patientDiv += "</div>";

              recipient = data["entry"][2]["resource"]

              sender = data["entry"][3]["resource"]
              senderDiv = "<div class='card'>"
              senderDiv += "<table style='width:100%'>";
              senderDiv += "<tr><td>Name: </td><td>"+sender["name"]+"</td></tr>";
              if ('address' in sender) {
                  senderDiv += "<tr><td>Address: </td><td>"+sender["address"][0]["line"][0] + " "+ sender["address"][0]["city"]+ ", "+ sender["address"][0]["state"]+ ", "+ sender["address"][0]["postalCode"]+"</td></tr>";
              }
              if ('telecom' in sender) {
                  for (var telecom in sender['telecom']) {
                      senderDiv += "<tr><td>"+telecom['system']+" </td><td>"+telecom["value"]+"</td></tr>";
                  }
              }
              senderDiv += "</table>";
              senderDiv += "</div>";
              div = patientDiv;
              div += senderDiv;
              div += "<div class='card'><h2>"+communication["resourceType"]+"</h2>";
              console.log(communication["status_code"])
              if (communication["status_code"] == 200) {
                  var div = "<div><h2>"+communication["resourceType"]+"</h2>";
                  div += "<h3>Sender: "+ communication["sender"]["reference"]+ "</h3>";
                  div += "<h3>Recipient: "+ communication["recipient"][0]["reference"] + "</h3>";
                  div += "<h3>Subject: "+ communication["subject"]["reference"]+ "</h3>";
                  div += "<h3>Payload: "+ communication["payload"][0]["contentAttachment"]["communication"]+ "</h3>";
              } else {
                div += "<h3>Sender: "+ communication["sender"]["reference"]+ "</h3>";
                div += "<h3>Recipient: "+ communication["recipient"][0]["reference"] + "</h3>";
                div += "<h3>Subject: "+ communication["subject"]["reference"]+ "</h3>";
                div += "<h3>Payload: "+ communication["payload"][0]["contentAttachment"]["data"]+ "</h3>";
              }
              div += "</div>";
          } else {
              div = "<div>" + syntaxHighlight(data) + "</div>";
          }
          $("#display").html(div);

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
function syntaxHighlight(json_obj) {
    var json = JSON.stringify(json_obj)
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
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
