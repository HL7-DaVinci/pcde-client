$(function() {
  $('#gp').bind('click', function() {
    given = $("#given").val();
    family = $("#family").val();
    bdate = $("#bdate").val();
    sid = $("#sid").val();
    mid = $("#mid").val();
    $("#display").html("<div></div>");
    url = $("#url").val().replace(/\//g, '%2F');
    $.getJSON('/member-match?given='+given+'&family='+family+'&birthdate='+bdate+'&sid='+sid+'&mid'+mid+'&url='+url,
        function(data) {
          console.log(data)
          formatter = formatResource(data);
          formatter = "<div class='card'>" + formatter + "</div>";
          $("#display").html(formatter);
    });
    return false;
  });
  $('#ex').bind('click', function() {
    given = $("#given").val();
    family = $("#family").val();
    bdate = $("#bdate").val();
    sid = $("#sid").val();
    mid = $("#mid").val();
    $("#display").html("<div></div>");
    url = $("#url").val().replace(/\//g, '%2F');
    $.getJSON('/sample-mm?given='+given+'&family='+family+'&birthdate='+bdate+'&sid='+sid+'&mid'+mid+'&url='+url,
        function(data) {
          console.log(data)
          formatter = formatSample(data);
          formatter = "<div class='card'>" + formatter + "</div>";
          $("#display").html(formatter);
    });
    return false;
  });
});
// function reverseObject(obj) {
//     let newObj = {}
//     for (let item in obj) {
//
//     }
// }
function formatSample(data) {
  // return "<h3>Full Response</h3><span style=\"white-space: pre-wrap\">"+(JSON.stringify(data, undefined, 4))+"</span>";
  return "<h3>Full Response</h3><span style=\"white-space: pre-wrap\">"+syntaxHighlight((JSON.stringify(data, undefined, 4)))+"</span>";
}
function formatResource(data) {
    let formatter = "<h3>An error occured</h3>";
    if (data["StatusCode"]) {
        formatter = "<h3>An error occured received " + data["StatusCode"] + "</h3>";
    } else if (data["resourceType"] == "OperationOutcome") {
        formatter = {
            "resourceType": data["resourceType"],
            "issue": data["issue"],
            "text": data["text"]
        }
        formatter = syntaxHighlight(JSON.stringify(formatter, undefined, 2))
    } else if (data["resourceType"] == "Parameters"){
        formatter = "<h3>Successfully Found Patient Match</h3>";
        let patient = data["parameter"][1]["resource"]
        formatter += "<table style='width:100%'>";
        formatter += "<tr><td>Name: </td><td>"+patient["name"][0]["given"] + " "+ patient["name"][0]["family"]+"</td></tr>";
        if (patient["birthDate"] != "")
            formatter += "<tr><td>Birth Date: </td><td>"+patient["birthDate"]+"</td></tr>";
        if (patient["address"])
            formatter += "<tr><td>Address: </td><td>"+patient["address"][0]["line"][0] + " "+ patient["address"][0]["city"]+ ", "+ patient["address"][0]["state"]+ ", "+ patient["address"][0]["postalCode"]+"</td></tr>";
        formatter += "<tr><td>UMB: </td><td>"+patient["identifier"][0]["value"]+"</td></tr>";
        formatter += "</table>";
        // formatter += "<h3>Full Coverage</h3><div>"+syntaxHighlight(JSON.stringify(data["parameter"][2], undefined, 2))+"</div>";
        formatter += "<h3>Full Response</h3><span style=\"white-space: pre-wrap\">"+syntaxHighlight((JSON.stringify(data, undefined, 4)))+"</span>";
    }
    return formatter;
}
function syntaxHighlight(json) {
    console.log("HIGHLIGHTING")
    console.log(json)
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
