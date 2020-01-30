var status = false;
var history_array = [];
var history_scroll = 0;
const request = (method, url, par, setting, callback) => {
    var http = new XMLHttpRequest();
    http.open(method, url, true);
    if (typeof(setting) === "function")
      setting(http);
    http.onreadystatechange = function() {
      callback(http);
    };
    http.send(par);
}
function change_status(t) {
  status = t;
  const server_status = document.getElementsByClassName("server_status");
  for (var i = 0; i < server_status.length; i++)
    server_status[i].innerHTML = (status == "false" ? "OFF" : "ON");
}
function check() {
  request("GET", "/status", undefined, undefined, (http) => {
    if (http.readyState == 4 && http.status == 200) {
      var t = http.responseText == "true";
      if (status == "false" && t) {
        on();
      }
      change_status(t);
    }
  })
}
function add_output(out) {
  var cons = document.getElementById("console");
  var copy = document.getElementsByClassName("copy")[0].cloneNode(true);
  var t = "", i = 0;
  for (i = 0; i < out.length && out[i - 1] != "]"; i++)
    t += out[i];
  copy.getElementsByClassName("time")[0].innerHTML = t;
  t = "";
  for (; i < out.length; i++)
    t += out[i];
  copy.getElementsByClassName("text")[0].innerHTML = " " + t + "<br>";
  copy.style.display = "block";
  cons.appendChild(copy);
  cons.scrollTop = cons.scrollHeight;
}
function off() {
  request("GET", "/stop", undefined, undefined, (http) => {
    if (http.readyState == 4 && http.status == 200) {
      check();
    }
  });
}
function on() {
  if (status == "true") return;
  change_status(true);
  onEvent = new EventSource("/msg");
  onEvent.onmessage = function(e) {
      const con = document.getElementById("console");
      add_output(e.data);
      if (e.data === "CLOSED") {
        onEvent.close();
        check();
      }
  };      
  onEvent.onerror = function(e) {
      console.log("EventSource failed.");
      check();
  };
}
function setting_view() {
  const console_block = document.getElementsByClassName("console_block");
  const setting_block = document.getElementsByClassName("setting_block");
  for (var i = 0; i < console_block.length; i++)
    console_block[i].style.display = "none";
  for (var i = 0; i < setting_block.length; i++)
    setting_block[i].style.display = "block";
}
function console_view() {
  const console_block = document.getElementsByClassName("console_block");
  const setting_block = document.getElementsByClassName("setting_block");
  for (var i = 0; i < console_block.length; i++)
    console_block[i].style.display = "block";
  for (var i = 0; i < setting_block.length; i++)
    setting_block[i].style.display = "none";
}
document.addEventListener("keyup", (event) => {
  if (event.keyCode === 191) // Key: /
    command.focus();
})
document.getElementById("command").addEventListener("keyup", (event) => {
  var command = document.getElementById("command");
  switch (event.keyCode) {
    case 13: // Enter
      const value = command.value;
      if (value == "")
        return;
      if (value.replace(/ */, "") === "start")
        on();
      else {
        request("POST", "/command", `command=${value}`, (http) => {
          http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }, (http) => {});
      }
      history_array.push(value);
      history_scroll = history_array.length;
      command.value = "";
      break;

    case 38: // Up
      event.preventDefault();
      if (history_array.length > 0) {
        if (--history_scroll < 0)
          history_scroll = 0;
        command.value = history_array[history_scroll];
      }
      break;

    case 40: // Down
      event.preventDefault();
      if (history_array.length > 0) {
        if (++history_scroll > history_array.length)
          history_scroll = history_array.length;
        if (history_scroll === history_array.length)
          command.value = "";
        else
          command.value = history_array[history_scroll];
      }
      break;
  }
});
function load_plugins() {
  var plugins = document.getElementsByClassName("plugins");
  for (var i = plugins.length - 1; i > 0; i--)
    plugins[i].remove();
  request("GET", "/plugins", undefined, undefined, (http) => {
    if (http.readyState == 4 && http.status == 200) {
      const plugin_list = document.getElementById("plugin_list");
      const to_copy = plugin_list.getElementsByClassName("plugins")[0];
      var arr = JSON.parse(http.responseText);
      for (var i = 0; i < arr.length; i++) {
        var clone = to_copy.cloneNode(true);
        var name = arr[i];
        clone.style.display = "block";
        clone.getElementsByClassName("plugin_name")[0].innerHTML = name;
        clone.getElementsByTagName("button")[0].onclick = () => {
          request("POST", "/delete", `file=${name}`, (http) => {
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
          }, (http) => {
            if (http.readyState == 4 && http.status == 200) {
              load_plugins();
            }
          })
        };
        plugin_list.appendChild(clone);
      }
    }
  })
}
function load_properties() {
  request("GET", "/properties", undefined, (http) => {
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  }, (http) => {
    document.getElementById("properties").value = http.responseText;
  })
}
function save() {
  request("POST", "/properties", `value=${document.getElementById("properties").value}`, (http) => {
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  }, (http) => {
  })
}
load_plugins();
load_properties();
check();
if (location.hash === "#setting") {
  setting_view();  
}