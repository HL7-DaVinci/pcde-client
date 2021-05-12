$(function() {
  $('#send-task').bind('click', function() {
    umb = $("#umb").val();
    if (umb === "") {
        $("#display").html("<div class='card'>Patient Id must be filled out</div>");
        return false;
    }
    id = $("#task-id").val();
    $("#display").html("<div></div>");
    url = $("#url").val().replace(/\//g, '%2F');

    //token = $("#token").val();
    token_url = $("#turl").val().replace(/\//g, '%2F');
    cid = $("#cid").val();
    cs = $("#cs").val();
    console.log(id);
    $.getJSON('/send-task?umb='+umb+'&id='+id+'&url='+url+'&token_url='+token_url+'&cid='+cid+'&cs='+cs,
        function(data) {
          formatter = formatResource(data);
          formatter = "<div class='card'>" + formatter + "</div>";
          $("#display").html(formatter);
    });
    return false;
  });
  $('#poll-task').bind('click', function() {
    id = $("#task-id").val();
    if (id === "") {
        $("#display").html("<div class='card'>Task Id must be filled out</div>");
        return false;
    }
    $("#display").html("<div></div>");
    url = $("#url").val().replace(/\//g, '%2F');
    $.getJSON('/get-task?id='+id+'&url='+url,
        function(data) {
          formatter = formatResource(data);
          formatter = "<div class='card'>" + formatter + "</div>";
          $("#display").html(formatter);
    });
    return false;
  });
  $('#check-task').bind('click', function() {
    id = $("#umb").val();
    if (id === "") {
        $("#display").html("<div class='card'>Patient Id must be filled out</div>");
        return false;
    }
    $("#display").html("<div></div>");
    url = $("#url").val().replace(/\//g, '%2F');
    $.getJSON('/task-for/'+id,
        function(data) {
          formatter = formatResource(data);
          formatter = "<div class='card'>" + formatter + "</div>";
          $("#display").html(formatter);
    });
    return false;
  });
  $('#subscribe').bind('click', function() {
    id = $("#task-id").val();
    $("#display").html("<div></div>");
    url = $("#url").val().replace(/\//g, '%2F');
    $.getJSON('/subscribe?id='+id+'&url='+url,
        function(data) {
          formatter = formatResource(data);
          formatter = "<div class='card'>" + formatter + "</div>";
          $("#display").html(formatter);
    }) ;
    return false;
  });
});

function formatSample(data) {
  return "<h3>Full Response</h3><span style=\"white-space: pre-wrap\">"+syntaxHighlight((JSON.stringify(data, undefined, 4)))+"</span>";
}
function formatResource(data) {
    try {
      let formatter = "<h3>An error occured</h3>";
      if (data["resourceType"] == "Task") {
          formatter = "<h3>Resource: " + data["resourceType"] + "</h3>"
          formatter += "<h3>Current Task Status: " + data["status"] + "</h3>"
          formatter += "<h3>Task Id: " + data["id"] + "</h3>"
          formatter += "<h3>Patient Id: " + data["for"]["identifier"]["value"] + "</h3>"
          if (data["status"] === "completed"){
              formatter += "<h3>Bundle Location: " + data["output"][0]["valueReference"]["reference"] + "</h3>"
          }
          formatter += formatSample(data)
      } else if (data["resourceType"] == "Subscription"){
          formatter = formatSample(data);
          return formatter;
      } else if (data["StatusCode"]) {
          formatter = "<h3>An error occured received " + data["StatusCode"] + "</h3>";
          formatter += formatSample(data);
      }
      return formatter;
    } catch (err) {
      return formatSample(data);
    }
}
function syntaxHighlight(json) {
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
