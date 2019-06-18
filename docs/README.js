$().ready(function() {
   var access_token_url = document.getElementById("access-token-url"),
       discovery_url = document.getElementById("api-discovery-config-url"),
       discovery_config = document.getElementById("api-discovery-config");
   fetch(l.href)
     .then(res => res.json())
     .then((data) => {discovery_config.innerHTML = data; access_token_url.innerHTML = data.urls.accessToken})
     .catch(err => { throw err });
});
