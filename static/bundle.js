$(function() {
  $('#gp').bind('click', function() {
    id = $("#pid").val();
    url = $("#url").val().replace(/\//g, '%2F');
    console.log(url)
    $("#display").html("<div></div>");
    $.getJSON('/getbundle?id='+id+'&url='+url,
        function(data) {
          formatter = formatResource(data);
          $("#json").html("<h3>Full Bundle</h3>"+syntaxHighlight(JSON.stringify(formatter, undefined, 2)));
          console.log(data);
          let div = "";
          if (data["resourceType"] === "Bundle") {
              div = "<div><h2>"+data["entry"][0]["resource"]["title"]+"</h2>";
              for (let i = 0; i < data["entry"].length; i++) {
                if (data["entry"][i]["resource"]["resourceType"] == "Patient") {
                  div += "<h3>Patient</h3>"+data["entry"][i]["resource"]["text"]["div"];
                }
                else if (data["entry"][i]["resource"]["resourceType"] == "Organization") {
                  div += "<h3>Payer</h3>"+data["entry"][i]["resource"]["text"]["div"];
                }
                else if (data["entry"][i]["resource"]["resourceType"] == "CarePlan") {
                  div += "<h3>Care Plan</h3>"+data["entry"][i]["resource"]["text"]["div"];
                }
              }
              div += "</div>";
              $("#display").html(div);
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
