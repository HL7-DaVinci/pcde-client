$(function() {
  $('#gp').bind('click', function() {
    server = $("#server").val();
    $.getJSON('/update_server?server='+server,
        function(data) {
          console.log(data)
    });
    return false;
  });
});
