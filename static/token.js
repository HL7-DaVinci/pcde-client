$(function() {
  console.log("LOADING")
  $('#gt').bind('click', function() {
    aurl = $("#aurl").val().replace(/\//g, '%2F');
    turl = $("#turl").val().replace(/\//g, '%2F');
    curi = $("#curi").val().replace(/\//g, '%2F');
    cid = $("#cid").val();
    console.log("BINDING")
    $("#display").html("<div></div>");
    $.getJSON('/getToken?authorize_url='+aurl+'&token_url='+turl+'&callback_uri='+curi+'&client_id='+cid,
        function(data) {
          console.log(data)
          formatter = formatResource(data);
          formatter = "<div class='card'>" + formatter + "</div>";
          $("#display").html(formatter);
          //openInNewTab(data["auth_url"]);
    });
    return false;
  });
});
function formatResource(data) {
    return "<div>Go to the following URL and sign in. You should be redirected and find the token in the subsequent URL. <a href=" + data["auth_url"]+ ">Redirect URL</a> </div>";
}
